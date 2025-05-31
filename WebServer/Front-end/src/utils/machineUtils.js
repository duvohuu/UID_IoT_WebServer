export const calculateMachineStats = (machines) => {
    if (!machines || !Array.isArray(machines)) {
        return {
            total: 0,
            online: 0,
            offline: 0,
            warning: 0,
            error: 0,
            maintenance: 0,
            onlinePercentage: 0,
            offlinePercentage: 0
        };
    }

    const total = machines.length;
    const statusCounts = machines.reduce((acc, machine) => {
        const status = machine.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const online = statusCounts.online || 0;
    const offline = statusCounts.offline || 0;
    const warning = statusCounts.warning || 0;
    const error = statusCounts.error || 0;
    const maintenance = statusCounts.maintenance || 0;

    return {
        total,
        online,
        offline,
        warning,
        error,
        maintenance,
        onlinePercentage: total > 0 ? Math.round((online / total) * 100) : 0,
        offlinePercentage: total > 0 ? Math.round((offline / total) * 100) : 0,
        warningPercentage: total > 0 ? Math.round((warning / total) * 100) : 0,
        errorPercentage: total > 0 ? Math.round((error / total) * 100) : 0
    };
};

/**
 * Lấy màu sắc cho trạng thái máy
 */
export const getStatusColor = (status) => {
    const statusColors = {
        online: '#4caf50',      // Green
        offline: '#f44336',     // Red  
        warning: '#ff9800',     // Orange
        error: '#f44336',       // Red
        maintenance: '#9c27b0', // Purple
        unknown: '#757575'      // Grey
    };
    
    return statusColors[status] || statusColors.unknown;
};

/**
 * Lấy màu sắc Material-UI cho trạng thái máy
 */
export const getStatusMuiColor = (status) => {
    const statusMuiColors = {
        online: 'success',
        offline: 'error',
        warning: 'warning',
        error: 'error',
        maintenance: 'secondary',
        unknown: 'default'
    };
    
    return statusMuiColors[status] || statusMuiColors.unknown;
};

/**
 * Lấy icon cho trạng thái máy
 */
export const getStatusIcon = (status) => {
    const statusIcons = {
        online: 'CheckCircle',
        offline: 'Cancel',
        warning: 'Warning',
        error: 'Error',
        maintenance: 'Build',
        unknown: 'Help'
    };
    
    return statusIcons[status] || statusIcons.unknown;
};

/**
 * Lấy text hiển thị cho trạng thái máy
 */
export const getStatusText = (status) => {
    const statusTexts = {
        online: 'Hoạt động',
        offline: 'Ngoại tuyến',
        warning: 'Cảnh báo',
        error: 'Lỗi',
        maintenance: 'Bảo trì',
        unknown: 'Không xác định'
    };
    
    return statusTexts[status] || statusTexts.unknown;
};

/**
 * Kiểm tra IP address hợp lệ
 */
export const isValidIP = (ip) => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
};

/**
 * Format thời gian hiển thị
 */
export const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Chưa xác định';
    
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffMs = now - lastSeen;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) {
        return 'Vừa xong';
    } else if (diffMinutes < 60) {
        return `${diffMinutes} phút trước`;
    } else if (diffHours < 24) {
        return `${diffHours} giờ trước`;
    } else if (diffDays < 7) {
        return `${diffDays} ngày trước`;
    } else {
        return lastSeen.toLocaleDateString('vi-VN');
    }
};

/**
 * Format uptime
 */
export const formatUptime = (uptimeMs) => {
    if (!uptimeMs || uptimeMs < 0) return 'N/A';
    
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
};

/**
 * Sắp xếp máy theo tiêu chí
 */
export const sortMachines = (machines, sortBy = 'ip', sortOrder = 'asc') => {
    if (!machines || !Array.isArray(machines)) return [];
    
    return [...machines].sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
            case 'ip':
                aValue = a.ip || '';
                bValue = b.ip || '';
                break;
            case 'status':
                aValue = a.status || 'unknown';
                bValue = b.status || 'unknown';
                break;
            case 'lastSeen':
                aValue = new Date(a.lastSeen || 0);
                bValue = new Date(b.lastSeen || 0);
                break;
            case 'name':
                aValue = a.name || a.ip || '';
                bValue = b.name || b.ip || '';
                break;
            default:
                aValue = a[sortBy] || '';
                bValue = b[sortBy] || '';
        }
        
        if (aValue < bValue) {
            return sortOrder === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortOrder === 'asc' ? 1 : -1;
        }
        return 0;
    });
};

/**
 * Lọc máy theo tiêu chí
 */
export const filterMachines = (machines, filters) => {
    if (!machines || !Array.isArray(machines)) return [];
    
    return machines.filter(machine => {
        // Lọc theo trạng thái
        if (filters.status && filters.status.length > 0) {
            if (!filters.status.includes(machine.status)) {
                return false;
            }
        }
        
        // Lọc theo IP hoặc tên
        if (filters.search && filters.search.trim()) {
            const searchTerm = filters.search.toLowerCase().trim();
            const machineIP = (machine.ip || '').toLowerCase();
            const machineName = (machine.name || '').toLowerCase();
            
            if (!machineIP.includes(searchTerm) && !machineName.includes(searchTerm)) {
                return false;
            }
        }
        
        // Lọc theo khoảng thời gian lastSeen
        if (filters.lastSeenRange) {
            const now = new Date();
            const lastSeen = new Date(machine.lastSeen || 0);
            const diffMs = now - lastSeen;
            const diffHours = diffMs / (1000 * 60 * 60);
            
            switch (filters.lastSeenRange) {
                case '1h':
                    if (diffHours > 1) return false;
                    break;
                case '24h':
                    if (diffHours > 24) return false;
                    break;
                case '7d':
                    if (diffHours > 24 * 7) return false;
                    break;
            }
        }
        
        return true;
    });
};

/**
 * Generate machine ID từ IP
 */
export const generateMachineId = (ip) => {
    return `machine_${ip.replace(/\./g, '_')}`;
};

/**
 * Kiểm tra máy có online không
 */
export const isMachineOnline = (machine) => {
    if (!machine) return false;
    
    const status = machine.status;
    const lastSeen = new Date(machine.lastSeen || 0);
    const now = new Date();
    const diffMinutes = (now - lastSeen) / (1000 * 60);
    
    // Coi máy là online nếu status là online và lastSeen trong vòng 5 phút
    return status === 'online' && diffMinutes <= 5;
};

/**
 * Export utility functions
 */
export default {
    calculateMachineStats,
    getStatusColor,
    getStatusMuiColor,
    getStatusIcon,
    getStatusText,
    isValidIP,
    formatLastSeen,
    formatUptime,
    sortMachines,
    filterMachines,
    generateMachineId,
    isMachineOnline
};