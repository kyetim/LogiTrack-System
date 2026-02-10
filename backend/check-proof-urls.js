const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProofs() {
    try {
        const proofs = await prisma.deliveryProof.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' }
        });
        console.log(JSON.stringify(proofs, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkProofs();
