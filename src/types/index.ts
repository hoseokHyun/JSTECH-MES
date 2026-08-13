export type ProcessCategory = '가공' | '연마' | '외주' | '품질';

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
  completedAt?: string | null;
  worker?: string;
  machine?: string;
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
  createdAt?: string;
  loginAt?: string;
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
  duration: number;
  productNo: number;
  orderName: string;
  isCompleted: boolean;
  completedAt: string | null;
  worker: string;
  machine: string;
  processIndex: number;
  totalProcessesInOrder: number;
}

export type ChartDisplayMode = 'ALL' | 'SELECTED';
export type ChartStatusFilter = 'IN_PROGRESS_ONLY' | 'ALL' | 'COMPLETED_ONLY';
export type ZoomLevel = '1D' | '3D' | '1W' | '1M';
