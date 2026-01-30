import { Module } from '@nestjs/common';
import { UnitsService } from './units.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
    providers: [UnitsService, PrismaService],
    exports: [UnitsService],
})
export class UnitsModule { }
