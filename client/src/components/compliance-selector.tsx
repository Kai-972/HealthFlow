import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Wand2 } from "lucide-react";

interface ComplianceSelectorProps {
  complianceFramework: string;
  exportFormat: string;
  onComplianceChange: (value: string) => void;
  onExportFormatChange: (value: string) => void;
  onProcess: () => void;
  disabled: boolean;
  isProcessing: boolean;
}

export default function ComplianceSelector({
  complianceFramework,
  exportFormat,
  onComplianceChange,
  onExportFormatChange,
  onProcess,
  disabled,
  isProcessing,
}: ComplianceSelectorProps) {
  return (
    <Card data-testid="compliance-selector-card">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center" data-testid="compliance-title">
          <Shield className="mr-2 text-emerald-500" />
          Compliance Framework
        </h2>

        <RadioGroup 
          value={complianceFramework} 
          onValueChange={onComplianceChange}
          className="space-y-3"
          data-testid="compliance-framework-group"
        >
          <div className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-accent cursor-pointer">
            <RadioGroupItem value="HIPAA" id="hipaa" data-testid="radio-hipaa" />
            <Label htmlFor="hipaa" className="flex-1 cursor-pointer">
              <div className="font-medium">HIPAA</div>
              <div className="text-sm text-muted-foreground">Health Insurance Portability</div>
            </Label>
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
          </div>

          <div className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-accent cursor-pointer">
            <RadioGroupItem value="ISO13485" id="iso13485" data-testid="radio-iso13485" />
            <Label htmlFor="iso13485" className="flex-1 cursor-pointer">
              <div className="font-medium">ISO 13485</div>
              <div className="text-sm text-muted-foreground">Medical Devices Quality</div>
            </Label>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>

          <div className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-accent cursor-pointer">
            <RadioGroupItem value="FDA" id="fda" data-testid="radio-fda" />
            <Label htmlFor="fda" className="flex-1 cursor-pointer">
              <div className="font-medium">FDA 21 CFR Part 11</div>
              <div className="text-sm text-muted-foreground">Electronic Records</div>
            </Label>
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
          </div>
        </RadioGroup>

        <div className="mt-4 pt-4 border-t border-border">
          <Label htmlFor="export-format" className="font-medium mb-2 block">
            Export Format
          </Label>
          <Select value={exportFormat} onValueChange={onExportFormatChange}>
            <SelectTrigger data-testid="select-export-format">
              <SelectValue placeholder="Select export format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CSV">CSV Spreadsheet</SelectItem>
              <SelectItem value="XML">XML Document</SelectItem>
              <SelectItem value="Word">Word Document</SelectItem>
              <SelectItem value="Jira">Jira Import</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={onProcess}
          disabled={disabled}
          className="w-full mt-4 font-medium"
          data-testid="button-process"
        >
          <Wand2 className="mr-2 h-4 w-4" />
          {isProcessing ? "Processing..." : "Process with AI"}
        </Button>
      </CardContent>
    </Card>
  );
}
