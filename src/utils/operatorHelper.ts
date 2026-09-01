import { SelectOption } from '../components/SearchableSelect';
import { User } from '../types';

export interface BadgeInfo {
  badge: string;
  badgeColor: string;
}

/**
 * Checks if a user is a valid, officially registered and approved member with valid email and information.
 * Strictly excludes dummy, placeholder, "이메일 미등록", and rejected/unregistered entries.
 */
export function isValidRegisteredOperatorUser(u: User): boolean {
  if (!u) return false;

  const rawName = (u.name || '').trim();
  if (!rawName) return false;

  const baseName = rawName.replace(/\s*\([^)]*\)/g, '').trim();
  if (
    !baseName ||
    baseName.length < 2 ||
    baseName === '(미지정)' ||
    baseName === '미지정' ||
    baseName.includes('미등록') ||
    baseName.includes('미지정') ||
    baseName.includes('더미') ||
    baseName.toLowerCase().includes('dummy') ||
    baseName.toLowerCase().includes('placeholder')
  ) {
    return false;
  }

  // Strictly check email: Must have a valid registered email address
  const email = (u.email || '').toLowerCase().trim();
  if (
    !email ||
    email === '(이메일 미등록)' ||
    email === '이메일 미등록' ||
    email === '미등록' ||
    !email.includes('@') ||
    !email.includes('.') ||
    email.includes('dummy') ||
    email.includes('placeholder')
  ) {
    return false;
  }

  // Exclude system administrator accounts from field operator assignments
  if (
    email === 'noworriesmate01@gmail.com' ||
    email.includes('admin@') ||
    baseName === '시스템 관리자' ||
    baseName === '시스템관리자' ||
    baseName === '관리자' ||
    u.department === '시스템 관리자'
  ) {
    return false;
  }

  // Exclude rejected accounts
  if (u.status === 'rejected') {
    return false;
  }

  // User must be approved or active registered member
  const isApproved =
    u.isApproved === true ||
    u.status === 'approved' ||
    (u.isApproved !== false && u.status !== 'pending');

  return isApproved;
}

/**
 * Extracts and formats valid approved operator strings ("이름 (팀명)") from usersList.
 */
export function extractValidApprovedOperators(
  usersList: User[] = [],
  additionalApprovedOps?: string[]
): string[] {
  const operatorMap = new Map<string, string>();

  const getTeamSuffix = (dept: string | undefined, u?: User): string => {
    const d = (dept || '').trim();
    if (d.includes('가공')) return '(가공)';
    if (d.includes('연마')) return '(연마)';
    if (d.includes('품질') || d.includes('검사')) return '(품질)';
    if (d.includes('조립') || d.includes('클린룸')) return '(조립)';
    if (d.includes('생산')) return '(생산)';

    if (u && (u.skillGrinderLevel || 0) > (u.skillMctLevel || 0)) {
      return '(연마)';
    }
    return '(가공)';
  };

  // 1. Process valid registered users from Firestore users list
  usersList.forEach((u) => {
    if (!isValidRegisteredOperatorUser(u)) return;

    const rawName = (u.name || '').trim();
    const baseName = rawName.replace(/\s*\([^)]*\)/g, '').trim();
    const teamSuffix = getTeamSuffix(u.department, u);
    operatorMap.set(baseName, `${baseName} ${teamSuffix}`);
  });

  // 2. Process any additional approved operator strings (validate against dummy/placeholder/admin)
  if (additionalApprovedOps && additionalApprovedOps.length > 0) {
    additionalApprovedOps.forEach((op) => {
      const clean = (op || '').trim();
      if (!clean) return;
      const baseName = clean.replace(/\s*\([^)]*\)/g, '').trim();
      if (
        !baseName ||
        baseName.length < 2 ||
        baseName === '시스템 관리자' ||
        baseName === '시스템관리자' ||
        baseName === '관리자' ||
        baseName.includes('미등록') ||
        baseName.includes('미지정') ||
        baseName.includes('더미') ||
        baseName.toLowerCase().includes('dummy')
      ) {
        return;
      }
      if (!operatorMap.has(baseName)) {
        let formatted = clean;
        if (!formatted.includes('(')) {
          formatted = `${baseName} (가공)`;
        }
        operatorMap.set(baseName, formatted);
      }
    });
  }

  // 3. Sort operators: (가공) -> (연마) -> (품질) -> (조립) -> (생산) -> Alphabetical
  const teamOrder: Record<string, number> = {
    '(가공)': 1,
    '(연마)': 2,
    '(품질)': 3,
    '(조립)': 4,
    '(생산)': 5,
    '(생산관리)': 5,
  };

  return Array.from(operatorMap.values()).sort((a, b) => {
    const getOrder = (str: string) => {
      for (const [tag, order] of Object.entries(teamOrder)) {
        if (str.includes(tag)) return order;
      }
      return 99;
    };
    const orderA = getOrder(a);
    const orderB = getOrder(b);
    if (orderA !== orderB) return orderA - orderB;
    return a.localeCompare(b, 'ko-KR');
  });
}

/**
 * Extract badge text and unified styling based on worker's name or team tag.
 */
