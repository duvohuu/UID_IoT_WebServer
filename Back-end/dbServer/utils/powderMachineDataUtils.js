import { RegisterUtils } from './registerUtils.js';

export class PowderMachineDataUtils {
    static transformWorkShiftData(shift, monitoringData, adminData) {
        const statusReg = monitoringData['40001'] || 0;
        shift.machineStatus = statusReg & 0xF; 

        // Bit 4-7: trạng thái bồn (4 bồn)
        shift.powderTankStatus = {
            powderTank_1: (statusReg >> 4) & 0x1,
            powderTank_2: (statusReg >> 5) & 0x1,
            powderTank_3: (statusReg >> 6) & 0x1,
            powderTank_4: (statusReg >> 7) & 0x1
        };

        // Bit 8-11: loại bột
        shift.powderType = (statusReg >> 8) & 0xF;

        // Bit 12: trạng thái line A, Bit 13: trạng thái line B
        shift.lineStatus = {
            lineA: (statusReg >> 12) & 0x1,
            lineB: (statusReg >> 13) & 0x1
        };

        // 40002: Khối lượng cần chiết rót (gram)
        shift.targetWeight = monitoringData['40002'] || 0;

        // 40003-40004: Tổng khối lượng bột hành đã chiết (kg) (float32)
        shift.totalWeightFilled = {
            onionPowderWeight: RegisterUtils.combine16BitToFloat32(
                monitoringData['40003'] || 0,
                monitoringData['40004'] || 0
            ),
            garlicPowderWeight: RegisterUtils.combine16BitToFloat32(
                monitoringData['40005'] || 0,
                monitoringData['40006'] || 0
            )
        };

        // 40007: Tổng số chai bột hành đã chiết
        // 40008: Tổng số chai bột tỏi đã chiết
        shift.totalBottlesFilled = {
            onionPowderBottles: monitoringData['40007'] || 0,
            garlicPowderBottles: monitoringData['40008'] || 0
        };

        // 40009-40010: shiftId
        const idLow = monitoringData['40009'] || 0;
        const idHigh = monitoringData['40010'] || 0;
        shift.shiftIdRaw = RegisterUtils.combine16BitTo32Bit(idLow, idHigh);

        // 40011: Mã lỗi khi tạm dừng
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
            onionPowder: {
                highFrequency: adminData['40030'] || 0,
                lowFrequency: adminData['40031'] || 0
            },
            garlicPowder: {
                highFrequency: adminData['40032'] || 0,
                lowFrequency: adminData['40033'] || 0
            },
            accelerationTime: adminData['40034'] || 0,
            onionPowderThreshold: adminData['40035'] || 0,
            garlicPowderThreshold: adminData['40036'] || 0
        };
    }
}