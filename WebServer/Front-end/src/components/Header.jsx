import React from 'react';
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    InputBase,
    Box,
    useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import { styled, alpha } from '@mui/material/styles';

// Styled Search Box
const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.text.primary, 0.05),
    '&:hover': {
        backgroundColor: alpha(theme.palette.text.primary, 0.1),
    },
    marginLeft: theme.spacing(2),
    width: '100%',
    maxWidth: 300,
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.text.secondary,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: theme.palette.text.primary,
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    width: '100%',
}));

const Header = ({ onToggleSidebar }) => {
    const theme = useTheme(); // 👈 Lấy theme hiện tại

    return (
        <AppBar
            position="fixed"
            sx={{
                backgroundColor: theme.palette.background.header,
                color: theme.palette.text.primary,
                zIndex: theme.zIndex.drawer + 1,
                boxShadow: 'none',
            }}
        >
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', pl: `${open ? 1 : 0}px` }}>
                {/* Logo + Nút Menu */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                    color="inherit"
                    aria-label="menu"
                    onClick={onToggleSidebar}
                    sx={{mr: 2, p: 0 }} 
                >
                    <MenuIcon />
                </IconButton>

                    <img
                        src="/logo.png"
                        alt="logo"
                        style={{ width: 60, height: 60, marginRight: 10}}
                    />
                    <Typography variant="h6" noWrap fontWeight={'bold'}>
                        UID LAB
                    </Typography>
                </Box>

                {/* Search */}
                <Search>
                    <SearchIconWrapper>
                        <SearchIcon />
                    </SearchIconWrapper>
                    <StyledInputBase
                        placeholder="Search..."
                        inputProps={{ 'aria-label': 'search' }}
                    />
                </Search>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
