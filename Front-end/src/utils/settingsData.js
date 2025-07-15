import React from 'react';
import { FormControlLabel, Switch } from '@mui/material';
import {
    Palette as PaletteIcon,
    PersonOutline as PersonIcon,
    NotificationsOutlined as NotificationIcon, 
    SecurityOutlined as SecurityIcon,
    LanguageOutlined as LanguageIcon
} from '@mui/icons-material';
import ThemeToggle from '../components/layout/ThemeToggle';

export const getSettingsData = (mode, handleToggle) => [
    {
        icon: React.createElement(PaletteIcon),
        title: 'Giao diện',
        description: 'Tùy chỉnh chế độ sáng/tối cho hệ thống',
        component: React.createElement(ThemeToggle, { mode, onToggle: handleToggle })
    },
    {
        icon: React.createElement(NotificationIcon),
        title: 'Thông báo',
        description: 'Cài đặt thông báo và cảnh báo hệ thống',
        component: React.createElement(FormControlLabel, {
            control: React.createElement(Switch, { defaultChecked: true }),
            label: 'Nhận thông báo'
        })
    },
  
    {
        icon: React.createElement(LanguageIcon),
        title: 'Ngôn ngữ',
        description: 'Chọn ngôn ngữ hiển thị hệ thống',
        component: React.createElement(FormControlLabel, {
            control: React.createElement(Switch, { defaultChecked: true }),
            label: 'Tiếng Việt'
        })
    }
];