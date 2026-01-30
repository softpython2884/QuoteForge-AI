import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    create(@Body() createProductDto: CreateProductDto) {
        return this.productsService.create(createProductDto);
    }

    @Get()
    findAll(@Query('companyId') companyId: string) {
        return this.productsService.findAll(companyId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    @Post(':id') // Using POST for update/patch flexibility if METHOD issues arise, but ideally PATCH
    update(@Param('id') id: string, @Body() body: any) {
        return this.productsService.update(id, body);
    }

    @Post(':id/delete') // Explicit delete path to avoid verb confusion in simple setups
    delete(@Param('id') id: string) {
        return this.productsService.delete(id);
    }
}
