import nodemailer from 'nodemailer';
import {
  sendSmsNotification,
  buildDispatchSmsText,
  normalizePhoneNumber,
  SmsSendResult,
} from './sms-sender.js';

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
  error?: string;
}

export const DEFAULT_PRODUCTION_SERVER_URL = 'https://jstech-mes.vercel.app';

/**
 * Resolves the public production Base URL for deep links.
 * Prioritizes production APP_URL environment variables to prevent 404 errors,
 * while automatically converting internal `ais-dev-*.run.app` URLs to `ais-pre-*.run.app`
 * and defaulting to https://jstech-mes.vercel.app for external SMS/Email deep links.
 */
export function resolveServerBaseUrl(customBaseUrl?: string, requestHost?: string): string {
  const normalize = (u?: string): string => {
    if (!u) return '';
    let url = u.trim().replace(/\/$/, '');
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url;
  };

  // 1. Explicitly provided custom baseUrl from client (if not an ephemeral internal dev sandbox)
  if (customBaseUrl && customBaseUrl.trim()) {
    let url = normalize(customBaseUrl);
    if (url.includes('ais-dev-') && url.includes('.run.app')) {
      url = url.replace('ais-dev-', 'ais-pre-');
    }
    return url;
  }

  // 2. Explicit production Environment Variables (Highest priority for stable external deep links)
  const envUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (envUrl && envUrl.trim()) {
    const normalizedEnv = normalize(envUrl);
    // If env is set to a real production domain, prioritize it!
    if (!normalizedEnv.includes('ais-dev-') && !normalizedEnv.includes('localhost')) {
      return normalizedEnv;
    }
  }

  // 3. Request Host Header
  if (requestHost && requestHost.trim()) {
    let url = normalize(requestHost);
    if (!url.includes('ais-dev-') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      return url;
    }
  }

  // 4. Fallback default production domain
  return DEFAULT_PRODUCTION_SERVER_URL;
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
 * Helper to reliably send email via Naver Works SMTP with automatic dual-port fallback (Port 465 SSL ⟷ Port 587 STARTTLS)
 */
async function sendEmailViaNaverWorks(
  host: string,
  configuredPort: number,
  user: string,
  pass: string,
  mailOptions: nodemailer.SendMailOptions
): Promise<{ messageId: string; usedPort: number }> {
  const cleanHost = (host || 'smtp.worksmobile.com').trim();
  const cleanUser = (user || '').trim();
  const cleanPass = (pass || '').trim();

  // Try primary port first, then automatically fall back to alternate port if needed
  const primaryPort = configuredPort || 465;
  const alternatePort = primaryPort === 465 ? 587 : 465;
  const portsToTry = [primaryPort, alternatePort];

  let lastError: any = null;

  for (const port of portsToTry) {
    try {
      const isSecure = port === 465;
      const mailer = (nodemailer as any)?.createTransport
        ? nodemailer
        : (nodemailer as any)?.default || nodemailer;

      if (typeof mailer?.createTransport !== 'function') {
        throw new Error('nodemailer.createTransport is not available in current runtime');
      }

      const transporter = mailer.createTransport({
        host: cleanHost,
        port,
        secure: isSecure, // true for 465 (SSL), false for 587 (STARTTLS)
        auth: {
          user: cleanUser,
          pass: cleanPass,
        },
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2',
        },
        connectionTimeout: 6000,
        greetingTimeout: 6000,
        socketTimeout: 8000,
      });

      console.log(`[SMTP] Attempting email send via ${cleanHost}:${port} (secure: ${isSecure}) to ${mailOptions.to}...`);

      const sendPromise = transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`네이버웍스 SMTP 발송 시간 초과 (${port}번 포트, 6초)`)), 6500)
      );

      const info: any = await Promise.race([sendPromise, timeoutPromise]);
      const messageId = info?.messageId || `smtp-${Date.now()}`;
      console.log(`[SMTP] Email successfully sent to ${mailOptions.to} via port ${port} (MessageId: ${messageId})`);
      return { messageId, usedPort: port };
    } catch (err: any) {
      console.warn(`[SMTP] Attempt on port ${port} failed for ${mailOptions.to}:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('네이버웍스 SMTP 발송 실패 (465/587 포트 모두 연결 실패)');
}

/**
 * Core function to send dispatch notifications via Naver Works SMTP & Mobile SMS & generate deep links
 */
export async function sendDispatchNotification(
  payload: DispatchNotificationRequest
): Promise<DispatchNotificationResult> {
  try {
    const {
      order = { id: 'UNKNOWN', name: '미지정 수주' },
      operatorContacts = [],
      dispatchedBy = '생산관리팀',
      dispatchedAt = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      baseUrl: rawBaseUrl,
      sendEmail = true,
      sendSms = true,
    } = payload || {};

    const baseUrl = resolveServerBaseUrl(rawBaseUrl);

    // Exact Environment Variable Retrieval
    const solapiApiKey = (
      process.env.SOLAPI_API_KEY ||
      process.env.COOLSMS_API_KEY ||
      ''
    ).trim();

    const solapiApiSecret = (
      process.env.SOLAPI_API_SECRET ||
      process.env.COOLSMS_API_SECRET ||
      ''
    ).trim();

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
    const smtpPort = Number(process.env.NAVERWORKS_SMTP_PORT) || 465;
    const smtpUser = (process.env.NAVERWORKS_SMTP_USER || '').trim();
    const smtpPass = (process.env.NAVERWORKS_SMTP_PASS || '').trim();
    const isSmtpConfigured = Boolean(smtpUser && smtpPass);

    console.log(`[Dispatch Notification] Starting dispatch for Order ${order?.id || 'N/A'} (${order?.name || 'N/A'})`, {
      recipientsCount: Array.isArray(operatorContacts) ? operatorContacts.length : 0,
      sendEmail,
      sendSms,
      isSmsConfigured,
      isSmtpConfigured,
      smtpUser,
      solapiFromNumber: solapiFromNumber || '(미설정)',
      resolvedBaseUrl: baseUrl,
    });

    const safeOperatorContacts = Array.isArray(operatorContacts) ? operatorContacts : [];
    const overallDeepLinks: Record<string, string> = {};

    // Process all operator dispatches in parallel with isolated error boundaries
    const results = await Promise.all(
      safeOperatorContacts.map(async (op) => {
        const assignedProcesses = Array.isArray(op?.assignedProcesses) ? op.assignedProcesses : [];
        const firstProcess = assignedProcesses[0];
        const pid = firstProcess ? `P${firstProcess.index}` : 'P0';
        // Format: ${baseUrl}/floor?orderId={id}&processId={pid}
        const deepLink = `${baseUrl}/floor?orderId=${encodeURIComponent(order?.id || '')}&processId=${encodeURIComponent(pid)}`;
        overallDeepLinks[op.name || '작업자'] = deepLink;

        let emailHtml = '';
        try {
          emailHtml = buildDispatchEmailHtml(order, { ...op, assignedProcesses }, dispatchedBy, dispatchedAt, deepLink);
        } catch (htmlErr) {
          console.warn('[SMTP] Error generating email HTML template:', htmlErr);
          emailHtml = `<p>수주 [${order?.name || ''}]의 공정이 배정되었습니다. <a href="${deepLink}">작업 착수 링크</a></p>`;
        }

        const summary = `[${order?.name || '수주'}] ${assignedProcesses.map((p) => p.processName).join(', ')} (${assignedProcesses.length}개 공정)`;

        let emailStatus: 'SENT' | 'SIMULATED' | 'FAILED' | 'SKIPPED' = 'SKIPPED';
        let emailMessageId: string | undefined;
        let emailError: string | undefined;

        let smsStatus: 'SENT' | 'SIMULATED' | 'FAILED' | 'SKIPPED' = 'SKIPPED';
        let smsMessageId: string | undefined;
        let smsError: string | undefined;
        let generatedSmsText: string | undefined;

        // 1. Isolated Email Transmission Block with Dual-Port Fallback
        if (sendEmail) {
          if (isSmtpConfigured && op.email && op.email.includes('@')) {
            try {
              console.log(`[SMTP] Sending dispatch email to ${op.name} <${op.email}>...`);
              
              const mailInfo = await sendEmailViaNaverWorks(
                smtpHost,
                smtpPort,
                smtpUser,
                smtpPass,
                {
                  from: `"JS TECH MES 시스템" <${smtpUser}>`,
                  to: op.email,
                  subject: `[JS TECH] 📢 수주 확정 및 현장 공정 배포 - ${order?.name || ''} (${op.name} 님)`,
                  html: emailHtml,
                }
              );

              emailStatus = 'SENT';
              emailMessageId = mailInfo.messageId;
              console.log(`[SMTP] Email successfully sent to ${op.email} (MessageId: ${emailMessageId}, Port: ${mailInfo.usedPort})`);
            } catch (sendErr: any) {
              console.error(`[SMTP] Error sending to ${op.email}:`, sendErr?.message || sendErr);
              emailStatus = 'FAILED';
              const rawErr = sendErr?.message || String(sendErr);
              if (rawErr.includes('535') || rawErr.includes('Username and Password not accepted')) {
                emailError = `네이버웍스 SMTP 로그인 실패 (535 인증 오류): 계정(${smtpUser}) 또는 비밀번호가 거부되었습니다. 👉 [해결방법: 1) 네이버웍스 웹메일 환경설정 > POP3/IMAP/SMTP 설정에서 'SMTP 사용함' 체크 2) 2단계 인증 계정인 경우 [보안 설정 > 앱 비밀번호] 생성 등록 3) 도메인(@jstech.kr) 포함 전체 계정 입력]`;
              } else if (rawErr.includes('timeout') || rawErr.includes('ETIMEDOUT')) {
                emailError = `네이버웍스 SMTP 연결 시간 초과: ${rawErr} 👉 [해결방법: NAVERWORKS_SMTP_HOST (기본: smtp.worksmobile.com) 및 PORT (465 또는 587) 설정을 확인하세요]`;
              } else {
                emailError = `네이버웍스 SMTP 발송 실패: ${rawErr}`;
              }
            }
          } else {
            emailStatus = op.email && op.email.includes('@') ? 'SIMULATED' : 'SKIPPED';
          }
        }

        // 2. Isolated Mobile SMS Transmission Block
        if (sendSms) {
          const cleanPhone = normalizePhoneNumber(op.phoneNumber || '');
          try {
            const { subject: smsSubject, text: smsBody } = buildDispatchSmsText(
              order,
              op.name || '작업자',
              assignedProcesses,
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
                console.error(`[SMS] Error sending to ${op.phoneNumber}:`, sErr?.message || sErr);
                smsStatus = 'FAILED';
                smsError = sErr?.message || '솔라피 문자 발송 중 예외 발생';
              }
            } else {
              smsStatus = 'SKIPPED';
            }
          } catch (smsGenErr: any) {
            console.error('[SMS] Error generating SMS body:', smsGenErr);
            smsStatus = 'FAILED';
            smsError = `문자 메시지 생성 오류: ${smsGenErr?.message || ''}`;
          }
        }

        const overallStatus: 'SENT' | 'SIMULATED' | 'FAILED' =
          emailStatus === 'SENT' || smsStatus === 'SENT'
            ? 'SENT'
            : (emailStatus === 'FAILED' || emailStatus === 'SKIPPED') &&
              (smsStatus === 'FAILED' || smsStatus === 'SKIPPED') &&
              (emailStatus === 'FAILED' || smsStatus === 'FAILED')
            ? 'FAILED'
            : 'SIMULATED';

        return {
          operator: op.name || '작업자',
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
        };
      })
    );

    const dispatchedCount = results.length;
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
      totalRecipients: safeOperatorContacts.length,
      results,
      overallDeepLinks,
      message: `총 ${dispatchedCount}명의 공정 담당자에게 ${channelDescriptions.join(' 및 ')}과 공개 딥링크가 안전하게 생성 및 전달되었습니다.`,
      smtpConfigured: isSmtpConfigured,
      smsConfigured: isSmsConfigured,
      resolvedBaseUrl: baseUrl,
    };
  } catch (globalSendErr: any) {
    console.error('[Dispatch Notification] Unexpected error during notification dispatch:', globalSendErr);
    return {
      success: false,
      dispatchedCount: 0,
      totalRecipients: 0,
      results: [],
      overallDeepLinks: {},
      message: `공정 배포 알림 처리 중 예외 발생: ${globalSendErr?.message || '알 수 없는 오류'}`,
      smtpConfigured: false,
      smsConfigured: false,
      resolvedBaseUrl: DEFAULT_PRODUCTION_SERVER_URL,
      error: globalSendErr?.message || 'Unexpected dispatch error',
    };
  }
}

/**
 * Serverless / Express API Handler with robust error catching
 */
export default async function handler(req: any, res: any) {
  // Global safety wrapper to guarantee no unhandled exceptions or 500 invocation crashes
  try {
    // 1. CORS Headers for Vercel / Cloud Run cross-origin requests
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
      console.warn('[API] Warning setting CORS headers:', corsErr);
    }

    if (req.method === 'OPTIONS') {
      if (typeof res.status === 'function') {
        return res.status(200).end();
      }
      res.writeHead(200);
      return res.end();
    }

    if (req.method !== 'POST') {
      const notAllowedResponse = {
        success: false,
        error: 'Method Not Allowed. POST required.',
        message: 'POST 요청만 지원됩니다.',
      };
      if (typeof res.status === 'function') {
        return res.status(405).json(notAllowedResponse);
      }
      res.writeHead(405, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(notAllowedResponse));
    }

    // 2. Safe request body parsing (support JSON object, string, Buffer, or stream)
    let payload: any = req.body;

    if (!payload && typeof req.on === 'function') {
      // Parse body from readable stream if not parsed by middleware
      try {
        const buffers: Buffer[] = [];
        await new Promise<void>((resolve, reject) => {
          req.on('data', (chunk: Buffer) => buffers.push(chunk));
          req.on('end', () => resolve());
          req.on('error', (err: any) => reject(err));
        });
        const rawBody = Buffer.concat(buffers).toString('utf-8');
        if (rawBody) {
          payload = JSON.parse(rawBody);
        }
      } catch (streamErr: any) {
        console.warn('[API] Could not parse body from stream:', streamErr?.message);
      }
    }

    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (parseErr: any) {
        const parseErrorResponse = {
          success: false,
          error: `Invalid JSON request body: ${parseErr.message}`,
          message: '요청 본문(JSON) 파싱에 실패했습니다.',
        };
        if (typeof res.status === 'function') {
          return res.status(200).json(parseErrorResponse);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(parseErrorResponse));
      }
    }

    if (!payload || typeof payload !== 'object' || !payload.order) {
      const invalidPayloadResponse = {
        success: false,
        error: 'Invalid payload: order is required.',
        message: '수주 정보(order)가 누락되었습니다.',
      };
      if (typeof res.status === 'function') {
        return res.status(200).json(invalidPayloadResponse);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(invalidPayloadResponse));
    }

    const host = req.headers?.['x-forwarded-host'] || req.headers?.host;
    const resolvedBase = resolveServerBaseUrl(payload.baseUrl, host);

    console.log(`[API] /api/dispatch-notification -> Processing Order: ${payload.order?.id || 'N/A'}`);

    // 3. Execute dispatch notifications
    const result = await sendDispatchNotification({
      ...payload,
      baseUrl: resolvedBase,
    });

    if (typeof res.status === 'function') {
      return res.status(200).json(result);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(result));
  } catch (error: any) {
    console.error('[API] /api/dispatch-notification top-level unhandled exception caught:', error);
    
    const fallbackResponse: DispatchNotificationResult = {
      success: false,
      dispatchedCount: 0,
      totalRecipients: 0,
      results: [],
      overallDeepLinks: {},
      message: `알림 발송 처리 중 예외가 발생했습니다: ${error?.message || '알 수 없는 서버 오류'}`,
      smtpConfigured: Boolean(process.env.NAVERWORKS_SMTP_USER && process.env.NAVERWORKS_SMTP_PASS),
      smsConfigured: Boolean(process.env.SOLAPI_API_KEY && process.env.SOLAPI_API_SECRET),
      resolvedBaseUrl: DEFAULT_PRODUCTION_SERVER_URL,
      error: error?.message || 'Internal Server Error during dispatch notification',
    };

    try {
      if (typeof res.status === 'function') {
        return res.status(200).json(fallbackResponse);
      }
      if (!res.headersSent) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
      }
      return res.end(JSON.stringify(fallbackResponse));
    } catch (finalErr) {
      console.error('[API] Final emergency response writing failed:', finalErr);
      try {
        res.end();
      } catch {}
    }
  }
}
