import axios from "axios";

axios.defaults.withCredentials = true;

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Lấy danh sách tất cả máy
const getMachines = async () => {
    try {
        const response = await axios.get(`${API_URL}/api/machines`, {
            withCredentials: true // Đảm bảo gửi cookie
            // Loại bỏ header Authorization vì auth.js không dùng
        });
        return { success: true, data: response.data };
    } catch (err) {
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi lấy danh sách máy" 
        };
    }
};

// Lấy máy theo IP
const getMachineByIp = async (ip) => {
    try {
        const response = await axios.get(`${API_URL}/api/machines/ip/${ip}`, {
            withCredentials: true // Đảm bảo gửi cookie
            // Loại bỏ header Authorization vì auth.js không dùng
        });
        return { success: true, data: response.data };
    } catch (err) {
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi tìm máy theo IP" 
        };
    }
};

export { getMachines, getMachineByIp };