import React, { useState, useEffect, useCallback } from "react";
import {
    IconButton,
    Badge,
    Menu,
    MenuItem,
    Typography,
    Box,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Button,
    Fade,
    Grow,
    useTheme
} from "@mui/material";
import {
    NotificationsNone,
    Error,
    Warning,
    CheckCircle,
    Info,
    Build,
    Schedule
} from "@mui/icons-material";
import { styled, alpha } from "@mui/material/styles";
import { notificationAPI } from "../../api/notificationAPI";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
// THÊM: Import global socket và custom hook
import { useSocket } from "../../context/SocketContext";
import { useNotificationUpdates } from "../../hooks/useSocketEvents";

// Styled Components
const StyledNotificationButton = styled(IconButton)(({ theme }) => ({
    padding: theme.spacing(1),
    borderRadius: 12,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    background: alpha(theme.palette.primary.main, 0.05),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    "&:hover": {
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        transform: "translateY(-1px) scale(1.05)",
        boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
}));

const StyledMenu = styled(Menu)(({ theme }) => ({
    "& .MuiPaper-root": {
        borderRadius: 16,
        minWidth: 400,
        maxWidth: 450,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`,
        backdropFilter: "blur(20px)",
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow: `0 20px 60px ${alpha(theme.palette.common.black, 0.15)}`,
        maxHeight: 500,
        overflowY: "auto",
    },
}));

const NotificationItem = styled(ListItem)(({ theme, severity }) => {
    const colors = {
        error: theme.palette.error.main,
        warning: theme.palette.warning.main,
        info: theme.palette.info.main,
        success: theme.palette.success.main,
    };

    return {
        padding: theme.spacing(1.5),
        margin: theme.spacing(0.5, 1),
        borderRadius: 12,
        border: `1px solid ${alpha(colors[severity] || colors.info, 0.2)}`,
        background: `linear-gradient(135deg, ${alpha(colors[severity] || colors.info, 0.05)} 0%, ${alpha(colors[severity] || colors.info, 0.02)} 100%)`,
        transition: "all 0.2s ease",
        "&:hover": {
            background: `linear-gradient(135deg, ${alpha(colors[severity] || colors.info, 0.1)} 0%, ${alpha(colors[severity] || colors.info, 0.05)} 100%)`,
            transform: "translateX(4px)",
        },
    };
});

const getNotificationIcon = (type, severity) => {
    const iconProps = { fontSize: "small" };
    
    if (type === "machine_error") return <Error {...iconProps} />;
    if (type === "incomplete_shift") return <Schedule {...iconProps} />;
    if (type === "maintenance") return <Build {...iconProps} />;
    
    switch (severity) {
        case "error": return <Error {...iconProps} />;
        case "warning": return <Warning {...iconProps} />;
        case "success": return <CheckCircle {...iconProps} />;
        default: return <Info {...iconProps} />;
    }
};

const getNotificationColor = (type, severity) => {
    if (type === "machine_error") return "error";
    if (type === "incomplete_shift") return "warning";
    if (type === "maintenance") return "info";
    return severity || "info";
};

const NotificationBell = ({ user }) => {
    const theme = useTheme();
    const { isConnected } = useSocket(); 
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const [notificationEnabled, setNotificationEnabled] = useState(() => {
        const saved = localStorage.getItem('notificationEnabled');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        const handleSettingChange = (event) => {
            setNotificationEnabled(event.detail);
            console.log('🔔 Notification setting changed:', event.detail);
        };
        
        window.addEventListener('notificationSettingChanged', handleSettingChange);
        return () => window.removeEventListener('notificationSettingChanged', handleSettingChange);
    }, []);

    // Fetch notifications function
    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        
        setLoading(true);
        try {
            console.log('📡 Fetching notifications...');
            const data = await notificationAPI.getNotifications();
            console.log('📨 Notifications data:', data);
            
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Handle new notifications from socket
    const handleNewNotification = useCallback((notification) => {
        console.log('🔔 Received new notification:', notification);
        
        // Chỉ xử lý notification khi enabled
        if (!notificationEnabled) {
            console.log('🔕 Notification disabled, skipping:', notification.title);
            return;
        }
        
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Browser notification
        if (Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/logo.png',
                tag: notification._id
            });
        }
    }, [notificationEnabled]);

    useNotificationUpdates(handleNewNotification);

    // Initial fetch when user logs in
    useEffect(() => {
        if (user) {
            fetchNotifications();
        } else {
            // Clear notifications when user logs out
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user, fetchNotifications]);

    // Request notification permission
    useEffect(() => {
        if (user && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, [user]);

    // XÓA: Polling logic (setInterval)
    // XÓA: const interval = setInterval(fetchNotifications, 30000);

    // Mark notifications as read
    const markAsRead = async (notificationId) => {
        try {
            await notificationAPI.markAsRead(notificationId);
            setNotifications(prev => 
                prev.map(notif => 
                    notif._id === notificationId 
                        ? { ...notif, isRead: true, readAt: new Date().toISOString() }
                        : notif
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(prev => 
                prev.map(notif => ({ 
                    ...notif, 
                    isRead: true, 
                    readAt: new Date().toISOString() 
                }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
        }
    };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
        // Fallback refresh when socket is disconnected
        if (!isConnected) {
            fetchNotifications();
        }
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            markAsRead(notification._id);
        }
    };

    if (!user) return null;

    return (
        <>
            <Fade in={true} timeout={1300}>
                <StyledNotificationButton
                    color="inherit"
                    onClick={handleClick}
                    disabled={loading}
                    sx={{
                        opacity: notificationEnabled ? 1 : 0.5,
                        transition: 'opacity 0.3s ease',
                        // Visual indicator for socket connection
                        ...(isConnected ? {} : {
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: theme.palette.warning.main,
                                animation: 'pulse 2s infinite'
                            }
                        })
                    }}
                >
                    <Badge 
                        badgeContent={notificationEnabled ? unreadCount : 0}  
                        color="error"
                        overlap="circular"
                        sx={{
                            "& .MuiBadge-badge": {
                                fontSize: "0.75rem",
                                minWidth: 18,
                                height: 18,
                                fontWeight: 600,
                                display: notificationEnabled ? 'flex' : 'none'
                            }
                        }}
                    >
                        <NotificationsNone />
                    </Badge>
                </StyledNotificationButton>
            </Fade>

            <StyledMenu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {/* Header */}
                <Box sx={{ p: 2, pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Thông báo
                            {/* Connection status */}
                            <Chip 
                                label={isConnected ? "Trực tuyến" : "Ngoại tuyến"} 
                                size="small" 
                                color={isConnected ? "success" : "warning"}
                                variant="outlined"
                                sx={{ ml: 1, fontSize: "0.7rem" }}
                            />
                            <Chip 
                                label={notificationEnabled ? "Đã bật" : "Đã tắt"} 
                                size="small" 
                                color={notificationEnabled ? "success" : "default"}
                                variant="outlined"
                                sx={{ ml: 0.5, fontSize: "0.7rem" }}
                            />
                        </Typography>
                        {unreadCount > 0 && (
                            <Button 
                                size="small" 
                                onClick={markAllAsRead}
                                sx={{ fontSize: "0.75rem" }}
                            >
                                Đánh dấu đã đọc
                            </Button>
                        )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {!notificationEnabled 
                            ? 'Thông báo đã bị tắt' 
                            : unreadCount > 0 
                                ? `${unreadCount} thông báo mới` 
                                : 'Không có thông báo mới'
                        }
                    </Typography>
                </Box>

                <Divider />

                {/* Notifications List */}
                <List sx={{ p: 0, maxHeight: 350, overflowY: 'auto' }}>
                    {/* Message khi tắt notification */}
                    {!notificationEnabled ? (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                🔕 Thông báo đã bị tắt
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                                Bật trong <strong>Cài đặt</strong> để nhận thông báo mới
                            </Typography>
                        </Box>
                    ) : notifications.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                {loading ? "Đang tải..." : "Không có thông báo nào"}
                            </Typography>
                        </Box>
                    ) : (
                        notifications.map((notification) => {
                            const notificationColor = getNotificationColor(notification.type, notification.severity);
                            
                            return (
                                <Grow 
                                    key={notification._id} 
                                    in={true} 
                                    timeout={300}
                                    style={{ transformOrigin: 'center top' }}
                                >
                                    <NotificationItem
                                        severity={notificationColor}
                                        onClick={() => handleNotificationClick(notification)}
                                        sx={{ 
                                            opacity: notification.isRead ? 0.7 : 1,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            {getNotificationIcon(notification.type, notification.severity)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                        {notification.title}
                                                    </Typography>
                                                    {!notification.isRead && (
                                                        <Box 
                                                            sx={{ 
                                                                width: 8, 
                                                                height: 8, 
                                                                borderRadius: '50%', 
                                                                bgcolor: theme.palette.primary.main 
                                                            }} 
                                                        />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                        {notification.message}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Chip 
                                                            label={notification.machineName || notification.source}
                                                            size="small"
                                                            variant="outlined"
                                                            color={notificationColor}
                                                            sx={{ fontSize: "0.7rem" }}
                                                        />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {formatDistanceToNow(new Date(notification.createdAt), { 
                                                                addSuffix: true, 
                                                                locale: vi 
                                                            })}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            }
                                        />
                                    </NotificationItem>
                                </Grow>
                            );
                        })
                    )}
                </List>
            </StyledMenu>
        </>
    );
};

export default NotificationBell;