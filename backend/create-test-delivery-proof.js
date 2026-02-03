const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestDeliveryProof() {
    try {
        console.log('\n📦 Creating test delivery proof...\n');

        // Find or create a DELIVERED shipment
        let deliveredShipment = await prisma.shipment.findFirst({
            where: { status: 'DELIVERED' }
        });

        if (!deliveredShipment) {
            console.log('⚠️  No DELIVERED shipment found. Creating one...\n');

            // Get a driver
            const driver = await prisma.user.findFirst({
                where: { role: 'DRIVER' }
            });

            if (!driver) {
                console.log('❌ No driver found in database!');
                return;
            }

            // Create a test shipment
            deliveredShipment = await prisma.shipment.create({
                data: {
                    trackingNumber: `POD-TEST-${Date.now()}`,
                    origin: 'Test Origin - Kadıköy',
                    destination: 'Test Destination - Beşiktaş',
                    status: 'DELIVERED',
                    pickupLocation: { lat: 40.9905, lng: 29.0249 },
                    deliveryLocation: { lat: 41.0422, lng: 29.0088 },
                    driverId: driver.id
                }
            });

            console.log(`✅ Created test shipment: ${deliveredShipment.trackingNumber}\n`);
        }

        // Check if delivery proof already exists
        const existingProof = await prisma.deliveryProof.findUnique({
            where: { shipmentId: deliveredShipment.id }
        });

        if (existingProof) {
            console.log(`⚠️  Delivery proof already exists for shipment ${deliveredShipment.trackingNumber}`);
            console.log(`   Deleting old proof and creating new one...\n`);
            await prisma.deliveryProof.delete({
                where: { id: existingProof.id }
            });
        }

        // Create delivery proof with test data (matching actual schema)
        const proof = await prisma.deliveryProof.create({
            data: {
                shipmentId: deliveredShipment.id,
                recipientName: 'Test Customer - John Doe',
                photoUrl: 'https://via.placeholder.com/400x300.png?text=Package+Delivered',
                signatureUrl: 'https://via.placeholder.com/200x100.png?text=Customer+Signature',
                notes: 'Test delivery proof created for POD viewing verification',
                deliveredAt: new Date()
            }
        });

        console.log('═══════════════════════════════════════\n');
        console.log('✅ Delivery Proof Created Successfully!\n');
        console.log(`📋 Proof ID: ${proof.id}`);
        console.log(`📦 Shipment: ${deliveredShipment.trackingNumber}`);
        console.log(`👤 Recipient: ${proof.recipientName}`);
        console.log(`📸 Photo: ${proof.photoUrl}`);
        console.log(`✍️  Signature: ${proof.signatureUrl}`);
        console.log(`🕒 Delivered At: ${proof.deliveredAt.toLocaleString('tr-TR')}`);
        console.log(`📝 Notes: ${proof.notes}`);
        console.log('\n═══════════════════════════════════════\n');
        console.log('🎯 Next Steps - Test POD Viewing:');
        console.log('   1. Go to Admin Dashboard: http://localhost:3000');
        console.log('   2. Login with admin credentials');
        console.log('   3. Navigate to Shipments page');
        console.log(`   4. Find shipment: ${deliveredShipment.trackingNumber}`);
        console.log('   5. Click "View POD" button');
        console.log('   6. Verify photo and signature display correctly\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestDeliveryProof();
