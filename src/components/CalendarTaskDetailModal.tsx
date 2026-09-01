import React, { useState, useEffect, useMemo } from 'react';
import { ScheduledTaskItem, ProcessProgressItem, PauseReason, User, PauseLog } from '../types';
import { ALL_EQUIPMENT_LIST } from '../data/defaultData';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { buildOperatorSelectOptions } from '../utils/operatorHelper';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User as UserIcon,
  Cpu,
  Calendar,
  Layers,
  FileText,
  History,
  Timer,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Save,
  Check,
  Zap,
  Info,
  Flame,
  CheckCheck
} from 'lucide-react';

interface CalendarTaskDetailModalProps {
  task: ScheduledTaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProgress: (processKey: string, progress: ProcessProgressItem) => void;
  currentUser?: User | null;
  approvedOperators?: string[];
}

const PAUSE_REASONS: PauseReason[] = [
  '설비 고장',
  '자재 부족',
  '품질 문제',
  '작업자 부재',
  '도면 문제',
  '기타'
];

export const CalendarTaskDetailModal: React.FC<CalendarTaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdateProgress,
  currentUser,
  approvedOperators = [],
}) => {
  const [selectedWorker, setSelectedWorker] = useState(task?.worker || '');
  const [selectedMachine, setSelectedMachine] = useState(task?.machine || '');
  const [memo, setMemo] = useState(task?.memo || '');
  const [delayReason, setDelayReason] = useState(task?.delayReason || '');
  const [isPausePromptOpen, setIsPausePromptOpen] = useState(false);
  const [selectedPauseReason, setSelectedPauseReason] = useState<PauseReason>('설비 고장');
  const [customPauseReason, setCustomPauseReason] = useState('');
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Optimistic local override for instantaneous UI transition
  const [localTaskOverride, setLocalTaskOverride] = useState<Partial<ScheduledTaskItem> | null>(null);

  // Prominent Toast Notification state
  const [toastNotification, setToastNotification] = useState<{
    type: 'success' | 'warning' | 'info';
    title: string;
    detail?: string;
  } | null>(null);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => {
        setToastNotification(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  // Sync state when task changes or modal opens
  useEffect(() => {
    if (task) {
      setSelectedWorker(task.worker || '');
      setSelectedMachine(task.machine || '');
      setMemo(task.memo || '');
      setDelayReason(task.delayReason || '');
      setIsPausePromptOpen(false);
      setSelectedPauseReason('설비 고장');
      setCustomPauseReason('');
      setLocalTaskOverride(null);
    }
  }, [task?.processKey, task?.worker, task?.machine, isOpen]);

  // Dynamic operator options for SearchableSelect
  const operatorOptions: SelectOption[] = useMemo(() => {
    return buildOperatorSelectOptions(
      approvedOperators,
      [selectedWorker, task?.worker],
      {
        placeholderLabel: '(작업자 미지정)',
        allowOutsourcing: true,
      }
    );
  }, [approvedOperators, selectedWorker, task?.worker]);

  // Dynamic machine options for SearchableSelect
  const machineOptions: SelectOption[] = useMemo(() => {
    const opts: SelectOption[] = [
      { value: '', label: '(설비 미지정)', badge: '미지정', badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' }
    ];
    const added = new Set<string>(['']);

    ALL_EQUIPMENT_LIST.forEach((m) => {
      if (!m || added.has(m)) return;
      added.add(m);

      let badge = '설비';
      let badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200';
      if (m.includes('MCT')) {
        badge = 'MCT';
        badgeColor = 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300';
      } else if (m.includes('연마기')) {
        badge = '연마';
        badgeColor = 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300';
      } else if (m.includes('CMM') || m.includes('측정')) {
        badge = '품질CMM';
        badgeColor = 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300';
      } else if (m.includes('세척') || m.includes('초음파')) {
        badge = '세척';
        badgeColor = 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300';
      } else if (m.includes('조립') || m.includes('클린룸')) {
        badge = '조립';
        badgeColor = 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300';
      }

      opts.push({
        value: m,
        label: m,
        badge,
        badgeColor,
      });
    });

    [selectedMachine, task?.machine].forEach((m) => {
      const clean = (m || '').trim();
      if (clean && !added.has(clean)) {
        added.add(clean);
        opts.push({
          value: clean,
          label: clean,
          badge: '배정설비',
          badgeColor: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300',
        });
      }
    });

    return opts;
  }, [selectedMachine, task?.machine]);

  // Active task item merging optimistic local overrides
  const activeTask: ScheduledTaskItem | null = task
    ? {
        ...task,
        ...(localTaskOverride || {}),
        worker: selectedWorker || (localTaskOverride?.worker ?? task.worker),
        machine: selectedMachine || (localTaskOverride?.machine ?? task.machine),
      }
    : null;

  // Live timer for currently IN_PROGRESS task
  useEffect(() => {
    if (!activeTask) return;
    if (activeTask.status === 'IN_PROGRESS' && activeTask.actualStart) {
      const calcElapsed = () => {
        const start = new Date(activeTask.actualStart!).getTime();
        const now = Date.now();
        const totalRaw = Math.max(0, Math.floor((now - start) / 60000));

        // Subtract completed pause durations
        const pauseTotal = (activeTask.pauseHistory || []).reduce(
          (acc, p) => acc + (p.durationMinutes || 0),
          0
        );
        setElapsedMinutes(Math.max(0, totalRaw - pauseTotal));
      };

      calcElapsed();
      const interval = setInterval(calcElapsed, 1000);
      return () => clearInterval(interval);
    } else if (activeTask.actualMinutes !== null && activeTask.actualMinutes !== undefined) {
      setElapsedMinutes(activeTask.actualMinutes);
    }
  }, [activeTask?.status, activeTask?.actualStart, activeTask?.actualMinutes, activeTask?.pauseHistory]);

  if (!isOpen || !task || !activeTask) return null;

  // Format Date Helper
  const formatDateTime = (dateVal: Date | string | null | undefined): string => {
    if (!dateVal) return '-';
    const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
    if (isNaN(d.getTime())) return '-';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${mm}/${dd} ${hh}:${min}`;
  };

  const getStatusBadge = () => {
    switch (activeTask.status) {
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            진행중 ({elapsedMinutes}분)
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-900 border border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-700">
            <Pause className="w-3.5 h-3.5" />
            일시정지: {activeTask.pauseReason || '작업 대기'}
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            완료 ({activeTask.actualMinutes || activeTask.plannedMinutes}분)
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700">
            <AlertTriangle className="w-3.5 h-3.5" />
            지연 예상
          </span>
        );
      case 'PLANNED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700">
            <Clock className="w-3.5 h-3.5" />
            계획됨
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            대기/미착수
          </span>
        );
    }
  };

  // Actions
  const handleStartTask = () => {
    const nowIso = new Date().toISOString();
    const workerName = selectedWorker || currentUser?.name || '현장담당자';
    const effectiveMachine = selectedMachine || task.machine;

    // 1. Optimistic instantaneous UI state update (0ms UI latency)
    setLocalTaskOverride({
      status: 'IN_PROGRESS',
      actualStart: nowIso,
      worker: workerName,
      machine: effectiveMachine,
      isCompleted: false,
      completedAt: null,
    });

    // 2. Real-time store & backend synchronization
    onUpdateProgress(task.processKey, {
      status: 'IN_PROGRESS',
      actualStart: nowIso,
      worker: workerName,
      machine: effectiveMachine,
      isCompleted: false,
      completedAt: null,
      memo,
      delayReason,
    });

    // 3. Clear, unambiguous feedback (Toast)
    const timeFormatted = new Date(nowIso).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    setToastNotification({
      type: 'success',
      title: '작업이 성공적으로 시작되었습니다.',
      detail: `실제 시작 시간(${timeFormatted})이 기록되었으며, 실시간 '진행중' 상태로 전환되었습니다.`,
    });
  };

  const handlePauseTask = () => {
    setIsPausePromptOpen(true);
  };

  const confirmPause = () => {
    const nowIso = new Date().toISOString();
    const reasonText =
      selectedPauseReason === '기타' ? customPauseReason || '기타 사유' : selectedPauseReason;
    const currentHistory: PauseLog[] = [...(activeTask.pauseHistory || [])];
    currentHistory.push({
      pausedAt: nowIso,
      reason: reasonText,
    });

    setLocalTaskOverride({
      status: 'PAUSED',
      pauseReason: reasonText,
      pauseHistory: currentHistory,
      worker: selectedWorker || activeTask.worker,
      machine: selectedMachine || activeTask.machine,
    });

    onUpdateProgress(task.processKey, {
      status: 'PAUSED',
      pauseReason: reasonText,
      pauseHistory: currentHistory,
      worker: selectedWorker || activeTask.worker,
      machine: selectedMachine || activeTask.machine,
      memo,
      delayReason,
    });

    setIsPausePromptOpen(false);

    setToastNotification({
      type: 'warning',
      title: '작업이 일시정지되었습니다.',
      detail: `사유: ${reasonText} (일시정지 중 실제 작업시간 카운트가 중지됩니다.)`,
    });
  };

  const handleResumeTask = () => {
    const now = new Date();
    const nowIso = now.toISOString();
    const currentHistory: PauseLog[] = [...(activeTask.pauseHistory || [])];

    // Update the last active pause log
    if (currentHistory.length > 0) {
      const last = currentHistory[currentHistory.length - 1];
      if (!last.resumedAt) {
        last.resumedAt = nowIso;
        const pStart = new Date(last.pausedAt).getTime();
        const pDur = Math.max(1, Math.round((now.getTime() - pStart) / 60000));
        last.durationMinutes = pDur;
      }
    }

    setLocalTaskOverride({
      status: 'IN_PROGRESS',
      pauseHistory: currentHistory,
      pauseReason: '',
      worker: selectedWorker || activeTask.worker,
      machine: selectedMachine || activeTask.machine,
    });

    onUpdateProgress(task.processKey, {
      status: 'IN_PROGRESS',
      pauseHistory: currentHistory,
      pauseReason: '',
      worker: selectedWorker || activeTask.worker,
      machine: selectedMachine || activeTask.machine,
      memo,
      delayReason,
    });

    setToastNotification({
      type: 'success',
      title: '작업이 성공적으로 재개되었습니다.',
      detail: '실제 작업시간 카운트가 다시 시작되었습니다.',
    });
  };

  const handleCompleteTask = () => {
    const now = new Date();
    const nowIso = now.toISOString();
    const start = activeTask.actualStart
      ? new Date(activeTask.actualStart).getTime()
      : activeTask.plannedStart.getTime();
    const rawMinutes = Math.max(1, Math.round((now.getTime() - start) / 60000));

    // Deduct pause times
    const currentHistory: PauseLog[] = [...(activeTask.pauseHistory || [])];
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
    const plannedMins = activeTask.plannedMinutes;
    const diff = finalActualMins - plannedMins;

    setLocalTaskOverride({
      status: 'COMPLETED',
      isCompleted: true,
      completedAt: nowIso,
      actualEnd: nowIso,
      actualMinutes: finalActualMins,
      pauseHistory: currentHistory,
      delayMinutes: diff > 0 ? diff : 0,
      delayReason: diff > 0 ? delayReason || '공정 난이도 및 치수보정' : '',
      worker: selectedWorker || currentUser?.name || activeTask.worker,
      machine: selectedMachine || activeTask.machine,
    });

    onUpdateProgress(task.processKey, {
      status: 'COMPLETED',
      isCompleted: true,
      completedAt: nowIso,
      actualEnd: nowIso,
      actualMinutes: finalActualMins,
      pauseHistory: currentHistory,
      delayMinutes: diff > 0 ? diff : 0,
      delayReason: diff > 0 ? delayReason || '공정 난이도 및 치수보정' : '',
      worker: selectedWorker || currentUser?.name || activeTask.worker,
      machine: selectedMachine || activeTask.machine,
      memo,
    });

    setToastNotification({
      type: 'success',
      title: '공정 작업이 완료 처리되었습니다.',
      detail: `총 실제 작업시간: ${finalActualMins}분 (계획 ${plannedMins}분 대비 ${
        diff > 0 ? `+${diff}분 초과` : diff < 0 ? `${Math.abs(diff)}분 단축` : '정확히 일치'
      })`,
    });
  };

  const handleResetOrCancel = () => {
    if (window.confirm('이 공정의 실적을 초기화하고 대기(미착수) 상태로 되돌리시겠습니까?')) {
      setLocalTaskOverride({
        status: 'READY',
        isCompleted: false,
        completedAt: null,
        actualStart: null,
        actualEnd: null,
        actualMinutes: undefined,
        pauseHistory: [],
        pauseReason: '',
        delayMinutes: 0,
        delayReason: '',
        worker: selectedWorker,
        machine: selectedMachine,
      });

      onUpdateProgress(task.processKey, {
        status: 'READY',
        isCompleted: false,
        completedAt: null,
        actualStart: null,
        actualEnd: null,
        actualMinutes: undefined,
        pauseHistory: [],
        pauseReason: '',
        delayMinutes: 0,
        delayReason: '',
        worker: selectedWorker,
        machine: selectedMachine,
        memo,
      });

      setToastNotification({
        type: 'info',
        title: '공정이 대기 상태로 초기화되었습니다.',
        detail: '실제 실적 데이터가 초기화되었습니다.',
      });
    }
  };

  const handleSaveAssignments = () => {
    onUpdateProgress(task.processKey, {
      worker: selectedWorker,
      machine: selectedMachine,
      memo,
      delayReason,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);

    setToastNotification({
      type: 'success',
      title: '설비 및 작업자 정보가 저장되었습니다.',
    });
  };

  // Variance calculation
  const plannedMins = activeTask.plannedMinutes;
  const currentActualMins =
    activeTask.actualMinutes !== null && activeTask.actualMinutes !== undefined
      ? activeTask.actualMinutes
      : elapsedMinutes;
  const varianceMins = currentActualMins > 0 ? currentActualMins - plannedMins : 0;
  const totalPauseTime = (activeTask.pauseHistory || []).reduce(
    (acc, p) => acc + (p.durationMinutes || 0),
    0
  );

  return (
    <div
      id="calendar-task-detail-modal"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 relative">
        {/* Prominent Toast Notification Banner */}
        {toastNotification && (
          <div
            id="task-modal-toast"
            className={`px-4 py-3 border-b flex items-start justify-between gap-3 animate-in slide-in-from-top-2 duration-200 transition-all ${
              toastNotification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-200'
                : toastNotification.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/80 dark:border-amber-800 dark:text-amber-200'
                : 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/80 dark:border-blue-800 dark:text-blue-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {toastNotification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : toastNotification.type === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-xs font-black leading-snug">{toastNotification.title}</p>
                {toastNotification.detail && (
                  <p className="text-[11px] opacity-90 mt-0.5 font-medium">
                    {toastNotification.detail}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setToastNotification(null)}
              className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-current transition cursor-pointer"
              title="알림 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-black text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                  {activeTask.orderId} #{activeTask.productNo}호기
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  공정 #{activeTask.processIndex + 1}/{activeTask.totalProcessesInOrder}
                </span>
                {getStatusBadge()}
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                {activeTask.groupName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            title="모달 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Real-time Running Status Banner */}
          {activeTask.status === 'IN_PROGRESS' && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-amber-300 dark:border-amber-700/70 rounded-xl p-3 flex items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <div>
                  <p className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <span>현재 실시간 작업 '진행중 (Running)'</span>
                    <span className="text-[11px] font-mono font-normal bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded text-amber-800 dark:text-amber-300">
                      실시간 가동시간: {elapsedMinutes}분 경과
                    </span>
                  </p>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                    시작 시각: {formatDateTime(activeTask.actualStart)} | 작업이 완료되면 하단 [작업 완료]를 누르거나 확인 후 창을 닫으실 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Order Info */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="text-slate-500">수주 프로젝트:</span>
              <strong className="text-slate-800 dark:text-slate-200">{activeTask.orderName}</strong>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500">카테고리:</span>
              <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                {activeTask.category}
              </span>
            </div>
          </div>

          {/* Plan vs Actual Comparison Matrix (핵심 요구사항) */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>생산 계획 (Plan) vs 실제 실적 (Actual) 정밀 비교</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                ※ 계획 데이터는 보존되며 실적과 분리 관리됩니다.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
              {/* Planned Box */}
              <div className="p-4 space-y-2.5 bg-blue-50/20 dark:bg-blue-950/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-700 dark:text-blue-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    계획 (Production Plan)
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                    {plannedMins}분 ({activeTask.duration}시간)
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">계획 시작:</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200">
                      {formatDateTime(activeTask.plannedStart)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">계획 종료:</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200">
                      {formatDateTime(activeTask.plannedEnd)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">계획 소요시간:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{plannedMins}분</strong>
                  </div>
                </div>
              </div>

              {/* Actual Box */}
              <div
                className={`p-4 space-y-2.5 transition-colors ${
                  activeTask.status === 'IN_PROGRESS'
                    ? 'bg-amber-50/40 dark:bg-amber-950/20'
                    : 'bg-emerald-50/20 dark:bg-emerald-950/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-black flex items-center gap-1 ${
                      activeTask.status === 'IN_PROGRESS'
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    실제 실적 (Production Actual)
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      activeTask.status === 'IN_PROGRESS'
                        ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 animate-pulse'
                        : activeTask.actualMinutes !== null && activeTask.actualMinutes !== undefined
                        ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {activeTask.status === 'IN_PROGRESS'
                      ? `진행중 (${elapsedMinutes}분)`
                      : activeTask.actualMinutes !== null && activeTask.actualMinutes !== undefined
                      ? `${activeTask.actualMinutes}분`
                      : '미착수'}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">실제 시작:</span>
                    <strong
                      className={`font-mono ${
                        activeTask.actualStart
                          ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {formatDateTime(activeTask.actualStart)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">실제 종료:</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200">
                      {formatDateTime(activeTask.actualEnd)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">실제 작업시간:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {activeTask.status === 'IN_PROGRESS' ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          {elapsedMinutes}분 (실시간 측정중)
                        </span>
                      ) : currentActualMins > 0 ? (
                        `${currentActualMins}분`
                      ) : (
                        '-'
                      )}
                      {totalPauseTime > 0 && (
                        <span className="text-orange-600 dark:text-orange-400 text-[11px] ml-1">
                          (일시정지 {totalPauseTime}분 제외)
                        </span>
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Variance Analysis Footer */}
            {currentActualMins > 0 && (
              <div className="p-3 bg-slate-100/70 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between text-xs gap-2">
                <span className="text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
                  계획 대비 실적 분석 결과:
                </span>
                <div>
                  {varianceMins > 0 ? (
                    <span className="inline-flex items-center gap-1 font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +{varianceMins}분 지연 발생 ({Math.round((varianceMins / plannedMins) * 100)}%
                      초과)
                    </span>
                  ) : varianceMins < 0 ? (
                    <span className="inline-flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <TrendingDown className="w-3.5 h-3.5" />
                      {Math.abs(varianceMins)}분 단축 완료 (
                      {Math.round((Math.abs(varianceMins) / plannedMins) * 100)}% 효율 달성)
                    </span>
                  ) : (
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      정확히 계획 표준시간(100%)과 일치
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Resource Assignments (Worker & Machine) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-500" />
                <span>담당 가공 설비</span>
              </label>
              <SearchableSelect
                options={machineOptions}
                value={selectedMachine}
                onChange={(val) => setSelectedMachine(val)}
                placeholder="담당 설비 선택 (총 21대)"
                icon={Cpu}
                className="w-full"
                triggerClassName="w-full text-xs py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span>공정 담당 작업자</span>
              </label>
              <SearchableSelect
                options={operatorOptions}
                value={selectedWorker}
                onChange={(val) => setSelectedWorker(val)}
                placeholder="공정 담당 작업자 선택"
                icon={UserIcon}
                className="w-full"
                triggerClassName="w-full text-xs py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Pause History List */}
          {activeTask.pauseHistory && activeTask.pauseHistory.length > 0 && (
            <div className="border border-orange-200 dark:border-orange-900/60 rounded-xl p-3 bg-orange-50/40 dark:bg-orange-950/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-orange-900 dark:text-orange-300">
                <span className="flex items-center gap-1">
                  <History className="w-3.5 h-3.5" />
                  일시정지 이력 ({activeTask.pauseHistory.length}회, 총 {totalPauseTime}분)
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                {activeTask.pauseHistory.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white dark:bg-slate-800 p-1.5 rounded border border-orange-100 dark:border-orange-900 text-slate-700 dark:text-slate-300"
                  >
                    <span className="font-bold text-orange-800 dark:text-orange-400">
                      #{idx + 1} {p.reason}
                    </span>
                    <span className="font-mono text-slate-500">
                      {formatDateTime(p.pausedAt)} ~ {p.resumedAt ? formatDateTime(p.resumedAt) : '진행중'} (
                      {p.durationMinutes || '?'}분)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incident Issue & Resolution History Section */}
          {((activeTask.andonHistory && activeTask.andonHistory.length > 0) || activeTask.andonStatus === 'ISSUE_HOLD') && (
            <div className="border-2 border-red-300 dark:border-red-900/60 rounded-xl p-3 bg-red-50/50 dark:bg-red-950/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-red-900 dark:text-red-300">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-red-600 animate-pulse" />
                  <span>현장 이상 발생 및 조치 이력 ({activeTask.andonHistory?.length || 1}건)</span>
                </span>
                {activeTask.andonStatus === 'ISSUE_HOLD' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white">
                    현재 긴급 정지 중
                  </span>
                )}
              </div>
              <div className="space-y-1.5 text-xs">
                {(activeTask.andonHistory && activeTask.andonHistory.length > 0
                  ? activeTask.andonHistory
                  : [{
                      issueType: activeTask.andonIssueType || '현장 이상 발생',
                      note: activeTask.andonIssueNote || '상세 사유 없음',
                      reportedAt: activeTask.andonReportedAt || '',
                      reportedBy: activeTask.andonReportedBy || '작업자',
                      isResolved: false
                    }]
                ).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/40 space-y-1 text-[11px]"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-red-700 dark:text-red-400">
                        🚨 {item.issueType}
                      </span>
                      {item.isResolved ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                          <CheckCheck className="w-3 h-3" /> 조치 완료
                        </span>
                      ) : (
                        <span className="text-red-600 font-extrabold animate-pulse">조치 대기 중</span>
                      )}
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">"{item.note}"</p>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
                      <span>신고: {item.reportedBy || '작업자'} ({item.reportedAt ? formatDateTime(item.reportedAt) : '-'})</span>
                      {item.isResolved && item.resolvedBy && (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                          조치자: {item.resolvedBy}
                        </span>
                      )}
                    </div>
                    {item.isResolved && item.resolvedNote && (
                      <p className="text-[10px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded font-medium">
                        조치내용: {item.resolvedNote}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delay Reason Input */}
          {(varianceMins > 0 || activeTask.status === 'DELAYED') && (
            <div>
              <label className="block text-xs font-extrabold text-rose-700 dark:text-rose-400 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>지연 사유 기록</span>
              </label>
              <input
                type="text"
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                placeholder="예: 공구 마모로 인한 지그 재세팅, 소재 불량 교체 등"
                className="w-full px-3 py-1.5 text-xs border border-rose-300 dark:border-rose-800 rounded-lg bg-rose-50/30 dark:bg-rose-950/20 text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Work Memo */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              작업자 메모 & 인수인계 사항
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="특이사항, 치수 측정값, 다음 공정 전달사항..."
              className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              id="btn-save-assignments"
              onClick={handleSaveAssignments}
              className="px-3 py-2 text-xs font-bold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition flex items-center gap-1 cursor-pointer"
            >
              {saveSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saveSuccess ? '저장됨' : '설비/작업자 저장'}</span>
            </button>

            {(activeTask.status === 'IN_PROGRESS' ||
              activeTask.status === 'COMPLETED' ||
              activeTask.status === 'PAUSED') && (
              <button
                id="btn-reset-task"
                onClick={handleResetOrCancel}
                className="px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>대기로 초기화</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Action Buttons depending on status */}
            {activeTask.status === 'READY' ||
            activeTask.status === 'PLANNED' ||
            activeTask.status === 'DELAYED' ? (
              <>
                <button
                  id="btn-start-task"
                  onClick={handleStartTask}
                  className="px-5 py-2.5 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>[ 작업 시작 ]</span>
                </button>
                <button
                  id="btn-close-modal-secondary"
                  onClick={onClose}
                  className="px-3.5 py-2.5 text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
                >
                  닫기
                </button>
              </>
            ) : activeTask.status === 'IN_PROGRESS' ? (
              <>
                <button
                  id="btn-pause-task"
                  onClick={handlePauseTask}
                  className="px-4 py-2 text-xs font-black bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Pause className="w-4 h-4" />
                  <span>[ 일시정지 ]</span>
                </button>
                <button
                  id="btn-complete-task"
                  onClick={handleCompleteTask}
                  className="px-5 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>[ 작업 완료 ]</span>
                </button>
                <button
                  id="btn-close-modal-running"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
                >
                  닫기
                </button>
              </>
            ) : activeTask.status === 'PAUSED' ? (
              <>
                <button
                  id="btn-resume-task"
                  onClick={handleResumeTask}
                  className="px-5 py-2 text-xs font-black bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>[ 작업 재개 ]</span>
                </button>
                <button
                  id="btn-complete-task-paused"
                  onClick={handleCompleteTask}
                  className="px-4 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>[ 작업 완료 ]</span>
                </button>
                <button
                  id="btn-close-modal-paused"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
                >
                  닫기
                </button>
              </>
            ) : (
              <button
                id="btn-close-modal-completed"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
              >
                닫기
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pause Reason Prompt Modal */}
      {isPausePromptOpen && (
        <div
          id="pause-reason-modal"
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-60 flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-orange-600">
              <Pause className="w-5 h-5" />
              <h4 className="text-sm font-black text-slate-900 dark:text-white">일시정지 사유 선택</h4>
            </div>
            <p className="text-xs text-slate-500">
              일시정지 중에는 실제 작업시간 카운트가 중지됩니다.
            </p>

            <div className="space-y-1.5">
              {PAUSE_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedPauseReason(r)}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg border font-bold transition flex items-center justify-between cursor-pointer ${
                    selectedPauseReason === r
                      ? 'bg-orange-50 border-orange-400 text-orange-900 dark:bg-orange-950/40 dark:border-orange-600 dark:text-orange-200'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{r}</span>
                  {selectedPauseReason === r && <Check className="w-4 h-4 text-orange-600" />}
                </button>
              ))}
            </div>

            {selectedPauseReason === '기타' && (
              <input
                type="text"
                value={customPauseReason}
                onChange={(e) => setCustomPauseReason(e.target.value)}
                placeholder="상세 사유를 입력하세요"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPausePromptOpen(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmPause}
                className="px-4 py-1.5 text-xs font-black bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
              >
                일시정지 적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
