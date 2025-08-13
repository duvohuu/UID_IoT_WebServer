// Lưu trữ notifications tạm thời trong memory (di chuyển từ notificationController)
let notifications = [];
let notificationId = 1;

export const handleMachineUpdate = (req, res) => {
    const machineUpdate = req.body;
    const io = req.app.get('io');
    
    io.emit("machineStatusUpdate", machineUpdate);
    res.json({ success: true, message: "Machine update broadcasted" });
};

export const handleShiftChanged = async (req, res) => {
    try {
        const {machineId} = req.body;
        
        // console.log(`📡 Received shift status change: ${shiftId} (${machineName}) -> ${status}`);
        
        const io = req.app.get('io');
        
        io.emit("shiftStatusChanged", {machineId});
        
        res.json({ success: true, message: "Shift status change broadcasted" });
        
    } catch (error) {
        console.error("❌ Error handling shift status change:", error.message);
        res.status(500).json({ message: "Error handling shift status change" });
    }
};

// Nhận notification từ DBServer (di chuyển từ notificationController)
export const receiveNotificationFromDB = async (req, res) => {
    try {
        const {
            machineId,
            machineName,
            machineType,
            type,
            title,
            message,
            errorCode,
            shiftId,
            severity,
            createdAt
        } = req.body;

        const notification = {
            _id: notificationId++,
            machineId,
            machineName,
            machineType,
            type,
            title,
            message,
            errorCode,
            shiftId,
            severity,
            source: 'dbserver',
            isRead: false,
            readAt: null,
            createdAt: createdAt || new Date().toISOString()
        };

        // Thêm vào đầu mảng (mới nhất trước)
        notifications.unshift(notification);

        // Giữ tối đa 100 notifications trong memory
        if (notifications.length > 100) {
            notifications = notifications.slice(0, 100);
        }

        console.log(`Received notification from DBServer: ${type} - ${machineId}`);

        // Emit socket để update realtime cho frontend
        const io = req.app.get('io');
        io.emit('newNotification', notification);

        res.json({
            success: true,
            message: 'Notification received successfully',
            data: notification
        });
    } catch (error) {
        console.error('Error receiving notification from DBServer:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi nhận thông báo từ DBServer'
        });
    }
};

// Helper function để lấy notifications (cho notificationController sử dụng)
export const getAllNotifications = () => {
    return notifications;
};

// Helper function để tìm notification theo ID
export const findNotificationById = (id) => {
    return notifications.find(n => n._id == id);
};

// Helper function để xóa notification theo ID
export const removeNotificationById = (id) => {
    const index = notifications.findIndex(n => n._id == id);
    if (index !== -1) {
        notifications.splice(index, 1);
        return true;
    }
    return false;
};

// Helper function để update notification
export const updateNotification = (id, updates) => {
    const notification = notifications.find(n => n._id == id);
    if (notification) {
        Object.assign(notification, updates);
        return notification;
    }
    return null;
};

// Helper function để clear old notifications
export const clearOldNotifications = () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const originalLength = notifications.length;
    
    notifications = notifications.filter(n => 
        new Date(n.createdAt) > oneDayAgo
    );
    
    const removedCount = originalLength - notifications.length;
    if (removedCount > 0) {
        console.log(`🗑️ [MainServer] Cleared ${removedCount} old notifications`);
    }
};