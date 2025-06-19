import axios from "axios";

axios.defaults.withCredentials = true;

const getApiUrl = () => {
    // If VITE_API_URL is set, use it
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    
    // Otherwise, use same-origin with port 5000
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:5000`;
};

const API_URL = getApiUrl();

// Lấy danh sách tất cả máy từ mainServer
const getMachines = async () => {
    try {
        const response = await axios.get(`${API_URL}/api/machines`, {
            withCredentials: true
        });
        return { success: true, data: response.data };
    } catch (err) {
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi lấy danh sách máy" 
        };
    }
};

// Lấy máy theo IP từ mainServer
const getMachineByIp = async (ip) => {
    try {
        const response = await axios.get(`${API_URL}/api/machines/ip/${ip}`, {
            withCredentials: true
        });
        return { success: true, data: response.data };
    } catch (err) {
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi tìm máy theo IP" 
        };
    }
};

// Lấy máy theo ID từ mainServer
const getMachineById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/api/machines/${id}`, {
            withCredentials: true
        });
        return { success: true, data: response.data };
    } catch (err) {
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi lấy thông tin máy" 
        };
    }
};

const deleteMachine = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/api/machines/${id}`, {
            withCredentials: true
        });
        return { success: true, data: response.data };
    } catch (err) {
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi khi xóa máy" 
        };
    }
};

export { getMachines, getMachineByIp, getMachineById, deleteMachine };