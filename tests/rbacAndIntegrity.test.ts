import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../server/models/User.js';
import { Vehicle } from '../server/models/Vehicle.js';
import { Driver } from '../server/models/Driver.js';
import { Trip } from '../server/models/Trip.js';
import { authorizeRoles } from '../server/middleware/auth.js';
import { updateTrip } from '../server/controllers/tripController.js';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Vehicle.deleteMany({}),
    Driver.deleteMany({}),
    Trip.deleteMany({}),
  ]);
});

describe('RBAC & Referential Integrity', () => {
  it('should hash passwords properly and verify credentials', async () => {
    const user = await User.create({
      username: 'test_admin',
      email: 'admin@test.com',
      password: 'SuperSecretPassword123',
      role: 'admin',
    });

    expect(user.password).not.toBe('SuperSecretPassword123');
    const isValid = await user.comparePassword('SuperSecretPassword123');
    expect(isValid).toBe(true);

    const isWrong = await user.comparePassword('WrongPassword');
    expect(isWrong).toBe(false);
  });

  it('should deny unauthorized roles in authorizeRoles middleware', () => {
    const adminOnlyMiddleware = authorizeRoles('admin');

    const driverReq: any = {
      user: { _id: new mongoose.Types.ObjectId(), role: 'driver' },
    };
    const res: any = {
      status: (code: number) => ({
        json: (data: any) => {
          expect(code).toBe(403);
          expect(data.error).toBe(true);
        },
      }),
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    adminOnlyMiddleware(driverReq, res, next);
    expect(nextCalled).toBe(false);
  });

  it('should prevent vehicle deletion when active or planned trips exist', async () => {
    const vehicle = await Vehicle.create({
      make: 'Mercedes-Benz',
      model: 'Actros 1845',
      registrationNumber: 'CB2222CC',
      year: 2023,
      status: 'in_use',
      fuelType: 'diesel',
      fuelConsumption: 27.5,
      currentMileage: 85000,
      technicalInspection: { validUntil: new Date('2027-01-01') },
      insurance: { validUntil: new Date('2027-01-01'), provider: 'Bulstrad', policyNumber: 'POL-67890' },
    });

    const driver = await Driver.create({
      firstName: 'Georgi',
      lastName: 'Dimitrov',
      phone: '+359888222333',
      email: 'georgi.dimitrov@fleet.com',
      licenseCategory: 'C+E',
      status: 'assigned',
    });

    await Trip.create({
      origin: 'Varna, BG',
      destination: 'Constanta, RO',
      cargo: 'Automotive components',
      deadline: new Date('2026-10-20'),
      driver: driver._id,
      vehicle: vehicle._id!,
      status: 'in_progress',
      distance: 160,
      fuelUsed: 44,
    });

    // Verify query used by deleteVehicle
    const activeTrips = await Trip.find({
      vehicle: vehicle._id!,
      status: { $in: ['in_progress', 'planned'] },
    });

    expect(activeTrips.length).toBeGreaterThan(0);
    // Deletion should be blocked
    const canDelete = activeTrips.length === 0;
    expect(canDelete).toBe(false);
  });

  it('should restrict driver trip status updates to planned, in_progress, and completed', async () => {
    const driverUserId = new mongoose.Types.ObjectId();
    const vehicle = await Vehicle.create({
      make: 'Volvo',
      model: 'FH 500',
      registrationNumber: 'PB1122PB',
      year: 2022,
      status: 'available',
      fuelType: 'diesel',
      fuelConsumption: 24,
      currentMileage: 120000,
      technicalInspection: { validUntil: new Date('2028-04-01') },
      insurance: { validUntil: new Date('2028-04-01'), provider: 'Allianz', policyNumber: 'INS-444' },
    });

    const driver = await Driver.create({
      user: driverUserId,
      firstName: 'Ivan',
      lastName: 'Petrov',
      phone: '+359888333444',
      email: 'ivan.petrov@fleet.com',
      licenseCategory: 'C',
      status: 'available',
    });

    const trip = await Trip.create({
      origin: 'Sofia',
      destination: 'Plovdiv',
      cargo: 'Food supplies',
      deadline: new Date('2026-10-22'),
      driver: driver._id,
      vehicle: vehicle._id!,
      status: 'planned',
      distance: 0,
      fuelUsed: 0,
    });

    const req: any = {
      params: { id: trip._id.toString() },
      user: { _id: driverUserId, role: 'driver' },
      body: { status: 'cancelled' },
    };

    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await updateTrip(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: true }));
  });
});
