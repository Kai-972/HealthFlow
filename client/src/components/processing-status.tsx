import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, Loader2 } from "lucide-react";

interface ProcessingStep {
  step: string;
  status: "pending" | "processing" | "completed" | "failed";
  message: string;
  duration?: number;
}

interface ProcessingStatusProps {
  steps: ProcessingStep[];
  isProcessing: boolean;
}

export default function ProcessingStatus({ steps, isProcessing }: ProcessingStatusProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "processing":
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case "failed":
        return <Clock className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-muted";
      case "processing":
        return "bg-accent";
      case "failed":
        return "bg-destructive/10";
      default:
        return "bg-secondary opacity-50";
    }
  };

  return (
    <Card className="mb-6" data-testid="processing-status-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center" data-testid="processing-title">
            <Loader2 className={`mr-2 text-primary h-5 w-5 ${isProcessing ? 'animate-spin' : ''}`} />
            AI Processing Status
          </h2>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`}></div>
            <span className={`text-sm ${isProcessing ? 'text-emerald-600' : 'text-muted-foreground'}`} data-testid="processing-status">
              {isProcessing ? "Processing..." : "Completed"}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg ${getStatusColor(step.status)}`}
              data-testid={`processing-step-${index}`}
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(step.status)}
                <span data-testid={`step-message-${index}`}>{step.message}</span>
              </div>
              {step.duration && (
                <span className="text-sm text-muted-foreground" data-testid={`step-duration-${index}`}>
                  {(step.duration / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
