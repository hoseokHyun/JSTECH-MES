import { testSmtpConnection, getSmtpConfig } from './smtp-service.js';

/**
 * API handler to run on-demand SMTP diagnostic connection tests and optional test email dispatch
 */
export default async function handler(req: any, res: any) {
  try {
    // CORS Headers
    try {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
        res.setHeader(
          'Access-Control-Allow-Headers',
          'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
        );
      }
    } catch (corsErr) {
      console.warn('[API] Warning setting CORS headers in test-smtp:', corsErr);
    }

    if (req.method === 'OPTIONS') {
      if (typeof res.status === 'function') {
        return res.status(200).end();
      }
      res.writeHead(200);
      return res.end();
    }

    let payload: any = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        payload = {};
      }
    }

    // Support GET to return current SMTP config status or POST to trigger active test
    const sendTestEmailTo = payload?.sendTestEmailTo || req.query?.sendTestEmailTo;
    const customPort = payload?.customPort ? Number(payload.customPort) : undefined;

    const result = await testSmtpConnection({
      sendTestEmailTo,
      customPort,
    });

    if (typeof res.status === 'function') {
      return res.status(200).json(result);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(result));
  } catch (err: any) {
    console.error('[API] /api/test-smtp error:', err);
    const config = getSmtpConfig();
    const fallback = {
      success: false,
      smtpConfigured: config.isConfigured,
      smtpHost: config.host,
      smtpPort: config.port,
      smtpUser: config.user,
      detectedEnvKey: config.detectedEnvKey,
      hasPassword: Boolean(config.pass),
      steps: [
        {
          step: 'SERVER_CONNECT',
          name: '1. SMTP 서버 연결',
          status: 'FAILED',
          message: `테스트 실행 중 예외 발생: ${err?.message || err}`,
        },
      ],
      error: err?.message || 'SMTP 테스트 중 예외 발생',
      errorCode: 'INTERNAL_ERROR',
      diagnosticAdvice: [
        '서버 환경변수 설정 및 네트워크 상태를 확인하세요.',
      ],
      timestamp: new Date().toISOString(),
    };

    try {
      if (typeof res.status === 'function') {
        return res.status(200).json(fallback);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(fallback));
    } catch {}
  }
}
