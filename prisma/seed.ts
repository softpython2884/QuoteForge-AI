import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database with REAL WORLD data...');

    // 1. Company
    const companyId = 'comp_1';
    await prisma.company.upsert({
        where: { id: companyId },
        update: {},
        create: { id: companyId, name: 'QuoteForge Construction Demo', address: '123 Innovation Blvd' },
    });

    // 2. Units
    const units = [
        { id: 'unit_m2', name: 'Square Meter', symbol: 'm2' },
        { id: 'unit_pack', name: 'Pack', symbol: 'box' },
        { id: 'unit_pc', name: 'Piece', symbol: 'pc' },
        { id: 'unit_l', name: 'Liter', symbol: 'L' },
        { id: 'unit_hr', name: 'Hour', symbol: 'h' },
    ];

    for (const u of units) {
        await prisma.unit.upsert({
            where: { id: u.id },
            update: {},
            create: { ...u, companyId },
        });
    }

    // 3. Products
    // Tags need to be a string in SQLite (CSV)
    const products = [
        // FLOORING
        { id: 'prod_oak', name: 'Premium Oak Parquet', category: 'FLOORING', basePrice: 55.00, unitId: 'unit_m2', tags: 'wood,parquet,premium' },
        { id: 'prod_tile', name: 'Ceramic Tiles White 60x60', category: 'FLOORING', basePrice: 32.50, unitId: 'unit_m2', tags: 'tile,ceramic,white' },
        { id: 'prod_lam', name: 'Budget Laminate Grey', category: 'FLOORING', basePrice: 15.00, unitId: 'unit_m2', tags: 'laminate,grey,cheap' },

        // PAINTING
        { id: 'prod_paint_w', name: 'Matte White Paint (10L)', category: 'PAINTING', basePrice: 45.00, unitId: 'unit_pc', tags: 'paint,white,indoor' }, // Sold per bucket (pc)
        { id: 'prod_primer', name: 'Universal Primer (5L)', category: 'PAINTING', basePrice: 20.00, unitId: 'unit_pc', tags: 'paint,primer' },

        // PLUMBING
        { id: 'prod_pipe', name: 'Copper Pipe 15mm', category: 'PLUMBING', basePrice: 8.50, unitId: 'unit_m2', tags: 'copper,pipe' }, // M2 used as linear meter proxy for simplicty or create meter unit
        { id: 'prod_faucet', name: 'Modern Kitchen Faucet', category: 'PLUMBING', basePrice: 120.00, unitId: 'unit_pc', tags: 'faucet,kitchen' },

        // LABOR
        { id: 'serv_install', name: 'General Installation Labor', category: 'SERVICE', basePrice: 50.00, unitId: 'unit_hr', tags: 'labor,work' },
    ];

    for (const p of products) {
        // Need to clean data for SQLite (remove array tags if we had them) -> logic handled in loop
        await prisma.product.upsert({
            where: { id: p.id },
            update: {},
            create: {
                id: p.id,
                companyId,
                name: p.name,
                category: p.category,
                basePrice: p.basePrice,
                unitId: p.unitId,
                tags: p.tags, // CSV String
            }
        });
    }

    // 4. Rules
    // Rule: Bulk Discount (> 50 units)
    await prisma.rule.upsert({
        where: { id: 'rule_bulk' },
        update: {},
        create: {
            id: 'rule_bulk',
            companyId,
            name: 'Big Project Discount',
            description: '10% off if buying more than 50 units',
            priority: 1,
            // SQLite stored as String
            conditions: JSON.stringify({ field: 'quantity', operator: 'gte', value: 50 }),
            actions: JSON.stringify({ type: 'DISCOUNT_PERCENT', value: 0.10 }),
        }
    });

    console.log('Seeding COMPLETE! Try asking for "60m2 of oak parquet" or "kitchen faucet".');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
