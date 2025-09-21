import { 
  Requirement, 
  TestCase, 
  ComplianceMapping, 
  AiExplanation,
  InsertTestCase,
  InsertComplianceMapping,
  InsertAiExplanation 
} from "@shared/schema";
import { analyzeRequirements, generateTestCases, mapCompliance } from "./gemini";

export interface TestCaseGenerationResult {
  testCases: InsertTestCase[];
  complianceMappings: InsertComplianceMapping[];
  explanations: InsertAiExplanation[];
  summary: {
    totalTestCases: number;
    edgeCases: number;
    complianceCoverage: number;
  };
}

export class TestCaseGenerator {
  async generateFromRequirements(
    requirements: Requirement[],
    projectId: string,
    framework: string
  ): Promise<TestCaseGenerationResult> {
    const testCases: InsertTestCase[] = [];
    const complianceMappings: InsertComplianceMapping[] = [];
    const explanations: InsertAiExplanation[] = [];

    for (const requirement of requirements) {
      try {
        // Generate test cases for this requirement
        const testCaseResult = await generateTestCases(requirement, framework);
        
        // Process each generated test case
        testCaseResult.testCases.forEach((tc: any, index: number) => {
          const testCaseId = `TC-${String(testCases.length + index + 1).padStart(3, '0')}`;
          
          testCases.push({
            projectId,
            requirementId: requirement.id,
            testCaseId,
            title: tc.title,
            type: tc.type,
            priority: tc.priority,
            preconditions: tc.preconditions,
            testSteps: tc.testSteps,
            expectedResult: tc.expectedResult,
            complianceSection: tc.complianceSection,
            isEdgeCase: tc.isEdgeCase || false,
          });

          // Add explanation for test case generation
          explanations.push({
            projectId,
            type: "test_generation",
            entityId: testCaseId,
            reasoning: tc.reasoning || `Generated test case for requirement: ${requirement.text}`,
            confidence: tc.confidence || 85,
            modelUsed: "gemini-2.5-pro",
            processingTime: testCaseResult.processingTime,
          });
        });

        // Generate compliance mappings
        if (testCaseResult.complianceMappings) {
          testCaseResult.complianceMappings.forEach((mapping: any) => {
            complianceMappings.push({
              projectId,
              requirementId: requirement.id,
              section: mapping.section,
              description: mapping.description,
              confidence: mapping.confidence,
              reasoning: mapping.reasoning,
              framework,
            });

            // Add explanation for compliance mapping
            explanations.push({
              projectId,
              type: "compliance_mapping",
              entityId: requirement.id,
              reasoning: mapping.reasoning || `Mapped requirement to ${mapping.section}`,
              confidence: mapping.confidence,
              modelUsed: "gemini-2.5-pro",
              processingTime: testCaseResult.processingTime,
            });
          });
        }

      } catch (error) {
        console.error(`Failed to generate test cases for requirement ${requirement.id}:`, error);
        
        // Add error explanation
        explanations.push({
          projectId,
          type: "test_generation",
          entityId: requirement.id,
          reasoning: `Failed to generate test cases: ${error instanceof Error ? error.message : 'Unknown error'}`,
          confidence: 0,
          modelUsed: "gemini-2.5-pro",
          processingTime: 0,
        });
      }
    }

    const edgeCases = testCases.filter(tc => tc.isEdgeCase).length;
    const complianceCoverage = Math.round((complianceMappings.length / requirements.length) * 100);

    return {
      testCases,
      complianceMappings,
      explanations,
      summary: {
        totalTestCases: testCases.length,
        edgeCases,
        complianceCoverage,
      },
    };
  }

  async validateTestCase(testCase: InsertTestCase): Promise<boolean> {
    // Basic validation rules
    if (!testCase.title || testCase.title.length < 10) {
      return false;
    }

    if (!testCase.expectedResult || testCase.expectedResult.length < 10) {
      return false;
    }

    if (!testCase.testSteps || testCase.testSteps.length < 10) {
      return false;
    }

    return true;
  }

  generateTraceabilityMatrix(
    requirements: Requirement[],
    testCases: TestCase[],
    complianceMappings: ComplianceMapping[]
  ) {
    return requirements.map(requirement => {
      const linkedTestCases = testCases.filter(tc => tc.requirementId === requirement.id);
      const linkedMappings = complianceMappings.filter(cm => cm.requirementId === requirement.id);
      
      const coverage = linkedTestCases.length > 0 ? 100 : 0;

      return {
        requirement,
        testCases: linkedTestCases,
        complianceMappings: linkedMappings,
        coverage,
        testCaseCount: linkedTestCases.length,
        edgeCaseCount: linkedTestCases.filter(tc => tc.isEdgeCase).length,
      };
    });
  }
}

export const testCaseGenerator = new TestCaseGenerator();
