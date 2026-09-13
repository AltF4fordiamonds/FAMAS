import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Driver } from '../models/Driver.js';
import { Vehicle } from '../models/Vehicle.js';
import { AuthRequest } from '../middleware/auth.js';
import { seedDatabase } from '../utils/seedData.js';

export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      username,
      email,
      password,
      role,
      firstName,
      lastName,
      phone,
      licenseCategory,
      experienceYears,
      status,
      assignedVehicle,
    } = req.body;
    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existing) {
      res.status(409).json({ error: true, message: 'Username or email already in use' });
      return;
    }

    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'driver',
    });

    if (user.role === 'driver') {
      let vehicleObjId: mongoose.Types.ObjectId | null = null;
      let dStatus: 'available' | 'assigned' | 'inactive' = status || 'available';

      if (assignedVehicle && mongoose.Types.ObjectId.isValid(assignedVehicle)) {
        const vehicleDoc = await Vehicle.findById(assignedVehicle);
        if (vehicleDoc) {
          vehicleObjId = vehicleDoc._id as mongoose.Types.ObjectId;
          dStatus = 'assigned';
        }
      }

      await Driver.create({
        firstName: firstName?.trim() || username.trim(),
        lastName: lastName?.trim() || 'Driver',
        phone: phone?.trim() || '+1 555-0192',
        email: email.toLowerCase().trim(),
        licenseCategory: licenseCategory?.trim() || 'C+E',
        experienceYears: experienceYears !== undefined && experienceYears !== null && experienceYears !== ''
          ? Math.max(0, Number(experienceYears))
          : 5,
        status: dStatus,
        assignedVehicle: vehicleObjId,
        user: user._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!['admin', 'dispatcher', 'driver'].includes(role)) {
      res.status(400).json({ error: true, message: 'Invalid role specified' });
      return;
    }

    if (req.user?._id.toString() === userId && role !== 'admin') {
      res.status(400).json({
        error: true,
        message: 'Administrators cannot demote their own account role.',
      });
      return;
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('-password');
    if (!user) {
      res.status(404).json({ error: true, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.params.id;

    if (req.user?._id.toString() === userId) {
      res.status(400).json({ error: true, message: 'You cannot delete your own account' });
      return;
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      res.status(404).json({ error: true, message: 'User not found' });
      return;
    }

    // Unlink any driver associated with this user
    await Driver.updateMany({ user: userId }, { $set: { user: null } });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const resetDemoData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await seedDatabase(true);
    res.json({
      success: true,
      message: 'Database successfully re-seeded with realistic fleet data.',
    });
  } catch (error) {
    next(error);
  }
};
