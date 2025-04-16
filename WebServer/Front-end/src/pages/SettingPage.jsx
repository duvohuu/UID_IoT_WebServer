import React from 'react';
import { Typography, Switch, FormControlLabel } from '@mui/material';

const SettingPage = ({ mode, setMode }) => {
    const handleToggle = () => {
        setMode(mode === 'light' ? 'dark' : 'light');
    };

    return (
        <div>
            <Typography variant="h4" gutterBottom>
                Settings
            </Typography>

            <FormControlLabel
                control={<Switch checked={mode === 'dark'} onChange={handleToggle} />}
                label={mode === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
            />
        </div>
    );
};

export default SettingPage;
