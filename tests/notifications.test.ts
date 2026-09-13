import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Vehicle } from '../server/models/Vehicle.js';
import { Notification } from '../server/models/Notification.js';
import { checkAndGenerateExpirationNotifications } from '../server/services/notificationService.js';

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
    Notification.deleteMany({}),
  ]);
});

describe('Document Expiration & Notifications', () => {
  it('should generate notifications for expiring documents and prevent duplicates', async () => {
    const now = new Date();
    // Expiration in 15 days (warning threshold <= 30d)
    const expiringSoonDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    const vehicle = await Vehicle.create({
      make: 'MAN',
      model: 'TGX 18.510',
      registrationNumber: 'CB7777XX',
      year: 2022,
      status: 'available',
      fuelType: 'diesel',
      fuelConsumption: 28.5,
      currentMileage: 120000,
      technicalInspection: { validUntil: expiringSoonDate },
      insurance: { validUntil: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000), provider: 'Allianz', policyNumber: 'POL-99999' },
    });

    // Run first check
    const createdFirst = await checkAndGenerateExpirationNotifications();
    expect(createdFirst).toBe(1);

    const notifs = await Notification.find({ relatedEntityId: vehicle._id! });
    expect(notifs.length).toBe(1);
    expect(notifs[0].severity).toBe('warning');
    expect(notifs[0].type).toBe('inspection_expiry');

    // Run second check immediately: Deduplication should prevent second creation
    const createdSecond = await checkAndGenerateExpirationNotifications();
    expect(createdSecond).toBe(0);

    const notifsAfter = await Notification.find({ relatedEntityId: vehicle._id! });
    expect(notifsAfter.length).toBe(1);
  });
});
