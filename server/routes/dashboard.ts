import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// Dashboard stats: Admin and Dispatcher
router.get('/stats', authorizeRoles('admin', 'dispatcher'), getDashboardStats);

export default router;
