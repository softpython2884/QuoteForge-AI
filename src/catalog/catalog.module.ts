import { Module } from '@nestjs/common';
import { ProductsService } from './products/products.service';
import { ProductsController } from './products/products.controller';
import { UnitsModule } from './units/units.module';

@Module({
    imports: [UnitsModule],
    controllers: [ProductsController],
    providers: [ProductsService],
    exports: [UnitsModule, ProductsService]
})
export class CatalogModule { }
