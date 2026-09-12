import { User, UserDepartment, UserPermissions } from '../types';

export type MenuId =
  | 'dashboard'
  | 'order-form'
  | 'order-master'
  | 'routing'
  | 'actual-analysis'
  | 'calendar'
  | 'timeline'
  | 'execution'
  | 'equipment'
  | 'quality'
  | 'archive';

export interface MenuDefinition {
  id: MenuId;
  label: string;
  sublabel: string;
  featureName: string;
  category: '현장' | '생산/수주' | '품질' | '분석/일정' | '시스템';
  relatedPermKey?: keyof UserPermissions;
  description: string;
  icon: string;
}

export const MENU_DEFINITIONS: MenuDefinition[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    sublabel: '설비 21대/실시간 현황',
    featureName: '대시보드',
    category: '분석/일정',
    description: '공장 전체 가동률(OEE), 수주 현황 및 생산 진척 모니터링',
    icon: '📊',
  },
  {
    id: 'order-form',
    label: '수주 등록',
    sublabel: '수주 스펙 및 공정 지정',
    featureName: '수주 등록',
    category: '생산/수주',
    relatedPermKey: 'canEditOrder',
    description: '신규 고객사 수주 등록 및 초기 공정/일정 배포',
    icon: '📝',
  },
  {
    id: 'order-master',
    label: '수주관리',
    sublabel: '수주 현황, 사양 수정 & 보관',
    featureName: '수주/공정 관리',
    category: '생산/수주',
    relatedPermKey: 'canEditOrder',
    description: '수주 목록 조회, 사양/공정 스펙 수정, 완료 보관 처리',
    icon: '📋',
  },
  {
    id: 'routing',
    label: '공정 구성',
    sublabel: '제품 타입 & 표준시간',
    featureName: '마스터 관리 (공정)',
    category: '생산/수주',
    relatedPermKey: 'canEditMaster',
    description: '표준 공정 라우팅, 제품 타입 및 표준 가공 시간 설정',
    icon: '⚙️',
  },
  {
    id: 'actual-analysis',
    label: '공정 분석',
    sublabel: 'Plan vs. Actual 편차/지연 추적',
    featureName: '공정 분석',
    category: '분석/일정',
    description: '계획 대비 실적 오차 및 지연 공정 종합 분석',
    icon: '📈',
  },
  {
    id: 'calendar',
    label: '생산 캘린더',
    sublabel: '일간/주간/월간 실시간 일정',
    featureName: '생산 캘린더',
    category: '분석/일정',
    relatedPermKey: 'canEditOrder',
    description: '월간/주간/일간 캘린더 기반 생산 일정 조회 및 스케줄링',
    icon: '📅',
  },
  {
    id: 'timeline',
    label: '생산 타임라인',
    sublabel: '장기 타임라인 차트',
    featureName: '생산 타임라인',
    category: '분석/일정',
    relatedPermKey: 'canEditOrder',
    description: '간트 차트 기반 수주별 공정 흐름 및 간섭 분석',
    icon: '⏱️',
  },
  {
    id: 'execution',
    label: '공정 실행',
    sublabel: '시작/일시정지/완료 터미널',
    featureName: '공정 실행',
    category: '현장',
    relatedPermKey: 'canExecuteMES',
    description: '현장 터미널에서 공정 착수, 안돈(일시정지), 완료 및 실적 등록',
    icon: '🏭',
  },
  {
    id: 'equipment',
    label: '설비 현황',
    sublabel: '총 21대 설비 가동 모니터링',
    featureName: '설비 현황',
    category: '현장',
    description: '설비별 가동/비가동 상태 및 담당자 배정 현황 확인',
    icon: '🤖',
  },
  {
    id: 'quality',
    label: '품질/검사',
    sublabel: '3D 정밀측정 및 성적서 관리',
    featureName: '품질 검사 및 출하 승인 (COA)',
    category: '품질',
    relatedPermKey: 'canQualityInspection',
    description: '수입/공정/출하 검사 성적서 등록, 3D CMM 정밀 측정 및 출하 승인/COA 발행 관리',
    icon: '🔬',
  },
  {
    id: 'archive',
    label: '완료 보관함',
    sublabel: '완료 수주 아카이브 & 사양 복사',
    featureName: '완료 보관함 & 수주 삭제',
    category: '생산/수주',
    relatedPermKey: 'canArchive',
    description: '완료된 수주 아카이브 조회, 활성 수주 복원 및 보관함 내 수주 영구 삭제 관리',
    icon: '📦',
  },
];

