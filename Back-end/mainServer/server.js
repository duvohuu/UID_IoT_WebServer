import express from "express";
import dotenv from "dotenv";
import http from "http";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import userRoutes from "./routes/usersRoutes.js";
import machineRoutes from "./routes/machineRoutes.js";
import saltMachineRoutes from "./routes/saltMachineRoutes.js";
import powderMachineRoutes from "./routes/powderMachineRoutes.js";
import internalRoutes from "./routes/internalRoutes.js";

// Import middleware & config
import { generateAllowedOrigins, getAllLocalIPs, corsMiddleware } from "./middleware/cors.js";
import { initializeSocket } from "./config/socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
const server = http.createServer(app);
const DB_SERVER_URL = process.env.DB_SERVER_URL || "http://localhost:5001";

// CORS configuration
const allowedOrigins = generateAllowedOrigins();

// Initialize Socket.IO
const io = initializeSocket(server, allowedOrigins);
app.set('io', io);

// =================================================================
// MIDDLEWARE SETUP
// =================================================================

app.use(corsMiddleware(allowedOrigins));
app.use("/avatars", express.static(path.join(__dirname, "upload/avatars")));
app.use(cookieParser());
app.use(express.json());

// =================================================================
// ROUTES SETUP
// =================================================================

app.use("/api/users", userRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/salt-machine", saltMachineRoutes);
app.use("/api/powder-machine", powderMachineRoutes);
app.use("/api/internal", internalRoutes);

// =========================================================
// BASIC ROUTES
// =================================================================

app.get("/", (req, res) => {
    res.send(`
        <h1>🚀 Main Server is running</h1>
        <p>Database Server URL: ${DB_SERVER_URL}</p>
        <p>Last update: ${new Date().toLocaleString()}</p>
    `);
});

// =================================================================
// SERVER START
// =================================================================

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Main Server running at http://0.0.0.0:${PORT}`);
    getAllLocalIPs().forEach(ip => {
        console.log(`   http://${ip}:${PORT}`);
    });
});