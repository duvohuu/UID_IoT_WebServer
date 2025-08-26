import Machine from "../models/Machine.js";
import User from "../models/User.js";
import SaltMachine from "../models/SaltMachine.js"; 
import PowderMachine from "../models/PowderMachine.js"; 

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
        const machineType = machineToDelete.type; 
        console.log(`\n🔄 Processing machine: ${machineId} (${machineType})`);
        
        let deletedShifts = { deletedCount: 0 };
        
        if (machineType === 'Salt Filling Machine') {
            console.log(`   🧂 Deleting Salt Machine shifts for ${machineId}...`);
            deletedShifts = await SaltMachine.deleteMany({ machineId: machineId });
            
            const remainingShifts = await SaltMachine.find({ machineId: machineId });
            if (remainingShifts.length > 0) {
                console.log(`   ⚠️  WARNING: Still found ${remainingShifts.length} salt shifts. Force deleting...`);
                await SaltMachine.deleteMany({ machineId: machineId });
            }
        } 
        else if (machineType === 'Powder Filling Machine') {
            console.log(`   🥄 Deleting Powder Machine shifts for ${machineId}...`);
            deletedShifts = await PowderMachine.deleteMany({ machineId: machineId });
            
            const remainingShifts = await PowderMachine.find({ machineId: machineId });
            if (remainingShifts.length > 0) {
                console.log(`   ⚠️  WARNING: Still found ${remainingShifts.length} powder shifts. Force deleting...`);
                await PowderMachine.deleteMany({ machineId: machineId });
            }
        }
        else {
            console.log(`   ⚠️  Unknown machine type: ${machineType}. Skipping shift deletion.`);
        }
        
        console.log(`   ✅ PERMANENTLY DELETED ${deletedShifts.deletedCount} work shifts`);
        
        const deletedMachine = await Machine.findByIdAndDelete(req.params.id);
        if (deletedMachine) {
            console.log(`   ✅ PERMANENTLY DELETED machine: ${deletedMachine.machineId} - ${deletedMachine.name}`);
        }
        
        res.json({ 
            message: `Machine and ALL related ${machineType} work shifts permanently deleted`,
            deletedMachine: {
                id: machineToDelete._id,
                machineId: machineToDelete.machineId,
                name: machineToDelete.name,
                type: machineToDelete.type, 
                ip: machineToDelete.ip,
                userId: machineToDelete.userId
            },
            deletedShiftsCount: deletedShifts.deletedCount,
            machineType: machineType, 
            status: 'PERMANENTLY_DELETED'
        });
        
    } catch (error) {
        console.error('❌ DB SERVER: DELETE MACHINE ERROR:', error.message);
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