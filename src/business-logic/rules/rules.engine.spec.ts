import { Test, TestingModule } from '@nestjs/testing';
import { RulesEngine } from './rules.engine';
import { Rule } from '@prisma/client';

describe('RulesEngine', () => {
    let service: RulesEngine;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [RulesEngine],
        }).compile();

        service = module.get<RulesEngine>(RulesEngine);
    });

    it('should apply discount when condition is met', () => {
        const rules: Partial<Rule>[] = [
            {
                id: '1',
                name: 'Bulk Discount',
                conditions: { field: 'quantity', operator: 'gte', value: 10 },
                actions: { type: 'DISCOUNT_PERCENT', value: 0.1 },
                priority: 1,
                companyId: 'test',
                createdAt: new Date(),
                updatedAt: new Date(),
                description: ''
            },
        ];

        const context = { quantity: 15, price: 100, appliedRules: [] };
        const result = service.applyRules(context, rules as Rule[]);

        expect(result.price).toBe(90); // 100 * 0.9
        expect(result.appliedRules).toContain('DISCOUNT_PERCENT_0.1');
    });

    it('should NOT apply discount when condition is NOT met', () => {
        const rules: Partial<Rule>[] = [
            {
                id: '1',
                name: 'Bulk Discount',
                conditions: { field: 'quantity', operator: 'gte', value: 50 },
                actions: { type: 'DISCOUNT_PERCENT', value: 0.1 },
                priority: 1,
                companyId: 'test',
                createdAt: new Date(),
                updatedAt: new Date(),
                description: ''
            },
        ];

        const context = { quantity: 10, price: 100, appliedRules: [] };
        const result = service.applyRules(context, rules as Rule[]);

        expect(result.price).toBe(100);
        expect(result.appliedRules.length).toBe(0);
    });
});
