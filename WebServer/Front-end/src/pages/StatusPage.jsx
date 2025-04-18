import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StatusPage = () => {
    const [devices, setDevices] = useState([]);

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/devices');
                setDevices(response.data);
            } catch (error) {
                console.error('Lỗi khi lấy thiết bị:', error);
            }
        };

        fetchDevices();
    }, []);

    return (
        <div>
            <h1>Status</h1>
            {devices.length === 0 ? (
                <p>Không có thiết bị nào.</p>
            ) : (
                <ul>
                    {devices.map((device, index) => (
                        <li key={index}>
                            {device.name} - Trạng thái: {device.status}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default StatusPage;
