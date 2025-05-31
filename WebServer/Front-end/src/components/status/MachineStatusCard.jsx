import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    Chip,
    Tooltip,
    Badge
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
    Computer as MachineIcon,
    NetworkCheck as NetworkIcon,
    Visibility as ViewIcon,
    Circle as CircleIcon,
    Refresh as RefreshIcon,
    Lock as LockIcon,
    Thermostat as TempIcon,
    Speed as SpeedIcon,
    Opacity as HumidityIcon,
    Compress as PressureIcon,
    SignalWifiOff as DisconnectedIcon,
    CloudOff as OfflineIcon
} from '@mui/icons-material';

// Custom icons for different machine types
const getMachineTypeIcon = (type) => {
    const icons = {
        'Salt Processing': '🧂',
        'Packaging': '📦',
        'Quality Control': '🔍',
        'Transport': '🚚',
        'default': '⚙️'
    };
    return icons[type] || icons.default;
};

const MachineStatusCard = ({ machine, index, onClick }) => {
    const theme = useTheme();
    const isConnected = machine.isConnected;
    const isOnline = machine.status === 'online' && isConnected;
    
    // Xác định trạng thái và màu sắc
    let statusColor, statusText, statusIcon;
    
    if (isConnected && isOnline) {
        statusColor = 'success';
        statusText = 'Đang hoạt động';
        statusIcon = <CircleIcon sx={{ fontSize: 12 }} />;
    } else if (isConnected && !isOnline) {
        statusColor = 'warning';
        statusText = 'Kết nối - Dừng';
        statusIcon = <CircleIcon sx={{ fontSize: 12 }} />;
    } else {
        statusColor = 'error';
        statusText = 'Mất kết nối';
        statusIcon = <DisconnectedIcon sx={{ fontSize: 12 }} />;
    }
    
    const canViewDetails = isConnected && isOnline;

    // Format uptime
    const formatUptime = (uptimeMs) => {
        if (!uptimeMs) return 'N/A';
        const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
        const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    // Handle click with connection check
    const handleClick = () => {
        if (canViewDetails) {
            onClick();
        }
    };

    return (
        <Card 
            sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
                boxShadow: `0 4px 20px ${theme.palette.grey[300]}40`,
                border: `2px solid ${theme.palette[statusColor].light}20`,
                transition: 'all 0.3s ease-in-out',
                opacity: canViewDetails ? 1 : 0.75,
                '&:hover': canViewDetails ? {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 30px ${theme.palette.grey[400]}60`,
                    border: `2px solid ${theme.palette[statusColor].main}40`,
                } : {}
            }}
        >
            <CardActionArea 
                onClick={handleClick}
                sx={{ 
                    height: '100%', 
                    p: 0,
                    cursor: canViewDetails ? 'pointer' : 'not-allowed'
                }}
                disabled={!canViewDetails}
            >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Header with status */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Badge
                                badgeContent={getMachineTypeIcon(machine.type)}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                sx={{
                                    '& .MuiBadge-badge': {
                                        fontSize: '12px',
                                        minWidth: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        backgroundColor: 'transparent',
                                        border: 'none'
                                    }
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        background: isConnected 
                                            ? (isOnline 
                                                ? `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`
                                                : `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`)
                                            : `linear-gradient(135deg, ${theme.palette.grey[400]}, ${theme.palette.grey[600]})`,
                                        color: 'white'
                                    }}
                                >
                                    <MachineIcon sx={{ fontSize: 20 }} />
                                </Box>
                            </Badge>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.2 }}>
                                    {machine.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    ID: {machine.id}
                                </Typography>
                            </Box>
                        </Box>
                        <Chip
                            icon={statusIcon}
                            label={statusText}
                            size="small"
                            color={statusColor}
                            variant={isConnected ? "filled" : "outlined"}
                            sx={{ 
                                borderRadius: 3,
                                fontWeight: 500,
                                '& .MuiChip-icon': {
                                    animation: (isConnected && isOnline) ? 'pulse 1.5s infinite' : 'none',
                                },
                                '@keyframes pulse': {
                                    '0%': { opacity: 1 },
                                    '50%': { opacity: 0.5 },
                                    '100%': { opacity: 1 },
                                }
                            }}
                        />
                    </Box>

                    {/* Machine Type & Location */}
                    <Box sx={{ mb: 2 }}>
                        <Grid container spacing={1}>
                            <Grid item xs={12}>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Loại máy:
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
                                    {machine.type}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Vị trí:
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {machine.location}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* HMI IP Information */}
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <NetworkIcon sx={{ 
                                fontSize: 16, 
                                color: isConnected ? 'success.main' : 'text.secondary'
                            }} />
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                HMI IP:
                            </Typography>
                        </Box>
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                fontWeight: 600, 
                                color: isConnected ? 'success.main' : 'text.secondary',
                                fontFamily: 'monospace',
                                ml: 3
                            }}
                        >
                            {machine.ip}
                        </Typography>
                    </Box>

                    {/* Connection Status Info */}
                    {!isConnected && (
                        <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: `${theme.palette.error.main}10` }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <OfflineIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>
                                    Trạng thái kết nối:
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 500 }}>
                                Không thể kết nối đến HMI
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                                Kiểm tra kết nối mạng và cấu hình HMI
                            </Typography>
                        </Box>
                    )}

                    {/* Parameters - Only show when online */}
                    {isConnected && isOnline && machine.parameters && (
                        <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: `${theme.palette.success.main}10` }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, display: 'block' }}>
                                Thông số hiện tại:
                            </Typography>
                            <Grid container spacing={1}>
                                {machine.parameters.temperature && (
                                    <Grid item xs={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <TempIcon sx={{ fontSize: 14, color: 'error.main' }} />
                                            <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                                {machine.parameters.temperature}°C
                                            </Typography>
                                        </Box>
                                    </Grid>
                                )}
                                {machine.parameters.humidity && (
                                    <Grid item xs={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <HumidityIcon sx={{ fontSize: 14, color: 'info.main' }} />
                                            <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                                {machine.parameters.humidity}%
                                            </Typography>
                                        </Box>
                                    </Grid>
                                )}
                                {machine.parameters.pressure && (
                                    <Grid item xs={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <PressureIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                                            <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                                {machine.parameters.pressure} Pa
                                            </Typography>
                                        </Box>
                                    </Grid>
                                )}
                                {machine.parameters.speed && (
                                    <Grid item xs={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <SpeedIcon sx={{ fontSize: 14, color: 'secondary.main' }} />
                                            <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                                {machine.parameters.speed} RPM
                                            </Typography>
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    )}

                    {/* Uptime & Last Update */}
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                        {isConnected && isOnline && (
                            <Box sx={{ mb: 1 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                    Thời gian hoạt động:
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.main' }}>
                                    {formatUptime(machine.uptime)}
                                </Typography>
                            </Box>
                        )}
                        
                        {machine.lastUpdate ? (
                            <Typography 
                                variant="caption" 
                                sx={{ 
                                    color: 'text.secondary',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    mb: 1
                                }}
                            >
                                <RefreshIcon sx={{ fontSize: 12 }} />
                                Cập nhật: {new Date(machine.lastUpdate).toLocaleString('vi-VN')}
                            </Typography>
                        ) : (
                            <Typography 
                                variant="caption" 
                                sx={{ 
                                    color: 'text.secondary',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    mb: 1
                                }}
                            >
                                <RefreshIcon sx={{ fontSize: 12 }} />
                                Chưa có dữ liệu cập nhật
                            </Typography>
                        )}
                    </Box>

                    {/* Action hint */}
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        mt: 2,
                        pt: 2,
                        borderTop: `1px solid ${theme.palette.divider}`
                    }}>
                        {canViewDetails ? (
                            <Typography 
                                variant="caption" 
                                sx={{ 
                                    color: 'primary.main',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    fontWeight: 500
                                }}
                            >
                                <ViewIcon sx={{ fontSize: 14 }} />
                                Click để xem chi tiết
                            </Typography>
                        ) : (
                            <Tooltip title={!isConnected ? "Máy phải kết nối để xem chi tiết" : "Máy phải hoạt động để xem chi tiết"}>
                                <Typography 
                                    variant="caption" 
                                    sx={{ 
                                        color: 'text.secondary',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        fontWeight: 500
                                    }}
                                >
                                    <LockIcon sx={{ fontSize: 14 }} />
                                    {!isConnected ? 'Chưa kết nối' : 'Chưa thể xem chi tiết'}
                                </Typography>
                            </Tooltip>
                        )}
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default MachineStatusCard;