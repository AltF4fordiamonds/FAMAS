import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Middleware to check validation results
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: true,
      message: 'Validation error',
      errors: errors.array().map((err) => ({ field: (err as any).path || (err as any).param, message: err.msg })),
    });
    return;
  }
  next();
};

export const loginValidator = [
  body().custom((val, { req }) => {
    if (!req.body.login && !req.body.email && !req.body.username) {
      throw new Error('Изисква се имейл адрес');
    }
    return true;
  }),
  body('password').notEmpty().withMessage('Изисква се парола'),
  validate,
];

export const registerValidator = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').trim().isEmail().withMessage('Valid email address is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'dispatcher', 'driver']).withMessage('Role must be admin, dispatcher, or driver'),
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('phone').optional().trim(),
  body('licenseCategory').optional().trim(),
  body('experienceYears').optional(),
  body('status').optional().isIn(['available', 'assigned', 'inactive']).withMessage('Invalid availability status'),
  body('assignedVehicle').optional(),
  validate,
];

export const vehicleValidator = [
  body('make').trim().notEmpty().withMessage('Vehicle make is required'),
  body('model').trim().notEmpty().withMessage('Vehicle model is required'),
  body('registrationNumber').trim().notEmpty().withMessage('Registration number is required'),
  body('year').isInt({ min: 1990 }).withMessage('Valid manufacturing year is required (1990 or later)'),
  body('status').optional().isIn(['available', 'in_use', 'maintenance', 'inactive']),
  body('technicalInspection.validUntil').notEmpty().withMessage('Technical inspection expiration date is required'),
  body('insurance.validUntil').notEmpty().withMessage('Insurance expiration date is required'),
  validate,
];

export const driverValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('licenseCategory').isIn(['B', 'C', 'C+E', 'D', 'D+E']).withMessage('Valid license category is required'),
  body('experienceYears').isInt({ min: 0 }).withMessage('Experience years must be a non-negative number'),
  validate,
];

export const tripValidator = [
  body('origin').trim().notEmpty().withMessage('Origin is required'),
  body('destination').trim().notEmpty().withMessage('Destination is required'),
  body('cargo').trim().notEmpty().withMessage('Cargo description is required'),
  body('deadline').notEmpty().withMessage('Trip deadline is required'),
  body('driver').notEmpty().withMessage('Assigned driver is required'),
  body('vehicle').notEmpty().withMessage('Assigned vehicle is required'),
  validate,
];

export const repairValidator = [
  body('description').trim().notEmpty().withMessage('Repair description is required'),
  body('cost').isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
  body('serviceProvider').trim().notEmpty().withMessage('Service provider is required'),
  validate,
];
