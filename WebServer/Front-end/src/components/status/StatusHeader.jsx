import React from "react";
import { Box, Typography, Alert, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
    Dashboard as DashboardIcon,
    Warning as WarningIcon,
    CheckCircle as SuccessIcon
} from '@mui/icons-material';

const StatusHeader = ({ isMobile, error }) => {
    const theme = useTheme();

    return (
        <Box sx={{ mb: 4 }}>
            {/* Main Header */}
            <Box 
                sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: 2,
                    mb: error ? 2 : 0
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 64,
                            height: 64,
                            borderRadius: 3,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            color: 'white',
                            boxShadow: `0 8px 32px ${theme.palette.primary.main}40`
                        }}
                    >
                        <DashboardIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Box>
                        <Typography 
                            variant={isMobile ? "h4" : "h3"} 
                            sx={{ 
                                fontWeight: 700,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            mb: 0.5
                            }}
                        >
                            Trang Thái Máy Móc
                        </Typography>
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                color: 'text.secondary', 
                                fontWeight: 500
                            }}
                        >
                            Giám sát thời gian thực các thiết bị sản xuất
                        </Typography>
                    </Box>
                </Box>

                {/* Status Indicators */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {!error ? (
                        <Chip
                            icon={<SuccessIcon sx={{ fontSize: 16 }} />}
                            label="System Online"
                            size="small"
                            color="success"
                            sx={{ 
                                borderRadius: 2,
                                fontWeight: 500
                            }}
                        />
                    ) : (
                        <Chip
                            icon={<WarningIcon sx={{ fontSize: 16 }} />}
                            label="Connection Issue"
                            size="small"
                            color="warning"
                            sx={{ 
                                borderRadius: 2,
                                fontWeight: 500
                            }}
                        />
                    )}
                </Box>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert 
                    severity="warning" 
                    sx={{ 
                        borderRadius: 2,
                        '& .MuiAlert-message': {
                            fontWeight: 500
                        }
                    }}
                >
                    {error}
                </Alert>
            )}
        </Box>
    );
};

export default StatusHeader;