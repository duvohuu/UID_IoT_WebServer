import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

const SaltMachineFilter = ({ shiftFilter, onShiftFilterChange }) => {
    const statusOptions = [
        { value: 'all', label: 'Tất cả', color: 'default' },
        { value: 'complete', label: 'Hoàn thành', color: 'success' },
        { value: 'incomplete', label: 'Chưa hoàn chỉnh', color: 'warning' },
        { value: 'active', label: 'Đang hoạt động', color: 'info' },
        { value: 'paused', label: 'Tạm dừng', color: 'error' }
    ];

    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Lọc theo trạng thái:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {statusOptions.map((option) => (
                    <Chip
                        key={option.value}
                        label={option.label}
                        color={shiftFilter === option.value ? option.color : 'default'}
                        variant={shiftFilter === option.value ? 'filled' : 'outlined'}
                        onClick={() => onShiftFilterChange(option.value)}
                        size="small"
                        sx={{ cursor: 'pointer' }}
                    />
                ))}
            </Box>
        </Box>
    );
};

export default SaltMachineFilter;