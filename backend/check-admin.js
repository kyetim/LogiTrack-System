const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdminCredentials() {
    try {
        console.log('\n🔍 Admin kullanıcılar aranıyor...\n');

        const admins = await prisma.user.findMany({
            where: {
                role: 'ADMIN'
            },
            select: {
                id: true,
                email: true,
                createdAt: true
            }
        });

        if (admins.length === 0) {
            console.log('❌ Hiç admin kullanıcı bulunamadı!\n');
            console.log('💡 Yeni admin oluşturmak için: npm run create-admin\n');
        } else {
            console.log('📋 Admin Kullanıcılar:\n');
            console.log('═══════════════════════════════════════\n');

            admins.forEach((admin, index) => {
                console.log(`Admin ${index + 1}:`);
                console.log(`  📧 Email: ${admin.email}`);
                console.log(`  🆔 ID: ${admin.id}`);
                console.log(`  📅 Oluşturulma: ${admin.createdAt.toLocaleDateString('tr-TR')}`);
                console.log('');
            });

            console.log('═══════════════════════════════════════\n');
            console.log('💡 Şifre hash\'lenmiş olduğu için görüntülenemez.\n');
            console.log('✅ Swagger\'da bu email\'lerden birini deneyin:\n');
            admins.forEach(admin => {
                console.log(`   - ${admin.email}`);
            });
            console.log('\n🔑 Şifre muhtemelen: "admin123" veya "password123"\n');
        }

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdminCredentials();
