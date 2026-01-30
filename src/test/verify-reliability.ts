import { Test, TestingModule } from '@nestjs/testing';
import { ProductMatcherService } from '../business-logic/matching/product-matcher.service';
import { PrismaService } from '../common/prisma.service';

async function run() {
    // Mock Prisma
    const mockPrisma = {
        product: {
            findMany: jest.fn().mockResolvedValue([
                {
                    name: 'Door Handle Modern',
                    category: 'CARPENTRY',
                    material: 'Steel',
                    tags: 'door,handle,modern'
                }
            ])
        }
    };

    const moduleRef = await Test.createTestingModule({
        providers: [
            ProductMatcherService,
            { provide: PrismaService, useValue: mockPrisma }
        ],
    }).compile();

    const matcher = moduleRef.get<ProductMatcherService>(ProductMatcherService);

    console.log('--- Verification: Matcher Threshold ---');
    const query = "le mute c genre un gros cube avec un mure de 1M8 de haut j'le veut en blanc";
    const result = await matcher.findBestMatch('comp_1', query);

    console.log(`Query: "${query}"`);
    if (result) {
        console.log(`❌ MATCH FOUND (Unexpected): ${result.product.name} (Score: ${result.score})`);
        console.log('FAIL: Threshold did not filter out garbage match.');
    } else {
        console.log('✅ NO MATCH FOUND (Expected).');
        console.log('SUCCESS: Threshold successfully filtered out low-score match.');
    }
}

run();
