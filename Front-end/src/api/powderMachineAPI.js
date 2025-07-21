import axios from "axios";

axios.defaults.withCredentials = true;

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Lấy danh sách ca làm việc theo máy
export const getWorkShiftsByPowderMachine = async (machineId, params = {}) => {
    try {
        const queryParams = new URLSearchParams({
            machineId,
            limit: params.limit || 20,
            page: params.page || 1,
            sortBy: params.sortBy || 'shiftId',     
            sortOrder: params.sortOrder || 'asc',  
            ...params
        });

        const response = await axios.get(`${API_URL}/api/powder-machine?${queryParams}`, {
            withCredentials: true
        });
        return { success: true, data: response.data };
    } catch (err) {
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi lấy danh sách ca làm việc" 
        };
    }
};
