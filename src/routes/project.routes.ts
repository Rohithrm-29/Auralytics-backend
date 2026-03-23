// project.routes.ts
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateProjectSchema, UpdateProjectSchema, AssignProjectSchema } from '../utils/schemas';
import {
  listProjects, getProject, createProject, updateProject,
  deleteProject, assignEmployees, removeEmployee, myProjects
} from '../controllers/project.controller';

const router = Router();
router.use(authenticate);

router.get('/', listProjects);
router.get('/my', myProjects);
router.get('/:id', getProject);
router.post('/', authorize('hr'), validate(CreateProjectSchema), createProject);
router.patch('/:id', authorize('hr'), validate(UpdateProjectSchema), updateProject);
router.delete('/:id', authorize('hr'), deleteProject);
router.post('/:id/assign', authorize('hr'), validate(AssignProjectSchema), assignEmployees);
router.delete('/:id/assign/:employeeId', authorize('hr'), removeEmployee);

export default router;
