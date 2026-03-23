import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getDashboardStats,
  getRecentActivity,
  getPerformanceMatrix,
} from '../controllers/combined.controller';

const router = Router();
router.use(authenticate);

router.get('/stats', authorize('hr', 'manager', 'recruiter'), getDashboardStats);
router.get('/activity', authorize('hr', 'manager', 'recruiter'), getRecentActivity);
router.get('/performance', authorize('hr', 'manager'), getPerformanceMatrix);

export default router;
