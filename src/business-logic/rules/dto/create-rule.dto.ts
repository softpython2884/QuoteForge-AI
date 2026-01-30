import { IsString, IsNotEmpty, IsInt, IsOptional, IsObject } from 'class-validator';

export class CreateRuleDto {
    @IsString()
    @IsNotEmpty()
    companyId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsInt()
    @IsOptional()
    priority?: number;

    @IsObject()
    conditions: Record<string, any>; // Strictly typed in Engine, loose here for storage

    @IsObject()
    actions: Record<string, any>;
}
