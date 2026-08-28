import { sendSmsNotification, normalizePhoneNumber } from './sms-sender';

/**
 * Standalone SMS / Alimtalk Sending API Handler (Solapi v4)
 */
export default async function handler(req: any, res: any) {
  // CORS Headers for Vercel / Cloud Run cross-origin requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. POST required.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseErr) {
        return res.status(400).json({ error: 'Invalid JSON request body.' });
      }
    }

    const { to, text, subject, from } = body || {};

    if (!to || !text) {
      return res.status(400).json({ error: '수신자 번호(to)와 메시지 내용(text)은 필수입니다.' });
    }

    const cleanTo = normalizePhoneNumber(to);
    if (!cleanTo) {
      return res.status(400).json({ error: '유효하지 않은 수신 휴대폰 번호입니다.' });
    }

    console.log(`[API] /api/send-sms -> Sending to: ${cleanTo}`);

    const result = await sendSmsNotification({
      to: cleanTo,
      text: text.trim(),
      subject: subject ? subject.trim() : undefined,
      from: from ? from.trim() : undefined,
    });

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[API] /api/send-sms error:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to send SMS notification',
    });
  }
}

