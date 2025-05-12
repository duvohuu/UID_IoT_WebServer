import React, { useState } from "react";
import {
    Avatar,
    Menu,
    MenuItem,
    Divider,
    Box,
    Typography,
    useTheme,
} from "@mui/material";
import axios from "axios";
import ChangePasswordDialog from "./ChangePasswordDialog";
import { useSnackbar } from '../context/SnackbarContext'; // Thêm import useSnackbar

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AvatarMenu = ({ anchorEl, onClose, user, setUser, onLogout }) => {
    const theme = useTheme();
    const [openChangePassword, setOpenChangePassword] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const { showSnackbar } = useSnackbar(); // Sử dụng useSnackbar

    const handleAvatarChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append("avatar", file);
            try {
                const res = await axios.post(
                    `${import.meta.env.VITE_API_URL}/api/users/update-avatar`,
                    formData,
                    { withCredentials: true }
                );
                const updatedAvatar = res.data.avatar;
                setUser((prev) => ({ ...prev, avatar: updatedAvatar }));
                localStorage.setItem("user", JSON.stringify({ username: user.username, avatar: updatedAvatar }));
                showSnackbar("Cập nhật avatar thành công", "success"); // Thay alert bằng showSnackbar
                onClose();
            } catch (error) {
                console.error("Lỗi khi cập nhật avatar:", error);
                showSnackbar("Lỗi khi cập nhật avatar", "error"); // Thay alert bằng showSnackbar
            }
        }
    };

    const handleChangePassword = async () => {
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/users/change-password`,
                { oldPassword, newPassword },
                { withCredentials: true }
            );
            showSnackbar(res.data.message, "success"); // Thay alert bằng showSnackbar
            setOpenChangePassword(false);
            setOldPassword("");
            setNewPassword("");
        } catch (error) {
            console.error("Lỗi khi đổi mật khẩu:", error);
            showSnackbar(error.response?.data?.message || "Lỗi khi đổi mật khẩu", "error"); // Thay alert bằng showSnackbar
        }
    };

    const handleLogoutClick = () => {
        onLogout();
        onClose();
    };

    const avatarSrc = user.avatar ? `${API_URL}${user.avatar}` : undefined;
    console.log("Avatar URL in AvatarMenu:", avatarSrc);

    return (
        <>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={onClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                    sx: {
                        mt: 1,
                        width: 250,
                        bgcolor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
                    },
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", p: 2 }}>
                    <Avatar
                        src={avatarSrc}
                        alt={user.username}
                        sx={{ mr: 2, width: 48, height: 48 }}
                    />
                    <Typography variant="subtitle1" fontWeight="bold">
                        {user.username}
                    </Typography>
                </Box>
                <Divider />
                <MenuItem
                    component="label"
                    sx={{ py: 1.5, fontSize: "0.9rem" }}
                >
                    Cập nhật avatar
                    <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleAvatarChange}
                    />
                </MenuItem>
                <MenuItem
                    onClick={() => setOpenChangePassword(true)}
                    sx={{ py: 1.5, fontSize: "0.9rem" }}
                >
                    Đổi mật khẩu
                </MenuItem>
                <MenuItem
                    onClick={handleLogoutClick}
                    sx={{ py: 1.5, fontSize: "0.9rem" }}
                >
                    Đăng xuất
                </MenuItem>
            </Menu>
            <ChangePasswordDialog
                open={openChangePassword}
                onClose={() => {
                    setOpenChangePassword(false);
                    setOldPassword("");
                    setNewPassword("");
                }}
                oldPassword={oldPassword}
                setOldPassword={setOldPassword}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                handleChangePassword={handleChangePassword}
            />
        </>
    );
};

export default AvatarMenu;