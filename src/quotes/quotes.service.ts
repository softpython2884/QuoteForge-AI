import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import { RulesEngine } from '../business-logic/rules/rules.engine';
import { GenerateQuoteDto } from './dto/generate-quote.dto';
import { Quote, Rule } from '@prisma/client';

@Injectable()
export class QuotesService {
    private readonly logger = new Logger(QuotesService.name);

    constructor(
        private prisma: PrismaService,
        private aiService: AiService,
        private rulesEngine: RulesEngine
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
            // Simple Matcher Strategy (Can be extracted to a service)
            const product = await this.prisma.product.findFirst({
                where: {
                    companyId: dto.companyId,
                    name: { contains: item.material_hint, mode: 'insensitive' }
                }
            });

            if (!product) {
                validationErrors.push(`Product not found for hint: ${item.material_hint}`);
                continue;
            }

            // Base Calculation
            let unitPrice = Number(product.basePrice);
            let quantity = item.quantity;

            // Apply Rules (Deterministic)
            const context = {
                quantity,
                price: unitPrice,
                productCategory: product.category,
                appliedRules: []
            };
            const modifiedContext = this.rulesEngine.applyRules(context, rules);

            unitPrice = modifiedContext.price;

            const lineTotal = unitPrice * quantity;
            totalAmount += lineTotal;

            quoteLines.push({
                productId: product.id,
                description: item.description || product.name,
                quantity: quantity,
                unitPrice: unitPrice,
                totalPrice: lineTotal,
                metadata: {
                    originalAiItem: item,
                    appliedRules: modifiedContext.appliedRules
                }
            });
        }

        // 4. Create Quote in DB
        const quote = await this.prisma.quote.create({
            data: {
                companyId: dto.companyId,
                customerName: dto.customerName,
                reference: `Q-${Date.now()}`,
                inputPrompt: dto.requestText,
                aiResponse: aiResult,
                validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
                isValid: validationErrors.length === 0,
                totalAmount: totalAmount,
                lines: {
                    create: quoteLines
                }
            },
            include: { lines: true }
        });

        // 5. Audit Log
        await this.prisma.auditLog.create({
            data: {
                quoteId: quote.id,
                action: 'QUOTE_GENERATED',
                details: {
                    prompt: dto.requestText,
                    aiConfidence: aiResult.confidence,
                    rulesAppliedCount: quoteLines.length // Simplified
                }
            }
        });

        return quote;
    }

    async findAll() {
        return this.prisma.quote.findMany({ include: { lines: true } });
    }
}
