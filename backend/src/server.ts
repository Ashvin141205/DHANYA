/**
 * Dhanya Standalone Backend Server Entry Point
 * Application: backend
 * 
 * Used for isolated backend development (e.g. `npm run dev:backend`)
 */

import { createBackendApp } from './app';

const app = createBackendApp();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`[Dhanya Backend API] Standalone server running at http://${HOST}:${PORT}`);
  console.log(`[Dhanya Backend API] Health check endpoint: http://${HOST}:${PORT}/api/v1/health`);
});
