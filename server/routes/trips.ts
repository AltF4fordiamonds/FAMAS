import { Router } from 'express';
import {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
} from '../controllers/tripController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { tripValidator } from '../validators/validators.js';

const router = Router();

router.use(authenticateToken);

// View list: drivers only see their own; admin & dispatcher see all
router.get('/', getTrips);
router.get('/:id', getTripById);

// Create trip: Admin and Dispatcher
router.post('/', authorizeRoles('admin', 'dispatcher'), tripValidator, createTrip);

// Update trip: Admin, Dispatcher, or Driver (driver limited to status/distance/fuel)
router.put('/:id', authorizeRoles('admin', 'dispatcher', 'driver'), updateTrip);

// Delete trip: Admin only
router.delete('/:id', authorizeRoles('admin'), deleteTrip);

export default router;
