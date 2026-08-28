import crypto from 'crypto';

export interface SmsSendPayload {
  to: string; // Recipient phone number (e.g., 010-1234-5678 or +821012345678)
  from?: string; // Sender phone number
  text: string; // Message body
  subject?: string; // Message title (for LMS/MMS)
}

export interface SmsSendResult {
  success: boolean;
  provider: 'SOLAPI' | 'COOLSMS' | 'SIMULATED';
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  messageId?: string;
  recipient: string;
  error?: string;
  previewText: string;
}

/**
 * Normalizes a Korean phone number (e.g. "010-1234-5678" -> "01012345678")
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9+]/g, '');
}

/**
 * Builds the SMS message text for a dispatched order and deep link
 */
export function buildDispatchSmsText(
  order: {
    id: string;
    name: string;
    customer?: string;
    poNumber?: string;
    partName?: string;
    spec?: string;
    qty?: number;
    dueDate?: string;
  },
  operatorName: string,
  assignedProcesses: Array<{ processName: string; category?: string; machine?: string }>,
  deepLink: string
): { subject: string; text: string } {
  const procSummary = assignedProcesses.map((p) => p.processName).join(', ');
  const subject = `[JS TECH] 수주 확정 및 공정 배포 - ${order.name}`;
  const text = `[JS TECH 스마트 MES]
${operatorName} 님, 수주 [${order.name}]의 담당 공정이 배정되었습니다.

■ 수주번호: ${order.id}
■ 고객사: ${order.customer || '-'} / PO: ${order.poNumber || '-'}
■ 품명/규격: ${order.partName || '-'} / ${order.spec || '-'}
■ 수량/납기: ${order.qty || 1}개 / ${order.dueDate || '-'}
■ 배정공정: ${procSummary}

📲 현장 공정 착수 링크 (DeepLink):
${deepLink}

※ 위 링크를 누르시면 로그인 세션이 유지된 채로 현장 작업 착수 화면으로 바로 연결됩니다.`.trim();

  return { subject, text };
}

/**
 * Sends an SMS using Solapi / CoolSMS REST API v4
 */
async function sendSolapiSms(
  payload: SmsSendPayload,
  apiKey: string,
  apiSecret: string,
  fromNumber: string
): Promise<SmsSendResult> {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString('hex');
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(date + salt)
    .digest('hex');

  const authHeader = `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;

  const cleanTo = normalizePhoneNumber(payload.to);
  const cleanFrom = normalizePhoneNumber(fromNumber || payload.from || '');

  if (!cleanFrom) {
    throw new Error('Solapi/CoolSMS requires a registered sender number (SOLAPI_FROM_NUMBER or COOLSMS_FROM_NUMBER).');
  }

  const body = {
    message: {
      to: cleanTo,
      from: cleanFrom,
      text: payload.text,
      subject: payload.subject,
    },
  };

  // Primary: api.solapi.com, Fallback: api.coolsms.co.kr
  const endpoint = 'https://api.solapi.com/messages/v4/send';
  
  let response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok && response.status !== 400 && response.status !== 401 && response.status !== 402 && response.status !== 403) {
    // Retry with legacy api.coolsms.co.kr if network/service error
    response = await fetch('https://api.coolsms.co.kr/messages/v4/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Solapi API Error (${response.status}): ${errText}`);
  }

  const data: any = await response.json();
  return {
    success: true,
    provider: 'SOLAPI',
    status: 'SENT',
    messageId: data?.groupId || data?.messageId || `solapi-${Date.now()}`,
    recipient: payload.to,
    previewText: payload.text,
  };
}

/**
 * Dedicated Solapi SMS sender with graceful Sandbox Simulation fallback if unconfigured
 */
export async function sendSmsNotification(payload: SmsSendPayload): Promise<SmsSendResult> {
  const apiKey = process.env.SOLAPI_API_KEY || process.env.COOLSMS_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET || process.env.COOLSMS_API_SECRET;
  const fromNumber = process.env.SOLAPI_FROM_NUMBER || process.env.COOLSMS_FROM_NUMBER || process.env.SMS_SENDER_NUMBER || '';

  // 1. Send via Solapi REST API v4 if configured
  if (apiKey && apiSecret) {
    try {
      return await sendSolapiSms(payload, apiKey, apiSecret, fromNumber);
    } catch (err: any) {
      console.error('[SMS] Solapi dispatch failed:', err?.message);
      return {
        success: false,
        provider: 'SOLAPI',
        status: 'FAILED',
        error: err?.message || 'Solapi SMS transmission failed',
        recipient: payload.to,
        previewText: payload.text,
      };
    }
  }

  // 2. Default: Sandbox Simulation when credentials are not yet set
  return {
    success: true,
    provider: 'SIMULATED',
    status: 'SIMULATED',
    messageId: `sim-sms-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    recipient: payload.to,
    previewText: payload.text,
  };
}