export const MENU_LABELS: Record<string, string> = {
  dashboard: '대시보드',
  'order-form': '수주 등록',
  'order-master': '수주관리',
  routing: '공정 구성',
  'actual-analysis': '공정 분석',
  calendar: '생산 캘린더',
  timeline: '생산 타임라인',
  execution: '공정 실행',
  equipment: '설비 현황',
  quality: '품질/검사',
  archive: '완료 보관함',
};

export const ALL_MENU_IDS: MenuId[] = [
  'dashboard',
  'order-form',
  'order-master',
  'routing',
  'actual-analysis',
  'calendar',
  'timeline',
  'execution',
  'equipment',
  'quality',
  'archive',
];

export const DEPARTMENT_OPTIONS: UserDepartment[] = [
  '가공팀',
  '연마팀',
  '품질팀',
  '생산관리',
  '시스템 관리자',
  '영업팀',
  '경영진',
];

export interface DepartmentPresetConfig {
  role: 'USER' | 'ADMIN';
  label: string;
  badgeClass: string;
  desc: string;
  icon: string;
  defaultMenus: MenuId[];
  defaultEdits: Record<string, boolean>;
  permissions: UserPermissions;
}

export const DEPARTMENT_PRESETS: Record<string, DepartmentPresetConfig> = {
  '가공팀': {
    role: 'USER',
    label: '가공팀',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    desc: '현장 담당자 - 생산 캘린더/타임라인 조회, 공정 실행(MCT 가공 착수/완료/상태변경)',
    icon: '⚙️',
    defaultMenus: ['calendar', 'timeline', 'execution'],
    defaultEdits: { calendar: false, timeline: false, execution: true },
    permissions: {
      allowedMenus: ['calendar', 'timeline', 'execution'],
      menuEdits: { calendar: false, timeline: false, execution: true },
      canManageUsers: false,
      canEditOrder: false,
      canExecuteMES: true,
      canEditMaster: false,
      canArchive: false,
      canQualityInspection: false,
      canShipmentControl: false,
    },
  },
  '연마팀': {
    role: 'USER',
    label: '연마팀',
    badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    desc: '현장 담당자 - 생산 캘린더/타임라인 조회, 공정 실행(평면/성형 연마 착수/완료/상태변경)',
    icon: '✨',
    defaultMenus: ['calendar', 'timeline', 'execution'],
    defaultEdits: { calendar: false, timeline: false, execution: true },
    permissions: {
      allowedMenus: ['calendar', 'timeline', 'execution'],
      menuEdits: { calendar: false, timeline: false, execution: true },
      canManageUsers: false,
      canEditOrder: false,
      canExecuteMES: true,
      canEditMaster: false,
      canArchive: false,
      canQualityInspection: false,
      canShipmentControl: false,
    },
  },
  '품질팀': {
    role: 'USER',
    label: '품질팀',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    desc: '현장 담당자 + 품질 검사 - 생산 캘린더/타임라인 조회, 공정 실행, 3D CMM 성적서 및 출하 관리',
    icon: '🔬',
    defaultMenus: ['calendar', 'timeline', 'execution', 'quality'],
    defaultEdits: { calendar: false, timeline: false, execution: true, quality: true },
    permissions: {
      allowedMenus: ['calendar', 'timeline', 'execution', 'quality'],
      menuEdits: { calendar: false, timeline: false, execution: true, quality: true },
      canManageUsers: false,
      canEditOrder: false,
      canExecuteMES: true,
      canEditMaster: false,
      canArchive: false,
      canQualityInspection: true,
      canShipmentControl: true,
    },
  },
  '생산관리': {
    role: 'USER',
    label: '생산관리',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    desc: '중간 관리자 - 수주, 스케줄링, 공정 배포 및 모든 일반 업무 총괄',
    icon: '📊',
    defaultMenus: [
      'dashboard',
      'order-form',
      'order-master',
      'routing',
      'actual-analysis',
      'calendar',
      'timeline',
      'execution',
      'equipment',
      'quality',
      'archive',
    ],
    defaultEdits: {
      dashboard: true,
      'order-form': true,
      'order-master': true,
      routing: true,
      'actual-analysis': true,
      calendar: true,
      timeline: true,
      execution: true,
      equipment: true,
      quality: true,
      archive: true,
    },
    permissions: {
      allowedMenus: [
        'dashboard',
        'order-form',
        'order-master',
        'routing',
        'actual-analysis',
        'calendar',
        'timeline',
        'execution',
        'equipment',
        'quality',
        'archive',
      ],
      menuEdits: {
        dashboard: true,
        'order-form': true,
        'order-master': true,
        routing: true,
        'actual-analysis': true,
        calendar: true,
        timeline: true,
        execution: true,
        equipment: true,
        quality: true,
        archive: true,
      },
      canManageUsers: false,
      canEditOrder: true,
      canExecuteMES: true,
      canEditMaster: true,
      canArchive: true,
      canQualityInspection: true,
      canShipmentControl: true,
    },
  },
  // Alias support for legacy '생산 관리'
  '생산 관리': {
    role: 'USER',
    label: '생산관리',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    desc: '중간 관리자 - 수주, 스케줄링, 공정 배포 및 모든 일반 업무 총괄',
    icon: '📊',
    defaultMenus: [
      'dashboard',
      'order-form',
      'order-master',
      'routing',
      'actual-analysis',
      'calendar',
      'timeline',
      'execution',
      'equipment',
      'quality',
      'archive',
    ],
    defaultEdits: {
      dashboard: true,
      'order-form': true,
      'order-master': true,
      routing: true,
      'actual-analysis': true,
      calendar: true,
      timeline: true,
      execution: true,
      equipment: true,
      quality: true,
      archive: true,
    },
    permissions: {
      allowedMenus: [
        'dashboard',
        'order-form',
        'order-master',
        'routing',
        'actual-analysis',
        'calendar',
        'timeline',
        'execution',
        'equipment',
        'quality',
        'archive',
      ],
      menuEdits: {
        dashboard: true,
        'order-form': true,
        'order-master': true,
        routing: true,
        'actual-analysis': true,
        calendar: true,
        timeline: true,
        execution: true,
        equipment: true,
        quality: true,
        archive: true,
      },
      canManageUsers: false,
      canEditOrder: true,
      canExecuteMES: true,
      canEditMaster: true,
      canArchive: true,
      canQualityInspection: true,
      canShipmentControl: true,
    },
  },
  '시스템 관리자': {
    role: 'ADMIN',
    label: '시스템 관리자',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    desc: '최고 관리자 - 마스터 총괄, 회원 승인/삭제, 세부 권한 위임, 전 기능 권한',
    icon: '👑',
    defaultMenus: [
      'dashboard',
      'order-form',
      'order-master',
      'routing',
      'actual-analysis',
      'calendar',
      'timeline',
      'execution',
      'equipment',
      'quality',
      'archive',
    ],
    defaultEdits: {
      dashboard: true,
      'order-form': true,
      'order-master': true,
      routing: true,
      'actual-analysis': true,
      calendar: true,
      timeline: true,
      execution: true,
      equipment: true,
      quality: true,
      archive: true,
    },
    permissions: {
      allowedMenus: [
        'dashboard',
        'order-form',
        'order-master',
        'routing',
        'actual-analysis',
        'calendar',
        'timeline',
        'execution',
        'equipment',
        'quality',
        'archive',
      ],
      menuEdits: {
        dashboard: true,
        'order-form': true,
        'order-master': true,
        routing: true,
        'actual-analysis': true,
        calendar: true,
        timeline: true,
        execution: true,
        equipment: true,
        quality: true,
        archive: true,
      },
      canManageUsers: true,
      canEditOrder: true,
      canExecuteMES: true,
      canEditMaster: true,
      canArchive: true,
      canQualityInspection: true,
      canShipmentControl: true,
    },
  },
  '영업팀': {
    role: 'USER',
    label: '영업팀',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
    desc: '영업 업무 모니터링 - 대시보드, 공정 분석, 생산 캘린더, 생산 타임라인, 설비 현황 (기본 조회 전용, 관리자 개별 편집 허용 가능)',
    icon: '💼',
    defaultMenus: ['dashboard', 'actual-analysis', 'calendar', 'timeline', 'equipment'],
    defaultEdits: {
      dashboard: false,
      'actual-analysis': false,
      calendar: false,
      timeline: false,
      equipment: false,
    },
    permissions: {
      allowedMenus: ['dashboard', 'actual-analysis', 'calendar', 'timeline', 'equipment'],
      menuEdits: {
        dashboard: false,
        'actual-analysis': false,
        calendar: false,
        timeline: false,
        equipment: false,
      },
      canManageUsers: false,
      canEditOrder: false,
      canExecuteMES: false,
      canEditMaster: false,
      canArchive: false,
      canQualityInspection: false,
      canShipmentControl: false,
    },
  },
  '경영진': {
    role: 'USER',
    label: '경영진',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    desc: '경영 및 생산 현황 모니터링 - 대시보드, 공정 분석, 생산 캘린더, 생산 타임라인, 설비 현황 (기본 조회 전용, 관리자 개별 편집 허용 가능)',
    icon: '🏢',
    defaultMenus: ['dashboard', 'actual-analysis', 'calendar', 'timeline', 'equipment'],
    defaultEdits: {
      dashboard: false,
      'actual-analysis': false,
      calendar: false,
      timeline: false,
      equipment: false,
    },
    permissions: {
      allowedMenus: ['dashboard', 'actual-analysis', 'calendar', 'timeline', 'equipment'],
      menuEdits: {
        dashboard: false,
        'actual-analysis': false,
        calendar: false,
        timeline: false,
        equipment: false,
      },
      canManageUsers: false,
      canEditOrder: false,
      canExecuteMES: false,
      canEditMaster: false,
      canArchive: false,
      canQualityInspection: false,
      canShipmentControl: false,
    },
  },
  '임원진': {
    role: 'USER',
    label: '임원진',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    desc: '경영 및 생산 현황 모니터링 - 대시보드, 공정 분석, 생산 캘린더, 생산 타임라인, 설비 현황 (기본 조회 전용, 관리자 개별 편집 허용 가능)',
    icon: '🏢',
    defaultMenus: ['dashboard', 'actual-analysis', 'calendar', 'timeline', 'equipment'],
    defaultEdits: {
      dashboard: false,
      'actual-analysis': false,
      calendar: false,
      timeline: false,
      equipment: false,
    },
    permissions: {
      allowedMenus: ['dashboard', 'actual-analysis', 'calendar', 'timeline', 'equipment'],
      menuEdits: {
        dashboard: false,
        'actual-analysis': false,
        calendar: false,
        timeline: false,
        equipment: false,
      },
      canManageUsers: false,
      canEditOrder: false,
      canExecuteMES: false,
      canEditMaster: false,
      canArchive: false,
      canQualityInspection: false,
      canShipmentControl: false,
    },
  },
};

