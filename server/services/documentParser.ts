import * as fs from "fs";
import * as path from "path";

export interface ParsedDocument {
  content: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    extractedAt: Date;
  };
}

export class DocumentParser {
  async parseDocument(filePath: string, mimeType: string): Promise<ParsedDocument> {
    try {
      let content = "";
      
      if (mimeType === "text/plain") {
        content = await this.parseTextFile(filePath);
      } else if (mimeType === "application/pdf") {
        content = await this.parsePDFFile(filePath);
      } else if (mimeType.includes("document") || mimeType.includes("docx")) {
        content = await this.parseDocxFile(filePath);
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

      return {
        content,
        metadata: {
          wordCount,
          extractedAt: new Date(),
        },
      };
    } catch (error) {
      throw new Error(`Failed to parse document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async parseTextFile(filePath: string): Promise<string> {
    return fs.promises.readFile(filePath, "utf-8");
  }

  private async parsePDFFile(filePath: string): Promise<string> {
    // For now, we'll use a simple text extraction approach
    // In production, you would use a library like pdf-parse
    try {
      const pdfParse = await import("pdf-parse");
      const dataBuffer = await fs.promises.readFile(filePath);
      const data = await pdfParse.default(dataBuffer);
      return data.text;
    } catch (error) {
      // Fallback: try to read as text (might work for some simple PDFs)
      return fs.promises.readFile(filePath, "utf-8");
    }
  }

  private async parseDocxFile(filePath: string): Promise<string> {
    // For now, we'll use a simple approach
    // In production, you would use a library like mammoth
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      // Fallback: try to read as text
      return fs.promises.readFile(filePath, "utf-8");
    }
  }

  validateFile(file: { size: number; mimetype: string }): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    if (file.size > maxSize) {
      throw new Error("File size exceeds 10MB limit");
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error("Unsupported file type. Please upload PDF, DOCX, or TXT files.");
    }
  }
}

export const documentParser = new DocumentParser();
