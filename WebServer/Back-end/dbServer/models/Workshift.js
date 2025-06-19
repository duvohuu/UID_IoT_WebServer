import mongoose from 'mongoose';

const workShiftSchema = new mongoose.Schema({
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
    machineNumber: {
        type: Number,
        required: true
    },
    shiftNumber: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['running', 'completed', 'incompleted'],
        default: 'running'
    },
    startTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number 
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'incomplete'],
        default: 'active'
    },
    totalWeightFilled: {
        type: Number,
        default: 0 
    },
    efficiency: {
        type: Number,
        default: 0 
    },
    finalData: {
        type: mongoose.Schema.Types.Mixed
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

workShiftSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // Calculate duration (minutes)
    if (this.startTime) {
        const currentTime = this.endTime || new Date();
        this.duration = Math.round((currentTime - new Date(this.startTime)) / (1000 * 60));
    }
    
    // Calculate efficiency (kg/hour)
    if (this.totalWeightFilled && this.duration && this.duration > 0) {
        const weightInKg = this.totalWeightFilled / 1000; // Convert gram to kg
        const durationInHours = this.duration / 60; // Convert minutes to hours
        this.efficiency = Number((weightInKg / durationInHours).toFixed(2));
    } else {
        this.efficiency = 0;
    }
    
    next();
});

workShiftSchema.methods.recalculateEfficiency = function() {
    if (this.totalWeightFilled && this.duration && this.duration > 0) {
        const weightInKg = this.totalWeightFilled / 1000;
        const durationInHours = this.duration / 60;
        this.efficiency = Number((weightInKg / durationInHours).toFixed(2));
        return this.efficiency;
    }
    this.efficiency = 0;
    return 0;
};

workShiftSchema.pre('save', function(next) {
    console.log(`🔧 PRE-SAVE calculating efficiency for ${this.shiftId}:`);
    
    this.updatedAt = new Date();
    
    if (this.startTime && (!this.duration || this.duration === 0)) {
        const currentTime = this.endTime || new Date();
        this.duration = Math.round((currentTime - new Date(this.startTime)) / (1000 * 60));    
    }
    
    if (this.totalWeightFilled && this.duration && this.duration > 0) {
        const weightInKg = this.totalWeightFilled;
        const durationInHours = this.duration / 60;
        this.efficiency = Number((weightInKg / durationInHours).toFixed(2));
    } else {
        this.efficiency = 0;
    }
    
    next();
});


// Index cơ bản
workShiftSchema.index({ shiftId: 1 }, { unique: true });
workShiftSchema.index({ machineId: 1, startTime: -1 });
workShiftSchema.index({ status: 1 });

const WorkShift = mongoose.model('WorkShift', workShiftSchema);
export default WorkShift;