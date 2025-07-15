import React from 'react';
import { 
    Card, 
    CardActionArea, 
    CardContent, 
    Typography, 
    Box, 
    Chip, 
    Grid, 
    Tooltip,
    IconButton,
    Divider,
    LinearProgress,
    Badge
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Circle as CircleIcon,
    WifiOff as DisconnectedIcon,
    Refresh as RefreshIcon,
    Lock as LockIcon,
    Visibility as ViewIcon,
    Computer as MachineIcon,
    Person as UserIcon,
    AdminPanelSettings as AdminIcon,
    Delete as DeleteIcon,
    Business as CompanyIcon,
    NetworkCheck as NetworkIcon,
    Router as RouterIcon,
    CheckCircle as ConnectedIcon,
    LocationOn as LocationIcon,
    Settings as SettingsIcon,
    SignalWifi4Bar as SignalIcon,
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    Stop as StopIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
} from '@mui/icons-material';

const MachineStatusCard = ({ machine, user, onClick, onDelete }) => {
    const theme = useTheme();
    const isConnected = machine.isConnected;
    const isOnline = machine.status === 'online' && isConnected;
    const isAdmin = user?.role === 'admin';
    
    let statusColor, statusText, statusIcon, statusBgColor, primaryStatusIcon;
    
    if (isConnected && isOnline) {
        statusColor = 'success';
        statusText = 'Đang hoạt động';
        statusIcon = <CircleIcon sx={{ fontSize: 12 }} />;
        statusBgColor = theme.palette.success.main;
        primaryStatusIcon = <PlayIcon />;
    } else if (isConnected && !isOnline) {
        statusColor = 'warning';
        statusText = 'Kết nối - Dừng';
        statusIcon = <CircleIcon sx={{ fontSize: 12 }} />;
        statusBgColor = theme.palette.warning.main;
        primaryStatusIcon = <PauseIcon />;
    } else {
        statusColor = 'error';
        statusText = 'Mất kết nối';
        statusIcon = <DisconnectedIcon sx={{ fontSize: 12 }} />;
        statusBgColor = theme.palette.error.main;
        primaryStatusIcon = <ErrorIcon />;
    }
    
    const canViewDetails = true;

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete(machine);
        }
    };

    // Function để phân loại IP
    const getIPType = (ip) => {
        if (!ip) return { type: 'Unknown', icon: <RouterIcon />, color: theme.palette.grey[500] };
        
        if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.') || ip === '127.0.0.1') {
            return { 
                type: 'Local', 
                icon: <NetworkIcon />, 
                color: theme.palette.info.main 
            };
        } else {
            return { 
                type: 'Remote', 
                icon: <RouterIcon />, 
                color: theme.palette.secondary.main 
            };
        }
    };

    const ipConfig = getIPType(machine.ip);

    return (
        <Card
            sx={{
                width: '100%',  
                height: 'auto',
                minHeight: 420,
                display: 'flex',
                flexDirection: 'column',
                background: isAdmin 
                    ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.primary.main}05 100%)`
                    : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${statusBgColor}08 100%)`,
                border: `2px solid ${isAdmin ? theme.palette.primary.main + '20' : statusBgColor + '20'}`,
                borderRadius: 5,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: canViewDetails ? 'pointer' : 'default',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 5,
                    background: `linear-gradient(90deg, ${statusBgColor}, ${statusBgColor}80)`,
                    opacity: isConnected ? 1 : 0.3,
                },
                '&:hover': {
                    transform: canViewDetails ? 'translateY(-12px) scale(1.02)' : 'none',
                    boxShadow: canViewDetails 
                        ? `0 20px 60px ${statusBgColor}30, 0 0 0 1px ${statusBgColor}40` 
                        : 'none',
                    borderColor: canViewDetails ? statusBgColor + '60' : statusBgColor + '20',
                    '&::before': {
                        height: 5,
                    }
                },
            }}
        >

            <CardActionArea
                onClick={() => canViewDetails && onClick && onClick(machine)}
                disabled={!canViewDetails}
                sx={{ 
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    padding: '15px',
                    '&.Mui-disabled': {
                        cursor: 'default'
                    }
                }}
            >
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
                    
                    <Box sx={{ mb: 2, pt: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 1.5, mb: 1.5}}>
                            <Chip
                                icon={<CompanyIcon />}
                                label={machine.machineId || 'N/A'}
                                size="medium"
                                variant="filled"
                                color="primary"
                                sx={{ 
                                    fontFamily: 'monospace', 
                                    fontWeight: 'bold',
                                    fontSize: '0.8rem',
                                    height: 30,
                                    borderRadius: 3,
                                    mr: isAdmin ? 0 : 6.5,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                }}
                            />
                            
                            {/* ADMIN CHIP - ONLY FOR ADMIN */}
                            <Chip
                                icon={isAdmin ? <AdminIcon /> : <UserIcon />}
                                label = {isAdmin ? "ADMIN" : "USER"}
                                size="medium"
                                variant="outlined"
                                sx={{ 
                                    fontSize: '0.8rem',
                                    height: 30,
                                    borderRadius: 3,
                                    color: theme.palette.secondary.main,
                                    borderColor: theme.palette.secondary.main,
                                    backgroundColor: theme.palette.secondary.main + '08',
                                    fontWeight: 600,
                                    '&:hover': {
                                        backgroundColor: theme.palette.secondary.main + '15',
                                    }
                                }}
                            />
                            
                            {/* DELETE BUTTON - ONLY FOR ADMIN */}
                            {isAdmin && (
                                <Tooltip title="Xóa máy" arrow>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={handleDeleteClick}
                                        sx={{ 
                                            width: 32,
                                            height: 32,
                                            backgroundColor: 'rgba(255,255,255,0.95)',
                                            backdropFilter: 'blur(10px)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                            '&:hover': {
                                                backgroundColor: 'error.main',
                                                color: 'white',
                                                transform: 'scale(1.1)',
                                            }
                                        }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                        
                        <Divider sx={{ 
                            borderColor: theme.palette.divider,
                            opacity: 0.6, 
                        }} />
                    </Box>

                    {/* MACHINE HEADER WITH STATUS BADGE */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, mb: 2 }}>
                        <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            badgeContent={
                                <Box
                                    sx={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        backgroundColor: statusBgColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        border: `3px solid ${theme.palette.background.paper}`,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    {React.cloneElement(primaryStatusIcon, { sx: { fontSize: 14 } })}
                                </Box>
                            }
                        >
                            <Box
                                sx={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: 3,
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                    animation: isConnected ? 'pulse 3s infinite' : 'none',
                                    '@keyframes pulse': {
                                        '0%': { boxShadow: '0 8px 24px rgba(0,0,0,0.15)' },
                                        '50%': { boxShadow: `0 8px 32px ${theme.palette.primary.main}40` },
                                        '100%': { boxShadow: '0 8px 24px rgba(0,0,0,0.15)' },
                                    }
                                }}
                            >
                                <MachineIcon sx={{ fontSize: 32 }} />
                            </Box>
                        </Badge>
                        
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography 
                                variant="h5"
                                sx={{ 
                                    fontWeight: 700,
                                    color: theme.palette.text.primary,
                                    lineHeight: 1.3,
                                    mb: 1,
                                    fontSize: '1.4rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {machine.name}
                            </Typography>
                            
                            <Chip
                                icon={statusIcon}
                                label={statusText}
                                color={statusColor}
                                size="medium"
                                sx={{ 
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    height: 32,
                                    borderRadius: 2,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                }}
                            />
                        </Box>
                    </Box>

                    {/* MACHINE INFO */}
                    <Box sx={{ mb: 1.5 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <SettingsIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                                        Loại máy
                                    </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main', fontSize: '1rem' }}>
                                    {machine.type}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                                        Vị trí
                                    </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                                    {machine.location}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* ENHANCED IP ADDRESS SECTION */}
                    <Box sx={{ 
                        mb: 2, 
                        p: 1.5,
                        background: `linear-gradient(135deg, ${ipConfig.color}08, ${ipConfig.color}04)`,
                        borderRadius: 3, 
                        border: `1px solid ${ipConfig.color}25`,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: 2,
                            background: `linear-gradient(90deg, ${ipConfig.color}, transparent)`,
                        }
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 45,
                                    height: 45,
                                    borderRadius: 2,
                                    background: `linear-gradient(135deg, ${ipConfig.color}20, ${ipConfig.color}10)`,
                                    color: ipConfig.color,
                                    border: `1px solid ${ipConfig.color}30`,
                                }}
                            >
                                {React.cloneElement(ipConfig.icon, { fontSize: 'medium' })}
                            </Box>
                            <Box sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <SignalIcon sx={{ fontSize: 14, color: ipConfig.color }} />
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: ipConfig.color,
                                            fontWeight: 600,
                                            fontSize: '0.8rem',
                                        }}
                                    >
                                        {ipConfig.type} Network
                                    </Typography>
                                </Box>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 700,
                                        color: ipConfig.color,
                                        fontFamily: 'monospace',
                                        fontSize: '1.1rem',
                                        letterSpacing: '0.5px',
                                    }}
                                >
                                    {machine.ip || 'Chưa có IP'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* ENHANCED CONNECTION STATUS */}
                    <Box sx={{ 
                        mb: 2, 
                        p: 1.5, 
                        borderRadius: 3, 
                        background: isConnected 
                            ? `linear-gradient(135deg, ${theme.palette.success.main}08, ${theme.palette.success.main}04)`
                            : `linear-gradient(135deg, ${theme.palette.error.main}08, ${theme.palette.error.main}04)`,
                        border: `1px solid ${isConnected ? theme.palette.success.main + '25' : theme.palette.error.main + '25'}`,
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: 2,
                            background: `linear-gradient(90deg, ${isConnected ? theme.palette.success.main : theme.palette.error.main}, transparent)`,
                        }
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 45,
                                    height: 45,
                                    borderRadius: 2,
                                    backgroundColor: isConnected ? `${theme.palette.success.main}20` : `${theme.palette.error.main}20`,
                                    color: isConnected ? theme.palette.success.main : theme.palette.error.main,
                                }}
                            >
                                {isConnected ? <ConnectedIcon /> : <ErrorIcon />}
                            </Box>
                            <Box>
                                <Typography variant="body1" sx={{ 
                                    color: isConnected ? 'success.main' : 'error.main', 
                                    fontWeight: 600,
                                    fontSize: '1rem'
                                }}>
                                    {isConnected ? 'Đã kết nối đến HMI' : 'Chưa kết nối đến HMI'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                                    {isConnected ? 'Truyền thông ổn định' : 'Kiểm tra kết nối mạng'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* LAST UPDATE WITH ENHANCED STYLING */}
                    <Box sx={{ mt: 'auto', mb: 2 }}>
                        {machine.lastUpdate ? (
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1.5,
                                p: 2,
                                borderRadius: 2,
                                bgcolor: `${theme.palette.info.main}06`,
                                border: `1px solid ${theme.palette.info.main}15`,
                            }}>
                                <RefreshIcon sx={{ 
                                    fontSize: 20, 
                                    color: 'info.main',
                                    animation: 'spin 2s linear infinite',
                                    '@keyframes spin': {
                                        '0%': { transform: 'rotate(0deg)' },
                                        '100%': { transform: 'rotate(360deg)' },
                                    }
                                }} />
                                <Box>
                                    <Typography variant="body2" sx={{ color: 'info.main', fontWeight: 600, fontSize: '0.9rem' }}>
                                        Cập nhật gần nhất
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                                        {new Date(machine.lastUpdate).toLocaleString('vi-VN')}
                                    </Typography>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1.5,
                                p: 2,
                                borderRadius: 2,
                                bgcolor: `${theme.palette.warning.main}06`,
                                border: `1px solid ${theme.palette.warning.main}15`,
                            }}>
                                <WarningIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                                <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600 }}>
                                    Chưa có dữ liệu cập nhật
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* ENHANCED ACTION HINT */}
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        p: 1,
                        borderRadius: 2,
                        border: `2px dashed ${theme.palette.divider}`,
                        background: `linear-gradient(45deg, transparent 48%, ${theme.palette.action.hover} 50%, transparent 52%)`,
                        backgroundSize: '8px 8px',
                        animation: canViewDetails ? 'slide 2s linear infinite' : 'none',
                        '@keyframes slide': {
                            '0%': { backgroundPosition: '0 0' },
                            '100%': { backgroundPosition: '16px 16px' },
                        }
                    }}>
                        {canViewDetails ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ViewIcon sx={{ 
                                    fontSize: 20, 
                                    color: 'primary.main',
                                    animation: 'bounce 1s infinite',
                                    '@keyframes bounce': {
                                        '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                                        '40%': { transform: 'translateY(-4px)' },
                                        '60%': { transform: 'translateY(-2px)' },
                                    }
                                }} />
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        color: 'primary.main',
                                        fontWeight: 600,
                                        fontSize: '0.95rem'
                                    }}
                                >
                                    Click để xem chi tiết máy
                                </Typography>
                            </Box>
                        ) : (
                            <Tooltip 
                                title={!isConnected ? "Máy phải kết nối để xem chi tiết" : "Máy phải hoạt động để xem chi tiết"}
                                arrow
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LockIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            color: 'text.secondary',
                                            fontWeight: 500,
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        {!isConnected ? 'Chưa kết nối' : 'Chưa thể xem chi tiết'}
                                    </Typography>
                                </Box>
                            </Tooltip>
                        )}
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default MachineStatusCard;