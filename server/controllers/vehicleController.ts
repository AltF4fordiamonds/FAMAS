import { Request, Response, NextFunction } from 'express';
import { Vehicle } from '../models/Vehicle.js';
import { Driver } from '../models/Driver.js';
import { Trip } from '../models/Trip.js';
import { Repair } from '../models/Repair.js';
import { checkAndGenerateExpirationNotifications } from '../services/notificationService.js';

function computeDocStatus(date: Date | string | undefined) {
  if (!date) return { status: 'unknown', daysRemaining: 0 };
  const d = new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return { status: 'expired', daysRemaining: days };
  if (days <= 30) return { status: 'expiring_soon', daysRemaining: days };
  return { status: 'valid', daysRemaining: days };
}

export const getVehicles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, status, fuelType } = req.query;
    const filter: any = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (fuelType && fuelType !== 'all') {
      filter.fuelType = fuelType;
    }

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$or = [
        { make: searchRegex },
        { model: searchRegex },
        { registrationNumber: searchRegex },
      ];
    }

    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });

    // Enhance with computed expiration status and assigned driver
    const enhancedVehicles = await Promise.all(
      vehicles.map(async (v) => {
        const assignedDriver = await Driver.findOne({ assignedVehicle: v._id }).select('firstName lastName phone');
        const inspectionStatus = computeDocStatus(v.technicalInspection?.validUntil);
        const insuranceStatus = computeDocStatus(v.insurance?.validUntil);

        return {
          ...v.toObject(),
          assignedDriver,
          inspectionStatus,
          insuranceStatus,
        };
      })
    );

    res.json({
      success: true,
      count: enhancedVehicles.length,
      vehicles: enhancedVehicles,
    });
  } catch (error) {
    next(error);
  }
};

export const getVehicleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      res.status(404).json({ error: true, message: 'Vehicle not found' });
      return;
    }

    // Fetch related repairs, assigned driver, and trips
    const repairs = await Repair.find({ vehicle: vehicle._id }).sort({ repairDate: -1 });
    const totalRepairCost = repairs.reduce((acc, r) => acc + (r.cost || 0), 0);
    const assignedDriver = await Driver.findOne({ assignedVehicle: vehicle._id });
    const recentTrips = await Trip.find({ vehicle: vehicle._id })
      .populate('driver', 'firstName lastName phone')
      .sort({ createdAt: -1 })
      .limit(10);

    const inspectionStatus = computeDocStatus(vehicle.technicalInspection?.validUntil);
    const insuranceStatus = computeDocStatus(vehicle.insurance?.validUntil);

    res.json({
      success: true,
      vehicle: {
        ...vehicle.toObject(),
        assignedDriver,
        inspectionStatus,
        insuranceStatus,
        repairs,
        totalRepairCost,
        recentTrips,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await Vehicle.findOne({
      registrationNumber: req.body.registrationNumber.toUpperCase().trim(),
    });

    if (existing) {
      res.status(409).json({
        error: true,
        message: `Vehicle with registration number ${req.body.registrationNumber} already exists.`,
      });
      return;
    }

    const vehicle = await Vehicle.create(req.body);
    await checkAndGenerateExpirationNotifications();

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      vehicle,
    });
  } catch (error) {
    next(error);
  }
};

export const updateVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!vehicle) {
      res.status(404).json({ error: true, message: 'Vehicle not found' });
      return;
    }

    await checkAndGenerateExpirationNotifications();

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      vehicle,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vehicleId = req.params.id;
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      res.status(404).json({ error: true, message: 'Vehicle not found' });
      return;
    }

    // Data Integrity Check: Cannot delete vehicle assigned to active or planned trips
    const activeTrips = await Trip.find({
      vehicle: vehicleId,
      status: { $in: ['in_progress', 'planned'] },
    });

    if (activeTrips.length > 0) {
      res.status(400).json({
        error: true,
        message: `Cannot delete vehicle: It is currently assigned to ${activeTrips.length} active or planned trip(s). Reassign or complete the trips before deleting.`,
      });
      return;
    }

    // Unlink vehicle from any assigned driver
    await Driver.updateMany({ assignedVehicle: vehicleId }, { $set: { assignedVehicle: null, status: 'available' } });

    // Clean up repairs
    await Repair.deleteMany({ vehicle: vehicleId });

    // Delete vehicle
    await Vehicle.findByIdAndDelete(vehicleId);

    res.json({
      success: true,
      message: 'Vehicle and its repair logs deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
