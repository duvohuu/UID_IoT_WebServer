import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/usersRoutes.js";
import machineRoutes from "./routes/machineRoutes.js";
import workShiftRoutes from "./routes/workShiftRoutes.js";
import { createRequire } from "module";
import http from "http";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios"; 
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const socketIo = require("socket.io");

dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
const server = http.createServer(app);
const DB_SERVER_URL = process.env.DB_SERVER_URL || "http://localhost:5001";

const getAllLocalIPs = () => {
    const interfaces = os.networkInterfaces();
    const ips = ['localhost', '127.0.0.1'];
    
    Object.keys(interfaces).forEach(interfaceName => {
        interfaces[interfaceName].forEach(iface => {
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push(iface.address);
            }
        });
    });
    
    return ips;
};


const generateAllowedOrigins = () => {
    const ips = getAllLocalIPs();
    const ports = [5173]; 
    const origins = [];
    
    ips.forEach(ip => {
        ports.forEach(port => {
            origins.push(`http://${ip}:${port}`);
        });
    });
    
    console.log('🌐 Allowed origins:', origins);
    return origins;
};

const allowedOrigins = generateAllowedOrigins();

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Cookie");
        res.setHeader("Access-Control-Expose-Headers", "Set-Cookie");
    }
    
    if (req.method === 'OPTIONS') {
        console.log(`🔍 OPTIONS request for: ${req.url}`);
        res.status(200).end();
        return;
    }
    
    next();
});


const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "DELETE", "OPTIONS"], 
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

app.set('io', io);

// =================================================================
// EXPRESS ROUTES & SOCKET.IO
// =================================================================

app.use("/avatars", express.static(path.join(__dirname, "upload/avatars")));
app.use(cookieParser());
app.use(express.json());

app.use((req, res, next) => {
    next();
});
app.use("/api/work-shifts", workShiftRoutes)
app.use("/api/users", userRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/work-shifts", workShiftRoutes);

app.post("/api/internal/machine-update", (req, res) => {
    const machineUpdate = req.body;
    io.emit("machineStatusUpdate", machineUpdate);
    res.json({ success: true, message: "Machine update broadcasted" });
});

app.post("/api/internal/shift-completed", (req, res) => {
    const shiftData = req.body;
    io.emit("workShiftCompleted", shiftData);
    res.json({ success: true, message: "Shift completion broadcasted" });
});

app.post("/api/internal/shift-started", (req, res) => {
    const shiftData = req.body;
    
    // Broadcast to Frontend via Socket.IO
    io.emit("workShiftUpdate", {
        type: 'shift_started',
        shift: shiftData,
        timestamp: new Date()
    });
    
    res.json({ success: true, message: "Shift start broadcasted" });
});

app.post("/api/internal/shift-status-changed", (req, res) => {
    const shiftStatusData = req.body;
    console.log(`📡 Received shift status change: ${shiftStatusData.shiftId} -> ${shiftStatusData.status}`);
    
    // Broadcast to Frontend via Socket.IO
    io.emit("shiftStatusChanged", {
        shiftId: shiftStatusData.shiftId,
        machineId: shiftStatusData.machineId,
        status: shiftStatusData.status,
        eventType: shiftStatusData.eventType,
        timestamp: shiftStatusData.timestamp
    });
    
    res.json({ success: true, message: "Shift status change broadcasted" });
});

app.post("/api/internal/shift-status-changed", async (req, res) => {
    try {
        const { 
            shiftId, 
            machineId, 
            machineName,
            status, 
            endTime, 
            duration, 
            efficiency, 
            totalWeightFilled,
            totalBottlesProduced,
            timestamp 
        } = req.body;
        
        console.log(`📡 Received shift status change: ${shiftId} (${machineName}) -> ${status}`);
        
        // Broadcast tới Frontend qua Socket.IO
        io.emit("shiftStatusChanged", {
            shiftId,
            machineId,
            machineName,
            status,
            endTime,
            duration,
            efficiency,
            totalWeightFilled,
            totalBottlesProduced,
            timestamp: timestamp || new Date().toISOString()
        });
        
        res.json({ success: true, message: "Shift status change broadcasted" });
        
    } catch (error) {
        console.error("❌ Error handling shift status change:", error.message);
        res.status(500).json({ message: "Error handling shift status change" });
    }
});

app.get("/", (req, res) => {
    res.send(`
        <h1>🚀 Main Server is running</h1>
        <p>Database Server URL: ${DB_SERVER_URL}</p>
        <p>Last update: ${new Date().toLocaleString()}</p>
    `);
});


io.on("connection", (socket) => {    
    // Gửi trạng thái hiện tại của tất cả machines cho client mới
    fetchAndSendCurrentMachineStatus(socket);
    
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

// Lấy và gửi trạng thái hiện tại của machines
async function fetchAndSendCurrentMachineStatus(socket) {
    try {
        const response = await axios.get(`${DB_SERVER_URL}/db/internal/machines`);
        const machines = response.data;
        
        // Gửi từng machine update đến client mới
        machines.forEach(machine => {
            socket.emit("machineStatusUpdate", {
                id: machine._id,
                machineId: machine.machineId,
                ip: machine.ip,
                name: machine.name,
                type: machine.type,
                location: machine.location,
                isConnected: machine.isConnected,
                status: machine.status,
                lastUpdate: machine.lastUpdate,
                lastHeartbeat: machine.lastHeartbeat,
                parameters: machine.parameters,
                uptime: machine.uptime,
                userInfo: machine.userInfo
            });
        });
        
    } catch (error) {
        // console.error("❌ Error fetching current machine status:", error.message);
    }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Main Server running at http://0.0.0.0:${PORT}`);
    getAllLocalIPs().forEach(ip => {
        console.log(`   http://${ip}:${PORT}`);
    });
});