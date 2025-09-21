import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface TraceabilityMatrixProps {
  requirements: any[];
  testCases: any[];
  complianceMappings: any[];
}

export default function TraceabilityMatrix({ 
  requirements, 
  testCases, 
  complianceMappings 
}: TraceabilityMatrixProps) {
  const matrixData = requirements.map(requirement => {
    const linkedTestCases = testCases.filter(tc => tc.requirementId === requirement.id);
    const linkedMappings = complianceMappings.filter(cm => cm.requirementId === requirement.id);
    const coverage = linkedTestCases.length > 0 ? 100 : 0;

    return {
      requirement,
      testCases: linkedTestCases,
      complianceMappings: linkedMappings,
      coverage,
    };
  });

  const totalRequirements = requirements.length;
  const totalTestCases = testCases.length;
  const complianceCoverage = Math.round(
    (complianceMappings.length / requirements.length) * 100
  );

  return (
    <div data-testid="traceability-matrix">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Traceability Matrix</h3>
        <p className="text-muted-foreground">
          Visual mapping between requirements, test cases, and compliance standards
        </p>
      </div>

      <div className="overflow-auto mb-6">
        <table className="w-full border border-border rounded-lg" data-testid="traceability-table">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left border-b border-border font-medium">Requirement ID</th>
              <th className="p-3 text-left border-b border-border font-medium">Description</th>
              <th className="p-3 text-left border-b border-border font-medium">Test Cases</th>
              <th className="p-3 text-left border-b border-border font-medium">Compliance</th>
              <th className="p-3 text-left border-b border-border font-medium">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {matrixData.map((row, index) => (
              <tr 
                key={row.requirement.id} 
                className="border-b border-border hover:bg-accent"
                data-testid={`matrix-row-${index}`}
              >
                <td className="p-3">
                  <Badge variant="outline" data-testid={`matrix-req-id-${index}`}>
                    {row.requirement.requirementId}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="font-medium" data-testid={`matrix-req-title-${index}`}>
                    {row.requirement.type}
                  </div>
                  <div className="text-sm text-muted-foreground" data-testid={`matrix-req-desc-${index}`}>
                    {row.requirement.text.substring(0, 80)}...
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1" data-testid={`matrix-testcases-${index}`}>
                    {row.testCases.map((tc: any, tcIndex: number) => (
                      <Badge 
                        key={tc.id}
                        variant="secondary"
                        className={`${tc.isEdgeCase ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                        data-testid={`matrix-testcase-${index}-${tcIndex}`}
                      >
                        {tc.testCaseId}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  {row.complianceMappings.map((mapping: any, mappingIndex: number) => (
                    <Badge 
                      key={mapping.id}
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700"
                      data-testid={`matrix-compliance-${index}-${mappingIndex}`}
                    >
                      {mapping.section}
                    </Badge>
                  ))}
                </td>
                <td className="p-3">
                  <div className="flex items-center space-x-2" data-testid={`matrix-coverage-${index}`}>
                    <Progress value={row.coverage} className="w-full" />
                    <span className="text-sm font-medium">{row.coverage}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="coverage-summary">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Coverage Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Requirements</span>
                <span className="font-medium" data-testid="summary-req-count">
                  {totalRequirements}/{totalRequirements} (100%)
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Test Cases</span>
                <span className="font-medium" data-testid="summary-tc-count">
                  {totalTestCases} generated
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Compliance</span>
                <span className="font-medium" data-testid="summary-compliance">
                  {complianceCoverage}% mapped
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="compliance-breakdown">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Compliance Breakdown</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Security Controls</span>
                <span className="font-medium" data-testid="breakdown-security">
                  {requirements.filter(req => req.type === 'Security').length} requirements
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Data Privacy</span>
                <span className="font-medium" data-testid="breakdown-privacy">
                  {requirements.filter(req => req.type === 'Data Privacy').length} requirements
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Audit Controls</span>
                <span className="font-medium" data-testid="breakdown-audit">
                  {requirements.filter(req => req.type === 'Audit').length} requirements
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="risk-assessment">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Risk Assessment</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>High Priority</span>
                <span className="font-medium text-red-600" data-testid="risk-high">
                  {requirements.filter(req => req.priority === 'High' && testCases.filter(tc => tc.requirementId === req.id).length === 0).length} gaps
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Medium Priority</span>
                <span className="font-medium text-amber-600" data-testid="risk-medium">
                  {requirements.filter(req => req.priority === 'Medium' && testCases.filter(tc => tc.requirementId === req.id).length === 0).length} gaps
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Low Priority</span>
                <span className="font-medium text-emerald-600" data-testid="risk-low">
                  {requirements.filter(req => req.priority === 'Low' && testCases.filter(tc => tc.requirementId === req.id).length === 0).length} gaps
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
