import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js"; 
import User from "./models/User.js";
import Device from "./models/Device.js";
import path from "path";
import { fileURLToPath } from "url";

// Định nghĩa __filename và __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đọc file .env từ thư mục cha (Back-end)
dotenv.config({ path: path.join(__dirname, "../.env") });

// Gọi hàm connectDB
connectDB();

const app = express();
app.use(express.json());

// API để lấy tất cả devices
app.get("/db/devices", async (req, res) => {
    try {
        const devices = await Device.find();
        res.json(devices);
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách thiết bị" });
    }
});

// API để tìm user theo email
app.get("/db/users/email/:email", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Lỗi tìm người dùng" });
    }
});

// API để tìm user theo ID
app.get("/db/users/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Lỗi tìm người dùng" });
    }
});

// API để tạo user mới
app.post("/db/users", async (req, res) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ message: "Lỗi tạo người dùng" });
    }
});

// API để cập nhật user
app.put("/db/users/:id", async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Lỗi cập nhật người dùng" });
    }
});

const DB_PORT = process.env.DB_PORT || 5001;
app.listen(DB_PORT, "0.0.0.0", () => {
    console.log(`✅ Database Server running at http://0.0.0.0:${DB_PORT}`);
});