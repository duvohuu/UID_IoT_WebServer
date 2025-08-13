import PowderMachine from "../models/PowderMachine.js";
import { mainServerSyncService } from "./mainServerSyncService.js";
import { RegisterUtils } from '../utils/registerUtils.js';
import { CalculationUtils } from '../utils/calculationUtils.js';
import { PowderMachineDataUtils } from '../utils/powderMachineDataUtils.js';

class PowderMachineService {
    constructor() {
        this.lastShiftsId = new Map();
        this.lastMachinesStatus = new Map();
        this.lastShiftsStatuss = new Map(); 
    }
    // ========================================
    // MAIN TRACKING HANDLER
    // ========================================
    async handleTracking(machine, registers) {
        const currentParameters = {
            monitoringData: {
                '40001': registers[0] || 0,  
                '40002': registers[1] || 0,  
                '40003': registers[2] || 0,  
                '40004': registers[3] || 0,  
                '40005': registers[4] || 0,  
                '40006': registers[5] || 0,  
                '40007': registers[6] || 0,  
                '40008': registers[7] || 0,  
                '40009': registers[8] || 0,  
                '40010': registers[9] || 0,  
                '40011': registers[10] || 0  
            },
            adminData: Object.fromEntries(
                Array.from({length: 59}, (_, i) => [
                    (40011 + i).toString(), 
                    registers[i + 10] || 0
                ])
            )
        };

        try {
            const currentMachineStatus = currentParameters.monitoringData['40001'];
            this.lastMachinesStatus.set(machine.machineId, currentMachineStatus);
            await this.checkAndCreateShiftByID(machine, currentParameters);
        } catch (error) {
            console.error(`[${machine.name}] Work shift tracking error:`, error.message);
        }
    }

    // ========================================
    // SHIFT CHECK AND CREATE LOGIC
    // ========================================
    async checkAndCreateShiftByID(machine, currentParameters) {
        const shiftInfo = RegisterUtils.getShiftIdFromParameters(machine, currentParameters);
        const { shiftId, shiftNumber, machineNumber } = shiftInfo;
        
        console.log(`\n[${machine.name}] === SHIFT CHECK ===`);
        console.log(`Shift ID: ${shiftId}`);
        
        if (shiftNumber === 0) {
            console.log(`[${machine.name}] No active shift (ID = 0)`);
            console.log(`[${machine.name}] === END SHIFT CHECK ===\n`);
            return;
        }

        await this.checkForShiftChange(machine, shiftId);

        try {
            const existingShift = await PowderMachine.findOne({ shiftId: shiftId });
            
            if (existingShift) {
                console.log(`[${machine.name}] SHIFT EXISTS - Updating: ${shiftId}`);
                await this.updateExistingShift(existingShift, currentParameters);
            } else {
                console.log(`[${machine.name}] NEW SHIFT DETECTED - Creating: ${shiftId}`);
                await this.createNewShiftFromData(machine, shiftId, machineNumber, shiftNumber, currentParameters);
            }
            
        } catch (error) {
            console.error(`[${machine.name}] Error processing shift ${shiftId}:`, error.message);
        }
        
        console.log(`[${machine.name}] === END SHIFT CHECK ===\n`);
    }

    // ========================================
    // CREATE NEW SHIFT
    // ========================================
    async createNewShiftFromData(machine, shiftId, machineNumber, shiftNumber, currentParameters) {
        try {
            const statusReg = currentParameters.monitoringData['40001'] || 0;
            const currentMachineStatus = statusReg & 0xF;
            
            let initialStatus;
            if (currentMachineStatus == 2) {
                initialStatus = 'paused';
            }
            else {
                initialStatus = 'active';
            }
            const newShift = new PowderMachine({
                shiftId,
                machineId: machine.machineId,
                machineName: machine.name,
                machineType: 'Powder Filling Machine',
                userId: machine.userId,
                machineNumber,
                shiftNumber,
                status: initialStatus,
                pausedHistory: initialStatus === 'paused' ? [{
                    startTime: new Date(),
                    endTime: null,
                    durationMinutes: 0
                }] : []
            });

            if (initialStatus === 'paused') {
                console.log(`[${shiftId}] New shift created in PAUSED state - tracking pause from creation`);
            }

            PowderMachineDataUtils.transformWorkShiftData(
                newShift,
                currentParameters.monitoringData,
                currentParameters.adminData
            );

            if (newShift.timeTracking) {
                newShift.timeTracking.shiftPausedTime = 0;
            }
            
            CalculationUtils.calculateAllMetrics(newShift);
            
            await newShift.save();
            try {
                await mainServerSyncService.notifyMainServerShiftChanged(newShift);
            } catch (notifyError) {
                console.error(`[${machine.name}] Failed to notify new shift:`, notifyError.message);
            }
            
            return newShift;
        } catch (error) {
            console.error(`[${machine.name}] Error creating new shift:`, error.message);
            throw error;
        }
    }

