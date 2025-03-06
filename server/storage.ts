import { documents, type Document, type InsertDocument } from "@shared/schema";

export interface IStorage {
  createDocument(doc: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  updateDocument(id: number, updates: Partial<Document>): Promise<Document>;
  storeBuffer(id: number, buffer: Buffer): Promise<void>;
  getBuffer(id: number): Promise<Buffer | undefined>;
}

export class MemStorage implements IStorage {
  private documents: Map<number, Document>;
  private buffers: Map<number, Buffer>;
  private currentId: number;

  constructor() {
    this.documents = new Map();
    this.buffers = new Map();
    this.currentId = 1;
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const id = this.currentId++;
    const document: Document = {
      ...doc,
      id,
      status: "pending",
      downloadUrl: null,
      error: null,
    };
    this.documents.set(id, document);
    return document;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document> {
    const doc = await this.getDocument(id);
    if (!doc) throw new Error("Document not found");

    const updated = { ...doc, ...updates };
    this.documents.set(id, updated);
    return updated;
  }

  async storeBuffer(id: number, buffer: Buffer): Promise<void> {
    this.buffers.set(id, buffer);
  }

  async getBuffer(id: number): Promise<Buffer | undefined> {
    return this.buffers.get(id);
  }
}

export const storage = new MemStorage();