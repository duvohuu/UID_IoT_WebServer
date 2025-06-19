import React, { useState, useEffect } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client'; 
import StatusHeader from '../components/status/StatusHeader';
import StatusStatsCards from '../components/status/StatusStatsCards';
import StatusMachinesGrid from '../components/status/StatusMachinesGrid';
import { getMachines } from '../api/machineAPI';
import { useSnackbar } from '../context/SnackbarContext';

const StatusPage = ({ user }) => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!user) {
            setMachines([]);
            setLoading(false);
            setError("Vui lòng đăng nhập để xem danh sách máy");
            return;
        }

        const getSocketUrl = () => {
            if (import.meta.env.VITE_API_URL) {
                return import.meta.env.VITE_API_URL;
            }
            return `${window.location.protocol}//${window.location.hostname}:5000`;
        };

        const newSocket = io(getSocketUrl(), {
            withCredentials: true,
            transports: ["websocket", "polling"]
        });
    
        
        console.log('🔌 Connecting to mainServer for real-time updates...');
        
        newSocket.on("connect", () => {
            console.log("✅ Connected to mainServer for real-time updates");
        });
        
        newSocket.on("disconnect", () => {
            console.log("❌ Disconnected from mainServer");
        });
        
        newSocket.on("shiftStatusChanged", (shiftUpdate) => {
            console.log('📡 Shift status changed:', shiftUpdate);
            showSnackbar(
                `Ca ${shiftUpdate.shiftId}: ${shiftUpdate.status}`, 
                shiftUpdate.status === 'completed' ? 'success' : 'warning'
            );
        });
        setSocket(newSocket);

        const fetchMachines = async () => {
            try {
                setLoading(true);
                console.log("🔄 Fetching machines from mainServer...");
                
                const result = await getMachines();
                if (result.success && result.data && result.data.length > 0) {
                    console.log("✅ Machines loaded from API:", result.data.length);
                    
                    const sortedMachines = result.data.sort((a, b) => {
                        // Extract số từ machineId (VD: MACHINE_001 -> 1, MACHINE_002 -> 2)
                        const getNumFromMachineId = (machineId) => {
                            const match = machineId.match(/\d+/);
                            return match ? parseInt(match[0]) : 0;
                        };
                        
                        return getNumFromMachineId(a.machineId) - getNumFromMachineId(b.machineId);
                    });
                    
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
        };

        fetchMachines();

        newSocket.on("machineStatusUpdate", (update) => {
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
        });

        newSocket.on("newMachineAdded", (newMachine) => {
            console.log('📡 New machine added:', newMachine);
            setMachines((prevMachines) => {
                const updatedMachines = [...prevMachines, newMachine];
                return updatedMachines.sort((a, b) => {
                    const getNumFromMachineId = (machineId) => {
                        const match = machineId.match(/\d+/);
                        return match ? parseInt(match[0]) : 0;
                    };
                    return getNumFromMachineId(a.machineId) - getNumFromMachineId(b.machineId);
                });
            });
            showSnackbar(`Máy mới được thêm: ${newMachine.name}`, 'info');
        });

        newSocket.on("machineDeleted", (deletedMachine) => {
            console.log('📡 Machine deleted:', deletedMachine);
            setMachines((prevMachines) => 
                prevMachines.filter(m => m._id !== deletedMachine._id)
            );
            showSnackbar(`Máy đã bị xóa: ${deletedMachine.machineId || deletedMachine.name}`, 'warning');
        });

        return () => {
            if (newSocket) {
                console.log("🔌 Disconnecting from mainServer...");
                newSocket.disconnect();
            }
        };
    }, [user, showSnackbar]);

    const handleMachineClick = (machine) => {
        console.log("Điều hướng đến chi tiết máy:", machine.name);
        navigate(`/machine/${machine.ip}`);
    };

    const handleMachineDelete = async (deletedMachine) => {
        try {
            const result = await getMachines();
            if (result.success && result.data) {
                // ✅ SORT LẠI SAU KHI XÓA
                const sortedMachines = result.data.sort((a, b) => {
                    const getNumFromMachineId = (machineId) => {
                        const match = machineId.match(/\d+/);
                        return match ? parseInt(match[0]) : 0;
                    };
                    return getNumFromMachineId(a.machineId) - getNumFromMachineId(b.machineId);
                });
                
                setMachines(sortedMachines);
                console.log("✅ Machine list refreshed and sorted after deletion");
            }
        } catch (error) {
            console.error("Error refreshing machines after delete:", error);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <StatusHeader error={error} user={user} />
            <StatusStatsCards 
                machines={machines} 
                loading={loading} 
                user={user} 
            />
            <StatusMachinesGrid 
                machines={machines} 
                loading={loading} 
                user={user} 
                onMachineClick={handleMachineClick}
                onMachineDelete={handleMachineDelete} 
            />
        </Container>
    );
};

export default StatusPage;