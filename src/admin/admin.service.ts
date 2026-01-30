import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async getAuditLogs(companyId: string) {
        // In a real multi-tenant system, ensure we only return logs for the company
        return this.prisma.auditLog.findMany({
            where: { quote: { companyId } },
            include: { quote: true },
            orderBy: { timestamp: 'desc' },
            take: 100
        });
    }

    async getCompanyStats(companyId: string) {
        const quoteCount = await this.prisma.quote.count({ where: { companyId } });
        const productCount = await this.prisma.product.count({ where: { companyId } });

        return {
            quoteCount,
            productCount
        };
    }
}
