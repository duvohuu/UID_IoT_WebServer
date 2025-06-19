import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// =====================================================
// CHỈ CẦN THAY ĐỔI THÔNG TIN USER Ở ĐÂY
// =====================================================

const CONFIG = {
    username: 'hotieuviet',                  
    email: 'hotieuviet@gmail.com',           
    password: 'hotieuviet_UID',                    
    role: 'user'                           
};

// =====================================================

const createUser = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        // ======= TẠO USER =======
        console.log(`\nCreating user: ${CONFIG.username}...`);
        
        // Kiểm tra email đã tồn tại chưa
        const existingUser = await User.findOne({ email: CONFIG.email });
        if (existingUser) {
            console.log('Email already exists!');
            console.log(`Existing user: ${existingUser.username} (${existingUser.email})`);
            return;
        }
        
        // Tạo user mới
        const newUser = new User({
            userId: CONFIG.email.split('@')[0],
            username: CONFIG.username,
            email: CONFIG.email,
            password: CONFIG.password,
            role: CONFIG.role,
            avatar: null
        });
        await newUser.save();
        // ======= THÀNH CÔNG =======
        console.log('\nSUCCESS! User created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Username: ${newUser.username}`);
        console.log(`Email: ${newUser.email}`);
        console.log(`Password: ${CONFIG.password}`);
        console.log(`Role: ${newUser.role}`);
        console.log(`User ID: ${newUser.userId}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('User can now login with the email and password above!');
        
    } catch (error) {
        console.error('Error occurred:', error.message);
        if (error.code === 11000) {
            console.log('This is usually caused by duplicate email');
        }
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
};

// Chạy function
createUser();