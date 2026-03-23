import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getAuditLogs } from '../controllers/combined.controller';

const router = Router();
router.use(authenticate);

router.get('/', authorize('hr', 'manager'), getAuditLogs);

export default router;
