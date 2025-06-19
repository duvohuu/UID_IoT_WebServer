import Machine from "../models/Machine.js";
import User from "../models/User.js";
import WorkShift from "../models/Workshift.js"; 
import mongoose from "mongoose";


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
    const session = await mongoose.startSession();
    
    try {
        session.startTransaction();        
        const machineToDelete = await Machine.findById(req.params.id).session(session);
        if (!machineToDelete) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Machine not found' });
        }
        
        console.log('DELETING MACHINE:', machineToDelete.machineId);
        console.log('Deleting work shifts for machine:', machineToDelete.machineId);
        const deletedShifts = await WorkShift.deleteMany(
            { machineId: machineToDelete.machineId },
            { session }
        );
        console.log(`Deleted ${deletedShifts.deletedCount} work shifts`);
        
        await Machine.findByIdAndDelete(req.params.id, { session });
        console.log('MACHINE DELETED SUCCESSFULLY');
        
        await session.commitTransaction();
        
        res.json({ 
            message: 'Machine and related work shifts deleted successfully',
            deletedMachine: {
                machineId: machineToDelete.machineId,
                name: machineToDelete.name,
                ip: machineToDelete.ip,
                userId: machineToDelete.userId
            },
            deletedShiftsCount: deletedShifts.deletedCount
        });
        
    } catch (error) {
        await session.abortTransaction();
        console.error('❌ DELETE MACHINE ERROR:', error);
        res.status(500).json({ message: error.message });
    } finally {
        session.endSession();
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