import React, { createContext, useContext, useState } from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';

const SnackbarContext = createContext();

export const SnackbarProvider = ({ children }) => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('success');

    const showSnackbar = (msg, sev = 'success') => {
        setMessage(msg);
        setSeverity(sev);
        setOpen(true);
    };

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    return (
        <SnackbarContext.Provider value={{ showSnackbar }}>
            {children}
            <Snackbar
                open={open}
                autoHideDuration={3000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                TransitionComponent={Slide} // Thêm hiệu ứng slide
                transitionDuration={500} // Thời gian hiệu ứng
            >
                <Alert
                    onClose={handleClose}
                    severity={severity}
                    sx={{
                        width: '100%',
                        bgcolor: severity === 'success' ? '#4caf50' : '#f44336', // Tùy chỉnh màu nền
                        color: '#fff', // Màu chữ trắng
                        '& .MuiAlert-icon': {
                            color: '#fff', // Màu icon trắng
                        },
                        borderRadius: '8px', // Bo góc
                        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)', // Thêm bóng
                    }}
                >
                    {message}
                </Alert>
            </Snackbar>
        </SnackbarContext.Provider>
    );
};

export const useSnackbar = () => {
    const context = useContext(SnackbarContext);
    if (!context) {
        throw new Error('useSnackbar must be used within a SnackbarProvider');
    }
    return context;
};