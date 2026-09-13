import { Response, NextFunction } from 'express';
import { Trip, TripStatus } from '../models/Trip.js';
import { Vehicle } from '../models/Vehicle.js';
import { Driver } from '../models/Driver.js';
import { AuthRequest } from '../middleware/auth.js';

export const getTrips = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, driver, vehicle, search } = req.query;
    const filter: any = {};

    // Role check: If driver, ONLY show trips assigned to this driver
    if (req.user?.role === 'driver') {
      const driverDoc = await Driver.findOne({ user: req.user._id });
      if (!driverDoc) {
        res.json({ success: true, count: 0, trips: [] });
        return;
      }
      filter.driver = driverDoc._id;
    } else {
      if (driver && driver !== 'all') {
        filter.driver = driver;
      }
      if (vehicle && vehicle !== 'all') {
        filter.vehicle = vehicle;
      }
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$or = [
        { origin: searchRegex },
        { destination: searchRegex },
        { cargo: searchRegex },
      ];
    }

    const trips = await Trip.find(filter)
      .populate('driver', 'firstName lastName phone email licenseCategory')
      .populate('vehicle', 'make model registrationNumber status fuelType')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: trips.length,
      trips,
    });
  } catch (error) {
    next(error);
  }
};

export const getTripById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('driver')
      .populate('vehicle');

    if (!trip) {
      res.status(404).json({ error: true, message: 'Trip not found' });
      return;
    }

    // If driver, ensure the trip belongs to them
    if (req.user?.role === 'driver') {
      const driverDoc = await Driver.findOne({ user: req.user._id });
      if (!driverDoc || trip.driver._id.toString() !== driverDoc._id.toString()) {
        res.status(403).json({ error: true, message: 'Access denied to this trip' });
        return;
      }
    }

    res.json({
      success: true,
      trip,
    });
  } catch (error) {
    next(error);
  }
};

