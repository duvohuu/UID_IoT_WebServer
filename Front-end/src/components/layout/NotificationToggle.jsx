import React, { useState, useEffect } from 'react';
import { FormControlLabel, Switch } from '@mui/material';

const NotificationToggle = () => {
    // Lấy trạng thái từ localStorage
    const [notificationEnabled, setNotificationEnabled] = useState(() => {
        const saved = localStorage.getItem('notificationEnabled');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // Lưu vào localStorage khi thay đổi
    useEffect(() => {
        localStorage.setItem('notificationEnabled', JSON.stringify(notificationEnabled));
        
        // Dispatch custom event để NotificationBell biết
        window.dispatchEvent(new CustomEvent('notificationSettingChanged', { 
            detail: notificationEnabled 
        }));
    }, [notificationEnabled]);

    const handleToggle = () => {
        setNotificationEnabled(prev => !prev);
    };

    return (
        <FormControlLabel
            control={
                <Switch 
                    checked={notificationEnabled}
                    onChange={handleToggle}
                />
            }
            label="Nhận thông báo"
        />
    );
};

export default NotificationToggle;