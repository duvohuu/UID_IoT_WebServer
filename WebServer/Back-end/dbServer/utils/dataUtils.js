import { RegisterUtils } from './registerUtils.js';

export class DataUtils {
    // Transform raw register data into WorkShift model format
    static transformWorkShiftData(shift, monitoringData, adminData) {
        // Update monitoring data (40001-40008)
        shift.machineStatus = monitoringData['40001'] || 0;
        shift.saltTankStatus = monitoringData['40002'] || 0;
        shift.saltType = monitoringData['40003'] || 0;
        shift.targetWeight = monitoringData['40004'] || 0;
        shift.totalBottlesFilled = monitoringData['40007'] || 0;
        shift.activeLinesCount = monitoringData['40008'] || 0;
        
        // Calculate total weight from registers 40005+40006
        const weightLow = monitoringData['40005'] || 0;
        const weightHigh = monitoringData['40006'] || 0;
        shift.totalWeightFilled = RegisterUtils.combine16BitToFloat32(weightLow, weightHigh) || 0;

        // Extract shift ID from registers 40009+40010
        const idLow = monitoringData['40009'] || 0;
        const idHigh = monitoringData['40010'] || 0;
        shift.shiftIdRaw = RegisterUtils.combine16BitTo32Bit(idLow, idHigh);
        
        shift.errorCode = monitoringData['40011'] || 0;

        // Transform complex structures
        shift.loadcellConfigs = this.transformLoadcellConfigs(adminData);
        shift.motorControl = this.transformMotorControl(adminData);
        
        // Extract time tracking
        shift.timeTracking = {
            shiftStartTime: RegisterUtils.extractTimeFromRegisters(adminData, 'start'),
            shiftEndTime: RegisterUtils.extractTimeFromRegisters(adminData, 'end'),
            shiftPausedTime: 0,
        };
        
        // Extract operator name
        shift.operatorName = RegisterUtils.extractOperatorName(adminData);
        
        // Backup raw data for debugging
        shift.rawRegisters = {
            monitoring: new Map(Object.entries(monitoringData)),
            admin: new Map(Object.entries(adminData))
        };

        return shift;
    }

    // Transform loadcell register data into structured config
    static transformLoadcellConfigs(adminData) {
        const configs = [];
        for (let i = 1; i <= 4; i++) {
            const baseAddr = 40012 + (i - 1) * 4; // 40012, 40016, 40020, 40024
            const gainLow = adminData[baseAddr.toString()] || 0;
            const gainHigh = adminData[(baseAddr + 1).toString()] || 0;
            const offsetLow = adminData[(baseAddr + 2).toString()] || 0;
            const offsetHigh = adminData[(baseAddr + 3).toString()] || 0;
            
            configs.push({
                loadcellId: i,
                gain: RegisterUtils.combine16BitToFloat32(gainLow, gainHigh),
                offset: RegisterUtils.combine16BitToFloat32(offsetLow, offsetHigh)
            });
        }
        return configs;
    }

    // Transform motor control register data
    static transformMotorControl(adminData) {
        return {
            granularSalt: {
                highFrequency: adminData['40030'] || 0,
                lowFrequency: adminData['40031'] || 0
            },
            fineSalt: {
                highFrequency: adminData['40032'] || 0,
                lowFrequency: adminData['40033'] || 0
            },
            accelerationTime: adminData['40034'] || 0,
            granularSaltThreshold: adminData['40035'] || 0,
            fineSaltThreshold: adminData['40036'] || 0
        };
    }

    // Transform machine data for API response
    static transformMachineResponse(machine) {
        return {
            id: machine._id,
            machineId: machine.machineId,
            name: machine.name,
            type: machine.type,
            location: machine.location,
            ip: machine.ip,
            port: machine.port,
            status: machine.status,
            isConnected: machine.isConnected,
            lastUpdate: machine.lastUpdate,
            uptime: machine.uptime,
            parameters: machine.parameters
        };
    }
}