export const createTrip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { origin, destination, cargo, deadline, driver, vehicle, status, distance, fuelUsed } = req.body;

    // 1. Validate Vehicle
    const vehicleDoc = await Vehicle.findById(vehicle);
    if (!vehicleDoc) {
      res.status(400).json({ error: true, message: 'Selected vehicle does not exist' });
      return;
    }

    if (vehicleDoc.status === 'maintenance' || vehicleDoc.status === 'inactive') {
      res.status(400).json({
        error: true,
        message: `Cannot assign vehicle ${vehicleDoc.registrationNumber} because its status is '${vehicleDoc.status}'`,
      });
      return;
    }

    // Check if vehicle is already in an active trip
    const activeVehicleTrip = await Trip.findOne({
      vehicle: vehicleDoc._id,
      status: 'in_progress',
    });
    if (activeVehicleTrip && status === 'in_progress') {
      res.status(400).json({
        error: true,
        message: `Vehicle ${vehicleDoc.registrationNumber} is already currently engaged in an active in-progress trip.`,
      });
      return;
    }

    // 2. Validate Driver
    const driverDoc = await Driver.findById(driver);
    if (!driverDoc) {
      res.status(400).json({ error: true, message: 'Selected driver does not exist' });
      return;
    }

    if (driverDoc.status === 'inactive') {
      res.status(400).json({
        error: true,
        message: `Cannot assign driver ${driverDoc.firstName} ${driverDoc.lastName} because the driver is marked inactive.`,
      });
      return;
    }

    const activeDriverTrip = await Trip.findOne({
      driver: driverDoc._id,
      status: 'in_progress',
    });
    if (activeDriverTrip && status === 'in_progress') {
      res.status(400).json({
        error: true,
        message: `Driver ${driverDoc.firstName} ${driverDoc.lastName} is already assigned to an in-progress trip.`,
      });
      return;
    }

    const trip = await Trip.create({
      origin,
      destination,
      cargo,
      deadline,
      driver,
      vehicle,
      status: status || 'planned',
      distance: distance || 0,
      fuelUsed: fuelUsed || 0,
    });

    // Update vehicle and driver statuses if trip is active
    if (trip.status === 'in_progress') {
      await Vehicle.findByIdAndUpdate(vehicle, { status: 'in_use' });
      await Driver.findByIdAndUpdate(driver, { status: 'assigned' });
    }

    const populatedTrip = await Trip.findById(trip._id)
      .populate('driver', 'firstName lastName phone')
      .populate('vehicle', 'make model registrationNumber status');

    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      trip: populatedTrip,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTrip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tripId = req.params.id;
    const oldTrip = await Trip.findById(tripId);

    if (!oldTrip) {
      res.status(404).json({ error: true, message: 'Trip not found' });
      return;
    }

    // Driver specific permission checks
    if (req.user?.role === 'driver') {
      const driverDoc = await Driver.findOne({ user: req.user._id });
      if (!driverDoc || oldTrip.driver.toString() !== driverDoc._id.toString()) {
        res.status(403).json({ error: true, message: 'Access denied: You can only update your own assigned trips.' });
        return;
      }

      const driverAllowedStatuses = ['planned', 'in_progress', 'completed'];
      if (req.body.status && !driverAllowedStatuses.includes(req.body.status)) {
        res.status(400).json({
          error: true,
          message: 'Drivers can only set trip status to planned, in progress, or completed.',
        });
        return;
      }

      // Drivers can only update status, distance, and fuelUsed
      const allowedUpdates: any = {};
      if (req.body.status) allowedUpdates.status = req.body.status;
      if (req.body.distance !== undefined) allowedUpdates.distance = req.body.distance;
      if (req.body.fuelUsed !== undefined) allowedUpdates.fuelUsed = req.body.fuelUsed;

      const updated = await Trip.findByIdAndUpdate(tripId, allowedUpdates, { new: true })
        .populate('driver')
        .populate('vehicle');

      // Adjust vehicle status if completed
      if (req.body.status === 'completed' || req.body.status === 'cancelled') {
        if (req.body.status === 'completed' && oldTrip.status !== 'completed') {
          const tripDistance = Number(req.body.distance ?? oldTrip.distance) || 0;
          if (tripDistance > 0) {
            await Vehicle.findByIdAndUpdate(oldTrip.vehicle, { $inc: { currentMileage: tripDistance } });
          }
        }
        await Vehicle.findByIdAndUpdate(oldTrip.vehicle, { status: 'available' });
        await Driver.findByIdAndUpdate(oldTrip.driver, { status: 'available' });
      } else if (req.body.status === 'in_progress') {
        await Vehicle.findByIdAndUpdate(oldTrip.vehicle, { status: 'in_use' });
        await Driver.findByIdAndUpdate(oldTrip.driver, { status: 'assigned' });
      }

      res.json({ success: true, message: 'Trip updated successfully', trip: updated });
      return;
    }

    // Admin & Dispatcher full update
    const updated = await Trip.findByIdAndUpdate(tripId, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('driver', 'firstName lastName phone')
      .populate('vehicle', 'make model registrationNumber status');

    // Handle vehicle/driver status synchronization and odometer update
    const newStatus = req.body.status;
    if (newStatus && newStatus !== oldTrip.status) {
      if (newStatus === 'in_progress') {
        await Vehicle.findByIdAndUpdate(updated?.vehicle, { status: 'in_use' });
        await Driver.findByIdAndUpdate(updated?.driver, { status: 'assigned' });
      } else if (newStatus === 'completed' || newStatus === 'cancelled') {
        if (newStatus === 'completed') {
          const tripDistance = Number(req.body.distance ?? oldTrip.distance) || 0;
          if (tripDistance > 0) {
            await Vehicle.findByIdAndUpdate(oldTrip.vehicle, { $inc: { currentMileage: tripDistance } });
          }
        }
        // Only set available if no other active trip uses this vehicle
        const otherActive = await Trip.findOne({
          _id: { $ne: tripId },
          vehicle: oldTrip.vehicle,
          status: 'in_progress',
        });
        if (!otherActive) {
          await Vehicle.findByIdAndUpdate(oldTrip.vehicle, { status: 'available' });
        }
        await Driver.findByIdAndUpdate(oldTrip.driver, { status: 'available' });
      }
    }

    res.json({
      success: true,
      message: 'Trip updated successfully',
      trip: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTrip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      res.status(404).json({ error: true, message: 'Trip not found' });
      return;
    }

    if (trip.status === 'in_progress') {
      res.status(400).json({
        error: true,
        message: 'Cannot delete an in-progress trip. Cancel or complete it first.',
      });
      return;
    }

    await Trip.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Trip deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
