import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private model: GenerativeModel;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            this.logger.warn('GEMINI_API_KEY not found. AI features will be disabled.');
            return;
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    async extractEntities(text: string): Promise<any> {
        if (!this.model) {
            throw new Error("AI Model not initialized");
        }

        const prompt = `
      You are an expert Quantity Surveyor and Construction Estimator.
      Analyze the following customer request and extract the construction requirements into a structured JSON format.
      
      RULES:
      1. ONLY return valid JSON. No markdown, no commentary.
      2. Detect the "intent" (e.g., "installation", "renovation").
      3. Extract numeric values with their units.
      4. Try to infer the material category.
      
      USER REQUEST:
      "${text}"
      
      OUTPUT SCHEMA:
      {
        "intent": string,
        "items": [
          {
             "description": string,
             "quantity": number,
             "unit": string,
             "material_hint": string
          }
        ],
        "confidence": number (0-1)
      }
    `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const textResponse = response.text();

            return this.cleanAndParseJson(textResponse);
        } catch (error) {
            this.logger.error('Failed to generate content', error);
            throw error;
        }
    }

    // Helper to remove markdown usually returned by LLMs (```json ... ```)
    private cleanAndParseJson(text: string): any {
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    }
}
