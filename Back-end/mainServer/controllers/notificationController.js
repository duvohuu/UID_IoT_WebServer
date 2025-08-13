import { 
    getAllNotifications, 
    findNotificationById, 
    removeNotificationById, 
    updateNotification 
} from './internalController.js';

// Lấy notifications cho frontend
export const getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, isRead } = req.query;
        
        let filteredNotifications = [...getAllNotifications()];

        // Filter theo type
        if (type) {
            filteredNotifications = filteredNotifications.filter(n => n.type === type);
        }

        // Filter theo isRead
        if (isRead !== undefined) {
            const isReadBool = isRead === 'true';
            filteredNotifications = filteredNotifications.filter(n => n.isRead === isReadBool);
        }

        // Pagination
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

        const total = filteredNotifications.length;
        const unreadCount = getAllNotifications().filter(n => !n.isRead).length;

        res.json({
            success: true,
            data: {
                notifications: paginatedNotifications,
                total,
                unreadCount,
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

// Đánh dấu notification đã đọc
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        
        const notification = updateNotification(id, {
            isRead: true,
            readAt: new Date().toISOString()
        });
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }

        res.json({
            success: true,
            message: 'Đã đánh dấu thông báo là đã đọc',
            data: notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đánh dấu đã đọc'
        });
    }
};

// Đánh dấu tất cả notifications đã đọc
export const markAllAsRead = async (req, res) => {
    try {
        const notifications = getAllNotifications();
        let modifiedCount = 0;
        
        notifications.forEach(notification => {
            if (!notification.isRead) {
                updateNotification(notification._id, {
                    isRead: true,
                    readAt: new Date().toISOString()
                });
                modifiedCount++;
            }
        });

        res.json({
            success: true,
            message: 'Đã đánh dấu tất cả thông báo là đã đọc',
            modifiedCount
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đánh dấu tất cả đã đọc'
        });
    }
};

// Xóa notification
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        
        const success = removeNotificationById(id);
        
        if (!success) {
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