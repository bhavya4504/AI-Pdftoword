import { documents, type Document, type InsertDocument } from "@shared/schema";

export interface IStorage {
  createDocument(doc: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  updateDocument(id: number, updates: Partial<Document>): Promise<Document>;
}

export class MemStorage implements IStorage {
  private documents: Map<number, Document>;
  private currentId: number;

  constructor() {
    this.documents = new Map();
    this.currentId = 1;
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const id = this.currentId++;
    const document: Document = {
      ...doc,
      id,
      status: "pending",
      content: null,
      enhancedContent: null,
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
}

export const storage = new MemStorage();
