import Machine from "../models/Machine.js";
import User from "../models/User.js";
import WorkShift from "../models/Workshift.js"; 
import mongoose from "mongoose";


export const getAllMachines = async (req, res) => {
    try {
        const machines = await Machine.find().lean().sort({ machineId: 1 });

        const machinesWithUserInfo = await Promise.all(
            machines.map(async (machine) => {
                let userInfo = null;
                if (machine.userId) {
                    try {
                        const user = await User.findOne({ userId: machine.userId }).select('-password').lean();
                        if (user) {
                            userInfo = {
                                username: user.username,
                                email: user.email,
                                role: user.role
                            };
                        }
                    } catch (userError) {
                        console.warn(`⚠️ Could not find user for userId: ${machine.userId}`);
                    }
                }
                return { ...machine, userInfo };
            })
        );

        res.json(machinesWithUserInfo);
    } catch (error) {
        console.error('❌ Internal API error:', error);
        res.status(500).json({ 
            message: 'Internal server error', 
            error: error.message 
        });
    }
};

export const createMachine = async (req, res) => {
    try {
        const machine = new Machine(req.body);
        const savedMachine = await machine.save();
        res.status(201).json(savedMachine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateMachine = async (req, res) => {
    try {
        const machine = await Machine.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!machine) {
            return res.status(404).json({ message: 'Machine not found' });
        }
        res.json(machine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const exportMultipleShifts = useCallback(async (shiftsData, user, machine) => {
    if (!shiftsData || shiftsData.length === 0) {
        alert('Không có ca làm việc nào được chọn để xuất!');
        return;
    }

    try {
        setIsExporting(true);
        const isAdmin = user?.role === 'admin';
        
        // ✅ SORT DỮ LIỆU THEO SHIFT ID TRƯỚC KHI XỬ LÝ
        const sortedShiftsData = [...shiftsData].sort((a, b) => {
            // Phương pháp 1: Sort theo shiftId (nếu là số)
            const shiftA = parseInt(a.shiftId?.replace(/\D/g, '')) || 0;
            const shiftB = parseInt(b.shiftId?.replace(/\D/g, '')) || 0;
            return shiftA - shiftB;
            
            // Hoặc Phương pháp 2: Sort theo thời gian tạo
            // return new Date(a.startTime || a.createdAt) - new Date(b.startTime || b.createdAt);
        });
        
        console.log('🔍 Original order:', shiftsData.map(s => s.shiftId));
        console.log('🔍 Sorted order:', sortedShiftsData.map(s => s.shiftId));
        
        const allCsvData = [];

        // Header tổng quan
        allCsvData.push(['=== BÁO CÁO TỔNG HỢP CA LÀM VIỆC ===']);
        allCsvData.push(['Máy', machine?.name || 'N/A']);
        allCsvData.push(['IP máy', machine?.ip || 'N/A']);
        allCsvData.push(['Số ca xuất', sortedShiftsData.length]); // ✅ Sử dụng sortedShiftsData
        allCsvData.push(['Xuất bởi', user?.username || 'Unknown']);
        allCsvData.push(['Quyền truy cập', isAdmin ? 'Admin (Đầy đủ)' : 'User (Giới hạn)']);
        allCsvData.push(['Thời gian xuất', new Date().toLocaleString('vi-VN')]);
        allCsvData.push([]);

        // Debug: In ra cấu trúc dữ liệu
        console.log('🔍 Sample shift finalData:', sortedShiftsData[0]?.finalData);
        console.log('🔍 Available monitoring registers:', Object.keys(sortedShiftsData[0]?.finalData?.monitoringData || {}));
        console.log('🔍 Available admin registers:', Object.keys(sortedShiftsData[0]?.finalData?.adminData || {}));
        console.log('🔍 Is Admin user:', isAdmin);

        // Bảng thông tin các ca - HEADER ĐỘNG
        allCsvData.push(['=== THÔNG TIN TẤT CẢ CÁC CA ===']);
        
        // Header columns cơ bản
        const baseHeaders = [
            'STT',
            'Mã ca', 
            'Trạng thái', 
            'Thời gian bắt đầu', 
            'Thời gian kết thúc', 
            'Thời lượng (phút)',
            'Tổng khối lượng đã chiết (kg)',
            'Năng suất (kg/h)',
            'Trạng thái hoạt động máy', 
            'Trạng thái bồn cấp muối', 
            'Loại muối đang chiết',
            'Số line hoạt động',
            'Tổng số chai đã chiết',
            'Khối lượng cần chiết rót (kg)',
            'Hiệu suất đạt được (%)',
            'Ghi chú'
        ];

        // Tạo admin headers từ ADMIN_DATA_CONFIG
        const adminHeaders = isAdmin ? Object.entries(ADMIN_DATA_CONFIG).map(([key, config]) => {
            return `${config.title} (${key})${config.unit ? ` [${config.unit}]` : ''}`;
        }) : [];

        // Kết hợp headers
        const finalHeaders = [...baseHeaders, ...adminHeaders];
        allCsvData.push(finalHeaders);
        
        // Debug: In ra số lượng cột
        console.log('🔍 Total columns:', finalHeaders.length);
        console.log('🔍 Base columns:', baseHeaders.length);
        console.log('🔍 Admin columns:', adminHeaders.length);
        console.log('🔍 Admin register keys:', Object.keys(ADMIN_DATA_CONFIG));
        
        // ✅ ĐIỀN THÔNG TIN TỪNG CA - SỬ DỤNG sortedShiftsData
        sortedShiftsData.forEach((shift, index) => {
            // Lấy dữ liệu monitoring (cơ bản)
            const operatingStatus = getProcessedValue(shift, '40001', machine); 
            const saltTankStatus = getProcessedValue(shift, '40002', machine);  
            const saltType = getProcessedValue(shift, '40003', machine);        
            const activeLines = getProcessedValue(shift, '40008', machine);     
            const totalBottles = getProcessedValue(shift, '40007', machine);   

            // Khối lượng cần chiết
            const targetWeightRaw = getRawValue(shift, '40004');
            const targetWeight = targetWeightRaw || machine?.targetWeight || '250.00';
            
            // Tính hiệu suất
            const actualWeight = Number(shift.totalWeightFilled || 0);
            const targetWeightNum = Number(targetWeight);
            const efficiency = targetWeightNum > 0 ? ((actualWeight / targetWeightNum) * 100) : 0;
            
            // Ghi chú dựa trên trạng thái
            let note = '';
            switch (shift.status) {
                case 'completed':
                    note = 'Ca hoàn thành tốt';
                    break;
                case 'incomplete':
                    note = 'Ca chưa hoàn chỉnh, cần kiểm tra';
                    break;
                case 'interrupted':
                    note = 'Ca bị gián đoạn do lỗi kỹ thuật';
                    break;
                case 'active':
                    note = 'Ca đang trong quá trình thực hiện';
                    break;
                default:
                    note = 'Trạng thái không xác định';
            }

            // Dữ liệu cơ bản
            const baseData = [
                index + 1, // STT sẽ theo thứ tự đã sort
                shift.shiftId || 'N/A',
                getStatusInfo(shift.status).label,
                shift.startTime ? new Date(shift.startTime).toLocaleString('vi-VN') : 'N/A',
                shift.endTime ? new Date(shift.endTime).toLocaleString('vi-VN') : 'Đang hoạt động',
                shift.duration || 'N/A',
                Number(shift.totalWeightFilled || 0).toFixed(2),
                shift.efficiency ? Number(shift.efficiency).toFixed(2) : 'N/A',
                operatingStatus,
                saltTankStatus,
                saltType,
                activeLines,
                totalBottles,
                Number(targetWeight).toFixed(2),
                efficiency.toFixed(2),
                note
            ];

            // Dữ liệu admin - LẤY TẤT CẢ THANH GHI ADMIN
            const adminData = isAdmin ? Object.keys(ADMIN_DATA_CONFIG).map(registerKey => {
                const value = getProcessedValue(shift, registerKey, machine);
                const config = ADMIN_DATA_CONFIG[registerKey];
                
                // Format số cho numeric values
                if (config.type === 'numeric' && !isNaN(parseFloat(value))) {
                    return parseFloat(value).toFixed(2);
                }
                
                return value;
            }) : [];

            // Debug log cho ca đầu tiên
            if (index === 0) {
                console.log('🔍 Processed values for first shift:');
                console.log('Basic data length:', baseData.length);
                console.log('Admin data length:', adminData.length);
                console.log('Basic data - operatingStatus (40001):', operatingStatus);
                console.log('Basic data - saltTankStatus (40002):', saltTankStatus);
                
                if (isAdmin) {
                    console.log('Admin data sample:');
                    Object.keys(ADMIN_DATA_CONFIG).slice(0, 5).forEach(key => {
                        console.log(`${key} (${ADMIN_DATA_CONFIG[key].title}):`, getProcessedValue(shift, key, machine));
                    });
                }
            }

            // Kết hợp tất cả dữ liệu
            const finalRowData = [...baseData, ...adminData];
            allCsvData.push(finalRowData);
            
            // Debug: Kiểm tra số lượng cột cho dòng đầu tiên
            if (index === 0) {
                console.log('🔍 Row data length:', finalRowData.length);
                console.log('🔍 Header length:', finalHeaders.length);
                if (finalRowData.length !== finalHeaders.length) {
                    console.warn('⚠️ Mismatch between header and row data length!');
                }
            }
        });

        allCsvData.push([]);

        // ✅ THỐNG KÊ TỔNG HỢP - SỬ DỤNG sortedShiftsData
        allCsvData.push(['=== THỐNG KÊ TỔNG HỢP ===']);
        const totalWeight = sortedShiftsData.reduce((sum, shift) => sum + Number(shift.totalWeightFilled || 0), 0);
        const totalDuration = sortedShiftsData.reduce((sum, shift) => sum + Number(shift.duration || 0), 0);
        const avgEfficiency = sortedShiftsData.reduce((sum, shift) => sum + Number(shift.efficiency || 0), 0) / sortedShiftsData.length;
        const completedShifts = sortedShiftsData.filter(shift => shift.status === 'completed').length;
        
        allCsvData.push(['Tổng số ca', sortedShiftsData.length]);
        allCsvData.push(['Số ca hoàn thành', completedShifts]);
        allCsvData.push(['Tỷ lệ hoàn thành (%)', ((completedShifts / sortedShiftsData.length) * 100).toFixed(2)]);
        allCsvData.push(['Tổng khối lượng đã chiết (kg)', totalWeight.toFixed(2)]);
        allCsvData.push(['Tổng thời gian hoạt động (phút)', totalDuration]);
        allCsvData.push(['Năng suất trung bình (kg/h)', avgEfficiency.toFixed(2)]);
        allCsvData.push(['Thời gian hoạt động trung bình/ca (phút)', (totalDuration / sortedShiftsData.length).toFixed(2)]);

        // Convert to CSV string
        const csvContent = allCsvData
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        // Add BOM for UTF-8
        const BOM = '\uFEFF';
        const finalContent = BOM + csvContent;

        // Download file
        const blob = new Blob([finalContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const fileName = sortedShiftsData.length === 1 
            ? `Shift_${sortedShiftsData[0].shiftId}_${machine?.name || 'Unknown'}_${isAdmin ? 'ADMIN' : 'USER'}_${new Date().getTime()}.csv`
            : `WorkShifts_Report_${machine?.name || 'Unknown'}_${sortedShiftsData.length}ca_${isAdmin ? 'ADMIN' : 'USER'}_${new Date().toISOString().split('T')[0]}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`✅ Exported ${sortedShiftsData.length} shifts to CSV (${isAdmin ? 'ADMIN' : 'USER'} mode)`);
        console.log(`📊 Total columns exported: ${isAdmin ? baseHeaders.length + Object.keys(ADMIN_DATA_CONFIG).length : baseHeaders.length}`);

    } catch (error) {
        console.error('❌ Multi-export error:', error);
        alert('Lỗi khi xuất file CSV');
    } finally {
        setIsExporting(false);
    }
}, []);

export const getMachineByIp = async (req, res) => {
    try {
        const machine = await Machine.findOne({ ip: req.params.ip });
        if (!machine) {
            return res.status(404).json({ message: 'Machine not found' });
        }
        res.json(machine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};