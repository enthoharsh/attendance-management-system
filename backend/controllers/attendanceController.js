import Attendance from '../models/Attendance.js';
import cloudinary from '../config/cloudinary.js';

// Define Office Coordinates and Allowed Radius (in meters)
// Default to DB Mall, MP Nagar, Bhopal if env variables are not provided
const OFFICE_LAT = process.env.OFFICE_LAT ? parseFloat(process.env.OFFICE_LAT) : 23.2333; // DB Mall
const OFFICE_LNG = process.env.OFFICE_LNG ? parseFloat(process.env.OFFICE_LNG) : 77.4333; // DB Mall
const ALLOWED_RADIUS = process.env.ALLOWED_RADIUS ? parseInt(process.env.ALLOWED_RADIUS) : 100; // 100 meters

// Haversine formula to calculate distance between two coordinates in meters
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY === 'your_api_key') {
      return resolve({ secure_url: 'https://via.placeholder.com/300?text=Mock+Selfie' });
    }
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'attendance_selfies' },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    stream.end(buffer);
  });
};


export const punchIn = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      res.status(400);
      throw new Error('Location coordinates are required');
    }

    const distance = getDistance(OFFICE_LAT, OFFICE_LNG, parseFloat(lat), parseFloat(lng));
    if (distance > ALLOWED_RADIUS) {
      res.status(403);
      throw new Error(`You are too far from the office. Distance: ${Math.round(distance)}m. Max allowed: ${ALLOWED_RADIUS}m`);
    }

    if (!req.file) {
      res.status(400);
      throw new Error('Selfie image is required');
    }

    const today = new Date().toISOString().split('T')[0];

    const existingRecord = await Attendance.findOne({ userId: req.user._id, date: today });
    if (existingRecord) {
      res.status(400);
      throw new Error('You have already punched in today');
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer);

    const attendance = await Attendance.create({
      userId: req.user._id,
      date: today,
      punchIn: {
        time: new Date(),
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        selfieUrl: uploadResult.secure_url,
      },
    });

    res.status(201).json(attendance);
  } catch (error) {
    next(error);
  }
};


export const punchOut = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      res.status(400);
      throw new Error('Location coordinates are required');
    }

    const distance = getDistance(OFFICE_LAT, OFFICE_LNG, parseFloat(lat), parseFloat(lng));
    if (distance > ALLOWED_RADIUS) {
      res.status(403);
      throw new Error(`You are too far from the office. Distance: ${Math.round(distance)}m. Max allowed: ${ALLOWED_RADIUS}m`);
    }

    if (!req.file) {
      res.status(400);
      throw new Error('Selfie image is required');
    }

    const today = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOne({ userId: req.user._id, date: today });

    if (!attendance) {
      res.status(404);
      throw new Error('No punch-in record found for today');
    }

    if (attendance.punchOut && attendance.punchOut.time) {
      res.status(400);
      throw new Error('You have already punched out today');
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer);
    const punchOutTime = new Date();

    const diffMs = punchOutTime - new Date(attendance.punchIn.time);
    const hours = diffMs / (1000 * 60 * 60);

    attendance.punchOut = {
      time: punchOutTime,
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      selfieUrl: uploadResult.secure_url,
    };
    attendance.workingHours = Number(hours.toFixed(2));
    attendance.status = hours >= 8 ? 'completed' : 'incomplete';

    await attendance.save();

    res.json(attendance);
  } catch (error) {
    next(error);
  }
};


export const getMyAttendance = async (req, res, next) => {
  try {
    const records = await Attendance.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(records);
  } catch (error) {
    next(error);
  }
};
