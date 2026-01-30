import { Injectable, Logger } from '@nestjs/common';
import { RulesService } from '../rules/rules.service';
import { UnitsService } from '../../catalog/units/units.service'; // Adjust path if needed

@Injectable()
export class PricingService {
    private readonly logger = new Logger(PricingService.name);

    constructor(
        private rulesService: RulesService,
        private unitsService: UnitsService
    ) { }

    /**
     * Calculates the price for a single line item.
     * @param product The product object (must include .unit)
     * @param quantity The requested quantity
     * @param requestedUnitId The unit of the quantity
     * @param companyId Context for rules/conversions
     */
    async calculateLinePrice(product: any, quantity: number, requestedUnitId: string, companyId: string) {
        const basePrice = Number(product.basePrice);

        // 1. Unit Conversion
        // We need to match Product Unit.
        const productUnitId = product.unitId;
        let finalQuantity = quantity;
        let conversionFactor = 1;

        if (requestedUnitId !== productUnitId) {
            const converted = await this.unitsService.convert(companyId, quantity, requestedUnitId, productUnitId);
            if (converted === null) {
                throw new Error(`Conversion failed from ${requestedUnitId} to ${productUnitId}`);
            }
            finalQuantity = converted;

            // Round up for discrete units (Packaging/Pieces)
            const discreteUnits = ['unit_pc', 'unit_roll', 'unit_box'];
            if (discreteUnits.includes(productUnitId)) {
                const rounded = Math.ceil(finalQuantity);
                if (rounded !== finalQuantity) {
                    this.logger.log(`Rounding up ${finalQuantity} to ${rounded} for discrete unit ${productUnitId}`);
                    finalQuantity = rounded;
                }
            }

            conversionFactor = finalQuantity / quantity;
        }

        // 2. Base Total
        let total = basePrice * finalQuantity;

        // 3. Rules Application
        const rules = await this.rulesService.findAll(companyId);
        const context = {
            quantity: finalQuantity,
            amount: total,
            productId: product.id,
            category: product.category
        };

        const appliedRules = this.rulesService.evaluate(rules, context);
        const trace = [];

        for (const r of appliedRules) {
            const action = r.action;
            if (action.type === 'DISCOUNT_PERCENT') {
                const discountAmount = total * Number(action.value);
                total -= discountAmount;
                trace.push(`Applied ${r.name}: -${discountAmount.toFixed(2)} (${action.value * 100}%)`);
            }
            // Add other rule types here (SURCHARGE, FIXED_DISCOUNT, etc.)
        }

        return {
            unitPrice: basePrice,
            quantity: finalQuantity, // Quantity in Product Units
            requestedQuantity: quantity,
            subTotal: basePrice * finalQuantity,
            total: total,
            appliedRules: trace,
            currency: product.currency
        };
    }
}
