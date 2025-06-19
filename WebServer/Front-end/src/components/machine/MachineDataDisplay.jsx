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
import { MONITORING_DATA_CONFIG, ADMIN_DATA_CONFIG } from '../../config/machineDataConfig';
import { processCombinedData } from '../../utils/dataProcessing';
import { useCSVExport } from '../../hooks/useCSVExport';

const MachineDataDisplay = ({ 
    machine, 
    selectedShiftData, 
    user, 
    workShifts, 
    shiftsLoading, 
    onClearSelectedShift 
}) => {
    const { exportShift } = useCSVExport();
    const isAdmin = user?.role === 'admin';

    const getStatusInfo = (status) => {
        switch (status) {
            case 'completed':
                return { label: 'Hoàn thành', color: 'success', icon: '✅' };
            case 'incomplete':
                return { label: 'Chưa hoàn chỉnh', color: 'warning', icon: '⚠️' };
            case 'interrupted':
                return { label: 'Bị gián đoạn', color: 'error', icon: '🚨' };
            case 'active':
                return { label: 'Đang hoạt động', color: 'info', icon: '🔄' };
            default:
                return { label: status || 'Không xác định', color: 'default', icon: '❓' };
        }
    };

    const getDisplayData = (dataType = 'monitoring') => {
        if (selectedShiftData) {
            return {
                title: dataType === 'monitoring' 
                    ? `📊 Dữ liệu ca: ${selectedShiftData.shiftId}`
                    : `🔧 Dữ liệu phát triển ca: ${selectedShiftData.shiftId}`,
                isSelectedShift: true,
                data: dataType === 'monitoring' 
                    ? selectedShiftData.finalData?.monitoringData || {}
                    : selectedShiftData.finalData?.adminData || {},
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
                    borderColor: 'grey.300',
                    bgcolor: 'grey.50',
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
                            
                            {/* Status chip */}
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
                            {/* Clear button */}
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

                    {/* Thông tin cơ bản ca */}
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
                                        {displayData.shiftInfo.startTime ? new Date(displayData.shiftInfo.startTime).toLocaleString('vi-VN') : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Typography variant="caption" color="text.secondary">Thời gian kết thúc</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {displayData.shiftInfo.endTime ? new Date(displayData.shiftInfo.endTime).toLocaleString('vi-VN') : 'Đang hoạt động'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Typography variant="caption" color="text.secondary"> Khối lượng cần chiết rót</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {(() => {
                                            const targetWeight = displayData.data?.['40004'] || 0;
                                            return `${Number(targetWeight).toLocaleString('es-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })} kg`;
                                        })()}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Typography variant="caption" color="text.secondary">Năng suất ca làm việc</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {(() => {
                                            const eff = displayData.shiftInfo.efficiency;
                                            const weight = displayData.shiftInfo.totalWeightFilled;
                                            const duration = displayData.shiftInfo.duration;
                                            
                                            // Handle null/undefined
                                            if (eff === null || eff === undefined) {
                                                return 'Chưa có dữ liệu';
                                            }
                                            
                                            // Handle 0 efficiency
                                            if (eff === 0) {
                                                // Backup: manual calculation if we have data
                                                if (weight && duration && duration > 0) {
                                                    const manualEff = (weight / (duration / 60)).toFixed(2);
                                                    return `${manualEff} Kg/h`;
                                                }
                                                return '0.00 kg/h';
                                            }
                                            
                                            // Format with 2 decimals, NO toLocaleString
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
                    
                    {/* Render data fields */}
                    <Grid container spacing={2}>
                        {Object.entries(config).map(([key, fieldConfig]) => {
                            const processedData = processCombinedData(displayData.data, { [key]: fieldConfig }, machine);
                            const value = key === 'totalWeightFilled' 
                                ? (displayData.shiftInfo?.totalWeightFilled || 0)
                                : processedData[key];
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
                                                {fieldConfig.type === 'status' && fieldConfig.values 
                                                    ? (
                                                        <Chip 
                                                            label={fieldConfig.values[value]?.label || 'Không xác định'}
                                                            color={fieldConfig.values[value]?.color || 'default'}
                                                            size="small"
                                                        />
                                                    )
                                                    : fieldConfig.type === 'combined'
                                                    ? value
                                                    : key === 'totalWeightFilled' 
                                                    ? `${Number(value || 0).toFixed(2)} ${fieldConfig.unit || ''}`
                                                    : `${value || 0} ${fieldConfig.unit || ''}`
                                                }
                                            </Typography>
                                            
                                            {/* Debug info cho combined fields */}
                                            {fieldConfig.type === 'combined' && fieldConfig.calculation === 'high_low_32bit' && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                    Low: {displayData.data[fieldConfig.lowRegister] || 0}, High: {displayData.data[fieldConfig.highRegister] || 0}
                                                </Typography>
                                            )}
                                            
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

export default MachineDataDisplay;