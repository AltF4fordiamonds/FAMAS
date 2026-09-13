import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, IUser, UserRole } from '../models/User.js';
import { getJwtSecret } from '../config/auth.js';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      error: true,
      message: 'Access denied: Authentication token required',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string; role: UserRole };
    let user = null;

    if (decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
      user = await User.findById(decoded.id).select('-password');
    }

    if (!user && decoded.id) {
      const rawUser = await User.collection.findOne({
        $or: [
          { _id: decoded.id as any },
          ...(mongoose.Types.ObjectId.isValid(decoded.id)
            ? [{ _id: new mongoose.Types.ObjectId(decoded.id) as any }]
            : []),
        ],
      });
      if (rawUser) {
        user = await User.findById(rawUser._id).select('-password');
        if (!user) {
          user = new User(rawUser);
        }
      }
    }

    if (!user) {
      res.status(401).json({
        error: true,
        message: 'Invalid token: User account does not exist',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    res.status(401).json({
      error: true,
      message: error.name === 'TokenExpiredError' ? 'Session expired: Please log in again' : 'Invalid authentication token',
    });
  }
};

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: true,
        message: 'Unauthorized: Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: true,
        message: `Forbidden: Access denied for role '${req.user.role}'. Required role(s): ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
};
