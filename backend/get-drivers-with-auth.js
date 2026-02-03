const http = require('http');

// Step 1: Login
function login() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            email: 'admin@logitrack.com',
            password: 'admin123'
        });

        const options = {
            hostname: 'localhost',
            port: 4000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.access_token) {
                        resolve(response.access_token);
                    } else {
                        reject(new Error('No access token received'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// Step 2: Get Drivers
function getDrivers(token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 4000,
            path: '/api/drivers',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Main
async function main() {
    try {
        console.log('\n🔐 Admin olarak giriş yapılıyor...\n');
        const token = await login();
        console.log('✅ Login başarılı! Token alındı.\n');

        console.log('📋 Driver listesi getiriliyor...\n');
        const drivers = await getDrivers(token);

        console.log('═══════════════════════════════════════\n');
        console.log('🚗 DRIVER LISTESI:\n');

        if (drivers.length === 0) {
            console.log('❌ Hiç driver bulunamadı!\n');
            console.log('💡 Admin dashboard\'dan driver oluşturun.\n');
        } else {
            drivers.forEach((driver, index) => {
                console.log(`Driver ${index + 1}:`);
                console.log(`  📧 Email: ${driver.user?.email || 'N/A'}`);
                console.log(`  🆔 Driver ID: ${driver.userId}`);
                console.log(`  🪪 License: ${driver.licenseNumber || 'N/A'}`);
                console.log(`  📌 Status: ${driver.status || 'N/A'}`);
                console.log('');
            });

            console.log('═══════════════════════════════════════\n');
            console.log('✅ Route Optimization için kullanın:\n');
            console.log(`   Driver ID: ${drivers[0].userId}\n`);
            console.log('📍 Swagger\'da route optimization preview:\n');
            console.log(`   GET /api/route-optimization/preview/${drivers[0].userId}\n`);
        }

    } catch (error) {
        console.error('❌ Hata:', error.message);
    }
}

main();
