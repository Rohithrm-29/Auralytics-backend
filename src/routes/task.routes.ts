import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateTaskSchema, UpdateTaskSchema, CreateTaskCommentSchema } from '../utils/schemas';
import { listTasks, getTask, createTask, updateTask, deleteTask, addComment, getStats } from '../controllers/task.controller';

const router = Router();
router.use(authenticate);

router.get('/', listTasks);
router.get('/stats', getStats);
router.get('/:id', getTask);
router.post('/', authorize('hr', 'manager'), validate(CreateTaskSchema), createTask);
router.patch('/:id', validate(UpdateTaskSchema), updateTask);
router.delete('/:id', authorize('hr', 'manager'), deleteTask);
router.post('/:id/comments', validate(CreateTaskCommentSchema), addComment);

export default router;
