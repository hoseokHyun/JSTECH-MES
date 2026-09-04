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
    label: '생산 종합 대시보드',
    sublabel: '설비 21대/실시간 현황',
    featureName: '생산 종합 대시보드',
    category: '분석/일정',
    description: '공장 전체 가동률(OEE), 수주 현황 및 생산 진척 모니터링',
    icon: '📊',
  },
  {
    id: 'order-form',
    label: '신규 수주 등록',
    sublabel: '수주 스펙 및 공정 지정',
    featureName: '신규 수주 등록',
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
    label: '실적 및 계획대비 분석',
    sublabel: 'Plan vs. Actual 편차/지연 추적',
    featureName: '실적/계획 분석',
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
    label: '공정 타임라인 (Gantt)',
    sublabel: '장기 타임라인 차트',
    featureName: '공정 타임라인',
    category: '분석/일정',
    relatedPermKey: 'canEditOrder',
    description: '간트 차트 기반 수주별 공정 흐름 및 간섭 분석',
    icon: '⏱️',
  },
  {
    id: 'execution',
    label: '현장 공정 실행 (Floor MES)',
    sublabel: '시작/일시정지/완료 터미널',
    featureName: 'MES 공정 완료',
    category: '현장',
    relatedPermKey: 'canExecuteMES',
    description: '현장 터미널에서 공정 착수, 안돈(일시정지), 완료 및 실적 등록',
    icon: '🏭',
  },
  {
    id: 'equipment',
    label: '생산 설비 및 공정 담당자',
    sublabel: '총 21대 설비 가동 모니터링',
    featureName: '설비/담당자 모니터링',
    category: '현장',
    description: '설비별 가동/비가동 상태 및 담당자 배정 현황 확인',
    icon: '🤖',
  },
  {
    id: 'quality',
    label: '품질/검사 (CMM)',
    sublabel: '3D 정밀측정 및 성적서 관리',
    featureName: '품질 검사 & 출하 관리',
    category: '품질',
    relatedPermKey: 'canQualityInspection',
    description: '수입/공정/출하 검사 성적서 등록 및 3D CMM 정밀 측정 관리',
    icon: '🔬',
  },
  {
    id: 'archive',
    label: '완료 수주 보관함',
    sublabel: '완료 수주 아카이브 & 사양 복사',
    featureName: '보관함/수주삭제',
    category: '생산/수주',
    relatedPermKey: 'canArchive',
    description: '완료된 수주 아카이브 조회, 복사 및 영구 삭제 관리',
    icon: '📦',
  },
];

