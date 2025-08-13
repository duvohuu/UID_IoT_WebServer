import Notification from '../models/Notification.js';

// Lấy danh sách notifications
export const getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, isProcessed } = req.query;
        
        const filter = {};
        if (type) filter.type = type;
        if (isProcessed !== undefined) filter.isProcessed = isProcessed === 'true';

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Notification.countDocuments(filter);

        res.json({
            success: true,
            data: {
                notifications,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách thông báo'
        });
    }
};

// Xóa notification
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        
        const notification = await Notification.findByIdAndDelete(id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }

        res.json({
            success: true,
            message: 'Đã xóa thông báo'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa thông báo'
        });
    }
};

export const createMachineErrorNotification = async (req, res) => {
    try {
        const { machineData, errorCode } = req.body;
        
        if (!errorCode || errorCode === 0) {
            return res.status(400).json({
                success: false,
                message: 'Mã lỗi không hợp lệ'
            });
        }

        const errorMessages = {
            1: 'Cảm biến nhận sai chai',
            3: 'Xy lạnh hoạt động lỗi',
            5: 'Sai loại chai',
            7: 'Chiết rót không đúng',
            9: 'Bộ phận khác bị lỗi'
        };

        const getSeverity = (code) => {
            const criticalErrors = [3, 7];
            const highErrors = [1, 5];
            
            if (criticalErrors.includes(code)) return 'critical';
            if (highErrors.includes(code)) return 'high';
            return 'medium';
        };

        const notification = new Notification({
            machineId: machineData.machineId,
            machineName: machineData.name || machineData.machineName,
            machineType: machineData.type || machineData.machineType,
            type: 'machine_error',
            title: `Máy ${machineData.name || machineData.machineName} báo lỗi`,
            message: errorMessages[errorCode] || `Lỗi không xác định (Mã: ${errorCode})`,
            errorCode: errorCode,
            severity: getSeverity(errorCode)
        });

        const savedNotification = await notification.save();
        console.log(`✅ Created machine error notification: ${machineData.machineId} - Error ${errorCode}`);
        
        res.json({
            success: true,
            data: savedNotification,
            message: 'Tạo thông báo lỗi máy thành công'
        });
    } catch (error) {
        console.error('Error creating machine error notification:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo thông báo lỗi máy'
        });
    }
};

export const createIncompleteShiftNotification = async (req, res) => {
    try {
        const { shiftData } = req.body;
        
        if (!shiftData || shiftData.status !== 'incomplete') {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu ca không hợp lệ hoặc ca đã hoàn thành'
            });
        }

        const notification = new Notification({
            machineId: shiftData.machineId,
            machineName: shiftData.machineName,
            machineType: shiftData.machineType,
            type: 'incomplete_shift',
            title: `Ca làm việc chưa hoàn chỉnh`,
            message: `Ca ${shiftData.shiftId} trên máy ${shiftData.machineName} chưa được hoàn thành`,
            shiftId: shiftData.shiftId,
            severity: 'medium'
        });

        const savedNotification = await notification.save();
        console.log(`✅ Created incomplete shift notification: ${shiftData.shiftId}`);
        
        res.json({
            success: true,
            data: savedNotification,
            message: 'Tạo thông báo ca chưa hoàn chỉnh thành công'
        });
    } catch (error) {
        console.error('Error creating incomplete shift notification:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo thông báo ca chưa hoàn chỉnh'
        });
    }
};