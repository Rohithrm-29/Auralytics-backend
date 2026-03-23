// auth.routes.ts
import { Router } from 'express';
import { login, refresh, me } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authRateLimiter } from '../middleware/rateLimiter';
import { LoginSchema, RefreshTokenSchema } from '../utils/schemas';

const router = Router();
router.post('/login', authRateLimiter, validate(LoginSchema), login);
router.post('/refresh', validate(RefreshTokenSchema), refresh);
router.get('/me', authenticate, me);
export default router;
