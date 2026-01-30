import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import { RulesEngine } from '../business-logic/rules/rules.engine';
import { UnitConversionService } from '../business-logic/units/unit-conversion.service';
import { GenerateQuoteDto } from './dto/generate-quote.dto';
import { Quote, Rule } from '@prisma/client';

@Injectable()
export class QuotesService {
    private readonly logger = new Logger(QuotesService.name);

    constructor(
        private prisma: PrismaService,
        private aiService: AiService,
        private rulesEngine: RulesEngine,
        private conversionService: UnitConversionService
    ) { }

    async generateFromText(dto: GenerateQuoteDto) {
        this.logger.log(`Processing quote request for: ${dto.customerName}`);

        // 1. AI Extraction
        const aiResult = await this.aiService.extractEntities(dto.requestText);
        this.logger.log(`AI Extraction complete. Confidence: ${aiResult.confidence}`);

        if (aiResult.confidence < 0.7) {
            throw new Error("AI Confidence too low. Please provide more details.");
        }

        // 2. Fetch Rules
        const rules = await this.prisma.rule.findMany({ where: { companyId: dto.companyId } });

        // 3. Build Line Items
        const quoteLines = [];
        const validationErrors = [];
        let totalAmount = 0;

        for (const item of aiResult.items) {
            // Simple Matcher Strategy
            const product = await this.prisma.product.findFirst({
                where: {
                    companyId: dto.companyId,
                    name: { contains: item.material_hint }
                },
                include: { unit: true }
            });

            if (!product) {
                validationErrors.push(`Product not found for hint: ${item.material_hint}`);
                continue;
            }

            let unitPrice = Number(product.basePrice);
            let quantity = item.quantity; // e.g. 60 (m2)

            // Unit Conversion / Packaging Logic
            // If product is sold in packs but requested in m2, we need to convert.
            // For MVP, if product has a `unit` that differs from the detected unit (string), logic needed.
            // Here we assume mapping is done via simple lookup or the product metadata implies coverage.
            // MOCK: Checking if product description contains coverage info or using a standard packaging factor.
            // Ideally, Product model should have 'packagingSize' field. We will simulate it.
            const packagingSize = 1.0; // Assume 1 unit = 1 unit for now, or fetch from product properties

            const finalQuantity = this.conversionService.calculatePacks(quantity, packagingSize);

            // Apply Rules (Deterministic)
            const context = {
                quantity: finalQuantity,
                price: unitPrice,
                productCategory: product.category,
                appliedRules: []
            };
            const modifiedContext = this.rulesEngine.applyRules(context, rules);

            unitPrice = modifiedContext.price;

            const lineTotal = unitPrice * finalQuantity;
            totalAmount += lineTotal;

            quoteLines.push({
                productId: product.id,
                description: item.description || product.name,
                quantity: finalQuantity,
                unitPrice: unitPrice,
                totalPrice: lineTotal,
                metadata: {
                    originalAiItem: item,
                    appliedRules: modifiedContext.appliedRules,
                    originalQuantity: quantity
                }
            });
        }

        // Anti-Hallucination: Check for zero price
        if (totalAmount <= 0) {
            validationErrors.push("Total amount is zero. Check pricing rules.");
        }

        // 4. Create Quote in DB
        const quote = await this.prisma.quote.create({
            data: {
                companyId: dto.companyId,
                customerName: dto.customerName,
                reference: `Q-${Date.now()}`,
                inputPrompt: dto.requestText,
                aiResponse: JSON.stringify(aiResult), // SQLite String
                validationErrors: validationErrors.length > 0 ? JSON.stringify(validationErrors) : undefined,
                isValid: validationErrors.length === 0,
                totalAmount: totalAmount,
                lines: {
                    create: quoteLines.map(line => ({
                        ...line,
                        metadata: line.metadata ? JSON.stringify(line.metadata) : undefined
                    }))
                }
            },
            include: { lines: true }
        });

        // 5. Audit Log
        await this.prisma.auditLog.create({
            data: {
                quoteId: quote.id,
                action: 'QUOTE_GENERATED',
                details: JSON.stringify({
                    prompt: dto.requestText,
                    aiConfidence: aiResult.confidence,
                    rulesAppliedCount: quoteLines.length
                })
            }
        });

        return quote;
    }

    async findAll() {
        return this.prisma.quote.findMany({ include: { lines: true } });
    }
}
