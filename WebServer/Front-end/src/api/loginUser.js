import axios from "axios";

axios.defaults.withCredentials = true;

const loginUser = async (email, password) => {
    try {
        localStorage.removeItem("token");
        localStorage.removeItem("authToken");

        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/login`, {
            email,
            password,
        });
        localStorage.setItem("user", JSON.stringify({ username: res.data.username, avatar: res.data.avatar }));
        return { success: true, username: res.data.username, avatar: res.data.avatar };
    } catch (err) {
        return { success: false, message: err.response?.data?.message || "Lỗi đăng nhập" };
    }
};

export default loginUser;