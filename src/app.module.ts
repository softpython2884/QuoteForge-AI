import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { CatalogModule } from './catalog/catalog.module';
import { BusinessLogicModule } from './business-logic/business-logic.module';
import { AiModule } from './ai/ai.module';
import { QuotesModule } from './quotes/quotes.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CommonModule,
    CatalogModule,
    BusinessLogicModule,
    AiModule,
    QuotesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
