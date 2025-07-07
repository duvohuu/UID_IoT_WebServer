import mongoose from 'mongoose';

const SaltMachineSchema = new mongoose.Schema({
    shiftId: {
        type: String,
        required: true,
        unique: true,
        match: /^M\d+_S\d+$/
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
        enum: [0, 1, 2], // 0: Stopped, 1: Running, 2: Running but paused
        default: 0
    },
    saltTankStatus: {
        type: Number,
        enum: [0, 1], // 0: Not full, 1: Full
        default: 0
    },
    saltType: {
        type: Number,
        enum: [0, 1], // 0: Granular salt, 1: Fine salt
        default: 0
    },
    targetWeight: {
        type: Number, // grams (40004)
        default: 0
    },
    totalWeightFilled: {
        type: Number, // kg - combined from 40005+40006
        default: 0
    },
    totalBottlesFilled: {
        type: Number, // 40007
        default: 0
    },
    activeLinesCount: {
        type: Number,
        enum: [0, 1, 2, 3], // 0: Both stopped, 1: Line A, 2: Line B, 3: Both active
        default: 0
    },
    shiftNumber: {
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
        gain: { type: Number, default: 0 }, // Combined from Low+High registers
        offset: { type: Number, default: 0 } // Combined from Low+High registers
    }],
    
    // Motor control parameters
    motorControl: {
        granularSalt: {
            highFrequency: { type: Number, default: 0 }, // 40030
            lowFrequency: { type: Number, default: 0 }   // 40031
        },
        fineSalt: {
            highFrequency: { type: Number, default: 0 }, // 40032
            lowFrequency: { type: Number, default: 0 }   // 40033  
        },
        accelerationTime: { type: Number, default: 0 },      // 40034
        granularSaltThreshold: { type: Number, default: 0 }, // 40035
        fineSaltThreshold: { type: Number, default: 0 }      // 40036
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
SaltMachineSchema.index({ shiftId: 1 }, { unique: true });
SaltMachineSchema.index({ machineId: 1, startTime: -1 });
SaltMachineSchema.index({ status: 1 });
SaltMachineSchema.index({ userId: 1 });
SaltMachineSchema.index({ efficiency: -1 });
SaltMachineSchema.index({ machineNumber: 1, shiftNumber: -1 });
SaltMachineSchema.index({ startTime: -1 });
SaltMachineSchema.index({ duration: -1 });
SaltMachineSchema.index({ totalWeightFilled: -1 });
SaltMachineSchema.index({ completionPercentage: -1 });

const SaltMachine = mongoose.model('SaltMachine', SaltMachineSchema);
export default SaltMachine;