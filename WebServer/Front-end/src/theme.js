// theme.js
import { createTheme } from '@mui/material/styles';

export const getTheme = (mode = 'light') =>
    createTheme({
        palette: {
            mode,
            background: {
                default: mode === 'light' ? '#f5f5f5' : '#0a0a0a',   // main content
                sidebar: mode === 'light' ? '#f0f0f0' : '#111418',   // sidebar dark
                header:  mode === 'light' ? '#ffffff' : '#12161b',   // header tách biệt
            },
            text: {
                primary: mode === 'light' ? '#1e1e1e' : '#c9d1d9',   // GitHub text
                secondary: mode === 'light' ? '#555' : '#8b949e',
            },
            action: {
                hover: mode === 'light' ? '#e0e0e0' : '#30363d',
                selected: mode === 'light' ? '#d0d0d0' : '#21262d',
            },
        },
        typography: {
            fontFamily: `'Inter', sans-serif`,
        },
    });
