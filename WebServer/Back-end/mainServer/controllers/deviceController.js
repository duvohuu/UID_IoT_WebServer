import axios from "axios";

const DB_SERVER_URL = process.env.DB_SERVER_URL || "http://localhost:5001";

export const getDevices = async (req, res) => {
    try {
        const response = await axios.get(`${DB_SERVER_URL}/db/devices`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách thiết bị" });
    }
};