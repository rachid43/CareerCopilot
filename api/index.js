import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import { registerRoutes } from '../dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create async function to handle app initialization
async function createApp() {
  const app = express();

  // Configure for production
  app.set('trust proxy', 1);

  // Body parsing middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Static files - serve from built frontend directory
  app.use(express.static(join(__dirname, '../dist/public')));

  // Register API routes
  await registerRoutes(app);

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(__dirname, '../dist/public/index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });

  return app;
}

// Initialize app and export
let appPromise = null;

export default async function handler(req, res) {
  // Create app only once
  if (!appPromise) {
    appPromise = createApp();
  }
  
  const app = await appPromise;
  return app(req, res);
}