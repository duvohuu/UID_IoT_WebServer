import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Machine from '../models/Machine.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Template máy 
const MACHINE_TEMPLATE = {
    slaveId: 1,
    status: 'offline',
    isConnected: false,
    uptime: 0,
};

// =====================================================
// CẤU HÌNH THÊM MÁY CHO USER
// =====================================================
const CONFIG = {
    // Email của user cần thêm máy
    userEmails: [
        'hotieuviet@gmail.com',  
    ],  
    
    // Thông tin máy mới
    machine: {
        machineId: 'MACHINE_002',           
        name: 'Máy bột test',      
        ip: '127.0.0.1',    
        port: 502,            
        location: 'UID Lab',      
        type: 'Powder Filling Machine'
    }
};

// =====================================================

const addMachineToUsers = async () => {
    try {
        console.log('🚀 Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        
        console.log(`\n🔧 Adding machines to ${CONFIG.userEmails.length} users...`);
        
        const results = [];
        
        for (let i = 0; i < CONFIG.userEmails.length; i++) {
            const userEmail = CONFIG.userEmails[i];
            console.log(`\n📧 [${i + 1}/${CONFIG.userEmails.length}] Processing: ${userEmail}`);
            
            try {
                // Tìm user
                const user = await User.findOne({ email: userEmail });
                if (!user) {
                    console.log(`❌ User not found: ${userEmail}`);
                    results.push({ email: userEmail, status: 'User not found' });
                    continue;
                }
                
                console.log(`✅ User found: ${user.username} (userId: ${user.userId})`);
                
                // Tạo IP unique cho từng user
                const ipParts = CONFIG.machine.ip.split('.'); 
                ipParts[3] = parseInt(ipParts[3]) + i;
                const machineIp = ipParts.join('.');
                
                // Kiểm tra IP conflict
                const existingMachine = await Machine.findOne({ ip: machineIp });
                if (existingMachine) {
                    console.log(`❌ IP conflict: ${machineIp}`);
                    results.push({ email: userEmail, status: 'IP conflict', ip: machineIp });
                    continue;
                }
                
                const newMachine = await Machine.create({
                    ...MACHINE_TEMPLATE,
                    machineId: CONFIG.machine.machineId,
                    name: `${CONFIG.machine.name}`,
                    type: CONFIG.machine.type,
                    location: CONFIG.machine.location,
                    ip: machineIp,
                    port: CONFIG.machine.port,
                    userId: user.userId  
                });
                
                console.log(`✅ Created: ${newMachine.machineId} for ${user.userId} (${machineIp})`);
                results.push({
                    email: userEmail,
                    userId: user.userId,
                    status: 'Success',
                    machineId: newMachine.machineId,
                    machineName: newMachine.name,
                    ip: machineIp
                });
                
            } catch (error) {
                console.log(`❌ Error for ${userEmail}: ${error.message}`);
                results.push({ email: userEmail, status: 'Error', error: error.message });
            }
        }
        
        // ======= HIỂN THỊ KẾT QUẢ =======
        console.log('\n🎉 BATCH OPERATION COMPLETED!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const successful = results.filter(r => r.status === 'Success');
        const failed = results.filter(r => r.status !== 'Success');
        
        console.log(`📊 Total: ${results.length} | Success: ${successful.length} | Failed: ${failed.length}`);
        
        if (successful.length > 0) {
            console.log('\n✅ Successful creations:');
            successful.forEach((result, index) => {
                console.log(`   ${index + 1}. ${result.machineId} - ${result.userId} (${result.ip})`);
            });
        }
        
        if (failed.length > 0) {
            console.log('\n❌ Failed creations:');
            failed.forEach((result, index) => {
                console.log(`   ${index + 1}. ${result.email} - ${result.status}`);
            });
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
    } catch (error) {
        console.error('❌ Batch operation failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
};

// Chạy function
addMachineToUsers();