import React, { useState, useEffect } from 'react'; 
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Toolbar, CssBaseline, ThemeProvider } from '@mui/material';
import { getTheme } from './theme';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import StatusPage from './pages/StatusPage';
import DevicePage from './pages/DevicePage';
import SettingPage from './pages/SettingPage';
import { SnackbarProvider } from './context/SnackbarContext';
import axios from 'axios'; 

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const App = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mode, setMode] = useState('light');
    const [user, setUser] = useState(() => {
        // Khôi phục user từ localStorage khi khởi động
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [openLogin, setOpenLogin] = useState(false);

    // Kiểm tra token hợp lệ khi ứng dụng khởi động
    useEffect(() => {
        const verifyToken = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/users/verify-token`, {
                    withCredentials: true, // Gửi cookie chứa authToken
                });
                if (!response.data.valid) {
                    // Token không hợp lệ, đăng xuất
                    setUser(null);
                    localStorage.removeItem('user');
                }
            } catch (error) {
                console.error("Lỗi khi kiểm tra token:", error);
                setUser(null);
                localStorage.removeItem('user');
            }
        };

        if (user) {
            verifyToken();
        }
    }, []);

    return (
        <ThemeProvider theme={getTheme(mode)}>
            <SnackbarProvider>
                <CssBaseline />
                <Box sx={{ display: 'flex' }}>
                    <Sidebar open={sidebarOpen} />
                    <Box component="main" sx={{ flexGrow: 1, minHeight: '100vh' }}>
                        <Header
                            onToggleSidebar={() => setSidebarOpen(prev => !prev)}
                            user={user}
                            setUser={setUser}
                            openLogin={openLogin}
                            setOpenLogin={setOpenLogin}
                        />
                        <Toolbar />
                        <Box sx={{ p: 3 }}>
                            <Routes>
                                <Route
                                    path="/status"
                                    element={user ? <StatusPage user={user} /> : <Navigate to="/" />}
                                />
                                <Route
                                    path="/device"
                                    element={user ? <DevicePage user={user} /> : <Navigate to="/" />}
                                />
                                <Route
                                    path="/setting"
                                    element={<SettingPage mode={mode} setMode={setMode} />}
                                />
                                <Route path="/" element={<Navigate to="/status" />} />
                                <Route path="*" element={<Navigate to="/status" />} />
                            </Routes>
                        </Box>
                    </Box>
                </Box>
            </SnackbarProvider>
        </ThemeProvider>
    );
};

export default App;