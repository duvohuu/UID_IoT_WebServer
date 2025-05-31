import { Grid, Paper, Typography } from "@mui/material";
import { Computer as MachineIcon } from '@mui/icons-material';
import MachineStatusCard from './MachineStatusCard';
import MachineCardSkeleton from '../common/MachineCardSkeleton';

const StatusMachinesGrid = ({ machines, loading, onMachineClick }) => {
    if (loading) {
        return (
            <Grid container spacing={3}>
                {Array.from({ length: 6 }).map((_, index) => (
                    <Grid item xs={12} sm={6} lg={4} key={index}>
                        <MachineCardSkeleton />
                    </Grid>
                ))}
            </Grid>
        );
    }

    if (machines.length === 0) {
        return (
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper 
                        sx={{ 
                            p: 6, 
                            textAlign: 'center',
                            background: 'linear-gradient(135deg, rgba(158, 158, 158, 0.1) 0%, rgba(158, 158, 158, 0.05) 100%)'
                        }}
                    >
                        <MachineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                            Không có máy móc nào
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Hệ thống chưa phát hiện máy móc nào. Vui lòng kiểm tra kết nối HMI.
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        );
    }

    return (
        <Grid container spacing={3}>
            {machines.map((machine, index) => (
                <Grid item xs={12} sm={6} lg={4} key={machine.id || machine.ip || index}>
                    <MachineStatusCard 
                        machine={machine} 
                        index={index}
                        onClick={() => onMachineClick(machine)}
                    />
                </Grid>
            ))}
        </Grid>
    );
};

export default StatusMachinesGrid;