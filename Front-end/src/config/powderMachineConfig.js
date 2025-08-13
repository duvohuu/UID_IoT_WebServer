import {
    PlayArrow as RunningIcon,
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
    Engineering as EngineeringIcon,
    TrendingUp as EfficiencyIcon
} from '@mui/icons-material';

// MONITORING DATA - Hiển thị cho tất cả user (từ WorkShift fields)
export const MONITORING_DATA_CONFIG = {
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
    powderTank1Status: {
        title: 'Trạng thái bồn cấp 1',
        icon: TankIcon,
        type: 'status',
        values: {
            0: { label: 'Chưa đầy', color: 'warning' },
            1: { label: 'Đã đầy', color: 'success' }
        }
    },
    powderTank2Status: {
        title: 'Trạng thái bồn cấp 2',
        icon: TankIcon,
        type: 'status',
        values: {
            0: { label: 'Chưa đầy', color: 'warning' },
            1: { label: 'Đã đầy', color: 'success' }
        }
    },
    powderTank3Status: {
        title: 'Trạng thái bồn cấp 3',
        icon: TankIcon,
        type: 'status',
        values: {
            0: { label: 'Chưa đầy', color: 'warning' },
            1: { label: 'Đã đầy', color: 'success' }
        }
    },
    powderTank4Status: {
        title: 'Trạng thái bồn cấp 4',
        icon: TankIcon,
        type: 'status',
        values: {
            0: { label: 'Chưa đầy', color: 'warning' },
            1: { label: 'Đã đầy', color: 'success' }
        }
    },
    powderType: {
        title: 'Loại bột đang chiết',
        icon: SaltIcon,
        type: 'status',
        values: {
            0: { label: 'Cả 2 loại bột', color: 'info' },
            1: { label: 'Bột hành', color: 'primary' },
            2: { label: 'Bột tỏi', color: 'secondary' }
        }
    },
    'lineStatus.lineA': {
        title: 'Trạng thái Line A',
        icon: AnalogIcon,
        type: 'status',
        values: {
            0: { label: 'Line A dừng', color: 'error' },
            1: { label: 'Line A hoạt động', color: 'success' }
        }
    },
    'lineStatus.lineB': {
        title: 'Trạng thái Line B',
        icon: AnalogIcon,
        type: 'status',
        values: {
            0: { label: 'Line B dừng', color: 'error' },
            1: { label: 'Line B hoạt động', color: 'success' }
        }
    },
    errorCode: {
        title: 'Mã lỗi hệ thống',
        icon: ErrorIcon,
        type: 'status',
        values: {
            0: { label: 'Không có lỗi', color: 'success' },
            1: { label: 'Cảm biến nhận sai chai', color: 'error' },
            3: { label: 'Xy lạnh hoạt động lỗi', color: 'error' },
            5: { label: 'Sai loại chai', color: 'error' },
            7: { label: 'Chiết rót không đúng', color: 'error' },
            9: { label: 'Bộ phận khác bị lỗi', color: 'error' }
        }
    },
    'targetWeight.garlicTargetWeight': {
        title: 'Khối lượng bột tỏi cần chiết',
        icon: TargetIcon,
        type: 'interger',
        unit: 'Kg',
        range: '70 - 600'
    },
    'targetWeight.onionTargetWeight': {
        title: 'Khối lượng bột hành cần chiết',
        icon: TargetIcon,
        type: 'interger',
        unit: 'Kg',
        range: '70 - 600'
    },
    'totalWeightFilled.onionPowderWeight': {
        title: 'Khối lượng bột hành đã chiết',
        icon: WeightIcon,
        type: 'float',
        unit: 'kg',
        range: '0 - 99999.99'
    },
    'totalWeightFilled.garlicPowderWeight': {
        title: 'Khối lượng bột tỏi đã chiết',
        icon: WeightIcon,
        type: 'float',
        unit: 'kg',
        range: '0 - 99999.99'
    },
    'totalBottlesFilled.onionPowderBottles': {
        title: 'Số chai bột hành đã chiết',
        icon: BottleIcon,
        type: 'interger',
        unit: 'chai',
        range: '0 - 65535'
    },
    'totalBottlesFilled.garlicPowderBottles': {
        title: 'Số chai bột tỏi đã chiết',
        icon: BottleIcon,
        type: 'interger',
        unit: 'chai',
        range: '0 - 65535'
    },
    'efficiency.onionEfficiency': {
        title: 'Hiệu suất bột hành (kg/giờ)',
        icon: EfficiencyIcon,
        type: 'float',
        unit: 'kg/giờ',
        range: '0 - 99999.99'
    },
    'efficiency.garlicEfficiency': {
        title: 'Hiệu suất bột tỏi (kg/giờ)',
        icon: EfficiencyIcon,
        type: 'float',
        unit: 'kg/giờ',
        range: '0 - 99999.99'   
    }, 
      
    operatorName: {
        title: 'Tên người vận hành',
        icon: EngineeringIcon,
        type: 'text',
        description: 'Nhân viên phụ trách ca này'
    }
};

// ADMIN DATA CONFIG
export const ADMIN_DATA_CONFIG = {
    'motorControl.onionPowder.highFrequency': {
        title: 'Tần số cao - Bột hành',
        icon: FrequencyIcon,
        type: 'interger',
        unit: 'Hz',
        range: '0 - 2000'
    },
    'motorControl.onionPowder.lowFrequency': {
        title: 'Tần số thấp - Bột hành',
        icon: FrequencyIcon,
        type: 'interger',
        unit: 'Hz',
        range: '0 - 2000'
    },
    'motorControl.garlicPowder.highFrequency': {
        title: 'Tần số cao - Bột tỏi',
        icon: FrequencyIcon,
        type: 'interger',
        unit: 'Hz',
        range: '0 - 2000'
    },
    'motorControl.garlicPowder.lowFrequency': {
        title: 'Tần số thấp - Bột tỏi',
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
    'motorControl.onionPowderThreshold': {
        title: 'Chênh lệch - Bột hành',
        icon: TuneIcon,
        type: 'interger',
        unit: 'g',
        range: '0 - 100'
    },
    'motorControl.garlicPowderThreshold': {
        title: 'Chênh lệch - Bột tỏi',
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
    }
};

// HELPER: Get field title by key (for debugging)
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
        2: { label: 'Tạm dừng', color: 'info' },
        3: { label: 'Bán tự động', color: 'info' }
    },
    POWDER_TANK_STATUS: {
        0: { label: 'Chưa đầy', color: 'warning' },
        1: { label: 'Đã đầy', color: 'success' }
    },
    POWDER_TYPE: {
        0: { label: 'Cả 2 loại bột', color: 'info' },
        1: { label: 'Bột hành', color: 'primary' },
        2: { label: 'Bột tỏi', color: 'secondary' }
    },
    LINE_STATUS: {
        0: { label: 'Dừng', color: 'error' },
        1: { label: 'Hoạt động', color: 'success' }
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