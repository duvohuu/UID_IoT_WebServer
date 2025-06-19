import { useState, useEffect } from 'react';
import { getMachineByIp } from '../api/machineAPI';

export const useMachineDetail = (ip) => {
    const [machine, setMachine] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMachine = async () => {
            try {
                setLoading(true);
                console.log(`🔍 Fetching machine details for IP: ${ip}`);
                
                const result = await getMachineByIp(ip);
                if (result.success) {
                    setMachine(result.data);
                    setError(null);
                    console.log(`✅ Machine loaded:`, result.data.name);
                } else {
                    setError(result.message);
                    console.error(`❌ Failed to load machine:`, result.message);
                }
            } catch (err) {
                setError('Lỗi khi tải thông tin máy');
                console.error('Error fetching machine:', err);
            } finally {
                setLoading(false);
            }
        };

        if (ip) {
            fetchMachine();
        } else {
            setError('IP không hợp lệ');
            setLoading(false);
        }
    }, [ip]);

    return { machine, loading, error };
};