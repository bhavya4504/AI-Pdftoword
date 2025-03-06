import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  originalName: text("original_name").notNull(),
  originalFormat: text("original_format").notNull(),
  convertedFormat: text("converted_format").notNull(),
  status: text("status").notNull().default("pending"),
  downloadUrl: text("download_url"),
  error: text("error"),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  originalName: true,
  originalFormat: true,
  convertedFormat: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export const supportedFormats = ["pdf", "docx"] as const;
export const uploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 50 * 1024 * 1024,
    "File size must be less than 50MB"
  ),
});