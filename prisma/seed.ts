import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🏗️  Seeding database with COMPLETE Construction Catalog...');

    // 1. Company
    const companyId = 'comp_1';
    await prisma.company.upsert({
        where: { id: companyId },
        update: {},
        create: { id: companyId, name: 'QuoteForge Construction Demo', address: '123 Innovation Blvd' },
    });

    // 2. Units
    const unitsData = [
        { id: 'unit_m2', name: 'Square Meter', symbol: 'm2' },
        { id: 'unit_lm', name: 'Linear Meter', symbol: 'lm' },
        { id: 'unit_pc', name: 'Piece', symbol: 'pc' },
        { id: 'unit_box', name: 'Box', symbol: 'box' },
        { id: 'unit_l', name: 'Liter', symbol: 'L' },
        { id: 'unit_hr', name: 'Hour', symbol: 'h' },
        { id: 'unit_roll', name: 'Roll', symbol: 'roll' },
    ];

    for (const u of unitsData) {
        await prisma.unit.upsert({
            where: { id: u.id },
            update: {},
            create: { ...u, companyId },
        });
    }

    // 3. Conversions (e.g. Box of Tiles -> m2)
    // We assume some standard conversions for our demo products
    const conversions = [
        // 1 Box of 60x60cm tiles (4 tiles) = 1.44 m2
        { from: 'unit_box', to: 'unit_m2', factor: 1.44 },

        // 1 Roll of Glass Wool = 12 m2 (typical)
        { from: 'unit_roll', to: 'unit_m2', factor: 12.0 },

        // Metal Studs: Sold by Piece (unit_pc), often used as Linear Meters.
        // Assume 1 stud = 3.0m
        { from: 'unit_pc', to: 'unit_lm', factor: 3.0 },
    ];

    /*
      NOTE: For the "Determinisic" engine, we usually convert REQUESTED unit to PRODUCT unit.
      Ex: User asks 50m2. Product is sold in BOXES (1.44m2).
      We need: 50 / 1.44 = 34.72 -> 35 Boxes.
      So we need factor m2 -> box? Or box -> m2?
      If factor = 1.44 (Box -> m2).
      Qty = Request / Factor.
    */

    // We already have generic units. Let's add specific conversion for the demo company.
    for (const c of conversions) {
        await prisma.unitConversion.create({
            data: {
                companyId,
                fromUnitId: c.from,
                toUnitId: c.to,
                factor: c.factor
            }
        });
    }

    // 4. Products (The Big List)
    const products = [
        // --- FLOORING (Tiles) ---
        { name: 'Ceramic White Glossy', category: 'FLOORING', material: 'Ceramic', dimensions: '60x60cm', price: 25.00, unit: 'unit_m2' },
        { name: 'Ceramic Beige Matte', category: 'FLOORING', material: 'Ceramic', dimensions: '45x45cm', price: 22.00, unit: 'unit_m2' },
        { name: 'Porcelain Slate Effect', category: 'FLOORING', material: 'Porcelain', dimensions: '30x60cm', price: 45.00, unit: 'unit_m2' },
        { name: 'Mosaic Blue Bathroom', category: 'FLOORING', material: 'Glass', dimensions: '30x30cm', price: 80.00, unit: 'unit_m2' },
        { name: 'Marble Carrara Tiles', category: 'FLOORING', material: 'Marble', dimensions: '60x120cm', price: 120.00, unit: 'unit_m2' },

        // --- FLOORING (Wood) ---
        { name: 'Oak Solid Wood Parquet', category: 'FLOORING', material: 'Oak', dimensions: '14mm', price: 65.00, unit: 'unit_m2' },
        { name: 'Laminate Oak Finish', category: 'FLOORING', material: 'Laminate', dimensions: '8mm', price: 15.00, unit: 'unit_m2' },
        { name: 'Engineer Wood Walnut', category: 'FLOORING', material: 'Walnut', dimensions: '12mm', price: 55.00, unit: 'unit_m2' },
        { name: 'Bamboo Flooring', category: 'FLOORING', material: 'Bamboo', dimensions: '10mm', price: 40.00, unit: 'unit_m2' },

        // --- PAINTING ---
        { name: 'Matte White Wall Paint', category: 'PAINTING', material: 'Acrylic', dimensions: '10L', price: 45.00, unit: 'unit_pc' },
        { name: 'Satin White Trim Paint', category: 'PAINTING', material: 'Alkyd', dimensions: '2.5L', price: 35.00, unit: 'unit_pc' },
        { name: 'Primer All Surface', category: 'PAINTING', material: 'Latex', dimensions: '5L', price: 25.00, unit: 'unit_pc' },
        { name: 'Blue Navy Accent', category: 'PAINTING', material: 'Acrylic', dimensions: '2.5L', price: 30.00, unit: 'unit_pc' },
        { name: 'Exterior Facade Paint', category: 'PAINTING', material: 'Silicone', dimensions: '15L', price: 120.00, unit: 'unit_pc' },

        // --- PLUMBING ---
        { name: 'Copper Pipe 15mm', category: 'PLUMBING', material: 'Copper', dimensions: '15mm', price: 8.00, unit: 'unit_lm' },
        { name: 'Copper Pipe 22mm', category: 'PLUMBING', material: 'Copper', dimensions: '22mm', price: 12.00, unit: 'unit_lm' },
        { name: 'PVC Pipe 40mm', category: 'PLUMBING', material: 'PVC', dimensions: '40mm', price: 3.50, unit: 'unit_lm' },
        { name: 'Kitchen Faucet Chrome', category: 'PLUMBING', material: 'Metal', dimensions: 'Standard', price: 85.00, unit: 'unit_pc' },
        { name: 'Bathroom Mixer Tap', category: 'PLUMBING', material: 'Chrome', dimensions: 'Standard', price: 65.00, unit: 'unit_pc' },
        { name: 'Shower Head Rain', category: 'PLUMBING', material: 'Steel', dimensions: '30cm', price: 150.00, unit: 'unit_pc' },

        // --- ELECTRICITY ---
        { name: 'Electrical Cable 3G1.5', category: 'ELECTRICITY', material: 'Copper/PVC', dimensions: '1.5mm2', price: 0.80, unit: 'unit_lm' },
        { name: 'Electrical Cable 3G2.5', category: 'ELECTRICITY', material: 'Copper/PVC', dimensions: '2.5mm2', price: 1.20, unit: 'unit_lm' },
        { name: 'Socket Outlet White', category: 'ELECTRICITY', material: 'Plastic', dimensions: 'Standard', price: 5.00, unit: 'unit_pc' },
        { name: 'Light Switch Single', category: 'ELECTRICITY', material: 'Plastic', dimensions: 'Standard', price: 4.50, unit: 'unit_pc' },
        { name: 'Circuit Breaker 16A', category: 'ELECTRICITY', material: 'Plastic', dimensions: 'DIN', price: 12.00, unit: 'unit_pc' },

        // --- CARPENTRY / DOORS ---
        { name: 'Door Interior White', category: 'CARPENTRY', material: 'Wood Composite', dimensions: '204x73cm', price: 89.00, unit: 'unit_pc' },
        { name: 'Door Interior Oak', category: 'CARPENTRY', material: 'Oak Veneer', dimensions: '204x83cm', price: 149.00, unit: 'unit_pc' },
        { name: 'Door Handle Modern', category: 'CARPENTRY', material: 'Steel', dimensions: 'Standard', price: 25.00, unit: 'unit_pc' },
        { name: 'Skirting Board White', category: 'CARPENTRY', material: 'MDF', dimensions: '10cm', price: 5.00, unit: 'unit_lm' },

        // --- ISOLATION / DRYWALL ---
        { name: 'Gypsum Board Standard', category: 'DRYWALL', material: 'Gypsum', dimensions: '250x120cm', price: 12.00, unit: 'unit_pc' }, // roughly 4€/m2
        { name: 'Glass Wool Roll', category: 'INSULATION', material: 'Glass Wool', dimensions: '100mm', price: 45.00, unit: 'unit_roll' },
        { name: 'Metal Stud Profile', category: 'DRYWALL', material: 'Steel', dimensions: '48mm', price: 3.00, unit: 'unit_lm' },

        // --- SERVICES ---
        { name: 'Tiling Labor', category: 'LABOR', material: 'Service', dimensions: 'N/A', price: 45.00, unit: 'unit_hr' },
        { name: 'Painting Labor', category: 'LABOR', material: 'Service', dimensions: 'N/A', price: 40.00, unit: 'unit_hr' },
        { name: 'Plumbing Labor', category: 'LABOR', material: 'Service', dimensions: 'N/A', price: 60.00, unit: 'unit_hr' },
        { name: 'Electrical Labor', category: 'LABOR', material: 'Service', dimensions: 'N/A', price: 60.00, unit: 'unit_hr' },
        { name: 'General Installation', category: 'LABOR', material: 'Service', dimensions: 'N/A', price: 50.00, unit: 'unit_hr' },
    ];

    console.log(`Adding ${products.length} products...`);

    let i = 0;
    for (const p of products) {
        i++;
        const id = `prod_${p.category.toLowerCase().substring(0, 3)}_${i}`;
        await prisma.product.upsert({
            where: { id },
            update: {},
            create: {
                id,
                companyId,
                name: p.name,
                category: p.category,
                material: p.material,
                dimensions: p.dimensions,
                basePrice: p.price,
                unitId: p.unit,
                currency: 'EUR',
                tags: `${p.category.toLowerCase()},${p.material.toLowerCase()},${p.name.toLowerCase().split(' ').join(',')}`
            }
        });
    }

    // 5. Rules
    // Bulk Discount
    await prisma.rule.upsert({
        where: { id: 'rule_bulk_10' },
        update: {},
        create: {
            id: 'rule_bulk_10',
            companyId,
            name: 'Bulk Discount 10%',
            description: '10% off for quantities > 50',
            priority: 1,
            conditions: JSON.stringify({ field: 'quantity', operator: 'gte', value: 50 }),
            actions: JSON.stringify({ type: 'DISCOUNT_PERCENT', value: 0.10 }),
        }
    });

    console.log('✅ Seeding COMPLETE! Database is ready for production simulation.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
