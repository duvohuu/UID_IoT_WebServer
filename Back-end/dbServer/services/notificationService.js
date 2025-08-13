import axios from "axios";

class NotificationService {
    constructor() {
        this.mainServerUrl = process.env.MAIN_SERVER_URL || "http://localhost:5000";
        this.lastErrorCodes = new Map();
    }

    // Gửi notification đến MainServer
    async sendNotificationToMainServer(notification) {
        try {
            await axios.post(`${this.mainServerUrl}/api/internal/notifications`, {
                machineId: notification.machineId,
                machineName: notification.machineName,
                machineType: notification.machineType,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                errorCode: notification.errorCode,
                shiftId: notification.shiftId,
                severity: notification.severity,
                createdAt: notification.createdAt
            }, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log(`Notification sent to MainServer: ${notification._id}`);
        } catch (error) {
            console.error(`Failed to send notification to MainServer:`, error.message);
        }
    }

    async createMachineErrorNotificationViaAPI(machineData, errorCode) {
        try {
            // Gọi đến chính DBServer qua internal API
            const response = await axios.post(`http://localhost:5001/db/internal/notifications/machine-error`, {
                machineData: {
                    machineId: machineData.machineId,
                    machineName: machineData.machineName,
                    machineType: machineData.machineType,
                    name: machineData.machineName
                },
                errorCode: errorCode
            }, {
                timeout: 5000,
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data.success) {
                console.log(`✅ Created machine error notification via API: ${machineData.machineId}`);
                // Gửi lên MainServer
                await this.sendNotificationToMainServer(response.data.data);
            }
        } catch (error) {
            console.error('❌ Failed to create machine error notification via API:', error.message);
        }
    }

    async createIncompleteShiftNotificationViaAPI(shiftData) {
        try {
            const response = await axios.post(`http://localhost:5001/db/internal/notifications/incomplete-shift`, {
                shiftData: {
                    machineId: shiftData.machineId,
                    machineName: shiftData.machineName,
                    machineType: shiftData.machineType,
                    shiftId: shiftData.shiftId,
                    status: shiftData.status
                }
            }, {
                timeout: 5000,
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data.success) {
                console.log(`✅ Created incomplete shift notification via API: ${shiftData.shiftId}`);
                await this.sendNotificationToMainServer(response.data.data);
            }
        } catch (error) {
            console.error('❌ Failed to create incomplete shift notification via API:', error.message);
        }
    }
}

export const notificationService = new NotificationService();