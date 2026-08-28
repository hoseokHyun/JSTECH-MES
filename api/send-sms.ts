import { sendSmsNotification, normalizePhoneNumber } from './sms-sender';

/**
 * Standalone SMS / Alimtalk Sending API Handler
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. POST required.' });
  }

  try {
    const { to, text, subject, from } = req.body || {};

    if (!to || !text) {
      return res.status(400).json({ error: 'Missing required parameters: to and text.' });
    }

    const cleanTo = normalizePhoneNumber(to);
    if (!cleanTo) {
      return res.status(400).json({ error: 'Invalid recipient phone number.' });
    }

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
