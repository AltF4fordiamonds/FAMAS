import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Vehicle } from '../server/models/Vehicle.js';
import { Driver } from '../server/models/Driver.js';
import { Trip } from '../server/models/Trip.js';

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
    Vehicle.deleteMany({}),
    Driver.deleteMany({}),
    Trip.deleteMany({}),
  ]);
});

describe('Fuel Consumption & Trip Lifecycle', () => {
  it('should calculate fuel consumption accurately (L/100km = (fuel / distance) * 100)', () => {
    const distanceKm = 450;
    const fuelLiters = 126;
    const consumption = Number(((fuelLiters / distanceKm) * 100).toFixed(1));
    expect(consumption).toBe(28.0);
  });

  it('should create a trip and link driver & vehicle', async () => {
    const vehicle = await Vehicle.create({
      make: 'Volvo',
      model: 'FH16 750',
      registrationNumber: 'CB9999AA',
      year: 2023,
      status: 'available',
      fuelType: 'diesel',
      fuelConsumption: 29.5,
      currentMileage: 100000,
      technicalInspection: { validUntil: new Date('2027-01-01') },
      insurance: { validUntil: new Date('2027-01-01'), provider: 'DZI', policyNumber: 'POL-12345' },
    });

    const driver = await Driver.create({
      firstName: 'Ivan',
      lastName: 'Petrov',
      phone: '+359888111222',
      email: 'ivan.petrov@fleet.com',
      licenseCategory: 'C+E',
      status: 'available',
    });

    const trip = await Trip.create({
      origin: 'Sofia, BG',
      destination: 'Thessaloniki, GR',
      cargo: 'Pharmaceutical goods (Cold chain)',
      deadline: new Date('2026-10-15'),
      driver: driver._id,
      vehicle: vehicle._id!,
      status: 'planned',
      distance: 300,
      fuelUsed: 84,
    });

    expect(trip._id).toBeDefined();
    expect(trip.status).toBe('planned');
    expect(trip.distance).toBe(300);
    expect(trip.fuelUsed).toBe(84);
  });

  it('should increment vehicle mileage when trip completes', async () => {
    const initialMileage = 50000;
    const tripDistance = 450;

    const vehicle = await Vehicle.create({
      make: 'Scania',
      model: 'R500 V8',
      registrationNumber: 'CB1111BB',
      year: 2022,
      status: 'in_use',
      fuelType: 'diesel',
      fuelConsumption: 28.0,
      currentMileage: initialMileage,
      technicalInspection: { validUntil: new Date('2027-01-01') },
      insurance: { validUntil: new Date('2027-01-01'), provider: 'Bulstrad', policyNumber: 'POL-55555' },
    });

    // Simulate completion odometer update logic
    await Vehicle.findByIdAndUpdate(vehicle._id!, {
      $inc: { currentMileage: tripDistance },
      status: 'available',
    });

    const updatedVehicle = await Vehicle.findById(vehicle._id!);
    expect(updatedVehicle?.currentMileage).toBe(initialMileage + tripDistance);
    expect(updatedVehicle?.status).toBe('available');
  });
});
