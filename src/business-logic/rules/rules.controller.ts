import { Controller, Get, Post, Body, Query, Delete, Param } from '@nestjs/common';
import { RulesService } from './rules.service';
import { CreateRuleDto } from './dto/create-rule.dto';

@Controller('rules')
export class RulesController {
    constructor(private readonly rulesService: RulesService) { }

    @Post()
    create(@Body() createRuleDto: CreateRuleDto) {
        return this.rulesService.create(createRuleDto);
    }

    @Get()
    findAll(@Query('companyId') companyId: string) {
        return this.rulesService.findAll(companyId);
    }

    // Add Delete/Update if needed
}
