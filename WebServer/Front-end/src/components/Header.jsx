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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import { styled, alpha } from "@mui/material/styles";
import LoginDialog from "./LoginDialog";
import AvatarMenu from "./AvatarMenu";
import useAuth from "../hooks/useAuth";
import io from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const socket = io(API_URL, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ["websocket", "polling"],
    auth: { token: document.cookie.split("; ").find(row => row.startsWith("authToken="))?.split("=")[1] || null }
});

const Search = styled("div")(({ theme }) => ({
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.text.primary, 0.05),
    "&:hover": {
      backgroundColor: alpha(theme.palette.text.primary, 0.1),
    },
    marginLeft: theme.spacing(2),
    width: "100%",
    maxWidth: 300,
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: "100%",
    position: "absolute",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme.palette.text.secondary,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: theme.palette.text.primary,
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    width: "100%",
}));

const Header = ({ onToggleSidebar, user, setUser }) => {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState(null);
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
          <AppBar
              position="fixed"
              sx={{
                  backgroundColor: theme.palette.background.header,
                  color: theme.palette.text.primary,
                  zIndex: theme.zIndex.drawer + 1,
                  boxShadow: "none",
              }}
          >
              <Toolbar sx={{ display: "flex", justifyContent: "space-between", pl: "0px" }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <IconButton color="inherit" onClick={onToggleSidebar} sx={{ mr: 2, p: 0 }}>
                    <MenuIcon />
                  </IconButton>
                  <img src="/logo.png" alt="logo" style={{ width: 60, height: 60, marginRight: 10 }} />
                  <Typography variant="h6" fontWeight="bold">
                    UID LAB
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Search>
                    <SearchIconWrapper>
                      <SearchIcon />
                    </SearchIconWrapper>
                    <StyledInputBase
                      placeholder="Search..."
                      inputProps={{ "aria-label": "search" }}
                    />
                  </Search>
                  {!user ? (
                    <Typography
                      color="inherit"
                      onClick={() => setOpenLogin(true)}
                      sx={{ cursor: "pointer" }}
                    >
                      Đăng nhập
                    </Typography>
                  ) : (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar
                        src={avatarSrc}
                        alt={user.username}
                        onClick={handleAvatarClick}
                        sx={{ cursor: "pointer", width: 40, height: 40 }}
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
              </Toolbar>
          </AppBar>
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