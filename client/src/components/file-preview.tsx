import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { Document } from "@shared/schema";
import { ProgressIndicator } from "./progress-indicator";

interface FilePreviewProps {
  document: Document;
}

export function FilePreview({ document }: FilePreviewProps) {
  const { data: doc } = useQuery<Document>({
    queryKey: [`/api/status/${document.id}`],
    enabled: document.status === "pending",
    refetchInterval: (data) => 
      data?.status === "completed" || data?.error ? false : 1000,
  });

  const currentDoc = doc || document;
  const isProcessing = currentDoc.status === "pending";
  const hasError = Boolean(currentDoc.error);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{currentDoc.originalName}</h3>
          <p className="text-sm text-muted-foreground">
            Converting from {currentDoc.originalFormat} to {currentDoc.convertedFormat}
          </p>
        </div>

        {currentDoc.status === "completed" && currentDoc.downloadUrl && (
          <Button asChild>
            <a href={currentDoc.downloadUrl} download>
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
          </Button>
        )}
      </div>

      {isProcessing && (
        <ProgressIndicator 
          status="processing"
          message="Processing your document..." 
        />
      )}

      {hasError && (
        <ProgressIndicator 
          status="error"
          message={currentDoc.error || "An error occurred while processing the document"} 
        />
      )}

      {currentDoc.status === "completed" && (
        <ProgressIndicator 
          status="completed"
          message="Document processing completed" 
        />
      )}

      {currentDoc.enhancedContent && (
        <div className="p-4 rounded-lg bg-muted">
          <pre className="text-sm whitespace-pre-wrap">
            {currentDoc.enhancedContent}
          </pre>
        </div>
      )}
    </div>
  );
}