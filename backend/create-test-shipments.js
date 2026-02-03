const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestShipments() {
    try {
        console.log('\n📋 Test shipment\'lar oluşturuluyor...\n');

        // Get driver ID
        const driver = await prisma.user.findFirst({
            where: { role: 'DRIVER' },
            select: { id: true, email: true }
        });

        if (!driver) {
            console.log('❌ Driver bulunamadı!');
            return;
        }

        console.log(`✅ Driver bulundu: ${driver.email}\n`);

        // Test shipments with Istanbul locations
        const testShipments = [
            {
                trackingNumber: `TEST-${Date.now()}-001`,
                origin: "Kadıköy, Istanbul",
                destination: "Beşiktaş, Istanbul",
                status: "PENDING",
                pickupLocation: { lat: 40.9905, lng: 29.0249 },
                deliveryLocation: { lat: 41.0422, lng: 29.0088 },
                driverId: driver.id
            },
            {
                trackingNumber: `TEST-${Date.now()}-002`,
                origin: "Taksim, Istanbul",
                destination: "Ümraniye, Istanbul",
                status: "PENDING",
                pickupLocation: { lat: 41.0370, lng: 28.9857 },
                deliveryLocation: { lat: 41.0174, lng: 29.1238 },
                driverId: driver.id
            },
            {
                trackingNumber: `TEST-${Date.now()}-003`,
                origin: "Şişli, Istanbul",
                destination: "Maltepe, Istanbul",
                status: "PENDING",
                pickupLocation: { lat: 41.0602, lng: 28.9887 },
                deliveryLocation: { lat: 40.9339, lng: 29.1266 },
                driverId: driver.id
            },
            {
                trackingNumber: `TEST-${Date.now()}-004`,
                origin: "Bakırköy, Istanbul",
                destination: "Kartal, Istanbul",
                status: "PENDING",
                pickupLocation: { lat: 40.9806, lng: 28.8739 },
                deliveryLocation: { lat: 40.9019, lng: 29.1854 },
                driverId: driver.id
            },
            {
                trackingNumber: `TEST-${Date.now()}-005`,
                origin: "Sarıyer, Istanbul",
                destination: "Pendik, Istanbul",
                status: "PENDING",
                pickupLocation: { lat: 41.1691, lng: 29.0534 },
                deliveryLocation: { lat: 40.8782, lng: 29.2361 },
                driverId: driver.id
            }
        ];

        // Create shipments
        let created = 0;
        for (const shipment of testShipments) {
            try {
                const result = await prisma.shipment.create({
                    data: shipment
                });
                console.log(`✅ ${result.trackingNumber} → ${result.destination}`);
                created++;
            } catch (error) {
                console.log(`⚠️  Hata: ${error.message}`);
            }
        }

        console.log(`\n═════════════════════════════════════`);
        console.log(`✅ ${created} adet PENDING shipment oluşturuldu!`);
        console.log(`📍 Driver: ${driver.email}`);
        console.log(`\n🚀 Route optimization test için hazır!`);
        console.log(`\nTest komutu:`);
        console.log(`   node test-route-opt.js\n`);

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createTestShipments();
