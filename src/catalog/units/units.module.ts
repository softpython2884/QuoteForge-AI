import { Module } from '@nestjs/common';
import { UnitsService } from './units.service';
import { UnitsController } from './units.controller';
import { PrismaService } from '../../common/prisma.service';

@Module({
    controllers: [UnitsController],
    providers: [UnitsService, PrismaService],
    exports: [UnitsService],
})
export class UnitsModule { }