export interface EffectivePermissions {
  isSuperAdmin: boolean;
  isAdmin: boolean;
  department: string;
  allowedMenus: MenuId[];
  canEditMenu: Record<string, boolean>;
  canEditOrder: boolean;
  canExecuteMES: boolean;
  canManageUsers: boolean;
  canEditMaster: boolean;
  canArchive: boolean;
  canQualityInspection: boolean;
  canShipmentControl: boolean;
  primaryMenu: MenuId;
}

/**
 * 구 권한 체계(canEditOrder, canExecuteMES 등 7개 플래그)를
 * 신규 체계(allowedMenus, menuEdits, canManageUsers)로 안전하게 변환하는 마이그레이션 함수
 *
 * [변환 및 권한 보존 원칙]
 * 1. allowedMenus: 기존 배열이 있으면 유지하되, 구 플래그가 활성화되어 있던 메뉴는 반드시 노출 목록에 포함
 * 2. menuEdits:
 *    - order-form / order-master / routing: 기존 canEditOrder 또는 canEditMaster가 true였으면 편집 true
 *    - execution: canExecuteMES가 true였으면 편집 true
 *    - quality: canQualityInspection 또는 canShipmentControl 중 하나라도 true면 품질/검사 편집 true (출하관리 자동 통합)
 *    - archive: canArchive가 true면 보관함 편집 true (보관 및 영구삭제 권한)
 *    - calendar / timeline: canEditOrder가 true면 편집 true
 * 3. canManageUsers: 시스템 관리자이거나 기존 canManageUsers 플래그가 true인 경우만 true 유지
 * 4. 기존 구 플래그 필드도 menuEdits 상태와 100% 동기화하여 유지하므로, 기존 코드가 어떤 방식으로 읽더라도 오차 없이 완벽 호환
 */
