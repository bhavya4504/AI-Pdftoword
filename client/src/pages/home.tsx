import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/file-upload";
import { FilePreview } from "@/components/file-preview";
import { useState } from "react";
import type { Document } from "@shared/schema";

export default function Home() {
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Document Enhancement
          </h1>
          <p className="text-muted-foreground">
            Upload your PDF or DOCX files and let AI enhance them for you
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload onSuccess={setCurrentDoc} />
          </CardContent>
        </Card>

        {currentDoc && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <FilePreview document={currentDoc} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
