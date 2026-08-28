import { Order, ProcessStep, User, ProcessProgressMap } from '../types';
import { saveOrderToFirestore, saveProcessProgressToFirestore } from '../lib/firebase';
import { resolvePublicAppUrl, buildFloorDeepLink } from './urlResolver';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  unassignedMachines: number;
  unassignedWorkers: number;
}

export interface OperatorDispatchDetail {
  name: string;
  email?: string;
  phoneNumber?: string;
  department?: string;
  processCount: number;
  processes: string[];
  deepLink?: string;
  emailStatus?: 'SENT' | 'SIMULATED' | 'FAILED' | 'SKIPPED';
  smsStatus?: 'SENT' | 'SIMULATED' | 'FAILED' | 'SKIPPED';
  smsText?: string;
  error?: string;
  smsError?: string;
}

export interface DispatchExecutionResult {
  success: boolean;
  orderId: string;
  orderName: string;
  dispatchedProcessesCount: number;
  assignedOperatorsCount: number;
  operatorDetails: OperatorDispatchDetail[];
  apiResponse?: any;
  message: string;
  resolvedBaseUrl: string;
  sendEmail: boolean;
  sendSms: boolean;
}

export interface DispatchOptions {
  customDispatchedBy?: string;
  baseUrl?: string;
  sendEmail?: boolean;
  sendSms?: boolean;
  overrideContacts?: Record<string, { email?: string; phone?: string }>;
}

/**
 * Validates whether an order and its routing steps are ready for field dispatch.
 */
