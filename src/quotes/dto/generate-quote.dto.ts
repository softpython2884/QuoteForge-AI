import { IsString, IsNotEmpty, IsUUID, IsArray, IsOptional } from 'class-validator';

export class GenerateQuoteDto {
    @IsString()
    @IsNotEmpty()
    companyId: string;

    @IsString()
    @IsNotEmpty()
    requestText: string;

    @IsString()
    @IsNotEmpty()
    @IsString()
    @IsNotEmpty()
    customerName: string;

    @IsArray()
    @IsOptional()
    images?: string[]; // Array of Base64 strings
}
