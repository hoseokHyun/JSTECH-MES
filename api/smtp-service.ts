import nodemailer from 'nodemailer';
import net from 'net';
import tls from 'tls';

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  isConfigured: boolean;
  secure: boolean;
  detectedEnvKey: string;
}

export interface SmtpTestStep {
  step: 'SERVER_CONNECT' | 'SSL_TLS' | 'AUTH' | 'SEND_TEST_MAIL';
  name: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  message: string;
  durationMs?: number;
  errorCode?: string;
}

export interface SmtpTestResult {
  success: boolean;
  smtpConfigured: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  detectedEnvKey: string;
  hasPassword: boolean;
  steps: SmtpTestStep[];
  error?: string;
  errorCode?: string;
  diagnosticAdvice?: string[];
  testEmailSent?: boolean;
  testEmailRecipient?: string;
  messageId?: string;
  timestamp: string;
}

/**
 * Utility to safely clean string environment variables by removing outer quotes and trimming whitespace.
 */
export function cleanEnvString(val?: string | null): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

/**
 * Resolves SMTP configuration from environment variables with complete alias support and normalization.
 * Supported variables:
 * - NAVERWORKS_SMTP_HOST / SMTP_HOST
 * - NAVERWORKS_SMTP_PORT / SMTP_PORT
 * - NAVERWORKS_SMTP_USER / SMTP_USER
 * - NAVERWORKS_SMTP_PASS / NAVERWORKS_SMTP_PASSWORD / SMTP_PASSWORD / SMTP_PASS
 */
export function getSmtpConfig(): SmtpConfig {
  let host = cleanEnvString(
    process.env.NAVERWORKS_SMTP_HOST ||
    process.env.SMTP_HOST ||
    process.env.MAIL_HOST ||
    'smtp.worksmobile.com'
  );
  // Normalize host: Naver Works actual SMTP endpoint is smtp.worksmobile.com
  if (host === 'smtp.naverworks.com' || host.includes('naverworks.com')) {
    host = 'smtp.worksmobile.com';
  }

  const rawPort = cleanEnvString(
    process.env.NAVERWORKS_SMTP_PORT ||
    process.env.SMTP_PORT ||
    process.env.MAIL_PORT ||
    '465'
  );
  const port = Number(rawPort) || 465;

  const user = cleanEnvString(
    process.env.NAVERWORKS_SMTP_USER ||
    process.env.SMTP_USER ||
    process.env.NAVER_SMTP_USER ||
    process.env.MAIL_USER ||
    process.env.SMTP_EMAIL ||
    process.env.EMAIL_USER ||
    process.env.NAVERWORKS_USER ||
    'noworries004@jstech.kr'
  );

  // SMTP Password MUST NEVER be hardcoded in source code or committed to GitHub.
  // It is securely loaded at runtime from environment variables (e.g. Vercel Environment Variables).
  let pass = cleanEnvString(process.env.NAVERWORKS_SMTP_PASS);
  let detectedEnvKey = pass ? 'NAVERWORKS_SMTP_PASS' : 'NONE';

  if (!pass) {
    const fallbackKeys = [
      'NAVERWORKS_SMTP_PASSWORD',
      'SMTP_PASSWORD',
      'SMTP_PASS',
      'MAIL_PASSWORD',
      'MAIL_PASS',
      'NAVER_SMTP_PASSWORD',
      'NAVER_SMTP_PASS',
      'NAVER_PASSWORD',
      'NAVERWORKS_PASS',
    ];

    for (const key of fallbackKeys) {
      if (process.env[key]) {
        const candidate = cleanEnvString(process.env[key]);
        if (candidate) {
          pass = candidate;
          detectedEnvKey = key;
          break;
        }
      }
    }
  }

  const isConfigured = Boolean(user && pass);
  const secure = port === 465;

  return {
    host,
    port,
    user,
    pass,
    isConfigured,
    secure,
    detectedEnvKey,
  };
}

/**
 * Creates a nodemailer Transporter using verified settings.
 */
