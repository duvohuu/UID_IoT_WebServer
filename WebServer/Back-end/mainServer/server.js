import express from "express";
import dotenv from "dotenv";
import deviceRoutes from "./routes/deviceRoutes.js";
import userRoutes from "./routes/usersRoute.js";
import { createRequire } from "module";
import http from "http";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const socketIo = require("socket.io");

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

const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "OPTIONS"],
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
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
app.use("/api/devices", deviceRoutes);

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