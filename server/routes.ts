import type { Express } from "express";
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

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/convert", upload.single("file"), async (req, res) => {
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
      res.status(500).json({ message: error.message });
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
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
