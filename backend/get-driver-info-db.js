const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getDriverInfo() {
    try {
        console.log('\n📋 Database\'den driver bilgileri getiriliyor...\n');

        const drivers = await prisma.user.findMany({
            where: {
                role: 'DRIVER'
            },
            select: {
                id: true,
                email: true,
                driverProfile: {
                    select: {
                        licenseNumber: true,
                        status: true
                    }
                }
            }
        });

        if (drivers.length === 0) {
            console.log('❌ Hiç driver bulunamadı!\n');
            return;
        }

        console.log(`🚗 Toplam ${drivers.length} driver bulundu:\n`);
        console.log('═════════════════════════════\n');

        drivers.forEach((driver, index) => {
            console.log(`Driver ${index + 1}:`);
            console.log(`  📧 Email: ${driver.email}`);
            console.log(`  🆔 Driver ID: ${driver.id}`);
            console.log(`  🪪 License: ${driver.driverProfile?.licenseNumber || 'N/A'}`);
            console.log('');
        });

        console.log('═════════════════════════════\n');
        console.log(`✅ Route Optimization için:\n\n   ${drivers[0].id}\n`);

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

getDriverInfo();
