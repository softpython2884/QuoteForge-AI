import { Controller, Post, Body, Get, UseGuards, Request, Query, Param } from '@nestjs/common';
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
    findAll(@Request() req: any, @Query('customerEmail') email?: string) {
        // For Client Portal: Filter by customer or return all for Admin
        if (email) {
            return this.quotesService.findByCustomer(email);
        }
        return this.quotesService.findAll(req.user.companyId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.quotesService.findOne(id);
    }
}
