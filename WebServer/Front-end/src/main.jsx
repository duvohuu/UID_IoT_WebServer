import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import {CssBaseline } from '@mui/material';


ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Router>
            <CssBaseline /> {/* Normalize CSS and apply Material UI baseline styles */}
            <App />
        </Router>
    </React.StrictMode>,
)
