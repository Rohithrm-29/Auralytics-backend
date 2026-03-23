import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateRevenueSchema, UpdateRevenueSchema } from '../utils/schemas';
import { listRevenue, createRevenue, updateRevenue, deleteRevenue, getRevenueTrends, getBudgetVsRevenue } from '../controllers/combined.controller';

const router = Router();
router.use(authenticate);

router.get('/', authorize('hr', 'manager'), listRevenue);
router.get('/trends', authorize('hr', 'manager'), getRevenueTrends);
router.get('/budget-vs-revenue', authorize('hr', 'manager'), getBudgetVsRevenue);
router.post('/', authorize('hr'), validate(CreateRevenueSchema), createRevenue);
router.patch('/:id', authorize('hr'), validate(UpdateRevenueSchema), updateRevenue);
router.delete('/:id', authorize('hr'), deleteRevenue);

export default router;
