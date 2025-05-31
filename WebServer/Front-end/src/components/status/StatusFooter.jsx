import { Box, Typography } from "@mui/material";
import { Refresh as RefreshIcon } from '@mui/icons-material';

export const StatusFooter = () => {
    return (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography 
                variant="body2" 
                sx={{ 
                    color: 'text.secondary',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                }}
            >
                <RefreshIcon sx={{ fontSize: 16 }} />
                Dữ liệu được cập nhật theo thời gian thực qua HMI
            </Typography>
        </Box>
    );
};

export default StatusFooter;