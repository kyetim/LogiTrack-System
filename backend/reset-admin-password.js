const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetAdminPassword() {
    try {
        const newPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const admin = await prisma.user.update({
            where: { email: 'admin@logitrack.com' },
            data: { passwordHash: hashedPassword }
        });

        console.log('\n✅ Admin şifresi sıfırlandı!\n');
        console.log('📧 Email: admin@logitrack.com');
        console.log('🔑 Yeni Şifre: admin123\n');

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdminPassword();