export function migrateLegacyPermissions(
  user: { department?: string | null; role?: string; permissions?: UserPermissions | null }
): UserPermissions {
  const perms = user.permissions || {};
  const deptKey = (user.department || '가공팀').trim();
  const preset = DEPARTMENT_PRESETS[deptKey] || DEPARTMENT_PRESETS['가공팀'];
  const isAdmin = user.role === 'ADMIN' || deptKey === '시스템 관리자';

  // 1. Resolve allowedMenus
  let nextAllowed: MenuId[] = [];
  if (perms.allowedMenus && Array.isArray(perms.allowedMenus) && perms.allowedMenus.length > 0) {
    nextAllowed = [...(perms.allowedMenus as MenuId[])];
  } else {
    // Only infer from legacy flags if allowedMenus was never populated
    nextAllowed = [...preset.defaultMenus];
    if (perms.canEditOrder) {
      if (!nextAllowed.includes('order-master')) nextAllowed.push('order-master');
      if (!nextAllowed.includes('order-form')) nextAllowed.push('order-form');
      if (!nextAllowed.includes('routing')) nextAllowed.push('routing');
    }
    if (perms.canEditMaster && !nextAllowed.includes('routing')) {
      nextAllowed.push('routing');
    }
    if (perms.canExecuteMES && !nextAllowed.includes('execution')) {
      nextAllowed.push('execution');
    }
    if ((perms.canQualityInspection || perms.canShipmentControl) && !nextAllowed.includes('quality')) {
      nextAllowed.push('quality');
    }
    if (perms.canArchive && !nextAllowed.includes('archive')) {
      nextAllowed.push('archive');
    }
  }

  // Deduplicate and filter to valid menus
  nextAllowed = Array.from(new Set(nextAllowed)).filter((m) => ALL_MENU_IDS.includes(m));
  if (nextAllowed.length === 0) {
    nextAllowed = [...preset.defaultMenus];
  }

  // Seamless auto-upgrade for legacy field operators (가공팀, 연마팀, 품질팀):
  // If their saved permissions only had legacy 'execution' (or 'execution' + 'quality') without calendar/timeline,
  // automatically include read-only calendar and timeline so existing users reflect the latest spec immediately.
  if (deptKey === '가공팀' || deptKey === '연마팀' || deptKey === '품질팀') {
    const isLegacyRestricted =
      nextAllowed.includes('execution') &&
      (!nextAllowed.includes('calendar') || !nextAllowed.includes('timeline')) &&
      nextAllowed.length <= 3;

    if (isLegacyRestricted) {
      if (!nextAllowed.includes('calendar')) nextAllowed.push('calendar');
      if (!nextAllowed.includes('timeline')) nextAllowed.push('timeline');
    }
  }

  // Seamless auto-upgrade for 영업팀, 경영진, 임원진:
  // Include read-only 'actual-analysis' (공정 분석) menu
  if (deptKey === '영업팀' || deptKey === '경영진' || deptKey === '임원진') {
    if (!nextAllowed.includes('actual-analysis')) {
      nextAllowed.push('actual-analysis');
    }
  }

  // 2. Resolve menuEdits
  const nextEdits: Record<string, boolean> = { ...(preset.defaultEdits || {}) };

  // If user already had explicit menuEdits, incorporate them
  if (perms.menuEdits && typeof perms.menuEdits === 'object') {
    Object.entries(perms.menuEdits).forEach(([m, val]) => {
      if (typeof val === 'boolean') {
        nextEdits[m] = val;
      }
    });
  }

  // Map legacy flags if menuEdits didn't explicitly override them
  if (perms.canEditOrder !== undefined) {
    if (perms.menuEdits?.['order-form'] === undefined) nextEdits['order-form'] = perms.canEditOrder;
    if (perms.menuEdits?.['order-master'] === undefined) nextEdits['order-master'] = perms.canEditOrder;
    if (perms.menuEdits?.['routing'] === undefined) nextEdits['routing'] = perms.canEditOrder || (perms.canEditMaster ?? false);
    if (perms.menuEdits?.['calendar'] === undefined) nextEdits['calendar'] = perms.canEditOrder;
    if (perms.menuEdits?.['timeline'] === undefined) nextEdits['timeline'] = perms.canEditOrder;
  }
  if (perms.canEditMaster !== undefined && perms.menuEdits?.['routing'] === undefined) {
    nextEdits['routing'] = perms.canEditMaster || (nextEdits['routing'] ?? false);
  }
  if (perms.canExecuteMES !== undefined && perms.menuEdits?.['execution'] === undefined) {
    nextEdits['execution'] = perms.canExecuteMES;
  }
  // Merge quality & shipment control into 'quality'
  if ((perms.canQualityInspection !== undefined || perms.canShipmentControl !== undefined) && perms.menuEdits?.['quality'] === undefined) {
    nextEdits['quality'] = Boolean(perms.canQualityInspection || perms.canShipmentControl);
  }
  if (perms.canArchive !== undefined && perms.menuEdits?.['archive'] === undefined) {
    nextEdits['archive'] = perms.canArchive;
  }

  // Enforce structural integrity:
  // Rule A: If a menu is marked editable, it MUST be exposed (allowed)
  ALL_MENU_IDS.forEach((m) => {
    if (nextEdits[m] && !nextAllowed.includes(m)) {
      nextAllowed.push(m);
    }
  });

  // Rule B: If a menu is NOT exposed, its edit permission MUST be false
  ALL_MENU_IDS.forEach((m) => {
    if (!nextAllowed.includes(m)) {
      nextEdits[m] = false;
    }
  });

  // 3. Resolve canManageUsers (Dedicated standalone toggle)
  const canManageUsers = isAdmin || Boolean(perms.canManageUsers);

  // Return unified permissions with synchronized legacy fields for backward compatibility
  return {
    allowedMenus: nextAllowed,
    menuEdits: nextEdits,
    canManageUsers,
    // Synchronized legacy mirrors so no downstream code breaks
    canEditOrder: Boolean(nextEdits['order-master'] || nextEdits['order-form']),
    canExecuteMES: Boolean(nextEdits['execution']),
    canEditMaster: Boolean(nextEdits['routing']),
    canArchive: Boolean(nextEdits['archive']),
    canQualityInspection: Boolean(nextEdits['quality']),
    canShipmentControl: Boolean(nextEdits['quality']),
  };
}

