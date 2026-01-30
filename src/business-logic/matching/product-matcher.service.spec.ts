import { Test, TestingModule } from '@nestjs/testing';
import { ProductMatcherService } from './product-matcher.service';
import { PrismaService } from '../../common/prisma.service';

describe('ProductMatcherService', () => {
    let service: ProductMatcherService;

    const mockPrismaService = {
        product: {
            findMany: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductMatcherService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<ProductMatcherService>(ProductMatcherService);
    });

    it('should match items with overlapping words', async () => {
        const products = [
            { id: '1', name: 'Oak Flooring', category: 'FLOORING' },
            { id: '2', name: 'White Paint', category: 'PAINTING' }
        ];
        mockPrismaService.product.findMany.mockResolvedValue(products);

        const match = await service.findBestMatch('comp1', 'Flooring Oak');

        expect(match).toBeDefined();
        expect(match.product.id).toBe('1');
        expect(match.score).toBeGreaterThan(0.5);
    });

    it('should return null if score is too low', async () => {
        const products = [
            { id: '1', name: 'Oak Flooring', category: 'FLOORING' },
        ];
        mockPrismaService.product.findMany.mockResolvedValue(products);

        const match = await service.findBestMatch('comp1', 'Banana Smoothie');

        expect(match).toBeNull();
    });

    it('should filter out garbage matches (Regression: Door Handle vs Wall)', async () => {
        const products = [
            { id: 'p1', name: 'Door Handle Modern', category: 'CARPENTRY', material: 'Steel' }
        ];
        mockPrismaService.product.findMany.mockResolvedValue(products);

        // Score was ~0.31
        const query = "le mute c genre un gros cube avec un mure de 1M8 de haut j'le veut en blanc";
        const match = await service.findBestMatch('comp1', query);

        expect(match).toBeNull();
    });
});
