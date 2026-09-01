import React, { useState, useEffect } from 'react';
import {
  ScheduledTaskItem,
  ProcessProgressMap,
  ProcessProgressItem,
  User,
  PauseReason,
  PauseLog,
  Order
} from '../types';
import { ALL_EQUIPMENT_LIST } from '../data/defaultData';
import { CalendarTaskDetailModal } from './CalendarTaskDetailModal';
import { FloorProcessCard } from './FloorProcessCard';
import { EasyTravelerModal } from './EasyTravelerModal';
import { AndonReportModal } from './AndonReportModal';
import { PausePromptModal } from './PausePromptModal';
import { PlcBridgeModal } from './PlcBridgeModal';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  UserCheck,
  Cpu,
  Clock,
  Layers,
  Sparkles,
  RefreshCw,
  Lock,
  Timer,
  Check,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Flame,
  QrCode,
  Wifi,
  Zap,
  Smartphone,
  ScanLine
} from 'lucide-react';

interface FloorExecutionViewProps {
  items?: ScheduledTaskItem[];
  scheduledTasks?: ScheduledTaskItem[];
  orders?: Record<string, Order>;
  productTypes?: Record<string, any>;
  processProgressMap: ProcessProgressMap;
  currentUser?: User | null;
  approvedOperators?: string[];
  onToggleComplete?: (taskKey: string, worker?: string, machine?: string) => void;
  onUpdateAssignee?: (taskKey: string, worker: string, machine: string) => void;
  onUpdateProgress: (processKey: string, progress: ProcessProgressItem) => void;
}

