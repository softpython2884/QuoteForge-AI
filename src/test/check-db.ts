import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
    const units = await prisma.unit.findMany();
    const companies = await prisma.company.findMany();
    console.log('--- DB DUMP ---');
    console.log('Units:', units.map(u => ({ id: u.id, symbol: u.symbol })));
    console.log('Companies:', companies.map(c => ({ id: c.id, name: c.name })));
    await prisma.$disconnect();
}
run();
