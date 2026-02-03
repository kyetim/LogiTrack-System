const { RoutesClient } = require('@googlemaps/routing');
require('dotenv').config();

async function testGoogleRoutesAPI() {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    console.log(`\n🔑 API Key: ${apiKey ? apiKey.substring(0, 20) + '...' : 'NOT FOUND'}\n`);

    if (!apiKey) {
        console.log('❌ GOOGLE_MAPS_API_KEY not found in .env!\n');
        return;
    }

    const routesClient = new RoutesClient({ apiKey });

    try {
        console.log('🚀 Testing Google Routes API...\n');
        console.log('📍 Route: Kadıköy → Beşiktaş\n');

        const response = await routesClient.computeRoutes({
            origin: {
                location: {
                    latLng: {
                        latitude: 40.9905,
                        longitude: 29.0249
                    }
                }
            },
            destination: {
                location: {
                    latLng: {
                        latitude: 41.0422,
                        longitude: 29.0088
                    }
                }
            },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_UNAWARE'
        });

        console.log('✅ API çalışıyor!\n');
        console.log('Response:', JSON.stringify(response, null, 2));

    } catch (error) {
        console.log('\n❌ API hatası:\n');
        console.log('Error type:', error.constructor.name);
        console.log('Error message:', error.message);
        console.log('\nFull error:');
        console.log(JSON.stringify(error, null, 2));
    }
}

testGoogleRoutesAPI();
