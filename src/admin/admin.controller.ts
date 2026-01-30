import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('logs')
    async getLogs(@Request() req) {
        return this.adminService.getAuditLogs(req.user.userId);
    }

    @Get('stats')
    async getStats(@Request() req) {
        return this.adminService.getCompanyStats(req.user.userId);
    }
}
