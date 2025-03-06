import OpenAI from "openai";
import fs from "fs";
import pdf from "pdf-parse";
import { Document, Packer, Paragraph } from "docx";

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Extract text from PDF
async function extractTextFromPDF(pdfPath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdf(dataBuffer);
  return data.text;
}

// Enhance content using OpenAI
export async function enhanceContent(content: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert document formatter. Enhance the content for better readability and structure while preserving the original meaning.",
        },
        {
          role: "user",
          content,
        },
      ],
    });

    return response.choices[0]?.message?.content ?? content;
  } catch (error: any) {
    console.error("OpenAI enhancement failed:", error);
    return `[Note: AI enhancement unavailable]\n\n${content}`;
  }
}

// Convert enhanced content to DOCX
async function saveToDocx(enhancedText: string, outputPath: string) {
  const doc = new Document({
    sections: [
      {
        children: enhancedText.split("\n").map((line) => new Paragraph(line)),
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`File saved to: ${outputPath}`);
}

// Main function
async function processDocument(inputPdfPath: string, outputDocxPath: string) {
  try {
    console.log("Extracting text from PDF...");
    const pdfText = await extractTextFromPDF(inputPdfPath);

    console.log("Enhancing content using OpenAI...");
    const enhancedText = await enhanceContent(pdfText);

    console.log("Saving enhanced content to DOCX...");
    await saveToDocx(enhancedText, outputDocxPath);
  } catch (error) {
    console.error("Error processing document:", error);
  }
}

// Usage
processDocument("input.pdf", "output.docx");
