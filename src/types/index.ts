export type ProcessCategory = '가공' | '연마' | '외주' | '품질';

export type TaskExecutionStatus = 'READY' | 'PLANNED' | 'DISPATCHED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'DELAYED' | 'ISSUE_HOLD';

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

export interface AndonIssue {
  issueType: string;
  note: string;
  reportedAt: string;
  reportedBy: string;
  isResolved?: boolean;
  resolvedAt?: string;
  resolvedNote?: string;
}

export interface ProcessStep {
  name: string;
  category: ProcessCategory;
  durationHours: number;
  assignedMachine?: string;
  worker?: string;
  assignedWorker?: string;
  phaseId?: string;
  id?: string;
  memo?: string;
}

export interface ProductType {
  id: string;
  isReference: boolean;
  name: string;
  processes: ProcessStep[];
}

export type OrderStatus = 'DRAFT' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED';
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
  // Process Traveler (공정 이동표) Metadata
  customer?: string;       // 고객사 (예: PNT, 삼성디스플레이)
  poNumber?: string;       // PO. (PJT) (예: PNT-BNSH650L-26-02)
  partName?: string;       // 품명 (예: Flex Bolt 2P SLOT DIE)
  partType?: string;       // 품목 (예: UPPER (상판), LOWER (하판), BODY 등)
  spec?: string;           // 규격 (예: 650L, 2000mm)
  material?: string;       // 소재 (예: SUS316L, AL6061)
  tolerance?: string;      // 정밀공차 (예: ±5µm)
  coatingSpec?: string;    // 코팅규격 (예: TiN / DLC 2.5µm)
  serialNo?: string;       // 각인번호 (예: PNT-BNSH650L-265-02-02)
  dueDate?: string;        // 납기 (예: 2026-06-30)
  dispatchedAt?: string;   // 현장 배포 일시
  specialNotes?: string;   // 특이사항 (예: ※ 공정 간 인수인계 철저히 할 것!)
  writerName?: string;     // 작성자
  reviewerName?: string;   // 검토자
  approverName?: string;   // 승인자
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
  defectQty?: number;
  // Andon & Issue Reporting
  andonStatus?: 'NORMAL' | 'ISSUE_HOLD' | 'RESOLVED';
  andonIssueType?: string;
  andonIssueNote?: string;
  andonReportedAt?: string;
  andonReportedBy?: string;
  andonHistory?: AndonIssue[];
}

export type ProcessProgressMap = Record<string, ProcessProgressItem>;

export interface FilterOptions {
  category: string;
  completionStatus: string;
  searchQuery: string;
  selectedWorker: string;
}

export type UserDepartment = '가공팀' | '연마팀' | '품질팀' | '생산 관리' | '시스템 관리자';

export interface UserPermissions {
  canEditOrder?: boolean;         // 수주 관리, 스케줄러 편집, 공정 일정 제어
  canExecuteMES?: boolean;        // MES 공정 완료 및 현장 작업 관련 권한
  canManageUsers?: boolean;       // 회원 승인/삭제 권한, 시스템 계정 관리
  canEditMaster?: boolean;        // BOP 표준 공정, 설비/담당자 마스터 관리
  canArchive?: boolean;           // 완료 보관함 이동 및 수주 데이터 관리
  canQualityInspection?: boolean; // 수입/공정/출하검사 및 성적서 발행 (품질팀)
  canShipmentControl?: boolean;   // 출하 승인 및 COA 발행 권한
}

export interface User {
  uid?: string;
  email?: string;
  password?: string;
  name: string;
  phoneNumber?: string;           // 필수 휴대전화번호 (SMS/알림톡 연동)
  phone_number?: string;          // snake_case 호환용 별칭
  role: 'USER' | 'ADMIN';
  department?: UserDepartment | string | null;
  position?: string;
  skillMctLevel?: number;         // MCT 가공 숙련도 (1~5)
  skillGrinderLevel?: number;     // 연마 숙련도 (1~5)
  permissions?: UserPermissions;
  isApproved?: boolean;
  status?: 'pending' | 'approved' | 'rejected'; // 가입 승인 상태
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
  defectQty?: number;
  // Andon
  andonStatus?: 'NORMAL' | 'ISSUE_HOLD' | 'RESOLVED';
  andonIssueType?: string;
  andonIssueNote?: string;
  andonReportedAt?: string;
  andonReportedBy?: string;
}

export type CalendarViewMode = 'day' | 'week' | 'month';
export type ChartDisplayMode = 'ALL' | 'SELECTED';
export type ChartStatusFilter = 'IN_PROGRESS_ONLY' | 'ALL' | 'COMPLETED_ONLY';
export type ZoomLevel = '1D' | '3D' | '1W' | '1M';

