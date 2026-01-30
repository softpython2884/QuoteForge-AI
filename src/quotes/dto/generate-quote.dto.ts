import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class GenerateQuoteDto {
    @IsString()
    @IsNotEmpty()
    companyId: string;

    @IsString()
    @IsNotEmpty()
    requestText: string;

    @IsString()
    @IsNotEmpty()
    customerName: string;
}
