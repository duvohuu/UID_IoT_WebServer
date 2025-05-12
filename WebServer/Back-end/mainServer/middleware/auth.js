import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Token không hợp lệ" });
        }
        req.user = user;
        next();
    });
};