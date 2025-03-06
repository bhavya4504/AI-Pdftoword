import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { enhanceContent } from "./lib/openai";
import { extractPdfContent, createDocx, createPdf } from "./lib/fileProcessing";
import { insertDocumentSchema, supportedFormats } from "@shared/schema";

const upload = multer({
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

interface FileRequest extends Request {
  file?: Express.Multer.File
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/convert", upload.single("file"), async (req: FileRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const originalFormat = req.file.originalname.split(".").pop()?.toLowerCase();
      if (!supportedFormats.includes(originalFormat as any)) {
        return res.status(400).json({ message: "Unsupported file format" });
      }

      const convertedFormat = originalFormat === "pdf" ? "docx" : "pdf";

      const doc = await storage.createDocument({
        originalName: req.file.originalname,
        originalFormat,
        convertedFormat
      });

      // Extract content
      const content = originalFormat === "pdf" 
        ? await extractPdfContent(req.file.buffer)
        : req.file.buffer.toString();

      // Enhance content using AI
      const enhancedContent = await enhanceContent(content);

      // Convert to target format
      const convertedBuffer = convertedFormat === "pdf"
        ? await createPdf(enhancedContent)
        : await createDocx(enhancedContent);

      const downloadUrl = `/api/download/${doc.id}`;

      await storage.updateDocument(doc.id, {
        status: "completed",
        content,
        enhancedContent,
        downloadUrl
      });

      res.json({ 
        id: doc.id,
        downloadUrl
      });
    } catch (error) {
      console.error('Error processing document:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'An unexpected error occurred' });
    }
  });

  app.get("/api/status/:id", async (req, res) => {
    try {
      const doc = await storage.getDocument(parseInt(req.params.id));
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(doc);
    } catch (error) {
      console.error('Error fetching document status:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'An unexpected error occurred' });
    }
  });

  app.get("/api/download/:id", async (req, res) => {
    try {
      const doc = await storage.getDocument(parseInt(req.params.id));
      if (!doc || !doc.enhancedContent) {
        return res.status(404).json({ message: "Document not found" });
      }

      const buffer = doc.convertedFormat === "pdf"
        ? await createPdf(doc.enhancedContent)
        : await createDocx(doc.enhancedContent);

      res.setHeader('Content-Type', doc.convertedFormat === "pdf" ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename=${doc.originalName}.${doc.convertedFormat}`);
      res.send(buffer);
    } catch (error) {
      console.error('Error downloading document:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'An unexpected error occurred' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}