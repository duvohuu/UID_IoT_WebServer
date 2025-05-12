    import { Box, Typography, List, ListItem, ListItemText } from "@mui/material";
    import { useTheme } from "@mui/material/styles";
    import React, { useEffect, useState } from "react";
    import axios from "axios";
    import io from "socket.io-client";
    import { useNavigate } from "react-router-dom";
    import { useSnackbar } from '../context/SnackbarContext';

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

    const getToken = () => {
        return document.cookie.split("; ").find(row => row.startsWith("authToken="))?.split("=")[1] || null;
    };

    const socket = io(API_URL, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ["websocket", "polling"],
        auth: { token: getToken() }
    });

    const StatusPage = ({ user }) => {
        const theme = useTheme();
        const navigate = useNavigate();
        const [devices, setDevices] = useState([]);
        const [error, setError] = useState(null);
        const [loading, setLoading] = useState(true);
        const { showSnackbar } = useSnackbar();

        useEffect(() => {
            if (!user) {
                navigate("/login");
                return;
            }

            const fetchDevices = async () => {
                try {
                    console.log("Fetching devices from API:", `${API_URL}/api/devices`);
                    const response = await axios.get(`${API_URL}/api/devices`, {
                        withCredentials: true,
                    });
                    console.log("Devices fetched:", response.data);
                    setDevices(response.data);
                    setLoading(false);
                } catch (error) {
                    const errorMsg = error.response?.data?.message || error.message;
                    console.error("Lỗi khi lấy thiết bị:", errorMsg);
                    setError(`Lỗi khi lấy thiết bị: ${errorMsg}`);
                    showSnackbar(`Lỗi khi lấy thiết bị: ${errorMsg}`, "error");
                    setLoading(false);
                    if (errorMsg.includes("Chưa đăng nhập") || errorMsg.includes("Token không hợp lệ")) {
                        navigate("/login");
                    }
                }
            };
            fetchDevices();

            socket.on("connect", () => {
                console.log("Đã kết nối Socket.IO từ Frontend! ID:", socket.id);
            });
            socket.on("deviceUpdate", (updatedDevice) => {
                console.log("Nhận deviceUpdate:", updatedDevice);
                try {
                    if (!updatedDevice || !updatedDevice.name) {
                        console.warn("Dữ liệu deviceUpdate không hợp lệ:", updatedDevice);
                        return;
                    }
                    setDevices((prev) => {
                        const existingDevice = prev.find((device) => device.name === updatedDevice.name);
                        if (existingDevice) {
                            return prev.map((device) =>
                                device.name === updatedDevice.name ? updatedDevice : device
                            );
                        }
                        return [...prev, updatedDevice];
                    });
                } catch (error) {
                    console.error("Lỗi xử lý deviceUpdate:", error.message);
                    setError(`Lỗi xử lý deviceUpdate: ${error.message}`);
                    showSnackbar(`Lỗi xử lý deviceUpdate: ${error.message}`, "error");
                }
            });
            socket.on("connect_error", (err) => {
                console.error("Socket.IO lỗi kết nối:", err.message);
                setError(`Socket.IO lỗi kết nối: ${err.message}`);
                showSnackbar(`Socket.IO lỗi kết nối: ${err.message}`, "error");
                navigate("/login");
            });

            return () => {
                socket.off("deviceUpdate");
                socket.off("connect");
                socket.off("connect_error");
                socket.disconnect();
            };
        }, [user, navigate]);

        return (
            <Box sx={{ p: 3, minHeight: "100vh", bgcolor: "background.default" }}>
                <Typography variant="h4" sx={{ color: "text.primary", mb: 2 }}>
                    Device Status
                </Typography>
                {loading && (
                <Typography sx={{ color: "text.secondary" }}>
                    Đang tải thiết bị...
                </Typography>
                )}
                {error && (
                <Typography sx={{ color: "error.main" }}>
                    {error}
                </Typography>
                )}
                {devices.length === 0 && !loading ? (
                <Typography sx={{ color: "text.secondary" }}>
                    Không có thiết bị nào.
                </Typography>
                ) : (
                    <List sx={{ p: 0 }}>
                        {devices.map((device, index) => (
                            <ListItem
                                key={device.name || index}
                                sx={{
                                    my: 1,
                                    p: 1.5,
                                    bgcolor: "background.paper",
                                    borderRadius: "5px",
                                    color: "text.primary"
                                }}
                            >
                                <ListItemText
                                    primary={`${device.name} - Trạng thái: ${device.status} (Cập nhật: ${
                                        device.updatedAt ? new Date(device.updatedAt).toLocaleString() : "N/A"
                                    })`}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}  
            </Box>
        );
    };

    export default StatusPage;