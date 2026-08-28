import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dispatchNotificationHandler from './api/dispatch-notification';
import sendSmsHandler from './api/send-sms';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes FIRST
  app.post('/api/dispatch-notification', dispatchNotificationHandler);
  app.post('/api/send-sms', sendSmsHandler);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Vite middleware for development / static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 JS TECH MES Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
