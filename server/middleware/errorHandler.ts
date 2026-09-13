import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error('[API Error]', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e: any) => e.message);
    res.status(400).json({
      error: true,
      message: 'Validation failed',
      errors: messages,
    });
    return;
  }

  // Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    res.status(409).json({
      error: true,
      message: `A record with ${field} "${value}" already exists.`,
    });
    return;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      error: true,
      message: `Invalid ID format: ${err.value}`,
    });
    return;
  }

  // Default internal server error
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: true,
    message: err.message || 'An unexpected internal server error occurred',
  });
}