export function getOperatorBadgeInfo(opName: string): BadgeInfo {
  const clean = (opName || '').trim();
  if (!clean || clean === '(미지정)' || clean === '미지정' || clean.includes('미지정')) {
    return {
      badge: '미지정',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
    };
  }
  if (clean === '(외주/협력사)' || clean.includes('외주') || clean.includes('협력사')) {
    return {
      badge: '외주',
      badgeColor: 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
    };
  }

  // Team matching
  if (clean.includes('(가공)') || clean.includes('가공')) {
    return {
      badge: '가공',
      badgeColor: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    };
  }
  if (clean.includes('(연마)') || clean.includes('연마') || clean.includes('래핑')) {
    return {
      badge: '연마',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    };
  }
  if (clean.includes('(품질)') || clean.includes('품질') || clean.includes('검사') || clean.includes('CMM')) {
    return {
      badge: '품질',
      badgeColor: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
    };
  }
  if (clean.includes('(조립)') || clean.includes('조립') || clean.includes('클린룸')) {
    return {
      badge: '조립',
      badgeColor: 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
    };
  }
  if (clean.includes('(생산') || clean.includes('생산')) {
    return {
      badge: '생산',
      badgeColor: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    };
  }

  return {
    badge: '현장',
    badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
  };
}

export interface BuildOperatorOptionsConfig {
  placeholderLabel?: string;
  allowOutsourcing?: boolean;
  busyWorkersMap?: Map<string, any>;
  customPlaceholderValue?: string;
}

/**
 * Builds unified SelectOption[] for Operator Dropdown across all modals:
 * - 수주 및 공정 구성 수정 (EditOrderModal)
 * - 신규 수주 등록 (OrderForm)
 * - 캘린더 공정 상세 (CalendarTaskDetailModal)
 * - 공정 타임라인 상세 (ProcessDetailModal)
 * - 현장 MES 실행 (FloorExecutionView)
 */
export function buildOperatorSelectOptions(
  approvedOperators: string[] = [],
  currentValues?: string | (string | undefined | null)[] | null,
  config?: BuildOperatorOptionsConfig
): SelectOption[] {
  const placeholderLabel = config?.placeholderLabel ?? '(미지정)';
  const customPlaceholderValue = config?.customPlaceholderValue ?? '';
  const allowOutsourcing = config?.allowOutsourcing ?? false;
  const busyWorkersMap = config?.busyWorkersMap;

  const opts: SelectOption[] = [
    {
      value: customPlaceholderValue,
      label: placeholderLabel,
      badge: '미지정',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
    },
  ];

  const addedValues = new Set<string>([customPlaceholderValue, '']);

  // Add outsourcing option if allowed
  if (allowOutsourcing) {
    opts.push({
      value: '(외주/협력사)',
      label: '(외주/협력사)',
      badge: '외주',
      badgeColor: 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
    });
    addedValues.add('(외주/협력사)');
  }

  // Iterate over approved master operators
  approvedOperators.forEach((op) => {
    const clean = (op || '').trim();
    if (!clean || addedValues.has(clean)) return;

    const baseName = clean.replace(/\s*\([^)]*\)/g, '').trim();
    if (
      !baseName ||
      baseName === '시스템 관리자' ||
      baseName === '시스템관리자' ||
      baseName === '관리자' ||
      baseName.includes('미등록') ||
      baseName.includes('미지정') ||
      baseName.includes('더미')
    ) {
      return;
    }

    addedValues.add(clean);

    const { badge, badgeColor } = getOperatorBadgeInfo(clean);
    const isBusy = busyWorkersMap ? (busyWorkersMap.get(clean) || busyWorkersMap.get(baseName)) : false;

    opts.push({
      value: clean,
      label: isBusy ? `${clean} ⚠️(작업중)` : clean,
      badge: isBusy ? '작업중 충돌' : badge,
      badgeColor: isBusy
        ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
        : badgeColor,
    });
  });

  // Also ensure any currently assigned worker value (e.g. from existing DB record) is present in the list,
  // while strictly skipping dummy/unregistered/placeholder values
  const extraValues: string[] = Array.isArray(currentValues)
    ? (currentValues.filter(Boolean) as string[])
    : currentValues ? [currentValues] : [];

  extraValues.forEach((val) => {
    const clean = (val || '').trim();
    if (!clean || addedValues.has(clean)) return;

    const baseName = clean.replace(/\s*\([^)]*\)/g, '').trim();
    if (
      !baseName ||
      baseName === '(미지정)' ||
      baseName === '미지정' ||
      baseName === '시스템 관리자' ||
      baseName === '시스템관리자' ||
      baseName === '관리자' ||
      baseName.includes('미등록') ||
      baseName.includes('미지정') ||
      baseName.includes('더미') ||
      baseName.toLowerCase().includes('dummy')
    ) {
      return;
    }

    addedValues.add(clean);

    const { badge, badgeColor } = getOperatorBadgeInfo(clean);
    opts.push({
      value: clean,
      label: clean,
      badge,
      badgeColor,
    });
  });

  return opts;
}
