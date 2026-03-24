const os = require('os');
const fs = require('fs');
const path = require('path');

function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            // Skip internal and non-IPv4 addresses
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                // Ignore virtual/WSL adapters common on Windows
                const name = devName.toLowerCase();
                if (name.includes('vethernet') || name.includes('virtual') || name.includes('wsl')) {
                    continue;
                }

                if (name.includes('wi-fi') || name.includes('eth')) {
                    return alias.address;
                }

            }
        }
    }

    // Fallback: Just return the first valid IPv4
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return 'localhost';
}

const isEmulator = process.argv.includes('--emulator');
let ip;

if (isEmulator) {
    ip = '10.0.2.2'; // Android emulator's host alias
    console.log(`🌐 Emulator IP Adresi Kullanılıyor: ${ip}`);
} else {
    ip = getLocalIpAddress();
    console.log(`🌐 Aktif Yerel IP Adresi Bulundu: ${ip}`);
}


const envContent = `EXPO_PUBLIC_API_URL=http://${ip}:3000/api
EXPO_PUBLIC_WS_URL=ws://${ip}:3000
`;

const envDevContent = `EXPO_PUBLIC_API_URL=http://${ip}:3000/api
EXPO_PUBLIC_WS_URL=ws://${ip}:3000
EXPO_PUBLIC_MQTT_URL=ws://${ip}:9001
EXPO_PUBLIC_ENV=development
`;

const envPath = path.join(__dirname, '.env');
const envDevPath = path.join(__dirname, '.env.development');

fs.writeFileSync(envPath, envContent, { encoding: 'utf8' });
fs.writeFileSync(envDevPath, envDevContent, { encoding: 'utf8' });

console.log(`✅ .env ve .env.development dosyaları güncellendi.`);
