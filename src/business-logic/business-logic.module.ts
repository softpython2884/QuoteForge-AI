import { Module } from '@nestjs/common';
import { RulesService } from './rules/rules.service';
import { RulesEngine } from './rules/rules.engine';
import { UnitConversionService } from './units/unit-conversion.service';

@Module({
    providers: [RulesService, RulesEngine, UnitConversionService],
    exports: [RulesService, RulesEngine, UnitConversionService],
})
export class BusinessLogicModule { }
