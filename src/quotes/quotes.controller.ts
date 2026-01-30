import { Controller, Post, Body, Get } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { GenerateQuoteDto } from './dto/generate-quote.dto';

@Controller('quotes')
export class QuotesController {
    constructor(private readonly quotesService: QuotesService) { }

    @Post('generate')
    generate(@Body() dto: GenerateQuoteDto) {
        return this.quotesService.generateFromText(dto);
    }

    @Get()
    findAll() {
        return this.quotesService.findAll();
    }
}
