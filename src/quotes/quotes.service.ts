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

        // 1. Fetch Catalog for AI Context
        const catalog = await this.prisma.product.findMany({
            where: { companyId: dto.companyId },
            include: { unit: true }
        });

        // 2. AI Entity Extraction (with Catalog Context)
        const aiResult = await this.aiService.extractEntities(dto.requestText, dto.images, catalog);
        this.logger.debug(`AI Extracted items: ${JSON.stringify(aiResult.items)}`);
        this.logger.log(`AI Confidence: ${aiResult.confidence} | Intent: ${aiResult.intent}`);

        // 2. Validation (AI Service now handles confidence internally, or flags for review)
        // If aiResult.confidence < 0.70, the AI service might have already handled it
        // or returned a specific status. For now, we proceed.

        const quoteLines = [];
        const validationErrors = [];
        let totalAmount = 0;

        // 3. Orchestration Loop
        for (const item of aiResult.items) {
            // A. Product Matcher
            const query = item.description;
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

                // Normalization: Map AI symbols to DB Unit IDs
                const unitMap: Record<string, string> = {
                    'm2': 'unit_m2',
                    'lm': 'unit_lm',
                    'pc': 'unit_pc',
                    'hr': 'unit_hr',
                    'h': 'unit_hr',
                    'L': 'unit_l',
                    'box': 'unit_box',
                    'gb': 'unit_gb',
                    'GB': 'unit_gb'
                };
                const unit = unitMap[item.unit] || item.unit || 'unit_pc';

                const pricing = await this.pricingService.calculateLinePrice(product, qty, unit, dto.companyId);

                totalAmount += pricing.total;

                quoteLines.push({
                    productId: product.id,
                    description: product.name, // Use actual DB name for professional quote
                    quantity: pricing.quantity, // Converted Quantity (e.g. Packs)
                    unitPrice: pricing.unitPrice,
                    totalPrice: pricing.total,
                    metadata: {
                        matchScore: match.score,
                        aiOriginal: item,
                        pricingTrace: pricing.appliedRules, // List of rules applied
                        requestedQty: qty,
                        requestedUnit: unit,
                        unitSymbol: product.unit?.symbol || 'pc'
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

        // 5. Global Rules (Bundles/Promos on total)
        const dbCategories: string[] = [];
        for (const line of quoteLines) {
            const p = await this.prisma.product.findUnique({ where: { id: line.productId } });
            if (p?.category) dbCategories.push(p.category);
        }

        const globalRules = await this.prisma.rule.findMany({ where: { companyId: dto.companyId } });
        const globalApplied = [];
        let finalTotal = totalAmount;

        for (const rule of globalRules) {
            const conditions = JSON.parse(rule.conditions);
            const actions = JSON.parse(rule.actions);

            if (conditions.require_categories) {
                const hasAll = (conditions.require_categories as string[]).every((cat: string) => dbCategories.includes(cat));
                if (hasAll) {
                    if (actions.type === 'DISCOUNT_PERCENT') {
                        const discount = finalTotal * (Number(actions.value) / 100);
                        finalTotal -= discount;
                        globalApplied.push(`Bundle: ${rule.name} (-${discount.toFixed(2)}€)`);
                    }
                }
            }
        }

        if (globalApplied.length > 0) {
            await this.prisma.quote.update({
                where: { id: quote.id },
                data: {
                    totalAmount: finalTotal,
                    validationErrors: quote.validationErrors ? JSON.stringify([...JSON.parse(quote.validationErrors), ...globalApplied]) : JSON.stringify(globalApplied)
                }
            });
        }

        // 6. Audit
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
