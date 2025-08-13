import React, { useState, useEffect } from 'react'; 
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Toolbar, CssBaseline, ThemeProvider } from '@mui/material';
import { getTheme } from './theme';
import Header from './components/header/Header';
import Sidebar from './components/layout/Sidebar';
import StatusPage from './pages/StatusPage';
import SettingPage from './pages/SettingPage';
import SaltMachinePage from './pages/SaltMachinePage';
import PowderMachinePage from './pages/PowderMachinePage';
import { SnackbarProvider } from './context/SnackbarContext';
import { SocketProvider } from './context/SocketContext';
import axios from 'axios'; 

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const App = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mode, setMode] = useState(() => {
        return localStorage.getItem('themeMode') || 'light';
    });
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        localStorage.setItem('themeMode', mode);
    }, [mode]);

    useEffect(() => {
        const verifyToken = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_URL}/api/users/verify-token`, {
                    withCredentials: true,
                });
                if (response.data.valid && response.data.user) {
                    const userData = {
                        username: response.data.user.username,
                        email: response.data.user.email,
                        role: response.data.user.role,
                        avatar: response.data.user.avatar
                    };
                    setUser(userData);
                    localStorage.setItem('user', JSON.stringify(userData));
                } else {
                    setUser(null);
                    localStorage.removeItem('user');
                }
            } catch (error) {
                console.error("Lỗi khi kiểm tra token:", error);
                setUser(null);
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, []);

    // Hàm toggle sidebar
    const handleToggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Loading screen
    if (loading) {
        return (
            <ThemeProvider theme={getTheme(mode)}>
                <CssBaseline />
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100vh' 
                }}>
                    <div>Đang tải...</div>
                </Box>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={getTheme(mode)}>
            <SocketProvider user={user}>
                <SnackbarProvider>
                    <CssBaseline />
                    <Box sx={{ display: 'flex' }}>
                        <Sidebar open={sidebarOpen} />
                        <Header 
                            onToggleSidebar={handleToggleSidebar}  
                            user={user}
                            setUser={setUser}
                        />
                        <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
                            <Toolbar />
                            <Routes>
                                <Route path="/" element={<Navigate to="/status" replace />} />
                                <Route path="/status" element={<StatusPage user={user} />} />
                                <Route path="/setting" element={<SettingPage user={user} mode={mode} setMode={setMode} />} />
                                <Route path="/salt/:ip" element={<SaltMachinePage user={user} />} />
                                <Route path="/powder/:ip" element={<PowderMachinePage user={user} />} />
                            </Routes>
                        </Box>
                    </Box>
                </SnackbarProvider>
            </SocketProvider>
        </ThemeProvider>
    );
};

export default App;