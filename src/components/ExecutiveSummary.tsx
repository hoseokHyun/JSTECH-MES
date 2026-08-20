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
  Info
} from 'lucide-react';
import { EditOrderModal } from './Modals';
import { CalendarTaskDetailModal } from './CalendarTaskDetailModal';

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
  onSelectTask,
  onCompleteAllOrderProcesses,
  onCompleteAllProcesses,
  onUpdateProgress,
  currentUser,
  approvedOperators = [],
}) => {
  const completeAllFn = onCompleteAllOrderProcesses || onCompleteAllProcesses;
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Task Detail Modal State for Executive Direct Action
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<ScheduledTaskItem | null>(null);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);

  // Real-time synchronization for selected modal task from scheduledTasks
  const currentTaskForModal = useMemo(() => {
    if (!selectedTaskForModal) return null;
    return scheduledTasks.find((t) => t.processKey === selectedTaskForModal.processKey) || selectedTaskForModal;
  }, [scheduledTasks, selectedTaskForModal]);

  // Local fallback filter options if not provided via props
  const [localFilterOptions, setLocalFilterOptions] = useState<FilterOptions>({
    category: 'ALL',
    completionStatus: 'ALL',
    searchQuery: '',
    selectedWorker: 'ALL',
  });

  const filterOptions = propFilterOptions || localFilterOptions;
  const setFilterOptions = propSetFilterOptions || setLocalFilterOptions;

  // Permissions
  const canEditOrder =
    !currentUser ||
    currentUser.role === 'ADMIN' ||
    currentUser.permissions?.canEditOrder === true;
  const canArchive =
    !currentUser ||
    currentUser.role === 'ADMIN' ||
    currentUser.permissions?.canArchive === true;

  const activeOrders: Order[] = useMemo(() => {
    return (Object.values(orders) as Order[]).filter((o) => !o.archived);
  }, [orders]);

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
  const totalOrdersCount = activeOrders.length;
  const completedOrdersList = useMemo(() => activeOrders.filter((o) => (orderProgressMap[o.id]?.pct || 0) === 100), [activeOrders, orderProgressMap]);
  const completedOrdersCount = completedOrdersList.length;

  // Delayed orders (any order with at least 1 delayed task or explicitly delayed)
  const delayedOrdersList = useMemo(() => {
    return activeOrders.filter((o) => {
      const prog = orderProgressMap[o.id];
      return (prog?.delayed || 0) > 0;
    });
  }, [activeOrders, orderProgressMap]);
  const delayedOrdersCount = delayedOrdersList.length;

  // Normal On-Track in progress orders
  const onTrackOrdersList = useMemo(() => {
    return activeOrders.filter((o) => {
      const prog = orderProgressMap[o.id];
      const isCompleted = (prog?.pct || 0) === 100;
      const hasDelay = (prog?.delayed || 0) > 0;
      return !isCompleted && !hasDelay;
    });
  }, [activeOrders, orderProgressMap]);
  const onTrackOrdersCount = onTrackOrdersList.length;

  const totalTasksCount = scheduledTasks.length;
  const completedTasksCount = scheduledTasks.filter((t) => t.isCompleted).length;
  const overallProgressPct =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const totalProductionQty = activeOrders.reduce((sum, ord) => sum + (ord.qty || 1), 0);

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

    const oeeRate = ALL_EQUIPMENT_LIST.length > 0 ? Math.round((running / ALL_EQUIPMENT_LIST.length) * 1000) / 10 : 0;

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

  // Filtered orders for table display
  const displayedOrders = useMemo(() => {
    return activeOrders.filter((ord) => {
      const prog = orderProgressMap[ord.id] || { completed: 0, total: 0, delayed: 0, inProgress: 0, pct: 0 };
      const isCompleted = prog.pct === 100;

      // Status filter
      if (filterOptions.completionStatus === 'PENDING' && isCompleted) return false;
      if (filterOptions.completionStatus === 'COMPLETED' && !isCompleted) return false;

      // Category filter
      if (filterOptions.category && filterOptions.category !== 'ALL') {
        const type = productTypes[ord.typeId];
        const processes = ord.customProcesses && ord.customProcesses.length > 0
          ? ord.customProcesses
          : type ? type.processes : [];
        const hasCategory = processes.some((p) => p.category === filterOptions.category);
        if (!hasCategory) return false;
      }

      // Search query filter
      if (filterOptions.searchQuery && filterOptions.searchQuery.trim()) {
        const q = filterOptions.searchQuery.trim().toLowerCase();
        const type = productTypes[ord.typeId];
        const typeName = type ? type.name.toLowerCase() : '';
        const orderName = ord.name.toLowerCase();
        const orderId = ord.id.toLowerCase();
        const matched = orderName.includes(q) || orderId.includes(q) || typeName.includes(q);
        if (!matched) return false;
      }

      return true;
    });
  }, [activeOrders, orderProgressMap, filterOptions, productTypes]);

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
      {/* 1. MAIN EXECUTIVE ORDER STATUS MASTER TABLE (수주 종합 마스터 관리)       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                수주 종합 마스터 관리 (Executive Order Master)
              </h2>
              <p className="text-[11px] text-slate-500">
                등록된 전체 수주의 상세 사양, 공정 달성율, 상태 일괄 제어 및 보관함 관리
              </p>
            </div>
          </div>

          <div className="flex gap-2 text-xs flex-wrap items-center">
            <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-bold flex items-center gap-1">
              🔄 진행중: <span className="text-blue-900 font-extrabold">{onTrackOrdersCount + delayedOrdersCount}</span>건
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold flex items-center gap-1">
              ✅ 완료: <span className="text-emerald-900 font-extrabold">{completedOrdersCount}</span>건
            </span>
            <button
              onClick={onOpenArchiveModal}
              className="bg-[#FFF9EB] hover:bg-[#FEF3D6] dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-[#B45309] dark:text-amber-300 border border-[#FCD34D] dark:border-amber-700/80 px-3 py-1 rounded-full font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
              title="완료 수주 보관함 열기"
            >
              <Archive className="w-3.5 h-3.5 text-[#B45309] dark:text-amber-400" />
              <span>보관함</span>
            </button>
            {onNavigateToOrderForm && (
              <button
                onClick={() => {
                  if (!canEditOrder) {
                    alert('⚠️ 신규 수주 등록 권한이 없습니다.\n(관리자 또는 영업담당자 계정으로 로그인해주세요.)');
                    return;
                  }
                  onNavigateToOrderForm();
                }}
                className={`px-3.5 py-1.5 rounded-lg font-black flex items-center gap-1.5 transition shadow-xs ${
                  canEditOrder
                    ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer active:scale-95'
                    : 'bg-slate-200 text-slate-500 border border-slate-300 opacity-70 cursor-not-allowed'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>신규 수주</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2 items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={filterOptions.searchQuery}
              onChange={(e) =>
                setFilterOptions((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              placeholder="수주명 또는 제품 타입 검색..."
              className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded-lg bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold">공정구분:</span>
            <select
              value={filterOptions.category}
              onChange={(e) =>
                setFilterOptions((prev) => ({ ...prev, category: e.target.value }))
              }
              className="text-xs px-2 py-1 border border-slate-300 rounded-lg bg-white font-bold"
            >
              <option value="ALL">전체</option>
              <option value="가공">가공</option>
              <option value="연마">연마</option>
              <option value="외주">외주</option>
              <option value="품질">품질</option>
            </select>

            <span className="text-slate-500 font-bold ml-2">상태:</span>
            <select
              value={filterOptions.completionStatus}
              onChange={(e) =>
                setFilterOptions((prev) => ({ ...prev, completionStatus: e.target.value }))
              }
              className="text-xs px-2 py-1 border border-slate-300 rounded-lg bg-white font-bold"
            >
              <option value="ALL">전체</option>
              <option value="PENDING">진행 대기/중</option>
              <option value="COMPLETED">완료됨</option>
            </select>
          </div>
        </div>

        {/* Order Status Table */}
        <div className="overflow-x-auto max-h-72 overflow-y-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10 shadow-2xs">
              <tr>
                <th className="p-2.5">수주명 / 프로젝트</th>
                <th className="p-2.5">제품 타입</th>
                <th className="p-2.5 text-center">수량</th>
                <th className="p-2.5 text-center">시작일시</th>
                <th className="p-2.5 text-center">공정 진행율</th>
                <th className="p-2.5 text-center">상태</th>
                <th className="p-2.5 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 font-semibold">
                    일치하는 수주 건이 없습니다.
                  </td>
                </tr>
              ) : (
                displayedOrders.map((ord: Order) => {
                  const type = productTypes[ord.typeId];
                  const typeName = type ? type.name : '-';
                  const prog = orderProgressMap[ord.id] || { completed: 0, total: 0, delayed: 0, inProgress: 0, pct: 0 };
                  const isCompleted = prog.pct === 100;

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          {prog.delayed > 0 && (
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                          )}
                          <span>{ord.name}</span>
                        </div>
                      </td>
                      <td className="p-2.5 text-slate-600 font-medium">{typeName}</td>
                      <td className="p-2.5 text-center font-bold text-slate-800">{ord.qty}개</td>
                      <td className="p-2.5 text-center text-slate-900 font-extrabold font-mono">
                        {ord.startDate ? ord.startDate.replace('T', ' ') : '-'}
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                prog.delayed > 0 ? 'bg-red-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${prog.pct}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-[11px] text-slate-700">
                            {prog.pct}%
                          </span>
                        </div>
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => {
                            if (completeAllFn) {
                              completeAllFn(ord.id, !isCompleted);
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-black transition cursor-pointer hover:opacity-80 active:scale-95 ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : prog.delayed > 0
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                          title="클릭하여 공정 상태 전환 (진행중 ↔ 완료)"
                        >
                          {isCompleted ? '✅ 완료' : prog.delayed > 0 ? '⚠️ 지연' : '🔄 진행중'}
                        </button>
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              if (!canEditOrder) {
                                alert('⚠️ 수주 정보 수정 권한이 없습니다.');
                                return;
                              }
                              setEditingOrder(ord);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-0.5 ${
                              canEditOrder
                                ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer'
                                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                            }`}
                          >
                            <Pencil className="w-3 h-3 text-blue-600" />
                            <span>수정</span>
                          </button>
                          <button
                            onClick={() => {
                              if (!canArchive) {
                                alert('⚠️ 보관함 이동 권한이 없습니다.');
                                return;
                              }
                              onArchiveOrder(ord.id);
                            }}
                            className="bg-[#FFF9EB] hover:bg-[#FEF3D6] dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-[#B45309] dark:text-amber-300 border border-[#FCD34D] dark:border-amber-700/80 px-2 py-0.5 rounded-md text-[10px] font-bold transition flex items-center gap-0.5 cursor-pointer active:scale-95 shadow-2xs"
                          >
                            <Archive className="w-3 h-3 text-[#B45309] dark:text-amber-400" />
                            <span>보관</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP EXECUTIVE KPI CARDS (4대 핵심 지표)                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: 총 수주 건수 (Total Orders - Blue) */}
        <div className="bg-white rounded-2xl p-4 border border-blue-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                총 수주 건수 (Total Orders)
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{totalOrdersCount}</span>
                <span className="text-sm font-bold text-slate-500">건</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-extrabold shadow-2xs group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-semibold">총 생산 목표량</span>
            <span className="font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md">
              {totalProductionQty.toLocaleString()} EA
            </span>
          </div>
        </div>

        {/* KPI 2: 정상 진행 (On Track - Sky/Teal) */}
        <div className="bg-white rounded-2xl p-4 border border-sky-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-sky-600" />
                정상 진행 (On Track)
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-sky-900 tracking-tight">{onTrackOrdersCount}</span>
                <span className="text-sm font-bold text-slate-500">건</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 font-extrabold shadow-2xs group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-semibold">실시간 가동 공정</span>
            <span className="font-extrabold text-sky-900 bg-sky-50 px-2 py-0.5 rounded-md">
              {inProgressTasks.length}개 라인 가동중
            </span>
          </div>
        </div>

        {/* KPI 3: 지연 발생 (Delayed - RED STRONG HIGHLIGHT) */}
        <div className={`rounded-2xl p-4 border transition-all flex flex-col justify-between relative overflow-hidden group ${
          delayedOrdersCount > 0 || delayedTasks.length > 0
            ? 'bg-red-50/70 border-red-300 shadow-md ring-2 ring-red-500/20 animate-subtle-glow'
            : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-600" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600 animate-bounce" />
                지연 발생 (Delayed / At Risk)
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className={`text-3xl font-black tracking-tight ${
                  delayedOrdersCount > 0 ? 'text-red-600' : 'text-slate-700'
                }`}>
                  {delayedOrdersCount}
                </span>
                <span className="text-sm font-bold text-slate-500">건</span>
                {delayedTasks.length > 0 && (
                  <span className="ml-1.5 text-[11px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse shadow-xs">
                    {delayedTasks.length}개 공정 지연
                  </span>
                )}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-red-100 border border-red-300 flex items-center justify-center text-red-700 font-extrabold shadow-2xs group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-red-200/80 flex items-center justify-between text-[11px]">
            <span className="text-red-800 font-bold">임원 긴급 조치 필요</span>
            <span className={`font-black px-2 py-0.5 rounded-md ${
              delayedOrdersCount > 0 ? 'bg-red-200 text-red-950 font-bold' : 'text-slate-500'
            }`}>
              {delayedOrdersCount > 0 ? '위험 구간 조치필요' : '정상'}
            </span>
          </div>
        </div>

        {/* KPI 4: 완료 건수 (Completed - Green) */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                완료 건수 (Completed)
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-emerald-900 tracking-tight">{completedOrdersCount}</span>
                <span className="text-sm font-bold text-slate-500">건</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-extrabold shadow-2xs group-hover:scale-105 transition-transform">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-semibold">전체 공정 달성율</span>
            <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
              {overallProgressPct}% 달성 ({completedTasksCount}/{totalTasksCount})
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. EXECUTIVE ALERT BOX & EQUIPMENT OEE SUMMARY (2단 레이아웃)               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: 지연/위험 공정 긴급 경고 구역 (Executive Alert Box) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-100 text-red-700 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>지연 및 위험 공정 긴급 관리 (Executive Action Required)</span>
                  {delayedTasks.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold animate-pulse">
                      {delayedTasks.length}건 지연
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  병목 발생 공정을 클릭하면 담당자/설비 지정 및 상세 조치 모달이 즉시 열립니다.
                </p>
              </div>
            </div>
          </div>

          {delayedTasks.length === 0 && pausedTasks.length === 0 ? (
            <div className="py-6 flex flex-col items-center justify-center text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-1.5" />
              <p className="text-xs font-bold text-slate-700">현재 지연 및 정지된 공정이 없습니다.</p>
              <p className="text-[11px] text-slate-500">모든 생산 라인이 표준 일정 계획에 맞추어 정상 가동 중입니다.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {/* Delayed Tasks First */}
              {delayedTasks.map((task) => (
                <div
                  key={task.processKey}
                  onClick={() => handleOpenTaskDetail(task)}
                  className="bg-red-50/90 hover:bg-red-100/80 border border-red-200 rounded-xl p-2.5 flex items-center justify-between gap-3 transition cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0 animate-ping" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-red-950 truncate">
                          [{task.orderName}] {task.groupName}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-red-200 text-red-900">
                          #{task.productNo}호기
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-extrabold bg-red-600 text-white">
                          지연
                        </span>
                      </div>
                      <div className="text-[11px] text-red-800/90 flex items-center gap-2 mt-0.5 flex-wrap font-medium">
                        <span>설비: <strong className="font-bold text-red-950">{task.machine || '미지정'}</strong></span>
                        <span>담당: <strong className="font-bold text-red-950">{task.worker || '미지정'}</strong></span>
                        {task.delayReason && (
                          <span className="text-red-900 font-bold bg-white/80 px-1.5 py-0.2 rounded border border-red-200 text-[10px]">
                            사유: {task.delayReason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-2.5 py-1 text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition shrink-0 flex items-center gap-1 shadow-xs group-hover:scale-105"
                  >
                    <span>조치하기</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Paused Tasks */}
              {pausedTasks.map((task) => (
                <div
                  key={task.processKey}
                  onClick={() => handleOpenTaskDetail(task)}
                  className="bg-orange-50/90 hover:bg-orange-100/80 border border-orange-200 rounded-xl p-2.5 flex items-center justify-between gap-3 transition cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-orange-950 truncate">
                          [{task.orderName}] {task.groupName}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-orange-200 text-orange-900">
                          #{task.productNo}호기
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-extrabold bg-orange-500 text-white">
                          일시정지 ({task.pauseReason || '대기'})
                        </span>
                      </div>
                      <div className="text-[11px] text-orange-800/90 flex items-center gap-2 mt-0.5 font-medium">
                        <span>설비: <strong>{task.machine || '미지정'}</strong></span>
                        <span>담당: <strong>{task.worker || '미지정'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-2.5 py-1 text-[11px] font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition shrink-0 flex items-center gap-1 shadow-xs group-hover:scale-105"
                  >
                    <span>상세보기</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: 설비 가동률(OEE) 및 21대 설비 실시간 요약 (Requirement 3) */}
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
              <span>{equipmentStatusSummary.running}대 가동 / {equipmentStatusSummary.total}대 총보유</span>
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
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 가동중 ({equipmentStatusSummary.running})
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> 점검/정지 ({equipmentStatusSummary.paused})
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-slate-300"></span> 유휴 ({equipmentStatusSummary.idle})
              </span>
            </div>
          </div>

          {/* 설비 그룹별 실시간 칩 */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                ⚙️ MCT 정밀가공 (10대)
              </span>
              <span className="font-extrabold text-indigo-900">
                {equipmentStatusSummary.mctStatus.running} / {equipmentStatusSummary.mctStatus.total} 가동
              </span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                🔧 정밀 연마기 (9대)
              </span>
              <span className="font-extrabold text-indigo-900">
                {equipmentStatusSummary.grinderStatus.running} / {equipmentStatusSummary.grinderStatus.total} 가동
              </span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                📐 3차원 CMM 측정기 (2대)
              </span>
              <span className="font-extrabold text-indigo-900">
                {equipmentStatusSummary.cmmStatus.running} / {equipmentStatusSummary.cmmStatus.total} 가동
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. 전공정 진행 현황 및 병목 구간(Bottleneck) 요약 섹션                       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>전공정 진행 현황 및 병목 구간 (Multi-step Routing & Bottleneck Tracker)</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                각 수주별 전체 공정 단계(소재절단 ➔ 열처리 ➔ MCT가공 ➔ 연마 ➔ 품질검사)의 실시간 상태 및 병목 지점
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
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
              <span className="w-2.5 h-2.5 rounded bg-slate-200" /> 계획/대기
            </span>
          </div>
        </div>

        {/* Project Multi-Step Routing Progress List */}
        <div className="space-y-3.5">
          {activeOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-medium">
              등록된 수주가 없습니다. 신규 수주를 등록해주세요.
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
                  className={`p-3.5 rounded-xl border transition ${
                    prog.delayed > 0
                      ? 'bg-red-50/40 border-red-300'
                      : isCompleted
                      ? 'bg-slate-50/60 border-slate-200'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  {/* Order Header Info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-black text-slate-900 truncate">
                        {ord.name}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        ({type ? type.name : '표준'} | {ord.qty}개)
                      </span>
                      {prog.delayed > 0 && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                          ⚠️ 병목 지연 발생 ({prog.delayed}개 공정)
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
                        <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
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
                    </div>
                  </div>

                  {/* Process Step Breadcrumbs / Multi-Progress Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
                    {processes.map((proc, idx) => {
                      // Find corresponding task for this order & process
                      const matchingTask = orderTasks.find((t) => t.groupName === proc.name || t.processIndex === idx);
                      const status = matchingTask?.status || (matchingTask?.isCompleted ? 'COMPLETED' : 'READY');

                      let stepBg = 'bg-slate-100 text-slate-600 border-slate-200';
                      let stepBadge = '대기';
                      let badgeBg = 'bg-slate-200 text-slate-700';

                      if (status === 'COMPLETED') {
                        stepBg = 'bg-emerald-50 text-emerald-900 border-emerald-200 font-bold';
                        stepBadge = '완료';
                        badgeBg = 'bg-emerald-200 text-emerald-900';
                      } else if (status === 'DELAYED') {
                        stepBg = 'bg-red-100 text-red-950 border-red-300 font-black shadow-xs ring-1 ring-red-400';
                        stepBadge = '지연 (병목)';
                        badgeBg = 'bg-red-600 text-white animate-pulse';
                      } else if (status === 'IN_PROGRESS') {
                        stepBg = 'bg-amber-50 text-amber-950 border-amber-300 font-extrabold ring-1 ring-amber-400';
                        stepBadge = '진행중';
                        badgeBg = 'bg-amber-500 text-white animate-pulse';
                      } else if (status === 'PAUSED') {
                        stepBg = 'bg-orange-50 text-orange-950 border-orange-200 font-bold';
                        stepBadge = '정지';
                        badgeBg = 'bg-orange-500 text-white';
                      }

                      return (
                        <div
                          key={`${ord.id}-${proc.name}-${idx}`}
                          onClick={() => matchingTask && handleOpenTaskDetail(matchingTask)}
                          className={`p-2 rounded-lg border text-xs flex flex-col justify-between gap-1 transition ${
                            matchingTask ? 'cursor-pointer hover:scale-[1.02] hover:shadow-xs' : ''
                          } ${stepBg}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono opacity-70 font-bold">
                              {idx + 1}. {proc.category}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${badgeBg}`}>
                              {stepBadge}
                            </span>
                          </div>

                          <div className="font-extrabold text-[11px] truncate tracking-tight">
                            {proc.name}
                          </div>

                          <div className="text-[10px] opacity-80 flex items-center justify-between pt-0.5 border-t border-black/5 font-medium">
                            <span className="truncate">{matchingTask?.machine || proc.assignedMachine || '외주'}</span>
                            <span className="font-mono">{proc.durationHours}h</span>
                          </div>
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
    </div>
  );
};
