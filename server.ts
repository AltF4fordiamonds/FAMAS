import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './server/config/db.js';
import { seedDatabase } from './server/utils/seedData.js';
import { errorHandler } from './server/middleware/errorHandler.js';
import { saveDatabaseSnapshot } from './server/utils/dataPersistence.js';

// Route imports
import authRoutes from './server/routes/auth.js';
import vehicleRoutes from './server/routes/vehicles.js';
import driverRoutes from './server/routes/drivers.js';
import tripRoutes from './server/routes/trips.js';
import repairRoutes from './server/routes/repairs.js';
import dashboardRoutes from './server/routes/dashboard.js';
import notificationRoutes from './server/routes/notifications.js';
import userRoutes from './server/routes/users.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Automatically persist database mutations on any modifying request
  app.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.path.startsWith('/api')) {
      res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          saveDatabaseSnapshot(false).catch((e) =>
            console.error('[Persistence] Auto-save error:', e)
          );
        }
      });
    }
    next();
  });

  // Connect to MongoDB and seed initial data if needed
  try {
    await connectDB();
    await seedDatabase(false);
  } catch (err) {
    console.error('[Server] Database startup error:', err);
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/vehicles', vehicleRoutes);
  app.use('/api/drivers', driverRoutes);
  app.use('/api/trips', tripRoutes);
  app.use('/api', repairRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/users', userRoutes);

  // Direct seed reset endpoint for demonstration convenience
  app.post('/api/seed-reset', async (req, res, next) => {
    try {
      await seedDatabase(true);
      res.json({ success: true, message: 'Database reset and re-seeded successfully!' });
    } catch (err) {
      next(err);
    }
  });

  // Centralized API error handling
  app.use(errorHandler);

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, 'localhost', () => {
    console.log(`[Server] Fleet Management System running on http://localhost:${PORT}`);
  });
}

startServer();
