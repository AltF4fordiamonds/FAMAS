import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User.js';
import { Driver } from '../models/Driver.js';
import { Vehicle } from '../models/Vehicle.js';
import { AuthRequest } from '../middleware/auth.js';
import { getJwtSecret } from '../config/auth.js';
import { saveDatabaseSnapshot } from '../utils/dataPersistence.js';

export const getPublicVehicles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vehicles = await Vehicle.find().select('make model registrationNumber status year fuelType').sort({ registrationNumber: 1 });
    res.json({
      success: true,
      vehicles,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const identifier = (req.body.email || req.body.login || req.body.username || '').toString().trim();
    const { password } = req.body;

    if (!identifier) {
      res.status(400).json({
        error: true,
        message: 'Моля, въведете вашия имейл адрес.',
      });
      return;
    }

    if (!password) {
      res.status(400).json({
        error: true,
        message: 'Моля, въведете парола.',
      });
      return;
    }

    // Search user by email address (case-insensitive) or username
    const normalizedIdentifier = identifier.toLowerCase();
    const user = await User.findOne({
      $or: [
        { email: normalizedIdentifier },
        { username: normalizedIdentifier },
      ],
    });

    if (!user) {
      res.status(401).json({
        error: true,
        message: `Не е намерен потребителски акаунт с имейл "${identifier}". Моля проверете имейла или се регистрирайте.`,
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        error: true,
        message: 'Въведената парола за този имейл адрес е невалидна. Моля опитайте отново.',
      });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    // If role is driver, fetch associated driver profile
    let driverProfile = null;
    if (user.role === 'driver') {
      driverProfile = await Driver.findOne({ user: user._id }).populate('assignedVehicle');
    }

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        driverProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

    const count = await User.countDocuments();
    const isAdminCaller = req.user && req.user.role === 'admin';

    // Role assignment: First registered user is admin; admins can create any role.
    // Public registrations default to driver or dispatcher.
    let assignedRole: 'admin' | 'dispatcher' | 'driver' = 'driver';
    if (count === 0) {
      assignedRole = 'admin';
    } else if (isAdminCaller) {
      assignedRole = (role as any) || 'driver';
    } else {
      assignedRole = role === 'dispatcher' ? 'dispatcher' : 'driver';
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { username: username.toLowerCase().trim() }],
    });

    if (existingUser) {
      res.status(409).json({
        error: true,
        message: 'Username or email is already registered',
      });
      return;
    }

    const newUser = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
    });

    // If registered as driver, create corresponding driver profile with all requested parameters
    let driverProfile = null;
    if (assignedRole === 'driver') {
      const fName = firstName?.trim() || username.trim();
      const lName = lastName?.trim() || 'Driver';
      const dPhone = phone?.trim() || '+1 555-0192';
      const dEmail = email.toLowerCase().trim();
      const dLicense = licenseCategory?.trim() || 'C+E';
      const dExp = experienceYears !== undefined && experienceYears !== null && experienceYears !== ''
        ? Math.max(0, Number(experienceYears))
        : 5;

      let vehicleObjId: mongoose.Types.ObjectId | null = null;
      let dStatus: 'available' | 'assigned' | 'inactive' = status || 'available';

      if (assignedVehicle && mongoose.Types.ObjectId.isValid(assignedVehicle)) {
        const vehicleDoc = await Vehicle.findById(assignedVehicle);
        if (vehicleDoc) {
          vehicleObjId = vehicleDoc._id as mongoose.Types.ObjectId;
          dStatus = 'assigned';
        }
      }

      driverProfile = await Driver.create({
        firstName: fName,
        lastName: lName,
        phone: dPhone,
        email: dEmail,
        licenseCategory: dLicense,
        experienceYears: dExp,
        status: dStatus,
        assignedVehicle: vehicleObjId,
        user: newUser._id,
      });

      if (vehicleObjId) {
        await driverProfile.populate('assignedVehicle');
      }
    }

    // Generate JWT token for instant login
    const token = jwt.sign(
      { id: newUser._id.toString(), role: newUser.role },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    // Persist mutation immediately to disk snapshot & database
    await saveDatabaseSnapshot(true);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        driverProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: true, message: 'Not authenticated' });
      return;
    }

    let driverProfile = null;
    if (req.user.role === 'driver') {
      driverProfile = await Driver.findOne({ user: req.user._id }).populate('assignedVehicle');
    }

    res.json({
      success: true,
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        driverProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};
