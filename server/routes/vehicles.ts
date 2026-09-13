import { Router } from 'express';
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../controllers/vehicleController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { vehicleValidator } from '../validators/validators.js';

const router = Router();

// All vehicle routes require authentication
router.use(authenticateToken);

// View list & details: admin, dispatcher, driver
router.get('/', getVehicles);
router.get('/:id', getVehicleById);

// Create, update, delete: Admin only
router.post('/', authorizeRoles('admin'), vehicleValidator, createVehicle);
router.put('/:id', authorizeRoles('admin'), vehicleValidator, updateVehicle);
router.delete('/:id', authorizeRoles('admin'), deleteVehicle);

export default router;
