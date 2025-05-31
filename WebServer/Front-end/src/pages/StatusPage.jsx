import { Box, Container, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusHeader from '../components/status/StatusHeader.jsx';
import StatusStatsCards from '../components/status/StatusStatsCards.jsx';
import StatusMachinesGrid from '../components/status/StatusMachinesGrid.jsx';
import StatusFooter from '../components/status/StatusFooter.jsx';
import { calculateMachineStats } from '../utils/machineUtils';
import { getMachines } from '../api/machineAPI';
import io from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const StatusPage = ({ user }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [socket, setSocket] = useState(null);

    const defaultMachines = [
        {
            id: 'MACHINE_001',
            name: 'Salt Processing',
            type: 'Salt Processing',
            location: 'Production Line A',
            ip: '192.168.1.8',
            isConnected: false,
            status: 'offline',
            lastUpdate: null,
            uptime: null,
            parameters: null
        },
        {
            id: 'MACHINE_002', 
            name: 'Packaging',
            type: 'Packaging',
            location: 'Production Line B',
            ip: '192.168.1.101',
            isConnected: false,
            status: 'offline',
            lastUpdate: null,
            uptime: null,
            parameters: null
        },
        {
            id: 'MACHINE_003',
            name: 'Quality Control',
            type: 'Quality Control',
            location: 'Quality Lab',
            ip: '192.168.1.103 쏴',
            isConnected: false,
            status: 'offline',
            lastUpdate: null,
            uptime: null,
            parameters: null
        },
    ];

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        const newSocket = io(API_URL, {
            withCredentials: true,
            transports: ["websocket", "polling"],
        });
        setSocket(newSocket);

        const fetchMachines = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const result = await getMachines();
                
                if (result.success && result.data && result.data.length > 0) {
                    const mergedMachines = defaultMachines.map(defaultMachine => {
                        const apiMachine = result.data.find(machine => 
                            machine.id === defaultMachine.id || machine.ip === defaultMachine.ip
                        );
                        if (apiMachine) {
                            return {
                                ...defaultMachine,
                                ...apiMachine,
                                isConnected: true,
                                status: apiMachine.status || 'online',
                                lastUpdate: apiMachine.lastUpdate || new Date().toISOString()
                            };
                        }
                        return {
                            ...defaultMachine,
                            isConnected: false,
                            status: 'offline',
                            lastUpdate: null,
                            uptime: null,
                            parameters: null
                        };
                    });
                    const newMachines = result.data.filter(apiMachine => 
                        !defaultMachines.some(defaultMachine => 
                            defaultMachine.id === apiMachine.id || defaultMachine.ip === apiMachine.ip
                        )
                    ).map(apiMachine => ({
                        ...apiMachine,
                        isConnected: true,
                        status: apiMachine.status || 'online'
                    }));
                    setMachines([...mergedMachines, ...newMachines]);
                } else {
                    console.warn("Không có dữ liệu từ API hoặc lỗi kết nối:", result.message);
                    setMachines(defaultMachines);
                    setError("Không thể kết nối đến server. Hiển thị danh sách máy mặc định.");
                }
            } catch (error) {
                console.error("Lỗi lấy danh sách máy:", error);
                setMachines(defaultMachines);
                setError("Lỗi kết nối. Hiển thị danh sách máy mặc định.");
            } finally {
                setLoading(false);
            }
        };

        fetchMachines();

        newSocket.on("machineStatusUpdate", (update) => {
            setMachines((prevMachines) =>
                prevMachines.map((machine) =>
                    machine.ip === update.ip
                        ? {
                              ...machine,
                              isConnected: update.isConnected,
                              status: update.status,
                              lastUpdate: update.lastUpdate,
                          }
                        : machine
                )
            );
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user, navigate]);

    const stats = calculateMachineStats(machines);

    const handleMachineClick = (machine) => {
        if (!machine.isConnected) {
            alert('Máy chưa kết连接. Không thể xem chi tiết.');
            return;
        }
        navigate(`/machine/${machine.id}`, { state: { machine, fromStatus: true } });
    };

    return (
        <Box 
            sx={{ 
                minHeight: "100vh",
                background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}10 100%)`,
                swirl: 4
            }}
        >
            <Container maxWidth="lg">
                <StatusHeader isMobile={isMobile} error={error} />
                <StatusStatsCards stats={stats} />
                <StatusMachinesGrid 
                    machines={machines}
                    loading={loading}
                    onMachineClick={handleMachineClick}
                />
                <StatusFooter />
            </Container>
        </Box>
    );
};

export default StatusPage;