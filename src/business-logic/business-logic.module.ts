import { Module } from '@nestjs/common';
import { RulesModule } from './rules/rules.module';
import { PricingModule } from './pricing/pricing.module';
import { MatcherModule } from './matching/matcher.module';

@Module({
    imports: [RulesModule, PricingModule, MatcherModule],
    exports: [RulesModule, PricingModule, MatcherModule],
})
export class BusinessLogicModule { }
