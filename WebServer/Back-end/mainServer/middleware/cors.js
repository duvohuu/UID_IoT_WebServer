import os from "os";

export const getAllLocalIPs = () => {
    const interfaces = os.networkInterfaces();
    const ips = ['localhost'];
    
    Object.keys(interfaces).forEach(interfaceName => {
        interfaces[interfaceName].forEach(iface => {
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push(iface.address);
            }
        });
    });
    
    return ips;
};

export const generateAllowedOrigins = () => {
    const ips = getAllLocalIPs();
    const ports = [5173]; 
    const origins = [];
    
    ips.forEach(ip => {
        ports.forEach(port => {
            origins.push(`http://${ip}:${port}`);
        });
    });
    
    return origins;
};

export const corsMiddleware = (allowedOrigins) => {
    return (req, res, next) => {
        const origin = req.headers.origin;
        if (allowedOrigins.includes(origin)) {
            res.setHeader("Access-Control-Allow-Origin", origin);
            res.setHeader("Access-Control-Allow-Credentials", "true");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Cookie");
            res.setHeader("Access-Control-Expose-Headers", "Set-Cookie");
        }
        
        if (req.method === 'OPTIONS') {
            console.log(`🔍 OPTIONS request for: ${req.url}`);
            res.status(200).end();
            return;
        }
        
        next();
    };
};