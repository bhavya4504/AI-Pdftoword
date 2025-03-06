import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { uploadSchema, type Document } from "@shared/schema";
import { z } from "zod";

interface FileUploadProps {
  onSuccess: (doc: Document) => void;
}

export function FileUpload({ onSuccess }: FileUploadProps) {
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiRequest("POST", "/api/convert", formData);
      const data = await res.json();
      return data as Document;
    },
    onSuccess: (data) => {
      onSuccess(data);
      toast({
        title: "Success",
        description: "File uploaded and processed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      uploadSchema.parse({ file });
      uploadMutation.mutate(file);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    }
  }, [uploadMutation, toast]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              PDF or DOCX (MAX. 50MB)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.docx"
            onChange={handleFileSelect}
            disabled={uploadMutation.isPending}
          />
        </label>
      </div>

      {uploadMutation.isPending && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground text-center">
            Processing your document...
          </p>
        </div>
      )}
    </div>
  );
}