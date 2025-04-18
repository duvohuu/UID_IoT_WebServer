import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import deviceRoutes from './routes/deviceRoutes.js';

dotenv.config(); 

connectDB(); 

const app = express(); 

app.use(cors());
app.use(express.json());

app.use('/api/devices', deviceRoutes); 

app.get('/', (req, res) => {
    res.send('🚀 Backend is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
