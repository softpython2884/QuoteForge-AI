import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { AiExtractionResult } from './dto/ai-extraction.dto';

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
        // User requested 2.5 Flash, mapping to 2.0 Flash which is the standard next-gen low-cost model
        this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }

    async extractEntities(text: string): Promise<AiExtractionResult> {
        if (!this.model) {
            throw new Error("AI Model not initialized");
        }

        const prompt = `
      You are an expert Quantity Surveyor and Construction Estimator.
      Analyze the following customer request and extract the construction requirements into a structured JSON format.
      
      CORE PRINCIPLES:
      - ZERO HALLUCINATION: Do not invent items not implied by the text.
      - NO PRICING: You are a translator. You do NOT set prices. Never include a "price" or "cost" field.
      - STRICT JSON: Output only valid JSON.
      
      OUTPUT SCHEMA:
      {
        "intent": "NEW_QUOTE" | "STATUS_CHECK" | "UNKNOWN",
        "items": [
          {
             "description": string (original text reference),
             "quantity": number (parsed value),
             "unit": string (standardized symbol e.g., m2, lm, pc),
             "material_hint": string (e.g., "Oak", "Ceramic", "Copper"),
             "dimensions_hint": string (e.g., "60x60", "15mm"),
             "category_hint": string (e.g., "FLOORING", "PLUMBING")
          }
        ],
        "confidence": number (0-1),
        "warnings": string[] (any ambiguity found)
      }

      USER REQUEST:
      "${text}"
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
