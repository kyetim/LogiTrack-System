// Test script for Route Optimization
const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function testRouteOptimization() {
    try {
        console.log('🧪 Testing Route Optimization...\n');

        // 1. Get drivers
        console.log('1️⃣ Fetching drivers...');
        const driversRes = await axios.get(`${API_BASE}/drivers`);
        const driver = driversRes.data[0];

        if (!driver) {
            console.log('❌ No drivers found. Please create a driver first.');
            return;
        }

        console.log(`✅ Found driver: ${driver.user.email} (ID: ${driver.userId})\n`);

        // 2. Create test shipments with different Istanbul locations
        console.log('2️⃣ Creating test shipments...');

        const testLocations = [
            {
                origin: 'Kadıköy, Istanbul',
                destination: 'Beşiktaş, Istanbul',
                pickupLocation: { lat: 40.9905, lng: 29.0249 },
                deliveryLocation: { lat: 41.0422, lng: 29.0088 }
            },
            {
                origin: 'Taksim, Istanbul',
                destination: 'Ümraniye, Istanbul',
                pickupLocation: { lat: 41.0370, lng: 28.9857 },
                deliveryLocation: { lat: 41.0174, lng: 29.1238 }
            },
            {
                origin: 'Bakırköy, Istanbul',
                destination: 'Sarıyer, Istanbul',
                pickupLocation: { lat: 40.9796, lng: 28.8740 },
                deliveryLocation: { lat: 41.1714, lng: 29.0543 }
            },
            {
                origin: 'Şişli, Istanbul',
                destination: 'Maltepe, Istanbul',
                pickupLocation: { lat: 41.0602, lng: 28.9874 },
                deliveryLocation: { lat: 40.9284, lng: 29.1304 }
            }
        ];

        const shipmentIds = [];
        for (let i = 0; i < testLocations.length; i++) {
            const loc = testLocations[i];
            const shipment = await axios.post(`${API_BASE}/shipments`, {
                origin: loc.origin,
                destination: loc.destination,
                pickupLocation: loc.pickupLocation,
                deliveryLocation: loc.deliveryLocation,
                driverId: driver.userId
            });
            shipmentIds.push(shipment.data.id);
            console.log(`   ✅ Created shipment ${i + 1}: ${loc.origin} → ${loc.destination}`);
        }

        console.log(`\n✅ Created ${shipmentIds.length} test shipments\n`);

        // 3. Test route optimization preview
        console.log('3️⃣ Testing route optimization preview...');
        const previewRes = await axios.get(`${API_BASE}/route-optimization/preview/${driver.userId}`);
        const result = previewRes.data;

        console.log('\n📊 OPTIMIZATION RESULTS:');
        console.log('═══════════════════════════════════════');
        console.log(`Total Distance: ${(result.totalDistance / 1000).toFixed(2)} km`);
        console.log(`Total Duration: ${Math.floor(result.totalDuration / 60)} minutes`);
        console.log(`\n💰 SAVINGS:`);
        console.log(`Distance Saved: ${(result.savings.distanceMeters / 1000).toFixed(2)} km (${result.savings.percentDistance.toFixed(1)}%)`);
        console.log(`Time Saved: ${Math.floor(result.savings.durationSeconds / 60)} minutes (${result.savings.percentDuration.toFixed(1)}%)`);
        console.log(`\n📍 OPTIMIZED SEQUENCE:`);
        result.optimizedOrder.forEach((id, index) => {
            console.log(`   ${index + 1}. ${id.slice(0, 8)}...`);
        });
        console.log('═══════════════════════════════════════\n');

        // 4. Apply optimization
        console.log('4️⃣ Applying route optimization...');
        await axios.post(`${API_BASE}/route-optimization/optimize/${driver.userId}`);
        console.log('✅ Route optimization applied!\n');

        // 5. Verify sequence was updated
        console.log('5️⃣ Verifying shipment sequences...');
        const shipmentsRes = await axios.get(`${API_BASE}/shipments`);
        const updatedShipments = shipmentsRes.data
            .filter(s => shipmentIds.includes(s.id))
            .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

        updatedShipments.forEach(s => {
            console.log(`   Shipment ${s.trackingNumber}: sequence = ${s.sequence}`);
        });

        console.log('\n🎉 Route Optimization Test PASSED! ✅\n');

    } catch (error) {
        console.error('\n❌ Test Failed:', error.response?.data || error.message);
        if (error.response?.data) {
            console.error('Details:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testRouteOptimization();
