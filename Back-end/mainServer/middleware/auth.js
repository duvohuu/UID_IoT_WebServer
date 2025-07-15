import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
    try {
        const token = req.cookies.authToken;
        
        // console.log(`Auth middleware: Token exists: ${!!token}`); 
        // console.log(`Auth middleware: Request path: ${req.path}`); 
        
        if (!token) {
            console.log(`Auth middleware: No token found`);
            return res.status(401).json({ message: "Access token required" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        
        // console.log(`Auth middleware: Token valid for user: ${decoded.username}`); 
        next();
    } catch (error) {
        // console.log(`Auth middleware: Token invalid:`, error.message);
        return res.status(403).json({ message: "Invalid token" });
    }
};