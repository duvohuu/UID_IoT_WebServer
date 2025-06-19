import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Machine from '../models/Machine.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// =====================================================
// 🔧 CẤU HÌNH XÓA NHIỀU MÁY
// =====================================================

const CONFIG = {
    // ✏️ Danh sách machineId cần xóa
    machineIdsToDelete: [
        'MACHINE_002',
    ]
    
    // Hoặc xóa theo criteria:
    // deleteByUserId: 'test1',  // Xóa tất cả máy của user test1
    // deleteByStatus: 'offline'  // Xóa tất cả máy offline
};

// =====================================================

const deleteAndReindex = async () => {
    try {
        console.log('🚀 Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        
        // ======= BƯỚC 1: HIỂN THỊ TRẠNG THÁI BAN ĐẦU =======
        const allMachinesBeforeDelete = await Machine.find({}, 'machineId name userId').sort({ machineId: 1 });
        console.log(`\n📋 Current machines (${allMachinesBeforeDelete.length} total):`);
        allMachinesBeforeDelete.forEach((machine, index) => {
            const willDelete = CONFIG.machineIdsToDelete.includes(machine.machineId);
            const marker = willDelete ? ' ← WILL BE DELETED' : '';
            console.log(`   ${index + 1}. ${machine.machineId} - ${machine.name} (${machine.userId})${marker}`);
        });
        
        // ======= BƯỚC 2: XÓA CÁC MÁY =======
        console.log(`\n🗑️  Deleting ${CONFIG.machineIdsToDelete.length} machines...`);
        
        const deletedMachines = [];
        let totalDeletedShifts = 0;

        for (const machineId of CONFIG.machineIdsToDelete) {
            console.log(`\n🔄 Processing machine: ${machineId}`);
            
            // ✅ BƯỚC 1: XÓA VĨNH VIỄN TẤT CẢ WORKSHIFT
            console.log(`   🗑️ Permanently deleting ALL work shifts for ${machineId}...`);
            const deletedShifts = await WorkShift.deleteMany({ machineId: machineId });
            totalDeletedShifts += deletedShifts.deletedCount;
            console.log(`   ✅ PERMANENTLY DELETED ${deletedShifts.deletedCount} work shifts`);
            
            // ✅ BƯỚC 2: VERIFY - KIỂM TRA LẠI
            const remainingShifts = await WorkShift.find({ machineId: machineId });
            if (remainingShifts.length > 0) {
                console.log(`   ⚠️  WARNING: Still found ${remainingShifts.length} shifts. Force deleting...`);
                await WorkShift.deleteMany({ machineId: machineId });
                console.log(`   🔧 Force deleted remaining shifts`);
            }
            
            // ✅ BƯỚC 3: XÓA MACHINE
            const deletedMachine = await Machine.findOneAndDelete({ machineId: machineId });
            if (deletedMachine) {
                deletedMachines.push({
                    machineId: deletedMachine.machineId,
                    name: deletedMachine.name,
                    userId: deletedMachine.userId
                });
                console.log(`   ✅ PERMANENTLY DELETED machine: ${deletedMachine.machineId} - ${deletedMachine.name}`);
            } else {
                console.log(`   ❌ Machine not found: ${machineId}`);
            }
            
            // ✅ FINAL VERIFICATION
            const finalCheck = await WorkShift.find({ machineId: machineId });
            console.log(`   🔍 Final verification: ${finalCheck.length} remaining shifts (should be 0)`);
        }
        
        // ======= BƯỚC 3: HIỂN THỊ KẾT QUẢ =======
        const finalMachines = await Machine.find({}, 'machineId name userId').sort({ machineId: 1 });
        
        console.log('\n🎉 BULK DELETION AND RE-INDEXING COMPLETED!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🗑️  DELETED MACHINES (${deletedMachines.length}):`);
        deletedMachines.forEach((machine, index) => {
            console.log(`   ${index + 1}. ${machine.machineId} - ${machine.name} (${machine.userId})`);
        });
        
        console.log(`\n🔄 RE-INDEXED MACHINES (${reindexResults.length}):`);
        reindexResults.forEach((result, index) => {
            console.log(`   ${index + 1}. ${result.oldId} → ${result.newId} (${result.userId})`);
        });
        
        console.log(`\n📋 FINAL MACHINE LIST (${finalMachines.length} total):`);
        finalMachines.forEach((machine, index) => {
            console.log(`   ${index + 1}. ${machine.machineId} - ${machine.name} (${machine.userId})`);
        });
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
    } catch (error) {
        console.error('❌ Error occurred:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
};

// Chạy function
deleteAndReindex();