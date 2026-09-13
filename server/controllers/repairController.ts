import { Request, Response, NextFunction } from 'express';
import { Repair } from '../models/Repair.js';
import { Vehicle } from '../models/Vehicle.js';

export const getVehicleRepairs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { vehicleId } = req.params;
    const repairs = await Repair.find({ vehicle: vehicleId }).sort({ repairDate: -1 });
    const totalCost = repairs.reduce((acc, r) => acc + (r.cost || 0), 0);

    res.json({
      success: true,
      count: repairs.length,
      totalCost,
      repairs,
    });
  } catch (error) {
    next(error);
  }
};

export const createVehicleRepair = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      res.status(404).json({ error: true, message: 'Vehicle not found' });
      return;
    }

    const repair = await Repair.create({
      ...req.body,
      vehicle: vehicleId,
    });

    // If repair recorded higher mileage, update vehicle currentMileage
    if (repair.mileage && repair.mileage > vehicle.currentMileage) {
      await Vehicle.findByIdAndUpdate(vehicleId, { currentMileage: repair.mileage });
    }

    res.status(201).json({
      success: true,
      message: 'Repair record added successfully',
      repair,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRepair = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const repair = await Repair.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!repair) {
      res.status(404).json({ error: true, message: 'Repair record not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Repair record updated successfully',
      repair,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRepair = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const repair = await Repair.findByIdAndDelete(req.params.id);
    if (!repair) {
      res.status(404).json({ error: true, message: 'Repair record not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Repair record deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
