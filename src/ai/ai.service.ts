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

    async extractEntities(text: string, images: string[] = [], catalog: any[] = []): Promise<AiExtractionResult> {
        if (!this.model) {
            throw new Error("AI Model not initialized");
        }

        const catalogContent = catalog.length > 0
            ? `CATALOG:
${catalog.map(p => `- [id: ${p.id}] ${p.name} | Category: ${p.category} | Price: ${p.basePrice} | Unit: ${p.unit?.symbol || 'pc'}`).join('\n')}`
            : 'No catalog provided.';

        const promptText = `
      You are an Expert PC Hardware Consultant. Use the provided CATALOG to fulfill the user's request.
      
      ${catalogContent}

      CORE PRINCIPLES:
      - BUDGET AWARENESS: If the user specifies a budget (e.g., "under 2000€"), you MUST calculate the approximate total of your selections using the prices in the CATALOG. If the total exceeds the budget, select cheaper components from the catalog until you are under the limit.
      - EXACT MATCHING: Use the ACTUAL product names from the catalog. 
      - SMART QUANTITIES: If the user asks for a specification we don't have exactly (e.g., "4TB SSD"), use MULTIPLE units of what we DO have (e.g., 2x "Samsung 990 Pro 2TB"). Do NOT substitute different types (e.g., don't use HDD if SSD is requested).
      - EXPERT INFERENCE: If a "Full PC Build" is requested, infer EVERY necessary component from the catalog (CPU, GPU, RAM, SSD, PSU, Case, Motherboard, Fans, Assembly Service).
      - UNIT SYNC: Use the EXACT unit symbol provided in the catalog for each item.
      - REASONING NOTES: Provide a short 'notes' field for each item explaining why it was chosen (e.g., "Chosen to fit budget", "Required for 4K gaming").
      - NO PRICING IN OUTPUT: You use prices for selection logic, but DO NOT include price fields in your JSON output.
      - STRICT JSON: Output only valid JSON.
      
      OUTPUT SCHEMA:
      {
        "intent": "NEW_QUOTE",
        "items": [
          {
             "description": string (Exact product name from catalog),
             "quantity": number,
             "unit": string (Exact symbol from catalog),
             "category_hint": string (Category from catalog),
             "notes": string (Reasoning for selection)
          }
        ],
        "confidence": number,
        "warnings": string[]
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
