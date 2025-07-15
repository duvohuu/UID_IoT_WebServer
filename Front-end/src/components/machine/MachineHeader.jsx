import React from 'react';
import { Box, Button, Typography, Chip } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const MachineHeader = ({ machine }) => {
    const navigate = useNavigate();

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate('/status')}
            >
                Quay lại
            </Button>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {machine.name}
            </Typography>
            <Chip 
                label={machine.isConnected ? 'Đang kết nối' : 'Mất kết nối'} 
                color={machine.isConnected ? 'success' : 'error'} 
            />
        </Box>
    );
};

export default MachineHeader;