import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileDown, Filter, Edit } from "lucide-react";
import TraceabilityMatrix from "./traceability-matrix";
import AiExplainability from "./ai-explainability";

interface ResultsDashboardProps {
  projectId: string;
}

export default function ResultsDashboard({ projectId }: ResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState("requirements");

  const { data: results, isLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "results"],
    enabled: !!projectId,
  });

  const handleExport = async (format: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/export/${format.toLowerCase()}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `testcases.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8" data-testid="results-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center p-8" data-testid="results-error">
        <p className="text-muted-foreground">No results available</p>
      </div>
    );
  }

  const { summary, requirements, testCases, complianceMappings, explanations } = results;

  return (
    <div data-testid="results-dashboard">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card data-testid="summary-requirements">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground" data-testid="count-requirements">
                  {summary.requirementsCount}
                </div>
                <div className="text-sm text-muted-foreground">Requirements</div>
              </div>
              <div className="text-primary text-xl">📋</div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="summary-testcases">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground" data-testid="count-testcases">
                  {summary.testCasesCount}
                </div>
                <div className="text-sm text-muted-foreground">Test Cases</div>
              </div>
              <div className="text-emerald-500 text-xl">🧪</div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="summary-coverage">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground" data-testid="count-coverage">
                  {summary.complianceCoverage}%
                </div>
                <div className="text-sm text-muted-foreground">Compliance Coverage</div>
              </div>
              <div className="text-emerald-500 text-xl">🛡️</div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="summary-edgecases">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground" data-testid="count-edgecases">
                  {summary.edgeCasesCount}
                </div>
                <div className="text-sm text-muted-foreground">Edge Cases</div>
              </div>
              <div className="text-amber-500 text-xl">⚠️</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="results-tabs">
          <div className="border-b border-border p-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="requirements" data-testid="tab-requirements">Requirements</TabsTrigger>
              <TabsTrigger value="testcases" data-testid="tab-testcases">Test Cases</TabsTrigger>
              <TabsTrigger value="traceability" data-testid="tab-traceability">Traceability Matrix</TabsTrigger>
              <TabsTrigger value="explainability" data-testid="tab-explainability">AI Explainability</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="requirements" className="p-6" data-testid="requirements-content">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Extracted Requirements</h3>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700" data-testid="compliance-badge">
                  {results.project.complianceFramework} Compliant
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              {requirements.map((requirement: any, index: number) => (
                <Card 
                  key={requirement.id} 
                  className="hover:bg-accent transition-colors"
                  data-testid={`requirement-${index}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" data-testid={`requirement-id-${index}`}>
                          {requirement.requirementId}
                        </Badge>
                        <Badge 
                          className={`${requirement.type === 'Security' ? 'bg-emerald-100 text-emerald-700' : 
                                      requirement.type === 'Data Privacy' ? 'bg-blue-100 text-blue-700' : 
                                      'bg-purple-100 text-purple-700'}`}
                          data-testid={`requirement-type-${index}`}
                        >
                          {requirement.type}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid={`requirement-priority-${index}`}>
                        Priority: {requirement.priority}
                      </div>
                    </div>
                    <p className="text-foreground mb-2" data-testid={`requirement-text-${index}`}>
                      {requirement.text}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4 text-muted-foreground">
                        <span data-testid={`requirement-compliance-${index}`}>
                          {requirement.complianceSection}
                        </span>
                        <span>•</span>
                        <span data-testid={`requirement-testcases-${index}`}>
                          {testCases.filter((tc: any) => tc.requirementId === requirement.id).length} linked test cases
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" data-testid={`button-view-details-${index}`}>
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="testcases" className="p-6" data-testid="testcases-content">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Generated Test Cases</h3>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" data-testid="button-filter">
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                </Button>
                <Button variant="outline" size="sm" data-testid="button-export-all">
                  <FileDown className="h-4 w-4 mr-1" />
                  Export All
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {testCases.map((testCase: any, index: number) => (
                <Card key={testCase.id} data-testid={`testcase-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          className={`${testCase.isEdgeCase ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}
                          data-testid={`testcase-id-${index}`}
                        >
                          {testCase.testCaseId}
                        </Badge>
                        <Badge variant="outline" data-testid={`testcase-type-${index}`}>
                          {testCase.type}
                        </Badge>
                        <Badge variant="secondary" data-testid={`testcase-compliance-${index}`}>
                          {results.project.complianceFramework}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid={`testcase-link-${index}`}>
                        Linked to {requirements.find((req: any) => req.id === testCase.requirementId)?.requirementId}
                      </div>
                    </div>
                    <h4 className="font-medium mb-2" data-testid={`testcase-title-${index}`}>
                      {testCase.title}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-muted-foreground mb-1">Preconditions</div>
                        <p data-testid={`testcase-preconditions-${index}`}>
                          {testCase.preconditions}
                        </p>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground mb-1">Test Steps</div>
                        <p data-testid={`testcase-steps-${index}`}>
                          {testCase.testSteps}
                        </p>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground mb-1">Expected Result</div>
                        <p data-testid={`testcase-result-${index}`}>
                          {testCase.expectedResult}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span data-testid={`testcase-compliance-section-${index}`}>
                          Compliance: {testCase.complianceSection}
                        </span>
                        <span>Priority: {testCase.priority}</span>
                        <span>Type: {testCase.type}</span>
                      </div>
                      <Button variant="ghost" size="sm" data-testid={`button-edit-testcase-${index}`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Test Case
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="traceability" className="p-6" data-testid="traceability-content">
            <TraceabilityMatrix 
              requirements={requirements}
              testCases={testCases}
              complianceMappings={complianceMappings}
            />
          </TabsContent>

          <TabsContent value="explainability" className="p-6" data-testid="explainability-content">
            <AiExplainability 
              explanations={explanations}
              requirements={requirements}
              testCases={testCases}
            />
          </TabsContent>
        </Tabs>

        {/* Export Actions */}
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground" data-testid="export-summary">
              Generated <span className="font-medium">{summary.testCasesCount} test cases</span> from{" "}
              <span className="font-medium">{summary.requirementsCount} requirements</span> •{" "}
              <span className="font-medium">{summary.complianceCoverage}% compliance coverage</span>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport("CSV")}
                data-testid="button-export-csv"
              >
                <FileDown className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport("XML")}
                data-testid="button-export-xml"
              >
                <FileDown className="h-4 w-4 mr-1" />
                Export XML
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport("Word")}
                data-testid="button-export-word"
              >
                <FileDown className="h-4 w-4 mr-1" />
                Export Word
              </Button>
              <Button 
                onClick={() => handleExport("Jira")}
                data-testid="button-export-jira"
              >
                <FileDown className="h-4 w-4 mr-1" />
                Push to Jira
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
