import React from 'react';
import { Dialog, Box, Typography, TextField, Button } from '@mui/material';

const LoginDialog = ({ open, onClose, email, setEmail, password, setPassword, handleLogin }) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, width: 300 }}>
                <Typography variant="h6" fontWeight="bold">Đăng nhập</Typography>
                <TextField
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                />
                <TextField
                    label="Mật khẩu"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                />
                <Button variant="contained" onClick={handleLogin}>
                    Đăng nhập
                </Button>
            </Box>
        </Dialog>
    );
};

export default LoginDialog;