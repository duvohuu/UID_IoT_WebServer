import React from "react";
import { Dialog, Box, Typography, TextField, Button } from "@mui/material";

const ChangePasswordDialog = ({
    open,
    onClose,
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    handleChangePassword,
}) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2, width: 300 }}>
                <Typography variant="h6" fontWeight="bold">Đổi mật khẩu</Typography>
                <TextField
                    label="Mật khẩu cũ"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    fullWidth
                />
                <TextField
                    label="Mật khẩu mới"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    fullWidth
                />
                <Button variant="contained" onClick={handleChangePassword}>
                    Xác nhận
                </Button>
            </Box>
        </Dialog>
    );
};

export default ChangePasswordDialog;