import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Grid, CircularProgress, Alert, Button, Typography, Box } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useMachine } from '../hooks/useMachine';
import { useWorkShifts } from '../hooks/useWorkShifts';
import { useCSVExport } from '../hooks/useCSVExport';
import { useSocket } from '../context/SocketContext';
import { useMachineSocketEvents } from '../hooks/useSocketEvents';
import MachineHeader from '../components/machine/MachineHeader';
import MachineBasicInfo from '../components/machine/MachineBasicInfo';
import PowderMachineDataDisplay from '../components/powderMachine/PowderMachineDataDisplay';
import PowderMachinePanel from '../components/powderMachine/PowderMachinePanel';

const PowderMachinePage = ({ user }) => {
    const { ip } = useParams();
    const navigate = useNavigate();
    const [selectedShifts, setSelectedShifts] = useState([]);
    const [machineRealtime, setMachineRealtime] = useState(null);
    const { exportMultipleShifts, isExporting } = useCSVExport();
    
    const {
        machine,
        loading: machineLoading,
        error: machineError
    } = useMachine(ip);

    const {
        workShifts,
        selectedShiftData,
        shiftsLoading,
        shiftFilter,
        setShiftFilter,
        filteredShifts,
        userHasSelectedShift,
        handleRefreshShifts,
        handleShiftClick,
        handleClearSelectedShift
    } = useWorkShifts(machine?.machineId, machine?.type);

    // Socket event callbacks
    const handleMachineUpdate = useCallback((update) => {
        console.log(`[${machine?.name}] Machine status updated:`, update);
        setMachineRealtime(prevMachine => ({
            ...prevMachine,
            ...update,
            lastUpdate: update.lastUpdate,
            lastHeartbeat: update.lastHeartbeat
        }));
    }, [machine]);

    const handleShiftChange = useCallback((data) => {
        console.log(`[${machine?.name}] Shift status changed:`, data);
        handleRefreshShifts();
    }, [machine, handleRefreshShifts]);

    const { isConnected } = useMachineSocketEvents(machine, {
        onMachineUpdate: handleMachineUpdate,
        onShiftChange: handleShiftChange
    });

    useEffect(() => {
        if (machine) {
            setMachineRealtime(machine);
        }
    }, [machine]);

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
            <MachineHeader machine={machineRealtime || machine} />
            
            <Box sx={{ mb: 2, textAlign: 'center' }}>
                <Typography 
                    variant="caption" 
                    sx={{ 
                        color: isConnected ? 'success.main' : 'warning.main',
                        fontWeight: 500
                    }}
                >
                </Typography>
            </Box>
            
            <Grid container spacing={3}>
                {/* Left Column */}
                <Grid size={{ xs: 3.8, md: 3.64 }}>
                    <MachineBasicInfo machine={machine} />
                    <PowderMachinePanel
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
                <Grid size={{ xs: 8.2, md: 8.36 }}>
                    <PowderMachineDataDisplay
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
                    Cập nhật lần cuối: {(machineRealtime || machine)?.lastUpdate ? 
                        new Date((machineRealtime || machine).lastUpdate).toLocaleString('vi-VN') : 'Chưa có dữ liệu'}
                </Typography>
            </Box>
        </Container>
    );
};

export default PowderMachinePage;