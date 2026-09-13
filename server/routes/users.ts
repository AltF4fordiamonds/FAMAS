import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUserRole,
  deleteUser,
  resetDemoData,
} from '../controllers/userController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { registerValidator } from '../validators/validators.js';

const router = Router();

router.use(authenticateToken);
// User management is strictly restricted to Admin
router.use(authorizeRoles('admin'));

router.get('/', getUsers);
router.post('/', registerValidator, createUser);
router.put('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);
router.post('/reset-seed', resetDemoData);

export default router;
