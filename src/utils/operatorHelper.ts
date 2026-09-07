import { SelectOption } from '../components/SearchableSelect';
import { User } from '../types';

export interface BadgeInfo {
  badge: string;
  badgeColor: string;
}

/**
 * Canonical list of departments that perform physical floor operations (현장 담당자 부서 목록).
 * Current Standard: 현장 담당자 = 가공팀, 연마팀, 품질팀
 * Excluded: 영업팀, 경영진, 생산관리, 시스템 관리자
 */
export const FIELD_OPERATOR_DEPARTMENTS = [
  '가공팀',
  '연마팀',
  '품질팀',
] as const;

export type FieldOperatorDepartment = (typeof FIELD_OPERATOR_DEPARTMENTS)[number];

export const EXCLUDED_OPERATOR_DEPARTMENTS = [
  '영업팀',
  '경영진',
  '생산관리',
  '생산 관리',
  '시스템 관리자',
] as const;

/**
 * Determines whether a given department string qualifies as a field operator department.
 * Accepts exact matches ('가공팀', '연마팀', '품질팀') or normalized field keywords.
 * Strictly excludes non-field departments: '영업팀', '경영진', '생산관리', '시스템 관리자'.
 */
export function isFieldOperatorDepartment(dept?: string | null): boolean {
  if (!dept) return false;
  const d = dept.trim();

  // 1. Explicitly reject non-field / excluded departments
  if (
    d === '영업팀' ||
    d.includes('영업') ||
    d === '경영진' ||
    d.includes('경영') ||
    d.includes('임원') ||
    d === '생산관리' ||
    d === '생산 관리' ||
    d === '시스템 관리자' ||
    d.includes('관리자')
  ) {
    return false;
  }

  // 2. Allow matching field departments
  return (
    FIELD_OPERATOR_DEPARTMENTS.some(
      (allowed) => d === allowed || d.includes(allowed.replace('팀', ''))
    ) ||
    d.includes('가공') ||
    d.includes('연마') ||
    d.includes('래핑') ||
    d.includes('품질') ||
    d.includes('검사') ||
    d.includes('CMM')
  );
}

/**
 * Determines whether a worker string/label belongs to an excluded department or contains non-field tags.
 */
export function isExcludedOperatorString(opStr?: string | null): boolean {
  if (!opStr) return true;
  const clean = opStr.trim();
  if (
    clean === '(미지정)' ||
    clean === '미지정' ||
    clean === '시스템 관리자' ||
    clean === '시스템관리자' ||
    clean === '관리자' ||
    clean.includes('영업') ||
    clean.includes('경영') ||
    clean.includes('임원') ||
    clean.includes('생산관리') ||
    clean.includes('관리자') ||
    clean.includes('더미') ||
    clean.toLowerCase().includes('dummy') ||
    clean.toLowerCase().includes('placeholder')
  ) {
    return true;
  }
  return false;
}

/**
 * Strips any parentheses from a worker or user name to get the pure base name.
 * e.g. "박세령 (가공)" -> "박세령", "김현아 (경영진)" -> "김현아"
 */
export function getBaseWorkerName(name?: string | null): string {
  return (name || '').replace(/\s*\([^)]*\)/g, '').trim();
}

/**
 * Canonical helper to get the standardized department tag for display:
 * - '가공팀' -> '(가공)'
 * - '연마팀' -> '(연마)'
 * - '품질팀' -> '(품질)'
 * - '생산관리' -> '(생산관리)'
 * - '영업팀' -> '(영업팀)'
 * - '경영진' -> '(경영진)'
 * - '시스템 관리자' -> '(관리자)'
 */
