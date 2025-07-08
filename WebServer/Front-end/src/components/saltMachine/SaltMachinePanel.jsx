import React from 'react';
import { 
    Card, 
    CardContent, 
    Typography, 
    Box, 
    Alert, 
    List, 
    ListItem, 
    IconButton,
    CircularProgress,
    Chip,
    Button,
    Checkbox,
    FormControlLabel,
    Divider
} from '@mui/material';
import { 
    Assignment as ShiftIcon,
    Refresh as RefreshIcon,
    FileDownload as ExportIcon,
    Clear as ClearIcon,
    SelectAll as SelectAllIcon
} from '@mui/icons-material';
import SaltMachineCard from './SaltMachineCard';
import SaltMachineFilter from './SaltMachineShiftFilter';

const SaltMachinePanel = ({ 
    selectedShiftData,
    shiftsLoading,
    shiftFilter,
    filteredShifts = [],
    onShiftClick,
    onRefreshShifts,
    onShiftFilterChange,
    onClearSelectedShift,
    selectedShifts = [],
    onShiftSelect,
    onSelectAllShifts,
    onExportSelectedShifts,
    isExporting = false
}) => {

    const handleSelectAll = () => {
        if (selectedShifts.length === filteredShifts.length && filteredShifts.length > 0) {
            // Unselect all
            onSelectAllShifts([]);
        } else {
            // Select all filtered shifts
            onSelectAllShifts(filteredShifts);
        }
    };

    const isAllSelected = selectedShifts.length === filteredShifts.length && filteredShifts.length > 0;
    const isSomeSelected = selectedShifts.length > 0 && selectedShifts.length < filteredShifts.length;

    return (
        <Card sx={{ mt: 2 }}>
            <CardContent sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShiftIcon sx={{ color: 'primary.main' }} />
                        Ca làm việc
                    </Typography>
                    <IconButton 
                        size='small' 
                        onClick={onRefreshShifts}
                        disabled={shiftsLoading}
                        sx={{ color: 'primary.main' }}
                    >
                        <RefreshIcon />
                    </IconButton>
                </Box>

                {/* Instructions */}
                <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="caption">
                        💡 <strong>Hướng dẫn:</strong> Click vào ca để xem chi tiết, hoặc chọn ô tròn để xuất CSV nhiều ca
                    </Typography>
                </Alert>
                
                {/* Filter component */}
                <SaltMachineFilter 
                    shiftFilter={shiftFilter}
                    onShiftFilterChange={onShiftFilterChange}
                />
                
                {/* Stats and Selection Info */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="text.secondary">
                            📋 {filteredShifts.length} ca 
                        </Typography>
                        {selectedShiftData && (
                            <Chip 
                                label={`Đang xem: ${selectedShiftData.shiftId}`}
                                size='small'
                                color='primary'
                                onDelete={onClearSelectedShift}
                            />
                        )}
                        {selectedShifts.length > 0 && (
                            <Chip 
                                label={`${selectedShifts.length} ca đã chọn`}
                                size='smal'
                                color='secondar'
                                onDelete={() => onSelectAllShifts([])}
                                deleteIcon={<ClearIcon />}
                            />
                        )}
                    </Box>
                </Box>

                {filteredShifts.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={isAllSelected}
                                            indeterminate={isSomeSelected}
                                            onChange={handleSelectAll}
                                            size="small"
                                        />
                                    }
                                    label={
                                        <Typography variant="caption">
                                            Chọn tất cả ({filteredShifts.length})
                                        </Typography>
                                    }
                                />
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {selectedShifts.length > 0 ? (
                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<ExportIcon />}
                                        onClick={onExportSelectedShifts}
                                        disabled={isExporting}
                                        color="success"
                                    >
                                        Tải CSV
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<ExportIcon />}
                                        disabled
                                        sx={{ opacity: 0.6 }}
                                    >
                                        Chọn ca để xuất
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </Box>
                )}

                {/* Shifts List */}
                <Box sx={{ height: 400, overflowY: 'auto' }}>
                    {shiftsLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <CircularProgress size={24} />
                            <Typography sx={{ ml: 2 }} variant="body2" color="text.secondary">
                                Đang tải ca làm việc...
                            </Typography>
                        </Box>
                    ) : filteredShifts.length > 0 ? ( 
                        <List sx={{ p: 0 }}>
                            {filteredShifts.map((shift, index) => (
                                <ListItem 
                                    key={shift._id || index} 
                                    sx={{ 
                                        p: 0, 
                                        mb: 1,
                                        display: 'block' 
                                    }}
                                >
                                    <SaltMachineCard 
                                        shift={shift} 
                                        onClick={onShiftClick}
                                        isSelected={selectedShiftData?._id === shift._id}
                                        // Props cho multi-select
                                        isChecked={selectedShifts.some(s => s._id === shift._id)}
                                        onCheck={(checked) => onShiftSelect && onShiftSelect(shift, checked)}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            height: '100%', 
                            color: 'text.secondary',
                            py: 4
                        }}>
                            <ShiftIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 1 }}>
                                {shiftFilter === 'all' 
                                    ? 'Chưa có ca làm việc nào được ghi nhận'
                                    : `Không có ca làm việc nào ở trạng thái "${shiftFilter}"`
                                }
                            </Typography>
                            <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center' }}>
                                Dữ liệu ca làm việc sẽ xuất hiện khi máy bắt đầu hoạt động
                            </Typography>
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default SaltMachinePanel;