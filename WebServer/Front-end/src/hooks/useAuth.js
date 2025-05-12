import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Thêm import
import axios from "axios";
import loginUser from "../api/loginUser";
import { useSnackbar } from '../context/SnackbarContext';

const useAuth = (setUser, socket) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [openLogin, setOpenLogin] = useState(false);
    const { showSnackbar } = useSnackbar();
    const navigate = useNavigate(); 

    const handleLogin = async () => {
        const res = await loginUser(email, password);
        if (res.success) {
            setUser({ username: res.username, avatar: res.avatar });
            localStorage.setItem("user", JSON.stringify({ username: res.username, avatar: res.avatar }));
            setOpenLogin(false);
            setPassword("");
            socket.connect();
            showSnackbar("Đăng nhập thành công", "success");
            navigate("/status"); // Thêm điều hướng đến /status
        } else {
            showSnackbar(res.message || "Đăng nhập thất bại", "error");
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/users/logout`,
                {},
                { withCredentials: true }
            );
            setUser(null);
            localStorage.removeItem("user");
            socket.disconnect();
            showSnackbar("Đăng xuất thành công", "success");
            navigate("/status"); // Điều hướng sau khi đăng xuất
        } catch (error) {
            console.error("Lỗi khi đăng xuất:", error);
            showSnackbar("Lỗi khi đăng xuất", "error");
        }
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        openLogin,
        setOpenLogin,
        handleLogin,
        handleLogout,
    };
};

export default useAuth;