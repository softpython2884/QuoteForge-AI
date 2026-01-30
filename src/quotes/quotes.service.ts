import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import { ProductMatcherService } from '../business-logic/matching/product-matcher.service';
import { PricingService } from '../business-logic/pricing/pricing.service';
import { GenerateQuoteDto } from './dto/generate-quote.dto';
import { Quote } from '@prisma/client';

@Injectable()
export class QuotesService {
    private readonly logger = new Logger(QuotesService.name);

    constructor(
        private prisma: PrismaService,
        private aiService: AiService,
        private matcherService: ProductMatcherService,
        private pricingService: PricingService
    ) { }

    async generateFromText(dto: GenerateQuoteDto) {
        this.logger.log(`Processing quote request for: ${dto.customerName}`);

        // 1. AI Extraction (Understanding)
        const aiResult = await this.aiService.extractEntities(dto.requestText, dto.images);
        this.logger.log(`AI Confidence: ${aiResult.confidence} | Intent: ${aiResult.intent}`);

        // 2. Validation
        if (aiResult.confidence < 0.70) {
            // In Production, maybe flag for human review instead of error
            this.logger.warn(`Low confidence score.`);
        }

        const quoteLines = [];
        const validationErrors = [];
        let totalAmount = 0;

        // 3. Orchestration Loop
        for (const item of aiResult.items) {
            // A. Product Matcher
            // Use material_hint or description as search query
            const query = `${item.material_hint || ''} ${item.description}`;
            const match = await this.matcherService.findBestMatch(dto.companyId, query, item.category_hint);

            if (!match) {
                validationErrors.push(`No product found for description: "${item.description}"`);
                continue;
            }

            const product = match.product;
            this.logger.debug(`Matched "${query}" -> ${product.name} (Score: ${match.score})`);

            // B. Pricing Engine (Strict Math)
            try {
                // Ensure Quantity logic (if AI gives 0, assume 1 or flag error)
                const qty = item.quantity > 0 ? item.quantity : 1;
                const unit = item.unit || 'pc'; // Default to piece if missing

                const pricing = await this.pricingService.calculateLinePrice(product, qty, unit, dto.companyId);

                totalAmount += pricing.total;

                quoteLines.push({
                    productId: product.id,
                    description: item.description, // User text
                    quantity: pricing.quantity, // Converted Quantity (e.g. Packs)
                    unitPrice: pricing.unitPrice,
                    totalPrice: pricing.total,
                    metadata: {
                        matchScore: match.score,
                        aiOriginal: item,
                        pricingTrace: pricing.appliedRules, // List of rules applied
                        requestedQty: qty,
                        requestedUnit: unit
                    }
                });

            } catch (e) {
                this.logger.error(`Pricing Error for ${product.name}`, e.message);
                validationErrors.push(`Pricing Error for ${product.name}: ${e.message}`);
            }
        }

        // 4. Persistence
        const quote = await this.prisma.quote.create({
            data: {
                companyId: dto.companyId,
                customerName: dto.customerName,
                reference: `Q-${Date.now().toString().slice(-6)}`,
                inputPrompt: dto.requestText,
                aiResponse: JSON.stringify(aiResult),
                validationErrors: validationErrors.length > 0 ? JSON.stringify(validationErrors) : null,
                isValid: validationErrors.length === 0,
                totalAmount: totalAmount,
                lines: {
                    create: quoteLines.map(line => ({
                        productId: line.productId,
                        description: line.description,
                        quantity: line.quantity,
                        unitPrice: line.unitPrice,
                        totalPrice: line.totalPrice,
                        metadata: JSON.stringify(line.metadata)
                    }))
                }
            },
            include: { lines: true }
        });

        // 5. Audit
        await this.prisma.auditLog.create({
            data: {
                quoteId: quote.id,
                action: 'QUOTE_GENERATED',
                details: JSON.stringify({
                    aiConfidence: aiResult.confidence,
                    itemCount: quoteLines.length,
                    errors: validationErrors
                })
            }
        });

        return quote;
    }

    async findAll(companyId?: string) {
        const where = companyId ? { companyId } : {};
        return this.prisma.quote.findMany({ where, include: { lines: true }, orderBy: { createdAt: 'desc' } });
    }

    async findOne(id: string) {
        const quote = await this.prisma.quote.findUnique({
            where: { id },
            include: { lines: true, auditLogs: true }
        });
        if (!quote) throw new NotFoundException('Quote not found');
        return quote;
    }

    async findByCustomer(email: string) {
        return this.prisma.quote.findMany({
            where: { customerEmail: email }, // Assuming customerEmail is populated or we filter by name for now? Schema has customerEmail
            include: { lines: true },
            orderBy: { createdAt: 'desc' }
        });
    }
}
