export class RegisterUtils {
    static combine16BitTo32Bit(lowRegister, highRegister) {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setUint16(0, lowRegister, true);
        view.setUint16(2, highRegister, true);
        return view.getInt32(0, true);
    }

    static combine16BitToFloat32(lowRegister, highRegister) {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setUint16(0, lowRegister, true);
        view.setUint16(2, highRegister, true);
        return view.getFloat32(0, true);
    }

    //Extract shift ID information from admin registers
    static getShiftIdFromParameters(machine, currentParameters) {
        try {
            if (!currentParameters?.monitoringData) {
                console.error(`[${machine.name}] Invalid currentParameters structure`);
                return { 
                    shiftId: null, 
                    shiftNumber: 0, 
                    machineNumber: 1, 
                    shiftIdLow: 0, 
                    shiftIdHigh: 0 
                };
            }
            
            const shiftIdLow = currentParameters.monitoringData['40009'] || 0;
            const shiftIdHigh = currentParameters.monitoringData['40010'] || 0;
            const shiftNumber = this.combine16BitTo32Bit(shiftIdLow, shiftIdHigh);
            
            let machineNumber = 1;
            if (machine.machineId) {
                const machineMatch = machine.machineId.match(/(\d+)/);
                if (machineMatch) {
                    machineNumber = parseInt(machineMatch[1]);
                }
            }
            
            return {
                shiftId: `M${machineNumber}_S${shiftNumber}`,
                shiftNumber,
                machineNumber,
                shiftIdLow,
                shiftIdHigh
            };
        } catch (error) {
            console.error(`[${machine.name}] Error getting shift ID:`, error.message);
            return { 
                shiftId: null, 
                shiftNumber: 0, 
                machineNumber: 1, 
                shiftIdLow: 0, 
                shiftIdHigh: 0 
            };
        }
    }

    static extractTimeFromRegisters(adminData, type) {
        try {
            let second, minute, hour, day, month, year;
            
            if (type === 'start') {
                second = adminData['40037'];
                minute = adminData['40038'];
                hour = adminData['40039'];
                day = adminData['40040'];
                month = adminData['40041'];
                year = adminData['40042'];
            } else if (type === 'end') {
                second = adminData['40043'];
                minute = adminData['40044'];
                hour = adminData['40045'];
                day = adminData['40046'];
                month = adminData['40047'];
                year = adminData['40048'];
            } else {
                return null;
            }
            
            // Validate values
            if (year < 2020 || month < 1 || month > 12 || day < 1 || day > 31 || 
                hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
                return null;
            }
            
            return new Date(year, month, day, hour, minute, second);
        } catch (error) {
            console.error(`Error extracting ${type} time:`, error.message);
            return null;
        }
    }

    static extractOperatorName(adminData) {
        try {
            let operatorName = '';
            
            // Extract from registers 40051-40070 (20 registers max)
            for (let reg = 40051; reg <= 40070; reg++) {
                const regValue = adminData[reg.toString()] || 0;
                
                // Extract lower 8 bits and upper 8 bits
                const lowerChar = String.fromCharCode(regValue & 0xFF);
                const upperChar = String.fromCharCode((regValue >> 8) & 0xFF);
                
                // Add characters if they're valid ASCII
                if (lowerChar.charCodeAt(0) > 0) operatorName += lowerChar;
                if (upperChar.charCodeAt(0) > 0) operatorName += upperChar;
                
                // Stop if we hit null terminator
                if (lowerChar === '\0' || upperChar === '\0') break;
            }
            
            return operatorName.trim();
        } catch (error) {
            console.error('Error extracting operator name:', error.message);
            return '';
        }
    }
}