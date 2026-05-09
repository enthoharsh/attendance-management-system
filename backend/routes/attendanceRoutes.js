import express from 'express';
import { punchIn, punchOut, getMyAttendance } from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/punch-in', protect, upload.single('selfie'), punchIn);
router.put('/punch-out', protect, upload.single('selfie'), punchOut);
router.get('/my-records', protect, getMyAttendance);

export default router;
