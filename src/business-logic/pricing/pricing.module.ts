import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { RulesModule } from '../rules/rules.module';
import { UnitsModule } from '../../catalog/units/units.module';

@Module({
    imports: [RulesModule, UnitsModule],
    providers: [PricingService],
    exports: [PricingService],
})
export class PricingModule { }
