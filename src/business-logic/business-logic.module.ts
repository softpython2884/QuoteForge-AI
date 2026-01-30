import { Module } from '@nestjs/common';
import { RulesService } from './rules/rules.service';
import { RulesEngine } from './rules/rules.engine';

@Module({
    providers: [RulesService, RulesEngine],
    exports: [RulesService, RulesEngine],
})
export class BusinessLogicModule { }
