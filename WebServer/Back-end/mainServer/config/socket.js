import { createRequire } from "module";
import axios from "axios";

const require = createRequire(import.meta.url);
const socketIo = require("socket.io");

export const initializeSocket = (server, allowedOrigins) => {
    const io = socketIo(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST", "DELETE", "OPTIONS"], 
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    io.on("connection", (socket) => {    
        socket.on("message", (msg) => {
            console.log("Received message:", msg);
        });
        
        socket.on("Value", (data) => {
            console.log("Received value:", data);
        });
        
        socket.on("disconnect", (reason) => {
            console.log("Frontend client disconnected:", socket.id, "Reason:", reason);
        });
    });

    return io;
};
