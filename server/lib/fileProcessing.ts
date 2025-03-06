import { readFile } from "fs/promises";
import * as pdfParse from "pdf-parse/lib/pdf-parse.js";
import { Document, Packer, Paragraph } from "docx";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function extractPdfContent(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error: any) {
    throw new Error(`Failed to extract PDF content: ${error.message}`);
  }
}

export async function createDocx(content: string): Promise<Buffer> {
  try {
    const doc = new Document({
      sections: [{
        properties: {},
        children: content.split('\n').map(para => 
          new Paragraph({ text: para })
        )
      }]
    });

    return await Packer.toBuffer(doc);
  } catch (error: any) {
    throw new Error(`Failed to create DOCX: ${error.message}`);
  }
}

export async function createPdf(content: string): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const lines = content.split('\n');
    let y = page.getHeight() - 50;

    lines.forEach(line => {
      if (y > 50) {
        page.drawText(line, {
          x: 50,
          y,
          font,
          size: 12,
          color: rgb(0, 0, 0)
        });
        y -= 20;
      }
    });

    return await pdfDoc.save();
  } catch (error: any) {
    throw new Error(`Failed to create PDF: ${error.message}`);
  }
}