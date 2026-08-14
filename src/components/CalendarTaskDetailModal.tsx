import React, { useState, useEffect } from 'react';
import { ScheduledTaskItem, ProcessProgressItem, PauseReason, User, PauseLog } from '../types';
import { ALL_EQUIPMENT_LIST } from '../data/defaultData';
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
  Check
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
    }
  }, [task, isOpen]);

  // Live timer for currently IN_PROGRESS task
  useEffect(() => {
    if (!task) return;
    if (task.status === 'IN_PROGRESS' && task.actualStart) {
      const calcElapsed = () => {
        const start = new Date(task.actualStart!).getTime();
        const now = Date.now();
        const totalRaw = Math.max(0, Math.floor((now - start) / 60000));
        
        // Subtract completed pause durations
        const pauseTotal = (task.pauseHistory || []).reduce((acc, p) => acc + (p.durationMinutes || 0), 0);
        setElapsedMinutes(Math.max(0, totalRaw - pauseTotal));
      };

      calcElapsed();
      const interval = setInterval(calcElapsed, 10000);
      return () => clearInterval(interval);
    } else if (task.actualMinutes !== null && task.actualMinutes !== undefined) {
      setElapsedMinutes(task.actualMinutes);
    }
  }, [task]);

  if (!isOpen || !task) return null;

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
    switch (task.status) {
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            진행중 ({elapsedMinutes}분)
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-900 border border-orange-300">
            <Pause className="w-3.5 h-3.5" />
            일시정지: {task.pauseReason || '작업 대기'}
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            완료 ({task.actualMinutes || task.plannedMinutes}분)
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            지연 예상
          </span>
        );
      case 'PLANNED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300">
            <Clock className="w-3.5 h-3.5" />
            계획됨
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            대기/예정
          </span>
        );
    }
  };

  // Actions
  const handleStartTask = () => {
    const nowIso = new Date().toISOString();
    const workerName = selectedWorker || currentUser?.name || '현장담당자';
    onUpdateProgress(task.processKey, {
      status: 'IN_PROGRESS',
      actualStart: nowIso,
      worker: workerName,
      machine: selectedMachine || task.machine,
      isCompleted: false,
      completedAt: null,
      memo,
      delayReason
    });
  };

  const handlePauseTask = () => {
    setIsPausePromptOpen(true);
  };

  const confirmPause = () => {
    const nowIso = new Date().toISOString();
    const reasonText = selectedPauseReason === '기타' ? customPauseReason || '기타 사유' : selectedPauseReason;
    const currentHistory: PauseLog[] = [...(task.pauseHistory || [])];
    currentHistory.push({
      pausedAt: nowIso,
      reason: reasonText
    });

    onUpdateProgress(task.processKey, {
      status: 'PAUSED',
      pauseReason: reasonText,
      pauseHistory: currentHistory,
      worker: selectedWorker || task.worker,
      machine: selectedMachine || task.machine,
      memo,
      delayReason
    });
    setIsPausePromptOpen(false);
  };

  const handleResumeTask = () => {
    const now = new Date();
    const nowIso = now.toISOString();
    const currentHistory: PauseLog[] = [...(task.pauseHistory || [])];
    
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

    onUpdateProgress(task.processKey, {
      status: 'IN_PROGRESS',
      pauseHistory: currentHistory,
      pauseReason: '',
      worker: selectedWorker || task.worker,
      machine: selectedMachine || task.machine,
      memo,
      delayReason
    });
  };

  const handleCompleteTask = () => {
    const now = new Date();
    const nowIso = now.toISOString();
    const start = task.actualStart ? new Date(task.actualStart).getTime() : task.plannedStart.getTime();
    const rawMinutes = Math.max(1, Math.round((now.getTime() - start) / 60000));
    
    // Deduct pause times
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
      delayReason: diff > 0 ? delayReason || '공정 난이도 및 치수보정' : '',
      worker: selectedWorker || currentUser?.name || task.worker,
      machine: selectedMachine || task.machine,
      memo
    });
  };

  const handleResetOrCancel = () => {
    if (window.confirm('이 공정의 실적을 초기화하고 대기 상태로 되돌리시겠습니까?')) {
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
        memo
      });
    }
  };

  const handleSaveAssignments = () => {
    onUpdateProgress(task.processKey, {
      worker: selectedWorker,
      machine: selectedMachine,
      memo,
      delayReason
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Variance calculation
  const plannedMins = task.plannedMinutes;
  const currentActualMins = task.actualMinutes !== null && task.actualMinutes !== undefined ? task.actualMinutes : elapsedMinutes;
  const varianceMins = currentActualMins > 0 ? currentActualMins - plannedMins : 0;
  const totalPauseTime = (task.pauseHistory || []).reduce((acc, p) => acc + (p.durationMinutes || 0), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-black text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                  {task.orderId} #{task.productNo}호기
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  공정 #{task.processIndex + 1}/{task.totalProcessesInOrder}
                </span>
                {getStatusBadge()}
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                {task.groupName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Order Info */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="text-slate-500">수주 프로젝트:</span>
              <strong className="text-slate-800 dark:text-slate-200">{task.orderName}</strong>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500">카테고리:</span>
              <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                {task.category}
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
              <span className="text-[11px] text-slate-500">※ 계획 데이터는 보존되며 실적과 분리 관리됩니다.</span>
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
                    {plannedMins}분 ({task.duration}시간)
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">계획 시작:</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200">
                      {formatDateTime(task.plannedStart)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">계획 종료:</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200">
                      {formatDateTime(task.plannedEnd)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">계획 소요시간:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{plannedMins}분</strong>
                  </div>
                </div>
              </div>

              {/* Actual Box */}
              <div className="p-4 space-y-2.5 bg-emerald-50/20 dark:bg-emerald-950/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    실제 실적 (Production Actual)
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                    {task.status === 'IN_PROGRESS'
                      ? `진행중 (${elapsedMinutes}분)`
                      : task.actualMinutes !== null
                      ? `${task.actualMinutes}분`
                      : '미착수'}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">실제 시작:</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200">
                      {formatDateTime(task.actualStart)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">실제 종료:</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200">
                      {formatDateTime(task.actualEnd)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">실제 작업시간:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {currentActualMins > 0 ? `${currentActualMins}분` : '-'}
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
                      +{varianceMins}분 지연 발생 ({Math.round((varianceMins / plannedMins) * 100)}% 초과)
                    </span>
                  ) : varianceMins < 0 ? (
                    <span className="inline-flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <TrendingDown className="w-3.5 h-3.5" />
                      {Math.abs(varianceMins)}분 단축 완료 ({Math.round((Math.abs(varianceMins) / plannedMins) * 100)}% 효율 달성)
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
              <select
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="">(설비 미지정)</option>
                {ALL_EQUIPMENT_LIST.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span>공정 담당 작업자</span>
              </label>
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">(작업자 미지정)</option>
                {approvedOperators.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
                {selectedWorker && !approvedOperators.includes(selectedWorker) && (
                  <option value={selectedWorker}>{selectedWorker}</option>
                )}
              </select>
            </div>
          </div>

          {/* Pause History List */}
          {task.pauseHistory && task.pauseHistory.length > 0 && (
            <div className="border border-orange-200 dark:border-orange-900/60 rounded-xl p-3 bg-orange-50/40 dark:bg-orange-950/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-orange-900 dark:text-orange-300">
                <span className="flex items-center gap-1">
                  <History className="w-3.5 h-3.5" />
                  일시정지 이력 ({task.pauseHistory.length}회, 총 {totalPauseTime}분)
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                {task.pauseHistory.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white dark:bg-slate-800 p-1.5 rounded border border-orange-100 dark:border-orange-900 text-slate-700 dark:text-slate-300"
                  >
                    <span className="font-bold text-orange-800 dark:text-orange-400">
                      #{idx + 1} {p.reason}
                    </span>
                    <span className="font-mono text-slate-500">
                      {formatDateTime(p.pausedAt)} ~ {p.resumedAt ? formatDateTime(p.resumedAt) : '진행중'} ({p.durationMinutes || '?'}분)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delay Reason Input */}
          {(varianceMins > 0 || task.status === 'DELAYED') && (
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
              onClick={handleSaveAssignments}
              className="px-3 py-2 text-xs font-bold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition flex items-center gap-1 cursor-pointer"
            >
              {saveSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saveSuccess ? '저장됨' : '설비/작업자 저장'}</span>
            </button>

            {(task.status === 'IN_PROGRESS' || task.status === 'COMPLETED' || task.status === 'PAUSED') && (
              <button
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
            {task.status === 'READY' || task.status === 'PLANNED' || task.status === 'DELAYED' ? (
              <button
                onClick={handleStartTask}
                className="px-5 py-2 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>[ 작업 시작 ]</span>
              </button>
            ) : task.status === 'IN_PROGRESS' ? (
              <>
                <button
                  onClick={handlePauseTask}
                  className="px-4 py-2 text-xs font-black bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Pause className="w-4 h-4" />
                  <span>[ 일시정지 ]</span>
                </button>
                <button
                  onClick={handleCompleteTask}
                  className="px-5 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>[ 작업 완료 ]</span>
                </button>
              </>
            ) : task.status === 'PAUSED' ? (
              <>
                <button
                  onClick={handleResumeTask}
                  className="px-5 py-2 text-xs font-black bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>[ 작업 재개 ]</span>
                </button>
                <button
                  onClick={handleCompleteTask}
                  className="px-4 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>[ 작업 완료 ]</span>
                </button>
              </>
            ) : (
              <button
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
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-60 flex items-center justify-center p-4">
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
