import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function enhanceContent(content: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert document formatter. Your task is to enhance the given document content while preserving its structure and meaning. Focus on improving readability, formatting, and visual appeal. Return the enhanced content in a JSON object with an 'enhancedContent' field."
        },
        {
          role: "user",
          content
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    if (!result.enhancedContent) {
      throw new Error("Invalid response format from OpenAI");
    }
    return result.enhancedContent;
  } catch (error: any) {
    throw new Error(`Failed to enhance content: ${error.message}`);
  }
}