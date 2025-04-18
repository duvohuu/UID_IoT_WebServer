import Device from '../models/Device.js';

export const getDevices = async (req, res) => {
    try {
        const devices = await Device.find();  
        res.json(devices);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách thiết bị' });
    }
};
    