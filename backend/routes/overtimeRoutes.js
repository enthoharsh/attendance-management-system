import express from 'express';
import {
  requestOvertime,
  getMyOvertimeRequests,
  getTeamOvertimeRequests,
  reviewOvertime,
} from '../controllers/overtimeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/request', requestOvertime);
router.get('/my-requests', getMyOvertimeRequests);

router.get('/team-requests', authorize('admin', 'manager'), getTeamOvertimeRequests);
router.put('/:id/review', authorize('admin', 'manager'), reviewOvertime);

export default router;
