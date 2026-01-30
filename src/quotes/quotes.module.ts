import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { AiModule } from '../ai/ai.module';
import { MatcherModule } from '../business-logic/matching/matcher.module';
import { PricingModule } from '../business-logic/pricing/pricing.module';

@Module({
    imports: [AiModule, MatcherModule, PricingModule],
    controllers: [QuotesController],
    providers: [QuotesService],
})
export class QuotesModule { }
