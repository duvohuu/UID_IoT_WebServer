import WorkShift from "../models/Workshift.js";
import { notificationService } from "./notificationService.js";
import { RegisterUtils } from '../utils/registerUtils.js';
import { CalculationUtils } from '../utils/calculationUtils.js';
import { DataUtils } from '../utils/dataUtils.js';

class WorkShiftService {
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
                '40001': registers[0] || 0,  // Trạng thái hoạt động
                '40002': registers[1] || 0,  // Trạng thái bồn cấp muối
                '40003': registers[2] || 0,  // Loại muối
                '40004': registers[3] || 0,  // Khối lượng cần chiết
                '40005': registers[4] || 0,  // Tổng KL (Low)
                '40006': registers[5] || 0,  // Tổng KL (High)
                '40007': registers[6] || 0,  // Tổng số chai
                '40008': registers[7] || 0,  // Số line hoạt động
                '40009': registers[8] || 0,  // ID ca làm việc (Low)
                '40010': registers[9] || 0,  // ID ca làm việc (High)
                '40011': registers[10] || 0  // Mã lỗi
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
        
        console.log(`\n🔍 [${machine.name}] === SHIFT CHECK ===`);
        console.log(`   🏭 Machine ID: ${machine.machineId}`); 
        console.log(`   🏭 Machine Number: ${machineNumber}`); 
        console.log(`   📋 Shift Number: ${shiftNumber}`);
        console.log(`   🆔 Shift ID: ${shiftId}`);
        
        if (shiftNumber === 0) {
            console.log(`⏸️ [${machine.name}] No active shift (ID = 0)`);
            console.log(`🔍 [${machine.name}] === END SHIFT CHECK ===\n`);
            return;
        }

        await this.checkForShiftChange(machine, shiftId);

        try {
            const existingShift = await WorkShift.findOne({ shiftId: shiftId });
            
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
        
        console.log(`🔍 [${machine.name}] === END SHIFT CHECK ===\n`);
    }

    // ========================================
    // CREATE NEW SHIFT
    // ========================================
    async createNewShiftFromData(machine, shiftId, machineNumber, shiftNumber, currentParameters) {
        try {
            const currentMachineStatus = currentParameters.monitoringData['40001'] || 0;

            let initialStatus;
            if (currentMachineStatus == 0) {
                initialStatus = 'complete';
            } else if (currentMachineStatus == 1) {
                initialStatus = 'active';
            } else {
                initialStatus = 'paused';
            }
            const newShift = new WorkShift({
                shiftId,
                machineId: machine.machineId,
                machineName: machine.name,
                userId: machine.userId,
                machineNumber,
                shiftNumber,
                status: initialStatus,
                pauseTracking: {
                    totalPausedMinutes: 0,
                    currentPausedStart: initialStatus === 'paused' ? new Date() : null,
                    pausedHistory: []
                }
            });

            if (initialStatus === 'paused') {
                console.log(`[${shiftId}] New shift created in PAUSED state - tracking pause from creation`);
            }
                        
            DataUtils.transformWorkShiftData(
                newShift, 
                currentParameters.monitoringData, 
                currentParameters.adminData
            );

            if (newShift.timeTracking) {
                newShift.timeTracking.shiftPausedTime = 0;
            }
            
            CalculationUtils.calculateAllMetrics(newShift);
            
            await newShift.save();
            console.log(`[${machine.name}] Created new shift: ${shiftId}`);

            try {
                await notificationService.notifyMainServerShiftChanged(newShift);
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
            const currentMachineStatus = currentParameters.monitoringData['40001'] || 0;
            const previousStatus = shift.status;

            let newStatus;
            if (currentMachineStatus == 0) {
                newStatus = 'complete';
            }
            else if (currentMachineStatus == 1) {
                newStatus = 'active';
            }
            else {
                newStatus = 'paused';
            }

            const currentTime = new Date();

            if (!shift.pauseTracking) {
                shift.pauseTracking = {
                    totalPausedMinutes: 0,
                    pausedHistory: []
                }
            }

            if (previousStatus !== newStatus) {
                console.log(`[${shift.shiftId}] Status transition: ${previousStatus} → ${newStatus}`);
                shift.status = newStatus;
                if (newStatus === 'paused' && previousStatus !== 'paused') {
                    shift.pauseTracking.pausedHistory.push({
                        startTime: currentTime,
                        endTime: null, 
                        durationMinutes: 0
                    });
                    console.log(`[${shift.shiftId}] Started pause at: ${currentTime.toLocaleString('vi-VN')}`);
                }
                
                if (previousStatus === 'paused' && newStatus !== 'paused') {
                    const lastPause = shift.pauseTracking.pausedHistory[shift.pauseTracking.pausedHistory.length - 1];
                    
                    if (lastPause && !lastPause.endTime) {
                        const pauseDurationMs = currentTime - lastPause.startTime;
                        const pauseDurationMinutes = pauseDurationMs / (1000 * 60);
                        
                        lastPause.endTime = currentTime;
                        lastPause.durationMinutes = pauseDurationMinutes;
                        
                        shift.pauseTracking.totalPausedMinutes += pauseDurationMinutes;
                        
                        console.log(`[${shift.shiftId}] Ended pause. Duration: ${pauseDurationMinutes} minutes. Total paused: ${shift.pauseTracking.totalPausedMinutes} minutes`);
                    }
                }
            }

            if (newStatus === 'paused') {
                const currentPause = shift.pauseTracking.pausedHistory[shift.pauseTracking.pausedHistory.length - 1];
                if (currentPause && !currentPause.endTime) {
                    const currentPauseDurationMs = currentTime - currentPause.startTime;
                    const currentPauseDurationMinutes = Math.floor(currentPauseDurationMs / (1000 * 60));
                    currentPause.durationMinutes = currentPauseDurationMinutes;
                    
                    console.log(`[${shift.shiftId}] Currently paused for: ${currentPauseDurationMinutes} minutes`);
                }
            }

            const totalPausedMinutes = shift.pauseTracking.pausedHistory.reduce((total, pause) => {
                return total + (pause.durationMinutes || 0);
            }, 0);

            shift.pauseTracking.totalPausedMinutes = totalPausedMinutes;
            DataUtils.transformWorkShiftData(
                shift, 
                currentParameters.monitoringData, 
                currentParameters.adminData
            );

            if (shift.timeTracking) {
                shift.timeTracking.shiftPausedTime = shift.pauseTracking.totalPausedMinutes || 0;
            }
            
            CalculationUtils.calculateAllMetrics(shift);
            
            await shift.save();
            console.log(`Updated shift: ${shift.shiftId}`);

            try {
                await notificationService.notifyMainServerShiftChanged(shift);
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
                const previousShift = await WorkShift.findOne({ shiftId: lastShiftId, status: 'active' });
                
                if (previousShift) {
                    const previousShiftStatus = previousShift.machineStatus;
                    
                    if (previousShiftStatus == 0) {
                        previousShift.status = 'complete';
                    } else {
                        previousShift.status = 'incomplete';
                    }
                    
                    await previousShift.save();

                    try {
                        await notificationService.notifyMainServerShiftChanged(previousShift);
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
}

export const workShiftService = new WorkShiftService();