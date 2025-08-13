import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    machineId: {
        type: String,
        required: true
    },
    machineName: {
        type: String,
        required: true
    },
    machineType: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['machine_error', 'incomplete_shift'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    errorCode: {
        type: Number,
        required: false
    },
    shiftId: {
        type: String,
        required: false
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    isProcessed: {
        type: Boolean,
        default: false
    },
    processedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index cho hiệu suất
notificationSchema.index({ machineId: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ isProcessed: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });


const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;