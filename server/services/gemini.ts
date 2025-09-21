import { GoogleGenAI } from "@google/genai";
import { Requirement, InsertRequirement } from "@shared/schema";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "" 
});

export interface ExtractedRequirement {
  requirementId: string;
  text: string;
  type: string;
  priority: string;
  complianceSection?: string;
  confidence: number;
}

export interface GeneratedTestCase {
  title: string;
  type: string;
  priority: string;
  preconditions: string;
  testSteps: string;
  expectedResult: string;
  complianceSection?: string;
  isEdgeCase?: boolean;
  reasoning?: string;
  confidence?: number;
}

export interface ComplianceMappingResult {
  section: string;
  description: string;
  confidence: number;
  reasoning: string;
}

export interface TestCaseGenerationResult {
  testCases: GeneratedTestCase[];
  complianceMappings?: ComplianceMappingResult[];
  processingTime: number;
}

export async function extractRequirements(
  documentContent: string,
  complianceFramework: string
): Promise<InsertRequirement[]> {
  const startTime = Date.now();

  try {
    const systemPrompt = `You are an expert healthcare compliance analyst specializing in ${complianceFramework} regulations. 
Your task is to extract requirements from healthcare documents and classify them according to compliance standards.

Extract requirements that contain:
- Action verbs like "must", "shall", "should", "required", "needs to"
- Specific functional or non-functional requirements
- Security, privacy, or audit requirements
- Performance or operational requirements

For each requirement, provide:
- A unique requirement ID (REQ-001, REQ-002, etc.)
- The exact text of the requirement
- Type classification (Security, Data Privacy, Audit, Performance, Functional, etc.)
- Priority level (High, Medium, Low)
- Relevant compliance section if identifiable
- Confidence score (0-100)

Respond with a JSON array of requirements.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              requirementId: { type: "string" },
              text: { type: "string" },
              type: { type: "string" },
              priority: { type: "string" },
              complianceSection: { type: "string" },
              confidence: { type: "number" }
            },
            required: ["requirementId", "text", "type", "priority", "confidence"]
          }
        }
      },
      contents: `Analyze this healthcare document and extract compliance requirements for ${complianceFramework}:\n\n${documentContent}`,
    });

    const processingTime = Date.now() - startTime;
    console.log(`Requirement extraction completed in ${processingTime}ms`);

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini API");
    }

    const extractedRequirements: ExtractedRequirement[] = JSON.parse(rawJson);
    
    // Convert to InsertRequirement format
    const requirements: InsertRequirement[] = extractedRequirements.map((req, index) => ({
      projectId: "", // Will be set by caller
      requirementId: req.requirementId || `REQ-${String(index + 1).padStart(3, '0')}`,
      text: req.text,
      type: req.type || 'Functional',
      priority: req.priority || 'Medium',
      complianceSection: req.complianceSection,
      confidence: Math.round(req.confidence || 85),
    }));

    return requirements;

  } catch (error) {
    console.error("Error extracting requirements:", error);
    throw new Error(`Failed to extract requirements: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateTestCases(
  requirement: Requirement,
  framework: string
): Promise<TestCaseGenerationResult> {
  const startTime = Date.now();

  try {
    const systemPrompt = `You are an expert test case designer specializing in healthcare compliance testing for ${framework}.

Your task is to generate comprehensive test cases for the given requirement that ensure compliance validation.

For each requirement, generate:
1. Primary functional test cases (happy path)
2. Negative test cases (error conditions)
3. Edge cases and boundary conditions
4. Security and compliance validation tests

Each test case should include:
- Descriptive title
- Type (Functional, Security, Edge Case, Performance, etc.)
- Priority (High, Medium, Low)
- Detailed preconditions
- Step-by-step test instructions
- Expected results
- Compliance section reference
- Whether it's an edge case (boolean)

Also provide compliance mappings that link the requirement to specific ${framework} sections.

Generate 2-5 test cases per requirement depending on complexity.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            testCases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  type: { type: "string" },
                  priority: { type: "string" },
                  preconditions: { type: "string" },
                  testSteps: { type: "string" },
                  expectedResult: { type: "string" },
                  complianceSection: { type: "string" },
                  isEdgeCase: { type: "boolean" },
                  reasoning: { type: "string" },
                  confidence: { type: "number" }
                },
                required: ["title", "type", "priority", "preconditions", "testSteps", "expectedResult"]
              }
            },
            complianceMappings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  section: { type: "string" },
                  description: { type: "string" },
                  confidence: { type: "number" },
                  reasoning: { type: "string" }
                },
                required: ["section", "description", "confidence", "reasoning"]
              }
            }
          },
          required: ["testCases"]
        }
      },
      contents: `Generate comprehensive test cases for this ${framework} requirement:

Requirement ID: ${requirement.requirementId}
Type: ${requirement.type}
Priority: ${requirement.priority}
Text: ${requirement.text}
Compliance Section: ${requirement.complianceSection || 'Not specified'}

Ensure test cases cover all aspects needed for ${framework} compliance validation.`,
    });

    const processingTime = Date.now() - startTime;
    console.log(`Test case generation completed in ${processingTime}ms for ${requirement.requirementId}`);

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini API");
    }

    const result = JSON.parse(rawJson);
    
    return {
      testCases: result.testCases || [],
      complianceMappings: result.complianceMappings || [],
      processingTime
    };

  } catch (error) {
    console.error(`Error generating test cases for ${requirement.requirementId}:`, error);
    throw new Error(`Failed to generate test cases: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function mapCompliance(
  requirements: Requirement[],
  framework: string
): Promise<ComplianceMappingResult[]> {
  try {
    const systemPrompt = `You are a ${framework} compliance expert. Map the given requirements to specific ${framework} regulation sections.

For each requirement, identify:
- The most relevant ${framework} section/clause
- A description of how the requirement relates to compliance
- Confidence level in the mapping (0-100)
- Reasoning for the mapping decision

Be specific about section numbers and clause references where possible.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              section: { type: "string" },
              description: { type: "string" },
              confidence: { type: "number" },
              reasoning: { type: "string" }
            },
            required: ["section", "description", "confidence", "reasoning"]
          }
        }
      },
      contents: `Map these requirements to ${framework} compliance sections:\n\n${JSON.stringify(requirements, null, 2)}`,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini API");
    }

    return JSON.parse(rawJson);

  } catch (error) {
    console.error("Error mapping compliance:", error);
    throw new Error(`Failed to map compliance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function analyzeRequirements(
  content: string,
  framework: string
): Promise<{
  summary: string;
  keyFindings: string[];
  riskAreas: string[];
  recommendations: string[];
}> {
  try {
    const systemPrompt = `You are a healthcare compliance analyst. Analyze the document content and provide insights about ${framework} compliance requirements.

Provide:
- A summary of the document's compliance scope
- Key findings related to ${framework}
- Potential risk areas that need attention
- Recommendations for compliance improvement`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            keyFindings: {
              type: "array",
              items: { type: "string" }
            },
            riskAreas: {
              type: "array",
              items: { type: "string" }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["summary", "keyFindings", "riskAreas", "recommendations"]
        }
      },
      contents: `Analyze this healthcare document for ${framework} compliance:\n\n${content}`,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini API");
    }

    return JSON.parse(rawJson);

  } catch (error) {
    console.error("Error analyzing requirements:", error);
    throw new Error(`Failed to analyze requirements: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function chatResponse(
  message: string,
  projectContext: {
    requirements: Requirement[];
    testCases: any[];
    complianceMappings: any[];
    framework: string;
  }
): Promise<{
  message: string;
  suggestions?: string[];
}> {
  try {
    const systemPrompt = `You are a helpful AI assistant specialized in healthcare compliance and test case analysis. 
You have access to a project's requirements, test cases, and compliance mappings for ${projectContext.framework}.

Answer questions about:
- Specific requirements and their compliance mappings
- Test case coverage and recommendations
- ${projectContext.framework} compliance details
- Risk analysis and recommendations

Be helpful, accurate, and provide specific references to requirement IDs and test case IDs when relevant.`;

    const contextData = `
Project Context:
- Framework: ${projectContext.framework}
- Requirements: ${projectContext.requirements.length} total
- Test Cases: ${projectContext.testCases.length} total
- Compliance Mappings: ${projectContext.complianceMappings.length} total

Requirements Summary:
${projectContext.requirements.slice(0, 5).map(req => 
  `${req.requirementId}: ${req.text.substring(0, 100)}...`
).join('\n')}

User Question: ${message}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contextData,
    });

    const responseText = response.text || "I apologize, but I'm having trouble processing your question right now. Please try rephrasing or ask about specific requirements or test cases.";

    return {
      message: responseText,
      suggestions: [
        "Explain the compliance mapping for a specific requirement",
        "What edge cases were identified?",
        `Show me the test coverage for ${projectContext.framework} requirements`,
        "Why was this requirement marked as high priority?"
      ]
    };

  } catch (error) {
    console.error("Error in chat response:", error);
    return {
      message: "I apologize, but I'm experiencing technical difficulties. Please try again later or contact support if the issue persists.",
      suggestions: []
    };
  }
}
