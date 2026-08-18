import React, { useState, useEffect } from 'react';
import {
  ScheduledTaskItem,
  ProcessProgressMap,
  ProcessProgressItem,
  User,
  PauseReason,
  PauseLog
} from '../types';
import { ALL_EQUIPMENT_LIST } from '../data/defaultData';
import { CalendarTaskDetailModal } from './CalendarTaskDetailModal';
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
  TrendingDown
} from 'lucide-react';

interface FloorExecutionViewProps {
  items?: ScheduledTaskItem[];
  scheduledTasks?: ScheduledTaskItem[];
  orders?: Record<string, any>;
  productTypes?: Record<string, any>;
  processProgressMap: ProcessProgressMap;
  currentUser?: User | null;
  approvedOperators?: string[];
  onToggleComplete?: (taskKey: string, worker?: string, machine?: string) => void;
  onUpdateAssignee?: (taskKey: string, worker: string, machine: string) => void;
  onUpdateProgress: (processKey: string, progress: ProcessProgressItem) => void;
}

const PAUSE_REASONS: PauseReason[] = [
  '설비 고장',
  '자재 부족',
  '품질 문제',
  '작업자 부재',
  '도면 문제',
  '기타'
];

export const FloorExecutionView: React.FC<FloorExecutionViewProps> = ({
  items,
  scheduledTasks,
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

  const [selectedTaskForModal, setSelectedTaskForModal] = useState<ScheduledTaskItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentTaskForModal = React.useMemo(() => {
    if (!selectedTaskForModal) return null;
    return taskList.find((t) => t.processKey === selectedTaskForModal.processKey) || selectedTaskForModal;
  }, [taskList, selectedTaskForModal]);

  // Pause Prompt State
  const [pausePromptTask, setPausePromptTask] = useState<ScheduledTaskItem | null>(null);
  const [selectedPauseReason, setSelectedPauseReason] = useState<PauseReason>('설비 고장');
  const [customPauseReason, setCustomPauseReason] = useState('');

  // Live Timer tick
  const [, setTick] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const isAdmin =
    currentUser?.role === 'ADMIN' ||
    currentUser?.name?.includes('관리자') ||
    currentUser?.name?.includes('대표');

  // Filter tasks
  const filteredTasks = taskList.filter((task) => {
    const matchesSearch =
      task.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.orderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.worker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.machine.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' || task.category === selectedCategory;

    const matchesStatus =
      selectedStatus === 'ALL' || task.status === selectedStatus;

    const matchesWorker =
      selectedWorkerFilter === 'ALL' || task.worker === selectedWorkerFilter;

    const matchesMachine =
      selectedMachineFilter === 'ALL' || task.machine === selectedMachineFilter;

    const matchesMyTask =
      !showOnlyMyTasks ||
      (currentUser?.name && task.worker?.trim() === currentUser.name.trim());

    return matchesSearch && matchesCategory && matchesStatus && matchesWorker && matchesMachine && matchesMyTask;
  });

  const completedCount = items.filter((i) => i.isCompleted).length;
  const inProgressCount = items.filter((i) => i.status === 'IN_PROGRESS').length;
  const pausedCount = items.filter((i) => i.status === 'PAUSED').length;
  const readyCount = items.filter((i) => i.status === 'READY' || i.status === 'PLANNED').length;

  // Actions
  const handleStart = (task: ScheduledTaskItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const nowIso = new Date().toISOString();
    const workerName = task.worker || currentUser?.name || '현장작업자';
    onUpdateProgress(task.processKey, {
      status: 'IN_PROGRESS',
      actualStart: nowIso,
      worker: workerName,
      machine: task.machine,
      isCompleted: false,
      completedAt: null,
    });
  };

  const handleOpenPause = (task: ScheduledTaskItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setPausePromptTask(task);
    setSelectedPauseReason('설비 고장');
    setCustomPauseReason('');
  };

  const confirmPause = () => {
    if (!pausePromptTask) return;
    const nowIso = new Date().toISOString();
    const reasonText =
      selectedPauseReason === '기타' ? customPauseReason || '기타 사유' : selectedPauseReason;
    const currentHistory: PauseLog[] = [...(pausePromptTask.pauseHistory || [])];
    currentHistory.push({
      pausedAt: nowIso,
      reason: reasonText,
    });

    onUpdateProgress(pausePromptTask.processKey, {
      status: 'PAUSED',
      pauseReason: reasonText,
      pauseHistory: currentHistory,
      worker: pausePromptTask.worker || currentUser?.name,
      machine: pausePromptTask.machine,
    });
    setPausePromptTask(null);
  };

  const handleResume = (task: ScheduledTaskItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date();
    const nowIso = now.toISOString();
    const currentHistory: PauseLog[] = [...(task.pauseHistory || [])];

    if (currentHistory.length > 0) {
      const last = currentHistory[currentHistory.length - 1];
      if (!last.resumedAt) {
        last.resumedAt = nowIso;
        const pStart = new Date(last.pausedAt).getTime();
        last.durationMinutes = Math.max(1, Math.round((now.getTime() - pStart) / 60000));
      }
    }

    onUpdateProgress(task.processKey, {
      status: 'IN_PROGRESS',
      pauseHistory: currentHistory,
      pauseReason: '',
      worker: task.worker || currentUser?.name,
      machine: task.machine,
    });
  };

  const handleComplete = (task: ScheduledTaskItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date();
    const nowIso = now.toISOString();
    const start = task.actualStart ? new Date(task.actualStart).getTime() : task.plannedStart.getTime();
    const rawMinutes = Math.max(1, Math.round((now.getTime() - start) / 60000));

    const currentHistory: PauseLog[] = [...(task.pauseHistory || [])];
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
    const plannedMins = task.plannedMinutes;
    const diff = finalActualMins - plannedMins;

    onUpdateProgress(task.processKey, {
      status: 'COMPLETED',
      isCompleted: true,
      completedAt: nowIso,
      actualEnd: nowIso,
      actualMinutes: finalActualMins,
      pauseHistory: currentHistory,
      delayMinutes: diff > 0 ? diff : 0,
      worker: task.worker || currentUser?.name,
      machine: task.machine,
    });
  };

  // Helper to calculate live elapsed minutes
  const getElapsedMins = (task: ScheduledTaskItem) => {
    if (task.status === 'IN_PROGRESS' && task.actualStart) {
      const start = new Date(task.actualStart).getTime();
      const now = Date.now();
      const raw = Math.max(0, Math.floor((now - start) / 60000));
      const pauseTotal = (task.pauseHistory || []).reduce((acc, p) => acc + (p.durationMinutes || 0), 0);
      return Math.max(0, raw - pauseTotal);
    }
    return task.actualMinutes || 0;
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-900 overflow-y-auto p-3 sm:p-5 space-y-4">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-600 text-white shadow-sm shrink-0">
            <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white">
              현장 모바일 MES 공정 실행 터미널
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              작업자 [작업 시작] → [일시정지/재개] → [작업 완료] 원클릭 실시간 실적 연동
            </p>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[11px] sm:text-xs font-black">
          <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            진행중 {inProgressCount}건
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-900 dark:text-orange-300 border border-orange-300 flex items-center gap-1">
            <Pause className="w-3 h-3" />
            일시정지 {pausedCount}건
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            완료 {completedCount}건
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300">
            대기 {readyCount}건
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="수주명, 공정명, 설비, 작업자 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowOnlyMyTasks(!showOnlyMyTasks)}
              className={`px-3 py-2 text-xs font-black rounded-xl border transition flex items-center gap-1 cursor-pointer ${
                showOnlyMyTasks
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>내 배정 공정만</span>
            </button>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 font-bold"
            >
              <option value="ALL">전체 상태</option>
              <option value="IN_PROGRESS">진행중 (IN_PROGRESS)</option>
              <option value="PAUSED">일시정지 (PAUSED)</option>
              <option value="READY">대기/예정 (READY)</option>
              <option value="COMPLETED">완료 (COMPLETED)</option>
              <option value="DELAYED">지연 (DELAYED)</option>
            </select>

            <select
              value={selectedMachineFilter}
              onChange={(e) => setSelectedMachineFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900"
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
              className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900"
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

      {/* Unit-by-Unit Process Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            조건에 일치하는 현장 작업 공정이 없습니다.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const elapsed = getElapsedMins(task);
            const plannedMins = task.plannedMinutes;
            const variance = elapsed > 0 ? elapsed - plannedMins : 0;

            return (
              <div
                key={task.processKey}
                onClick={() => {
                  setSelectedTaskForModal(task);
                  setIsModalOpen(true);
                }}
                className={`bg-white dark:bg-slate-800 rounded-2xl border p-4 shadow-xs transition hover:shadow-md cursor-pointer flex flex-col justify-between space-y-3 ${
                  task.status === 'IN_PROGRESS'
                    ? 'border-amber-400 dark:border-amber-500/60 ring-2 ring-amber-400/20 bg-amber-50/10'
                    : task.status === 'PAUSED'
                    ? 'border-orange-400 dark:border-orange-500/60 bg-orange-50/10'
                    : task.status === 'COMPLETED'
                    ? 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/10'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {/* Header Info */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-black text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      {task.orderId} #{task.productNo}호기
                    </span>
                    <span
                      className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                        task.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                          : task.status === 'PAUSED'
                          ? 'bg-orange-100 text-orange-900 border border-orange-300'
                          : task.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {task.status === 'IN_PROGRESS'
                        ? `진행중 (${elapsed}분)`
                        : task.status === 'PAUSED'
                        ? `일시정지 (${task.pauseReason || '대기'})`
                        : task.status === 'COMPLETED'
                        ? `완료 (${task.actualMinutes || plannedMins}분)`
                        : '대기'}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {task.processIndex + 1}. {task.groupName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {task.orderName} · {task.category}
                  </p>
                </div>

                {/* Plan vs Actual Metric bar */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1 font-mono">
                  <div className="flex justify-between text-slate-500">
                    <span>표준 계획시간:</span>
                    <strong className="text-blue-600 dark:text-blue-400">{plannedMins}분 ({task.duration}h)</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>실제 작업시간:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {task.status === 'IN_PROGRESS' ? `${elapsed}분 진행중` : task.actualMinutes ? `${task.actualMinutes}분` : '-'}
                    </strong>
                  </div>
                  {task.status === 'IN_PROGRESS' && variance > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>계획대비 초과:</span>
                      <span>+{variance}분 지연</span>
                    </div>
                  )}
                </div>

                {/* Machine & Worker Tag */}
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-bold truncate max-w-[140px]">
                    설비: {task.machine || '미지정'}
                  </span>
                  <span className="font-bold truncate max-w-[120px]">
                    작업자: {task.worker || '미지정'}
                  </span>
                </div>

                {/* Large Action Buttons for Operators */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {task.status === 'READY' || task.status === 'PLANNED' || task.status === 'DELAYED' ? (
                    <button
                      onClick={(e) => handleStart(task, e)}
                      className="w-full py-2.5 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>[ 작업 시작 ]</span>
                    </button>
                  ) : task.status === 'IN_PROGRESS' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => handleOpenPause(task, e)}
                        className="py-2.5 text-xs font-black bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-xs transition flex items-center justify-center gap-1 active:scale-98 cursor-pointer"
                      >
                        <Pause className="w-4 h-4" />
                        <span>[ 일시정지 ]</span>
                      </button>
                      <button
                        onClick={(e) => handleComplete(task, e)}
                        className="py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition flex items-center justify-center gap-1 active:scale-98 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>[ 작업 완료 ]</span>
                      </button>
                    </div>
                  ) : task.status === 'PAUSED' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => handleResume(task, e)}
                        className="py-2.5 text-xs font-black bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs transition flex items-center justify-center gap-1 active:scale-98 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>[ 작업 재개 ]</span>
                      </button>
                      <button
                        onClick={(e) => handleComplete(task, e)}
                        className="py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition flex items-center justify-center gap-1 active:scale-98 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>[ 작업 완료 ]</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs py-1 text-emerald-700 dark:text-emerald-400 font-black">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        공정 완료됨 ({task.actualMinutes || plannedMins}분 소요)
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">상세보기 &gt;</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pause Reason Modal */}
      {pausePromptTask && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-orange-600">
              <Pause className="w-5 h-5" />
              <h4 className="text-sm font-black text-slate-900 dark:text-white">일시정지 사유 선택</h4>
            </div>
            <p className="text-xs text-slate-500">
              {pausePromptTask.orderName} #{pausePromptTask.productNo}호기 - {pausePromptTask.groupName}
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
                onClick={() => setPausePromptTask(null)}
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

      {/* Modal */}
      {isModalOpen && currentTaskForModal && (
        <CalendarTaskDetailModal
          task={currentTaskForModal}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTaskForModal(null);
          }}
          onUpdateProgress={onUpdateProgress}
          currentUser={currentUser}
          approvedOperators={approvedOperators}
        />
      )}
    </div>
  );
};
