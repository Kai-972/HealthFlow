import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import FileUpload from "@/components/file-upload";
import ComplianceSelector from "@/components/compliance-selector";
import ProcessingStatus from "@/components/processing-status";
import ResultsDashboard from "@/components/results-dashboard";
import ChatInterface from "@/components/chat-interface";
import { Heart, Shield, Settings, HelpCircle } from "lucide-react";

export default function Dashboard() {
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [complianceFramework, setComplianceFramework] = useState("HIPAA");
  const [exportFormat, setExportFormat] = useState("CSV");
  const { toast } = useToast();

  const createProject = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return response.json();
    },
    onSuccess: (project) => {
      setCurrentProject(project);
      toast({
        title: "Project Created",
        description: "Your project has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const uploadDocuments = useMutation({
    mutationFn: async ({ projectId, files }: { projectId: string; files: FileList }) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append("documents", file);
      });
      
      const response = await apiRequest("POST", `/api/projects/${projectId}/documents`, formData);
      return response.json();
    },
    onSuccess: (data) => {
      setUploadedFiles(data.documents);
      toast({
        title: "Files Uploaded",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      });
    },
  });

  const processDocuments = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/projects/${projectId}/process`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to start processing");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      setIsProcessing(true);
      setProcessingSteps([]);

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              setProcessingSteps(prev => {
                const newSteps = [...prev];
                const existingIndex = newSteps.findIndex(step => step.step === data.step);
                if (existingIndex >= 0) {
                  newSteps[existingIndex] = data;
                } else {
                  newSteps.push(data);
                }
                return newSteps;
              });

              if (data.step === "Processing completed") {
                setIsProcessing(false);
              }
            } catch (error) {
              console.error("Error parsing SSE data:", error);
            }
          }
        }
      }
    },
    onError: (error) => {
      setIsProcessing(false);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process documents",
        variant: "destructive",
      });
    },
  });

  const handleCreateProject = () => {
    createProject.mutate({
      name: `Healthcare Compliance Project - ${new Date().toLocaleDateString()}`,
      description: "AI-powered test case generation for healthcare compliance",
      complianceFramework,
      exportFormat,
    });
  };

  const handleFileUpload = (files: FileList) => {
    if (!currentProject) {
      handleCreateProject();
      // The upload will happen after project creation in a useEffect or similar
      setTimeout(() => {
        if (currentProject) {
          uploadDocuments.mutate({ projectId: currentProject.id, files });
        }
      }, 1000);
    } else {
      uploadDocuments.mutate({ projectId: currentProject.id, files });
    }
  };

  const handleProcessDocuments = () => {
    if (!currentProject) {
      toast({
        title: "No Project",
        description: "Please create a project and upload documents first.",
        variant: "destructive",
      });
      return;
    }

    processDocuments.mutate(currentProject.id);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-emerald-500" data-testid="logo-icon" />
              <h1 className="text-xl font-bold text-foreground" data-testid="app-title">
                HealthCompliance AI
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-1 text-sm text-muted-foreground">
              <span>AI-Powered Test Case Generation</span>
              <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
              <span>Healthcare Compliance</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full">
              <Shield className="h-4 w-4 text-emerald-600" data-testid="certification-icon" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                SOC 2 Certified
              </span>
            </div>
            <button 
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-settings"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button 
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-help"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="page-title">
                AI-Powered Test Case Generation
              </h1>
              <p className="text-muted-foreground" data-testid="page-description">
                Upload healthcare requirements to automatically generate compliance-mapped test cases
              </p>
            </div>

            {/* Document Upload Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <FileUpload
                  onFileUpload={handleFileUpload}
                  uploadedFiles={uploadedFiles}
                  isUploading={uploadDocuments.isPending}
                />
              </div>

              <div>
                <ComplianceSelector
                  complianceFramework={complianceFramework}
                  exportFormat={exportFormat}
                  onComplianceChange={setComplianceFramework}
                  onExportFormatChange={setExportFormat}
                  onProcess={handleProcessDocuments}
                  disabled={uploadedFiles.length === 0 || isProcessing}
                  isProcessing={isProcessing}
                />
              </div>
            </div>

            {/* Processing Status */}
            {(isProcessing || processingSteps.length > 0) && (
              <ProcessingStatus 
                steps={processingSteps}
                isProcessing={isProcessing}
              />
            )}

            {/* Results Dashboard */}
            {currentProject && !isProcessing && processingSteps.some(step => step.step === "Processing completed") && (
              <ResultsDashboard projectId={currentProject.id} />
            )}
          </div>
        </main>
      </div>

      {/* Chat Interface */}
      {currentProject && (
        <ChatInterface projectId={currentProject.id} />
      )}
    </div>
  );
}
