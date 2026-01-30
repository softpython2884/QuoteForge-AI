import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async findAll(companyId: string) {
        // In a real app, join with User or Quote to get context
        return this.prisma.auditLog.findMany({
            where: { quote: { companyId } },
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: { quote: true }
        });
    }
}
