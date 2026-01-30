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
      You are an Expert PC Hardware Consultant and System Builder.
      Analyze the following customer request (and optional images) and extract the hardware requirements into a structured JSON format.
      
      CORE PRINCIPLES:
      - EXPERT INFERENCE: If the user provides high-level requirements (e.g., "PC for 4K Gaming", "Video Editing workstation"), you MUST infer the necessary high-end components (CPU, GPU, RAM, Storage, PSU, Case, Cooling, and Assembly Labor) based on modern industry standards.
      - STRICT NAMING: Do NOT use "e.g.", "or", or list alternatives in the description. Provide exactly ONE specific model or component name that best fits the hardware category needed.
      - ACCURATE QUANTITIES: If inferred, use logical quantities (1 CPU, 1 Motherboard, etc.).
      - NO PRICING: You are a translator/consultant. You do NOT set prices. Never include a "price" or "cost" field. The pricing engine handles that.
      - STRICT JSON: Output only valid JSON.
      
      OUTPUT SCHEMA:
      {
        "intent": "NEW_QUOTE" | "STATUS_CHECK" | "UNKNOWN",
        "items": [
          {
             "description": string (The specific hardware name, e.g. "RTX 4090". NO EXAMPLES/ALTERNATIVES.),
             "quantity": number (usually 1, unless specified),
             "unit": string (use "pc" for parts, "h" for labor),
             "material_hint": string (category hint, e.g., "Silicon", "Liquid", "Labor"),
             "dimensions_hint": string (specs like "16GB", "850W", "ATX"),
             "category_hint": string (e.g., "CPU", "GPU", "RAM", "PSU", "CASE", "SERVICE")
          }
        ],
        "confidence": number (0-1),
        "warnings": string[] (any assumptions or compatibility notes)
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
