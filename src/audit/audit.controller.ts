import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit-logs')
export class AuditController {
    constructor(private auditService: AuditService) { }

    @Get()
    async findAll(@Query('companyId') companyId: string) {
        return this.auditService.findAll(companyId);
    }
}