/**
 * 16. 권한 계산 및 우선순위 (단일화된 RBAC 엔진)
 *
 * 1. 시스템 관리자 권한 (ADMIN / 슈퍼어드민) -> 모든 메뉴 노출, 모든 쓰기/편집 허용, 회원관리 허용
 * 2. 개별 사용자 세부 기능 권한 (allowedMenus 노출 목록 + menuEdits 편집 맵 + canManageUsers 단일 토글)
 * 3. 팀 기본 프리셋 (DEPARTMENT_PRESETS)
 */
export function computeEffectivePermissions(user: User | null | undefined): EffectivePermissions {
  if (!user) {
    // Unauthenticated or fallback guest
    return {
      isSuperAdmin: false,
      isAdmin: false,
      department: '미지정',
      allowedMenus: ['dashboard'],
      canEditMenu: {},
      canEditOrder: false,
      canExecuteMES: false,
      canManageUsers: false,
      canEditMaster: false,
      canArchive: false,
      canQualityInspection: false,
      canShipmentControl: false,
      primaryMenu: 'dashboard',
    };
  }

  const isSuperAdmin =
    user.email === 'noworriesmate01@gmail.com' ||
    user.email?.toLowerCase().includes('noworries') ||
    user.department === '시스템 관리자' ||
    user.name === '시스템 관리자' ||
    user.name === '대표 관리자';

  const isAdmin = isSuperAdmin || user.role === 'ADMIN';

  // 1. SuperAdmin / Admin has full access to everything
  if (isAdmin) {
    const allEdits: Record<string, boolean> = {};
    ALL_MENU_IDS.forEach((m) => {
      allEdits[m] = true;
    });
    return {
      isSuperAdmin,
      isAdmin: true,
      department: user.department || '시스템 관리자',
      allowedMenus: [...ALL_MENU_IDS],
      canEditMenu: allEdits,
      canEditOrder: true,
      canExecuteMES: true,
      canManageUsers: true,
      canEditMaster: true,
      canArchive: true,
      canQualityInspection: true,
      canShipmentControl: true,
      primaryMenu: 'dashboard',
    };
  }

  // 2. Normal user: Unified migration & permission calculation
  const deptKey = (user.department || '가공팀').trim();
  const preset = DEPARTMENT_PRESETS[deptKey] || DEPARTMENT_PRESETS['가공팀'];

  const migrated = migrateLegacyPermissions(user);
  let effectiveMenus = [...migrated.allowedMenus as MenuId[]];

  // If user department changed but old menus were disjoint, handle sanitized default
  const hasAnyDeptDefault = preset.defaultMenus.some((m) => effectiveMenus.includes(m));
  if (!hasAnyDeptDefault) {
    const sanitizedExtras = effectiveMenus.filter((m) => {
      if (m === 'execution' && deptKey !== '가공팀' && deptKey !== '연마팀' && !migrated.menuEdits?.['execution']) {
        return false;
      }
      return true;
    });
    effectiveMenus = Array.from(new Set([...preset.defaultMenus, ...sanitizedExtras]));
  }

  // Filter valid menus
  effectiveMenus = Array.from(new Set(effectiveMenus)).filter((m) => ALL_MENU_IDS.includes(m));
  if (effectiveMenus.length === 0) {
    effectiveMenus = [...preset.defaultMenus];
  }

  // Calculate per-menu edit map: only allowed menus can be edited
  const canEditMenuMap: Record<string, boolean> = {};
  effectiveMenus.forEach((menuId) => {
    canEditMenuMap[menuId] = Boolean(migrated.menuEdits?.[menuId]);
  });

  // Synchronized legacy mirrors
  const canEditOrder = Boolean(canEditMenuMap['order-master'] || canEditMenuMap['order-form']);
  const canExecuteMES = Boolean(canEditMenuMap['execution']);
  const canEditMaster = Boolean(canEditMenuMap['routing']);
  const canArchive = Boolean(canEditMenuMap['archive']);
  const canQualityInspection = Boolean(canEditMenuMap['quality']);
  const canShipmentControl = Boolean(canEditMenuMap['quality']);
  const canManageUsers = Boolean(migrated.canManageUsers);

  // Determine primary landing menu
  let primaryMenu: MenuId = 'dashboard';
  if (effectiveMenus.includes('dashboard')) {
    primaryMenu = 'dashboard';
  } else if (effectiveMenus.includes('execution')) {
    primaryMenu = 'execution';
  } else if (effectiveMenus.length > 0) {
    primaryMenu = effectiveMenus[0];
  }

  return {
    isSuperAdmin: false,
    isAdmin: false,
    department: user.department || preset.label,
    allowedMenus: effectiveMenus,
    canEditMenu: canEditMenuMap,
    canEditOrder,
    canExecuteMES,
    canManageUsers,
    canEditMaster,
    canArchive,
    canQualityInspection,
    canShipmentControl,
    primaryMenu,
  };
}

