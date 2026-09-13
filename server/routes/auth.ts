import { Router } from 'express';
import { login, register, getMe, getPublicVehicles } from '../controllers/authController.js';
import { loginValidator, registerValidator } from '../validators/validators.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', loginValidator, login);
router.post('/register', registerValidator, register);
router.get('/me', authenticateToken, getMe);
router.get('/vehicles', getPublicVehicles);

export default router;
