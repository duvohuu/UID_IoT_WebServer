import React, { useState } from 'react';
import { 
    Box, 
    Grid, 
    Typography, 
    Card, 
    Skeleton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Alert,
    Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';
import MachineStatusCard from '../machine/MachineStatusCard'; 
import { useSnackbar } from '../../context/SnackbarContext';
import { deleteMachine } from '../../api/machineAPI'; 

const StatusMachinesGrid = ({ machines, loading, user, onMachineClick, onMachineDelete }) => {
    const theme = useTheme();
    const { showSnackbar } = useSnackbar();
    const [deleteDialog, setDeleteDialog] = useState({ open: false, machine: null });

    const handleDeleteClick = (machine) => {
        setDeleteDialog({ open: true, machine });
    };

    const handleDeleteConfirm = async () => {
        const { machine: machineToDelete } = deleteDialog;
        if (!machineToDelete) return;

        try {
            console.log('🗑️ Deleting machine:', machineToDelete.machineId);
            
            const result = await deleteMachine(machineToDelete._id);
            
            if (result.success) {
                console.log('✅ Delete successful:', result.data);
                showSnackbar(`Đã xóa máy ${machineToDelete.machineId || machineToDelete.name}`, 'success');
                
                if (onMachineDelete) {
                    onMachineDelete(machineToDelete);
                }
            } else {
                console.error('❌ Delete failed:', result.message);
                showSnackbar(result.message, 'error');
            }
            
        } catch (error) {
            console.error('❌ Delete machine error:', error);
            showSnackbar('Lỗi khi xóa máy', 'error');
        } finally {
            setDeleteDialog({ open: false, machine: null });
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ open: false, machine: null });
    };

    // Loading skeleton - 4 skeletons cho 4 máy
    if (loading) {
        return (
            <Box>
                <Typography 
                    variant="h5" 
                    sx={{ 
                        mb: 3, 
                        fontWeight: 700,
                        color: theme.palette.text.primary
                    }}
                >
                    Danh Sách Máy Móc
                </Typography>
                <Grid container spacing={2}> {/* Giảm spacing */}
                    {Array.from({ length: 4 }).map((_, index) => ( // 4 skeleton thay vì 3
                        <Grid item xs={12} sm={6} md={3} lg={3} xl={3} key={index}> {/* md={3} cho 4 cột */}
                            <Card sx={{ height: user?.role === 'admin' ? 380 : 320, p: 2 }}>
                                <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
                                <Skeleton variant="text" height={32} sx={{ mb: 1 }} />
                                <Skeleton variant="text" height={20} sx={{ mb: 2 }} />
                                <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
                                <Skeleton variant="rectangular" height={40} />
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
        <Typography 
            variant="h5" 
            sx={{ 
                mb: 3, 
                fontWeight: 700,
                color: theme.palette.text.primary
            }}
        >
            {user?.role === 'admin' 
                ? `Tất Cả Máy Móc Trong Hệ Thống (${machines.length})`
                : `Máy Móc Của Bạn (${machines.length})`
            }
        </Typography>
        
        {/* Sử dụng CSS Grid thay vì Material-UI Grid */}
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',                   // 1 cột mobile
                    sm: 'repeat(2, 1fr)',        // 2 cột tablet
                    md: 'repeat(4, 1fr)',        // 4 cột desktop - FORCE 4 columns
                    lg: 'repeat(4, 1fr)',        // 4 cột large
                    xl: 'repeat(4, 1fr)',        // 4 cột extra large
                },
                gap: 2,
                width: '100%',
                maxWidth: '100%',
                '& > *': {
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,  
                },
                '@media (min-width: 900px)': {  // Force 4 columns từ 900px trở lên
                    gridTemplateColumns: 'repeat(4, 1fr)',
                }
            }}
        >
            {machines.map((machine) => (
                <Box key={machine._id || machine.id}>
                    <MachineStatusCard
                        machine={machine}
                        user={user}
                        onClick={onMachineClick}
                        onDelete={user?.role === 'admin' ? handleDeleteClick : undefined}
                    />
                </Box>
            ))}
        </Box>

            {/* Delete Confirmation Dialog - unchanged */}
            <Dialog 
                open={deleteDialog.open} 
                onClose={handleDeleteCancel}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ 
                    bgcolor: 'error.main', 
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DeleteIcon />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Xóa Máy Móc
                        </Typography>
                    </Box>
                    <IconButton 
                        onClick={handleDeleteCancel}
                        sx={{ color: 'white' }}
                        size="small"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 3 }}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Hành động này không thể hoàn tác!
                    </Alert>
                    
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Bạn có chắc chắn muốn xóa máy này không?
                    </Typography>
                    
                    <Box sx={{ 
                        p: 2, 
                        backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)'  
                        : 'grey.50',                   
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.12)'  
                            : 'grey.200'  
                    }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {deleteDialog.machine?.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip 
                                label={deleteDialog.machine?.machineId} 
                                size="small" 
                                color="primary"
                            />
                            <Chip 
                                label={deleteDialog.machine?.type} 
                                size="small" 
                                variant="outlined"
                            />
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button 
                        onClick={handleDeleteCancel}
                        variant="outlined"
                        sx={{ minWidth: 100 }}
                    >
                        Hủy
                    </Button>
                    <Button 
                        onClick={handleDeleteConfirm} 
                        color="error" 
                        variant="contained"
                        startIcon={<DeleteIcon />}
                        sx={{ minWidth: 120 }}
                    >
                        Xóa
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default StatusMachinesGrid;