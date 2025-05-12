import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Định nghĩa __filename và __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đọc file .env từ thư mục cha của dbServer (Back-end)
dotenv.config({ path: path.join(__dirname, '../../.env') });
// console.log('Đường dẫn tới file .env:', path.join(__dirname, '../../.env'));
// console.log('MONGO_URI:', process.env.MONGO_URI);

// Kết nối DB
await mongoose.connect(process.env.MONGO_URI);

// Xóa dữ liệu cũ (nếu muốn)
await User.deleteMany();

await User.create({
    username: 'Admin',
    email: 'du.vohuudu@gmail.com',
    password: '123456',
    avatar: null,
});

console.log('✅ Seeded user successfully!');
process.exit();