import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Replace with your exact Node.js backend port if different than 3000
        const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://ai-customer-support-saas-backend.onrender.com';
        const socketInstance = io(SOCKET_URL, {
            autoConnect: true,
            transports: ['websocket'] // Explicitly enforce high-performance WebSocket streams
        });

        socketInstance.on('connect', () => {
            console.log(`🔌 Connected to backend real-time engine: ${socketInstance.id}`);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log("❌ Socket link dropped from backend infrastructure.");
            setIsConnected(false);
        });

        setSocket(socketInstance);

        // Cleanup listener on unmount to prevent memory leaks
        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

// Custom hook for rapid clean consumption across dashboard sub-components
export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocket must be executed within an active SocketProvider layout.");
    }
    return context;
};