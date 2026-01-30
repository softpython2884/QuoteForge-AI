import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🏗️  Seeding database with COMPLETE PC Hardware Catalog...');

    // 1. Company
    const companyId = 'comp_1';
    await prisma.company.upsert({
        where: { id: companyId },
        update: {},
        create: { id: companyId, name: 'ForgePC Gaming & Workstations', address: 'Tech Valley, Silicon Way' },
    });

    // 2. Units
    const unitsData = [
        { id: 'unit_pc', name: 'Piece', symbol: 'pc', companyId },
        { id: 'unit_hr', name: 'Hour', symbol: 'h', companyId },
        { id: 'unit_gb', name: 'Gigabyte', symbol: 'GB', companyId },
    ];

    for (const unit of unitsData) {
        await prisma.unit.upsert({
            where: { id: unit.id },
            update: unit,
            create: unit,
        });
    }

    // 3. Products (~50 items)
    const products = [
        // --- CPUs ---
        { name: 'Intel Core i9-14900K', category: 'CPU', material: 'Silicon', dimensions: 'LGA1700', basePrice: 589.00, unitId: 'unit_pc' },
        { name: 'Intel Core i7-14700K', category: 'CPU', material: 'Silicon', dimensions: 'LGA1700', basePrice: 409.00, unitId: 'unit_pc' },
        { name: 'Intel Core i5-14600K', category: 'CPU', material: 'Silicon', dimensions: 'LGA1700', basePrice: 319.00, unitId: 'unit_pc' },
        { name: 'AMD Ryzen 9 7950X3D', category: 'CPU', material: 'Silicon', dimensions: 'AM5', basePrice: 699.00, unitId: 'unit_pc' },
        { name: 'AMD Ryzen 7 7800X3D', category: 'CPU', material: 'Silicon', dimensions: 'AM5', basePrice: 449.00, unitId: 'unit_pc' },
        { name: 'AMD Ryzen 5 7600X', category: 'CPU', material: 'Silicon', dimensions: 'AM5', basePrice: 229.00, unitId: 'unit_pc' },

        // --- GPUs ---
        { name: 'NVIDIA GeForce RTX 4090', category: 'GPU', material: 'Electronic', dimensions: '3-Slot', basePrice: 1599.00, unitId: 'unit_pc' },
        { name: 'NVIDIA GeForce RTX 4080 Super', category: 'GPU', material: 'Electronic', dimensions: '3-Slot', basePrice: 999.00, unitId: 'unit_pc' },
        { name: 'NVIDIA GeForce RTX 4070 Ti Super', category: 'GPU', material: 'Electronic', dimensions: '2.5-Slot', basePrice: 799.00, unitId: 'unit_pc' },
        { name: 'NVIDIA GeForce RTX 4070 Super', category: 'GPU', material: 'Electronic', dimensions: '2-Slot', basePrice: 599.00, unitId: 'unit_pc' },
        { name: 'NVIDIA GeForce RTX 4060 Ti', category: 'GPU', material: 'Electronic', dimensions: '2-Slot', basePrice: 399.00, unitId: 'unit_pc' },
        { name: 'AMD Radeon RX 7900 XTX', category: 'GPU', material: 'Electronic', dimensions: '3-Slot', basePrice: 929.00, unitId: 'unit_pc' },
        { name: 'AMD Radeon RX 7800 XT', category: 'GPU', material: 'Electronic', dimensions: '2.5-Slot', basePrice: 499.00, unitId: 'unit_pc' },

        // --- Motherboards ---
        { name: 'ASUS ROG Maximus Z790 Hero', category: 'MOTHERBOARD', material: 'PCB', dimensions: 'ATX', basePrice: 629.00, unitId: 'unit_pc' },
        { name: 'MSI MAG Z790 Tomahawk WiFi', category: 'MOTHERBOARD', material: 'PCB', dimensions: 'ATX', basePrice: 259.00, unitId: 'unit_pc' },
        { name: 'ASUS ROG Strix X670E-E Gaming', category: 'MOTHERBOARD', material: 'PCB', dimensions: 'ATX', basePrice: 499.00, unitId: 'unit_pc' },
        { name: 'Gigabyte B650 AORUS ELITE AX', category: 'MOTHERBOARD', material: 'PCB', dimensions: 'ATX', basePrice: 199.00, unitId: 'unit_pc' },
        { name: 'ASUS Prime B760M-A WiFi', category: 'MOTHERBOARD', material: 'PCB', dimensions: 'mATX', basePrice: 149.00, unitId: 'unit_pc' },

        // --- RAM ---
        { name: 'Corsair Vengeance RGB 32GB (2x16GB) DDR5-6000', category: 'RAM', material: 'Electronic', dimensions: 'DIMM', basePrice: 124.00, unitId: 'unit_pc' },
        { name: 'G.Skill Trident Z5 Neo 64GB (2x32GB) DDR5-6000', category: 'RAM', material: 'Electronic', dimensions: 'DIMM', basePrice: 209.00, unitId: 'unit_pc' },
        { name: 'Kingston FURY Beast 16GB (2x8GB) DDR4-3200', category: 'RAM', material: 'Electronic', dimensions: 'DIMM', basePrice: 45.00, unitId: 'unit_pc' },

        // --- Storage ---
        { name: 'Samsung 990 Pro 2TB NVMe SSD', category: 'STORAGE', material: 'SSD', dimensions: 'M.2', basePrice: 179.00, unitId: 'unit_pc' },
        { name: 'Crucial P3 Plus 1TB NVMe SSD', category: 'STORAGE', material: 'SSD', dimensions: 'M.2', basePrice: 69.00, unitId: 'unit_pc' },
        { name: 'Seagate BarraCuda 4TB HDD', category: 'STORAGE', material: 'Platter', dimensions: '3.5"', basePrice: 89.00, unitId: 'unit_pc' },

        // --- PSU ---
        { name: 'Corsair RM1000x 1000W 80+ Gold', category: 'PSU', material: 'Electronic', dimensions: 'ATX', basePrice: 189.00, unitId: 'unit_pc' },
        { name: 'EVGA SuperNOVA 850 GT 850W', category: 'PSU', material: 'Electronic', dimensions: 'ATX', basePrice: 129.00, unitId: 'unit_pc' },
        { name: 'be quiet! Pure Power 12 M 750W', category: 'PSU', material: 'Electronic', dimensions: 'ATX', basePrice: 109.00, unitId: 'unit_pc' },

        // --- Cases ---
        { name: 'Lian Li PC-O11 Dynamic EVO', category: 'CASE', material: 'Steel/Glass', dimensions: 'Mid Tower', basePrice: 169.00, unitId: 'unit_pc' },
        { name: 'NZXT H7 Flow', category: 'CASE', material: 'Steel', dimensions: 'Mid Tower', basePrice: 129.00, unitId: 'unit_pc' },
        { name: 'Fractal Design North', category: 'CASE', material: 'Steel/Wood', dimensions: 'Mid Tower', basePrice: 139.00, unitId: 'unit_pc' },
        { name: 'Corsair 4000D Airflow', category: 'CASE', material: 'Steel', dimensions: 'Mid Tower', basePrice: 104.00, unitId: 'unit_pc' },

        // --- Cooling ---
        { name: 'NZXT Kraken Elite 360 RGB', category: 'COOLING', material: 'Liquid', dimensions: '360mm', basePrice: 279.00, unitId: 'unit_pc' },
        { name: 'Noctua NH-D15 chromax.black', category: 'COOLING', material: 'Metal', dimensions: 'Air Cooler', basePrice: 119.00, unitId: 'unit_pc' },
        { name: 'Arctic Liquid Freezer III 240', category: 'COOLING', material: 'Liquid', dimensions: '240mm', basePrice: 99.00, unitId: 'unit_pc' },
        { name: 'Corsair iCUE AF120 RGB Elite (3-Pack)', category: 'COOLING', material: 'Plastic', dimensions: '120mm', basePrice: 84.00, unitId: 'unit_pc' },

        // --- Services ---
        { name: 'Standard PC Assembly & BIOS Update', category: 'SERVICE', material: 'Labor', dimensions: 'Basic', basePrice: 75.00, unitId: 'unit_pc' },
        { name: 'Advanced Watercooling Installation', category: 'SERVICE', material: 'Labor', dimensions: 'Custom', basePrice: 150.00, unitId: 'unit_pc' },
        { name: 'Windows 11 Home Installation & Drivers', category: 'SERVICE', material: 'Labor', dimensions: 'Software', basePrice: 40.00, unitId: 'unit_pc' },
        { name: 'Consultation & Parts Selection', category: 'SERVICE', material: 'Expertise', dimensions: '1h', basePrice: 50.00, unitId: 'unit_hr' },

        // --- Peripherals ---
        { name: 'ASUS ROG Swift PG279QM 27" 1440p 240Hz', category: 'MONITOR', material: 'Plastic/Glass', dimensions: '27"', basePrice: 749.00, unitId: 'unit_pc' },
        { name: 'Logitech G Pro X Superlight 2', category: 'PERIPHERAL', material: 'Plastic', dimensions: 'Wireless', basePrice: 159.00, unitId: 'unit_pc' },
        { name: 'Wooting 60HE+ Mechanical Keyboard', category: 'PERIPHERAL', material: 'Plastic', dimensions: '60%', basePrice: 175.00, unitId: 'unit_pc' },
    ];

    for (const p of products) {
        await prisma.product.create({
            data: {
                ...p,
                companyId,
                tags: `${p.category} ${p.material} ${p.dimensions}`.toLowerCase(),
            }
        });
    }

    // 4. Rules
    await prisma.rule.create({
        data: {
            companyId,
            name: 'Gaming Combo Discount',
            description: '10% off total if CPU and GPU are bought together',
            conditions: JSON.stringify({
                require_categories: ['CPU', 'GPU'],
                min_items: 2
            }),
            actions: JSON.stringify({
                type: 'DISCOUNT_PERCENT',
                value: 10
            }),
            priority: 1
        }
    });

    console.log('✅ PC Hardware Seed Complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
