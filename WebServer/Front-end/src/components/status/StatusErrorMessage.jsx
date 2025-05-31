import { Paper, Typography } from "@mui/material";
import { Error as ErrorIcon } from '@mui/icons-material';

const StatusErrorMessage = ({ error }) => {
    return (
        <Paper 
            sx={{ 
                p: 3, 
                mb: 3, 
                bgcolor: 'error.light',
                color: 'error.contrastText',
                textAlign: 'center'
            }}
        >
            <ErrorIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body1">
                {error}
            </Typography>
        </Paper>
    );
};

export default StatusErrorMessage;