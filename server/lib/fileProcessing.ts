import { readFile } from "fs/promises";
// @ts-ignore
import pdfParse from "pdf-parse";
import { Document, Packer, convertInchesToTwip, PageOrientation, Paragraph } from "docx";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function extractPdfContent(buffer: Buffer): Promise<string> {
  try {
    console.log('Starting PDF content extraction...');
    const data = await pdfParse(buffer);
    console.log('PDF content extracted successfully');
    return data.text;
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    throw new Error(`Failed to extract PDF content: ${error.message}`);
  }
}

export async function convertPdfToDocx(buffer: Buffer): Promise<Buffer> {
  try {
    console.log('Converting PDF to DOCX...');
    const pdfData = await pdfParse(buffer);

    // Create a new DOCX document with similar formatting
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
            size: {
              orientation: PageOrientation.PORTRAIT,
            },
          },
        },
        children: pdfData.text.split('\n').map(line => new Paragraph({
          text: line,
          spacing: {
            line: 360, // equivalent to 1.5 line spacing
          },
          font: "Times New Roman",
          style: "Normal",
        })),
      }],
    });

    console.log('DOCX conversion completed');
    return await Packer.toBuffer(doc);
  } catch (error: any) {
    console.error('DOCX conversion error:', error);
    throw new Error(`Failed to convert PDF to DOCX: ${error.message}`);
  }
}

export async function convertDocxToPdf(content: string): Promise<Uint8Array> {
  try {
    console.log('Converting DOCX to PDF...');
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    const lines = content.split('\n');
    let y = page.getHeight() - 50;

    // Preserve formatting when converting to PDF
    lines.forEach(line => {
      if (y > 50) {
        page.drawText(line.trim(), {
          x: 50,
          y,
          font,
          size: 12,
          color: rgb(0, 0, 0),
          lineHeight: 14,
        });
        y -= 20;
      }
    });

    console.log('PDF conversion completed');
    return await pdfDoc.save();
  } catch (error: any) {
    console.error('PDF conversion error:', error);
    throw new Error(`Failed to convert DOCX to PDF: ${error.message}`);
  }
}
