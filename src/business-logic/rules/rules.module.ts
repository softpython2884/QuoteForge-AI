import { Module } from '@nestjs/common';
import { RulesService } from './rules.service';
import { RulesEngine } from './rules.engine';
import { RulesController } from './rules.controller';
import { PrismaService } from '../../common/prisma.service';

@Module({
    controllers: [RulesController],
    providers: [RulesService, RulesEngine, PrismaService],
    exports: [RulesService, RulesEngine],
})
export class RulesModule { }