export const MENU_LABELS: Record<string, string> = {
  dashboard: '생산 종합 대시보드',
  'order-form': '신규 수주 등록',
  'order-master': '수주관리',
  routing: '공정 구성',
  'actual-analysis': '실적 및 계획대비 분석',
  calendar: '생산 캘린더',
  timeline: '공정 타임라인 (Gantt)',
  execution: '현장 공정 실행 (Floor MES)',
  equipment: '생산 설비 및 공정 담당자',
  quality: '품질/검사 (CMM)',
  archive: '완료 수주 보관함',
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
  '임원진',
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
    desc: '현장 담당자 - 현장 공정 실행(MCT 가공 착수/완료/상태변경)',
    icon: '⚙️',
    defaultMenus: ['execution'],
    defaultEdits: { execution: true },
    permissions: {
      canEditOrder: false,
      canExecuteMES: true,
      canManageUsers: false,
      canEditMaster: false,
      canArchive: false,
      canQualityInspection: false,
      canShipmentControl: false,
      allowedMenus: ['execution'],
    },
  },
  '연마팀': {
    role: 'USER',
    label: '연마팀',
    badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    desc: '현장 담당자 - 현장 공정 실행(평면/성형 연마 착수/완료/상태변경)',
    icon: '✨',
    defaultMenus: ['execution'],
    defaultEdits: { execution: true },
    permissions: {
      canEditOrder: false,
      canExecuteMES: true,
      canManageUsers: false,
      canEditMaster: false,
      canArchive: false,
      canQualityInspection: false,
      canShipmentControl: false,
      allowedMenus: ['execution'],
    },
  },
  '품질팀': {
    role: 'USER',
    label: '품질팀',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    desc: '현장 담당자 + 품질 검사 - 공정 실행, 3D CMM 성적서 및 출하 관리',
    icon: '🔬',
    defaultMenus: ['execution', 'quality'],
    defaultEdits: { execution: true, quality: true },
    permissions: {
      canEditOrder: false,
      canExecuteMES: true,
      canManageUsers: false,
      canEditMaster: false,
      canArchive: false,
      canQualityInspection: true,
      canShipmentControl: true,
      allowedMenus: ['execution', 'quality'],
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
      canEditOrder: true,
      canExecuteMES: true,
      canManageUsers: false,
      canEditMaster: true,
      canArchive: true,
      canQualityInspection: true,
      canShipmentControl: true,
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
      canEditOrder: true,
      canExecuteMES: true,
      canManageUsers: false,
      canEditMaster: true,
      canArchive: true,
      canQualityInspection: true,
      canShipmentControl: true,
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
      canEditOrder: true,
      canExecuteMES: true,
      canManageUsers: true,
      canEditMaster: true,
      canArchive: true,
      canQualityInspection: true,
      canShipmentControl: true,
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
    },
  },
  '영업팀': {
    role: 'USER',
    label: '영업팀',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
    desc: '업무 조회 중심 - 생산 종합 대시보드, 생산 캘린더, 공정 타임라인 (읽기 전용)',
    icon: '💼',
    defaultMenus: ['dashboard', 'calendar', 'timeline'],
    defaultEdits: {},
    permissions: {
      canEditOrder: false,
      canExecuteMES: false,
      canManageUsers: false,
      canEditMaster: false,
      canArchive: false,
      canQualityInspection: false,
      canShipmentControl: false,
      allowedMenus: ['dashboard', 'calendar', 'timeline'],
    },
  },
  '임원진': {
    role: 'USER',
    label: '임원진',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    desc: '경영 및 생산 현황 모니터링 - 대시보드, 캘린더, 타임라인 (읽기 전용, 확장 가능)',
    icon: '🏢',
    defaultMenus: ['dashboard', 'calendar', 'timeline'],
    defaultEdits: {},
    permissions: {
      canEditOrder: false,
      canExecuteMES: false,
      canManageUsers: false,
      canEditMaster: false,
      canArchive: false,
      canQualityInspection: false,
      canShipmentControl: false,
      allowedMenus: ['dashboard', 'calendar', 'timeline'],
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
 * 16. 권한 계산 및 우선순위
 *
 * 1. 시스템 관리자 권한 (ADMIN / 슈퍼어드민) -> 모든 메뉴 노출, 모든 쓰기/편집 허용
 * 2. 개별 사용자 세부 기능 권한 (노출 여부 + 편집 여부)
 * 3. 팀 기본 권한
 * 4. 기본 차단
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

  // 2. Determine department base preset
  const deptKey = (user.department || '가공팀').trim();
  const preset = DEPARTMENT_PRESETS[deptKey] || DEPARTMENT_PRESETS['가공팀'];

  // Start with team default menus
  let effectiveMenus: MenuId[] = [...preset.defaultMenus];

  // If user has customized allowedMenus, apply it
  if (user.permissions?.allowedMenus && Array.isArray(user.permissions.allowedMenus)) {
    effectiveMenus = [...user.permissions.allowedMenus as MenuId[]];
  }

  // Backward compatibility: If user has legacy permission flags true, ensure relevant menus are exposed
  if (user.permissions?.canEditOrder && !effectiveMenus.includes('order-master')) {
    effectiveMenus.push('order-master');
    if (!effectiveMenus.includes('order-form')) effectiveMenus.push('order-form');
  }
  if (user.permissions?.canArchive && !effectiveMenus.includes('archive')) {
    effectiveMenus.push('archive');
  }
  if (user.permissions?.canEditMaster && !effectiveMenus.includes('routing')) {
    effectiveMenus.push('routing');
  }
  if (user.permissions?.canQualityInspection && !effectiveMenus.includes('quality')) {
    effectiveMenus.push('quality');
  }
  if (user.permissions?.canExecuteMES && !effectiveMenus.includes('execution')) {
    effectiveMenus.push('execution');
  }

  // Deduplicate and retain only known MenuIds
  effectiveMenus = Array.from(new Set(effectiveMenus)).filter((m) =>
    ALL_MENU_IDS.includes(m)
  );

  // If no menus somehow, fallback to department default
  if (effectiveMenus.length === 0) {
    effectiveMenus = [...preset.defaultMenus];
  }

  // Calculate Edit flags
  const canEditOrder = user.permissions?.canEditOrder ?? (preset.permissions.canEditOrder || false);
  const canExecuteMES = user.permissions?.canExecuteMES ?? (preset.permissions.canExecuteMES !== false);
  const canManageUsers = user.permissions?.canManageUsers ?? (preset.permissions.canManageUsers || false);
  const canEditMaster = user.permissions?.canEditMaster ?? (preset.permissions.canEditMaster || false);
  const canArchive = user.permissions?.canArchive ?? (preset.permissions.canArchive || false);
  const canQualityInspection =
    user.permissions?.canQualityInspection ?? (preset.permissions.canQualityInspection || false);
  const canShipmentControl =
    user.permissions?.canShipmentControl ?? (preset.permissions.canShipmentControl || false);

  // Calculate per-menu edit permissions
  const canEditMenuMap: Record<string, boolean> = {};

  effectiveMenus.forEach((menuId) => {
    let editable = false;
    // Check explicit override in user.permissions.menuEdits first
    if (user.permissions?.menuEdits && typeof user.permissions.menuEdits[menuId] === 'boolean') {
      editable = user.permissions.menuEdits[menuId];
    } else {
      switch (menuId) {
        case 'order-form':
        case 'order-master':
          editable = canEditOrder;
          break;
        case 'execution':
          editable = canExecuteMES;
          break;
        case 'quality':
          editable = canQualityInspection || canShipmentControl;
          break;
        case 'routing':
          editable = canEditMaster;
          break;
        case 'archive':
          editable = canArchive;
          break;
        case 'calendar':
        case 'timeline':
          editable = canEditOrder;
          break;
        case 'dashboard':
        case 'actual-analysis':
        case 'equipment':
          editable = deptKey === '생산관리' || deptKey === '생산 관리';
          break;
        default:
          editable = false;
      }
    }
    canEditMenuMap[menuId] = editable;
  });

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
