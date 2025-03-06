import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { convertPdfToDocx, convertDocxToPdf } from "./lib/fileProcessing";
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

      try {
        // Convert the document
        const convertedBuffer = originalFormat === "pdf"
          ? await convertPdfToDocx(req.file.buffer)
          : await convertDocxToPdf(req.file.buffer.toString());

        console.log(`Converted ${originalFormat} to ${convertedFormat} successfully`);

        // Store the converted buffer
        await storage.storeBuffer(doc.id, Buffer.from(convertedBuffer));

        const downloadUrl = `/api/download/${doc.id}`;

        await storage.updateDocument(doc.id, {
          status: "completed",
          downloadUrl
        });

        console.log('Document conversion completed successfully');
        res.json(doc);
      } catch (error) {
        console.error('Error converting document:', error);
        await storage.updateDocument(doc.id, {
          status: "error",
          error: error instanceof Error ? error.message : "Failed to convert document"
        });
        throw error;
      }
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
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }

      const buffer = await storage.getBuffer(doc.id);
      if (!buffer) {
        return res.status(404).json({ message: "Converted file not found" });
      }

      res.setHeader('Content-Type', doc.convertedFormat === "pdf" 
        ? 'application/pdf' 
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
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