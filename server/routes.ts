import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { enhanceContent } from "./lib/openai";
import { extractPdfContent, createDocx, createPdf } from "./lib/fileProcessing";
import { insertDocumentSchema, supportedFormats } from "@shared/schema";

const upload = multer({
  storage: multer.memoryStorage(),
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
      console.log('Received file upload request');

      if (!req.file) {
        console.log('No file received in request');
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log(`Processing file: ${req.file.originalname}`);

      const originalFormat = req.file.originalname.split(".").pop()?.toLowerCase();
      if (!originalFormat || !supportedFormats.includes(originalFormat as any)) {
        console.log(`Unsupported format: ${originalFormat}`);
        return res.status(400).json({ message: "Unsupported file format" });
      }

      const convertedFormat = originalFormat === "pdf" ? "docx" : "pdf";

      const doc = await storage.createDocument({
        originalName: req.file.originalname,
        originalFormat,
        convertedFormat
      });

      console.log(`Created document record with ID: ${doc.id}`);

      // Extract content
      let content: string;
      try {
        content = originalFormat === "pdf" 
          ? await extractPdfContent(req.file.buffer)
          : req.file.buffer.toString();
        console.log('Content extracted successfully');
      } catch (error) {
        console.error('Error extracting content:', error);
        throw error;
      }

      // Enhance content using AI
      let enhancedContent: string;
      try {
        enhancedContent = await enhanceContent(content);
        console.log('Content enhanced successfully');
      } catch (error) {
        console.error('Error enhancing content:', error);
        throw error;
      }

      // Convert to target format
      try {
        const convertedBuffer = convertedFormat === "pdf"
          ? await createPdf(enhancedContent)
          : await createDocx(enhancedContent);
        console.log(`Converted to ${convertedFormat} successfully`);
      } catch (error) {
        console.error('Error converting format:', error);
        throw error;
      }

      const downloadUrl = `/api/download/${doc.id}`;

      await storage.updateDocument(doc.id, {
        status: "completed",
        content,
        enhancedContent,
        downloadUrl
      });

      console.log('Document processing completed successfully');
      res.json(doc);
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