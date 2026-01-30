import { IsString, IsNotEmpty, IsNumber, IsOptional, IsUUID, IsArray } from 'class-validator';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    companyId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    sku?: string;

    @IsNumber()
    basePrice: number;

    @IsString()
    @IsNotEmpty()
    currency: string;

    @IsUUID()
    unitId: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];
}