export const FloorExecutionView: React.FC<FloorExecutionViewProps> = ({
  items,
  scheduledTasks,
  orders = {},
  processProgressMap,
  currentUser,
  approvedOperators = [],
  onUpdateProgress,
}) => {
  const taskList = items || scheduledTasks || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedWorkerFilter, setSelectedWorkerFilter] = useState<string>('ALL');
  const [selectedMachineFilter, setSelectedMachineFilter] = useState<string>('ALL');
  const [showOnlyMyTasks, setShowOnlyMyTasks] = useState<boolean>(false);

  // DeepLink detection from URL (e.g. /floor?orderId=ORD-001&processId=P0)
  const [deepLinkInfo, setDeepLinkInfo] = useState<{
    orderId: string;
    processId?: string;
    orderName?: string;
  } | null>(null);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const urlParams = new URLSearchParams(window.location.search);
      const orderIdParam = urlParams.get('orderId');
      const processIdParam = urlParams.get('processId');

      if (orderIdParam) {
        setSearchQuery(orderIdParam);
        // Reset restrictive filters so deep linked tasks are immediately visible
        setSelectedCategory('ALL');
        setSelectedStatus('ALL');
        setSelectedWorkerFilter('ALL');
        setSelectedMachineFilter('ALL');
        setShowOnlyMyTasks(false);

        const matchedOrder = orders[orderIdParam];
        setDeepLinkInfo({
          orderId: orderIdParam,
          processId: processIdParam || undefined,
          orderName: matchedOrder?.name || orderIdParam,
        });

        // Smooth scroll to the target task card if loaded
        setTimeout(() => {
          if (processIdParam) {
            const targetEl = document.querySelector(`[id*="${processIdParam}"]`) || document.getElementById(`card-${orderIdParam}_Q1_${processIdParam}`);
            if (targetEl) {
              targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }, 300);
      }
    } catch (e) {
      console.error('Failed to parse URL search params for deep link', e);
    }
  }, [taskList, orders]);

  // Modals state
  const [travelerTask, setTravelerTask] = useState<ScheduledTaskItem | null>(null);
  const [isTravelerOpen, setIsTravelerOpen] = useState(false);

  const [andonTask, setAndonTask] = useState<ScheduledTaskItem | null>(null);
  const [isAndonOpen, setIsAndonOpen] = useState(false);

  const [pauseTask, setPauseTask] = useState<ScheduledTaskItem | null>(null);
  const [isPauseOpen, setIsPauseOpen] = useState(false);

  const [isPlcBridgeOpen, setIsPlcBridgeOpen] = useState(false);

  const canExecuteMES =
    !currentUser ||
    currentUser.role === 'ADMIN' ||
    currentUser.permissions?.canExecuteMES !== false;

  // Filter tasks with complete field search support (pjtNo, pjtName, orderId, processKey, orderName, worker, machine, memo)
  const filteredTasks = taskList.filter((task) => {
    const q = searchQuery.trim().toLowerCase();
    const matchedOrder = orders[task.orderId];
    const matchesSearch =
      !q ||
      (task.orderId && task.orderId.toLowerCase().includes(q)) ||
      (task.orderName && task.orderName.toLowerCase().includes(q)) ||
      (matchedOrder?.pjtNo && matchedOrder.pjtNo.toLowerCase().includes(q)) ||
      (matchedOrder?.pjtName && matchedOrder.pjtName.toLowerCase().includes(q)) ||
      (task.content && task.content.toLowerCase().includes(q)) ||
      (task.processKey && task.processKey.toLowerCase().includes(q)) ||
      (task.worker && task.worker.toLowerCase().includes(q)) ||
      (task.machine && task.machine.toLowerCase().includes(q)) ||
      (task.memo && task.memo.toLowerCase().includes(q));

    const matchesCategory =
      selectedCategory === 'ALL' || task.category === selectedCategory;

    let matchesStatus = true;
    if (selectedStatus === 'ANDON') {
      matchesStatus = task.andonStatus === 'ISSUE_HOLD';
    } else if (selectedStatus !== 'ALL') {
      matchesStatus = task.status === selectedStatus;
    }

    const matchesWorker =
      selectedWorkerFilter === 'ALL' || task.worker === selectedWorkerFilter;

    const matchesMachine =
      selectedMachineFilter === 'ALL' || task.machine === selectedMachineFilter;

    const matchesMyTask =
      !showOnlyMyTasks ||
      (currentUser?.name && task.worker?.trim() === currentUser.name.trim());

    return matchesSearch && matchesCategory && matchesStatus && matchesWorker && matchesMachine && matchesMyTask;
  });

  const completedCount = taskList.filter((i) => i.isCompleted || i.status === 'COMPLETED').length;
  const inProgressCount = taskList.filter((i) => i.status === 'IN_PROGRESS').length;
  const pausedCount = taskList.filter((i) => i.status === 'PAUSED').length;
  const andonCount = taskList.filter((i) => i.andonStatus === 'ISSUE_HOLD').length;
  const readyCount = taskList.filter((i) => i.status === 'READY' || i.status === 'PLANNED' || !i.status).length;

  // Actions
  const handleStartProcess = (processKey: string) => {
    const task = taskList.find((t) => t.processKey === processKey);
    const nowIso = new Date().toISOString();
    const workerName = task?.worker || currentUser?.name || '현장 작업자';
    const existing = processProgressMap[processKey] || {};

    onUpdateProgress(processKey, {
      ...existing,
      status: 'IN_PROGRESS',
      actualStart: nowIso,
      worker: workerName,
      machine: task?.machine || existing.machine,
      isCompleted: false,
      completedAt: null,
      pauseReason: undefined,
    });
  };

  const handleOpenPauseModal = (task: ScheduledTaskItem) => {
    setPauseTask(task);
    setIsPauseOpen(true);
  };

  const handleConfirmPause = (
    processKey: string,
    reason: string,
    operatorName: string,
    detailNote?: string
  ) => {
    const existing = processProgressMap[processKey] || {};
    const task = taskList.find((t) => t.processKey === processKey);
    const nowIso = new Date().toISOString();

    const newPauseLog: PauseLog = {
      pausedAt: nowIso,
      reason,
      operator: operatorName,
    };
    const updatedPauseHistory = [...(existing.pauseHistory || task?.pauseHistory || []), newPauseLog];

    onUpdateProgress(processKey, {
      ...existing,
      status: 'PAUSED',
      pauseReason: reason,
      pauseHistory: updatedPauseHistory,
      worker: operatorName || existing.worker || task?.worker,
      memo: detailNote ? `${existing.memo || ''} [일시정지: ${detailNote}]`.trim() : existing.memo,
    });
  };

  const handleResumeProcess = (processKey: string) => {
    const existing = processProgressMap[processKey] || {};
    const task = taskList.find((t) => t.processKey === processKey);
    const now = new Date();
    const nowIso = now.toISOString();

    const currentHistory: PauseLog[] = [...(existing.pauseHistory || task?.pauseHistory || [])];
    if (currentHistory.length > 0) {
      const last = currentHistory[currentHistory.length - 1];
      if (!last.resumedAt) {
        last.resumedAt = nowIso;
        const pStart = new Date(last.pausedAt).getTime();
        const pDur = Math.max(1, Math.round((now.getTime() - pStart) / 60000));
        last.durationMinutes = pDur;
      }
    }

    onUpdateProgress(processKey, {
      ...existing,
      status: 'IN_PROGRESS',
      pauseHistory: currentHistory,
      pauseReason: undefined,
      worker: currentUser?.name || existing.worker || task?.worker,
    });
  };

  const handleCompleteProcess = (processKey: string) => {
    const task = taskList.find((t) => t.processKey === processKey);
    const now = new Date();
    const nowIso = now.toISOString();
    const existing = processProgressMap[processKey] || {};
    const startIso = existing.actualStart || task?.actualStart;
    const start = startIso ? new Date(startIso).getTime() : Date.now() - 3600000;
    const rawMinutes = Math.max(1, Math.round((now.getTime() - start) / 60000));

    // Deduct total pause time so pure work time is recorded
    const currentHistory: PauseLog[] = [...(existing.pauseHistory || task?.pauseHistory || [])];
    if (currentHistory.length > 0) {
      const last = currentHistory[currentHistory.length - 1];
      if (!last.resumedAt) {
        last.resumedAt = nowIso;
        const pStart = new Date(last.pausedAt).getTime();
        last.durationMinutes = Math.max(1, Math.round((now.getTime() - pStart) / 60000));
      }
    }

    const totalPauseMins = currentHistory.reduce((acc, p) => acc + (p.durationMinutes || 0), 0);
    const finalActualMins = Math.max(1, rawMinutes - totalPauseMins);
    const plannedMins = task?.plannedMinutes || (task?.duration ? Math.round(task.duration * 60) : 60);

    onUpdateProgress(processKey, {
      ...existing,
      status: 'COMPLETED',
      isCompleted: true,
      completedAt: nowIso,
      actualEnd: nowIso,
      actualMinutes: finalActualMins,
      delayMinutes: finalActualMins > plannedMins ? finalActualMins - plannedMins : 0,
      pauseHistory: currentHistory,
      pauseReason: undefined,
      worker: task?.worker || currentUser?.name || existing.worker,
      machine: task?.machine || existing.machine,
    });
  };

  const handleResetProcess = (processKey: string) => {
    const existing = processProgressMap[processKey] || {};
    onUpdateProgress(processKey, {
      ...existing,
      status: 'PLANNED',
      isCompleted: false,
      completedAt: null,
      actualStart: undefined,
      actualEnd: undefined,
      actualMinutes: undefined,
      andonStatus: 'NORMAL',
    });
  };

  const handleUpdateDefectQty = (processKey: string, defectQty: number) => {
    const existing = processProgressMap[processKey] || {};
    onUpdateProgress(processKey, {
      ...existing,
      defectQty,
    });
  };

  // Andon handlers
  const handleOpenAndon = (task: ScheduledTaskItem) => {
    setAndonTask(task);
    setIsAndonOpen(true);
  };

  const handleSubmitAndonIssue = (
    processKey: string,
    issueType: string,
    note: string,
    reporterName: string
  ) => {
    const existing = processProgressMap[processKey] || {};
    const nowIso = new Date().toISOString();
    const newIssue = {
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

  const handleResolveAndonIssue = (
    processKey: string,
    resolveNote: string,
    resolverName?: string
  ) => {
    const existing = processProgressMap[processKey] || {};
    const nowIso = new Date().toISOString();
    const effectiveResolver = resolverName || currentUser?.name || '시스템 관리자';

    let foundUnresolved = false;
    const updatedHistory = (existing.andonHistory || []).map((item: any) => {
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

  // Traveler handler
  const handleOpenTraveler = (task: ScheduledTaskItem) => {
    setTravelerTask(task);
    setIsTravelerOpen(true);
  };

  // PLC rising edge cycle start trigger
  const handleTriggerPlcCycleStart = (machineId: string, machineName: string) => {
    const targetTask = taskList.find(
      (t) => (t.machine?.includes(machineId) || t.machine?.includes(machineName)) && t.status !== 'COMPLETED'
    );
    if (targetTask) {
      handleStartProcess(targetTask.processKey);
    }
  };

  return (
    <div className="flex flex-col h-full w-full space-y-4">
      {/* ========================================================================= */}
      {/* 1. QR CODE SCAN DIRECT ENTRY BANNER (IF ACCESSED VIA QR / DEEP LINK)       */}
      {/* ========================================================================= */}
      {deepLinkInfo && (
        <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl flex items-center justify-between gap-3 shadow-lg border-2 border-blue-400 animate-fadeIn flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2.5 bg-blue-500 text-white rounded-xl shrink-0 shadow-md">
              <ScanLine className="w-6 h-6 animate-pulse" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-xs sm:text-sm bg-blue-500/40 text-blue-200 px-2.5 py-0.5 rounded-md tracking-wider">
                  QR 모바일 스캔 다이렉트 인식
                </span>
                <span className="font-mono font-black text-white text-xs sm:text-sm">
                  [{deepLinkInfo.orderId}]
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate mt-0.5">
                {deepLinkInfo.orderName}
              </h2>
              {deepLinkInfo.processId && (
                <p className="text-xs text-blue-200 font-semibold mt-0.5">
                  목표 공정 단계: <strong className="text-white font-mono">{deepLinkInfo.processId}</strong> (자동 포커스 활성화)
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setDeepLinkInfo(null);
              setSearchQuery('');
              window.history.replaceState(null, '', window.location.pathname);
            }}
            className="px-4 py-2 text-xs font-black bg-white/20 hover:bg-white/30 text-white rounded-xl cursor-pointer transition shrink-0 active:scale-95 border border-white/30 shadow-xs"
          >
            전체 공정 보기
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TOP TOOLBAR & QUICK STATS                                              */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-md shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                현장 모바일 MES 공정 실행 터미널
              </h1>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-black">
                대형 터치 &amp; QR 전용
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              모바일 원터치 [공정 시작/완료], 계획 vs 실적 실시간 타이머, 현장 긴급 이상발생 호출
            </p>
          </div>
        </div>

        {/* Action Buttons & Quick KPI Strip */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* PLC Bridge Button */}
          <button
            type="button"
            onClick={() => setIsPlcBridgeOpen(true)}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-xs"
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>PLC IoT 연동 (M100)</span>
          </button>

          {/* Quick KPI Strip */}
          <div className="flex items-center gap-1.5 text-xs font-black">
            {andonCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedStatus('ANDON')}
                className="px-3 py-2 rounded-xl bg-red-600 text-white flex items-center gap-1.5 shadow-sm animate-pulse cursor-pointer"
              >
                <Flame className="w-4 h-4" />
                <span>긴급이상 {andonCount}건</span>
              </button>
            )}
            <span className="px-3 py-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
              <span>진행 {inProgressCount}건</span>
            </span>
            {pausedCount > 0 && (
              <span className="px-3 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                <Pause className="w-3.5 h-3.5 fill-amber-700 text-amber-700" />
                <span>일시정지 {pausedCount}건</span>
              </span>
            )}
            <span className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>완료 {completedCount}건</span>
            </span>
            <span className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-300">
              대기 {readyCount}건
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2.5. FLOOR EMERGENCY ALERT STRIP (IF ACTIVE ISSUES EXIST)                 */}
      {/* ========================================================================= */}
      {andonCount > 0 && (
        <div className="bg-rose-50 border-2 border-red-500 rounded-2xl p-4 shadow-md space-y-2.5 animate-pulse-subtle">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
              <Flame className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-black text-red-950">
                🚨 현장 긴급 이상발생 경보 ({andonCount}건 긴급 정지 중)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedStatus('ANDON');
                setSearchQuery('');
              }}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black transition cursor-pointer shadow-xs active:scale-95"
            >
              이상발생 공정만 모아보기
            </button>
          </div>
          <div className="text-xs text-red-900 font-bold flex flex-wrap gap-2">
            {taskList
              .filter((t) => t.andonStatus === 'ISSUE_HOLD')
              .map((t) => (
                <div
                  key={t.processKey}
                  onClick={() => {
                    const el = document.getElementById(`card-${t.processKey}`);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className="bg-white px-2.5 py-1.5 rounded-lg border border-red-300 shadow-2xs hover:bg-red-100/50 cursor-pointer flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>[{t.machine || '설비'}] {t.content}</span>
                  <span className="text-[10px] text-red-600 bg-red-100 px-1.5 py-0.2 rounded font-black">
                    {t.andonIssueType || '이상'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FILTER & SEARCH CONTROLS                                               */}
      {/* ========================================================================= */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="수주 ID, 프로젝트명, 공정명, 설비, 작업자 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowOnlyMyTasks(!showOnlyMyTasks)}
              className={`px-3 py-2.5 text-xs font-black rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                showOnlyMyTasks
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>내 배정 공정만</span>
            </button>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">전체 상태</option>
              <option value="IN_PROGRESS">가공 진행 중 (IN_PROGRESS)</option>
              <option value="PAUSED">일시정지 (PAUSED)</option>
              <option value="READY">작업 대기 (READY/PLANNED)</option>
              <option value="COMPLETED">공정 완료 (COMPLETED)</option>
              <option value="ANDON">🚨 긴급 이상발생 (ISSUE_HOLD)</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">전체 공정 분류</option>
              <option value="가공">MCT 가공</option>
              <option value="연마">정밀 연마</option>
              <option value="품질">품질 검사</option>
              <option value="외주">외주 가공</option>
            </select>

            <select
              value={selectedMachineFilter}
              onChange={(e) => setSelectedMachineFilter(e.target.value)}
              className="px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">전체 설비</option>
              {ALL_EQUIPMENT_LIST.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedWorkerFilter}
              onChange={(e) => setSelectedWorkerFilter(e.target.value)}
              className="px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">전체 작업자</option>
              {approvedOperators.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. PROCESS CARDS GRID (TOUCH-OPTIMIZED, BANNERS, SIDE-BY-SIDE TIME)        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 font-bold text-sm">
            조건에 일치하는 현장 작업 공정이 없습니다.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const taskOrder = orders[task.orderId];
            const progressItem = processProgressMap[task.processKey];
            const isTargetFocused =
              deepLinkInfo &&
              task.orderId === deepLinkInfo.orderId &&
              (!deepLinkInfo.processId ||
                task.processKey.includes(deepLinkInfo.processId) ||
                task.processKey.endsWith(`_${deepLinkInfo.processId}`));

            return (
              <FloorProcessCard
                key={task.processKey}
                task={task}
                order={taskOrder}
                progressItem={progressItem}
                canExecuteMES={canExecuteMES}
                onStartProcess={handleStartProcess}
                onPauseProcess={handleOpenPauseModal}
                onResumeProcess={handleResumeProcess}
                onCompleteProcess={handleCompleteProcess}
                onResetProcess={handleResetProcess}
                onOpenTraveler={handleOpenTraveler}
                onOpenAndon={handleOpenAndon}
                onUpdateDefectQty={handleUpdateDefectQty}
                isFocused={Boolean(isTargetFocused)}
              />
            );
          })
        )}
      </div>

      {/* Easy Traveler QR Modal */}
      {isTravelerOpen && travelerTask && (
        <EasyTravelerModal
          isOpen={isTravelerOpen}
          onClose={() => {
            setIsTravelerOpen(false);
            setTravelerTask(null);
          }}
          order={orders[travelerTask.orderId] || null}
          taskItem={travelerTask}
          processKey={travelerTask.processKey}
          processName={travelerTask.content}
          assignedMachine={travelerTask.machine}
          assignedWorker={travelerTask.worker}
          plannedMinutes={travelerTask.plannedMinutes}
          category={travelerTask.category}
        />
      )}

      {/* Andon Report Modal */}
      {isAndonOpen && andonTask && (
        <AndonReportModal
          isOpen={isAndonOpen}
          onClose={() => {
            setIsAndonOpen(false);
            setAndonTask(null);
          }}
          taskItem={andonTask}
          order={orders[andonTask.orderId]}
          currentUser={currentUser}
          approvedOperators={approvedOperators}
          onSubmitIssue={handleSubmitAndonIssue}
          onResolveIssue={handleResolveAndonIssue}
        />
      )}

      {/* Pause Prompt Modal */}
      {isPauseOpen && pauseTask && (
        <PausePromptModal
          isOpen={isPauseOpen}
          onClose={() => {
            setIsPauseOpen(false);
            setPauseTask(null);
          }}
          taskItem={pauseTask}
          order={orders[pauseTask.orderId]}
          currentUser={currentUser}
          approvedOperators={approvedOperators}
          onConfirmPause={handleConfirmPause}
        />
      )}

      {/* PLC IoT Bridge Controller Modal */}
      {isPlcBridgeOpen && (
        <PlcBridgeModal
          isOpen={isPlcBridgeOpen}
          onClose={() => setIsPlcBridgeOpen(false)}
          onTriggerPlcCycleStart={handleTriggerPlcCycleStart}
        />
      )}
    </div>
  );
};