export function validateOrderForDispatch(
  order: Order,
  processes: ProcessStep[] = []
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let unassignedMachines = 0;
  let unassignedWorkers = 0;

  if (!order) {
    errors.push('수주 정보가 유효하지 않습니다.');
    return { valid: false, errors, warnings, unassignedMachines, unassignedWorkers };
  }

  if (!order.id || !order.name) {
    errors.push('수주 고유 ID 또는 수주명이 누락되었습니다.');
  }

  if (!processes || processes.length === 0) {
    errors.push('배포할 공정 라우팅 단계가 존재하지 않습니다.');
    return { valid: false, errors, warnings, unassignedMachines, unassignedWorkers };
  }

  // Check each process step
  processes.forEach((p, idx) => {
    const stepNum = idx + 1;
    const pName = p.name || `공정 #${stepNum}`;
    const machine = (p.assignedMachine || '').trim();
    const worker = (p.worker || p.assignedWorker || '').trim();

    if (!machine || machine === '(미지정)' || machine === '미지정') {
      unassignedMachines++;
      warnings.push(`[공정 #${stepNum} - ${pName}] 가공/검사 설비가 지정되지 않았습니다.`);
    }

    if (!worker || worker === '(미지정)' || worker === '미지정') {
      unassignedWorkers++;
      warnings.push(`[공정 #${stepNum} - ${pName}] 담당 작업자가 지정되지 않았습니다.`);
    }
  });

  // Critical error only if ALL processes lack both machine and worker
  if (unassignedWorkers === processes.length && unassignedMachines === processes.length) {
    errors.push('모든 공정 단계에 설비 및 담당자가 배정되지 않았습니다. 최소 1개 이상의 배정이 필요합니다.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    unassignedMachines,
    unassignedWorkers,
  };
}

/**
 * Executes field dispatch for an order:
 * 1. Updates Firestore Order status to 'DISPATCHED'
 * 2. Updates all unit process progress items to 'DISPATCHED' status
 * 3. Triggers /api/dispatch-notification for Naver Works SMTP email, Mobile SMS/Alimtalk & DeepLinks
 */
export async function executeOrderDispatch(
  order: Order,
  processes: ProcessStep[],
  usersList: User[] = [],
  currentUser?: User | null,
  options?: DispatchOptions
): Promise<DispatchExecutionResult> {
  const dispatchedAt = new Date().toISOString();
  const dispatchedAtLocale = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const dispatchedBy =
    options?.customDispatchedBy ||
    currentUser?.name ||
    order.writerName ||
    '생산관리팀';

  const sendEmail = options?.sendEmail !== false;
  const sendSms = options?.sendSms !== false;
  const currentBaseUrl = resolvePublicAppUrl(options?.baseUrl);

  // 1. Update Order in Firestore
  const updatedOrder: Order = {
    ...order,
    status: 'DISPATCHED',
    dispatchedAt,
    customProcesses: processes,
    approverName: currentUser?.name || order.approverName || '시스템 승인',
  };

  await saveOrderToFirestore(updatedOrder);

  // 2. Batch update ProcessProgress items for all units Q1..Qqty
  const qty = order.qty || 1;
  for (let q = 1; q <= qty; q++) {
    for (let pIdx = 0; pIdx < processes.length; pIdx++) {
      const step = processes[pIdx];
      const pKey = `${order.id}_Q${q}_P${pIdx}`;

      await saveProcessProgressToFirestore(pKey, {
        isCompleted: false,
        status: 'DISPATCHED',
        machine: step.assignedMachine || '',
        worker: step.worker || step.assignedWorker || '',
        memo: step.memo || '',
      });
    }
  }

  // 3. Group processes by assigned worker and lookup user contact info
  const workerGroupMap = new Map<
    string,
    {
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
    }
  >();

  // Map users for fast lookup by name or base name
  const userMap = new Map<string, User>();
  usersList.forEach((u) => {
    const rawName = (u.name || '').trim();
    const baseName = rawName.replace(/\s*\([^)]*\)/g, '').trim();
    if (baseName) userMap.set(baseName, u);
    if (rawName) userMap.set(rawName, u);
  });

  processes.forEach((step, pIdx) => {
    const rawWorker = (step.worker || step.assignedWorker || '').trim();
    if (!rawWorker || rawWorker === '(미지정)' || rawWorker === '미지정') return;

    const baseName = rawWorker.replace(/\s*\([^)]*\)/g, '').trim();
    const foundUser = userMap.get(baseName) || userMap.get(rawWorker);
    const override = options?.overrideContacts?.[baseName] || options?.overrideContacts?.[rawWorker];

    if (!workerGroupMap.has(baseName)) {
      workerGroupMap.set(baseName, {
        name: baseName,
        email: override?.email !== undefined ? override.email : foundUser?.email || '',
        phoneNumber:
          override?.phone !== undefined
            ? override.phone
            : foundUser?.phoneNumber || foundUser?.phone_number || '',
        department: foundUser?.department || '',
        assignedProcesses: [],
      });
    }

    const group = workerGroupMap.get(baseName)!;
    group.assignedProcesses.push({
      index: pIdx,
      processName: step.name,
      category: step.category || '가공',
      machine: step.assignedMachine || '(설비 미지정)',
      durationHours: step.durationHours || 1,
      phaseId: step.phaseId,
      processKey: `${order.id}_Q1_P${pIdx}`,
    });
  });

  const operatorContacts = Array.from(workerGroupMap.values());

  // 4. Trigger backend notification API (/api/dispatch-notification)
  let apiResponse: any = null;
  let apiCallError: string | null = null;

  try {
    console.log(`[DispatchHelper] Calling /api/dispatch-notification for ${operatorContacts.length} operators...`);
    const res = await fetch('/api/dispatch-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order: {
          id: order.id,
          name: order.name,
          customer: order.customer,
          poNumber: order.poNumber,
          partName: order.partName,
          partType: order.partType,
          spec: order.spec,
          material: order.material,
          tolerance: order.tolerance,
          coatingSpec: order.coatingSpec,
          serialNo: order.serialNo,
          dueDate: order.dueDate,
          startDate: order.startDate,
          qty: order.qty,
          specialNotes: order.specialNotes,
          memo: order.memo,
          customProcesses: processes,
        },
        operatorContacts,
        dispatchedBy,
        dispatchedAt: dispatchedAtLocale,
        baseUrl: currentBaseUrl,
        sendEmail,
        sendSms,
      }),
    });

    const responseText = await res.text();
    try {
      apiResponse = JSON.parse(responseText);
    } catch {
      apiResponse = { error: responseText, message: `서버 응답 파싱 오류 (HTTP ${res.status}): ${responseText}` };
    }

    if (!res.ok) {
      apiCallError = apiResponse?.error || `API 응답 오류 (HTTP ${res.status})`;
      console.error(`[DispatchHelper] /api/dispatch-notification returned HTTP ${res.status}:`, apiResponse);
    } else {
      console.log('[DispatchHelper] /api/dispatch-notification succeeded:', apiResponse);
    }
  } catch (apiErr: any) {
    apiCallError = apiErr?.message || '알림 API 서버 연결 실패';
    console.error('[DispatchHelper] Failed to call /api/dispatch-notification:', apiErr);
    apiResponse = {
      success: false,
      error: apiCallError,
      message: `알림 발송 서버 연결 중 오류가 발생했습니다: ${apiCallError}`,
    };
  }

  // 5. Build operator summary with deep links and delivery statuses
  const operatorDetails: OperatorDispatchDetail[] = operatorContacts.map((op) => {
    const firstProc = op.assignedProcesses[0];
    const pid = firstProc ? `P${firstProc.index}` : 'P0';
    const deepLink =
      apiResponse?.overallDeepLinks?.[op.name] ||
      buildFloorDeepLink(order.id, pid, currentBaseUrl);

    const apiItem = apiResponse?.results?.find((r: any) => r.operator === op.name);

    return {
      name: op.name,
      email: op.email,
      phoneNumber: op.phoneNumber,
      department: op.department,
      processCount: op.assignedProcesses.length,
      processes: op.assignedProcesses.map((p) => p.processName),
      deepLink,
      emailStatus: apiItem?.emailStatus || (sendEmail ? (apiCallError ? 'FAILED' : 'SIMULATED') : 'SKIPPED'),
      smsStatus: apiItem?.smsStatus || (sendSms ? (apiCallError ? 'FAILED' : 'SIMULATED') : 'SKIPPED'),
      smsText: apiItem?.smsText,
      error: apiItem?.error || (sendEmail && apiCallError ? apiCallError : undefined),
      smsError: apiItem?.smsError || (sendSms && apiCallError ? apiCallError : undefined),
    };
  });

  return {
    success: true,
    orderId: order.id,
    orderName: order.name,
    dispatchedProcessesCount: processes.length * qty,
    assignedOperatorsCount: operatorContacts.length,
    operatorDetails,
    apiResponse,
    message:
      apiResponse?.message ||
      `수주 [${order.name}]가 성공적으로 확정 및 현장 배포(DISPATCHED)되었습니다.`,
    resolvedBaseUrl: currentBaseUrl,
    sendEmail,
    sendSms,
  };
}
