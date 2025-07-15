export const corsMiddleware = (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
};

export const loggingMiddleware = (req, res, next) => {
    // console.log(`📨 DB Server: ${req.method} ${req.url}`);
    next();
};

export const ipWhitelistMiddleware = (req, res, next) => {
    const allowedIPs = ['127.0.0.1', '::1', 'localhost'];
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

    // Allow localhost, internal network, and Docker bridge network (172.x.x.x)
    if (
        allowedIPs.some(ip => clientIP.includes(ip)) ||
        clientIP.includes('192.168.') ||
        clientIP.includes('172.')
    ) {
        next();
    } else {
        // console.log(`🚫 Blocked internal API access from: ${clientIP}`);
        res.status(403).json({ message: 'Access denied - Internal API only' });
    }
};