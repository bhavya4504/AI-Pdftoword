import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { Document } from "@shared/schema";

interface FilePreviewProps {
  document: Document;
}

export function FilePreview({ document }: FilePreviewProps) {
  const { data: doc } = useQuery<Document>({
    queryKey: [`/api/status/${document.id}`],
    enabled: document.status === "pending",
    refetchInterval: (data) => 
      data?.status === "completed" ? false : 1000,
  });

  const currentDoc = doc || document;

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

      {currentDoc.status === "pending" && (
        <p className="text-sm text-muted-foreground">Processing...</p>
      )}

      {currentDoc.error && (
        <p className="text-sm text-destructive">{currentDoc.error}</p>
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