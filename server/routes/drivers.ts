import { Router } from 'express';
import {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
} from '../controllers/driverController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { driverValidator } from '../validators/validators.js';

const router = Router();

router.use(authenticateToken);

// View list & details
router.get('/', getDrivers);
router.get('/:id', getDriverById);

// Create: Admin only
router.post('/', authorizeRoles('admin'), driverValidator, createDriver);

// Update: Admin and Dispatcher (e.g. vehicle assignment)
router.put('/:id', authorizeRoles('admin', 'dispatcher'), updateDriver);

// Delete: Admin only
router.delete('/:id', authorizeRoles('admin'), deleteDriver);

export default router;
