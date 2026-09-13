import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Vehicle } from '../models/Vehicle.js';
import { Driver } from '../models/Driver.js';
import { Trip } from '../models/Trip.js';
import { Repair } from '../models/Repair.js';
import { Notification } from '../models/Notification.js';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const SNAPSHOT_FILE = path.join(DATA_DIR, 'famas_state.json');

let saveTimeout: NodeJS.Timeout | null = null;

export async function saveDatabaseSnapshot(immediate: boolean = false): Promise<void> {
  const doSave = async () => {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const [users, vehicles, drivers, trips, repairs, notifications] = await Promise.all([
        User.find({}).lean(),
        Vehicle.find({}).lean(),
        Driver.find({}).lean(),
        Trip.find({}).lean(),
        Repair.find({}).lean(),
        Notification.find({}).lean(),
      ]);

      // Only save if there is actual data
      if (users.length === 0 && vehicles.length === 0) {
        return;
      }

      const payload = {
        savedAt: new Date().toISOString(),
        version: '1.0',
        counts: {
          users: users.length,
          vehicles: vehicles.length,
          drivers: drivers.length,
          trips: trips.length,
          repairs: repairs.length,
          notifications: notifications.length,
        },
        data: {
          users,
          vehicles,
          drivers,
          trips,
          repairs,
          notifications,
        },
      };

      const tempFile = `${SNAPSHOT_FILE}.tmp`;
      await fs.promises.writeFile(tempFile, JSON.stringify(payload, null, 2), 'utf-8');
      await fs.promises.rename(tempFile, SNAPSHOT_FILE);
      console.log(`[Persistence] Database snapshot saved successfully (${users.length} users, ${vehicles.length} vehicles).`);
    } catch (err) {
      console.error('[Persistence] Failed to save database snapshot:', err);
    }
  };

  if (immediate) {
    if (saveTimeout) clearTimeout(saveTimeout);
    return doSave();
  }

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    doSave().catch((e) => console.error('[Persistence] Async snapshot error:', e));
  }, 1000);
}

function hydrateDocs(docs: any[]): any[] {
  if (!Array.isArray(docs)) return [];
  return docs.map((doc) => {
    const clone: any = { ...doc };
    for (const [key, val] of Object.entries(clone)) {
      if (typeof val === 'string') {
        // Restore Date objects
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
          clone[key] = new Date(val);
        }
        // Restore ObjectId references
        else if (
          (key === '_id' || key === 'user' || key === 'driver' || key === 'vehicle' || key === 'assignedVehicle' || key === 'repair' || key === 'trip') &&
          mongoose.Types.ObjectId.isValid(val) &&
          val.length === 24
        ) {
          clone[key] = new mongoose.Types.ObjectId(val);
        }
      }
    }
    return clone;
  });
}

export async function restoreDatabaseSnapshotIfAvailable(): Promise<boolean> {
  try {
    if (!fs.existsSync(SNAPSHOT_FILE)) {
      return false;
    }

    const raw = await fs.promises.readFile(SNAPSHOT_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    const data = parsed.data;

    if (!data || !Array.isArray(data.users) || data.users.length === 0) {
      return false;
    }

    console.log(`[Persistence] Found valid snapshot from ${parsed.savedAt || 'unknown time'}. Restoring...`);

    // Clean existing state
    await Promise.all([
      User.deleteMany({}),
      Vehicle.deleteMany({}),
      Driver.deleteMany({}),
      Trip.deleteMany({}),
      Repair.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    // Raw insert with hydrated ObjectIds to preserve exact _id, hashed passwords, dates, and cross-references
    if (data.users.length > 0) {
      await User.collection.insertMany(hydrateDocs(data.users));
    }
    if (data.vehicles && data.vehicles.length > 0) {
      await Vehicle.collection.insertMany(hydrateDocs(data.vehicles));
    }
    if (data.drivers && data.drivers.length > 0) {
      await Driver.collection.insertMany(hydrateDocs(data.drivers));
    }
    if (data.trips && data.trips.length > 0) {
      await Trip.collection.insertMany(hydrateDocs(data.trips));
    }
    if (data.repairs && data.repairs.length > 0) {
      await Repair.collection.insertMany(hydrateDocs(data.repairs));
    }
    if (data.notifications && data.notifications.length > 0) {
      await Notification.collection.insertMany(hydrateDocs(data.notifications));
    }

    console.log(
      `[Persistence] Restored ${data.users.length} users, ${data.vehicles.length} vehicles, ${data.drivers.length} drivers, ${data.trips.length} trips.`
    );
    return true;
  } catch (err) {
    console.error('[Persistence] Failed to restore from snapshot:', err);
    return false;
  }
}
