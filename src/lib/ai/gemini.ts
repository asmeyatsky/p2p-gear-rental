
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from '@/lib/logger';

class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Gemini API key is missing. Please set it in your environment variables.");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    logger.info("Gemini Service initialized", {}, "GEMINI");
  }

  /**
   * Gets the generative model.
   *
   * @param modelName The name of the model to use. Defaults to "gemini-1.5-flash-latest".
   * @returns The generative model.
   */
  getModel(modelName: string = "gemini-2.5-flash") {
    return this.genAI.getGenerativeModel({ model: modelName });
  }

  /**
   * Generates content from a prompt.
   *
   * @param prompt The prompt to generate content from.
   * @param modelName The name of the model to use.
   * @returns The generated text.
   */
  async generateContent(prompt: string, modelName?: string): Promise<string> {
    try {
      const model = this.getModel(modelName);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      logger.info("Generated content with Gemini", { model: modelName, prompt }, "GEMINI");
      return text;
    } catch (error) {
      logger.error("Error generating content with Gemini", { error }, "GEMINI");
      throw error;
    }
  }
}

const geminiApiKey = process.env.GEMINI_API_KEY || "";
export const geminiService = new GeminiService(geminiApiKey);
