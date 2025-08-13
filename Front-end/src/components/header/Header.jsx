import React, { useState } from "react";
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    InputBase,
    Box,
    useTheme,
    Avatar,
    Fade,
    Grow,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import { styled, alpha } from "@mui/material/styles";
import LoginDialog from "../header/LoginDialog";
import AvatarMenu from "../header/AvatarMenu";
import NotificationBell from "../header/NotificationBell"
import useAuth from "../../hooks/useAuth";
import io from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const socket = io(API_URL, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ["websocket", "polling"],
    auth: { token: document.cookie.split("; ").find(row => row.startsWith("authToken="))?.split("=")[1] || null }
});

// Enhanced Search Component với gradient và glassmorphism
const Search = styled("div")(({ theme }) => ({
    position: "relative",
    borderRadius: 25,
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
    backdropFilter: "blur(10px)",
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        transform: "translateY(-1px)",
        boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
    },
    "&:focus-within": {
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.15)} 100%)`,
        border: `1px solid ${theme.palette.primary.main}`,
        transform: "translateY(-2px)",
        boxShadow: `0 12px 35px ${alpha(theme.palette.primary.main, 0.25)}`,
    },
    marginLeft: theme.spacing(2),
    width: "100%",
    maxWidth: 320,
    minWidth: 250,
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: "100%",
    position: "absolute",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme.palette.primary.main,
    transition: "all 0.2s ease",
    zIndex: 1,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: theme.palette.text.primary,
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    width: "100%",
    fontSize: "0.875rem",
    fontWeight: 500,
    "& .MuiInputBase-input": {
        "&::placeholder": {
            color: alpha(theme.palette.text.primary, 0.6),
            opacity: 1,
        },
    },
}));

// Enhanced Logo Container
const LogoContainer = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    transition: "all 0.3s ease",
    cursor: "pointer",
    padding: theme.spacing(0.5, 1),
    borderRadius: 16,
    "&:hover": {
        background: alpha(theme.palette.primary.main, 0.05),
        transform: "scale(1.02)",
    },
}));

// Enhanced Menu Button
const StyledMenuButton = styled(IconButton)(({ theme }) => ({
    marginRight: theme.spacing(2),
    padding: theme.spacing(1),
    borderRadius: 12,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    background: alpha(theme.palette.primary.main, 0.05),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    "&:hover": {
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        transform: "translateY(-1px) scale(1.05)",
        boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
    "& .MuiSvgIcon-root": {
        transition: "all 0.2s ease",
    },
    "&:hover .MuiSvgIcon-root": {
        transform: "rotate(90deg)",
    },
}));

// Enhanced Avatar
const StyledAvatar = styled(Avatar)(({ theme }) => ({
    cursor: "pointer",
    width: 42,
    height: 42,
    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    "&::before": {
        content: '""',
        position: "absolute",
        top: -3,
        left: -3,
        right: -3,
        bottom: -3,
        borderRadius: "50%",
        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        opacity: 0,
        transition: "opacity 0.3s ease",
        zIndex: -1,
    },
    "&:hover": {
        transform: "translateY(-2px) scale(1.1)",
        boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`,
        "&::before": {
            opacity: 1,
        },
    },
}));

// Enhanced Login Typography
const LoginText = styled(Typography)(({ theme }) => ({
    cursor: "pointer",
    fontWeight: 600,
    padding: theme.spacing(1, 2),
    borderRadius: 20,
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    color: "white",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "none",
    position: "relative",
    overflow: "hidden",
    "&::before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: "-100%",
        width: "100%",
        height: "100%",
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
        transition: "left 0.5s ease",
    },
    "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
        "&::before": {
            left: "100%",
        },
    },
    "&:active": {
        transform: "translateY(0px)",
    },
}));

// Enhanced AppBar
const StyledAppBar = styled(AppBar)(({ theme }) => ({
    background: `linear-gradient(135deg, 
        ${alpha(theme.palette.background.paper, 0.95)} 0%, 
        ${alpha(theme.palette.background.default, 0.9)} 100%)`,
    backdropFilter: "blur(20px) saturate(180%)",
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
    color: theme.palette.text.primary,
    zIndex: theme.zIndex.drawer + 1,
    transition: "all 0.3s ease",
}));

const Header = ({ onToggleSidebar, user, setUser }) => {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState(null);
    const [searchFocused, setSearchFocused] = useState(false);
    const { email, setEmail, password, setPassword, openLogin, setOpenLogin, handleLogin, handleLogout } = useAuth(setUser, socket);

    const handleAvatarClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const avatarSrc = user?.avatar ? `${API_URL}${user.avatar}` : undefined;
    console.log("Avatar URL in Header:", avatarSrc);

    return (
        <>
            <StyledAppBar position="fixed">
                <Toolbar sx={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    pl: "16px", 
                    pr: "24px", 
                    minHeight: "70px !important",
                    py: 1
                }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Grow in={true} timeout={800}>
                            <StyledMenuButton color="inherit" onClick={onToggleSidebar}>
                                <MenuIcon />
                            </StyledMenuButton>
                        </Grow>
                        
                        <Fade in={true} timeout={1000}>
                            <LogoContainer>
                                <img 
                                    src="/logo.png" 
                                    alt="logo" 
                                    style={{ 
                                        width: 50, 
                                        height: 50, 
                                        marginRight: 12,
                                        filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.1))"
                                    }} 
                                />
                                <Typography 
                                    variant="h5" 
                                    sx={{
                                        fontWeight: 700,
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                        backgroundClip: "text",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        letterSpacing: "0.5px",
                                    }}
                                >
                                    UID LAB
                                </Typography>
                            </LogoContainer>
                        </Fade>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Fade in={true} timeout={1200}>
                            <Search>
                                <SearchIconWrapper>
                                    <SearchIcon />
                                </SearchIconWrapper>
                                <StyledInputBase
                                    placeholder="Tìm kiếm..."
                                    inputProps={{ "aria-label": "search" }}
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setSearchFocused(false)}
                                />
                            </Search>
                        </Fade>

                         <NotificationBell user={user} />

                        <Fade in={true} timeout={1400}>
                            <Box>
                                {!user ? (
                                    <LoginText
                                        onClick={() => setOpenLogin(true)}
                                    >
                                        Đăng nhập
                                    </LoginText>
                                ) : (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                        <Box sx={{ 
                                            display: "flex", 
                                            flexDirection: "column", 
                                            alignItems: "flex-end",
                                            mr: 1
                                        }}>
                                            <Typography 
                                                variant="body2" 
                                                sx={{ 
                                                    fontWeight: 600,
                                                    color: theme.palette.text.primary,
                                                    lineHeight: 1.2
                                                }}
                                            >
                                                {user.username}
                                            </Typography>
                                            <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                    color: theme.palette.text.secondary,
                                                    fontSize: "0.75rem"
                                                }}
                                            >
                                                Online
                                            </Typography>
                                        </Box>
                                        <StyledAvatar
                                            src={avatarSrc}
                                            alt={user.username}
                                            onClick={handleAvatarClick}
                                        />
                                        <AvatarMenu
                                            anchorEl={anchorEl}
                                            onClose={handleMenuClose}
                                            user={user}
                                            setUser={setUser}
                                            onLogout={handleLogout}
                                        />
                                    </Box>
                                )}
                            </Box>
                        </Fade>
                    </Box>
                </Toolbar>
            </StyledAppBar>
            
            <LoginDialog
                open={openLogin}
                onClose={() => setOpenLogin(false)}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                handleLogin={handleLogin}
            />
        </>
    );
};

export default Header;