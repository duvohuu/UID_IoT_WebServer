import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import deviceRoutes from "./routes/deviceRoutes.js";
import userRoutes from "./routes/usersRoute.js";
import { createRequire } from "module";
import http from "http";
import Device from "./models/Device.js";
import cookieParser from "cookie-parser";

const require = createRequire(import.meta.url);
const socketIo = require("socket.io");

dotenv.config();
connectDB();

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

    socket.on("message", async (msg) => {
        console.log("Received message from ESP32:", msg);
        try {
            // Giả sử msg là mảng dạng ["message", "1010"]
            if (Array.isArray(msg) && msg[0] === "message" && msg[1].length === 4) {
                const status = msg[1]; // "1010"
                const lights = {
                    Y0: status[3] === "1",
                    Y1: status[2] === "1",
                    Y2: status[1] === "1",
                    Y3: status[0] === "1",
                };

                // Cập nhật cơ sở dữ liệu (giả sử thiết bị có name là "lights")
                const device = await Device.findOneAndUpdate(
                    { name: "lights" },
                    { status: lights, updatedAt: Date.now() },
                    { upsert: true, new: true }
                );
                console.log("Cập nhật thiết bị:", device);

                // Phát sự kiện lightStatus đến tất cả client
                io.emit("lightStatus", lights);
            } else {
                console.log("Dữ liệu không hợp lệ:", msg);
            }
        } catch (error) {
            console.error("Lỗi xử lý dữ liệu từ ESP32:", error);
        }
    });

    socket.on("disconnect", (reason) => {
        console.log("Client disconnected:", socket.id, "Lý do:", reason);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
});