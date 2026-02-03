const http = require('http');

const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/drivers',
    method: 'GET',
    headers: {
        'Accept': 'application/json'
    }
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const drivers = JSON.parse(data);
            console.log('\n📋 DRIVER LISTESI:\n');
            console.log('═══════════════════════════════════════\n');

            if (drivers.length === 0) {
                console.log('❌ Hiç driver bulunamadı!\n');
                return;
            }

            drivers.forEach((driver, index) => {
                console.log(`Driver ${index + 1}:`);
                console.log(`  📧 Email: ${driver.user?.email || 'N/A'}`);
                console.log(`  🆔 Driver ID (userId): ${driver.userId}`);
                console.log(`  🪪 License: ${driver.licenseNumber || 'N/A'}`);
                console.log(`  📌 Status: ${driver.status || 'N/A'}`);
                console.log('');
            });

            console.log('═══════════════════════════════════════\n');
            console.log('✅ Route optimization için driver ID:');
            console.log(`   ${drivers[0].userId}\n`);
        } catch (e) {
            console.error('Error parsing response:', e.message);
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error:', error.message);
});

req.end();
