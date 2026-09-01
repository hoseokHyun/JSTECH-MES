import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dispatchNotificationHandler from './api/dispatch-notification';
import sendSmsHandler from './api/send-sms';
import testSmtpHandler from './api/test-smtp';
import { getSmtpConfig } from './api/smtp-service';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes FIRST
  app.all('/api/dispatch-notification', dispatchNotificationHandler);
  app.all('/api/send-sms', sendSmsHandler);
  app.all('/api/test-smtp', testSmtpHandler);

  app.get('/api/health', (_req, res) => {
    const solapiConfigured = Boolean(
      (process.env.SOLAPI_API_KEY || process.env.COOLSMS_API_KEY) &&
      (process.env.SOLAPI_API_SECRET || process.env.COOLSMS_API_SECRET)
    );
    const smtpConfig = getSmtpConfig();

    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      solapiConfigured,
      smtpConfigured: smtpConfig.isConfigured,
      smtpHost: smtpConfig.host,
      smtpPort: smtpConfig.port,
      smtpUser: smtpConfig.user,
      smtpDetectedEnvKey: smtpConfig.detectedEnvKey,
      fromNumber: process.env.SOLAPI_FROM_NUMBER || process.env.COOLSMS_FROM_NUMBER || process.env.SMS_SENDER_NUMBER || null,
    });
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

