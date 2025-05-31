// components/common/MachineCardSkeleton.jsx
import { Box, Card, CardContent, Grid } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const MachineCardSkeleton = () => {
    const theme = useTheme();

    const SkeletonBox = ({ width, height, delay = 0 }) => (
        <Box
            sx={{
                width,
                height,
                bgcolor: 'grey.300',
                borderRadius: 1,
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${delay}s`,
                '@keyframes pulse': {
                    '0%': {
                        opacity: 1,
                    },
                    '50%': {
                        opacity: 0.4,
                    },
                    '100%': {
                        opacity: 1,
                    },
                },
            }}
        />
    );

    return (
        <Card 
            sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
                boxShadow: `0 4px 20px ${theme.palette.grey[300]}40`,
                border: `2px solid ${theme.palette.grey[200]}`,
            }}
        >
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header with status */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SkeletonBox width={40} height={40} />
                        <SkeletonBox width={120} height={24} delay={0.1} />
                    </Box>
                    <SkeletonBox width={80} height={24} delay={0.2} />
                </Box>

                {/* HMI IP Information */}
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <SkeletonBox width={16} height={16} delay={0.3} />
                        <SkeletonBox width={60} height={16} delay={0.4} />
                    </Box>
                    <Box sx={{ ml: 3 }}>
                        <SkeletonBox width={140} height={20} delay={0.5} />
                    </Box>
                </Box>

                {/* Machine Info */}
                <Box sx={{ flexGrow: 1, mb: 2 }}>
                    <Grid container spacing={1}>
                        <Grid item xs={6}>
                            <SkeletonBox width={60} height={14} delay={0.6} />
                            <Box sx={{ mt: 0.5 }}>
                                <SkeletonBox width={80} height={16} delay={0.7} />
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <SkeletonBox width={40} height={14} delay={0.8} />
                            <Box sx={{ mt: 0.5 }}>
                                <SkeletonBox width={70} height={16} delay={0.9} />
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {/* Last Update */}
                <Box sx={{ mb: 2 }}>
                    <SkeletonBox width={200} height={14} delay={1.0} />
                </Box>

                {/* Action hint */}
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    mt: 2,
                    pt: 2,
                    borderTop: `1px solid ${theme.palette.divider}`
                }}>
                    <SkeletonBox width={120} height={14} delay={1.1} />
                </Box>
            </CardContent>
        </Card>
    );
};

export default MachineCardSkeleton;