    // ========================================
    // UPDATE EXISTING SHIFT
    // ========================================
    async updateExistingShift(shift, currentParameters) {
        try {
            const statusReg = currentParameters.monitoringData['40001'] || 0;
            const currentMachineStatus = statusReg & 0xF;
            const previousStatus = shift.status;

            let newStatus;
            if (currentMachineStatus == 0) {
                newStatus = 'complete';
            }
            else if (currentMachineStatus == 1 || currentMachineStatus == 3) {
                newStatus = 'active';
            }
            else if (currentMachineStatus == 2) {
                newStatus = 'paused';
            }
            const currentTime = new Date();

            if (!shift.pausedHistory) {
                shift.pausedHistory = [];
            }

            if (previousStatus !== newStatus) {
                shift.status = newStatus;
                console.log(`[${shift.shiftId}] Status changed: ${previousStatus} → ${newStatus}`);
                
                // Bắt đầu pause
                if (newStatus === 'paused' && previousStatus !== 'paused') {
                    shift.pausedHistory.push({
                        startTime: currentTime,
                        endTime: null, 
                        durationMinutes: 0
                    });
                    console.log(`[${shift.shiftId}] ⏸️ Started pause at: ${currentTime.toLocaleString('vi-VN')}`);
                }
                
                // Kết thúc pause
                if (previousStatus === 'paused' && newStatus !== 'paused') {
                    const lastPause = shift.pausedHistory[shift.pausedHistory.length - 1];
                    
                    if (lastPause && !lastPause.endTime) {
                        const pauseDurationMs = currentTime - lastPause.startTime;
                        const pauseDurationMinutes = pauseDurationMs / (1000 * 60);
                        
                        lastPause.endTime = currentTime;
                        lastPause.durationMinutes = pauseDurationMinutes;
                        
                        console.log(`[${shift.shiftId}] ▶️ Ended pause. Duration: ${pauseDurationMinutes.toFixed(2)} minutes`);
                    }
                }
            }

            if (newStatus === 'paused') {
                const currentPause = shift.pausedHistory[shift.pausedHistory.length - 1];
                if (currentPause && !currentPause.endTime) {
                    const currentPauseDurationMs = currentTime - currentPause.startTime;
                    const currentPauseDurationMinutes = currentPauseDurationMs / (1000 * 60);
                    currentPause.durationMinutes = currentPauseDurationMinutes;
                    
                    console.log(`[${shift.shiftId}] ⏸️ Currently paused for: ${currentPauseDurationMinutes.toFixed(2)} minutes`);
                }
            }

            const completedPauses = shift.pausedHistory
                .filter(pause => pause.endTime !== null)
                .reduce((total, pause) => total + (pause.durationMinutes || 0), 0);
            
            const currentPauseTime = shift.pausedHistory
                .filter(pause => pause.endTime === null)
                .reduce((total, pause) => total + (pause.durationMinutes || 0), 0);

            PowderMachineDataUtils.transformWorkShiftData(
                shift,
                currentParameters.monitoringData,
                currentParameters.adminData
            );

            // ✅ CHỈ cần shiftPausedTime cho hiển thị
            if (shift.timeTracking) {
                shift.timeTracking.shiftPausedTime = completedPauses + currentPauseTime;
            }
            
            CalculationUtils.calculateAllMetrics(shift);
            
            await shift.save();
            console.log(`[${shift.shiftId}] ✅ Updated - Paused time: ${shift.timeTracking?.shiftPausedTime?.toFixed(2)} min`);

            try {
                await mainServerSyncService.notifyMainServerShiftChanged(shift);
            } catch (notifyError) {
                console.error(`[${shift.shiftId}] Failed to notify shift change:`, notifyError.message);
            }
            
        } catch (error) {
            console.error(`Error updating shift ${shift.shiftId}:`, error.message);
            throw error;
        }
    }

