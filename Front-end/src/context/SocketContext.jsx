import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children, user }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

    useEffect(() => {
        if (user) {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('authToken='))
                ?.split('=')[1];

            console.log('🔌 Creating global socket connection...');
            const newSocket = io(API_URL, {
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                transports: ["websocket", "polling"],
                auth: { token },
                withCredentials: true
            });

            // Connection events
            newSocket.on('connect', () => {
                console.log('✅ Global socket connected:', newSocket.id);
                setIsConnected(true);
                setError(null);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('❌ Global socket disconnected:', reason);
                setIsConnected(false);
            });

            newSocket.on('connect_error', (err) => {
                console.error('🔌 Global socket connection error:', err);
                setError(err.message);
                setIsConnected(false);
            });

            newSocket.on('reconnect', () => {
                console.log('🔄 Global socket reconnected');
                setIsConnected(true);
                setError(null);
            });

            setSocket(newSocket);

            return () => {
                console.log('🔌 Cleaning up global socket connection...');
                newSocket.disconnect();
                setSocket(null);
                setIsConnected(false);
            };
        } else {
            // User logged out, cleanup
            if (socket) {
                console.log('🔌 User logged out, cleaning up socket...');
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
                setError(null);
            }
        }
    }, [user, API_URL]);

    const socketUtils = {
        socket,
        isConnected,
        error,
        
        // Helper để emit events
        emit: useCallback((event, data) => {
            if (socket && isConnected) {
                socket.emit(event, data);
                return true;
            }
            console.warn('Socket not connected, cannot emit:', event);
            return false;
        }, [socket, isConnected])
    };

    return (
        <SocketContext.Provider value={socketUtils}>
            {children}
        </SocketContext.Provider>
    );
};