import React from "react";
import { Box, Grid, Paper, Typography, LinearProgress } from "@mui/material"; // Sử dụng Grid
import { useTheme } from "@mui/material/styles";
import {
    Computer as MachineIcon,
    CheckCircle as OnlineIcon,
    Cancel as OfflineIcon,
    Warning as WarningIcon,
    TrendingUp as TrendIcon
} from '@mui/icons-material';

const StatusStatsCards = ({ stats }) => {
    const theme = useTheme();

    const statsData = [
        {
            title: 'Tổng Máy Móc',
            value: stats.total,
            icon: <MachineIcon />,
            color: theme.palette.info.main,
            bgColor: theme.palette.info.light + '20',
            description: 'Tổng số máy trong hệ thống'
        },
        {
            title: 'Đang Hoạt Động',
            value: stats.online,
            icon: <OnlineIcon />,
            color: theme.palette.success.main,
            bgColor: theme.palette.success.light + '20',
            percentage: stats.onlinePercentage,
            description: `${stats.onlinePercentage}% máy đang online`
        },
        {
            title: 'Mất Kết Nối',
            value: stats.offline,
            icon: <OfflineIcon />,
            color: theme.palette.error.main,
            bgColor: theme.palette.error.light + '20',
            percentage: stats.offlinePercentage,
            description: `${stats.offlinePercentage}% máy offline`
        },
        {
            title: 'Cảnh Báo',
            value: stats.warning,
            icon: <WarningIcon />,
            color: theme.palette.warning.main,
            bgColor: theme.palette.warning.light + '20',
            percentage: stats.warningPercentage,
            description: `${stats.warningPercentage}% máy có cảnh báo`
        }
    ];

    const StatCard = ({ title, value, icon, color, bgColor, percentage, description }) => (
        <Paper
            sx={{
                p: 3,
                background: `linear-gradient(135deg, ${bgColor} 0%, ${theme.palette.background.paper} 100%)`,
                border: `1px solid ${color}30`,
                borderRadius: 3,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 25px ${color}40`,
                    border: `1px solid ${color}60`,
                }
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            color: 'text.secondary', 
                            fontWeight: 500,
                            mb: 1
                        }}
                    >
                        {title}
                    </Typography>
                    <Typography 
                        variant="h3" 
                        sx={{ 
                            fontWeight: 700,
                            color: color,
                            mb: 1,
                            lineHeight: 1
                        }}
                    >
                        {value}
                    </Typography>
                    {percentage !== undefined && (
                        <Box sx={{ mt: 2, mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Tỷ lệ
                                </Typography>
                                <Typography variant="caption" sx={{ color: color, fontWeight: 600 }}>
                                    {percentage}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={percentage}
                                sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: `${color}20`,
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: color,
                                        borderRadius: 3,
                                    }
                                }}
                            />
                        </Box>
                    )}
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            color: 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mt: 1
                        }}
                    >
                        <TrendIcon sx={{ fontSize: 12 }} />
                        {description}
                    </Typography>
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        backgroundColor: `${color}15`,
                        color: color,
                        ml: 2
                    }}
                >
                    {React.cloneElement(icon, { sx: { fontSize: 28 } })}
                </Box>
            </Box>
        </Paper>
    );

    // Nếu không có dữ liệu, hiển thị skeleton
    if (!stats || stats.total === 0) {
        return (
            <Box sx={{ mb: 4 }}>
                <Grid container spacing={3}>
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Grid item xs={12} sm={6} lg={3} key={index}>
                            <Paper
                                sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    background: `linear-gradient(135deg, ${theme.palette.grey[100]} 0%, ${theme.palette.background.paper} 100%)`,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Box 
                                            sx={{ 
                                                height: 16, 
                                                width: '60%', 
                                                bgcolor: 'grey.300', 
                                                borderRadius: 1, 
                                                mb: 2,
                                                animation: 'pulse 1.5s ease-in-out infinite',
                                                '@keyframes pulse': {
                                                    '0%': { opacity: 1 },
                                                    '50%': { opacity: 0.4 },
                                                    '100%': { opacity: 1 },
                                                }
                                            }} 
                                        />
                                        <Box 
                                            sx={{ 
                                                height: 32, 
                                                width: '40%', 
                                                bgcolor: 'grey.300', 
                                                borderRadius: 1,
                                                animation: 'pulse 1.5s ease-in-out infinite',
                                                animationDelay: '0.2s'
                                            }} 
                                        />
                                    </Box>
                                    <Box
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 2,
                                            bgcolor: 'grey.200',
                                            animation: 'pulse 1.5s ease-in-out infinite',
                                            animationDelay: '0.4s'
                                        }}
                                    />
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    return (
        <Box sx={{ mb: 4 }}>
            <Grid container spacing={3}>
                {statsData.map((stat, index) => (
                    <Grid item xs={12} sm={6} lg={3} key={index}>
                        <StatCard {...stat} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default StatusStatsCards;