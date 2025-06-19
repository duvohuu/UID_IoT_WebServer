import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Grid, CircularProgress, Alert, Button, Typography, Box } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useMachineDetail } from '../hooks/useMachineDetail';
import { useWorkShifts } from '../hooks/useWorkShifts';
import { useCSVExport } from '../hooks/useCSVExport';
import MachineHeader from '../components/machine/MachineHeader';
import MachineBasicInfo from '../components/machine/MachineBasicInfo';
import MachineDataDisplay from '../components/machine/MachineDataDisplay';
import WorkShiftPanel from '../components/workshift/WorkShiftPanel';

const MachineDetailPage = ({ user }) => {
    const { ip } = useParams();
    const navigate = useNavigate();
    
    // Multi-select state
    const [selectedShifts, setSelectedShifts] = useState([]);
    
    const {
        machine,
        loading: machineLoading,
        error: machineError
    } = useMachineDetail(ip);

    const {
        workShifts,
        selectedShiftData,
        setSelectedShiftData,
        shiftsLoading,
        shiftFilter,
        setShiftFilter,
        filteredShifts,
        userHasSelectedShift,
        setUserHasSelectedShift,
        handleRefreshShifts,
        handleShiftClick,
        handleClearSelectedShift
    } = useWorkShifts(machine?.machineId);

    const { exportMultipleShifts, isExporting } = useCSVExport();

    // Multi-select handlers
    const handleShiftSelect = (shift, checked) => {
        console.log('🔄 Shift select:', shift.shiftId, checked);
        if (checked) {
            setSelectedShifts(prev => [...prev, shift]);
        } else {
            setSelectedShifts(prev => prev.filter(s => s._id !== shift._id));
        }
    };

    const handleSelectAllShifts = (shifts) => {
        console.log('🔄 Select all shifts:', shifts.length);
        setSelectedShifts(shifts);
    };

    const handleExportSelectedShifts = async () => {
        if (selectedShifts.length === 0) {
            alert('Vui lòng chọn ít nhất một ca để xuất!');
            return;
        }
        
        console.log('📤 Exporting shifts:', selectedShifts.map(s => s.shiftId));
        await exportMultipleShifts(selectedShifts, user, machine);
        setSelectedShifts([]);
    };

    // Debug effect
    useEffect(() => {
        console.log('🔍 Selected shifts updated:', selectedShifts.length);
    }, [selectedShifts]);

    if (machineLoading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Đang tải thông tin máy...</Typography>
            </Container>
        );
    }

    if (machineError || !machine) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {machineError || 'Không tìm thấy thông tin máy'}
                </Alert>
                <Button 
                    variant="contained" 
                    startIcon={<ArrowBack />} 
                    onClick={() => navigate('/status')}
                >
                    Quay lại
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <MachineHeader machine={machine} />
            
            <Grid container spacing={3}>
                {/* Left Column */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <MachineBasicInfo machine={machine} />
                    <WorkShiftPanel
                        machine={machine}
                        workShifts={workShifts}
                        selectedShiftData={selectedShiftData}
                        shiftsLoading={shiftsLoading}
                        shiftFilter={shiftFilter}
                        filteredShifts={filteredShifts}
                        onShiftClick={handleShiftClick}
                        onRefreshShifts={handleRefreshShifts}
                        onShiftFilterChange={setShiftFilter}
                        onClearSelectedShift={handleClearSelectedShift}
                        userHasSelectedShift={userHasSelectedShift}
                        selectedShifts={selectedShifts}
                        onShiftSelect={handleShiftSelect}
                        onSelectAllShifts={handleSelectAllShifts}
                        onExportSelectedShifts={handleExportSelectedShifts}
                        isExporting={isExporting}
                    />
                </Grid>
                
                {/* Right Column */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <MachineDataDisplay
                        machine={machine}
                        selectedShiftData={selectedShiftData}
                        user={user}
                        workShifts={workShifts}
                        shiftsLoading={shiftsLoading}
                        onClearSelectedShift={handleClearSelectedShift}
                    />
                </Grid>
            </Grid>

            {/* Last Update Info */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                    Cập nhật lần cuối: {machine.lastUpdate ? new Date(machine.lastUpdate).toLocaleString('vi-VN') : 'Chưa có dữ liệu'}
                </Typography>
            </Box>
        </Container>
    );
};

export default MachineDetailPage;