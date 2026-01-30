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
        this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }

    async extractEntities(text: string, images: string[] = []): Promise<AiExtractionResult> {
        if (!this.model) {
            throw new Error("AI Model not initialized");
        }

        const promptText = `
      You are an expert Quantity Surveyor and Construction Estimator.
      Analyze the following customer request (and optional images) and extract the construction requirements into a structured JSON format.
      
      CORE PRINCIPLES:
      - EXPERT INFERENCE: If the user describes a high-level task (e.g., "Build a partition wall"), you MUST break it down into standard components (e.g., "Plasterboard", "Metal Studs", "Insulation", "Labor") based on standard industry ratios.
      - ACCURATE QUANTITIES: If detailed dimensions are provided, calculate the required areas/volumes. If implied, use standard heights (e.g., 2.5m for walls).
      - NO PRICING: You are a translator. You do NOT set prices. Never include a "price" or "cost" field.
      - STRICT JSON: Output only valid JSON.
      
      OUTPUT SCHEMA:
      {
        "intent": "NEW_QUOTE" | "STATUS_CHECK" | "UNKNOWN",
        "items": [
          {
             "description": string (the item name, e.g. "Plasterboard BA13"),
             "quantity": number (calculated quantity),
             "unit": string (standardized symbol e.g., m2, lm, pc, hr),
             "material_hint": string (e.g., "Gypsum", "Steel"),
             "dimensions_hint": string (e.g., "250x120", "48mm"),
             "category_hint": string (e.g., "DRYWALL", "LABOR")
          }
        ],
        "confidence": number (0-1),
        "warnings": string[] (any assumptions made, e.g. "Assumed wall height 2.5m")
      }

      USER REQUEST:
      "${text}"
    `;

        try {
            const parts: any[] = [{ text: promptText }];

            if (images && images.length > 0) {
                images.forEach(base64 => {
                    // Extract mime type if present "data:image/png;base64,..."
                    const match = base64.match(/^data:(image\/[a-z]+);base64,(.+)$/);
                    if (match) {
                        parts.push({
                            inlineData: {
                                mimeType: match[1],
                                data: match[2]
                            }
                        });
                    } else {
                        parts.push({
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: base64
                            }
                        });
                    }
                });
            }

            const result = await this.model.generateContent(parts);
            const response = await result.response;
            const textResponse = response.text();

            return this.cleanAndParseJson(textResponse);
        } catch (error) {
            this.logger.error('Failed to generate content', error);
            throw error;
        }
    }

    private cleanAndParseJson(text: string): any {
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    }
}
