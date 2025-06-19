import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const MachineBasicInfo = ({ machine }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Thông tin cơ bản
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography>
                        <strong>IP:</strong> {machine.ip}
                    </Typography>
                    <Typography>
                        <strong>Loại máy:</strong> {machine.type}
                    </Typography>
                    <Typography>
                        <strong>Vị trí:</strong> {machine.location}
                    </Typography>
                    <Typography>
                        <strong>Trạng thái:</strong> {machine.status}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default MachineBasicInfo;