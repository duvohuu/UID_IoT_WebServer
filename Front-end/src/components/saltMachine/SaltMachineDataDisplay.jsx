import React from 'react';
import { 
    Card, 
    CardContent, 
    Typography, 
    Box, 
    Grid, 
    Chip, 
    Button, 
    Alert,
    CircularProgress 
} from '@mui/material';
import { 
    Close as CloseIcon,
    Download as DownloadIcon 
} from '@mui/icons-material';
import { MONITORING_DATA_CONFIG, ADMIN_DATA_CONFIG } from '../../config/saltMachineConfig';

const SaltMachineDataDisplay = ({ 
    selectedShiftData, 
    user, 
    workShifts, 
    shiftsLoading, 
    onClearSelectedShift 
}) => {
    const isAdmin = user?.role === 'admin';

    const getStatusInfo = (status) => {
        switch (status) {
            case 'complete':
                return { label: 'Hoàn thành', color: 'success', icon: '✅' };
            case 'incomplete':
                return { label: 'Chưa hoàn chỉnh', color: 'warning', icon: '⚠️' };
            case 'paused':
                return { label: 'Đang tạm dừng', color: 'error', icon: '🚨' };
            case 'active':
                return { label: 'Đang hoạt động', color: 'info', icon: '🔄' };
            default:
                return { label: status || 'Không xác định', color: 'default', icon: '❓' };
        }
    };

    // Get field value from WorkShift object
    const getFieldValue = (data, key) => {
        if (key.includes('.')) {
            return key.split('.').reduce((obj, path) => obj?.[path], data) || 0;
        } else if (key === 'loadcellConfigs') {
            return data.loadcellConfigs || [];
        } else if (key.startsWith('loadcell') && key.match(/^loadcell[1-4]$/)) {
            const loadcellNumber = parseInt(key.replace('loadcell', ''));
            const configs = data.loadcellConfigs || [];
            return configs.find(config => config.loadcellId === loadcellNumber) || null;
        } else {
            return data[key] || 0;
        }
    };

    // Render field value
    const renderFieldValue = (value, fieldConfig) => {
        if (fieldConfig.type === 'status' && fieldConfig.values) {
            return (
                <Chip 
                    label={fieldConfig.values[value]?.label || 'Không xác định'}
                    color={fieldConfig.values[value]?.color || 'default'}
                    size="small"
                />
            );
        } else if (fieldConfig.type === 'loadcell_single') {
            if (!value) {
                return (
                    <Box>
                        <Typography variant="body2" color="warning.main">
                            ⚠️ Chưa cấu hình
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Gain: 0, Offset: 0
                        </Typography>
                    </Box>
                );
            }
            
            const isCalibrated = value.gain !== 0 || value.offset !== 0;
            return (
                <Box>
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            fontWeight: 500,
                            color: isCalibrated ? 'success.main' : 'warning.main'
                        }}
                    >
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Gain: <Typography component="span" variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>
                            {Number(value.gain || 0).toFixed(4)}
                        </Typography>
                    </Typography>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Offset: <Typography component="span" variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>
                            {Number(value.offset || 0).toFixed(4)}
                        </Typography>
                    </Typography>
                </Box>
            );
        } else if (fieldConfig.type === 'text') {
            return value || 'Chưa xác định';
        } else if (fieldConfig.type === 'percentage') {
            return `${Number(value || 0).toFixed(1)}%`;
        } else if (fieldConfig.type === 'interger') {
            return `${Number(value || 0)} ${fieldConfig.unit || ''}`;
        } else if (fieldConfig.type === 'float') {
            return `${Number(value || 0).toFixed(2)} ${fieldConfig.unit || ''}`;
            
        }else {
            return `${value || 0} ${fieldConfig.unit || ''}`;
        }
    };

    const getDisplayData = (dataType = 'monitoring') => {
        if (selectedShiftData) {
            return {
                title: dataType === 'monitoring' 
                    ? `📊 Dữ liệu ca: ${selectedShiftData.shiftId}`
                    : `🔧 Dữ liệu phát triển ca: ${selectedShiftData.shiftId}`,
                isSelectedShift: true,
                data: selectedShiftData,
                shiftInfo: selectedShiftData,
                statusInfo: getStatusInfo(selectedShiftData.status)
            };
        } else {
            return null;
        }
    };

    const renderUnifiedDataCard = (dataType, config, isAdminOnly = false) => {
        const displayData = getDisplayData(dataType);
        
        // Placeholder khi không có data
        if (!displayData) {
            return (
                <Card sx={{ 
                    border: '2px dashed', 
                    borderColor: (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.23)'  // Dark mode: border sáng hơn
                        : 'grey.300',                   // Light mode: border gốc
                    bgcolor: (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.08)'  // Dark mode: nền tối với alpha
                        : 'grey.50',                    // Light mode: nền sáng
                    mb: 2
                }}>
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            {dataType === 'monitoring' ? '📊 Dữ liệu giám sát' : '🔧 Dữ liệu phát triển'}
                        </Typography>
                        
                        {shiftsLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                                <CircularProgress size={20} />
                                <Typography color="text.secondary">
                                    Đang tải ca làm việc...
                                </Typography>
                            </Box>
                        ) : workShifts.length === 0 ? (
                            <>
                                <Typography color="text.secondary" sx={{ mb: 2 }}>
                                    Chưa có ca làm việc nào được ghi nhận
                                </Typography>
                                <Typography variant="caption" color="text.disabled">
                                    Dữ liệu sẽ hiển thị khi có ca làm việc mới
                                </Typography>
                            </>
                        ) : (
                            <>
                                <Typography color="text.secondary" sx={{ mb: 2 }}>
                                    Chọn ca làm việc bên trái để xem dữ liệu chi tiết
                                </Typography>
                                <Typography variant="caption" color="text.disabled">
                                    Click vào bất kỳ ca nào trong danh sách để hiển thị data
                                </Typography>
                            </>
                        )}
                        
                        {isAdminOnly && (
                            <Chip 
                                label="Admin Only" 
                                size="small" 
                                color="secondary" 
                                sx={{ mt: 1 }}
                            />
                        )}
                    </CardContent>
                </Card>
            );
        }
        
        return (
            <Card sx={{ 
                mb: 2, 
                border: 2, 
                borderColor: 'primary.main'
            }}>
                <CardContent>
                    {/* Header với title và controls */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {displayData.title}
                            </Typography>
                            
                            {isAdminOnly && (
                                <Chip label="Admin Only" size="small" color="secondary" />
                            )}
                            
                            {displayData.statusInfo && (
                                <Chip 
                                    label={displayData.statusInfo.label}
                                    color={displayData.statusInfo.color}
                                    size="small"
                                    icon={<span>{displayData.statusInfo.icon}</span>}
                                />
                            )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>                            
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CloseIcon />}
                                onClick={onClearSelectedShift}
                                sx={{ minWidth: 'auto' }}
                            >
                                Bỏ chọn ca
                            </Button>
                        </Box>
                    </Box>

                    {/* Thông tin cơ bản ca với safe formatting */}
                    {dataType === 'monitoring' && (
                        <Box sx={{ 
                            mb: 3, 
                            p: 2, 
                            bgcolor: (theme) => theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.05)' 
                                : 'grey.50', 
                            borderRadius: 1 
                        }}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Typography variant="caption" color="text.secondary">Thời gian bắt đầu</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {new Date (displayData.shiftInfo.timeTracking.shiftStartTime).toLocaleString('vi-VN')}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Typography variant="caption" color="text.secondary">Thời gian kết thúc</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                         {new Date (displayData.shiftInfo.timeTracking.shiftEndTime).toLocaleString('vi-VN')}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Typography variant="caption" color="text.secondary">Thời gian dừng</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                         {(() => {
                                            const pausedTime = displayData.shiftInfo.timeTracking.shiftPausedTime;
                                            if (pausedTime === 0 || pausedTime === null || pausedTime === undefined) {
                                                return '0 phút';
                                            }
                                            if (typeof pausedTime === 'number') {
                                                const roundedTime = Math.round(pausedTime * 10) / 10;
                                                return `${roundedTime} phút`;
                                            }
                                         })()}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Typography variant="caption" color="text.secondary">Hiệu suất ca làm việc</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {(() => {
                                            const eff = displayData.shiftInfo?.efficiency;
                                            if (eff === null || eff === undefined) {
                                                return 'Chưa có dữ liệu';
                                            }
                                            return `${Number(eff).toFixed(2)} kg/h`;
                                        })()}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {/* Data reliability warning */}
                    {(displayData.shiftInfo.status === 'incomplete' || displayData.shiftInfo.status === 'interrupted') && (
                        <Alert 
                            severity={displayData.shiftInfo.status === 'incomplete' ? 'warning' : 'error'} 
                            sx={{ mb: 2 }}
                        >
                            {displayData.shiftInfo.status === 'incomplete' 
                                ? '⚠️ Dữ liệu ca chưa hoàn chỉnh - có thể chưa được cập nhật đầy đủ'
                                : '🚨 Ca bị gián đoạn - dữ liệu có thể không chính xác'
                            }
                        </Alert>
                    )}
                    
                    {/* Render data fields với helper functions */}
                    <Grid container spacing={2}>
                        {Object.entries(config).map(([key, fieldConfig]) => {
                            const value = getFieldValue(displayData.data, key);
                            const IconComponent = fieldConfig.icon;
                            
                            return (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={key}>
                                    <Box sx={{ 
                                        p: 2, 
                                        border: 1, 
                                        borderColor: 'divider', 
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2
                                    }}>
                                        <IconComponent sx={{ color: 'primary.main' }} />
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {fieldConfig.title}
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {renderFieldValue(value, fieldConfig)}
                                            </Typography>
                                            
                                            {/* Range info */}
                                            {fieldConfig.range && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                    Phạm vi: {fieldConfig.range}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>
                </CardContent>
            </Card>
        );
    };

    return (
        <>
            {/* Monitoring Data - All users can view */}
            {renderUnifiedDataCard(
                'monitoring', 
                MONITORING_DATA_CONFIG, 
                false
            )}

            {/* Admin Data - Only admin can view */}
            {isAdmin ? (
                renderUnifiedDataCard(
                    'admin', 
                    ADMIN_DATA_CONFIG, 
                    true
                )
            ) : (
                /* Access Denied for Non-Admin */
                <Card sx={{ 
                    border: '2px dashed', 
                    borderColor: 'grey.300',
                    bgcolor: 'grey.50'
                }}>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            🔒 Dữ liệu phát triển
                        </Typography>
                        <Typography color="text.secondary">
                            Chỉ quản trị viên mới có thể xem dữ liệu chi tiết này.
                        </Typography>
                    </CardContent>
                </Card>
            )}
        </>
    );
};

export default SaltMachineDataDisplay;