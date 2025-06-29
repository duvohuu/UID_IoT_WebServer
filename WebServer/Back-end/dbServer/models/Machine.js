import mongoose from 'mongoose';

const machineSchema = new mongoose.Schema({
    // Thông tin ca làm việc
    machineId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    type: { 
        type: String, 
        required: true 
    },
    location: { 
        type: String, 
        required: true 
    },
    userId: {
        type: String, 
        ref: 'User', 
        required: true 
    },
    
    // Thông tin kết nối
    ip: { 
        type: String, 
        required: true },
    port: { 
        type: Number, 
        default: 502 }, 
    slaveId: { 
        type: Number, 
        default: 1 
    },
    
    // Trạng thái kết nối
    status: { 
        type: String, 
        enum: ['online', 'offline', 'error', 'maintenance'], 
        default: 'offline' 
    },
    isConnected: { 
        type: Boolean, 
        default: false 
    },
    lastHeartbeat: { 
        type: Date 
    },
    lastUpdate: { 
        type: Date 
    },
    connectionAttempts: { 
        type: Number, 
        default: 0 
    },
    maxConnectionAttempts: { 
        type: Number, 
        default: 3 
    },
    
    // Thông tin vận hành
    uptime: { type: Number, default: 0 },
    connectedAt: { type: Date },
    disconnectedAt: { type: Date },

    // Error tracking
    lastError: { type: String },
    errorHistory: [{
        message: { type: String },
        timestamp: { type: Date, default: Date.now },
        resolved: { type: Boolean, default: false }
    }],
    
    // Maintenance
    maintenanceSchedule: {
        nextMaintenanceDate: { type: Date },
        lastMaintenanceDate: { type: Date },
        maintenanceIntervalDays: { type: Number, default: 30 }
    },
    
    // Performance metrics
    performance: {
        avgCycleTime: { type: Number, default: null },
        efficiency: { type: Number, default: null },
        throughput: { type: Number, default: null },
        errorRate: { type: Number, default: null },
        availability: { type: Number, default: null }
    },
    
    // Power monitoring
    powerConsumption: {
        voltage: { type: Number, default: null },
        current: { type: Number, default: null }
    },
    
    // Thống kê
    totalOperationTime: { type: Number, default: 0 },
    totalDowntime: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    lastErrorMessage: { type: String },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Middleware để cập nhật updatedAt
machineSchema.pre('save', async function(next) {
    if (!this.machineId) {
        try {
            const machineCount = await mongoose.model('Machine').countDocuments();
            const machineNumber = machineCount + 1;
            this.machineId = `MACHINE_${String(machineNumber).padStart(3, '0')}`;
        } catch (error) {
            return next(error);
        }
    }
    
    // ✅ Cập nhật updatedAt
    this.updatedAt = new Date();
    next();
});

// Index cho hiệu suất truy vấn
machineSchema.index({ userId: 1 }); 
machineSchema.index({ ip: 1, userId: 1 }); 
machineSchema.index({ status: 1 });
machineSchema.index({ isConnected: 1 });

// Methods
machineSchema.methods.updateConnectionStatus = function(isConnected) {
    const now = new Date();
    
    if (isConnected && !this.isConnected) {
        // Máy vừa kết nối
        this.isConnected = true;
        this.status = 'online';
        this.connectedAt = now;
        this.lastHeartbeat = now;
        this.connectionAttempts = 0;
    } else if (!isConnected && this.isConnected) {
        // Máy vừa mất kết nối
        this.isConnected = false;
        this.status = 'offline';
        this.disconnectedAt = now;
        
        // Tính uptime
        if (this.connectedAt) {
            this.uptime += (now - this.connectedAt);
            this.totalOperationTime += (now - this.connectedAt);
        }
    }
    
    this.lastUpdate = now;
    return this.save();
};

machineSchema.methods.updateParameters = function(newParameters) {
    this.parameters = { ...this.parameters, ...newParameters };
    
    // Calculate total weight from high/low registers
    if (newParameters.adminData?.totalWeightLow !== undefined && 
        newParameters.adminData?.totalWeightHigh !== undefined) {
        this.parameters.calculatedTotalWeight = 
            (newParameters.adminData.totalWeightHigh << 16) + newParameters.adminData.totalWeightLow;
    }
    
    this.lastUpdate = new Date();
    return this.save();
};

const Machine = mongoose.model('Machine', machineSchema);
export default Machine;