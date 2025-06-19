import { parse } from "dotenv";
import WorkShift from "../models/Workshift.js";
import { notificationService } from "./notificationService.js";

class WorkShiftService {
    constructor() {
        // Map theo dõi ca đã được xử lý
        this.processedShifts = new Map();
        this.lastKnownShifts = new Map();
    }

    async handleTracking(machine, registers) {
        // TẠO DATA STRUCTURE MỚI (48 registers total)
        const currentParameters = {
            // Monitoring data (40001-40008)
            monitoringData: {
                '40001': registers[0] || 0,  // Trạng thái hoạt động
                '40002': registers[1] || 0,  // Trạng thái bồn cấp muối
                '40003': registers[2] || 0,  // Loại muối
                '40004': registers[3] || 0,  // Khối lượng cần chiết
                '40005': registers[4] || 0,  // Tổng KL (Low)
                '40006': registers[5] || 0,  // Tổng KL (High)
                '40007': registers[6] || 0,  // Tổng số chai
                '40008': registers[7] || 0   // Số line hoạt động
            },
            // Admin data (40009-40048)
            adminData: Object.fromEntries(
                Array.from({length: 40}, (_, i) => [
                    (40009 + i).toString(), 
                    registers[i + 8] || 0
                ])
            )
        };

        try {
            await this.checkAndCreateShiftByID(machine, currentParameters);

        } catch (error) {
            console.error(`❌ [${machine.name}] Work shift tracking error:`, error.message);
        }
    }

    // KIỂM TRA VÀ TẠO CA THEO ID
    async checkAndCreateShiftByID(machine, currentParameters) {
        const shiftInfo = this.getShiftIdFromParameters(machine, currentParameters);
        const { shiftId, shiftNumber, machineNumber, shiftIdLow, shiftIdHigh } = shiftInfo
        
        console.log(`\n🔍 [${machine.name}] === SHIFT CHECK ===`);
        console.log(`   🏭 Machine ID: ${machine.machineId}`); 
        console.log(`   🏭 Machine Number: ${machineNumber}`); 
        console.log(`   📋 Shift Number: ${shiftNumber}`);
        console.log(`   🆔 Shift ID: ${shiftId}`);
        
        // Nếu ID = 0, không có ca nào
        if (shiftNumber === 0) {
            console.log(`⏸️ [${machine.name}] No active shift (ID = 0)`);
            console.log(`🔍 [${machine.name}] === END SHIFT CHECK ===\n`);
            return;
        }

        await this.checkForShiftChange(machine, shiftId, currentParameters);

        try {
            // Kiểm tra ca đã tồn tại trong DB chưa
            const existingShift = await WorkShift.findOne({ shiftId: shiftId });
            
            if (existingShift) {
                // Ca đã tồn tại - chỉ cập nhật data
                console.log(`[${machine.name}] SHIFT EXISTS - Updating: ${shiftId}`);
                await this.updateExistingShift(existingShift, currentParameters);
            } else {
                // Ca chưa tồn tại - tạo mới
                console.log(`[${machine.name}] NEW SHIFT DETECTED - Creating: ${shiftId}`);
                await this.createNewShiftFromData(machine, shiftId, machineNumber, shiftNumber, currentParameters);
            }
            
        } catch (error) {
            console.error(`[${machine.name}] Error processing shift ${shiftId}:`, error.message);
        }
        
        console.log(`🔍 [${machine.name}] === END SHIFT CHECK ===\n`);
    }

    // TẠO CA MỚI TỪ DATA
    async createNewShiftFromData(machine, shiftId, machineNumber, shiftNumber, currentParameters) {
        try {
            console.log(`\n [${machine.name}] === CREATING NEW SHIFT ===`);
        
            // Trích xuất thời gian từ registers
            const startTime = this.extractTimeFromRegisters(currentParameters.adminData, 'start');
            const endTime   = this.extractTimeFromRegisters(currentParameters.adminData, 'end');
            
            console.log(`   ⏰ Start: ${startTime ? startTime.toISOString() : 'null'}`);
            console.log(`   ⏰ End: ${endTime ? endTime.toISOString() : 'null'}`);
            
            let status = 'active'; 
            let duration = 0;
            if (startTime && endTime) {
                duration = Math.round((endTime - startTime) / (1000 * 60));
            }
        
            // Tính total weight từ registers 40005-40006
            const totalWeight = this.calculateTotalWeight(currentParameters);
            
            // Predict efficiency
            if (totalWeight > 0 && duration > 0) {
                const predictedEfficiency = ((totalWeight / 1000) / (duration / 60)).toFixed(2);
            }
            
            const newShift = new WorkShift({
                shiftId: shiftId,
                machineId: machine.machineId,
                machineName: machine.name,
                userId: machine.userId,
                machineNumber: machineNumber,
                shiftNumber: shiftNumber,
                startTime: startTime,
                endTime: endTime,
                duration: duration,
                status: status,
                finalData: currentParameters,
                totalWeightFilled: totalWeight
            });
            
            await newShift.save();
            return newShift;
        }

        catch (error){
            console.error(`❌ [${machine.name}] Error creating new shift:`, error.message);
            throw error;      
        }
        
    }

