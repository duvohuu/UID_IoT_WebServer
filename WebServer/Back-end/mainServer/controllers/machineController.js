import axios from "axios";

const DB_SERVER_URL = process.env.DB_SERVER_URL || "http://localhost:5001";

export const getMachines = async (req, res) => {
    try {
        const response = await axios.get(`${DB_SERVER_URL}/db/machines`);
        res.json(response.data);
    } catch (error) {
        console.error("Lỗi lấy danh sách máy:", error);
        res.status(500).json({ message: "Lỗi lấy danh sách máy", error: error.message });
    }
};

export const getMachineByIp = async (req, res) => {
    try {
        const { ip } = req.params;
        const response = await axios.get(`${DB_SERVER_URL}/db/machines/ip/${ip}`);
        res.json(response.data);
    } catch (error) {
        console.error("Lỗi tìm máy theo IP:", error);
        res.status(error.response?.status || 500).json({
            message: error.response?.status === 404 ? "Không tìm thấy máy" : "Lỗi tìm máy theo IP",
            error: error.message
        });
    }
};