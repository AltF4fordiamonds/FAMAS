import { Router } from 'express';
import {
  getVehicleRepairs,
  createVehicleRepair,
  updateRepair,
  deleteRepair,
} from '../controllers/repairController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { repairValidator } from '../validators/validators.js';

const router = Router({ mergeParams: true });

router.use(authenticateToken);

// View repairs: authenticated users
router.get('/vehicles/:vehicleId/repairs', getVehicleRepairs);

// Add repair: Admin only
router.post('/vehicles/:vehicleId/repairs', authorizeRoles('admin'), repairValidator, createVehicleRepair);

// Update/delete repairs: Admin only
router.put('/repairs/:id', authorizeRoles('admin'), updateRepair);
router.delete('/repairs/:id', authorizeRoles('admin'), deleteRepair);

export default router;
