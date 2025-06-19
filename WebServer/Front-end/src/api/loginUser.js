import axios from "axios";

axios.defaults.withCredentials = true;

const getApiUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:5000`;
};

const loginUser = async (email, password) => {
    try {
        // Clear old tokens
        localStorage.removeItem("token");
        localStorage.removeItem("authToken");

        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/login`, {
            email,
            password,
        });
        
        const userData = {
            username: res.data.username,
            email: res.data.email,
            role: res.data.role,
            avatar: res.data.avatar
        };
        
        localStorage.setItem("user", JSON.stringify(userData));
        
        return { 
            success: true, 
            ...userData
        };
    } catch (err) {
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi đăng nhập" 
        };
    }
};

export default loginUser;