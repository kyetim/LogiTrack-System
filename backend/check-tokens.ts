
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTokens() {
    const usersWithTokens = await prisma.user.findMany({
        where: {
            pushToken: {
                not: null,
            },
        },
        select: {
            email: true,
            pushToken: true,
            role: true
        }
    });

    console.log('Users with Push Tokens:', usersWithTokens);
}

checkTokens()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
