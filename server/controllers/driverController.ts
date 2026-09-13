import { Request, Response, NextFunction } from 'express';
import { Driver } from '../models/Driver.js';
import { Vehicle } from '../models/Vehicle.js';
import { Trip } from '../models/Trip.js';

export const getDrivers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, status, licenseCategory } = req.query;
    const filter: any = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (licenseCategory && licenseCategory !== 'all') {
      filter.licenseCategory = licenseCategory;
    }

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const drivers = await Driver.find(filter)
      .populate('assignedVehicle', 'make model registrationNumber status')
      .populate('user', 'username email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: drivers.length,
      drivers,
    });
  } catch (error) {
    next(error);
  }
};

export const getDriverById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('assignedVehicle')
      .populate('user', 'username email role');

    if (!driver) {
      res.status(404).json({ error: true, message: 'Driver not found' });
      return;
    }

    // Fetch assigned trips
    const trips = await Trip.find({ driver: driver._id })
      .populate('vehicle', 'make model registrationNumber status')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      driver: {
        ...driver.toObject(),
        trips,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await Driver.findOne({ email: req.body.email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({
        error: true,
        message: `Driver with email ${req.body.email} already exists.`,
      });
      return;
    }

    // If vehicle assignment provided, verify vehicle is available or existing
    if (req.body.assignedVehicle) {
      const vehicle = await Vehicle.findById(req.body.assignedVehicle);
      if (!vehicle) {
        res.status(400).json({ error: true, message: 'Selected vehicle does not exist' });
        return;
      }
      req.body.status = 'assigned';
    }

    const driver = await Driver.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Driver profile created successfully',
      driver,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const driverId = req.params.id;
    const oldDriver = await Driver.findById(driverId);
    if (!oldDriver) {
      res.status(404).json({ error: true, message: 'Driver not found' });
      return;
    }

    const updates = { ...req.body };

    // Handle vehicle assignment updates
    if (updates.assignedVehicle) {
      const vehicle = await Vehicle.findById(updates.assignedVehicle);
      if (!vehicle) {
        res.status(400).json({ error: true, message: 'Assigned vehicle does not exist' });
        return;
      }
      updates.status = 'assigned';
    } else if (updates.assignedVehicle === null && oldDriver.assignedVehicle) {
      updates.status = 'available';
    }

    const driver = await Driver.findByIdAndUpdate(driverId, updates, {
      new: true,
      runValidators: true,
    }).populate('assignedVehicle');

    res.json({
      success: true,
      message: 'Driver updated successfully',
      driver,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const driverId = req.params.id;
    const driver = await Driver.findById(driverId);
    if (!driver) {
      res.status(404).json({ error: true, message: 'Driver not found' });
      return;
    }

    // Check active trips
    const activeTrips = await Trip.find({
      driver: driverId,
      status: { $in: ['in_progress', 'planned'] },
    });

    if (activeTrips.length > 0) {
      res.status(400).json({
        error: true,
        message: `Cannot delete driver: Driver has ${activeTrips.length} active or planned trip(s). Reassign them first.`,
      });
      return;
    }

    await Driver.findByIdAndDelete(driverId);

    res.json({
      success: true,
      message: 'Driver deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
