export type ProcessCategory = '가공' | '연마' | '외주' | '품질';

export type TaskExecutionStatus = 'READY' | 'PLANNED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'DELAYED';

export type PauseReason =
  | '설비 고장'
  | '자재 부족'
  | '품질 문제'
  | '작업자 부재'
  | '도면 문제'
  | '기타';

export interface PauseLog {
  pausedAt: string;
  resumedAt?: string;
  reason: PauseReason | string;
  durationMinutes?: number;
}

export interface ProcessStep {
  name: string;
  category: ProcessCategory;
  durationHours: number;
  assignedMachine?: string;
}

export interface ProductType {
  id: string;
  isReference: boolean;
  name: string;
  processes: ProcessStep[];
}

export type OrderStatus = 'IN_PROGRESS' | 'COMPLETED';
export type ProductionStrategy = 'SERIAL' | 'CONTINUOUS';

export interface Order {
  id: string;
  name: string;
  typeId: string;
  qty: number;
  startDate: string;
  strategy?: ProductionStrategy;
  status?: OrderStatus;
  completedAt?: string | null;
  archived?: boolean;
  workWindow?: string;
  mctMachine?: string;
  memo?: string;
  customProcesses?: ProcessStep[];
}

export interface ProcessProgressItem {
  completed?: boolean;
  isCompleted?: boolean;
  status?: TaskExecutionStatus;
  actualStart?: string | null;
  actualEnd?: string | null;
  actualMinutes?: number;
  completedAt?: string | null;
  worker?: string;
  machine?: string;
  pauseReason?: string;
  pauseHistory?: PauseLog[];
  delayMinutes?: number;
  delayReason?: string;
  memo?: string;
}

export type ProcessProgressMap = Record<string, ProcessProgressItem>;

export interface FilterOptions {
  category: string;
  completionStatus: string;
  searchQuery: string;
  selectedWorker: string;
}

export interface UserPermissions {
  canEditOrder?: boolean;    // 수주 등록 및 공정 라우팅 스펙 수정 권한
  canExecuteMES?: boolean;   // 현장 공정 완료/취소 처리 권한
  canManageUsers?: boolean;  // 회원가입 승인 및 사용자 권한 관리 접근 권한
  canEditMaster?: boolean;   // BOP 표준 공정, 설비/담당자 마스터 수정 권한
  canArchive?: boolean;      // 완료 보관함 이동 및 수주 삭제 권한
}

export interface User {
  uid?: string;
  email?: string;
  password?: string;
  name: string;
  role: 'USER' | 'ADMIN';
  permissions?: UserPermissions;
  isApproved?: boolean;
  isOnline?: boolean;
  createdAt?: string;
  loginAt?: string;
  logoutAt?: string;
}

export interface ScheduledTaskItem {
  id: number;
  processKey: string;
  orderId: string;
  groupKey: string;
  groupName: string;
  content: string;
  title: string;
  start: Date;
  end: Date;
  category: ProcessCategory;
  duration: number; // planned hours
  plannedMinutes: number; // planned minutes
  productNo: number; // Unit #1, #2, ...
  orderName: string;
  // Plan vs Actual breakdown
  plannedStart: Date;
  plannedEnd: Date;
  actualStart: string | null;
  actualEnd: string | null;
  actualMinutes: number | null;
  status: TaskExecutionStatus;
  isCompleted: boolean;
  completedAt: string | null;
  worker: string;
  machine: string;
  processIndex: number;
  totalProcessesInOrder: number;
  pauseHistory?: PauseLog[];
  pauseReason?: string;
  delayMinutes?: number;
  delayReason?: string;
  memo?: string;
}

export type CalendarViewMode = 'day' | 'week' | 'month';
export type ChartDisplayMode = 'ALL' | 'SELECTED';
export type ChartStatusFilter = 'IN_PROGRESS_ONLY' | 'ALL' | 'COMPLETED_ONLY';
export type ZoomLevel = '1D' | '3D' | '1W' | '1M';