export function getDepartmentSuffix(dept?: string | null, u?: User): string {
  const d = (dept || '').trim();
  if (!d || d === '미지정') {
    if (u && (u.skillGrinderLevel || 0) > (u.skillMctLevel || 0)) {
      return '(연마)';
    }
    return '(가공)';
  }
  if (d === '영업팀' || d.includes('영업')) return '(영업팀)';
  if (d === '경영진' || d.includes('경영') || d.includes('임원')) return '(경영진)';
  if (d === '시스템 관리자' || d.includes('관리자')) return '(관리자)';
  if (d === '생산관리' || d === '생산 관리') return '(생산관리)';
  if (d.includes('품질') || d.includes('검사')) return '(품질)';
  if (d.includes('연마') || d.includes('래핑')) return '(연마)';
  if (d.includes('가공')) return '(가공)';
  if (d.includes('조립') || d.includes('클린룸')) return '(조립)';
  if (d.includes('생산')) return '(생산)';
  return `(${d.replace('팀', '')})`;
}

/**
 * Returns formatted operator display string "이름 (부서)" by looking up the latest
 * user record in usersList at render time.
 * If user exists in usersList, always uses their current department!
 */
export function formatOperatorWithLatestDept(
  nameOrString: string,
  usersList: User[] = []
): string {
  const baseName = getBaseWorkerName(nameOrString);
  if (!baseName) return nameOrString || '';
  if (baseName === '미지정' || baseName === '(미지정)' || baseName.includes('외주') || baseName.includes('협력사')) {
    return nameOrString;
  }

  const user = usersList.find((u) => getBaseWorkerName(u.name) === baseName);
  if (user && user.department && user.department !== '미지정') {
    const suffix = getDepartmentSuffix(user.department, user);
    return suffix ? `${baseName} ${suffix}` : baseName;
  }

  const match = (nameOrString || '').match(/\(([^)]+)\)/);
  if (match) {
    return `${baseName} (${match[1]})`;
  }
  return baseName;
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

  // Check email: reject dummy/placeholder accounts
  const email = (u.email || '').toLowerCase().trim();
  if (email.includes('dummy') || email.includes('placeholder')) {
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
 * Checks if a user is an active approved member of a field department (가공팀, 연마팀, 품질팀).
 * Strictly excludes 영업팀, 경영진, 생산관리, 시스템 관리자.
 */
export function isFieldOperatorUser(u: User): boolean {
  if (!isValidRegisteredOperatorUser(u)) return false;
  return isFieldOperatorDepartment(u.department);
}

/**
 * Extracts and formats valid approved field operator strings ("이름 (팀명)") strictly from usersList (source of truth).
 * Unified across the entire system: ONLY returns members from 가공팀, 연마팀, 품질팀.
 * Strictly excludes 영업팀, 경영진, 생산관리, 시스템 관리자.
 */
export function extractValidApprovedOperators(
  usersList: User[] = [],
  additionalApprovedOps?: string[]
): string[] {
  const operatorMap = new Map<string, string>();

  // 1. Process valid registered field users from Firestore users list (Source of Truth)
  usersList.forEach((u) => {
    if (!isFieldOperatorUser(u)) return;

    const rawName = (u.name || '').trim();
    const baseName = getBaseWorkerName(rawName);
    if (!baseName) return;

    const teamSuffix = getDepartmentSuffix(u.department, u);
    operatorMap.set(baseName, `${baseName} ${teamSuffix}`);
  });

  // 2. Process any additional approved operator strings (validate against excluded departments)
  if (additionalApprovedOps && additionalApprovedOps.length > 0) {
    additionalApprovedOps.forEach((op) => {
      const clean = (op || '').trim();
      if (!clean || isExcludedOperatorString(clean)) return;

      const baseName = getBaseWorkerName(clean);
      if (!baseName || baseName.length < 2) return;

      // If user is already in operatorMap (derived from usersList), DO NOT OVERWRITE
      if (!operatorMap.has(baseName)) {
        const foundUser = usersList.find((u) => getBaseWorkerName(u.name) === baseName);
        if (foundUser) {
          if (isFieldOperatorUser(foundUser)) {
            const suffix = getDepartmentSuffix(foundUser.department, foundUser);
            operatorMap.set(baseName, `${baseName} ${suffix}`);
          }
        } else {
          // If not in usersList, only keep if the string itself qualifies as field operator
          if (
            clean.includes('(가공)') ||
            clean.includes('가공') ||
            clean.includes('(연마)') ||
            clean.includes('연마') ||
            clean.includes('래핑') ||
            clean.includes('(품질)') ||
            clean.includes('품질') ||
            clean.includes('검사') ||
            clean.includes('CMM')
          ) {
            let formatted = clean;
            if (!formatted.includes('(')) {
              formatted = `${baseName} (가공)`;
            }
            operatorMap.set(baseName, formatted);
          }
        }
      }
    });
  }

  // 3. Sort operators: (가공) -> (연마) -> (품질) -> Alphabetical
  const teamOrder: Record<string, number> = {
    '(가공)': 1,
    '(연마)': 2,
    '(품질)': 3,
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

export interface FieldOperatorInfo {
  baseName: string;
  displayName: string;
  departmentSuffix: string;
}

/**
 * Common extractor for field operators returning structured objects { baseName, displayName, departmentSuffix }.
 * Uses the canonical FIELD_OPERATOR_DEPARTMENTS and isFieldOperatorUser.
 */
export function extractFieldOperatorObjects(
  usersList: User[] = [],
  additionalApprovedOps?: string[]
): FieldOperatorInfo[] {
  const ops = extractValidApprovedOperators(usersList, additionalApprovedOps);
  return ops.map((op) => {
    const baseName = getBaseWorkerName(op);
    const match = op.match(/\(([^)]+)\)/);
    const suffix = match ? `(${match[1]})` : '';
    return {
      baseName,
      displayName: op,
      departmentSuffix: suffix,
    };
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
  if (clean.includes('(생산관리)') || clean.includes('(생산') || clean.includes('생산')) {
    return {
      badge: '생산',
      badgeColor: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    };
  }
  if (clean.includes('(영업팀)') || clean.includes('(영업)') || clean.includes('영업')) {
    return {
      badge: '영업팀',
      badgeColor: 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
    };
  }
  if (clean.includes('(경영진)') || clean.includes('(경영)') || clean.includes('경영')) {
    return {
      badge: '경영진',
      badgeColor: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
    };
  }
  if (clean.includes('(관리자)') || clean.includes('(관리)') || clean.includes('관리자')) {
    return {
      badge: '관리자',
      badgeColor: 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
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
  usersList?: User[];
}

/**
 * Builds unified SelectOption[] for Operator Dropdown across all modals:
 * - 수주 및 공정 구성 수정 (EditOrderModal)
 * - 수주 등록 (OrderForm)
 * - 캘린더 공정 상세 (CalendarTaskDetailModal)
 * - 생산 타임라인 상세 (ProcessDetailModal)
 * - 공정 실행 (FloorExecutionView)
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
  const addedBaseNames = new Set<string>();

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
    if (!clean || addedValues.has(clean) || isExcludedOperatorString(clean)) return;

    const baseName = getBaseWorkerName(clean);
    if (!baseName) return;

    addedValues.add(clean);
    addedBaseNames.add(baseName);

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
  // while strictly skipping excluded departments, dummy/unregistered/placeholder values,
  // and avoiding stale duplicates if the base worker is already in the list
  const extraValues: string[] = Array.isArray(currentValues)
    ? (currentValues.filter(Boolean) as string[])
    : currentValues ? [currentValues] : [];

  extraValues.forEach((val) => {
    const clean = (val || '').trim();
    if (!clean || addedValues.has(clean) || isExcludedOperatorString(clean)) return;

    const baseName = getBaseWorkerName(clean);
    if (!baseName) return;

    // If the operator already exists in approved list with their latest department, don't re-add an old snapshot!
    if (addedBaseNames.has(baseName)) {
      return;
    }

    addedValues.add(clean);
    addedBaseNames.add(baseName);

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
