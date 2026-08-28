import nodemailer from 'nodemailer';
import {
  sendSmsNotification,
  buildDispatchSmsText,
  normalizePhoneNumber,
  SmsSendResult,
} from './sms-sender';

export interface DispatchNotificationRequest {
  order: {
    id: string;
    name: string;
    customer?: string;
    poNumber?: string;
    partName?: string;
    partType?: string;
    spec?: string;
    material?: string;
    tolerance?: string;
    coatingSpec?: string;
    serialNo?: string;
    dueDate?: string;
    startDate?: string;
    qty?: number;
    memo?: string;
    specialNotes?: string;
    customProcesses?: Array<{
      name: string;
      category?: string;
      assignedMachine?: string;
      worker?: string;
      durationHours?: number;
      memo?: string;
      phaseId?: string;
    }>;
  };
  operatorContacts: Array<{
    name: string;
    email?: string;
    phoneNumber?: string;
    department?: string;
    assignedProcesses: Array<{
      index: number;
      processName: string;
      category: string;
      machine: string;
      durationHours: number;
      phaseId?: string;
      processKey?: string;
    }>;
  }>;
  dispatchedBy?: string;
  dispatchedAt?: string;
  baseUrl?: string;
  sendEmail?: boolean;
  sendSms?: boolean;
}

export interface DispatchNotificationResult {
  success: boolean;
  dispatchedCount: number;
  totalRecipients: number;
  results: Array<{
    operator: string;
    email?: string;
    phoneNumber?: string;
    emailStatus: 'SENT' | 'SIMULATED' | 'FAILED' | 'SKIPPED';
    smsStatus: 'SENT' | 'SIMULATED' | 'FAILED' | 'SKIPPED';
    status: 'SENT' | 'SIMULATED' | 'FAILED';
    messageId?: string;
    smsMessageId?: string;
    error?: string;
    smsError?: string;
    deepLink: string;
    smsText?: string;
    previewSummary: string;
  }>;
  overallDeepLinks: Record<string, string>;
  message: string;
  smtpConfigured: boolean;
  smsConfigured: boolean;
  resolvedBaseUrl: string;
}

/**
 * Resolves the public production Base URL for deep links.
 * Converts internal `ais-dev-*.run.app` URLs to public `ais-pre-*.run.app` to prevent 403 errors.
 */
export function resolveServerBaseUrl(customBaseUrl?: string, requestHost?: string): string {
  // 1. Explicitly provided custom baseUrl
  if (customBaseUrl && customBaseUrl.trim()) {
    let url = customBaseUrl.trim().replace(/\/$/, '');
    if (url.includes('ais-dev-') && url.includes('.run.app')) {
      url = url.replace('ais-dev-', 'ais-pre-');
    }
    return url;
  }

  // 2. Production Environment Variables
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (envUrl && envUrl.trim()) {
    let url = envUrl.trim().replace(/\/$/, '');
    if (url.includes('ais-dev-') && url.includes('.run.app')) {
      url = url.replace('ais-dev-', 'ais-pre-');
    }
    return url;
  }

  // 3. Request Host
  if (requestHost && requestHost.trim()) {
    let url = requestHost.trim().replace(/\/$/, '');
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    if (url.includes('ais-dev-') && url.includes('.run.app')) {
      url = url.replace('ais-dev-', 'ais-pre-');
    }
    return url;
  }

  return 'http://localhost:3000';
}

/**
 * Generates the HTML template for the Naver Works dispatch email
 */
