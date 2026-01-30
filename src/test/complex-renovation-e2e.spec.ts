import { Test, TestingModule } from '@nestjs/testing';
import { QuotesService } from '../quotes/quotes.service';
import { AiService } from '../ai/ai.service';
import { AppModule } from '../app.module';
import { GenerateQuoteDto } from '../quotes/dto/generate-quote.dto';

describe('Complex Renovation E2E', () => {
    let app: TestingModule;
    let quotesService: QuotesService;

    // Increase timeout for AI & Chains
    jest.setTimeout(30000);

    const mockAiService = {
        extractEntities: jest.fn().mockResolvedValue({
            intent: 'NEW_QUOTE',
            confidence: 0.99,
            items: [
                {
                    description: '40 square meters of Oak Parquet',
                    quantity: 40,
                    unit: 'm2',
                    material_hint: 'Oak Solid Wood Parquet', // Exact Name
                    category_hint: 'FLOORING'
                },
                {
                    description: 'paint the walls, roughly 120 square meters',
                    quantity: 4,
                    unit: 'pc',
                    material_hint: 'Matte White Wall Paint', // Exact Name
                    category_hint: 'PAINTING'
                }
            ]
        })
    };

    beforeAll(async () => {
        app = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(AiService)
            .useValue(mockAiService)
            .compile();

        quotesService = app.get<QuotesService>(QuotesService);
    });

    it('should generate a valid quote for a full renovation request', async () => {
        const request = `
            I need to renovate my living room.
            It's about 40 square meters of Oak Parquet.
            I also need to paint the walls, roughly 120 square meters surface, using white matte paint.
        `;

        const dto: GenerateQuoteDto = {
            companyId: 'comp_1',
            customerName: 'Mr. E2E Test',
            requestText: request
        };

        console.log('--- STARTING E2E QUOTE GENERATION ---');
        const quote = await quotesService.generateFromText(dto);
        console.log('--- QUOTE GENERATED ---');
        console.log(`Reference: ${quote.reference}`);
        console.log(`Total Amount: ${quote.totalAmount} ${quote.currency}`);

        // Assertions
        expect(quote).toBeDefined();
        // Expect at least 2 lines (Flooring + Paint)
        expect(quote.lines.length).toBeGreaterThanOrEqual(2);

        // Check Items
        const flooring = quote.lines.find(l => l.description.includes('Oak') || l.description.includes('Parquet'));
        expect(flooring).toBeDefined();
        expect(Number(flooring.quantity)).toBeGreaterThan(0);

        const paint = quote.lines.find(l => l.description.toLowerCase().includes('paint'));
        expect(paint).toBeDefined();

        console.log('Applied Pricing Rules:', flooring.metadata);
    });

    afterAll(async () => {
        await app.close();
    });
});
