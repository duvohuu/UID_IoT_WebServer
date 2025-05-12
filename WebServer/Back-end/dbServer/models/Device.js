import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['on', 'off'], default: 'off' },
  updatedAt: { type: Date, default: Date.now }
});

const Device = mongoose.model('Device', deviceSchema, 'GateWay');
export default Device;
