import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Toolbar, CssBaseline, ThemeProvider } from '@mui/material';

import { getTheme } from './theme'; // ✅ đã sửa trong theme.js
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import StatusPage from './pages/StatusPage';
import DevicePage from './pages/DevicePage';
import SettingPage from './pages/SettingPage';

const App = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mode, setMode] = useState('light'); // ✅ light / dark

    return (
        <ThemeProvider theme={getTheme(mode)}>
            <CssBaseline />
            <Box sx={{ display: 'flex' }}>
                <Sidebar open={sidebarOpen} />
                <Box component="main" sx={{ flexGrow: 1, minHeight: '100vh' }}>
                    <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
                    <Toolbar />

                    <Box sx={{ p: 3 }}>
                        <Routes>
                            <Route path="/status/" element={<StatusPage />} />
                            <Route path="/device/" element={<DevicePage />} />
                            <Route
                                path="/setting/"
                                element={<SettingPage mode={mode} setMode={setMode} />}
                            />
                        </Routes>
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default App;
