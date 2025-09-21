import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CloudUpload, FileText, Check } from "lucide-react";

interface FileUploadProps {
  onFileUpload: (files: FileList) => void;
  uploadedFiles: any[];
  isUploading: boolean;
}

export default function FileUpload({ onFileUpload, uploadedFiles, isUploading }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileUpload(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files);
    }
  };

  const handleChooseFiles = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card data-testid="file-upload-card">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center" data-testid="upload-title">
          <CloudUpload className="mr-2 text-primary" />
          Document Upload
        </h2>

        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer ${
            isDragOver ? "border-primary bg-primary/5" : "border-border"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleChooseFiles}
          data-testid="drop-zone"
        >
          <div className="max-w-sm mx-auto">
            <FileText className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
            <h3 className="text-lg font-medium mb-2" data-testid="drop-zone-title">
              Drop your requirements here
            </h3>
            <p className="text-muted-foreground mb-4" data-testid="drop-zone-description">
              Supports PDF, DOCX, and TXT files up to 10MB
            </p>
            <Button 
              type="button" 
              disabled={isUploading}
              data-testid="button-choose-files"
            >
              {isUploading ? "Uploading..." : "Choose Files"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt"
              multiple
              onChange={handleFileSelect}
              data-testid="input-file"
            />
          </div>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4 space-y-2" data-testid="uploaded-files">
            {uploadedFiles.map((file, index) => (
              <div
                key={file.id || index}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
                data-testid={`uploaded-file-${index}`}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="text-red-500 h-5 w-5" />
                  <div>
                    <div className="font-medium" data-testid={`file-name-${index}`}>
                      {file.originalName}
                    </div>
                    <div className="text-sm text-muted-foreground" data-testid={`file-info-${index}`}>
                      {(file.fileSize / 1024 / 1024).toFixed(1)} MB • {file.mimeType.includes('pdf') ? 'PDF' : file.mimeType.includes('document') ? 'DOCX' : 'TXT'} Document
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm text-emerald-600" data-testid={`file-status-${index}`}>
                    Uploaded
                  </span>
                  <Check className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
