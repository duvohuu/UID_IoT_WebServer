import mongoose from 'mongoose';

const PowderMachineSchema = new mongoose.Schema({
    shiftId: {
        type: String,
        required: true,
        unique: true,
        match: /^M\d+_S\d+$/
    },
    machineType: {
        type: String,
        required: true,
        enum: ['Powder Filling Machine', 'Salt Filling Machine'],
    },
    machineId: {
        type: String, 
        required: true
    },
    machineName: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    operatorName: {
        type: String,
        default: ''
    },
    machineNumber: {
        type: Number,
        required: true
    },
    duration: {
        type: Number 
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'complete', 'incomplete'],
        default: 'active'
    },
    
    // ========================================
    // PROCESSED MONITORING DATA (40001-40008)
    // ========================================
    machineStatus: {
        type: Number,
        enum: [0, 1, 2, 3], // 0: Stopped, 1: Running, 2: Running but paused, 3: Semi-automatic
        default: 0
    },
    powderTankStatus: {
        powderTank_1 : {
            type: Number,
            enum: [0, 1], // 0: Not full, 1: Full
            default: 0
        },
        powderTank_2 : {
            type: Number,
            enum: [0, 1], // 0: Not full, 1: Full
            default: 0
        },
        powderTank_3 : {
            type: Number,
            enum: [0, 1], // 0: Not full, 1: Full
            default: 0
        },
        powderTank_4 : {
            type: Number,
            enum: [0, 1], // 0: Not full, 1: Full
            default: 0
        }
    },
    powderType: {
        type: Number,
        enum: [0, 1, 2], // 0: Both onion powder and garlic powder, 1: Garlic powder, 2: Onion powder
        default: 0
    },
    lineStatus: {
        lineA: {
            type: Number,
            enum: [0, 1], // 0: Stopped, 1: Running
            default: 0
        },
        lineB: {
            type: Number,
            enum: [0, 1], // 0: Stopped, 1: Running
            default: 0
        }
    },

    targetWeight: {
        type: Number, // grams (40002)
        default: 0
    },
    totalWeightFilled: {
        onionPowderWeight: {
            type: Number, // kg - combined from 40003+40004
            default: 0
        },
        garlicPowderWeight: {
            type: Number, // kg - combined from 40005+40006
            default: 0
        }
    },
    totalBottlesFilled: {
        onionPowderBottles: {
            type: Number, // 40007
            default: 0
        },
        garlicPowderBottles: {
            type: Number, // 40008
            default: 0
        }
    },
    shiftNumber: { // 40009
        type: Number,
        required: true
    },
    errorCode: {
        type: Number, // 40011
        default: 0
    },

    // ========================================
    // PROCESSED ADMIN DATA 
    // ========================================
    
    // Loadcell configurations (processed from pairs)
    loadcellConfigs: [{
        loadcellId: { type: Number, min: 1, max: 4 },
        gain: { type: Number, default: 0 },  // Combined from Low+High registers
        offset: { type: Number, default: 0 } // Combined from Low+High registers
    }],
    
    // Motor control parameters
    motorControl: {
        onionPowder: {
            highFrequency: { type: Number, default: 0 }, // 40030
            lowFrequency: { type: Number, default: 0 }   // 40031
        },
        garlicPowder: {
            highFrequency: { type: Number, default: 0 }, // 40032
            lowFrequency: { type: Number, default: 0 }   // 40033  
        },
        accelerationTime: { type: Number, default: 0 },      // 40034
        onionPowderThreshold: { type: Number, default: 0 },  // 40035
        garlicPowderThreshold: { type: Number, default: 0 }  // 40036
    },
        
    // Time tracking (processed from multiple registers)
    timeTracking: {
        shiftStartTime: { type: Date },
        shiftEndTime: { type: Date },
        shiftPausedTime: { type: Number, default: 0 } 
    },
    
    // Raw data backup (for debugging)
    rawRegisters: {
        monitoring: { type: Map, of: Number },
        admin: { type: Map, of: Number }
    },
    
    // ========================================
    // CALCULATED METRICS
    // ========================================
    efficiency: {
        type: Number, // kg/hour
        default: 0
    },
    fillRate: {
        type: Number, // bottles/hour
        default: 0
    },

    pauseTracking: {
        totalPausedMinutes: { type: Number, default: 0 },
        pausedHistory: [{
            startTime: { type: Date, default: null },
            endTime: { type: Date, default: null },
            durationMinutes: { type: Number, default: 0 }
        }]
    },

    // ========================================
    // BACKUP FIELDS
    // ========================================
    isFromBackup: {
        type: Boolean,
        default: false
    },
    backupIndex: {
        type: Number,
        default: null
    }
});

// ========================================
// INDEXES - Performance optimization
// ========================================
PowderMachineSchema.index({ shiftId: 1 }, { unique: true });
PowderMachineSchema.index({ machineId: 1, startTime: -1 });
PowderMachineSchema.index({ status: 1 });
PowderMachineSchema.index({ userId: 1 });
PowderMachineSchema.index({ efficiency: -1 });
PowderMachineSchema.index({ machineNumber: 1, shiftNumber: -1 });
PowderMachineSchema.index({ startTime: -1 });
PowderMachineSchema.index({ duration: -1 });
PowderMachineSchema.index({ totalWeightFilled: -1 });
PowderMachineSchema.index({ completionPercentage: -1 });

const PowderMachine = mongoose.model('PowderMachine', PowderMachineSchema);
export default PowderMachine;