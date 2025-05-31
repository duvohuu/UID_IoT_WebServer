import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/usersRoute.js";
import http from "http";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import socketIo from "socket.io";
import net from "net";
import * as Modbus from "jsmodbus";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
const server = http.createServer(app);

// Danh sách các origin được phép
const allowedOrigins = [
    "http://localhost:5173",
    "http://192.168.1.10:5173",
    "http://localhost:3000",
];

// Middleware CORS động
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
    next();
});

const io = socketIo(server, { // Sửa 'env' thành 'server'
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "OPTIONS"],
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

// Tạo ModBus TCP Server
const modbusServer = new net.Server();
const modbusPort = 503;
const holdingRegisters = Buffer.alloc(100);

modbusServer.on("connection", (socket) => {
    const clientIP = socket.remoteAddress.replace("::ffff:", "");
    console.log(`ModBus client connected from IP: ${clientIP}`);

    const modbus = new Modbus.server.TCP(socket, {
        holding: holdingRegisters,
    });

    io.emit("machineStatusUpdate", {
        ip: clientIP,
        isConnected: true,
        status: "online",
        lastUpdate: new Date().toISOString(),
    });

    socket.on("close", () => { // Xóa từ khóa OSC
        console.log(`ModBus client disconnected from IP: ${clientIP}`);
        io.emit("machineStatusUpdate", {
            ip: clientIP,
            isConnected: false,
            status: "offline",
            lastUpdate: null,
        });
    });

    socket.on("error", (err) => {
        console.error(`ModBus client error from IP: ${clientIP}`, err);
        io.emit("machineStatusUpdate", {
            ip: clientIP,
            isConnected: false,
            status: "offline",
            lastUpdate: null,
        });
    });
});

modbusServer.listen(modbusPort, "0.0.0.0", () => {
    console.log(`✅ ModBus TCP Server running on port ${modbusPort}`);
});

// Phục vụ file tĩnh từ thư mục upload/avatars
app.use("/avatars", express.static(path.join(__dirname, "upload/avatars")));

app.use(cookieParser());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`Nhận yêu cầu: ${req.method} ${req.url}`);
    next();
});

app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
    res.send("🚀 Backend is running");
});

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id, socket.handshake.query);

    socket.on("message", (msg) => {
        console.log("Received message:", msg);
    });

    socket.on("Value", (data) => {
        console.log("Received value:", data);
    });

    socket.on("disconnect", (reason) => {
        console.log("Client disconnected:", socket.id, "Lý do:", reason);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
});