/**
 * Check if a menu is accessible (노출/조회) for the user
 */
export function isMenuAllowed(user: User | null | undefined, menuId: string): boolean {
  const effective = computeEffectivePermissions(user);
  return effective.allowedMenus.includes(menuId as MenuId);
}

/**
 * Check if a user has edit (쓰기/등록/수정/삭제/실행) permission for a specific menu
 */
export function canEditMenu(user: User | null | undefined, menuId: string): boolean {
  const effective = computeEffectivePermissions(user);
  if (!effective.allowedMenus.includes(menuId as MenuId)) return false;
  return Boolean(effective.canEditMenu[menuId]);
}

/**
 * 부서 변경 시 새 부서의 기본 권한/메뉴 세트로 재계산하면서,
 * 기존에 관리자가 해당 사용자에게 개별적으로 추가 부여했던 세부 기능 권한을 보존하는 핵심 함수
 */
export function recalculatePermissionsOnDepartmentChange(
  oldUser: User,
  newDept: UserDepartment
): UserPermissions {
  const oldDept = (oldUser.department as UserDepartment) || '가공팀';
  const oldPreset = DEPARTMENT_PRESETS[oldDept] || DEPARTMENT_PRESETS['가공팀'];
  const newPreset = DEPARTMENT_PRESETS[newDept] || DEPARTMENT_PRESETS['가공팀'];

  const oldMigrated = migrateLegacyPermissions(oldUser);

  // For '영업팀' or '경영진'/'임원진', enforce strictly read-only defaults (no edit permissions)
  if (newDept === '영업팀' || newDept === '경영진' || newDept === '임원진') {
    const allFalseEdits: Record<string, boolean> = {};
    ALL_MENU_IDS.forEach((m) => {
      allFalseEdits[m] = false;
    });
    return migrateLegacyPermissions({
      department: newDept,
      role: newPreset.role,
      permissions: {
        allowedMenus: [...newPreset.defaultMenus],
        menuEdits: allFalseEdits,
        canManageUsers: false,
      },
    });
  }

  // 1. Calculate custom menu additions beyond old department's preset
  const oldAllowed = (oldMigrated.allowedMenus && oldMigrated.allowedMenus.length > 0
    ? oldMigrated.allowedMenus
    : oldPreset.defaultMenus) as MenuId[];

  const customMenuAdditions = oldAllowed.filter(
    (m) => !oldPreset.defaultMenus.includes(m as MenuId)
  );

  const newAllowedMenus = Array.from(
    new Set([...newPreset.defaultMenus, ...customMenuAdditions])
  ).filter((m) => ALL_MENU_IDS.includes(m as MenuId)) as string[];

  // 2. Preserve custom menu edit permissions that were explicitly granted beyond old preset
  const customMenuEdits: Record<string, boolean> = {};
  if (oldMigrated.menuEdits) {
    Object.entries(oldMigrated.menuEdits).forEach(([m, val]) => {
      const wasInOldPreset = Boolean(oldPreset.defaultEdits?.[m]);
      if (val === true && !wasInOldPreset) {
        customMenuEdits[m] = true;
      }
    });
  }

  // 3. Preserve canManageUsers if explicitly granted
  const canManageUsers = Boolean(oldMigrated.canManageUsers || newPreset.permissions.canManageUsers);

  // 4. Assemble merged permissions
  const mergedEdits = {
    ...newPreset.defaultEdits,
    ...customMenuEdits,
  };

  return migrateLegacyPermissions({
    department: newDept,
    role: newPreset.role,
    permissions: {
      allowedMenus: newAllowedMenus,
      menuEdits: mergedEdits,
      canManageUsers,
    },
  });
}
