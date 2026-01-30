import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { GenerateQuoteDto } from './dto/generate-quote.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('quotes')
@UseGuards(JwtAuthGuard)
export class QuotesController {
    constructor(private readonly quotesService: QuotesService) { }

    @Post('generate')
    generate(@Request() req: any, @Body() dto: GenerateQuoteDto) {
        // Override companyId from Token for security
        dto.companyId = req.user.userId;
        return this.quotesService.generateFromText(dto);
    }

    @Get()
    findAll(@Request() req: any) {
        // In real app, filter by req.user.userId
        return this.quotesService.findAll();
    }
}
