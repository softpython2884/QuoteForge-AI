import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service'; // Direct linkage for now
import { QuotesService } from '../quotes/quotes.service'; // Circular? Need refactor if so.
// Ideally, Documents Service should return text, and Controller calls QuoteService.

@Injectable()
export class DocumentsService {
    private readonly logger = new Logger(DocumentsService.name);

    constructor(private readonly aiService: AiService) { }

    async processDocument(file: Express.Multer.File, companyId: string) {
        this.logger.log(`Processing file: ${file.originalname} (${file.mimetype})`);

        // TODO: Integrate OCR.
        // For now, we assume simple text files or bypass.
        // In real implementation:
        // 1. Upload to S3/Local
        // 2. If PDF/Image -> Gemini Vision or Tesseract -> Text

        // MOCK: If it's a text file, read it. If binary, just send a placeholder.
        let content = "";
        if (file.mimetype === 'text/plain') {
            content = file.buffer.toString('utf-8');
        } else {
            // Fallback for demo
            content = "Rénovation de la cuisine. Pose de 40m2 de carrelage au sol.";
            this.logger.warn("Binary file received. Using mock content for demo.");
        }

        // Direct AI Extraction Test
        const extraction = await this.aiService.extractEntities(content);

        return {
            filename: file.originalname,
            extraction
        };
    }
}
