import { User } from '../models/User.js';
import { Vehicle } from '../models/Vehicle.js';
import { Driver } from '../models/Driver.js';
import { Trip } from '../models/Trip.js';
import { Repair } from '../models/Repair.js';
import { Notification } from '../models/Notification.js';
import { checkAndGenerateExpirationNotifications } from '../services/notificationService.js';
import { restoreDatabaseSnapshotIfAvailable, saveDatabaseSnapshot } from './dataPersistence.js';

export async function seedDatabase(force: boolean = false): Promise<void> {
  // If not forcing a reset, attempt to restore from existing persistent snapshot
  if (!force) {
    const restored = await restoreDatabaseSnapshotIfAvailable();
    if (restored) {
      console.log('[Seed] Preserved database state restored from disk snapshot.');
      return;
    }
  }

  const existingUsers = await User.countDocuments();
  if (existingUsers > 0 && !force) {
    console.log('[Seed] Database already contains records. Skipping seed.');
    return;
  }

  console.log('[Seed] Seeding database with realistic fleet management data...');

  // Clean existing collections if forced
  if (force) {
    await Promise.all([
      User.deleteMany({}),
      Vehicle.deleteMany({}),
      Driver.deleteMany({}),
      Trip.deleteMany({}),
      Repair.deleteMany({}),
      Notification.deleteMany({}),
    ]);
  }

  // 1. Create Users
  const adminUser = await User.create({
    username: 'admin',
    email: 'admin@fleet.com',
    password: 'admin123',
    role: 'admin',
  });

  const dispatcherUser = await User.create({
    username: 'dispatcher',
    email: 'dispatcher@fleet.com',
    password: 'dispatch123',
    role: 'dispatcher',
  });

  const driverUser1 = await User.create({
    username: 'driver_john',
    email: 'driver.john@fleet.com',
    password: 'driver123',
    role: 'driver',
  });

  const driverUser2 = await User.create({
    username: 'driver_sarah',
    email: 'driver.sarah@fleet.com',
    password: 'driver123',
    role: 'driver',
  });

  const driverUser3 = await User.create({
    username: 'driver_michael',
    email: 'driver.michael@fleet.com',
    password: 'driver123',
    role: 'driver',
  });

  // Calculate dynamic dates for realistic expiration testing
  const now = new Date();
  const daysFromNow = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };

  // 2. Create Vehicles
  const vehicle1 = await Vehicle.create({
    make: 'Volvo',
    model: 'FH16 750 Globetrotter',
    registrationNumber: 'FL-9201-TR',
    year: 2022,
    status: 'in_use',
    technicalInspection: {
      validUntil: daysFromNow(190), // Valid
    },
    insurance: {
      validUntil: daysFromNow(240), // Valid
      provider: 'Allianz Heavy Transport',
      policyNumber: 'ALZ-TRK-99210',
    },
    fuelType: 'diesel',
    fuelConsumption: 29.5,
    currentMileage: 148200,
  });

  const vehicle2 = await Vehicle.create({
    make: 'Mercedes-Benz',
    model: 'Actros 1845 BigSpace',
    registrationNumber: 'FL-4412-MB',
    year: 2021,
    status: 'in_use',
    technicalInspection: {
      validUntil: daysFromNow(5), // CRITICAL: 5 days left!
    },
    insurance: {
      validUntil: daysFromNow(95),
      provider: 'Zurich Fleet Global',
      policyNumber: 'ZUR-8834-01',
    },
    fuelType: 'diesel',
    fuelConsumption: 27.8,
    currentMileage: 215600,
  });

  const vehicle3 = await Vehicle.create({
    make: 'Scania',
    model: 'R500 V8 Highline',
    registrationNumber: 'FL-8833-SC',
    year: 2023,
    status: 'available',
    technicalInspection: {
      validUntil: daysFromNow(220),
    },
    insurance: {
      validUntil: daysFromNow(22), // WARNING: 22 days left!
      provider: 'AXA Corporate Solutions',
      policyNumber: 'AXA-EU-33129',
    },
    fuelType: 'diesel',
    fuelConsumption: 28.2,
    currentMileage: 84300,
  });

  const vehicle4 = await Vehicle.create({
    make: 'MAN',
    model: 'TGX 18.510 Individual Lion',
    registrationNumber: 'FL-1190-MN',
    year: 2020,
    status: 'maintenance',
    technicalInspection: {
      validUntil: daysFromNow(-3), // CRITICAL: Expired 3 days ago!
    },
    insurance: {
      validUntil: daysFromNow(140),
      provider: 'Allianz Heavy Transport',
      policyNumber: 'ALZ-TRK-77142',
    },
    fuelType: 'diesel',
    fuelConsumption: 30.1,
    currentMileage: 298400,
  });

  const vehicle5 = await Vehicle.create({
    make: 'Ford',
    model: 'Transit 350 L3H3 EcoBlue',
    registrationNumber: 'FL-6320-FT',
    year: 2023,
    status: 'available',
    technicalInspection: {
      validUntil: daysFromNow(310),
    },
    insurance: {
      validUntil: daysFromNow(180),
      provider: 'Zurich Fleet Global',
      policyNumber: 'ZUR-5510-77',
    },
    fuelType: 'diesel',
    fuelConsumption: 9.4,
    currentMileage: 42100,
  });

  const vehicle6 = await Vehicle.create({
    make: 'Renault Trucks',
    model: 'T High 480 Sleeper',
    registrationNumber: 'FL-7744-RN',
    year: 2022,
    status: 'available',
    technicalInspection: {
      validUntil: daysFromNow(140),
    },
    insurance: {
      validUntil: daysFromNow(4), // CRITICAL: Insurance in 4 days!
      provider: 'AXA Corporate Solutions',
      policyNumber: 'AXA-EU-88402',
    },
    fuelType: 'diesel',
    fuelConsumption: 28.0,
    currentMileage: 112000,
  });

  // 3. Create Drivers
  const driver1 = await Driver.create({
    firstName: 'John',
    lastName: 'Davis',
    phone: '+49 171 4920194',
    email: 'driver.john@fleet.com',
    licenseCategory: 'C+E',
    experienceYears: 8,
    status: 'assigned',
    assignedVehicle: vehicle1._id,
    user: driverUser1._id,
  });

  const driver2 = await Driver.create({
    firstName: 'Sarah',
    lastName: 'Miller',
    phone: '+49 172 8841029',
    email: 'driver.sarah@fleet.com',
    licenseCategory: 'C+E',
    experienceYears: 6,
    status: 'assigned',
    assignedVehicle: vehicle2._id,
    user: driverUser2._id,
  });

  const driver3 = await Driver.create({
    firstName: 'Michael',
    lastName: 'Brown',
    phone: '+49 170 3391820',
    email: 'driver.michael@fleet.com',
    licenseCategory: 'C',
    experienceYears: 4,
    status: 'available',
    assignedVehicle: null,
    user: driverUser3._id,
  });

  const driver4 = await Driver.create({
    firstName: 'Emma',
    lastName: 'Wilson',
    phone: '+49 175 6629104',
    email: 'emma.wilson@fleet.com',
    licenseCategory: 'B',
    experienceYears: 5,
    status: 'available',
    assignedVehicle: vehicle5._id,
    user: null,
  });

  // 4. Create Trips
  await Trip.create({
    origin: 'Rotterdam Port, NL',
    destination: 'Frankfurt Hub, DE',
    cargo: 'Automotive Precision Components (18 tons)',
    deadline: daysFromNow(1),
    status: 'in_progress',
    driver: driver1._id,
    vehicle: vehicle1._id,
    distance: 450,
    fuelUsed: 132,
  });

  await Trip.create({
    origin: 'Hamburg Cargo Terminal, DE',
    destination: 'Prague Central Depot, CZ',
    cargo: 'Industrial Automation Machinery (14 tons)',
    deadline: daysFromNow(2),
    status: 'in_progress',
    driver: driver2._id,
    vehicle: vehicle2._id,
    distance: 640,
    fuelUsed: 178,
  });

  await Trip.create({
    origin: 'Antwerp Gateway, BE',
    destination: 'Munich South Logistics, DE',
    cargo: 'Temperature-controlled Pharmaceuticals (8 tons)',
    deadline: daysFromNow(4),
    status: 'planned',
    driver: driver3._id,
    vehicle: vehicle3._id,
    distance: 720,
    fuelUsed: 0,
  });

  await Trip.create({
    origin: 'Paris Logistics Hub, FR',
    destination: 'Lyon Distribution Park, FR',
    cargo: 'Consumer Electronics & Appliances (12 tons)',
    deadline: daysFromNow(-2),
    status: 'completed',
    driver: driver1._id,
    vehicle: vehicle1._id,
    distance: 465,
    fuelUsed: 136,
  });

  await Trip.create({
    origin: 'Amsterdam Airport Cargo, NL',
    destination: 'Brussels South Hub, BE',
    cargo: 'Express High-Value Retail Packages (2.5 tons)',
    deadline: daysFromNow(-4),
    status: 'completed',
    driver: driver4._id,
    vehicle: vehicle5._id,
    distance: 215,
    fuelUsed: 21,
  });

  // 5. Create Repairs
  await Repair.create({
    vehicle: vehicle4._id,
    description: 'Transmission overhaul and clutch assembly replacement',
    repairDate: daysFromNow(-5),
    cost: 2850,
    serviceProvider: 'MAN Truck & Bus Service Frankfurt',
    mileage: 297500,
    notes: 'Awaiting final warranty clearance and test drive inspection.',
  });

  await Repair.create({
    vehicle: vehicle2._id,
    description: 'Front and rear axle brake pad replacement & caliper check',
    repairDate: daysFromNow(-18),
    cost: 1420,
    serviceProvider: 'EuroFleet Maintenance GmbH',
    mileage: 212000,
    notes: 'Replaced wear sensors; calibrated braking balance.',
  });

  await Repair.create({
    vehicle: vehicle1._id,
    description: 'Scheduled 140k major service: synthetic engine oil, oil/fuel/cabin filters, AdBlue injector flush',
    repairDate: daysFromNow(-32),
    cost: 890,
    serviceProvider: 'Volvo Truck Center Rotterdam',
    mileage: 140500,
    notes: 'All fluid diagnostics within optimal manufacturer limits.',
  });

  await Repair.create({
    vehicle: vehicle3._id,
    description: 'Cooling system thermostat valve replacement and pressure test',
    repairDate: daysFromNow(-45),
    cost: 620,
    serviceProvider: 'Scania Certified Workshop Cologne',
    mileage: 81000,
    notes: 'System refilled with factory Longlife coolant.',
  });

  // 6. Run notification generation for document expirations
  await checkAndGenerateExpirationNotifications();

  // 7. Persist initial snapshot to disk
  await saveDatabaseSnapshot(true);

  console.log('[Seed] Database seeded successfully.');
}
