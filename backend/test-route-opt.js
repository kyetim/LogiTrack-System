// Route Optimization Quick Test
const http = require('http');

// Login and get token
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
                    resolve(response.access_token);
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

// Test route optimization preview
function testRouteOptimization(token, driverId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 4000,
            path: `/api/route-optimization/preview/${driverId}`,
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
                    resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function main() {
    try {
        const driverId = 'b4d3243b-4f6c-42eb-bbd8-7c1eba849047';

        console.log('\n🔐 Login...\n');
        const token = await login();
        console.log('✅ Token alındı!\n');

        console.log('🚀 Route optimization test ediliyor...\n');
        const result = await testRouteOptimization(token, driverId);

        console.log('═════════════════════════════════════\n');
        console.log(`📊 Status Code: ${result.statusCode}\n`);

        if (result.statusCode === 200) {
            console.log('✅ BAŞARILI! Route optimization çalışıyor:\n');
            console.log(JSON.stringify(result.data, null, 2));
        } else if (result.statusCode === 400) {
            console.log('⚠️  Shipment eksik:\n');
            console.log(JSON.stringify(result.data, null, 2));
            console.log('\n💡 Admin dashboard\'dan PENDING shipment ekleyin!\n');
        } else {
            console.log('❌ Hata:\n');
            console.log(JSON.stringify(result.data, null, 2));
        }

        console.log('\n═════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Hata:', error.message);
    }
}

main();
