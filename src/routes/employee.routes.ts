import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateEmployeeSchema, UpdateEmployeeSchema } from '../utils/schemas';
import {
  listEmployees, getEmployee, createEmployee, updateEmployee,
  deleteEmployee, getProfile, getSubordinates
} from '../controllers/employee.controller';

const router = Router();
router.use(authenticate);

router.get('/', authorize('hr', 'manager', 'senior_designer', 'recruiter', 'designer'), listEmployees);
router.get('/profile/me', getProfile);
router.get('/:id/profile', getProfile);
router.get('/:id/subordinates', authorize('hr', 'manager', 'senior_designer'), getSubordinates);
router.get('/:id', authorize('hr', 'manager', 'senior_designer', 'recruiter', 'designer'), getEmployee);
router.post('/', authorize('hr'), validate(CreateEmployeeSchema), createEmployee);
router.patch('/:id', authorize('hr'), validate(UpdateEmployeeSchema), updateEmployee);
router.delete('/:id', authorize('hr'), deleteEmployee);

export default router;
