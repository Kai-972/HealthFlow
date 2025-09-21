import { 
  Project, 
  InsertProject,
  Document,
  InsertDocument,
  Requirement,
  InsertRequirement,
  TestCase,
  InsertTestCase,
  ComplianceMapping,
  InsertComplianceMapping,
  AiExplanation,
  InsertAiExplanation
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Projects
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: string): Promise<Project | undefined>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined>;
  
  // Documents
  createDocument(document: InsertDocument): Promise<Document>;
  getDocumentsByProject(projectId: string): Promise<Document[]>;
  
  // Requirements
  createRequirement(requirement: InsertRequirement): Promise<Requirement>;
  createRequirements(requirements: InsertRequirement[]): Promise<Requirement[]>;
  getRequirementsByProject(projectId: string): Promise<Requirement[]>;
  
  // Test Cases
  createTestCase(testCase: InsertTestCase): Promise<TestCase>;
  createTestCases(testCases: InsertTestCase[]): Promise<TestCase[]>;
  getTestCasesByProject(projectId: string): Promise<TestCase[]>;
  getTestCasesByRequirement(requirementId: string): Promise<TestCase[]>;
  
  // Compliance Mappings
  createComplianceMapping(mapping: InsertComplianceMapping): Promise<ComplianceMapping>;
  createComplianceMappings(mappings: InsertComplianceMapping[]): Promise<ComplianceMapping[]>;
  getComplianceMappingsByProject(projectId: string): Promise<ComplianceMapping[]>;
  
  // AI Explanations
  createAiExplanation(explanation: InsertAiExplanation): Promise<AiExplanation>;
  createAiExplanations(explanations: InsertAiExplanation[]): Promise<AiExplanation[]>;
  getAiExplanationsByProject(projectId: string): Promise<AiExplanation[]>;
}

export class MemStorage implements IStorage {
  private projects: Map<string, Project> = new Map();
  private documents: Map<string, Document> = new Map();
  private requirements: Map<string, Requirement> = new Map();
  private testCases: Map<string, TestCase> = new Map();
  private complianceMappings: Map<string, ComplianceMapping> = new Map();
  private aiExplanations: Map<string, AiExplanation> = new Map();

  // Projects
  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      ...insertProject,
      id,
      createdAt: new Date(),
      description: insertProject.description || null,
      status: insertProject.status || "processing",
    };
    this.projects.set(id, project);
    return project;
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...updates };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  // Documents
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      ...insertDocument,
      id,
      uploadedAt: new Date(),
      content: insertDocument.content || null,
    };
    this.documents.set(id, document);
    return document;
  }

  async getDocumentsByProject(projectId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.projectId === projectId);
  }

  // Requirements
  async createRequirement(insertRequirement: InsertRequirement): Promise<Requirement> {
    const id = randomUUID();
    const requirement: Requirement = {
      ...insertRequirement,
      id,
      extractedAt: new Date(),
      complianceSection: insertRequirement.complianceSection || null,
      confidence: insertRequirement.confidence || null,
    };
    this.requirements.set(id, requirement);
    return requirement;
  }

  async createRequirements(insertRequirements: InsertRequirement[]): Promise<Requirement[]> {
    const requirements: Requirement[] = [];
    for (const insertReq of insertRequirements) {
      const requirement = await this.createRequirement(insertReq);
      requirements.push(requirement);
    }
    return requirements;
  }

  async getRequirementsByProject(projectId: string): Promise<Requirement[]> {
    return Array.from(this.requirements.values()).filter(req => req.projectId === projectId);
  }

  // Test Cases
  async createTestCase(insertTestCase: InsertTestCase): Promise<TestCase> {
    const id = randomUUID();
    const testCase: TestCase = {
      ...insertTestCase,
      id,
      generatedAt: new Date(),
      complianceSection: insertTestCase.complianceSection || null,
      preconditions: insertTestCase.preconditions || null,
      testSteps: insertTestCase.testSteps || null,
      expectedResult: insertTestCase.expectedResult || null,
      isEdgeCase: insertTestCase.isEdgeCase || null,
    };
    this.testCases.set(id, testCase);
    return testCase;
  }

  async createTestCases(insertTestCases: InsertTestCase[]): Promise<TestCase[]> {
    const testCases: TestCase[] = [];
    for (const insertTc of insertTestCases) {
      const testCase = await this.createTestCase(insertTc);
      testCases.push(testCase);
    }
    return testCases;
  }

  async getTestCasesByProject(projectId: string): Promise<TestCase[]> {
    return Array.from(this.testCases.values()).filter(tc => tc.projectId === projectId);
  }

  async getTestCasesByRequirement(requirementId: string): Promise<TestCase[]> {
    return Array.from(this.testCases.values()).filter(tc => tc.requirementId === requirementId);
  }

  // Compliance Mappings
  async createComplianceMapping(insertMapping: InsertComplianceMapping): Promise<ComplianceMapping> {
    const id = randomUUID();
    const mapping: ComplianceMapping = {
      ...insertMapping,
      id,
      reasoning: insertMapping.reasoning || null,
    };
    this.complianceMappings.set(id, mapping);
    return mapping;
  }

  async createComplianceMappings(insertMappings: InsertComplianceMapping[]): Promise<ComplianceMapping[]> {
    const mappings: ComplianceMapping[] = [];
    for (const insertMapping of insertMappings) {
      const mapping = await this.createComplianceMapping(insertMapping);
      mappings.push(mapping);
    }
    return mappings;
  }

  async getComplianceMappingsByProject(projectId: string): Promise<ComplianceMapping[]> {
    return Array.from(this.complianceMappings.values()).filter(cm => cm.projectId === projectId);
  }

  // AI Explanations
  async createAiExplanation(insertExplanation: InsertAiExplanation): Promise<AiExplanation> {
    const id = randomUUID();
    const explanation: AiExplanation = {
      ...insertExplanation,
      id,
      createdAt: new Date(),
      processingTime: insertExplanation.processingTime || null,
    };
    this.aiExplanations.set(id, explanation);
    return explanation;
  }

  async createAiExplanations(insertExplanations: InsertAiExplanation[]): Promise<AiExplanation[]> {
    const explanations: AiExplanation[] = [];
    for (const insertExp of insertExplanations) {
      const explanation = await this.createAiExplanation(insertExp);
      explanations.push(explanation);
    }
    return explanations;
  }

  async getAiExplanationsByProject(projectId: string): Promise<AiExplanation[]> {
    return Array.from(this.aiExplanations.values()).filter(exp => exp.projectId === projectId);
  }
}

export const storage = new MemStorage();
