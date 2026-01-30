import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Create Default Company
    const companyId = 'comp_1';
    const company = await prisma.company.upsert({
        where: { id: companyId },
        update: {},
        create: {
            id: companyId,
            name: 'Demo Construction Co',
            address: '123 Builder Lane',
        },
    });
    console.log(`Created Company: ${company.name} (${company.id})`);

    // 2. Create Default Unit (m2)
    const unitId = 'unit_m2';
    const unit = await prisma.unit.upsert({
        where: { id: unitId },
        update: {},
        create: {
            id: unitId,
            companyId: companyId,
            name: 'Square Meter',
            symbol: 'm2',
        },
    });
    console.log(`Created Unit: ${unit.name} (${unit.id})`);

    // 3. Create Default Unit (Pack)
    const unitPackId = 'unit_pack';
    await prisma.unit.upsert({
        where: { id: unitPackId },
        update: {},
        create: {
            id: unitPackId,
            companyId: companyId,
            name: 'Pack / Carton',
            symbol: 'box',
        },
    });
    console.log(`Created Unit: Pack`);

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