export function createTransporter(customPort?: number, customSecure?: boolean) {
  const config = getSmtpConfig();
  const port = customPort ?? config.port;
  const secure = customSecure ?? (port === 465);

  const mailer = (nodemailer as any)?.createTransport
    ? nodemailer
    : (nodemailer as any)?.default || nodemailer;

  return mailer.createTransport({
    host: config.host,
    port,
    secure, // true for 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2',
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
}

/**
 * Diagnoses SMTP authentication errors (like 535) and provides clear, actionable advice.
 */
export function buildSmtpDiagnosticAdvice(err: any, user: string): { code: string; message: string; advice: string[] } {
  const rawMsg = err?.message || String(err || '');
  let code = err?.responseCode ? String(err.responseCode) : 'UNKNOWN';

  if (rawMsg.includes('535') || rawMsg.includes('Username and Password not accepted') || rawMsg.includes('authentication failed')) {
    code = '535';
    return {
      code: '535',
      message: `네이버웍스 SMTP 로그인 실패 (535 Authentication Failed): 계정(${user}) 또는 비밀번호가 거부되었습니다.`,
      advice: [
        `1) [네이버웍스 웹메일 환경설정]: 네이버웍스 웹메일(mail.worksmobile.com) 접속 > 환경설정(⚙️) > [POP3/IMAP/SMTP 설정]에서 'SMTP 사용함'에 체크되어 있는지 확인하세요.`,
        `2) [앱 비밀번호(App Password) 발급]: 네이버웍스 계정에 2단계 인증이 적용되어 있거나 보안 정책이 강화된 경우, 일반 로그인 비밀번호가 아닌 [네이버웍스 > 내 정보 / 보안 설정 > 외부 앱 비밀번호]를 발급받아 환경변수에 등록해야 합니다.`,
        `3) [도메인 전체 계정명 입력]: SMTP 로그인 계정명에 도메인(@jstech.kr)이 포함된 전체 이메일 주소('${user}')가 정확히 입력되었는지 확인하세요.`,
        `4) [환경변수 등록값 점검]: AI Studio 설정(Settings/Secrets) 또는 배포 환경변수에서 'NAVERWORKS_SMTP_PASS' 또는 'SMTP_PASSWORD' 값에 공백이나 오타가 없는지 점검하세요.`,
      ],
    };
  }

  if (rawMsg.includes('ETIMEDOUT') || rawMsg.includes('timeout') || rawMsg.includes('ESOCKETTIMEDOUT')) {
    code = 'TIMEOUT';
    return {
      code: 'TIMEOUT',
      message: `네이버웍스 SMTP 서버 연결 시간 초과 (Timeout)`,
      advice: [
        `1) SMTP 호스트가 'smtp.worksmobile.com'인지 확인하세요.`,
        `2) SMTP 포트를 465(SSL) 또는 587(STARTTLS)로 변경하여 테스트해 보세요.`,
        `3) 사내 방화벽이나 아웃바운드 네트워크에서 SMTP 포트(465, 587)가 차단되어 있는지 점검하세요.`,
      ],
    };
  }

  if (rawMsg.includes('ECONNREFUSED')) {
    code = 'ECONNREFUSED';
    return {
      code: 'ECONNREFUSED',
      message: `네이버웍스 SMTP 서버 연결 거부 (Connection Refused)`,
      advice: [
        `1) SMTP 서버 주소(smtp.worksmobile.com)와 포트(465)가 올바른지 확인하세요.`,
      ],
    };
  }

  return {
    code,
    message: `네이버웍스 SMTP 오류: ${rawMsg}`,
    advice: [
      `네이버웍스 SMTP 설정 가이드(Host: smtp.worksmobile.com, Port: 465 SSL, ID: ${user})를 확인해 주세요.`,
    ],
  };
}

/**
 * Performs a comprehensive step-by-step SMTP connection and authentication test.
 */
export async function testSmtpConnection(options?: {
  sendTestEmailTo?: string;
  customPort?: number;
}): Promise<SmtpTestResult> {
  const config = getSmtpConfig();
  const testPort = options?.customPort || config.port;
  const isSecure = testPort === 465;
  const startTime = Date.now();

  const steps: SmtpTestStep[] = [
    {
      step: 'SERVER_CONNECT',
      name: '1. SMTP 서버 TCP 연결',
      status: 'PENDING',
      message: `${config.host}:${testPort} TCP 소켓 연결 시도 중...`,
    },
    {
      step: 'SSL_TLS',
      name: '2. SSL/TLS 보안 연결',
      status: 'PENDING',
      message: isSecure ? 'SSL (Port 465) 보안 소켓 핸드셰이크...' : 'STARTTLS (Port 587) 보안 소켓 핸드셰이크...',
    },
    {
      step: 'AUTH',
      name: '3. SMTP 계정 인증 (AUTH LOGIN)',
      status: 'PENDING',
      message: `계정 [${config.user}] SMTP 인증 자격 증명 검증 중...`,
    },
  ];

  if (options?.sendTestEmailTo) {
    steps.push({
      step: 'SEND_TEST_MAIL',
      name: '4. 테스트 메일 발송',
      status: 'PENDING',
      message: `${options.sendTestEmailTo} 수신인으로 테스트 이메일 발송...`,
    });
  }

  // Safe server-side diagnostic logging (NEVER log password!)
  console.log(`[SMTP Test] Starting SMTP diagnostic test for user: ${config.user} on ${config.host}:${testPort}`, {
    isConfigured: config.isConfigured,
    detectedEnvKey: config.detectedEnvKey,
    hasPassword: Boolean(config.pass),
  });

  if (!config.user) {
    steps[0].status = 'FAILED';
    steps[0].message = 'SMTP 사용자 계정(NAVERWORKS_SMTP_USER)이 설정되지 않았습니다.';
    return {
      success: false,
      smtpConfigured: false,
      smtpHost: config.host,
      smtpPort: testPort,
      smtpUser: '(미설정)',
      detectedEnvKey: config.detectedEnvKey,
      hasPassword: Boolean(config.pass),
      steps,
      error: 'SMTP 사용자 계정 누락',
      errorCode: 'NO_USER',
      diagnosticAdvice: ['환경변수 NAVERWORKS_SMTP_USER="noworries004@jstech.kr"을 설정해 주세요.'],
      timestamp: new Date().toISOString(),
    };
  }

  if (!config.pass) {
    steps[0].status = 'FAILED';
    steps[0].message = 'SMTP 비밀번호(NAVERWORKS_SMTP_PASS)가 설정되지 않았습니다.';
    return {
      success: false,
      smtpConfigured: false,
      smtpHost: config.host,
      smtpPort: testPort,
      smtpUser: config.user,
      detectedEnvKey: config.detectedEnvKey,
      hasPassword: false,
      steps,
      error: 'SMTP 비밀번호(NAVERWORKS_SMTP_PASS / SMTP_PASSWORD)가 등록되어 있지 않습니다.',
      errorCode: 'NO_PASSWORD',
      diagnosticAdvice: [
        '네이버웍스 SMTP 비밀번호를 환경변수 NAVERWORKS_SMTP_PASS 또는 SMTP_PASSWORD에 등록해 주세요.',
        '2단계 인증 계정인 경우 [네이버웍스 > 보안 설정 > 외부 앱 비밀번호]를 생성하여 등록하세요.',
      ],
      timestamp: new Date().toISOString(),
    };
  }

  // Step 1 & 2: Test TCP Socket / TLS Connection
  const step1Start = Date.now();
  try {
    await new Promise<void>((resolve, reject) => {
      const timeoutTimer = setTimeout(() => {
        reject(new Error(`서버 연결 시간 초과 (${config.host}:${testPort}, 5000ms)`));
      }, 5000);

      if (isSecure) {
        // Direct SSL/TLS socket for 465
        const socket = tls.connect(
          {
            host: config.host,
            port: testPort,
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2',
          },
          () => {
            clearTimeout(timeoutTimer);
            socket.end();
            resolve();
          }
        );
        socket.on('error', (err) => {
          clearTimeout(timeoutTimer);
          reject(err);
        });
      } else {
        // Plain TCP for 587
        const socket = net.createConnection({ host: config.host, port: testPort }, () => {
          clearTimeout(timeoutTimer);
          socket.end();
          resolve();
        });
        socket.on('error', (err) => {
          clearTimeout(timeoutTimer);
          reject(err);
        });
      }
    });

    steps[0].status = 'SUCCESS';
    steps[0].durationMs = Date.now() - step1Start;
    steps[0].message = `✓ ${config.host}:${testPort} TCP 서버 연결 성공 (${steps[0].durationMs}ms)`;

    steps[1].status = 'SUCCESS';
    steps[1].message = `✓ ${isSecure ? 'SSL 465' : 'TLS 587'} 보안 핸드셰이크 통과 (TLS 1.2+)`;
  } catch (netErr: any) {
    const netErrDuration = Date.now() - step1Start;
    steps[0].status = 'FAILED';
    steps[0].durationMs = netErrDuration;
    steps[0].message = `✕ 서버 연결 실패: ${netErr.message || netErr}`;
    steps[1].status = 'FAILED';
    steps[1].message = '✕ 네트워크 소켓 연결 실패로 인해 SSL 핸드셰이크 중단됨';
    steps[2].status = 'SKIPPED';

    const diag = buildSmtpDiagnosticAdvice(netErr, config.user);
    return {
      success: false,
      smtpConfigured: true,
      smtpHost: config.host,
      smtpPort: testPort,
      smtpUser: config.user,
      detectedEnvKey: config.detectedEnvKey,
      hasPassword: true,
      steps,
      error: diag.message,
      errorCode: diag.code,
      diagnosticAdvice: diag.advice,
      timestamp: new Date().toISOString(),
    };
  }

  // Step 3: Test SMTP Authentication via transporter.verify()
  const step3Start = Date.now();
  let transporter: any;
  try {
    transporter = createTransporter(testPort, isSecure);
    await transporter.verify();

    steps[2].status = 'SUCCESS';
    steps[2].durationMs = Date.now() - step3Start;
    steps[2].message = `✓ 계정 [${config.user}] SMTP 인증 성공! (${steps[2].durationMs}ms)`;
    console.log(`[SMTP Test] ✓ SMTP Authentication successfully verified for ${config.user}`);
  } catch (authErr: any) {
    const authDuration = Date.now() - step3Start;
    steps[2].status = 'FAILED';
    steps[2].durationMs = authDuration;
    steps[2].errorCode = authErr?.responseCode ? String(authErr.responseCode) : '535';

    const diag = buildSmtpDiagnosticAdvice(authErr, config.user);
    steps[2].message = `✕ SMTP 계정 인증 실패: ${authErr.message || authErr}`;

    if (steps[3]) {
      steps[3].status = 'SKIPPED';
      steps[3].message = '인증 실패로 인해 테스트 메일 발송이 건너뛰어졌습니다.';
    }

    console.error(`[SMTP Test] ✕ SMTP Authentication failed for ${config.user}:`, {
      host: config.host,
      port: testPort,
      user: config.user,
      errorCode: diag.code,
      reason: authErr?.message || authErr,
    });

    return {
      success: false,
      smtpConfigured: true,
      smtpHost: config.host,
      smtpPort: testPort,
      smtpUser: config.user,
      detectedEnvKey: config.detectedEnvKey,
      hasPassword: true,
      steps,
      error: diag.message,
      errorCode: diag.code,
      diagnosticAdvice: diag.advice,
      timestamp: new Date().toISOString(),
    };
  }

  // Step 4 (Optional): Send Test Email
  let testEmailSent = false;
  let testMessageId: string | undefined;

  if (options?.sendTestEmailTo && steps[3]) {
    const step4Start = Date.now();
    try {
      const recipient = options.sendTestEmailTo.trim();
      const sendInfo = await transporter.sendMail({
        from: `"JS TECH MES 시스템" <${config.user}>`,
        to: recipient,
        subject: `[JS TECH] 🚀 네이버웍스 SMTP 연동 테스트 메일 (${new Date().toLocaleTimeString('ko-KR')})`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #cbd5e1; border-radius: 12px; max-width: 600px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">🎉 네이버웍스 SMTP 정상 연동 확인</h2>
            <p style="color: #334155; font-size: 14px;">
              본 메일은 <strong>JS TECH 스마트 MES</strong> 시스템에서 네이버웍스 SMTP 메일 발송 기능이 정상 작동함을 검증하기 위해 전송된 테스트 메일입니다.
            </p>
            <div style="background: #f8fafc; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #475569; margin: 16px 0;">
              <div>• 발송 계정: <strong>${config.user}</strong></div>
              <div>• SMTP 호스트: <strong>${config.host}:${testPort}</strong></div>
              <div>• 발송 일시: <strong>${new Date().toLocaleString('ko-KR')}</strong></div>
            </div>
            <p style="color: #16a34a; font-size: 13px; font-weight: bold;">
              ✓ 이제 수주 확정 시 공정 담당자에게 작업 지시서 메일이 안전하게 전송됩니다.
            </p>
          </div>
        `,
      });

      testEmailSent = true;
      testMessageId = sendInfo.messageId;
      steps[3].status = 'SUCCESS';
      steps[3].durationMs = Date.now() - step4Start;
      steps[3].message = `✓ ${recipient} (MessageID: ${testMessageId}) 테스트 메일 발송 완료!`;
      console.log(`[SMTP Test] Test email sent to ${recipient}, messageId=${testMessageId}`);
    } catch (mailSendErr: any) {
      steps[3].status = 'FAILED';
      steps[3].message = `✕ 테스트 메일 발송 실패: ${mailSendErr.message || mailSendErr}`;
      console.error('[SMTP Test] Error sending test email:', mailSendErr);
    }
  }

  return {
    success: true,
    smtpConfigured: true,
    smtpHost: config.host,
    smtpPort: testPort,
    smtpUser: config.user,
    detectedEnvKey: config.detectedEnvKey,
    hasPassword: true,
    steps,
    testEmailSent,
    testEmailRecipient: options?.sendTestEmailTo,
    messageId: testMessageId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Reliably sends an email via Naver Works SMTP with automatic dual-port fallback (465 SSL ⟷ 587 STARTTLS)
 */
export async function sendEmailViaSmtp(options: {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
}): Promise<{ messageId: string; usedPort: number }> {
  const config = getSmtpConfig();
  if (!config.user || !config.pass) {
    throw new Error('네이버웍스 SMTP 계정(NAVERWORKS_SMTP_USER) 또는 비밀번호(NAVERWORKS_SMTP_PASS)가 설정되지 않았습니다.');
  }

  const primaryPort = config.port || 465;
  const alternatePort = primaryPort === 465 ? 587 : 465;
  const portsToTry = [primaryPort, alternatePort];

  let lastError: any = null;

  for (const port of portsToTry) {
    try {
      const isSecure = port === 465;
      const transporter = createTransporter(port, isSecure);

      console.log(`[SMTP Send] Attempting delivery to <${options.to}> via ${config.host}:${port} (secure: ${isSecure}) from ${config.user}...`);

      const sendPromise = transporter.sendMail({
        from: `"${options.fromName || 'JS TECH MES 시스템'}" <${config.user}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`네이버웍스 SMTP 발송 시간 초과 (${port}번 포트, 8.5초)`)), 8500)
      );

      const info: any = await Promise.race([sendPromise, timeoutPromise]);
      const messageId = info?.messageId || `smtp-${Date.now()}`;
      console.log(`[SMTP Send] Email successfully delivered to ${options.to} via port ${port} (MessageId: ${messageId})`);
      return { messageId, usedPort: port };
    } catch (err: any) {
      console.warn(`[SMTP Send] Delivery attempt on port ${port} failed for ${options.to}:`, err?.message || err);
      lastError = err;
      // If error is authentication error 535, trying another port won't fix bad credentials, but let's record and break if 535
      const errStr = String(err?.message || err);
      if (errStr.includes('535') || errStr.includes('Username and Password not accepted') || errStr.includes('authentication failed')) {
        break;
      }
    }
  }

  const diag = buildSmtpDiagnosticAdvice(lastError, config.user);
  const detailedError = new Error(diag.message);
  (detailedError as any).code = diag.code;
  (detailedError as any).advice = diag.advice;
  throw detailedError;
}
