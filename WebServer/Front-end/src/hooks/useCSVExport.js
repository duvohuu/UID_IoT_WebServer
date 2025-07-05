import { useState, useCallback } from 'react';
import { MONITORING_DATA_CONFIG, ADMIN_DATA_CONFIG } from '../config/machineDataConfig';

export const useCSVExport = () => {
    const [isExporting, setIsExporting] = useState(false);

    const getStatusInfo = (status) => {
        switch (status) {
            case 'complete':
                return { label: 'Hoàn thành', color: 'success', icon: '✅' };
            case 'incomplete':
                return { label: 'Chưa hoàn chỉnh', color: 'warning', icon: '⚠️' };
            case 'active':
                return { label: 'Đang hoạt động', color: 'info', icon: '🔄' };
            case 'paused':
                return { label: 'Tạm dừng', color: 'warning', icon: '⏸️' };
            default:
                return { label: status || 'Không xác định', color: 'default', icon: '❓' };
        }
    };

    const getMachineStatusText = (status) => {
        switch (Number(status)) {
            case 0: return 'Dừng';
            case 1: return 'Chạy';
            case 2: return 'Chạy nhưng tạm dừng';
            default: return 'Không xác định';
        }
    };

    const getSaltTankStatusText = (status) => {
        switch (Number(status)) {
            case 0: return 'Chưa đầy';
            case 1: return 'Đầy';
            default: return 'Không xác định';
        }
    };

    const getSaltTypeText = (type) => {
        switch (Number(type)) {
            case 0: return 'Muối hạt to';
            case 1: return 'Muối hạt nhỏ';
            default: return 'Không xác định';
        }
    };

    const getActiveLinesText = (count) => {
        switch (Number(count)) {
            case 0: return 'Tất cả dừng';
            case 1: return 'Line A';
            case 2: return 'Line B';
            case 3: return 'Cả hai line';
            default: return 'Không xác định';
        }
    };

    const getShiftValue = (shift, field) => {
        // Truy cập trực tiếp từ WorkShift model
        switch (field) {
            case 'machineStatus':
                return getMachineStatusText(shift.machineStatus);
            case 'saltTankStatus':
                return getSaltTankStatusText(shift.saltTankStatus);
            case 'saltType':
                return getSaltTypeText(shift.saltType);
            case 'activeLinesCount':
                return getActiveLinesText(shift.activeLinesCount);
            case 'targetWeight':
                return Number(shift.targetWeight || 0).toFixed(2);
            case 'totalWeightFilled':
                return Number(shift.totalWeightFilled || 0).toFixed(2);
            case 'totalBottlesFilled':
                return Number(shift.totalBottlesFilled || 0);
            case 'errorCode':
                return shift.errorCode || 0;
            case 'efficiency':
                return Number(shift.efficiency || 0).toFixed(2);
            case 'fillRate':
                return Number(shift.fillRate || 0).toFixed(0);
            case 'duration':
                return Number(shift.duration || 0);
            default:
                return shift[field] || 'N/A';
        }
    };

    const getTimeTrackingInfo = (shift) => {
        const timeTracking = shift.timeTracking || {};
        return {
            startTime: timeTracking.shiftStartTime ? 
                new Date(timeTracking.shiftStartTime).toLocaleString('vi-VN') : 'N/A',
            endTime: timeTracking.shiftEndTime ? 
                new Date(timeTracking.shiftEndTime).toLocaleString('vi-VN') : 'Đang hoạt động',
            pausedTime: Number(timeTracking.shiftPausedTime || 0).toFixed(1)
        };
    };

    const getPauseTrackingInfo = (shift) => {
        const pauseTracking = shift.pauseTracking || {};
        return {
            totalPausedMinutes: Number(pauseTracking.totalPausedMinutes || 0).toFixed(1),
            pauseCount: pauseTracking.pausedHistory ? pauseTracking.pausedHistory.length : 0
        };
    };

    const getMotorControlInfo = (shift) => {
        const motorControl = shift.motorControl || {};
        return {
            granularSaltHigh: motorControl.granularSalt?.highFrequency || 0,
            granularSaltLow: motorControl.granularSalt?.lowFrequency || 0,
            fineSaltHigh: motorControl.fineSalt?.highFrequency || 0,
            fineSaltLow: motorControl.fineSalt?.lowFrequency || 0,
            accelerationTime: motorControl.accelerationTime || 0,
            granularThreshold: motorControl.granularSaltThreshold || 0,
            fineThreshold: motorControl.fineSaltThreshold || 0
        };
    };

    const getLoadcellInfo = (shift) => {
        const loadcells = shift.loadcellConfigs || [];
        const info = {};
        for (let i = 1; i <= 4; i++) {
            const loadcell = loadcells.find(lc => lc.loadcellId === i);
            info[`loadcell${i}_gain`] = loadcell?.gain || 0;
            info[`loadcell${i}_offset`] = loadcell?.offset || 0;
        }
        return info;
    };

    const exportMultipleShifts = useCallback(async (shiftsData, user, machine) => {
        if (!shiftsData || shiftsData.length === 0) {
            alert('Không có ca làm việc nào được chọn để xuất!');
            return;
        }

        try {
            setIsExporting(true);
            const isAdmin = user?.role === 'admin';
            
            const sortedShiftsData = [...shiftsData].sort((a, b) => {
                return (a.shiftNumber || 0) - (b.shiftNumber || 0);
            });
            
            console.log('🔍 Sorted by shiftNumber:', sortedShiftsData.map(s => `${s.shiftId} (${s.shiftNumber})`));
            
            const allCsvData = [];

            allCsvData.push(['=== BÁO CÁO TỔNG HỢP CA LÀM VIỆC ===']);
            allCsvData.push(['Máy', machine?.name || 'N/A']);
            allCsvData.push(['ID máy', machine?.machineId || 'N/A']);
            allCsvData.push(['IP máy', machine?.ip || 'N/A']);
            allCsvData.push(['Số ca xuất', sortedShiftsData.length]);
            allCsvData.push(['Xuất bởi', user?.username || 'Unknown']);
            allCsvData.push(['Quyền truy cập', isAdmin ? 'Admin (Đầy đủ)' : 'User (Cơ bản)']);
            allCsvData.push(['Thời gian xuất', new Date().toLocaleString('vi-VN')]);
            allCsvData.push([]);

            allCsvData.push(['=== THÔNG TIN CHI TIẾT CÁC CA ===']);
            
            const baseHeaders = [
                'STT',
                'Mã ca làm việc', 
                'Số ca',
                'Máy số',
                'Tên máy',
                'User ID',
                'Tên operator',
                'Trạng thái ca', 
                'Thời gian bắt đầu', 
                'Thời gian kết thúc', 
                'Tổng thời lượng (phút)',
                'Thời gian tạm dừng (phút)',
                'Số lần tạm dừng',
                'Trạng thái máy', 
                'Trạng thái bồn muối', 
                'Loại muối',
                'Khối lượng mục tiêu (g)',
                'Tổng khối lượng chiết (kg)',
                'Tổng số chai',
                'Số line hoạt động',
                'Mã lỗi',
                'Hiệu suất (kg/h)',
            ];

            const adminHeaders = isAdmin ? [
                'Loadcell 1 - Gain',
                'Loadcell 1 - Offset',
                'Loadcell 2 - Gain', 
                'Loadcell 2 - Offset',
                'Loadcell 3 - Gain',
                'Loadcell 3 - Offset',
                'Loadcell 4 - Gain',
                'Loadcell 4 - Offset',
                'Tần số cao stepper motors cho loại muối hạt ',
                'Tần số thấp stepper motors cho loại muối hạt ', 
                'Tần số cao stepper motors cho loại muối nhuyễn ',
                'Tần số thấp stepper motors cho loại muối nhuyễn ',
                'Thời gian tăng/giảm tốc stepper motors',
                'Độ chênh lệch khối lượng tối thiểu để giảm tốc stepper motors muối hạt',
                'Độ chênh lệch khối lượng tối thiểu để giảm tốc stepper motors muối nhuyễn',
            ] : [];

            const finalHeaders = [...baseHeaders, ...adminHeaders];
            allCsvData.push(finalHeaders);
            
            console.log(`📊 Total columns: ${finalHeaders.length} (Base: ${baseHeaders.length}, Admin: ${adminHeaders.length})`);

            sortedShiftsData.forEach((shift, index) => {
                const timeInfo = getTimeTrackingInfo(shift);
                const pauseInfo = getPauseTrackingInfo(shift);

                const baseData = [
                    index + 1,
                    shift.shiftId || 'N/A',
                    shift.shiftNumber || 'N/A',
                    shift.machineNumber || 'N/A',
                    shift.machineName || 'N/A',
                    shift.userId || 'N/A',
                    shift.operatorName || 'N/A',
                    getStatusInfo(shift.status).label,
                    timeInfo.startTime,
                    timeInfo.endTime,
                    getShiftValue(shift, 'duration'),
                    pauseInfo.totalPausedMinutes,
                    pauseInfo.pauseCount,
                    getShiftValue(shift, 'machineStatus'),
                    getShiftValue(shift, 'saltTankStatus'),
                    getShiftValue(shift, 'saltType'),
                    getShiftValue(shift, 'targetWeight'),
                    getShiftValue(shift, 'totalWeightFilled'),
                    getShiftValue(shift, 'totalBottlesFilled'),
                    getShiftValue(shift, 'activeLinesCount'),
                    getShiftValue(shift, 'errorCode'),
                    getShiftValue(shift, 'efficiency'),
                ];

                const adminData = isAdmin ? (() => {
                    const motorInfo = getMotorControlInfo(shift);
                    const loadcellInfo = getLoadcellInfo(shift);
                    
                    return [
                        loadcellInfo.loadcell1_gain,
                        loadcellInfo.loadcell1_offset,
                        loadcellInfo.loadcell2_gain,
                        loadcellInfo.loadcell2_offset,
                        loadcellInfo.loadcell3_gain,
                        loadcellInfo.loadcell3_offset,
                        loadcellInfo.loadcell4_gain,
                        loadcellInfo.loadcell4_offset,
                        motorInfo.granularSaltHigh,
                        motorInfo.granularSaltLow,
                        motorInfo.fineSaltHigh,
                        motorInfo.fineSaltLow,
                        motorInfo.accelerationTime,
                        motorInfo.granularThreshold,
                        motorInfo.fineThreshold,
                    ];
                })() : [];

                const finalRowData = [...baseData, ...adminData];
                allCsvData.push(finalRowData);
                
                // Debug first row
                if (index === 0) {
                    console.log('🔍 First row data length:', finalRowData.length);
                    console.log('🔍 Header length:', finalHeaders.length);
                    console.log('✅ Schema fields used:', {
                        shiftId: shift.shiftId,
                        machineStatus: shift.machineStatus,
                        totalWeightFilled: shift.totalWeightFilled,
                        efficiency: shift.efficiency,
                        duration: shift.duration
                    });
                }
            });

            allCsvData.push([]);

            // ✅ THỐNG KÊ TỔNG HỢP
            allCsvData.push(['=== THỐNG KÊ TỔNG HỢP ===']);
            const totalWeight = sortedShiftsData.reduce((sum, shift) => sum + Number(shift.totalWeightFilled || 0), 0);
            const totalBottles = sortedShiftsData.reduce((sum, shift) => sum + Number(shift.totalBottlesFilled || 0), 0);
            const totalDuration = sortedShiftsData.reduce((sum, shift) => sum + Number(shift.duration || 0), 0);
            const totalPaused = sortedShiftsData.reduce((sum, shift) => sum + Number(shift.pauseTracking?.totalPausedMinutes || 0), 0);
            const avgEfficiency = sortedShiftsData.reduce((sum, shift) => sum + Number(shift.efficiency || 0), 0) / sortedShiftsData.length;
            const avgFillRate = sortedShiftsData.reduce((sum, shift) => sum + Number(shift.fillRate || 0), 0) / sortedShiftsData.length;
            
            const completedShifts = sortedShiftsData.filter(shift => shift.status === 'complete').length;
            const activeShifts = sortedShiftsData.filter(shift => shift.status === 'active').length;
            const pausedShifts = sortedShiftsData.filter(shift => shift.status === 'paused').length;
            const incompleteShifts = sortedShiftsData.filter(shift => shift.status === 'incomplete').length;
            
            allCsvData.push(['Tổng số ca', sortedShiftsData.length]);
            allCsvData.push(['Ca hoàn thành', completedShifts]);
            allCsvData.push(['Ca đang hoạt động', activeShifts]);
            allCsvData.push(['Ca tạm dừng', pausedShifts]);
            allCsvData.push(['Ca chưa hoàn chỉnh', incompleteShifts]);
            allCsvData.push(['Tỷ lệ hoàn thành (%)', ((completedShifts / sortedShiftsData.length) * 100).toFixed(2)]);
            allCsvData.push(['Tổng khối lượng chiết (kg)', totalWeight.toFixed(2)]);
            allCsvData.push(['Tổng số chai chiết', totalBottles]);
            allCsvData.push(['Tổng thời gian hoạt động (phút)', totalDuration]);
            allCsvData.push(['Tổng thời gian tạm dừng (phút)', totalPaused.toFixed(1)]);
            allCsvData.push(['Hiệu suất trung bình (kg/h)', avgEfficiency.toFixed(2)]);
            allCsvData.push(['Tốc độ chiết trung bình (chai/h)', avgFillRate.toFixed(0)]);
            allCsvData.push(['Thời gian hoạt động TB/ca (phút)', (totalDuration / sortedShiftsData.length).toFixed(1)]);

            const csvContent = allCsvData
                .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                .join('\n');

            const BOM = '\uFEFF';
            const finalContent = BOM + csvContent;

            // ✅ Download
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
            
            console.log(`✅ Exported ${sortedShiftsData.length} shifts using WorkShift schema`);
            console.log(`📊 Columns: ${finalHeaders.length} (${isAdmin ? 'ADMIN' : 'USER'} mode)`);

        } catch (error) {
            console.error('❌ Export error:', error);
            alert('Lỗi khi xuất file CSV: ' + error.message);
        } finally {
            setIsExporting(false);
        }
    }, []);

    return { 
        exportMultipleShifts, 
        isExporting 
    };
};