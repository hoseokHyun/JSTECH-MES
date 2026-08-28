import { sendSmsNotification, normalizePhoneNumber } from './sms-sender';

/**
 * Standalone SMS / Alimtalk Sending API Handler (Solapi v4)
 */
export default async function handler(req: any, res: any) {
  try {
    // CORS Headers for Vercel / Cloud Run cross-origin requests
    try {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
        res.setHeader(
          'Access-Control-Allow-Headers',
          'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
        );
      }
    } catch (corsErr) {
      console.warn('[API] Warning setting CORS headers in send-sms:', corsErr);
    }

    if (req.method === 'OPTIONS') {
      if (typeof res.status === 'function') {
        return res.status(200).end();
      }
      res.writeHead(200);
      return res.end();
    }

    if (req.method !== 'POST') {
      const notAllowed = { success: false, error: 'Method Not Allowed. POST required.' };
      if (typeof res.status === 'function') {
        return res.status(405).json(notAllowed);
      }
      res.writeHead(405, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(notAllowed));
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseErr: any) {
        const parseErrResp = { success: false, error: 'Invalid JSON request body: ' + parseErr.message };
        if (typeof res.status === 'function') {
          return res.status(200).json(parseErrResp);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(parseErrResp));
      }
    }

    const { to, text, subject, from } = body || {};

    if (!to || !text) {
      const badReqResp = { success: false, error: '수신자 번호(to)와 메시지 내용(text)은 필수입니다.' };
      if (typeof res.status === 'function') {
        return res.status(200).json(badReqResp);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(badReqResp));
    }

    const cleanTo = normalizePhoneNumber(to);
    if (!cleanTo) {
      const badPhoneResp = { success: false, error: '유효하지 않은 수신 휴대폰 번호입니다.' };
      if (typeof res.status === 'function') {
        return res.status(200).json(badPhoneResp);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(badPhoneResp));
    }

    console.log(`[API] /api/send-sms -> Sending to: ${cleanTo}`);

    const result = await sendSmsNotification({
      to: cleanTo,
      text: text.trim(),
      subject: subject ? subject.trim() : undefined,
      from: from ? from.trim() : undefined,
    });

    if (typeof res.status === 'function') {
      return res.status(200).json(result);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(result));
  } catch (err: any) {
    console.error('[API] /api/send-sms unhandled error:', err);
    const errResp = {
      success: false,
      provider: 'SIMULATED',
      status: 'FAILED',
      error: err?.message || 'Failed to send SMS notification',
      recipient: req.body?.to || '',
      previewText: req.body?.text || '',
    };
    try {
      if (typeof res.status === 'function') {
        return res.status(200).json(errResp);
      }
      if (!res.headersSent) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
      }
      return res.end(JSON.stringify(errResp));
    } catch {}
  }
}

