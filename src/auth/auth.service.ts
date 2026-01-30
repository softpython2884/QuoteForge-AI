import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService
    ) { }

    async validateCompany(apiKey: string): Promise<any> {
        // For MVP, we treat the Company ID or a basic key as the credential
        const company = await this.prisma.company.findUnique({
            where: { id: apiKey }, // In real app, search by API Key field
        });
        if (!company) {
            return null;
        }
        return company;
    }

    async login(companyId: string) {
        const company = await this.validateCompany(companyId);
        if (!company) {
            throw new UnauthorizedException('Invalid Company ID');
        }
        const payload = { sub: company.id, name: company.name };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
