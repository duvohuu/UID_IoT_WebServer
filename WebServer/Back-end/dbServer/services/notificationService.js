import axios from "axios";
import SaltMachine from "../models/SaltMachine.js";

class NotificationService {
    constructor() {
        this.mainServerUrl = process.env.MAIN_SERVER_URL || "http://localhost:5000";
    }

    async notifyMainServer(machine) {
        try {
            await axios.post(`${this.mainServerUrl}/api/internal/machine-update`, {
                id: machine._id,
                machineId: machine.machineId,
                ip: machine.ip,
                name: machine.name,
                type: machine.type,
                location: machine.location,
                isConnected: machine.isConnected,
                status: machine.status,
                lastUpdate: machine.lastUpdate?.toISOString(),
                lastHeartbeat: machine.lastHeartbeat?.toISOString(),
                parameters: machine.parameters,
                uptime: machine.uptime,
                lastError: machine.lastError
            });
        } catch (error) {
            console.error(`[${machine.name}] Failed to notify main server:`, error.message);
        }
    }

    async notifyMainServerShiftCompleted(shift) {
        try {
            await axios.post(`${this.mainServerUrl}/api/internal/shift-completed`, {
                shiftId: shift.shiftId,
                machineId: shift.machineId,
                machineName: shift.machineName,
                userId: shift.userId,
                startTime: shift.startTime,
                endTime: shift.endTime,
                duration: shift.duration,
                totalBottles: shift.totalBottlesProduced,
                totalWeight: shift.totalWeightFilled,
                finalData: shift.finalData
            });
            // console.log(`📡 [${shift.machineName}] Shift completion notified to mainServer`);
        } catch (error) {
            // console.error(`❌ Error notifying shift completion:`, error.message);
        }
    }

    async notifyMainServerShiftStarted(shift) {
        try {
            await axios.post(`${this.mainServerUrl}/api/internal/shift-started`, {
                shiftId: shift.shiftId,
                machineId: shift.machineId,
                machineName: shift.machineName,
                userId: shift.userId,
                startTime: shift.startTime,
                status: shift.status,
                finalData: shift.finalData
            });
            // console.log(`📡 [${shift.machineName}] Shift start notified to mainServer`);
        } catch (error) {
            // console.error(`❌ Error notifying shift start:`, error.message);
        }
    }

    async notifyMainServerShiftChanged(shift) {
        try {
            const latestShift = await SaltMachine.findById(shift._id);
            if (!latestShift) {
                console.error(`❌ Shift ${shift.shiftId} not found in database`);
                return;
            }

            const payload = {
                shiftId: latestShift.shiftId, 
                machineId: latestShift.machineId, 
                machineName: latestShift.machineName,
                userId: latestShift.userId,
                operatorName: latestShift.operatorName,
                machineNumber: latestShift.machineNumber,
                status: latestShift.status, 
                machineStatus: latestShift.machineStatus,
                saltTankStatus: latestShift.saltTankStatus,
                saltType: latestShift.saltType,
                targetWeight: latestShift.targetWeight, 
                totalWeightFilled: latestShift.totalWeightFilled,
                totalBottlesProduced: latestShift.totalBottlesProduced,
                activeLinesCount: latestShift.activeLinesCount,
                shiftNumber: latestShift.shiftNumber, 
                errorCode: latestShift.errorCode,
                motorControl: latestShift.motorControl,
                timeTracking: latestShift.timeTracking,
                efficiency: latestShift.efficiency,
                pauseTracking: latestShift.pauseTracking,
                loadcellConfigs: latestShift.loadcellConfigs,
            };
            
            console.log(`📤 [${latestShift.machineName}] Sending notification: ${latestShift.shiftId} -> ${latestShift.status}`);
            
            await axios.post(`${this.mainServerUrl}/api/internal/shift-changed`, payload, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`[${latestShift.machineName}] Notification sent successfully: ${latestShift.shiftId} -> ${latestShift.status}`);
        } catch (error) {
            console.error('Failed to notify mainServer about shift status change:', error.message);
        }
    }
}

export const notificationService = new NotificationService();