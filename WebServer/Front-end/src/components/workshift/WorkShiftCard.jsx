import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Checkbox } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const WorkShiftCard = ({ 
    shift, 
    onClick, 
    isSelected = false,
    isChecked = false,
    onCheck
}) => {
    const theme = useTheme();
    
    const getStatusInfo = (status) => {
        switch (status) {
            case 'complete':
                return { 
                    label: 'Hoàn thành', 
                    color: 'success',
                    icon: '✅',
                    description: 'Ca đã hoàn thành và lưu data chính xác',
                    bgColor: theme.palette.success.main,
                    borderColor: theme.palette.success.main
                };
            case 'incomplete':  
                return { 
                    label: 'Chưa hoàn chỉnh', 
                    color: 'warning',
                    icon: '⚠️',
                    description: 'Ca đã lưu nhưng data có thể chưa đầy đủ',
                    bgColor: theme.palette.warning.main,
                    borderColor: theme.palette.warning.main
                };
            case 'paused': 
                return { 
                    label: 'Đang tạm dừng', 
                    color: 'error',
                    icon: '⏸️',
                    description: 'Ca đang được tạm dừng',
                    bgColor: theme.palette.error.dark,    
                    borderColor: theme.palette.error.dark
                };
            case 'active':
                return { 
                    label: 'Đang hoạt động', 
                    color: 'info',
                    icon: '🔄',
                    description: 'Ca đang trong quá trình thực hiện',
                    bgColor: theme.palette.info.main,
                    borderColor: theme.palette.info.main
                };
            default:
                return { 
                    label: status || 'Không xác định', 
                    color: 'default',
                    icon: '❓',
                    description: 'Trạng thái không xác định',
                    bgColor: theme.palette.grey[500],
                    borderColor: theme.palette.grey[500]
                };
        }
    };

    const statusInfo = getStatusInfo(shift.status);

    const handleCardClick = (e) => {
        if (e.target.type !== 'checkbox') {
            onClick && onClick(shift);
        }
    };

    const handleCheckboxChange = (e) => {
        e.stopPropagation();
        onCheck && onCheck(e.target.checked);
    };

    return (
        <Card 
            sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                width: '100%', 
                minHeight: '120px', 
                border: `2px solid`,
                borderColor: isSelected 
                    ? statusInfo.borderColor 
                    : `${statusInfo.borderColor}40`, 
                backgroundColor: isSelected
                    ? `${statusInfo.bgColor}08` 
                    : 'background.paper',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isSelected 
                    ? `0 8px 32px ${statusInfo.bgColor}20`
                    : theme.shadows[1],
                '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: `0 8px 32px ${statusInfo.bgColor}25`,
                    borderColor: statusInfo.borderColor,
                    backgroundColor: `${statusInfo.bgColor}05`
                },
                position: 'relative'
            }}
            onClick={handleCardClick}
        >
            {/* Checkbox for multi-select */}
            <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
                <Checkbox
                    checked={isChecked}
                    onChange={handleCheckboxChange}
                    size="small"
                    sx={{ 
                        p: 0.5,
                        color: 'white',
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        borderRadius: '50%',
                        '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.5)'
                        },
                        '&.Mui-checked': {
                            color: statusInfo.bgColor,
                            backgroundColor: 'rgba(255,255,255,0.9)'
                        },
                        '& .MuiSvgIcon-root': {
                            fontSize: 18
                        }
                    }}
                />
            </Box>

            <CardContent sx={{ 
                p: 2,
                pl: 5, 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                fontWeight: 600, 
                                fontSize: '1rem',
                                color: isSelected ? statusInfo.bgColor : 'text.primary',
                                mb: 0.5
                            }}
                        >
                            {shift.shiftId} 
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {shift.shiftId && shift.shiftId.includes('_') ? (
                                `Máy ${shift.shiftId.split('_')[0]?.slice(1)} - Ca ${shift.shiftId.split('_')[1]?.slice(1)}`
                            ) : (
                                `Máy ${shift.machineNumber || 1} - Ca ${shift.shiftNumber || 1}`
                            )}
                        </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                        <Chip 
                            label={statusInfo.label}
                            size="small"
                            sx={{
                                backgroundColor: statusInfo.bgColor,
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                minWidth: '100px', 
                                '& .MuiChip-label': {
                                    px: 1.5
                                }
                            }}
                        />
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default WorkShiftCard;