import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class UnitConversionService {
    constructor(private prisma: PrismaService) { }

    /**
     * Converts a quantity from a source unit to a target unit.
     * If target unit is a "packaging" unit (matches a product's packaging), applies rounding up.
     */
    async convert(quantity: number, fromUnitId: string, toUnitId: string): Promise<number> {
        if (fromUnitId === toUnitId) {
            return quantity;
        }

        // In a real system, we would query a ConversionRule table.
        // Schema: Rule(fromUnitId, toUnitId, factor)
        // For MVP, we mock or use specific logic.
        // Example logic: DB query for specific conversion rule
        /*
        const rule = await this.prisma.conversionRule.findFirst({
            where: { fromUnitId, toUnitId }
        });
        if (rule) return quantity * rule.factor;
        */

        // Placeholder for now as we don't have a populated ConversionRule table in the seed
        return quantity;
    }

    /**
     * Calculates how many packs are needed for a given surface/quantity.
     * @param quantityRequired total amount needed (e.g., 30 m2)
     * @param itemsPerPack how much 1 pack covers (e.g., 1.5 m2)
     */
    calculatePacks(quantityRequired: number, itemsPerPack: number): number {
        if (itemsPerPack <= 0) return quantityRequired; // Safety
        return Math.ceil(quantityRequired / itemsPerPack);
    }
}
