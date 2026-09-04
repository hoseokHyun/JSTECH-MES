import React, { useState, useMemo } from 'react';
import {
  Order,
  ProductType,
  ScheduledTaskItem,
  FilterOptions,
  ProcessStep,
  User,
  ProcessProgressItem
} from '../types';
import {
  MCT_MACHINES,
  GRINDER_MACHINES,
  CMM_MACHINES,
  ALL_EQUIPMENT_LIST
} from '../data/defaultData';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  Archive,
  Layers,
  Sparkles,
  Search,
  Filter,
  Pencil,
  Plus,
  AlertTriangle,
  AlertCircle,
  Cpu,
  Activity,
  Play,
  Pause,
  ArrowRight,
  ShieldAlert,
  Zap,
  Check,
  ChevronRight,
  XCircle,
  Info,
  ExternalLink,
  SlidersHorizontal,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { EditOrderModal } from './Modals';
import { CalendarTaskDetailModal } from './CalendarTaskDetailModal';
import { AndonReportModal } from './AndonReportModal';
import { IncidentIssueLog } from '../types';
import { computeEffectivePermissions } from '../utils/permissionManager';

interface ExecutiveSummaryProps {
  orders: Record<string, Order>;
  productTypes: Record<string, ProductType>;
  scheduledTasks: ScheduledTaskItem[];
  filterOptions?: FilterOptions;
  setFilterOptions?: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onDeleteOrder: (orderId: string) => void;
  onArchiveOrder: (orderId: string) => void;
  onUpdateOrder?: (updatedOrder: Order) => void;
  onOpenArchiveModal?: () => void;
  onNavigateToOrderForm?: () => void;
  onNavigateToOrderMaster?: () => void;
  onNavigateToTimeline?: () => void;
  onNavigateToExecution?: () => void;
  onNavigateToArchive?: () => void;
  onNavigateToEquipment?: () => void;
  onNavigateToCalendar?: () => void;
  onSelectTask?: (key: string) => void;
  onCompleteAllOrderProcesses?: (
    orderId: string,
    forceComplete: boolean,
    overrideProcesses?: ProcessStep[],
    overrideQty?: number
  ) => void;
  onCompleteAllProcesses?: (
    orderId: string,
    forceComplete: boolean,
    overrideProcesses?: ProcessStep[],
    overrideQty?: number
  ) => void;
  onUpdateProgress?: (processKey: string, progress: ProcessProgressItem) => void;
  currentUser?: User | null;
  approvedOperators?: string[];
  processProgressMap?: any;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  orders,
  productTypes,
  scheduledTasks = [],
  filterOptions: propFilterOptions,
  setFilterOptions: propSetFilterOptions,
  onDeleteOrder,
  onArchiveOrder,
  onUpdateOrder,
  onOpenArchiveModal,
  onNavigateToOrderForm,
  onNavigateToOrderMaster,
  onNavigateToTimeline,
  onNavigateToExecution,
  onNavigateToArchive,
  onNavigateToEquipment,
  onNavigateToCalendar,
  onSelectTask,
  onCompleteAllOrderProcesses,
  onCompleteAllProcesses,
  onUpdateProgress,
  currentUser,
  approvedOperators = [],
  processProgressMap = {},
}) => {
  const completeAllFn = onCompleteAllOrderProcesses || onCompleteAllProcesses;
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Task Detail Modal State for Direct Executive Action
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<ScheduledTaskItem | null>(null);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);

  // Incident Modal State for Direct Emergency Resolution Action
  const [selectedTaskForIncident, setSelectedTaskForIncident] = useState<ScheduledTaskItem | null>(null);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);

  // Alert tab filter: 'ALL' | 'DELAYED' | 'PAUSED'
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'DELAYED' | 'PAUSED'>('ALL');

  // Real-time synchronization for selected modal task from scheduledTasks
  const currentTaskForModal = useMemo(() => {
    if (!selectedTaskForModal) return null;
    return scheduledTasks.find((t) => t.processKey === selectedTaskForModal.processKey) || selectedTaskForModal;
  }, [scheduledTasks, selectedTaskForModal]);

  const currentTaskForIncident = useMemo(() => {
    if (!selectedTaskForIncident) return null;
    return scheduledTasks.find((t) => t.processKey === selectedTaskForIncident.processKey) || selectedTaskForIncident;
  }, [scheduledTasks, selectedTaskForIncident]);

  const handleOpenIncidentModal = (task: ScheduledTaskItem) => {
    setSelectedTaskForIncident(task);
    setIsIncidentModalOpen(true);
  };

  const handleSubmitIncidentIssue = (
    processKey: string,
    issueType: string,
    note: string,
    reporterName: string
  ) => {
    if (!onUpdateProgress) return;
    const existing = (processProgressMap && processProgressMap[processKey]) || {};
    const nowIso = new Date().toISOString();
    const newIssue: IncidentIssueLog = {
      id: `ISSUE-${Date.now()}`,
      issueType,
      note,
      reportedAt: nowIso,
      reportedBy: reporterName,
      isResolved: false,
    };
    const updatedHistory = [...(existing.andonHistory || []), newIssue];
    onUpdateProgress(processKey, {
      ...existing,
      andonStatus: 'ISSUE_HOLD',
      andonIssueType: issueType,
      andonIssueNote: note,
      andonReportedAt: nowIso,
      andonReportedBy: reporterName,
      andonHistory: updatedHistory,
    });
  };

  const handleResolveIncidentIssue = (
    processKey: string,
    resolveNote: string,
    resolverName?: string
  ) => {
    if (!onUpdateProgress) return;
    const existing = (processProgressMap && processProgressMap[processKey]) || {};
    const nowIso = new Date().toISOString();
    const effectiveResolver = resolverName || currentUser?.name || '시스템 관리자';

    let foundUnresolved = false;
    const updatedHistory = (existing.andonHistory || []).map((item: IncidentIssueLog) => {
      if (!item.isResolved && !foundUnresolved) {
        foundUnresolved = true;
        return {
          ...item,
          isResolved: true,
          resolvedAt: nowIso,
          resolvedBy: effectiveResolver,
          resolvedNote: resolveNote,
        };
      }
      return item;
    });

    if (!foundUnresolved) {
      updatedHistory.push({
        id: `ISSUE-${Date.now()}`,
        issueType: existing.andonIssueType || '현장 이상 발생',
        note: existing.andonIssueNote || '현장 작업자 보고',
        reportedAt: existing.andonReportedAt || nowIso,
        reportedBy: existing.andonReportedBy || '작업자',
        isResolved: true,
        resolvedAt: nowIso,
        resolvedBy: effectiveResolver,
        resolvedNote: resolveNote,
      });
    }

    onUpdateProgress(processKey, {
      ...existing,
      andonStatus: 'RESOLVED',
      andonIssueNote: `${existing.andonIssueNote || ''} [해제 조치 (${effectiveResolver}): ${resolveNote}]`,
      andonHistory: updatedHistory,
    });
  };

  // Local fallback filter options
  const [localFilterOptions, setLocalFilterOptions] = useState<FilterOptions>({
    category: 'ALL',
    completionStatus: 'ALL',
    searchQuery: '',
    selectedWorker: 'ALL',
  });

  const filterOptions = propFilterOptions || localFilterOptions;
  const setFilterOptions = propSetFilterOptions || setLocalFilterOptions;

  // Permissions
  const effectivePerms = useMemo(() => computeEffectivePermissions(currentUser), [currentUser]);
  const canEditOrder = effectivePerms.canEditOrder && (effectivePerms.canEditMenu['dashboard'] ?? true);
  const canArchive = effectivePerms.canArchive && (effectivePerms.canEditMenu['dashboard'] ?? true);

  const allOrdersList: Order[] = useMemo(() => {
    return Object.values(orders || {}) as Order[];
  }, [orders]);

  const activeOrders: Order[] = useMemo(() => {
    return allOrdersList.filter((o) => !o.archived);
  }, [allOrdersList]);

  // Order Progress Mapping
  const orderProgressMap = useMemo(() => {
    return activeOrders.reduce((acc, ord) => {
      const tasks = scheduledTasks.filter((t) => t.orderId === ord.id);
      const completed = tasks.filter((t) => t.isCompleted).length;
      const total = tasks.length;
      const delayed = tasks.filter((t) => t.status === 'DELAYED').length;
      const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      acc[ord.id] = { completed, total, delayed, inProgress, pct };
      return acc;
    }, {} as Record<string, { completed: number; total: number; delayed: number; inProgress: number; pct: number }>);
  }, [activeOrders, scheduledTasks]);

  // Delayed / Bottleneck tasks across the entire factory
  const delayedTasks = useMemo(() => {
    return scheduledTasks.filter((t) => t.status === 'DELAYED');
  }, [scheduledTasks]);

  const inProgressTasks = useMemo(() => {
    return scheduledTasks.filter((t) => t.status === 'IN_PROGRESS');
  }, [scheduledTasks]);

  const pausedTasks = useMemo(() => {
    return scheduledTasks.filter((t) => t.status === 'PAUSED');
  }, [scheduledTasks]);

  // Executive KPI Metrics Calculation
  // 1. 총 수주 건수: 등록된 전체 수주 (활성 수주 + 완료보관 수주)
  const totalOrdersCount = allOrdersList.length;

  // 2. 완료 건수:
  //    - 완료보관함에 보관된 모든 수주 (진행중 100% 미완료였더라도 보관함에 존재하는 동안은 완료로 카운트)
  //    - 보관되지 않은 활성 수주 중 상태가 'COMPLETED' 이거나 공정 진행률이 100% 완료된 수주
  const completedOrdersList = useMemo(() => {
    return allOrdersList.filter((o) => {
      if (Boolean(o.archived)) return true;
      if (o.status === 'COMPLETED') return true;
      const prog = orderProgressMap[o.id];
      if (prog && prog.total > 0 && prog.completed === prog.total) return true;
      if (prog && prog.pct === 100) return true;
      return false;
    });
  }, [allOrdersList, orderProgressMap]);
  const completedOrdersCount = completedOrdersList.length;

  // 3. 지연 발생 수주 (보관되지 않은 활성 수주 중 미완료이면서 지연 공정이 1개 이상인 수주)
  const delayedOrdersList = useMemo(() => {
    return activeOrders.filter((o) => {
      if (o.status === 'COMPLETED') return false;
      const prog = orderProgressMap[o.id];
      if (prog && (prog.pct === 100 || (prog.total > 0 && prog.completed === prog.total))) return false;
      return (prog?.delayed || 0) > 0;
    });
  }, [activeOrders, orderProgressMap]);
  const delayedOrdersCount = delayedOrdersList.length;

  // 4. 정상 진행 수주 (보관되지 않은 활성 수주 중 미완료이면서 지연 공정이 없는 수주)
  const onTrackOrdersList = useMemo(() => {
    return activeOrders.filter((o) => {
      if (o.status === 'COMPLETED') return false;
      const prog = orderProgressMap[o.id];
      const isCompleted = prog && (prog.pct === 100 || (prog.total > 0 && prog.completed === prog.total));
      const hasDelay = (prog?.delayed || 0) > 0;
      return !isCompleted && !hasDelay;
    });
  }, [activeOrders, orderProgressMap]);
  const onTrackOrdersCount = onTrackOrdersList.length;

  const totalTasksCount = scheduledTasks.length;
  const completedTasksCount = scheduledTasks.filter((t) => t.isCompleted).length;
  const totalProductionQty = allOrdersList.reduce((sum, ord) => sum + (ord.qty || 1), 0);
  const overallProgressPct =
    totalOrdersCount > 0 ? Math.round((completedOrdersCount / totalOrdersCount) * 100) : 0;

  // Equipment OEE & Status Calculation (21 Machines)
  const equipmentStatusSummary = useMemo(() => {
    let running = 0;
    let paused = 0;
    let idle = 0;

    const mctStatus = { running: 0, idle: 0, paused: 0, total: MCT_MACHINES.length };
    const grinderStatus = { running: 0, idle: 0, paused: 0, total: GRINDER_MACHINES.length };
    const cmmStatus = { running: 0, idle: 0, paused: 0, total: CMM_MACHINES.length };

    ALL_EQUIPMENT_LIST.forEach((machineName) => {
      const task = scheduledTasks.find((t) => t.machine === machineName && !t.isCompleted);
      const isMct = MCT_MACHINES.includes(machineName);
      const isGrinder = GRINDER_MACHINES.includes(machineName);
      const isCmm = CMM_MACHINES.includes(machineName);

      if (task) {
        if (task.status === 'PAUSED' || task.status === 'DELAYED') {
          paused++;
          if (isMct) mctStatus.paused++;
          else if (isGrinder) grinderStatus.paused++;
          else if (isCmm) cmmStatus.paused++;
        } else {
          running++;
          if (isMct) mctStatus.running++;
          else if (isGrinder) grinderStatus.running++;
          else if (isCmm) cmmStatus.running++;
        }
      } else {
        idle++;
        if (isMct) mctStatus.idle++;
        else if (isGrinder) grinderStatus.idle++;
        else if (isCmm) cmmStatus.idle++;
      }
    });

    const oeeRate = ALL_EQUIPMENT_LIST.length > 0
      ? Math.round((running / ALL_EQUIPMENT_LIST.length) * 1000) / 10
      : 0;

    return {
      running,
      paused,
      idle,
      total: ALL_EQUIPMENT_LIST.length,
      oeeRate,
      mctStatus,
      grinderStatus,
      cmmStatus
    };
  }, [scheduledTasks]);

  // Alert list items (delayed and paused)
  const andonTasks = useMemo(() => {
    return scheduledTasks.filter((t) => t.andonStatus === 'ISSUE_HOLD');
  }, [scheduledTasks]);

  const bottleneckAlertTasks = useMemo(() => {
    let list: ScheduledTaskItem[] = [];
    if (alertFilter === 'ALL') {
      list = [...delayedTasks, ...pausedTasks];
    } else if (alertFilter === 'DELAYED') {
      list = [...delayedTasks];
    } else {
      list = [...pausedTasks];
    }
    return list;
  }, [delayedTasks, pausedTasks, alertFilter]);

  // Open detail modal for a specific task
  const handleOpenTaskDetail = (task: ScheduledTaskItem) => {
    setSelectedTaskForModal(task);
    setIsTaskDetailModalOpen(true);
    if (onSelectTask) {
      onSelectTask(task.processKey);
    }
  };

  return (
    <div className="w-full space-y-5 select-none pb-8 font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP DASHBOARD HEADER & QUICK ACTIONS BAR                              */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-[#0066FF] border border-blue-200">
            <BarChart3 className="w-6 h-6 text-[#0066FF]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                생산 총괄 대시보드
              </h1>
              <span className="text-[10px] bg-blue-100 text-[#0066FF] border border-blue-200 px-2 py-0.5 rounded-full font-extrabold">
                Executive Overview
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              전체 수주 현황, 주요 병목 구간 및 21대 설비 가동 상태를 한눈에 모니터링합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onNavigateToOrderMaster && (
            <button
              onClick={onNavigateToOrderMaster}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="상세 수주 목록 및 공정 구성 마스터로 이동"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
              <span>수주관리 상세</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
          {onOpenArchiveModal && (
            <button
              onClick={onOpenArchiveModal}
              className="px-3.5 py-1.5 bg-[#FFF9EB] hover:bg-[#FEF3D6] text-[#B45309] border border-[#FCD34D] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="완료 수주 보관함 열기"
            >
              <Archive className="w-3.5 h-3.5 text-[#B45309]" />
              <span>보관함</span>
            </button>
          )}
          {onNavigateToOrderForm && (
            <button
              onClick={() => {
                if (!canEditOrder) {
                  alert('⚠️ 신규 수주 등록 권한이 없습니다.\n(관리자 또는 영업담당자 계정으로 로그인해주세요.)');
                  return;
                }
                onNavigateToOrderForm();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs ${
                canEditOrder
                  ? 'bg-[#0066FF] hover:bg-blue-600 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-200 text-slate-500 border border-slate-300 opacity-70 cursor-not-allowed'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>신규 수주</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1.5. EMERGENCY ISSUE NOTIFICATION (현장 이상발생 관리자 실시간 긴급 경보)   */}
      {/* ========================================================================= */}
      {andonTasks.length > 0 && (
        <div className="bg-rose-50 border-2 border-red-500 rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-200 pb-2.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-red-600 text-white rounded-xl shadow-xs">
                <Flame className="w-5 h-5 animate-bounce" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-red-950">
                    🚨 현장 긴급 이상발생 경보 접수
                  </h2>
                  <span className="bg-red-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full animate-pulse shadow-2xs">
                    {andonTasks.length}건 정지 중
                  </span>
                </div>
                <p className="text-xs text-red-800 font-semibold mt-0.5">
                  현장 작업자가 설비 또는 품질 이상을 신고하여 공정이 긴급 정지 상태입니다. 내용을 확인하고 조치해 주십시오.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {andonTasks.map((task) => {
              const matchedOrder = orders[task.orderId];
              const pjtNoDisplay = matchedOrder?.pjtNo || matchedOrder?.poNumber || task.orderId;
              const pjtNameDisplay = matchedOrder?.pjtName || matchedOrder?.name || task.orderName;

              return (
                <div
                  key={task.processKey}
                  onClick={() => handleOpenIncidentModal(task)}
                  className="bg-white rounded-xl p-3.5 border-2 border-red-400 hover:border-red-600 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-2 group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-black bg-red-100 text-red-900 px-2 py-0.5 rounded border border-red-300">
                        {task.andonIssueType || '현장 이상 발생'}
                      </span>
                      {task.andonReportedAt && (
                        <span className="text-[10px] text-slate-500 font-bold">
                          {new Date(task.andonReportedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 접수
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-black text-slate-900 group-hover:text-red-600 transition truncate">
                      {task.content || task.groupName}
                    </div>

                    <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                      <div className="truncate">
                        <span className="font-bold text-slate-500">PJT: </span>
                        <strong className="text-blue-900">{pjtNoDisplay}</strong> ({pjtNameDisplay})
                      </div>
                      <div>
                        <span className="font-bold text-slate-500">설비/작업자: </span>
                        <strong>{task.machine || '설비 미정'}</strong> / <strong>{task.worker || '작업자 미정'}</strong>
                      </div>
                    </div>

                    {task.andonIssueNote && (
                      <div className="mt-2 bg-red-50 p-2 rounded-lg border border-red-200 text-xs text-red-950 font-bold">
                        "{task.andonIssueNote}"
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-red-700 font-black">
                    <span>신고자: {task.andonReportedBy || '현장 작업자'}</span>
                    <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition">
                      <span>조치/확인</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. 간략한 수주 현황 요약 카드 (4대 핵심 지표 네비게이션 그리드)               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: 총 수주 건수 -> 수주관리 화면 이동 */}
        <div
          role="button"
          tabIndex={0}
          onClick={onNavigateToOrderMaster}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateToOrderMaster?.();
            }
          }}
          className="bg-white rounded-2xl p-4 border border-blue-200/90 shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-blue-400 transition-all duration-200 flex flex-col justify-between relative overflow-hidden group cursor-pointer active:scale-[0.99] select-none"
          title="클릭 시 '수주관리' 메뉴로 이동합니다."
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0066FF] group-hover:h-2 transition-all" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-[#0066FF]" />
                총 수주 건수 (Total Orders)
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                  {totalOrdersCount}
                </span>
                <span className="text-sm font-bold text-slate-500">건</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0066FF] font-extrabold shadow-2xs group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              목표량: <strong className="text-blue-900">{totalProductionQty.toLocaleString()} EA</strong>
            </span>
            <span className="font-black text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white px-2 py-0.5 rounded-md transition-all flex items-center gap-0.5">
              <span>수주관리</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* KPI 2: 정상 진행 -> 공정 타임라인 (Gantt) 화면 이동 */}
        <div
          role="button"
          tabIndex={0}
          onClick={onNavigateToTimeline}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateToTimeline?.();
            }
          }}
          className="bg-white rounded-2xl p-4 border border-sky-200/90 shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-sky-400 transition-all duration-200 flex flex-col justify-between relative overflow-hidden group cursor-pointer active:scale-[0.99] select-none"
          title="클릭 시 '공정 타임라인 (Gantt)' 메뉴로 이동합니다."
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-sky-500 group-hover:h-2 transition-all" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-sky-600" />
                정상 진행 (On Track)
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-sky-900 tracking-tight group-hover:text-sky-600 transition-colors">
                  {onTrackOrdersCount}
                </span>
                <span className="text-sm font-bold text-slate-500">건</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 font-extrabold shadow-2xs group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-semibold">
              실시간: <strong className="text-sky-900">{inProgressTasks.length}개 공정 가동중</strong>
            </span>
            <span className="font-black text-sky-700 bg-sky-50 group-hover:bg-sky-600 group-hover:text-white px-2 py-0.5 rounded-md transition-all flex items-center gap-0.5">
              <span>공정 타임라인</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* KPI 3: 지연 발생 -> 현장 공정 실행 (Floor MES) 화면 이동 */}
        <div
          role="button"
          tabIndex={0}
          onClick={onNavigateToExecution}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateToExecution?.();
            }
          }}
          className={`rounded-2xl p-4 border shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between relative overflow-hidden group cursor-pointer active:scale-[0.99] select-none ${
            delayedOrdersCount > 0 || delayedTasks.length > 0
              ? 'bg-red-50/70 border-red-300 ring-2 ring-red-500/20 hover:border-red-500'
              : 'bg-white border-slate-200 hover:border-red-300'
          }`}
          title="클릭 시 '현장 공정 실행 (Floor MES)' 메뉴로 이동하여 지연 공정을 확인합니다."
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-600 group-hover:h-2 transition-all" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                지연 발생 (Delayed)
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className={`text-3xl font-black tracking-tight group-hover:scale-105 transition-transform ${
                  delayedOrdersCount > 0 ? 'text-red-600' : 'text-slate-700'
                }`}>
                  {delayedOrdersCount}
                </span>
                <span className="text-sm font-bold text-slate-500">건</span>
                {delayedTasks.length > 0 && (
                  <span className="ml-1.5 text-[11px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse shadow-xs">
                    {delayedTasks.length}개 공정 병목
                  </span>
                )}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-red-100 border border-red-300 flex items-center justify-center text-red-700 font-extrabold shadow-2xs group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all">
              <ShieldAlert className="w-5 h-5 text-red-600 group-hover:text-white" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-red-200/80 flex items-center justify-between text-[11px]">
            <span className={`font-bold ${delayedOrdersCount > 0 ? 'text-red-900' : 'text-slate-500'}`}>
              {delayedOrdersCount > 0 ? '⚠️ 긴급 조치 필요' : '정상 가동 중'}
            </span>
            <span className="font-black text-red-700 bg-red-100 group-hover:bg-red-600 group-hover:text-white px-2 py-0.5 rounded-md transition-all flex items-center gap-0.5">
              <span>현장 공정 실행</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* KPI 4: 완료 건수 -> 완료 수주 보관함 화면 이동 */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (onNavigateToArchive) {
              onNavigateToArchive();
            } else if (onOpenArchiveModal) {
              onOpenArchiveModal();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (onNavigateToArchive) onNavigateToArchive();
              else onOpenArchiveModal?.();
            }
          }}
          className="bg-white rounded-2xl p-4 border border-emerald-200/90 shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-emerald-400 transition-all duration-200 flex flex-col justify-between relative overflow-hidden group cursor-pointer active:scale-[0.99] select-none"
          title="클릭 시 '완료 수주 보관함' 메뉴로 이동합니다."
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500 group-hover:h-2 transition-all" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                완료 건수 (Completed)
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-emerald-900 tracking-tight group-hover:text-emerald-600 transition-colors">
                  {completedOrdersCount}
                </span>
                <span className="text-sm font-bold text-slate-500">건</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-extrabold shadow-2xs group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <Check className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-semibold">
              달성율: <strong className="text-emerald-800">{overallProgressPct}%</strong>
            </span>
            <span className="font-black text-emerald-700 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white px-2 py-0.5 rounded-md transition-all flex items-center gap-0.5">
              <span>완료 보관함</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. 최적화된 수주별 컴팩트 스윔레인(Swimlane) & 공정 파이프라인 뷰              */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>수주별 공정 진행 현황</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                각 수주별 공정 흐름과 실시간 진행 단계를 컴팩트한 타임라인으로 요약 표시합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-600 flex-wrap">
            <span className="flex items-center gap-1 text-[11px]">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> 완료
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <span className="w-2.5 h-2.5 rounded bg-amber-400 animate-pulse" /> 진행중
            </span>
            <span className="flex items-center gap-1 text-[11px] text-red-600">
              <span className="w-2.5 h-2.5 rounded bg-red-500" /> 지연(병목)
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <span className="w-2.5 h-2.5 rounded bg-slate-200" /> 대기
            </span>
          </div>
        </div>

        {/* Compact Process Swimlane List */}
        <div className="space-y-3">
          {activeOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              등록된 활성 수주가 없습니다. 신규 수주를 등록해주세요.
            </div>
          ) : (
            activeOrders.map((ord) => {
              const type = productTypes[ord.typeId];
              const processes: ProcessStep[] = ord.customProcesses && ord.customProcesses.length > 0
                ? ord.customProcesses
                : type ? type.processes : [];
              const orderTasks = scheduledTasks.filter((t) => t.orderId === ord.id);
              const prog = orderProgressMap[ord.id] || { completed: 0, total: 0, delayed: 0, inProgress: 0, pct: 0 };
              const isCompleted = prog.pct === 100;

              return (
                <div
                  key={ord.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    prog.delayed > 0
                      ? 'bg-red-50/30 border-red-300 shadow-xs'
                      : isCompleted
                      ? 'bg-slate-50/60 border-slate-200'
                      : 'bg-white border-slate-200 shadow-2xs hover:border-blue-300'
                  }`}
                >
                  {/* Order Overview Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0">
                        {ord.pjtNo || ord.poNumber || ord.id}
                      </span>
                      <span className="text-xs font-black text-slate-900 truncate">
                        {ord.pjtName || ord.name}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {ord.customer ? `${ord.customer} | ` : ''}{type ? type.name : '표준'} | {ord.qty}개
                      </span>
                      {prog.delayed > 0 && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                          ⚠️ 병목 지연 ({prog.delayed}개 공정)
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✅ 전공정 완료
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              prog.delayed > 0 ? 'bg-red-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${prog.pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-black font-mono text-slate-800">
                          {prog.pct}%
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {prog.completed}/{prog.total} 단계
                      </span>

                      {/* Quick Complete All / Revert Button */}
                      <button
                        onClick={() => {
                          if (completeAllFn) {
                            completeAllFn(ord.id, !isCompleted);
                          }
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                          isCompleted
                            ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                        }`}
                        title="수주 전체 공정 완료 상태 전환"
                      >
                        {isCompleted ? '진행중 전환' : '전체완료 처리'}
                      </button>
                    </div>
                  </div>

                  {/* Compact Step Swimlane Pipeline */}
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin">
                    {processes.map((proc, idx) => {
                      const matchingTask = orderTasks.find(
                        (t) => t.groupName === proc.name || t.processIndex === idx
                      );
                      const status = matchingTask?.status || (matchingTask?.isCompleted ? 'COMPLETED' : 'READY');

                      let stepClass = 'bg-slate-100 text-slate-600 border-slate-200';
                      let dotColor = 'bg-slate-300';

                      if (status === 'COMPLETED') {
                        stepClass = 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold';
                        dotColor = 'bg-emerald-500';
                      } else if (status === 'DELAYED') {
                        stepClass = 'bg-red-100 text-red-950 border-red-400 font-black ring-1 ring-red-400 shadow-xs';
                        dotColor = 'bg-red-600 animate-ping';
                      } else if (status === 'IN_PROGRESS') {
                        stepClass = 'bg-amber-50 text-amber-950 border-amber-300 font-extrabold ring-1 ring-amber-400';
                        dotColor = 'bg-amber-500 animate-pulse';
                      } else if (status === 'PAUSED') {
                        stepClass = 'bg-orange-50 text-orange-950 border-orange-300 font-bold';
                        dotColor = 'bg-orange-500';
                      }

                      return (
                        <div key={`${ord.id}-${proc.name}-${idx}`} className="flex items-center shrink-0">
                          <button
                            type="button"
                            onClick={() => matchingTask && handleOpenTaskDetail(matchingTask)}
                            className={`px-2.5 py-1.5 rounded-xl border text-[11px] flex items-center gap-1.5 transition cursor-pointer hover:scale-105 ${stepClass}`}
                            title={`${proc.name} (${proc.category}) - ${matchingTask?.machine || proc.assignedMachine || '설비미지정'}`}
                          >
                            <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                            <span className="font-extrabold whitespace-nowrap">{proc.name}</span>
                            <span className="text-[9px] opacity-70 font-mono">
                              ({proc.durationHours}h)
                            </span>
                          </button>
                          {idx < processes.length - 1 && (
                            <ChevronRight className="w-3 h-3 text-slate-300 mx-0.5 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. 주요 병목구간 알림 & 단일 설비 가동율(OEE) 2단 레이아웃                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: 주요 병목구간 및 지연 공정 알림 리스트 (Critical Bottlenecks) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between space-y-3">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-100 text-red-700 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>주요 병목구간 및 지연 공정 알림</span>
                  {delayedTasks.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold animate-pulse">
                      {delayedTasks.length}건 지연
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  병목 발생 공정을 클릭하여 설비/작업자 변경 및 상세 조치를 즉시 수행합니다.
                </p>
              </div>
            </div>

            {/* Alert Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setAlertFilter('ALL')}
                className={`px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ${
                  alertFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                전체 위험 ({delayedTasks.length + pausedTasks.length})
              </button>
              <button
                type="button"
                onClick={() => setAlertFilter('DELAYED')}
                className={`px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ${
                  alertFilter === 'DELAYED'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-red-700 hover:bg-red-50'
                }`}
              >
                지연 ({delayedTasks.length})
              </button>
              <button
                type="button"
                onClick={() => setAlertFilter('PAUSED')}
                className={`px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ${
                  alertFilter === 'PAUSED'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-orange-700 hover:bg-orange-50'
                }`}
              >
                일시정지 ({pausedTasks.length})
              </button>
            </div>
          </div>

          {bottleneckAlertTasks.length === 0 ? (
            <div className="py-7 flex flex-col items-center justify-center text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-1.5" />
              <p className="text-xs font-bold text-slate-700">현재 발생한 병목 및 지연 공정이 없습니다.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">모든 생산 라인이 표준 일정 계획에 맞추어 원활히 가동 중입니다.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {bottleneckAlertTasks.map((task) => {
                const isDelayed = task.status === 'DELAYED';
                return (
                  <div
                    key={task.processKey}
                    onClick={() => handleOpenTaskDetail(task)}
                    className={`rounded-xl p-3 flex items-center justify-between gap-3 transition cursor-pointer group shadow-2xs border ${
                      isDelayed
                        ? 'bg-red-50/90 hover:bg-red-100/90 border-red-200 text-red-950'
                        : 'bg-orange-50/90 hover:bg-orange-100/90 border-orange-200 text-orange-950'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-3 h-3 rounded-full shrink-0 ${
                        isDelayed ? 'bg-red-600 animate-ping' : 'bg-orange-500'
                      }`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black truncate">
                            [{task.orderName}] {task.groupName}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            isDelayed ? 'bg-red-200 text-red-900' : 'bg-orange-200 text-orange-900'
                          }`}>
                            #{task.productNo}호기
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-black text-white ${
                            isDelayed ? 'bg-red-600' : 'bg-orange-500'
                          }`}>
                            {isDelayed ? '⚠️ 병목 지연' : `일시정지 (${task.pauseReason || '대기'})`}
                          </span>
                        </div>
                        <div className="text-[11px] flex items-center gap-2.5 mt-1 flex-wrap font-medium opacity-90">
                          <span>지정설비: <strong className="font-extrabold">{task.machine || '미지정'}</strong></span>
                          <span>담당자: <strong className="font-extrabold">{task.worker || '미지정'}</strong></span>
                          {task.delayReason && (
                            <span className="bg-white/90 px-2 py-0.2 rounded border border-red-200 text-[10px] font-bold text-red-900">
                              사유: {task.delayReason}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`px-3 py-1 text-xs font-black text-white rounded-xl transition shrink-0 flex items-center gap-1 shadow-xs group-hover:scale-105 ${
                        isDelayed ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
                      }`}
                    >
                      <span>조치하기</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: 단일 설비 가동율 (OEE) 및 21대 설비 실시간 현황 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Cpu className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">설비 가동율 (OEE)</h3>
                <p className="text-[11px] text-slate-500 font-medium">준성테크 정밀 설비 총 21대</p>
              </div>
            </div>
            <span className="text-base font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
              {equipmentStatusSummary.oeeRate}%
            </span>
          </div>

          {/* OEE Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold text-slate-600">
              <span>실시간 가동 현황</span>
              <span>{equipmentStatusSummary.running}대 가동 / {equipmentStatusSummary.total}대 보유</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex border border-slate-200">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${(equipmentStatusSummary.running / equipmentStatusSummary.total) * 100}%` }}
                title={`가동중: ${equipmentStatusSummary.running}대`}
              />
              <div
                className="bg-amber-400 h-full transition-all duration-500"
                style={{ width: `${(equipmentStatusSummary.paused / equipmentStatusSummary.total) * 100}%` }}
                title={`정지/대기: ${equipmentStatusSummary.paused}대`}
              />
              <div
                className="bg-slate-200 h-full transition-all duration-500"
                style={{ width: `${(equipmentStatusSummary.idle / equipmentStatusSummary.total) * 100}%` }}
                title={`유휴: ${equipmentStatusSummary.idle}대`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold pt-0.5">
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> 가동중 ({equipmentStatusSummary.running})
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> 점검/정지 ({equipmentStatusSummary.paused})
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-slate-300" /> 유휴 ({equipmentStatusSummary.idle})
              </span>
            </div>
          </div>

          {/* 설비 그룹별 실시간 칩 */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                ⚙️ MCT 정밀가공 (10대)
              </span>
              <span className="font-extrabold text-indigo-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                {equipmentStatusSummary.mctStatus.running} / {equipmentStatusSummary.mctStatus.total} 가동
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                ✨ 정밀 연마기 (9대)
              </span>
              <span className="font-extrabold text-indigo-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                {equipmentStatusSummary.grinderStatus.running} / {equipmentStatusSummary.grinderStatus.total} 가동
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                📐 3차원 CMM 측정기 (2대)
              </span>
              <span className="font-extrabold text-indigo-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                {equipmentStatusSummary.cmmStatus.running} / {equipmentStatusSummary.cmmStatus.total} 가동
              </span>
            </div>
          </div>

          {onNavigateToEquipment && (
            <button
              onClick={onNavigateToEquipment}
              className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>설비 현황 전체보기</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODALS & SUB-COMPONENTS                                                */}
      {/* ========================================================================= */}
      {/* Edit Order Modal */}
      <EditOrderModal
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        order={editingOrder}
        productTypes={productTypes}
        onUpdateOrder={onUpdateOrder}
        onDeleteOrder={onDeleteOrder}
        onCompleteAllOrderProcesses={onCompleteAllOrderProcesses}
        onArchiveOrder={onArchiveOrder}
        onOpenArchiveModal={onOpenArchiveModal}
        approvedOperators={approvedOperators}
      />

      {/* Executive Direct Action Task Detail Modal */}
      {isTaskDetailModalOpen && currentTaskForModal && (
        <CalendarTaskDetailModal
          task={currentTaskForModal}
          isOpen={isTaskDetailModalOpen}
          onClose={() => {
            setIsTaskDetailModalOpen(false);
            setSelectedTaskForModal(null);
          }}
          onUpdateProgress={onUpdateProgress || (() => {})}
          currentUser={currentUser}
          approvedOperators={approvedOperators}
        />
      )}

      {/* Direct Emergency Incident Report / Action Modal */}
      {isIncidentModalOpen && currentTaskForIncident && (
        <AndonReportModal
          isOpen={isIncidentModalOpen}
          onClose={() => {
            setIsIncidentModalOpen(false);
            setSelectedTaskForIncident(null);
          }}
          taskItem={currentTaskForIncident}
          order={orders[currentTaskForIncident.orderId]}
          currentUser={currentUser}
          approvedOperators={approvedOperators}
          onSubmitIssue={handleSubmitIncidentIssue}
          onResolveIssue={handleResolveIncidentIssue}
        />
      )}
    </div>
  );
};
