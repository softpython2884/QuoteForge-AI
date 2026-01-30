import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { CreateRuleDto } from './dto/create-rule.dto';

@Injectable()
export class RulesService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateRuleDto) {
        return this.prisma.rule.create({
            data,
        });
    }

    async findAll(companyId: string) {
        return this.prisma.rule.findMany({
            where: { companyId },
            orderBy: { priority: 'desc' },
        });
    }
}
