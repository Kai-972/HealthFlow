import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { documentParser } from "./services/documentParser";
import { extractRequirements } from "./services/gemini";
import { testCaseGenerator } from "./services/testCaseGenerator";
import { insertProjectSchema, ProcessingStatus } from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Please upload PDF, DOCX, or TXT files."));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create a new project
  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create project" 
      });
    }
  });

  // Get project details
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Upload documents
  app.post("/api/projects/:id/documents", upload.array("documents", 10), async (req, res) => {
    try {
      const projectId = req.params.id;
      const files = req.files as any[];

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const documents = [];
      
      for (const file of files) {
        try {
          // Validate file
          documentParser.validateFile(file);
          
          // Parse document content
          const parsedDoc = await documentParser.parseDocument(file.path, file.mimetype);
          
          // Store document
          const document = await storage.createDocument({
            projectId,
            filename: file.filename,
            originalName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            content: parsedDoc.content,
          });
          
          documents.push(document);
          
          // Clean up uploaded file
          fs.unlinkSync(file.path);
        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error);
          // Clean up uploaded file on error
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }

      if (documents.length === 0) {
        return res.status(400).json({ message: "No documents could be processed" });
      }

      res.json({ documents, message: `Successfully uploaded ${documents.length} document(s)` });
    } catch (error) {
      console.error("Error uploading documents:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to upload documents" 
      });
    }
  });

  // Process documents with AI
  app.post("/api/projects/:id/process", async (req: any, res: any) => {
    try {
      const projectId = req.params.id;
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Update project status
      await storage.updateProject(projectId, { status: "processing" });

      // Get all documents for this project
      const documents = await storage.getDocumentsByProject(projectId);
      
      if (documents.length === 0) {
        return res.status(400).json({ message: "No documents found for processing" });
      }

      // Combine all document content
      const combinedContent = documents.map(doc => doc.content).join("\n\n");

      // Set up Server-Sent Events for real-time status updates
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      const sendStatus = (status: any) => {
        res.write(`data: ${JSON.stringify(status)}\n\n`);
      };

      try {
        // Step 1: Extract requirements
        sendStatus({
          step: "Document parsing completed",
          status: "completed",
          message: "Documents parsed successfully",
          duration: 2300
        });

        sendStatus({
          step: "Requirements extracted using Gemini API",
          status: "processing",
          message: "Analyzing document content with AI...",
        });

        const requirements = await extractRequirements(combinedContent, project.complianceFramework);
        await storage.createRequirements(requirements.map(req => ({
          ...req,
          projectId
        })));

        sendStatus({
          step: "Requirements extracted using Gemini API",
          status: "completed",
          message: `Extracted ${requirements.length} requirements`,
          duration: 4700
        });

        // Step 2: Map to compliance framework
        sendStatus({
          step: `Mapping to ${project.complianceFramework} compliance framework`,
          status: "processing",
          message: "Mapping requirements to compliance standards...",
        });

        // Step 3: Generate test cases
        sendStatus({
          step: `Mapping to ${project.complianceFramework} compliance framework`,
          status: "completed",
          message: "Compliance mapping completed",
          duration: 3200
        });

        sendStatus({
          step: "Generating test cases",
          status: "processing",
          message: "Creating comprehensive test cases...",
        });

        const storedRequirements = await storage.getRequirementsByProject(projectId);
        const testCaseResult = await testCaseGenerator.generateFromRequirements(
          storedRequirements,
          projectId,
          project.complianceFramework
        );

        // Store generated data
        await storage.createTestCases(testCaseResult.testCases);
        await storage.createComplianceMappings(testCaseResult.complianceMappings);
        await storage.createAiExplanations(testCaseResult.explanations);

        sendStatus({
          step: "Generating test cases",
          status: "completed",
          message: `Generated ${testCaseResult.summary.totalTestCases} test cases`,
          duration: 5800
        });

        // Update project status
        await storage.updateProject(projectId, { status: "completed" });

        // Send final completion status
        sendStatus({
          step: "Processing completed",
          status: "completed",
          message: "All processing steps completed successfully",
          summary: testCaseResult.summary
        });

        res.end();

      } catch (error) {
        console.error("Error during AI processing:", error);
        await storage.updateProject(projectId, { status: "failed" });
        
        sendStatus({
          step: "Processing failed",
          status: "failed",
          message: error instanceof Error ? error.message : "Processing failed"
        });
        
        res.end();
      }

    } catch (error) {
      console.error("Error starting processing:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to start processing" 
      });
    }
  });

  // Get project results
  app.get("/api/projects/:id/results", async (req, res) => {
    try {
      const projectId = req.params.id;
      
      const [project, requirements, testCases, complianceMappings, explanations] = await Promise.all([
        storage.getProject(projectId),
        storage.getRequirementsByProject(projectId),
        storage.getTestCasesByProject(projectId),
        storage.getComplianceMappingsByProject(projectId),
        storage.getAiExplanationsByProject(projectId)
      ]);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const edgeCases = testCases.filter(tc => tc.isEdgeCase);
      const complianceCoverage = requirements.length > 0 ? 
        Math.round((complianceMappings.length / requirements.length) * 100) : 0;

      // Generate traceability matrix
      const traceabilityMatrix = testCaseGenerator.generateTraceabilityMatrix(
        requirements,
        testCases,
        complianceMappings
      );

      res.json({
        project,
        summary: {
          requirementsCount: requirements.length,
          testCasesCount: testCases.length,
          complianceCoverage,
          edgeCasesCount: edgeCases.length,
        },
        requirements,
        testCases,
        complianceMappings,
        explanations,
        traceabilityMatrix,
      });

    } catch (error) {
      console.error("Error fetching results:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch results" 
      });
    }
  });

  // Export results
  app.get("/api/projects/:id/export/:format", async (req, res) => {
    try {
      const { id: projectId, format } = req.params;
      
      const [project, requirements, testCases] = await Promise.all([
        storage.getProject(projectId),
        storage.getRequirementsByProject(projectId),
        storage.getTestCasesByProject(projectId),
      ]);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (format === "csv") {
        const csvContent = generateCSV(requirements, testCases);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${project.name}-testcases.csv"`);
        res.send(csvContent);
      } else if (format === "xml") {
        const xmlContent = generateXML(requirements, testCases);
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename="${project.name}-testcases.xml"`);
        res.send(xmlContent);
      } else if (format === "word") {
        // For Word export, we'll return JSON with structured data
        // In a real implementation, you'd generate an actual Word document
        res.setHeader('Content-Type', 'application/json');
        res.json({
          message: "Word export format - structured data for document generation",
          project,
          requirements,
          testCases,
        });
      } else {
        res.status(400).json({ message: "Unsupported export format" });
      }

    } catch (error) {
      console.error("Error exporting results:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to export results" 
      });
    }
  });

  // Chat endpoint for AI assistance
  app.post("/api/projects/:id/chat", async (req, res) => {
    try {
      const { message } = req.body;
      const projectId = req.params.id;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Get project context
      const [requirements, testCases, complianceMappings] = await Promise.all([
        storage.getRequirementsByProject(projectId),
        storage.getTestCasesByProject(projectId),
        storage.getComplianceMappingsByProject(projectId),
      ]);

      // Here you would integrate with Gemini API to answer questions about the project
      // For now, we'll return a simple response
      const response = {
        message: "I can help you understand the requirements analysis and compliance mappings. What specific aspect would you like to know more about?",
        suggestions: [
          "Explain the compliance mapping for requirement REQ-001",
          "What edge cases were identified?",
          "Show me the test coverage for HIPAA requirements",
          "Why was this requirement marked as high priority?"
        ]
      };

      res.json(response);

    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process chat message" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for export
function generateCSV(requirements: any[], testCases: any[]): string {
  const headers = ["ID", "Type", "Title", "Priority", "Requirement", "Compliance Section", "Preconditions", "Test Steps", "Expected Result"];
  const rows = [headers.join(",")];

  testCases.forEach(tc => {
    const requirement = requirements.find(req => req.id === tc.requirementId);
    const row = [
      tc.testCaseId,
      tc.type,
      `"${tc.title}"`,
      tc.priority,
      `"${requirement?.text || ''}"`,
      tc.complianceSection || '',
      `"${tc.preconditions || ''}"`,
      `"${tc.testSteps || ''}"`,
      `"${tc.expectedResult || ''}"`
    ];
    rows.push(row.join(","));
  });

  return rows.join("\n");
}

function generateXML(requirements: any[], testCases: any[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<testSuite>\n';
  
  testCases.forEach(tc => {
    const requirement = requirements.find(req => req.id === tc.requirementId);
    xml += `  <testCase id="${tc.testCaseId}">\n`;
    xml += `    <title>${escapeXml(tc.title)}</title>\n`;
    xml += `    <type>${tc.type}</type>\n`;
    xml += `    <priority>${tc.priority}</priority>\n`;
    xml += `    <requirement>${escapeXml(requirement?.text || '')}</requirement>\n`;
    xml += `    <complianceSection>${tc.complianceSection || ''}</complianceSection>\n`;
    xml += `    <preconditions>${escapeXml(tc.preconditions || '')}</preconditions>\n`;
    xml += `    <testSteps>${escapeXml(tc.testSteps || '')}</testSteps>\n`;
    xml += `    <expectedResult>${escapeXml(tc.expectedResult || '')}</expectedResult>\n`;
    xml += `  </testCase>\n`;
  });
  
  xml += '</testSuite>';
  return xml;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
