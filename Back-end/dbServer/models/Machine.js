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
    
    // Thông tin vận hành
    uptime: { type: Number, default: 0 },
    connectedAt: { type: Date },
    disconnectedAt: { type: Date },

    // Error tracking
    lastError: { type: String },

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
    
    this.updatedAt = new Date();
    next();
});

// Index cho hiệu suất truy vấn
machineSchema.index({ userId: 1 }); 
machineSchema.index({ ip: 1, userId: 1 }); 
machineSchema.index({ status: 1 });
machineSchema.index({ isConnected: 1 });

const Machine = mongoose.model('Machine', machineSchema);
export default Machine;