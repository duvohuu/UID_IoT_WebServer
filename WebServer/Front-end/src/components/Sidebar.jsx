import React from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Divider,
} from '@mui/material';
import StatusIcon from '@mui/icons-material/MonitorHeart';
import DevicesIcon from '@mui/icons-material/Devices';
import SettingIcon from '@mui/icons-material/Settings';
import { Link, useLocation } from 'react-router-dom';

const expandedWidth = 200;
const collapsedWidth = 75;

const menuItems = [
    { label: 'Status', path: '/status/', icon: <StatusIcon /> },
    { label: 'Device', path: '/device/', icon: <DevicesIcon /> },
    { label: 'Setting', path: '/setting/', icon: <SettingIcon /> },
];

const Sidebar = ({ open }) => {
    const location = useLocation();

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: open ? expandedWidth : collapsedWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: open ? expandedWidth : collapsedWidth,
                    transition: 'width 0.3s',
                    overflowX: 'hidden',
                    boxSizing: 'border-box',
                    backgroundColor: (theme) => theme.palette.background.sidebar,
                    color: (theme) => theme.palette.text.primary,
                    borderRight: 'none',
                },
            }}
        >
            <Toolbar />
            <Divider />
            <List>
                {menuItems.map((item) => {
                    const selected = location.pathname === item.path;

                    return (
                        <ListItem
                            key={item.path}
                            button
                            component={Link}
                            to={item.path}
                            selected={selected}
                            sx={(theme) => ({
                                minHeight: 50,
                                px: 2,
                                py: 1,
                                justifyContent: open ? 'initial' : 'center',
                                color: theme.palette.text.primary,
                                '&:hover': {
                                    backgroundColor:
                                        theme.palette.action.hover,
                                },
                                '&.Mui-selected': {
                                    backgroundColor:
                                        theme.palette.action.selected,
                                    color: theme.palette.text.primary,
                                },
                            })}
                        >
                            <ListItemIcon
                                sx={(theme) => ({
                                    minWidth: 40, 
                                    mr: open ? 2 : 'auto',
                                    justifyContent: 'center',
                                    color: theme.palette.text.primary,
                                })}
                            >
                                {item.icon}
                            </ListItemIcon>
                            {open && <ListItemText primary={item.label} />}
                        </ListItem>
                    );
                })}
            </List>
        </Drawer>
    );
};

export default Sidebar;
