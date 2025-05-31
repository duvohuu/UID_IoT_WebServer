import mongoose from 'mongoose';

const machineSchema = new mongoose.Schema({
    // Thông tin cơ bản của máy
    machineId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    location: { type: String, required: true },
    
    // Thông tin kết nối
    ip: { type: String, required: true, unique: true },
    port: { type: Number, default: 502 }, // Modbus TCP default port
    slaveId: { type: Number, default: 1 },
    
    // Trạng thái kết nối
    status: { 
        type: String, 
        enum: ['online', 'offline', 'error', 'maintenance'], 
        default: 'offline' 
    },
    isConnected: { type: Boolean, default: false },
    lastHeartbeat: { type: Date },
    lastUpdate: { type: Date },
    connectionAttempts: { type: Number, default: 0 },
    maxConnectionAttempts: { type: Number, default: 3 },
    
    // Thông tin vận hành
    uptime: { type: Number, default: 0 }, // milliseconds
    connectedAt: { type: Date },
    disconnectedAt: { type: Date },
    
    // Dữ liệu từ HMI/PLC
    parameters: {
        temperature: { type: Number, default: null },
        humidity: { type: Number, default: null },
        pressure: { type: Number, default: null },
        speed: { type: Number, default: null },
        voltage: { type: Number, default: null },
        current: { type: Number, default: null },
    },
    
    // Thông tin cấu hình Modbus
    modbusConfig: {
        temperatureAddress: { type: Number, default: 0 },
        humidityAddress: { type: Number, default: 1 },
        pressureAddress: { type: Number, default: 2 },
        speedAddress: { type: Number, default: 3 },
        voltageAddress: { type: Number, default: 4 },
        currentAddress: { type: Number, default: 5 },
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
machineSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Index cho hiệu suất truy vấn
machineSchema.index({ ip: 1 });
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
    this.lastUpdate = new Date();
    this.lastHeartbeat = new Date();
    return this.save();
};

const Machine = mongoose.model('Machine', machineSchema, 'Machines');
export default Machine;