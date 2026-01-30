import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { AiModule } from '../ai/ai.module';
import { BusinessLogicModule } from '../business-logic/business-logic.module';

@Module({
    imports: [AiModule, BusinessLogicModule],
    controllers: [QuotesController],
    providers: [QuotesService],
})
export class QuotesModule { }
