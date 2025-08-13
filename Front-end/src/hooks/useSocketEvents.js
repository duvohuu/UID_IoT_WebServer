import { useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

// Hook cho machine status updates
export const useMachineStatusUpdates = (machine, onUpdate) => {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket || !machine || !onUpdate) return;

        const handleMachineStatusUpdate = (update) => {
            if (update.ip === machine.ip || update.machineId === machine.machineId) {
                console.log(`[${machine.name}] Machine status updated:`, update);
                onUpdate(update);
            }
        };

        socket.on('machineStatusUpdate', handleMachineStatusUpdate);
        return () => socket.off('machineStatusUpdate', handleMachineStatusUpdate);
    }, [socket, machine, onUpdate]);
};

// Hook cho shift status changes
export const useShiftStatusUpdates = (machine, onShiftChange) => {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket || !machine || !onShiftChange) return;

        const handleShiftStatusChanged = (data) => {
            if (data.machineId === machine.machineId) {
                console.log(`[${machine.name}] Shift status changed:`, data);
                onShiftChange(data);
            }
        };

        socket.on('shiftStatusChanged', handleShiftStatusChanged);
        return () => socket.off('shiftStatusChanged', handleShiftStatusChanged);
    }, [socket, machine, onShiftChange]);
};

// Hook cho notifications
export const useNotificationUpdates = (onNewNotification) => {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket || !onNewNotification) return;

        const handleNewNotification = (notification) => {
            console.log('🔔 Received new notification:', notification);
            onNewNotification(notification);
        };

        const handleNotificationUpdate = (updatedNotification) => {
            console.log('📝 Notification updated:', updatedNotification);
            // Có thể thêm logic update notification
        };

        const handleNotificationDeleted = (notificationId) => {
            console.log('🗑️ Notification deleted:', notificationId);
            // Có thể thêm logic xóa notification
        };

        socket.on('newNotification', handleNewNotification);
        socket.on('notificationUpdated', handleNotificationUpdate);
        socket.on('notificationDeleted', handleNotificationDeleted);

        return () => {
            socket.off('newNotification', handleNewNotification);
            socket.off('notificationUpdated', handleNotificationUpdate);
            socket.off('notificationDeleted', handleNotificationDeleted);
        };
    }, [socket, onNewNotification]);
};

// Hook tổng hợp cho machine pages
export const useMachineSocketEvents = (machine, callbacks) => {
    const { socket, isConnected } = useSocket();
    const { onMachineUpdate, onShiftChange } = callbacks;

    const handleMachineUpdate = useCallback((update) => {
        if (machine && (update.ip === machine.ip || update.machineId === machine.machineId)) {
            onMachineUpdate?.(update);
        }
    }, [machine, onMachineUpdate]);

    const handleShiftChange = useCallback((data) => {
        if (machine && data.machineId === machine.machineId) {
            onShiftChange?.(data);
        }
    }, [machine, onShiftChange]);

    useEffect(() => {
        if (!socket || !machine) return;

        console.log(`🔌 [${machine.name}] Setting up socket listeners...`);

        socket.on('machineStatusUpdate', handleMachineUpdate);
        socket.on('shiftStatusChanged', handleShiftChange);

        return () => {
            socket.off('machineStatusUpdate', handleMachineUpdate);
            socket.off('shiftStatusChanged', handleShiftChange);
            console.log(`🔌 [${machine.name}] Socket listeners cleaned up`);
        };
    }, [socket, machine, handleMachineUpdate, handleShiftChange]);

    return { isConnected };
};

// Hook cho StatusPage - listen tất cả machine updates
export const useAllMachinesStatusUpdates = (onMachineUpdate) => {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket || !onMachineUpdate) return;

        const handleMachineStatusUpdate = (update) => {
            console.log('📡 Machine status update from mainServer:', update);
            onMachineUpdate(update);
        };

        socket.on('machineStatusUpdate', handleMachineStatusUpdate);
        return () => socket.off('machineStatusUpdate', handleMachineStatusUpdate);
    }, [socket, onMachineUpdate]);
};