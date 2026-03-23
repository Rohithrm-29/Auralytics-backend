import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateKraSchema, UpdateKraStatusSchema } from '../utils/schemas';
import { listKra, getKra, createKra, updateKraStatus, deleteKra, getStats } from '../controllers/kra.controller';

const router = Router();
router.use(authenticate);

router.get('/', listKra);
router.get('/stats', getStats);
router.get('/:id', getKra);
router.post('/', authorize('hr', 'manager'), validate(CreateKraSchema), createKra);
router.patch('/:id/status', authorize('hr', 'manager'), validate(UpdateKraStatusSchema), updateKraStatus);
router.delete('/:id', authorize('hr', 'manager'), deleteKra);

export default router;
