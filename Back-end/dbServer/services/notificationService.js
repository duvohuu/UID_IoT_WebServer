import axios from "axios";
import SaltMachine from "../models/SaltMachine.js";
import PowderMachine from "../models/PowderMachine.js";

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

    async notifyMainServerShiftChanged(shift) {
        try {
            let latestShift, payload;
            if (shift.machineType === 'Powder Filling Machine') {
                latestShift = await PowderMachine.findById(shift._id);
                console.log('latestShift from DB:', latestShift);
                if (!latestShift) {
                    console.error(`❌ Powder shift ${shift.shiftId} not found in database`);
                    return;
                }
                payload = {
                    shiftId: latestShift.shiftId,
                    machineId: latestShift.machineId,
                    machineName: latestShift.machineName,
                    machineType: latestShift.machineType,
                    userId: latestShift.userId,
                    operatorName: latestShift.operatorName,
                    machineNumber: latestShift.machineNumber,
                    status: latestShift.status,
                    machineStatus: latestShift.machineStatus,
                    powderTankStatus: latestShift.powderTankStatus,
                    powderType: latestShift.powderType,
                    targetWeight: latestShift.targetWeight,
                    totalWeightFilled: latestShift.totalWeightFilled,
                    totalBottlesFilled: latestShift.totalBottlesFilled,
                    lineStatus: latestShift.lineStatus,
                    shiftNumber: latestShift.shiftNumber,
                    errorCode: latestShift.errorCode,
                    motorControl: latestShift.motorControl,
                    timeTracking: latestShift.timeTracking,
                    efficiency: latestShift.efficiency,
                    pauseTracking: latestShift.pauseTracking,
                    loadcellConfigs: latestShift.loadcellConfigs,
                };
            } else {
                latestShift = await SaltMachine.findById(shift._id);
                if (!latestShift) {
                    console.error(`❌ Salt shift ${shift.shiftId} not found in database`);
                    return;
                }
                payload = {
                    shiftId: latestShift.shiftId, 
                    machineId: latestShift.machineId, 
                    machineName: latestShift.machineName,
                    machineType: latestShift.machineType,
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
            }

            console.log(`[${latestShift.machineName}] Sending notification: ${latestShift.shiftId} -> ${latestShift.status}`);
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