    // ========================================
    // SHIFT CHANGE DETECTION
    // ========================================
    async checkForShiftChange(machine, currentShiftId) { 
        try {            
            const lastShiftId = this.lastShiftsId.get(machine.machineId);            
            if (lastShiftId && lastShiftId !== currentShiftId) {                
                const previousShift = await PowderMachine.findOne({ shiftId: lastShiftId, status: 'active' });
                
                if (previousShift) {
                    const previousShiftStatus = previousShift.machineStatus;
                    
                    if (previousShiftStatus == 0) {
                        previousShift.status = 'complete';
                    } else {
                        previousShift.status = 'incomplete';
                    }
                    
                    await previousShift.save();

                    try {
                        await mainServerSyncService.notifyMainServerShiftChanged(previousShift);
                    } catch (notifyError) {
                        console.error(`[${machine.name}] Failed to notify shift change:`, notifyError.message);
                    }
                }
            }
            
            if (currentShiftId !== 'M1_S0') {
                this.lastShiftsId.set(machine.machineId, currentShiftId);
            }
            
        } catch (error) {
            console.error(`[${machine.name}] Error in checkForShiftChange:`, error.message);
            
            if (currentShiftId !== 'M1_S0') {
                this.lastShiftsId.set(machine.machineId, currentShiftId);
            }
        }
    }
    // ========================================
    // BACKUP SHIFT HANDLING
    // ========================================
    async handleBackupShift(machine, shiftData, shiftIndex) {
        if (!shiftData || !shiftData.registers) {
            console.log(`[${machine.name}] No valid data for backup shift ${shiftIndex + 1}`);
            return;
        }

        console.log(`[${machine.name}] Processing backup shift ${shiftIndex + 1}...`);

        try {
            const currentParameters = {
                monitoringData: {
                    '40001': shiftData.registers[0] || 0,
                    '40002': shiftData.registers[1] || 0,
                    '40003': shiftData.registers[2] || 0,
                    '40004': shiftData.registers[3] || 0,
                    '40005': shiftData.registers[4] || 0,
                    '40006': shiftData.registers[5] || 0,
                    '40007': shiftData.registers[6] || 0,
                    '40008': shiftData.registers[7] || 0,
                    '40009': shiftData.registers[8] || 0,
                    '40010': shiftData.registers[9] || 0,
                    '40011': shiftData.registers[10] || 0
                },
                adminData: Object.fromEntries(
                    Array.from({length: 59}, (_, i) => [
                        (40012 + i).toString(), 
                        shiftData.registers[i + 11] || 0
                    ])
                )
            };

            const shiftInfo = RegisterUtils.getShiftIdFromParameters(machine, currentParameters);
            const { shiftId, shiftNumber } = shiftInfo;

            if (shiftNumber === 0) {
                console.log(`[${machine.name}] Backup shift ${shiftIndex + 1} has no valid shift ID`);
                return;
            }

            console.log(`[${machine.name}] Backup shift ${shiftIndex + 1} ID: ${shiftId}`);

            const existingShift = await PowderMachine.findOne({ shiftId: shiftId });
            
            if (!existingShift) {
                console.log(`[${machine.name}] Creating missing shift from backup ${shiftIndex + 1}: ${shiftId}`);
                await this.createShiftFromBackup(machine, shiftInfo, currentParameters, shiftIndex + 1);
            } else {
                console.log(`[${machine.name}] Backup shift ${shiftId} already exists, skipping`);
            }

        } catch (error) {
            console.error(`[${machine.name}] Error processing backup shift ${shiftIndex + 1}:`, error.message);
        }
    }

    async createShiftFromBackup(machine, shiftInfo, currentParameters, backupIndex) {
        try {
            const { shiftId, shiftNumber, machineNumber } = shiftInfo;
            const statusReg = currentParameters.monitoringData['40001'] || 0;
            const machineStatus = statusReg & 0xF;

            let initialStatus;
            if (machineStatus == 0) {
                initialStatus = 'complete';
            } else {
                initialStatus = 'incomplete';
            }

            const newShift = new PowderMachine({
                shiftId,
                machineId: machine.machineId,
                machineName: machine.name,
                machineType: 'Powder Filling Machine',
                userId: machine.userId,
                machineNumber,
                shiftNumber,
                status: initialStatus,
                pausedHistory: [],
                isFromBackup: true, 
                backupIndex: backupIndex
            });

            PowderMachineDataUtils.transformWorkShiftData(
                newShift,
                currentParameters.monitoringData,
                currentParameters.adminData
            );

            if (newShift.timeTracking) {
                newShift.timeTracking.shiftPausedTime = 0;
            }
            
            CalculationUtils.calculateAllMetrics(newShift);
            
            await newShift.save();
            console.log(`[${machine.name}] Created backup shift: ${shiftId} (backup ${backupIndex})`);

            try {
                await mainServerSyncService.notifyMainServerShiftChanged(newShift);
            } catch (notifyError) {
                console.error(`[${machine.name}] Failed to notify backup shift:`, notifyError.message);
            }
            
            return newShift;

        } catch (error) {
            console.error(`[${machine.name}] Error creating backup shift:`, error.message);
            throw error;
        }
    }
}

export const powderMachineService = new PowderMachineService();