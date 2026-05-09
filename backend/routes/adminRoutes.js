import express from 'express';
import { 
  getTeamAttendance, 
  validateAttendance,
  getAllUsers,
  updateUserRole,
  assignManager
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/team-attendance', authorize('admin', 'manager'), getTeamAttendance);
router.put('/attendance/:id/validate', authorize('admin', 'manager'), validateAttendance);

router.get('/users', authorize('admin'), getAllUsers);
router.put('/users/:id/role', authorize('admin'), updateUserRole);
router.put('/users/:id/manager', authorize('admin'), assignManager);

export default router;
