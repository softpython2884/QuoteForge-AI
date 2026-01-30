import { Module } from '@nestjs/common';
import { ProductMatcherService } from './product-matcher.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
    providers: [ProductMatcherService, PrismaService],
    exports: [ProductMatcherService],
})
export class MatcherModule { }
