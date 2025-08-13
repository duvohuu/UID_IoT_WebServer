import React, { useState, useEffect, useCallback } from 'react';
import { 
    Box, 
    Container, 
    useMediaQuery,
    Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

// Import components
import StatusHeader from '../components/status/StatusHeader';
import StatusStatsCards from '../components/status/StatusStatsCards';
import StatusMachinesGrid from '../components/status/StatusMachinesGrid';

// Import API and hooks
import { getMachines } from '../api/machineAPI';
import { useSnackbar } from '../context/SnackbarContext';
import { useSocket } from '../context/SocketContext';
import { useAllMachinesStatusUpdates } from '../hooks/useSocketEvents';

const StatusPage = ({ user }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const { isConnected } = useSocket(); 
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    // State management
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper function - Sort machines by ID
    const sortMachinesByMachineId = (machines) => {
        return machines.sort((a, b) => {
            const getNumFromMachineId = (machineId) => {
                const match = machineId.match(/\d+/);
                return match ? parseInt(match[0]) : 0;
            };
            return getNumFromMachineId(a.machineId) - getNumFromMachineId(b.machineId);
        });
    };

    // Fetch machines data
    const fetchMachines = useCallback(async () => {
        if (!user) {
            setMachines([]);
            setLoading(false);
            setError("Vui lòng đăng nhập để xem danh sách máy");
            return;
        }

        try {
            setLoading(true);
            console.log("🔄 Fetching machines from mainServer...");
            
            const result = await getMachines();
            if (result.success && result.data && result.data.length > 0) {
                console.log("Machines loaded from API:", result.data.length);
                
                const sortedMachines = sortMachinesByMachineId(result.data);
                setMachines(sortedMachines);
                setError(null);
            } else {
                console.warn("Không có dữ liệu từ API");
                setMachines([]);
                setError(user.role === 'admin' 
                    ? "Chưa có máy nào trong hệ thống" 
                    : "Bạn chưa có máy nào - Liên hệ admin để được cấp máy"
                );
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách máy:", error);
            setMachines([]);
            setError("Lỗi kết nối API - Kiểm tra kết nối server");
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Handle machine status updates from socket
    const handleMachineStatusUpdate = useCallback((update) => {
        console.log('📡 Machine status update from mainServer:', update);
        
        setMachines((prevMachines) =>
            prevMachines.map((machine) =>
                machine.ip === update.ip || machine.id === update.id
                    ? {
                        ...machine,
                        ...update,
                        lastUpdate: update.lastUpdate,
                        lastHeartbeat: update.lastHeartbeat
                    }
                    : machine
            )
        );
    }, []);

    // Use custom hook for socket events
    useAllMachinesStatusUpdates(handleMachineStatusUpdate);

    // Initial fetch when user logs in
    useEffect(() => {
        fetchMachines();
    }, [fetchMachines]);

    // Event handlers
    const handleMachineClick = (machine) => {
        console.log("Điều hướng đến chi tiết máy:", machine.name);
        if (machine.type === 'Powder Filling Machine') {
            navigate(`/powder/${machine.ip}`);
        } else {
            navigate(`/salt/${machine.ip}`);
        }
    };

    const handleMachineDelete = async (deletedMachine) => {
        try {
            const result = await getMachines();
            if (result.success && result.data) {
                const sortedMachines = sortMachinesByMachineId(result.data);
                setMachines(sortedMachines);
                console.log("✅ Machine list refreshed and sorted after deletion");
            }
        } catch (error) {
            console.error("Error refreshing machines after delete:", error);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, ${theme.palette.primary.dark}15 0%, ${theme.palette.secondary.dark}10 100%)`
                    : `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}10 100%)`,
                py: 4
            }}
        >
            <Container maxWidth="xl">
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

                {/* Header Section */}
                <StatusHeader 
                    isMobile={isMobile}
                    error={error} 
                    user={user} 
                />
                
                {/* Stats Cards Section */}
                <StatusStatsCards 
                    machines={machines} 
                    loading={loading} 
                    user={user} 
                />
                
                {/* Machines Grid Section */}
                <StatusMachinesGrid 
                    machines={machines} 
                    loading={loading} 
                    user={user} 
                    onMachineClick={handleMachineClick}
                    onMachineDelete={handleMachineDelete} 
                />
            </Container>
        </Box>
    );
};

export default StatusPage;