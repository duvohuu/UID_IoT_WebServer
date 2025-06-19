import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lấy IP hiện tại
const getCurrentIP = () => {
    const interfaces = os.networkInterfaces();
    
    for (const interfaceName of Object.keys(interfaces)) {
        for (const iface of interfaces[interfaceName]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '192.168.1.20'; // fallback
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