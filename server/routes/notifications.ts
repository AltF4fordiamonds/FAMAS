import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  refreshNotifications,
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.post('/refresh', refreshNotifications);

export default router;
