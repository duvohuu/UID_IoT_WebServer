import Machine from "../models/Machine.js";
import User from "../models/User.js";
import WorkShift from "../models/Workshift.js"; 


export const getAllMachines = async (req, res) => {
    try {
        const machines = await Machine.find().lean().sort({ machineId: 1 });

        const machinesWithUserInfo = await Promise.all(
            machines.map(async (machine) => {
                let userInfo = null;
                if (machine.userId) {
                    try {
                        const user = await User.findOne({ userId: machine.userId }).select('-password').lean();
                        if (user) {
                            userInfo = {
                                username: user.username,
                                email: user.email,
                                role: user.role
                            };
                        }
                    } catch (userError) {
                        console.warn(`⚠️ Could not find user for userId: ${machine.userId}`);
                    }
                }
                return { ...machine, userInfo };
            })
        );

        res.json(machinesWithUserInfo);
    } catch (error) {
        console.error('❌ Internal API error:', error);
        res.status(500).json({ 
            message: 'Internal server error', 
            error: error.message 
        });
    }
};

export const createMachine = async (req, res) => {
    try {
        const machine = new Machine(req.body);
        const savedMachine = await machine.save();
        res.status(201).json(savedMachine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateMachine = async (req, res) => {
    try {
        const machine = await Machine.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!machine) {
            return res.status(404).json({ message: 'Machine not found' });
        }
        res.json(machine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteMachine = async (req, res) => {
    try {
        console.log('🗑️ DB SERVER: Delete machine request for ID:', req.params.id);
        
        const machineToDelete = await Machine.findById(req.params.id);
        if (!machineToDelete) {
            return res.status(404).json({ message: 'Machine not found' });
        }
        
        const machineId = machineToDelete.machineId;
        console.log(`\n🔄 Processing machine: ${machineId}`);
        
        // ✅ BƯỚC 1: XÓA VĨNH VIỄN TẤT CẢ WORKSHIFT (GIỐNG SCRIPT)
        console.log(`   🗑️ Permanently deleting ALL work shifts for ${machineId}...`);
        const deletedShifts = await WorkShift.deleteMany({ machineId: machineId });
        console.log(`   ✅ PERMANENTLY DELETED ${deletedShifts.deletedCount} work shifts`);
        
        // ✅ BƯỚC 2: VERIFY - KIỂM TRA LẠI (GIỐNG SCRIPT)
        const remainingShifts = await WorkShift.find({ machineId: machineId });
        if (remainingShifts.length > 0) {
            console.log(`   ⚠️  WARNING: Still found ${remainingShifts.length} shifts. Force deleting...`);
            await WorkShift.deleteMany({ machineId: machineId });
            console.log(`   🔧 Force deleted remaining shifts`);
        }
        
        // ✅ BƯỚC 3: XÓA MACHINE (GIỐNG SCRIPT)
        const deletedMachine = await Machine.findByIdAndDelete(req.params.id);
        if (deletedMachine) {
            console.log(`   ✅ PERMANENTLY DELETED machine: ${deletedMachine.machineId} - ${deletedMachine.name}`);
        }
        
        // ✅ FINAL VERIFICATION (GIỐNG SCRIPT)
        const finalCheck = await WorkShift.find({ machineId: machineId });
        console.log(`   🔍 Final verification: ${finalCheck.length} remaining shifts (should be 0)`);
        
        res.json({ 
            message: 'Machine and ALL related work shifts permanently deleted',
            deletedMachine: {
                id: machineToDelete._id,
                machineId: machineToDelete.machineId,
                name: machineToDelete.name,
                ip: machineToDelete.ip,
                userId: machineToDelete.userId
            },
            deletedShiftsCount: deletedShifts.deletedCount,
            status: 'PERMANENTLY_DELETED'
        });
        
    } catch (error) {
        console.error('❌ DB SERVER: DELETE MACHINE ERROR:', error.message);
        console.error('❌ DB SERVER: Stack trace:', error.stack);
        res.status(500).json({ 
            message: 'Error deleting machine and work shifts', 
            error: error.message 
        });
    }
};


export const getMachineByIp = async (req, res) => {
    try {
        const machine = await Machine.findOne({ ip: req.params.ip });
        if (!machine) {
            return res.status(404).json({ message: 'Machine not found' });
        }
        res.json(machine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};