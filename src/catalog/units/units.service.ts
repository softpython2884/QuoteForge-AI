import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class UnitsService {
    private readonly logger = new Logger(UnitsService.name);

    constructor(private prisma: PrismaService) { }

    async findAll(companyId: string) {
        return this.prisma.unit.findMany({ where: { companyId } });
    }

    /**
     * Converts a value from one unit to another.
     * @param companyId 
     * @param value 
     * @param fromUnitId 
     * @param toUnitId 
     * @returns Converted value or null if not possible
     */
    async convert(companyId: string, value: number, fromUnitId: string, toUnitId: string): Promise<number> {
        if (fromUnitId === toUnitId) return value;

        // 1. Direct Conversion (A -> B)
        const direct = await this.prisma.unitConversion.findFirst({
            where: { companyId, fromUnitId, toUnitId }
        });

        if (direct) {
            return value * Number(direct.factor);
        }

        // 2. Reverse Conversion (B -> A)
        const reverse = await this.prisma.unitConversion.findFirst({
            where: { companyId, fromUnitId: toUnitId, toUnitId: fromUnitId }
        });

        if (reverse) {
            return value / Number(reverse.factor);
        }

        this.logger.warn(`No conversion found from ${fromUnitId} to ${toUnitId}`);
        // Return original value? Or throw error?
        // For QuoteForge, if we can't convert, we might just return the value but flag a warning
        // Or in strict mode, throw error.
        throw new Error(`Cannot convert from ${fromUnitId} to ${toUnitId}`);
    }
}
