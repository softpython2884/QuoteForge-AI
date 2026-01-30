import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateProductDto) {
        const { tags, ...rest } = data;
        return this.prisma.product.create({
            data: {
                ...rest,
                tags: tags ? tags.join(',') : null, // SQLite Compat (Array -> String)
            },
            include: {
                unit: true,
            },
        });
    }

    async findAll(companyId: string) {
        return this.prisma.product.findMany({
            where: { companyId },
            include: {
                unit: true,
            },
        });
    }

    async findOne(id: string) {
        return this.prisma.product.findUnique({
            where: { id },
            include: { unit: true }
        });
    }
}
