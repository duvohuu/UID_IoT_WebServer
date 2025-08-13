const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

class NotificationAPI {
    async getNotifications() {
        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('authToken='))
                ?.split('=')[1];

            const response = await fetch(`${API_URL}/api/notifications`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('📨 API Response:', result);
            
            // Trả về data theo format mà component expect
            return result.data || { notifications: [], unreadCount: 0 };
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    }

    async markAsRead(notificationId) {
        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('authToken='))
                ?.split('=')[1];

            const response = await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    async markAllAsRead() {
        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('authToken='))
                ?.split('=')[1];

            const response = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    async deleteNotification(notificationId) {
        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('authToken='))
                ?.split('=')[1];

            const response = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }
}

export const notificationAPI = new NotificationAPI();