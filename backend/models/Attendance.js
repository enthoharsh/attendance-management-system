import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String, 
    required: true,
  },
  punchIn: {
    time: { type: Date, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    selfieUrl: { type: String, required: true },
  },
  punchOut: {
    time: { type: Date },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    selfieUrl: { type: String },
  },
  workingHours: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['incomplete', 'completed'],
    default: 'incomplete', 
  },
  validation: {
    status: {
      type: String,
      enum: ['pending', 'valid', 'invalid'],
      default: 'pending',
    },
    remarks: { type: String },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }
}, {
  timestamps: true,
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
