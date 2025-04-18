import React from 'react';
import { Typography, Switch, FormControlLabel } from '@mui/material';

const SettingPage = ({ mode, setMode }) => {
    const handleToggle = () => {
        setMode(mode === 'light' ? 'dark' : 'light');
    };

    return (
        <div>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Settings
            </Typography>

            <FormControlLabel
                control={<Switch checked={mode === 'dark'} onChange={handleToggle} />}
                label={mode === 'dark' ? 'LighMode' : 'DarkMode'}
            />
        </div>
    );
};

export default SettingPage;