    // CẬP NHẬT CA ĐÃ TỒN TẠI
    async updateExistingShift(shift, currentParameters) {
        try {
            console.log(`\n [${shift.machineName}] === UPDATING EXISTING SHIFT ===`);
        
            // Kiểm tra nếu ca bị gián đoạn trước đó
            if (shift.status === 'incomplete' || shift.status === 'interrupted') {
                console.log(`⚠️ [${shift.machineName}] Shift ${shift.shiftId} was ${shift.status}, now reconnected`);
                
                // Kiểm tra trạng thái máy hiện tại
                const currentMachineStatus = currentParameters.monitoringData['40001'];
                
                if (currentMachineStatus === 1) {
                    // Máy đang hoạt động lại -> chuyển về active
                    shift.status = 'active';
                    console.log(`[${shift.machineName}] Shift ${shift.shiftId} resumed: ${shift.status}`);
                } else {
                    // Máy vẫn dừng -> giữ nguyên status hoặc chuyển thành completed
                    if (shift.status === 'incomplete') {
                        shift.status = 'completed';
                        console.log(`[${shift.machineName}] Shift ${shift.shiftId} completed after reconnection`);
                    }
                }
            }
            
            const newWeight = this.calculateTotalWeight(currentParameters);
            shift.totalWeightFilled = newWeight;
            shift.finalData = currentParameters;
            

            const startTime = this.extractTimeFromRegisters(currentParameters.adminData, 'start');
            const endTime = this.extractTimeFromRegisters(currentParameters.adminData, 'end');

            if (startTime) shift.startTime = startTime;
            if (endTime) shift.endTime = endTime;
            if (startTime && endTime) {
                shift.duration = Math.round((endTime - startTime) / (1000 * 60));
            }
            
            await shift.save();
        }
        catch (error) {
            console.error(`❌ [${shift.machineName}] Error updating shift ${shift.shiftId}:`, error.message);
            throw error;
        }
        
    }

    // KIỂM TRA THAY ĐỔI CA
    async checkForShiftChange(machine, currentShiftId, currentParameters) { 
        try {            
            const lastShiftId = this.lastKnownShifts.get(machine.machineId);
            console.log(`🔍 [${machine.name}] lastShiftId: ${lastShiftId}, currentShiftId: ${currentShiftId}`);
            
            if (lastShiftId && lastShiftId !== currentShiftId) {
                console.log(`🚨 [${machine.name}] SHIFT CHANGED: ${lastShiftId} → ${currentShiftId}`);
                
                const previousShift = await WorkShift.findOne({ shiftId: lastShiftId, status: 'active' });
                console.log(`🔍 [${machine.name}] Found previous shift: ${!!previousShift}`);
                
                if (previousShift) {
                    const previousMachineStatus = previousShift.finalData?.monitoringData?.['40001'] || 0;
                  
                    // Extract thời gian từ register
                    const startTime = this.extractTimeFromRegisters(previousShift.finalData?.adminData || {}, 'start');
                    const endTime = this.extractTimeFromRegisters(previousShift.finalData?.adminData || {}, 'end');
                    
                    // Set thời gian từ register
                    if (startTime) {
                        previousShift.startTime = startTime;
                    }
                    
                    if (endTime) {
                        previousShift.endTime = endTime;
                    }
                    
                    if (startTime && endTime) {
                        previousShift.duration = Math.round((endTime - startTime) / (1000 * 60));
                    } else if (previousShift.startTime) {
                        // Fallback duration calculation
                        const fallbackEndTime = endTime || new Date();
                        previousShift.duration = Math.round((fallbackEndTime - new Date(previousShift.startTime)) / (1000 * 60));
                    }
                    
                    if (previousMachineStatus == 0) {
                        previousShift.status = 'completed';
                        console.log(`Logic: Machine was STOPPED (${previousMachineStatus}) → COMPLETED`);
                        
                        await previousShift.save();
                        console.log(`[${machine.name}] Marked ${lastShiftId} as COMPLETED - Machine was stopped before shift change (Register 40001: ${previousMachineStatus})`);
                        
                        // Notify UI
                        try {
                            await notificationService.notifyMainServerShiftStatusChanged(previousShift, {
                                eventType: 'shift_completed',
                                reason: `Normal transition to ${currentShiftId} - Machine was stopped (40001: ${previousMachineStatus})`,
                                timestamp: new Date().toISOString()
                            });
                        } catch (notifyError) {
                            console.error(`[${machine.name}] Notification error:`, notifyError.message);
                        }
                        
                    } else {
                        // Máy vẫn chạy → ca cũ chưa hoàn thành
                        previousShift.status = 'incomplete';
                        console.log(`   🔍 Logic: Machine was RUNNING (${previousMachineStatus}) → INCOMPLETE`);
                        
                        await previousShift.save();
                        console.log(`⚠️ [${machine.name}] Marked ${lastShiftId} as INCOMPLETE - Machine was still running when shift changed (Register 40001: ${previousMachineStatus})`);
                        
                        // Notify UI
                        try {
                            await notificationService.notifyMainServerShiftStatusChanged(previousShift, {
                                eventType: 'shift_changed_incomplete',
                                reason: `Changed to ${currentShiftId} - Machine was still running when shift changed (40001: ${previousMachineStatus})`,
                                timestamp: new Date().toISOString()
                            });
                        } catch (notifyError) {
                            console.error(`❌ [${machine.name}] Notification error:`, notifyError.message);
                        }
                    }
                    
                    console.log(`🔍 [${machine.name}] === END SHIFT CHANGE ANALYSIS ===`);
                    
                } else {
                    console.log(`⚠️ [${machine.name}] Previous shift ${lastShiftId} not found or not active`);
                }
            } else {
                console.log(`🔍 [${machine.name}] No shift change detected (last: ${lastShiftId}, current: ${currentShiftId})`);
            }
            
            // Cập nhật ca hiện tại
            if (currentShiftId !== 'M1_S0') {
                this.lastKnownShifts.set(machine.machineId, currentShiftId);
                console.log(`🔍 [${machine.name}] Updated lastKnownShift to: ${currentShiftId}`);
            }
            
        } catch (error) {
            console.error(`[${machine.name}] Error in checkForShiftChange:`, error.message);
            console.error(`[${machine.name}] Error stack:`, error.stack);
            
            if (currentShiftId !== 'M1_S0') {
                this.lastKnownShifts.set(machine.machineId, currentShiftId);
            }
        }
    }