export function buildDispatchEmailHtml(
  order: DispatchNotificationRequest['order'],
  operator: DispatchNotificationRequest['operatorContacts'][0],
  dispatchedBy: string,
  dispatchedAt: string,
  deepLink: string
): string {
  const processRows = operator.assignedProcesses
    .map(
      (p) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 14px; font-weight: 700; color: #1e293b; font-size: 13px;">
          <span style="display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 2px 8px; border-radius: 6px; font-size: 11px; margin-right: 6px; font-weight: 800;">${p.category || '공정'}</span>
          ${p.processName}
        </td>
        <td style="padding: 12px 14px; font-weight: 700; color: #0284c7; font-size: 13px;">
          ${p.machine || '(설비 미지정)'}
        </td>
        <td style="padding: 12px 14px; text-align: center; color: #475569; font-size: 13px; font-weight: 600;">
          ${p.durationHours || 0} 시간
        </td>
        <td style="padding: 12px 14px; text-align: center;">
          <a href="${deepLink}&processIndex=${p.index}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700;">
            작업 착수
          </a>
        </td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[JS TECH] 수주 확정 및 공정 현장 배포 통보</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif; background-color: #f1f5f9; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); border: 1px solid #cbd5e1;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); padding: 32px 28px; text-align: left; color: #ffffff;">
        <div style="font-size: 12px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #60a5fa; margin-bottom: 6px;">
          JS TECH SMART MES • DISPATCH NOTIFICATION
        </div>
        <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #ffffff; line-height: 1.3;">
          📢 수주 확정 및 현장 공정 배포 통보
        </h1>
        <div style="margin-top: 10px; font-size: 13px; color: #cbd5e1;">
          담당 작업자 <strong>${operator.name}</strong> 님에게 배정된 공정 작업 지시서가 발행되었습니다.
        </div>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 28px;">
        <!-- Order Summary Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
          <tr>
            <td colspan="2" style="background: #e2e8f0; padding: 10px 16px; font-size: 13px; font-weight: 800; color: #334155;">
              📦 수주 및 제품 기본 사양
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; width: 50%; font-size: 13px; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #64748b; font-weight: 600;">수주명 / PJT:</span><br>
              <strong style="color: #0f172a; font-size: 14px;">${order.name}</strong>
            </td>
            <td style="padding: 12px 16px; width: 50%; font-size: 13px; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #64748b; font-weight: 600;">고객사 / 발주번호(PO):</span><br>
              <strong style="color: #0f172a;">${order.customer || '-'} / ${order.poNumber || '-'}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #64748b; font-weight: 600;">품명 / 규격:</span><br>
              <strong style="color: #0f172a;">${order.partName || '-'} / ${order.spec || '-'}</strong>
            </td>
            <td style="padding: 12px 16px; font-size: 13px; border-bottom: 1px solid #e2e8f0;">
              <span style="color: #64748b; font-weight: 600;">수량 / 납기일자:</span><br>
              <strong style="color: #dc2626;">${order.qty || 1} 개 / ${order.dueDate || '-'}</strong>
            </td>
          </tr>
          ${
            order.specialNotes
              ? `
          <tr>
            <td colspan="2" style="padding: 12px 16px; font-size: 12px; background: #fef2f2; color: #991b1b; font-weight: 600;">
              ⚠️ <strong>특이사항:</strong> ${order.specialNotes}
            </td>
          </tr>
          `
              : ''
          }
        </table>

        <!-- Assigned Processes -->
        <div style="margin-bottom: 12px;">
          <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 800; color: #0f172a;">
            ⚙️ ${operator.name} 님 담당 배정 공정 목록 (${operator.assignedProcesses.length}건)
          </h3>
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; border-collapse: collapse;">
            <thead>
              <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
                <th style="padding: 10px 14px; font-size: 12px; font-weight: 800; color: #475569;">공정명</th>
                <th style="padding: 10px 14px; font-size: 12px; font-weight: 800; color: #475569;">배정 설비</th>
                <th style="padding: 10px 14px; font-size: 12px; font-weight: 800; color: #475569; text-align: center;">예상 공수</th>
                <th style="padding: 10px 14px; font-size: 12px; font-weight: 800; color: #475569; text-align: center;">현장 이동</th>
              </tr>
            </thead>
            <tbody>
              ${processRows}
            </tbody>
          </table>
        </div>

        <!-- Deep Link CTA Button -->
        <div style="margin: 32px 0 24px 0; text-align: center;">
          <a href="${deepLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 12px; font-size: 16px; font-weight: 800; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);">
            📲 현장 MES 시스템 접속 및 공정 착수 (Deep Link) →
          </a>
          <div style="margin-top: 8px; font-size: 11px; color: #64748b;">
            ※ 위 버튼을 클릭하시면 로그인 세션이 유지된 상태로 해당 수주의 현장 실행 MES 화면으로 즉시 연결됩니다.
          </div>
        </div>

        <!-- Meta info -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #64748b; display: flex; justify-content: space-between;">
          <div>배포 일시: <strong>${dispatchedAt}</strong></div>
          <div>배포자 / 작성: <strong>${dispatchedBy}</strong></div>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
        <strong>(주)제이에스테크 JS TECH CO., LTD.</strong> | 스마트 MES 생산 관리 시스템<br>
        발송 시스템 계정: <strong>noworries004@jstech.kr</strong> (NAVER WORKS SMTP)<br>
        본 메일은 수주 확정 시 담당 작업자에게 자동으로 발송되는 작업 지시 안내 메일입니다.
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Core function to send dispatch notifications via Naver Works SMTP & Mobile SMS & generate deep links
 */
export async function sendDispatchNotification(
  payload: DispatchNotificationRequest
): Promise<DispatchNotificationResult> {
  const {
    order,
    operatorContacts = [],
    dispatchedBy = '생산관리팀',
    dispatchedAt = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    baseUrl: rawBaseUrl,
    sendEmail = true,
    sendSms = true,
  } = payload;

  const baseUrl = resolveServerBaseUrl(rawBaseUrl);

  const solapiApiKey = (process.env.SOLAPI_API_KEY || process.env.COOLSMS_API_KEY || '').trim();
  const solapiApiSecret = (process.env.SOLAPI_API_SECRET || process.env.COOLSMS_API_SECRET || '').trim();
  const solapiFromNumber = (
    process.env.SOLAPI_FROM_NUMBER ||
    process.env.SOLAPI_SENDER_NUMBER ||
    process.env.SOLAPI_FROM ||
    process.env.COOLSMS_FROM_NUMBER ||
    process.env.SMS_SENDER_NUMBER ||
    ''
  ).trim();

  // Check Solapi SMS Configuration
  const isSmsConfigured = Boolean(solapiApiKey && solapiApiSecret && solapiFromNumber);

  // Check SMTP Configuration
  let smtpHost = (process.env.NAVERWORKS_SMTP_HOST || 'smtp.worksmobile.com').trim();
  if (smtpHost === 'smtp.naverworks.com' || smtpHost.includes('naverworks.com')) {
    smtpHost = 'smtp.worksmobile.com';
  }
  const smtpPort = Number(process.env.NAVERWORKS_SMTP_PORT) || 587;
  const smtpUser = (process.env.NAVERWORKS_SMTP_USER || 'noworries004@jstech.kr').trim();
  const smtpPass = (process.env.NAVERWORKS_SMTP_PASS || '').trim();
  const isSmtpConfigured = Boolean(smtpPass && smtpPass !== '');

  console.log(`[Dispatch Notification] Starting dispatch for Order ${order.id} (${order.name})`, {
    recipientsCount: operatorContacts.length,
    sendEmail,
    sendSms,
    isSmsConfigured,
    isSmtpConfigured,
    smtpUser,
    solapiFromNumber: solapiFromNumber || '(미설정)',
    resolvedBaseUrl: baseUrl,
  });

  let transporter: nodemailer.Transporter | null = null;
  if (sendEmail && isSmtpConfigured) {
    try {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
    } catch (tErr) {
      console.warn('[SMTP] Transporter initialization warning:', tErr);
    }
  }

  const results: DispatchNotificationResult['results'] = [];
  const overallDeepLinks: Record<string, string> = {};
  let dispatchedCount = 0;

  for (const op of operatorContacts) {
    const firstProcess = op.assignedProcesses[0];
    const pid = firstProcess ? `P${firstProcess.index}` : 'P0';
    // Format: ${baseUrl}/floor?orderId={id}&processId={pid}
    const deepLink = `${baseUrl}/floor?orderId=${encodeURIComponent(order.id)}&processId=${encodeURIComponent(pid)}`;
    overallDeepLinks[op.name] = deepLink;

    const emailHtml = buildDispatchEmailHtml(order, op, dispatchedBy, dispatchedAt, deepLink);
    const summary = `[${order.name}] ${op.assignedProcesses.map((p) => p.processName).join(', ')} (${op.assignedProcesses.length}개 공정)`;

    let emailStatus: 'SENT' | 'SIMULATED' | 'FAILED' | 'SKIPPED' = 'SKIPPED';
    let emailMessageId: string | undefined;
    let emailError: string | undefined;

    let smsStatus: 'SENT' | 'SIMULATED' | 'FAILED' | 'SKIPPED' = 'SKIPPED';
    let smsMessageId: string | undefined;
    let smsError: string | undefined;
    let generatedSmsText: string | undefined;

    // 1. Process Email Notification
    if (sendEmail) {
      if (isSmtpConfigured && transporter && op.email && op.email.includes('@')) {
        try {
          console.log(`[SMTP] Sending dispatch email to ${op.name} <${op.email}>...`);
          const info = await transporter.sendMail({
            from: `"JS TECH MES 시스템" <${smtpUser}>`,
            to: op.email,
            subject: `[JS TECH] 📢 수주 확정 및 현장 공정 배포 - ${order.name} (${op.name} 님)`,
            html: emailHtml,
          });
          emailStatus = 'SENT';
          emailMessageId = info.messageId;
          console.log(`[SMTP] Email successfully sent to ${op.email} (MessageId: ${info.messageId})`);
        } catch (sendErr: any) {
          console.error(`[SMTP] Error sending to ${op.email}:`, sendErr);
          emailStatus = 'FAILED';
          emailError = sendErr?.message || 'SMTP 발송 실패';
        }
      } else {
        emailStatus = op.email && op.email.includes('@') ? 'SIMULATED' : 'SKIPPED';
      }
    }

    // 2. Process Mobile SMS / Alimtalk Notification
    if (sendSms) {
      const cleanPhone = normalizePhoneNumber(op.phoneNumber || '');
      const { subject: smsSubject, text: smsBody } = buildDispatchSmsText(
        order,
        op.name,
        op.assignedProcesses,
        deepLink
      );
      generatedSmsText = smsBody;

      if (cleanPhone) {
        try {
          console.log(`[SMS] Dispatching Solapi SMS to ${op.name} (${cleanPhone})...`);
          const smsResult: SmsSendResult = await sendSmsNotification({
            to: cleanPhone,
            subject: smsSubject,
            text: smsBody,
          });
          smsStatus = smsResult.status;
          smsMessageId = smsResult.messageId;
          if (smsResult.status === 'FAILED') {
            smsError = smsResult.error || 'Solapi 문자 발송 실패';
          }
          console.log(`[SMS] Solapi result for ${op.name}: status=${smsStatus}, id=${smsMessageId}`);
        } catch (sErr: any) {
          console.error(`[SMS] Error sending to ${op.phoneNumber}:`, sErr);
          smsStatus = 'FAILED';
          smsError = sErr?.message || 'SMS 발송 실패';
        }
      } else {
        smsStatus = 'SKIPPED';
      }
    }

    const overallStatus: 'SENT' | 'SIMULATED' | 'FAILED' =
      emailStatus === 'SENT' || smsStatus === 'SENT'
        ? 'SENT'
        : (emailStatus === 'FAILED' || emailStatus === 'SKIPPED') && (smsStatus === 'FAILED' || smsStatus === 'SKIPPED') && (emailStatus === 'FAILED' || smsStatus === 'FAILED')
        ? 'FAILED'
        : 'SIMULATED';

    results.push({
      operator: op.name,
      email: op.email,
      phoneNumber: op.phoneNumber,
      emailStatus,
      smsStatus,
      status: overallStatus,
      messageId: emailMessageId,
      smsMessageId,
      error: emailError,
      smsError,
      deepLink,
      smsText: generatedSmsText,
      previewSummary: summary,
    });

    dispatchedCount++;
  }

  const channelDescriptions: string[] = [];
  if (sendEmail) {
    channelDescriptions.push(isSmtpConfigured ? '네이버웍스 메일(발송완료)' : '이메일(시뮬레이션)');
  }
  if (sendSms) {
    channelDescriptions.push(isSmsConfigured ? '솔라피 문자(발송완료)' : '솔라피 문자(시뮬레이션)');
  }

  return {
    success: true,
    dispatchedCount,
    totalRecipients: operatorContacts.length,
    results,
    overallDeepLinks,
    message: `총 ${dispatchedCount}명의 공정 담당자에게 ${channelDescriptions.join(' 및 ')}과 공개 딥링크가 안전하게 생성 및 전달되었습니다.`,
    smtpConfigured: isSmtpConfigured,
    smsConfigured: isSmsConfigured,
    resolvedBaseUrl: baseUrl,
  };
}

/**
 * Serverless / Express API Handler
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
    let payload: DispatchNotificationRequest = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (parseErr) {
        return res.status(400).json({ error: 'Invalid JSON request body.' });
      }
    }

    if (!payload || !payload.order || !payload.order.id) {
      return res.status(400).json({ error: 'Invalid payload: order is required.' });
    }

    const host = req.headers?.['x-forwarded-host'] || req.headers?.host;
    const resolvedBase = resolveServerBaseUrl(payload.baseUrl, host);

    console.log(`[API] /api/dispatch-notification -> Processing Order: ${payload.order.id}`);

    const result = await sendDispatchNotification({
      ...payload,
      baseUrl: resolvedBase,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[API] /api/dispatch-notification error:', error);
    return res.status(500).json({
      error: error?.message || 'Internal Server Error during dispatch notification',
    });
  }
}
