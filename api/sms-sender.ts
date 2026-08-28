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
 * Sends an SMS/LMS using Solapi / CoolSMS REST API v4
 */
async function sendSolapiSms(
  payload: SmsSendPayload,
  apiKey: string,
  apiSecret: string,
  fromNumber: string
): Promise<SmsSendResult> {
  let cleanApiKey = apiKey.trim().replace(/^["']|["']$/g, '').trim();
  let cleanApiSecret = apiSecret.trim().replace(/^["']|["']$/g, '').trim();
  const cleanTo = normalizePhoneNumber(payload.to);
  const cleanFrom = normalizePhoneNumber(fromNumber || payload.from || '');

  if (!cleanApiKey || !cleanApiSecret) {
    throw new Error('Solapi API Key 또는 Secret이 누락되었습니다. (SOLAPI_API_KEY, SOLAPI_API_SECRET)');
  }

  // Auto-detect swapped API Key and Secret
  // Solapi API Key is strictly 16 chars (e.g. NCS...). Secret is 32 chars or longer.
  if (cleanApiKey.length !== 16 && cleanApiSecret.length === 16) {
    console.warn(`[Solapi] Auto-correcting swapped API Key (${cleanApiKey.length} chars) and Secret (${cleanApiSecret.length} chars)...`);
    const temp = cleanApiKey;
    cleanApiKey = cleanApiSecret;
    cleanApiSecret = temp;
  }

  if (cleanApiKey.length !== 16) {
    throw new Error(
      `솔라피 API Key 글자수 오류: 현재 SOLAPI_API_KEY 길이가 ${cleanApiKey.length}자입니다. (솔라피 API Key는 정확히 16자리여야 합니다). 👉 [해결방법: 1) Solapi(solapi.com) 콘솔 [API Key 관리]에서 16자리 'API Key(NCS...)'와 32자리 'API Secret'을 확인하세요. 2) Vercel 환경 변수에서 SOLAPI_API_KEY와 SOLAPI_API_SECRET 값이 서로 바뀌었는지 확인하고 재등록해 주세요.]`
    );
  }

  if (!cleanFrom) {
    throw new Error('Solapi에 등록된 사전 인증 발신번호가 필요합니다. (SOLAPI_FROM_NUMBER)');
  }

  if (!cleanTo || cleanTo.length < 8) {
    throw new Error(`유효하지 않은 수신 전화번호입니다: ${payload.to}`);
  }

  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString('hex');
  const signature = crypto
    .createHmac('sha256', cleanApiSecret)
    .update(date + salt)
    .digest('hex');

  const authHeader = `HMAC-SHA256 apiKey=${cleanApiKey}, date=${date}, salt=${salt}, signature=${signature}`;

  // If text is long or subject exists, specify LMS type
  const isLms = Boolean(payload.subject) || payload.text.length > 80;
  const messageBody: Record<string, any> = {
    to: cleanTo,
    from: cleanFrom,
    text: payload.text,
    type: isLms ? 'LMS' : 'SMS',
  };

  if (payload.subject && isLms) {
    messageBody.subject = payload.subject;
  }

  const body = {
    message: messageBody,
  };

  console.log(`[Solapi] Sending SMS/LMS to ${cleanTo} (From: ${cleanFrom}, Type: ${messageBody.type})...`);

  // Primary: api.solapi.com, Fallback: api.coolsms.co.kr
  const endpoint = 'https://api.solapi.com/messages/v4/send';
  
  // AbortController for 7-second fetch timeout to prevent serverless hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (fetchErr: any) {
    clearTimeout(timeoutId);
    if (fetchErr?.name === 'AbortError') {
      throw new Error('Solapi API 서버 응답 시간 초과 (7초 타임아웃)');
    }
    // Network fallback retry
    console.warn(`[Solapi] Primary endpoint network error: ${fetchErr?.message}. Retrying via api.coolsms.co.kr...`);
    const fallbackController = new AbortController();
    const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 7000);
    try {
      response = await fetch('https://api.coolsms.co.kr/messages/v4/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
        signal: fallbackController.signal,
      });
      clearTimeout(fallbackTimeoutId);
    } catch (fallbackErr: any) {
      clearTimeout(fallbackTimeoutId);
      throw new Error(`Solapi API 연결 실패: ${fallbackErr?.message || fetchErr?.message}`);
    }
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[Solapi] Transmission failed (${response.status}):`, errText);
    let errMsg = `Solapi API 오류 (${response.status}): ${errText}`;
    try {
      const errJson = JSON.parse(errText);
      const rawMsg = errJson.errorMessage || errJson.statusMessage || errText;
      const errCode = errJson.errorCode || errJson.statusCode || 'N/A';
      
      if (rawMsg.includes('허용되지 않은 IP') || errCode === 'Forbidden' || response.status === 403) {
        errMsg = `Solapi 접근 거부 (403 IP 제한): ${rawMsg} 👉 [해결방법: solapi.com 로그인 > 개발/API 설정 > API Key 관리에서 'IP 화이트리스트 제한'을 해제(모든 IP 허용)하거나 클라우드 IP를 추가하세요]`;
      } else if (errCode === 'InvalidApiKey' || rawMsg.includes('API Key') || response.status === 401) {
        errMsg = `Solapi API 키 인증 실패: ${rawMsg} 👉 [해결방법: SOLAPI_API_KEY 및 SOLAPI_API_SECRET 값을 다시 확인해 주세요]`;
      } else if (rawMsg.includes('발신번호') || errCode === 'InvalidSender') {
        errMsg = `Solapi 발신번호 미인증: ${rawMsg} 👉 [해결방법: Solapi에 사전 등록 및 서류 인증된 발신번호(SOLAPI_FROM_NUMBER)를 사용해야 합니다]`;
      } else {
        errMsg = `Solapi 오류 (${response.status}): ${rawMsg} (Code: ${errCode})`;
      }
    } catch {
      // Keep errText
    }
    throw new Error(errMsg);
  }

  const data: any = await response.json();
  const messageId = data?.groupId || data?.messageId || data?.message?.messageId || `solapi-${Date.now()}`;
  console.log(`[Solapi] Successfully sent to ${cleanTo}, Message ID: ${messageId}`);

  return {
    success: true,
    provider: 'SOLAPI',
    status: 'SENT',
    messageId,
    recipient: payload.to,
    previewText: payload.text,
  };
}

/**
 * Dedicated Solapi SMS sender with graceful Sandbox Simulation fallback if unconfigured
 */
export async function sendSmsNotification(payload: SmsSendPayload): Promise<SmsSendResult> {
  const apiKey = (
    process.env.SOLAPI_API_KEY ||
    process.env.SOLAPI_KEY ||
    process.env.COOLSMS_API_KEY ||
    process.env.COOLSMS_KEY ||
    ''
  ).trim();

  const apiSecret = (
    process.env.SOLAPI_API_SECRET ||
    process.env.SOLAPI_SECRET ||
    process.env.COOLSMS_API_SECRET ||
    process.env.COOLSMS_SECRET ||
    ''
  ).trim();

  const fromNumber = (
    process.env.SOLAPI_FROM_NUMBER ||
    process.env.SOLAPI_SENDER_NUMBER ||
    process.env.SOLAPI_FROM ||
    process.env.COOLSMS_FROM_NUMBER ||
    process.env.SMS_SENDER_NUMBER ||
    ''
  ).trim();

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
  console.warn('[SMS] Solapi credentials (SOLAPI_API_KEY, SOLAPI_API_SECRET) not found in environment. Running in SIMULATED mode.');
  return {
    success: true,
    provider: 'SIMULATED',
    status: 'SIMULATED',
    messageId: `sim-sms-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    recipient: payload.to,
    previewText: payload.text,
  };
}

