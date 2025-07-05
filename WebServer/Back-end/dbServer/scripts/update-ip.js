import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lấy IP hiện tại
const getCurrentIP = () => {
    const interfaces = os.networkInterfaces();
    const ips = [];
    
    // Thu thập tất cả IP non-internal
    for (const interfaceName of Object.keys(interfaces)) {
        for (const iface of interfaces[interfaceName]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push({
                    interface: interfaceName,
                    address: iface.address
                });
            }
        }
    }
    
    console.log('🔍 Available network interfaces:');
    ips.forEach(ip => console.log(`   ${ip.interface}: ${ip.address}`));
    
    // Ưu tiên IP 192.168.x.x (mạng gia đình/văn phòng)
    const homeNetworkIP = ips.find(ip => ip.address.startsWith('192.168.'));
    if (homeNetworkIP) {
        console.log(`✅ Selected IP: ${homeNetworkIP.address} (Home/Office network)`);
        return homeNetworkIP.address;
    }
    
    // Ưu tiên IP 10.x.x.x (private network)
    const privateNetworkIP = ips.find(ip => ip.address.startsWith('10.'));
    if (privateNetworkIP) {
        console.log(`✅ Selected IP: ${privateNetworkIP.address} (Private network)`);
        return privateNetworkIP.address;
    }
    
    // Fallback về IP đầu tiên
    if (ips.length > 0) {
        console.log(`⚠️  Using first available IP: ${ips[0].address}`);
        return ips[0].address;
    }
    
    console.log('❌ No network interface found, using fallback');
    return '192.168.1.20';
};

const currentIP = getCurrentIP();
console.log(`🔍 Current IP: ${currentIP}`);

// Từ Back-end/dbServer/scripts -> Back-end/dbServer -> Back-end -> WebServer -> Front-end
const frontendEnvPath = path.join(__dirname, '../../../Front-end/.env');

console.log(`📁 Looking for .env at: ${frontendEnvPath}`);

// Kiểm tra thư mục tồn tại
const frontendDir = path.dirname(frontendEnvPath);
if (!fs.existsSync(frontendDir)) {
    console.error(`❌ Front-end directory not found: ${frontendDir}`);
    process.exit(1);
}

const envContent = `VITE_API_URL=http://${currentIP}:5000\n`;

try {
    fs.writeFileSync(frontendEnvPath, envContent);
    console.log(`✅ Updated Front-end/.env with IP: ${currentIP}`);
} catch (error) {
    console.error(`❌ Error writing .env file:`, error.message);
    process.exit(1);
}

console.log(`📝 Remember to restart the servers!`);
console.log(`🌐 New URLs:`);
console.log(`   Backend: http://${currentIP}:5000`);
console.log(`   Frontend: http://${currentIP}:5173`);