import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';
import { RulesService } from '../rules/rules.service';
import { UnitsService } from '../../catalog/units/units.service';

describe('PricingService', () => {
    let service: PricingService;
    let rulesService: RulesService;
    let unitsService: UnitsService;

    const mockRulesService = {
        findAll: jest.fn(),
        evaluate: jest.fn(),
    };

    const mockUnitsService = {
        convert: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PricingService,
                { provide: RulesService, useValue: mockRulesService },
                { provide: UnitsService, useValue: mockUnitsService },
            ],
        }).compile();

        service = module.get<PricingService>(PricingService);
        rulesService = module.get<RulesService>(RulesService);
        unitsService = module.get<UnitsService>(UnitsService);
    });

    it('should calculate base price correctly without rules', async () => {
        const product = { id: 'p1', basePrice: 10, unitId: 'u1', currency: 'EUR' };
        mockRulesService.findAll.mockResolvedValue([]);
        mockRulesService.evaluate.mockReturnValue([]);

        const result = await service.calculateLinePrice(product, 5, 'u1', 'comp1');

        expect(result.subTotal).toBe(50);
        expect(result.total).toBe(50);
        expect(result.quantity).toBe(5);
    });

    it('should apply discount rule correctly', async () => {
        const product = { id: 'p1', basePrice: 10, unitId: 'u1', currency: 'EUR' };
        mockRulesService.findAll.mockResolvedValue([{ id: 'r1' }]);
        mockRulesService.evaluate.mockReturnValue([
            { ruleId: 'r1', name: 'Discount', action: { type: 'DISCOUNT_PERCENT', value: 0.1 } }
        ]);

        const result = await service.calculateLinePrice(product, 10, 'u1', 'comp1');

        // 10 * 10 = 100 base.
        // Discount 10% = 10.
        // Total = 90.
        expect(result.subTotal).toBe(100);
        expect(result.total).toBe(90);
        expect(result.appliedRules.length).toBe(1);
    });

    it('should handle unit conversion', async () => {
        const product = { id: 'p1', basePrice: 100, unitId: 'u_pack', currency: 'EUR' };
        // Request in m2. 1 Pack = 2 m2.
        // Request 10 m2 -> 5 Packs.

        mockUnitsService.convert.mockResolvedValue(5); // 10 m2 -> 5 Packs
        mockRulesService.findAll.mockResolvedValue([]);
        mockRulesService.evaluate.mockReturnValue([]);

        const result = await service.calculateLinePrice(product, 10, 'u_m2', 'comp1');

        expect(result.quantity).toBe(5); // Converted quantity
        expect(result.subTotal).toBe(500); // 5 packs * 100
        expect(result.total).toBe(500);
    });
});
