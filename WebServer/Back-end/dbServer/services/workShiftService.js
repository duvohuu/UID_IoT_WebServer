import WorkShift from "../models/Workshift.js";
import { notificationService } from "./notificationService.js";
import { RegisterUtils } from '../utils/registerUtils.js';
import { CalculationUtils } from '../utils/calculationUtils.js';
import { DataUtils } from '../utils/dataUtils.js';

class WorkShiftService {
    constructor() {
        this.processedShifts = new Map();
        this.lastKnownShifts = new Map();
        this.lastMachineStatus = new Map();
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
            await this.checkAndCreateShiftByID(machine, currentParameters);
        } catch (error) {
            console.error(`❌ [${machine.name}] Work shift tracking error:`, error.message);
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

        await this.checkForShiftChange(machine, shiftId, currentParameters);

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
            const newShift = new WorkShift({
                shiftId,
                machineId: machine.machineId,
                machineName: machine.name,
                userId: machine.userId,
                machineNumber,
                shiftNumber,
                status: 'active',
                pausedIntervals: [],
            });
            
            // Set initial machine status
            this.lastMachineStatus.set(machine.machineId, currentParameters.monitoringData['40001'] || 0);
            
            DataUtils.transformWorkShiftData(
                newShift, 
                currentParameters.monitoringData, 
                currentParameters.adminData
            );
            
            CalculationUtils.calculateAllMetrics(newShift);
            
            await newShift.save();
            console.log(`[${machine.name}] Created new shift: ${shiftId}`);
            
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
            const lastStatus = this.lastMachineStatus.get(shift.machineId) || 0;

            // Handle machine status change for pause tracking
            if (currentMachineStatus !== lastStatus) {
                console.log(`🔄 [${shift.machineName}] Status change: ${lastStatus} → ${currentMachineStatus}`);
                CalculationUtils.handleMachineStatusChange(shift, currentMachineStatus, new Date());
                this.lastMachineStatus.set(shift.machineId, currentMachineStatus);
            }

            // Transform register data
            DataUtils.transformWorkShiftData(
                shift, 
                currentParameters.monitoringData, 
                currentParameters.adminData
            );
            
            // Calculate metrics with pause consideration
            CalculationUtils.calculateAllMetrics(shift);
            
            await shift.save();
            console.log(`🔄 Updated shift: ${shift.shiftId}`);
            
        } catch (error) {
            console.error(`❌ Error updating shift ${shift.shiftId}:`, error.message);
            throw error;
        }
    }

    // ========================================
    // SHIFT CHANGE DETECTION
    // ========================================
    async checkForShiftChange(machine, currentShiftId, currentParameters) { 
        try {            
            const lastShiftId = this.lastKnownShifts.get(machine.machineId);
            console.log(`[${machine.name}] lastShiftId: ${lastShiftId}, currentShiftId: ${currentShiftId}`);
            
            if (lastShiftId && lastShiftId !== currentShiftId) {
                console.log(`[${machine.name}] SHIFT CHANGED: ${lastShiftId} → ${currentShiftId}`);
                
                const previousShift = await WorkShift.findOne({ shiftId: lastShiftId, status: 'active' });
                
                if (previousShift) {
                    // Close any ongoing pause before ending shift
                    const ongoingPause = previousShift.pausedIntervals?.find(interval => !interval.pauseEnd);
                    if (ongoingPause) {
                        console.log(`⏸️ [${machine.name}] Closing ongoing pause for shift end`);
                        CalculationUtils.addPauseInterval(previousShift, null, new Date());
                    }

                    const previousMachineStatus = currentParameters.monitoringData['40001'] || 0;
                    
                    // Extract time using RegisterUtils
                    const startTime = RegisterUtils.extractTimeFromRegisters(currentParameters.adminData || {}, 'start');
                    const endTime = RegisterUtils.extractTimeFromRegisters(currentParameters.adminData || {}, 'end');
                    
                    // if (startTime) previousShift.startTime = startTime;
                    // if (endTime) {
                    //     previousShift.endTime = endTime;
                    // } else {
                    //     previousShift.endTime = new Date(); 
                    // }
                    
                    // Recalculate with pause consideration
                    CalculationUtils.calculateAllMetrics(previousShift);
                    
                    // Generate pause summary
                    const pauseSummary = CalculationUtils.getPauseSummary(previousShift);
                    console.log(`[${machine.name}] Pause summary:`, pauseSummary);
                    
                    if (previousMachineStatus == 0) {
                        previousShift.status = 'complete';
                        console.log(`Logic: Machine was STOPPED → COMPLETED`);
                    } else {
                        previousShift.status = 'incomplete';
                        console.log(`Logic: Machine was RUNNING → INCOMPLETE`);
                    }
                    
                    await previousShift.save();
                    
                    // Notify with enhanced data
                    try {
                        await notificationService.notifyMainServerShiftStatusChanged(previousShift, {
                            eventType: previousShift.status === 'complete' ? 'shift_completed' : 'shift_changed_incomplete',
                            reason: `Transition to ${currentShiftId} - Machine status: ${previousMachineStatus}`,
                            pauseSummary: pauseSummary, // ✅ ADD: Include pause summary
                            timestamp: new Date().toISOString()
                        });
                    } catch (notifyError) {
                        console.error(`[${machine.name}] Notification error:`, notifyError.message);
                    }
                }
            }
            
            if (currentShiftId !== 'M1_S0') {
                this.lastKnownShifts.set(machine.machineId, currentShiftId);
            }
            
        } catch (error) {
            console.error(`[${machine.name}] Error in checkForShiftChange:`, error.message);
            
            if (currentShiftId !== 'M1_S0') {
                this.lastKnownShifts.set(machine.machineId, currentShiftId);
            }
        }
    }

    async getShiftStatistics(shiftId) {
        try {
            const shift = await WorkShift.findOne({ shiftId });
            if (!shift) throw new Error('Shift not found');

            const pauseSummary = CalculationUtils.getPauseSummary(shift);
            
            return {
                shiftId: shift.shiftId,
                machineName: shift.machineName,
                duration: shift.duration, // Active duration
                totalDuration: shift.totalDuration, // Total duration
                efficiency: shift.efficiency,
                fillRate: shift.fillRate,
                utilization: shift.utilization,
                pauseSummary: pauseSummary,
                status: shift.status,
                startTime: shift.startTime,
                endTime: shift.endTime
            };
        } catch (error) {
            console.error('Error getting shift statistics:', error.message);
            throw error;
        }
    }

    // ========================================
    // Manual pause/resume methods for external control
    // ========================================
    async pauseShift(shiftId, reason = 'Manual pause') {
        try {
            const shift = await WorkShift.findOne({ shiftId, status: 'active' });
            if (!shift) throw new Error('Active shift not found');

            CalculationUtils.addPauseInterval(shift, new Date());
            shift.status = 'paused';
            
            await shift.save();
            console.log(`Manually paused shift: ${shiftId}`);
            
            return shift;
        } catch (error) {
            console.error('Error pausing shift:', error.message);
            throw error;
        }
    }

    async resumeShift(shiftId) {
        try {
            const shift = await WorkShift.findOne({ shiftId, status: 'paused' });
            if (!shift) throw new Error('Paused shift not found');

            CalculationUtils.addPauseInterval(shift, null, new Date());
            shift.status = 'active';
            
            CalculationUtils.calculateAllMetrics(shift);
            await shift.save();
            
            console.log(`Manually resumed shift: ${shiftId}`);
            
            return shift;
        } catch (error) {
            console.error('Error resuming shift:', error.message);
            throw error;
        }
    }
    
}

export const workShiftService = new WorkShiftService();