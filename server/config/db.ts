import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import net from 'net';

let mongoMemoryServer: MongoMemoryServer | null = null;

function isPortOpen(host: string, port: number, timeoutMs = 800): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const cleanup = () => {
      if (!settled) {
        settled = true;
        socket.destroy();
      }
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      cleanup();
      resolve(true);
    });
    socket.once('timeout', () => {
      cleanup();
      resolve(false);
    });
    socket.once('error', () => {
      cleanup();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

export async function connectDB(): Promise<void> {
  const customUri = process.env.MONGODB_URI?.trim();

  if (customUri) {
    const isLocalhost =
      customUri.includes('localhost') ||
      customUri.includes('127.0.0.1') ||
      customUri.includes('0.0.0.0');

    let shouldAttemptDirectConnect = true;

    if (isLocalhost) {
      // Parse port if available or default to 27017
      const portMatch = customUri.match(/:(\d+)/);
      const port = portMatch ? parseInt(portMatch[1], 10) : 27017;
      const host = '127.0.0.1';

      const open = await isPortOpen(host, port, 600);
      if (!open) {
        shouldAttemptDirectConnect = false;
        console.log(`[DB] No local MongoDB daemon active on port ${port}. Using embedded high-performance MongoMemoryServer.`);
      }
    }

    if (shouldAttemptDirectConnect) {
      try {
        console.log(`[DB] Connecting to external MongoDB at ${customUri}...`);
        await mongoose.connect(customUri, {
          serverSelectionTimeoutMS: 3000,
        });
        console.log(`[DB] Connected to MongoDB successfully at ${customUri}`);
        return;
      } catch (err: any) {
        console.warn(`[DB] Could not connect to ${customUri} (${err.message}). Falling back to embedded MongoMemoryServer.`);
      }
    }
  }

  // Fallback to embedded MongoDB with persistent storage on disk
  try {
    const fs = await import('fs');
    const path = await import('path');
    const dbDir = path.resolve(process.cwd(), '.data', 'db');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    console.log(`[DB] Initializing embedded persistent MongoDB server with storage at ${dbDir}...`);
    try {
      mongoMemoryServer = await MongoMemoryServer.create({
        instance: {
          dbPath: dbDir,
          storageEngine: 'wiredTiger',
        },
      });
    } catch (persistErr: any) {
      console.warn(`[DB] Persistent dbPath init warning (${persistErr.message}). Retrying with ephemeral in-memory fallback...`);
      mongoMemoryServer = await MongoMemoryServer.create();
    }

    const uri = mongoMemoryServer.getUri();
    await mongoose.connect(uri);
    console.log(`[DB] Connected to embedded MongoDB successfully at ${uri}`);
  } catch (error) {
    console.error('[DB] Critical: Failed to start MongoDB connection:', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
}
