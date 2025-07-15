import {
    PlayArrow as RunningIcon,
    Stop as StoppedIcon,
    Water as TankIcon,
    Grain as SaltIcon,
    Scale as WeightIcon,
    LocalDrink as BottleIcon,
    GpsFixed as TargetIcon,
    Memory as AnalogIcon,
    Speed as FrequencyIcon,
    Tune as TuneIcon,
    LinearScale as LoadcellIcon,
    Error as ErrorIcon,
    Engineering as EngineeringIcon

} from '@mui/icons-material';

// MONITORING DATA - Hiển thị cho tất cả user (từ WorkShift fields)
export const MONITORING_DATA_CONFIG = {
    // Trạng thái máy từ processed fields
    machineStatus: {
        title: 'Trạng thái hoạt động máy',
        icon: RunningIcon,
        type: 'status',
        values: {
            0: { label: 'Đang dừng', color: 'warning' },
            1: { label: 'Đang hoạt động', color: 'success' },
            2: { label: 'Tạm dừng', color: 'error' },
            3: { label: 'Bán tự động', color: 'info' }
        }
    },
    saltTankStatus: {
        title: 'Trạng thái bồn cấp muối',
        icon: TankIcon,
        type: 'status',
        values: {
            0: { label: 'Chưa đầy', color: 'warning' },
            1: { label: 'Đã đầy', color: 'success' }
        }
    },
    saltType: {
        title: 'Loại muối đang chiết',
        icon: SaltIcon,
        type: 'status',
        values: {
            0: { label: 'Muối hạt', color: 'info' },
            1: { label: 'Muối mịn', color: 'primary' }
        }
    },
    targetWeight: {
        title: 'Khối lượng mục tiêu',
        icon: TargetIcon,
        type: 'interger',
        unit: 'Kg',
        range: '0 - 1500'
    },
    totalWeightFilled: {
        title: 'Tổng khối lượng đã chiết',
        icon: WeightIcon,
        type: 'float',
        unit: 'kg',
        range: '0 - 99999.99'
    },
    totalBottlesFilled: {
        title: 'Tổng số chai đã chiết',
        icon: BottleIcon,
        type: 'interger',
        unit: 'chai',
        range: '0 - 65535'
    },
    activeLinesCount: {
        title: 'Số line hoạt động',
        icon: AnalogIcon,
        type: 'status',
        values: {
            0: { label: 'Cả 2 line đều dừng', color: 'error' },
            1: { label: 'Chỉ Line A', color: 'warning' },
            2: { label: 'Chỉ Line B', color: 'warning' },
            3: { label: 'Cả 2 line đều hoạt động', color: 'success' }
        }
    },
    errorCode: {
        title: 'Mã lỗi hệ thống',
        icon: ErrorIcon,
        type: 'status',
        values: {
            0: { label: 'Không có lỗi', color: 'success' },
            1: { label: 'Lỗi loadcell', color: 'error' },
            3: { label: 'Lỗi motor', color: 'error' },
            5: { label: 'Lỗi cảm biến', color: 'warning' },
        }
    },
    operatorName: {
        title: 'Tên người vận hành',
        icon: EngineeringIcon,
        type: 'text',
        description: 'Nhân viên phụ trách ca này'
    },
};

export const ADMIN_DATA_CONFIG = {
    // MOTOR CONTROL parameters (từ motorControl object)
    'motorControl.granularSalt.highFrequency': {
        title: 'Tần số cao - Muối hạt',
        icon: FrequencyIcon,
        type: 'interger',
        unit: 'Hz',
        range: '0 - 2000'
    },
    'motorControl.granularSalt.lowFrequency': {
        title: 'Tần số thấp - Muối hạt',
        icon: FrequencyIcon,
        type: 'interger',
        unit: 'Hz',
        range: '0 - 2000'
    },
    'motorControl.fineSalt.highFrequency': {
        title: 'Tần số cao - Muối mịn',
        icon: FrequencyIcon,
        type: 'interger',
        unit: 'Hz',
        range: '0 - 2000'
    },
    'motorControl.fineSalt.lowFrequency': {
        title: 'Tần số thấp - Muối mịn',
        icon: FrequencyIcon,
        type: 'interger',
        unit: 'Hz',
        range: '0 - 2000'
    },
    'motorControl.accelerationTime': {
        title: 'Thời gian tăng/giảm tốc',
        icon: TuneIcon,
        type: 'interger',
        unit: 'ms',
        range: '0 - 2000'
    },
    'motorControl.granularSaltThreshold': {
        title: 'Chênh lệch - Muối hạt',
        icon: TuneIcon,
        type: 'interger',
        unit: 'g',
        range: '0 - 100'
    },
    'motorControl.fineSaltThreshold': {
        title: 'Chênh lệch - Muối mịn',
        icon: TuneIcon,
        type: 'interger',
        unit: 'g',
        range: '0 - 100'
    },

    loadcell1: {
        title: 'Loadcell 1',
        icon: LoadcellIcon,
        type: 'loadcell_single',
        description: 'Cấu hình gain và offset loadcell số 1'
    },
    loadcell2: {
        title: 'Loadcell 2',
        icon: LoadcellIcon,
        type: 'loadcell_single',
        description: 'Cấu hình gain và offset loadcell số 2'
    },
    loadcell3: {
        title: 'Loadcell 3',
        icon: LoadcellIcon,
        type: 'loadcell_single',
        description: 'Cấu hình gain và offset loadcell số 3'
    },
    loadcell4: {
        title: 'Loadcell 4',
        icon: LoadcellIcon,
        type: 'loadcell_single',
        description: 'Cấu hình gain và offset loadcell số 4'
    },
};

// ELPER: Get field title by key (for debugging)
export const getFieldTitle = (key, isAdmin = false) => {
    const config = isAdmin ? ADMIN_DATA_CONFIG : MONITORING_DATA_CONFIG;
    return config[key]?.title || `Unknown field: ${key}`;
};

// HELPER: Get all field keys
export const getAllFieldKeys = (isAdmin = false) => {
    const config = isAdmin ? ADMIN_DATA_CONFIG : MONITORING_DATA_CONFIG;
    return Object.keys(config);
};

// HELPER: Check if field requires admin access
export const isAdminOnlyField = (key) => {
    return Object.keys(ADMIN_DATA_CONFIG).includes(key);
};

// STATUS VALUES mapping (for backward compatibility)
export const STATUS_VALUES = {
    MACHINE_STATUS: {
        0: { label: 'Máy đang dừng', color: 'warning' },
        1: { label: 'Máy đang hoạt động', color: 'success' },
        2: { label: 'Tạm dừng', color: 'info' }
    },
    SALT_TANK_STATUS: {
        0: { label: 'Chưa đầy', color: 'warning' },
        1: { label: 'Đã đầy', color: 'success' }
    },
    SALT_TYPE: {
        0: { label: 'Muối hạt', color: 'info' },
        1: { label: 'Muối mịn', color: 'primary' }
    },
    ACTIVE_LINES: {
        0: { label: 'Cả 2 line đều dừng', color: 'error' },
        1: { label: 'Chỉ Line A', color: 'warning' },
        2: { label: 'Chỉ Line B', color: 'warning' },
        3: { label: 'Cả 2 line đều hoạt động', color: 'success' }
    }
};

export default {
    MONITORING_DATA_CONFIG,
    ADMIN_DATA_CONFIG,
    STATUS_VALUES,
    getFieldTitle,
    getAllFieldKeys,
    isAdminOnlyField
};