    getShiftIdFromParameters(machine, currentParameters) {
        let shiftIdLow = 0;
        let shiftIdHigh = 0;
        let shiftNumber = 0;
        let machineNumber = 1;
        let shiftId = null;
        
        try {
            // Kiểm tra currentParameters tồn tại
            if (!currentParameters || !currentParameters.adminData) {
                console.error(`[${machine.name}] Invalid currentParameters structure`);
                return {
                    shiftId: null,
                    shiftNumber: 0,
                    machineNumber: 1,
                    shiftIdLow: 0,
                    shiftIdHigh: 0
                };
            }
            
            shiftIdLow = currentParameters.adminData['40009'] || 0;
            shiftIdHigh = currentParameters.adminData['40010'] || 0;
            shiftNumber = (shiftIdHigh * 65536) + shiftIdLow;
            
            // Lấy machine number từ machineId
            if (machine.machineId) {
                const machineMatch = machine.machineId.match(/(\d+)/);
                if (machineMatch) {
                    machineNumber = parseInt(machineMatch[1]);
                }
            }
            
            shiftId = `M${machineNumber}_S${shiftNumber}`;
            
        } catch (error) {
            console.error(`[${machine.name}] Error getting shift ID:`, error.message);
        }
        
        return {
            shiftId,
            shiftNumber,
            machineNumber,
            shiftIdLow,
            shiftIdHigh
        };
    }
    

    calculateTotalWeight(currentParameters) {
        try {
            const weightLow = currentParameters.monitoringData['40005'] || 0;
            const weightHigh = currentParameters.monitoringData['40006'] || 0;
            
            
            const buffer = new ArrayBuffer(4);
            const view = new DataView(buffer);
            
            view.setUint16(0, weightLow, true);  
            view.setUint16(2, weightHigh, true);  
            
            // Đọc lại dưới dạng float32
            const totalWeight = view.getFloat32(0, true);
        
            return totalWeight;
        } catch (error) {
            console.error('Error calculating total weight:', error);
            return 0;
        }
    }

    // TRÍCH XUẤT THỜI GIAN TỪ REGISTERS
    extractTimeFromRegisters(adminData, type) {
        try {
            // Registers cho start time: 40037-40042
            // Registers cho end time:  40043-40048
            
            let second, minute, hour, day, month, year;
            
            if (type === 'start') {
                second = adminData['40037'] || 0;
                minute = adminData['40038'] || 0;
                hour = adminData['40039'] || 0;
                day = adminData['40040'] || 1;
                month = adminData['40041'] || 1;
                year = adminData['40042'] || new Date().getFullYear();
            } else if (type === 'end') {
                second = adminData['40043'] || 0;
                minute = adminData['40044'] || 0;
                hour = adminData['40045'] || 0;
                day = adminData['40046'] || 1;
                month = adminData['40047'] || 1;
                year = adminData['40048'] || new Date().getFullYear();
            } else {
                return null;
            }
            
            // Kiểm tra giá trị hợp lệ
            if (year < 2020 || month < 1 || month > 12 || day < 1 || day > 31 || 
                hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
                return null;
            }
            
            const date = new Date(year, month - 1, day, hour, minute, second);
            return date;
            
        } catch (error) {
            console.error(`Error extracting ${type} time:`, error.message);
            return null;
        }
    }
}

export const workShiftService = new WorkShiftService();