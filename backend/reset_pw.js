const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

async function updatePassword() {
    const prisma = new PrismaClient();
    try {
        const hash = await bcrypt.hash('driver123', 10);
        console.log('New hash:', hash);
        await prisma.user.update({
            where: { email: 'test@driver.com' },
            data: { passwordHash: hash }
        });
        console.log('Password updated successfully.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}
updatePassword();
