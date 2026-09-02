import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  QrCode,
  Flame,
  Clock,
  Timer,
  Cpu,
  User as UserIcon,
  Tag,
  Hash,
  Sparkles,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Layers,
  FileText,
  Activity,
  History
} from 'lucide-react';
import { ScheduledTaskItem, ProcessProgressItem, Order, PauseLog } from '../types';
import { getIndividualSerialNo } from '../utils/serialHelper';

interface FloorProcessCardProps {
  task: ScheduledTaskItem;
  order?: Order;
  progressItem?: ProcessProgressItem;
  canExecuteMES: boolean;
  onStartProcess: (processKey: string) => void;
  onPauseProcess?: (task: ScheduledTaskItem) => void;
  onResumeProcess?: (processKey: string) => void;
  onCompleteProcess: (processKey: string) => void;
  onResetProcess: (processKey: string) => void;
  onOpenTraveler: (task: ScheduledTaskItem) => void;
  onOpenAndon: (task: ScheduledTaskItem) => void;
  onUpdateDefectQty?: (processKey: string, defectQty: number) => void;
  isFocused?: boolean;
}

export const FloorProcessCard: React.FC<FloorProcessCardProps> = ({
  task,
  order,
  progressItem,
  canExecuteMES,
  onStartProcess,
  onPauseProcess,
  onResumeProcess,
  onCompleteProcess,
  onResetProcess,
  onOpenTraveler,
  onOpenAndon,
  onUpdateDefectQty,
  isFocused = false,
}) => {
  const isCompleted = task.status === 'COMPLETED' || progressItem?.status === 'COMPLETED' || Boolean(progressItem?.isCompleted);
  const isPaused = (task.status === 'PAUSED' || progressItem?.status === 'PAUSED') && !isCompleted;
  const isInProgress = (task.status === 'IN_PROGRESS' || progressItem?.status === 'IN_PROGRESS') && !isCompleted && !isPaused;
  const isPending = !isCompleted && !isInProgress && !isPaused;
  
  const isAndonHold = progressItem?.andonStatus === 'ISSUE_HOLD' || task.andonStatus === 'ISSUE_HOLD';
  const andonIssueType = progressItem?.andonIssueType || task.andonIssueType;
  const andonIssueNote = progressItem?.andonIssueNote || task.andonIssueNote;
  const andonReportedBy = progressItem?.andonReportedBy || task.andonReportedBy;
  const andonReportedAt = progressItem?.andonReportedAt || task.andonReportedAt;
  const defectQty = progressItem?.defectQty ?? task.defectQty ?? 0;

  const pauseHistory: PauseLog[] = progressItem?.pauseHistory || task.pauseHistory || [];
  const pauseReason = progressItem?.pauseReason || task.pauseReason || '';

  // Real-time ticking stopwatch for IN_PROGRESS tasks
  const [nowTime, setNowTime] = useState<number>(Date.now());
  useEffect(() => {
    if (!isInProgress) return;
    const interval = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isInProgress]);

  // Derive start time & durations
  const startIso = progressItem?.actualStart || task.actualStart;
  const startTs = startIso ? new Date(startIso).getTime() : null;
  const plannedMinutes = task.plannedMinutes || (task.duration ? Math.round(task.duration * 60) : 60);

  // Calculate total completed paused duration in milliseconds
  const completedPauseMs = pauseHistory.reduce((acc, log) => {
    if (log.pausedAt && log.resumedAt) {
      const pStart = new Date(log.pausedAt).getTime();
      const pEnd = new Date(log.resumedAt).getTime();
      if (pEnd > pStart) {
        return acc + (pEnd - pStart);
      }
    }
    return acc;
  }, 0);

  let actualMinutes = 0;
  let elapsedSeconds = 0;

  if (isCompleted) {
    actualMinutes = progressItem?.actualMinutes ?? task.actualMinutes ?? plannedMinutes;
  } else if (startTs) {
    if (isPaused) {
      // When currently paused: calculate pure working time up to the moment it was paused
      const activePauseLog = pauseHistory.find((p) => !p.resumedAt);
      const pauseStartTs = activePauseLog?.pausedAt ? new Date(activePauseLog.pausedAt).getTime() : nowTime;
      const grossUpToPause = Math.max(0, pauseStartTs - startTs);
      const prevPausedMs = pauseHistory.reduce((acc, log) => {
        if (log.pausedAt && log.resumedAt) {
          const pStart = new Date(log.pausedAt).getTime();
          const pEnd = new Date(log.resumedAt).getTime();
          return acc + Math.max(0, pEnd - pStart);
        }
        return acc;
      }, 0);
      const netDiffMs = Math.max(0, grossUpToPause - prevPausedMs);
      actualMinutes = Math.floor(netDiffMs / 60000);
      elapsedSeconds = Math.floor((netDiffMs % 60000) / 1000);
    } else if (isInProgress) {
      // In progress: subtract completed paused intervals from total time
      const grossDiffMs = Math.max(0, nowTime - startTs);
      const netDiffMs = Math.max(0, grossDiffMs - completedPauseMs);
      actualMinutes = Math.floor(netDiffMs / 60000);
      elapsedSeconds = Math.floor((netDiffMs % 60000) / 1000);
    }
  }

  // Plan vs Actual comparison (Pure active working time)
  const isOvertime = actualMinutes > plannedMinutes;
  const varianceMinutes = actualMinutes - plannedMinutes;
  const variancePercent = plannedMinutes > 0 ? Math.round((actualMinutes / plannedMinutes) * 100) : 100;

  // Derive model & part identification
  const effectiveOrderId = task.orderId || order?.id || 'ORD-UNKNOWN';

  // Smart resolution for pjtNo & pjtName (handling compound strings like "PJT-NO / PJT-NAME")
  let derivedPjtNo = order?.pjtNo || order?.poNumber;
  let derivedPjtName = order?.pjtName;

  if (!derivedPjtNo && order?.name?.includes('/')) {
    derivedPjtNo = order.name.split('/')[0]?.trim();
  }
  if (!derivedPjtName && order?.name?.includes('/')) {
    derivedPjtName = order.name.split('/').slice(1).join('/')?.trim();
  }

  const effectivePjtNo = derivedPjtNo || order?.poNumber || effectiveOrderId;
  const effectivePjtName = derivedPjtName || order?.name || task.orderName || (order?.customer ? `${order?.customer} 프로젝트` : '프로젝트명 미지정');
  const effectivePartType =
    order?.partType || (order?.name?.includes('상판') ? 'UPPER (상판)' : order?.name?.includes('하판') ? 'LOWER (하판)' : 'SLOT DIE 부품');
  const effectiveSpec = order?.spec || '650L';
  const effectiveQty = order?.qty || 1;
  const effectiveStepIndex = typeof task.processIndex === 'number' ? task.processIndex + 1 : 1;

  return (
    <div
      id={`card-${task.processKey}`}
      className={`rounded-2xl border transition-all duration-300 shadow-md flex flex-col justify-between overflow-hidden relative ${
        isFocused ? 'ring-4 ring-blue-500 ring-offset-2' : ''
      } ${
        isAndonHold
          ? 'bg-rose-50/90 border-red-500 ring-2 ring-red-500/40 shadow-red-200'
          : isPaused
          ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/40 shadow-amber-200'
          : isCompleted
          ? 'bg-slate-50 border-slate-200 opacity-95'
          : isInProgress
          ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/30 shadow-blue-200'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. PROJECT IDENTIFICATION HEADER                                          */}
      {/* ========================================================================= */}
      <div
        className={`w-full p-3.5 sm:p-4 text-white relative transition-colors ${
          isAndonHold
            ? 'bg-gradient-to-r from-red-800 via-rose-900 to-red-950 border-b-2 border-red-400'
            : isPaused
            ? 'bg-gradient-to-r from-amber-900 via-orange-900 to-slate-900 border-b-2 border-amber-400'
            : isCompleted
            ? 'bg-gradient-to-r from-slate-800 via-emerald-950 to-slate-900 border-b-2 border-emerald-500'
            : isInProgress
            ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border-b-2 border-blue-400'
            : 'bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border-b-2 border-slate-700'
        }`}
      >
        {/* Banner Top Row: Step Badge + Category Badge + Realtime Status */}
        <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* 1. STEP BADGE: High-contrast solid dark badge */}
            <span className="text-[11px] sm:text-xs font-black bg-slate-900 text-white border border-slate-600 px-2.5 py-0.5 rounded-lg shadow-xs tracking-wider whitespace-nowrap">
              STEP {String(effectiveStepIndex).padStart(2, '0')}
            </span>

            {/* 2. CATEGORY BADGE: Distinct vibrant tag with high contrast white text */}
            <span
              className={`text-[11px] sm:text-xs font-black px-2.5 py-0.5 rounded-lg border shadow-xs whitespace-nowrap ${
                task.category === '가공'
                  ? 'bg-blue-600 text-white border-blue-400'
                  : task.category === '연마'
                  ? 'bg-purple-600 text-white border-purple-400'
                  : task.category === '품질'
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-amber-500 text-slate-950 border-amber-300'
              }`}
            >
              {task.category}
            </span>
          </div>

          {/* 3. STATUS BADGE: High-contrast state indicator with clear icon and text */}
          <div>
            {isAndonHold ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-black bg-red-600 text-white border border-red-300 px-3 py-1 rounded-full animate-pulse shadow-md whitespace-nowrap">
                <Flame className="w-3.5 h-3.5 fill-white text-white" />
                <span>이상 발생 (긴급 정지)</span>
              </span>
            ) : isPaused ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-black bg-amber-400 text-slate-950 border border-amber-200 px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                <Pause className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>일시정지 ({pauseReason || '작업 대기'})</span>
              </span>
            ) : isCompleted ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-black bg-emerald-600 text-white border border-emerald-300 px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>공정 완료</span>
              </span>
            ) : isInProgress ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-black bg-blue-600 text-white border border-blue-300 px-3 py-1 rounded-full shadow-md animate-pulse whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>가공 진행 중</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-black bg-slate-800 text-slate-100 border border-slate-600 px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                <Clock className="w-3.5 h-3.5 text-slate-300" />
                <span>작업 대기</span>
              </span>
            )}
          </div>
        </div>

        {/* Banner Middle Rows: 프로젝트번호 & 프로젝트명 */}
        <div className="space-y-1 mb-2.5">
          <div className="flex items-center gap-1.5 leading-snug min-w-0">
            <span className="text-xs sm:text-sm font-bold text-slate-300 shrink-0 whitespace-nowrap">프로젝트번호:</span>
            <span className="text-base sm:text-lg font-black text-white tracking-tight truncate">{effectivePjtNo}</span>
          </div>
          <div className="flex items-center gap-1.5 leading-snug min-w-0">
            <span className="text-xs sm:text-sm font-bold text-slate-300 shrink-0 whitespace-nowrap">프로젝트명:</span>
            <span className="text-base sm:text-lg font-black text-white tracking-tight truncate">{effectivePjtName}</span>
          </div>
        </div>

        {/* Banner Bottom Row: Product Type Badge, Spec, Qty, Serial No */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs sm:text-sm font-bold text-slate-200 pt-0.5">
          <span className="bg-white/15 px-2.5 py-0.5 rounded-lg text-amber-300 border border-amber-300/40 font-black shrink-0 whitespace-nowrap">
            {effectivePartType}
          </span>
          <span className="text-slate-400">•</span>
          <span className="shrink-0 text-slate-200 whitespace-nowrap">
            규격: <strong className="text-white font-mono font-black">{effectiveSpec}</strong>
          </span>
          <span className="text-slate-400">•</span>
          <span className="shrink-0 text-slate-200 whitespace-nowrap">
            수량: <strong className="text-white font-mono font-black">{effectiveQty} EA</strong>
          </span>
          {(order?.serialNo || order?.pjtNo) && (
            <>
              <span className="text-slate-400">•</span>
              <span className="text-slate-200 break-all whitespace-nowrap">
                각인번호: <strong className="text-amber-200 font-mono font-black tracking-wide">
                  {getIndividualSerialNo(order?.serialNo || order?.pjtNo || '', task.productNo || 1, effectiveQty, order?.pjtNo || order?.poNumber)}
                </strong>
              </span>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PROCESS DETAILS & TOUCH OPTIMIZED 4-BLOCK GRID                          */}
      {/* ========================================================================= */}
      <div className="p-4 space-y-3.5">
        {/* Process Step Name */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 block mb-0.5">현재 공정명</span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug tracking-tight truncate">
              {task.content || task.title}
            </h3>
          </div>
          {order?.customer && (
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap">
              {order.customer}
            </span>
          )}
        </div>

        {/* 4-Item Grid: 설비 / 담당자 / 계획시간 / 소요시간 (안정적인 2x2 균형 그리드로 가로폭 확보 & 텍스트 잘림 방지) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 bg-slate-100/90 p-2.5 sm:p-3 rounded-2xl border border-slate-200">
          {/* 1. 배정 설비 */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between min-w-0 min-h-[66px] sm:min-h-[70px]">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 font-bold whitespace-nowrap min-w-0 h-4">
              <Cpu className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="break-keep">배정 설비</span>
            </div>
            <div className="flex items-baseline min-w-0 pt-1">
              <span
                className="font-mono font-black text-slate-900 text-xs sm:text-sm break-keep leading-tight select-text cursor-default"
                title={task.machine || '설비 미배정'}
              >
                {task.machine || '설비 미배정'}
              </span>
            </div>
          </div>

          {/* 2. 담당 작업자 */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between min-w-0 min-h-[66px] sm:min-h-[70px]">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 font-bold whitespace-nowrap min-w-0 h-4">
              <UserIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="break-keep">담당 작업자</span>
            </div>
            <div className="flex items-baseline min-w-0 pt-1">
              <span
                className="font-mono font-black text-slate-900 text-xs sm:text-sm break-keep leading-tight select-text cursor-default"
                title={task.worker || '작업자 미지정'}
              >
                {task.worker || '작업자 미지정'}
              </span>
            </div>
          </div>

          {/* 3. 계획시간 */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between min-w-0 min-h-[66px] sm:min-h-[70px]">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 font-bold whitespace-nowrap min-w-0 h-4">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="break-keep">계획시간</span>
            </div>
            <div className="flex items-baseline gap-1.5 flex-wrap pt-1">
              <span className="font-mono font-black text-slate-900 text-xs sm:text-sm">
                {plannedMinutes}
              </span>
              <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap break-keep">
                분 ({(plannedMinutes / 60).toFixed(1)}h)
              </span>
            </div>
          </div>

          {/* 4. 소요시간 (일시정지 제외 순수 실 소요시간 표시) */}
          <div
            className={`p-2.5 rounded-xl border flex flex-col justify-between min-w-0 min-h-[66px] sm:min-h-[70px] ${
              isPaused
                ? 'bg-amber-50/90 border-amber-300'
                : isInProgress
                ? 'bg-blue-50 border-blue-300'
                : isCompleted
                ? isOvertime
                  ? 'bg-rose-50 border-rose-300'
                  : 'bg-emerald-50 border-emerald-300'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold min-w-0 h-4">
              <div className="flex items-center gap-1.5 text-slate-700 whitespace-nowrap min-w-0">
                <Timer
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isPaused
                      ? 'text-amber-600'
                      : isInProgress
                      ? 'text-blue-600 animate-spin'
                      : isCompleted
                      ? 'text-emerald-600'
                      : 'text-slate-400'
                  }`}
                />
                <span className="break-keep">소요시간</span>
              </div>
              {isCompleted && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.2 rounded whitespace-nowrap shrink-0 ${
                    isOvertime ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {isOvertime ? `+${varianceMinutes}분` : `${Math.abs(varianceMinutes)}분 단축`}
                </span>
              )}
              {isPaused && (
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded whitespace-nowrap shrink-0 bg-amber-200/90 text-amber-950">
                  정지중
                </span>
              )}
            </div>

            <div className="pt-1">
              {isPaused ? (
                <div className="flex items-baseline justify-between gap-1 flex-wrap">
                  <span className="font-mono font-black text-amber-950 text-xs sm:text-sm whitespace-nowrap">
                    {actualMinutes}분
                  </span>
                  <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                    순수 {actualMinutes}분
                  </span>
                </div>
              ) : isInProgress ? (
                <div className="flex items-baseline justify-between gap-1 flex-wrap">
                  <span className="font-mono font-black text-blue-700 text-xs sm:text-sm whitespace-nowrap">
                    {actualMinutes}분 {String(elapsedSeconds).padStart(2, '0')}초
                  </span>
                  <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                    {variancePercent}%
                  </span>
                </div>
              ) : isCompleted ? (
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className={`font-mono font-black text-xs sm:text-sm ${isOvertime ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {actualMinutes}
                  </span>
                  <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">분 소요 완료</span>
                </div>
              ) : (
                <span className="font-bold text-slate-400 text-xs sm:text-sm whitespace-nowrap">대기 중 (0분)</span>
              )}
            </div>
          </div>
        </div>

        {/* In-Progress Progress Bar & Time Variance Indicator */}
        {(isInProgress || isPaused) && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-500">
                {isPaused ? '일시정지 중 (순수 작업시간 진행률)' : '계획시간 대비 진행률 (일시정지 제외)'}
              </span>
              <span className={isOvertime ? 'text-rose-600 font-black' : isPaused ? 'text-amber-700 font-black' : 'text-blue-600 font-black'}>
                {actualMinutes}분 / {plannedMinutes}분 ({variancePercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOvertime ? 'bg-rose-500' : isPaused ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(100, variancePercent)}%` }}
              />
            </div>
          </div>
        )}

        {/* Pause History Snippet if Available */}
        {pauseHistory.length > 0 && (
          <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200 text-xs space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
              <span className="flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-amber-700" />
                <span>일시정지 이력 ({pauseHistory.length}회)</span>
              </span>
              <span className="text-amber-800 font-semibold text-[10px]">
                누적 정지: {Math.round(completedPauseMs / 60000)}분 (실 소요시간 제외됨)
              </span>
            </div>
            <div className="text-[11px] text-amber-950 font-medium">
              최근 사유: <span className="font-bold">{pauseHistory[pauseHistory.length - 1].reason}</span>
              {pauseHistory[pauseHistory.length - 1].operator && (
                <span className="text-amber-800 text-[10px] ml-1.5 font-semibold">
                  (작업자: {pauseHistory[pauseHistory.length - 1].operator})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Issue Report Alert Banner if Triggered */}
        {isAndonHold && (
          <div className="bg-rose-50 border-2 border-red-500 p-3.5 rounded-2xl text-xs space-y-2 shadow-md">
            <div className="flex items-center justify-between flex-wrap gap-1 border-b border-red-200 pb-2">
              <div className="font-black text-red-900 flex items-center gap-1.5 text-xs sm:text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>[긴급 정지] {andonIssueType || '현장 이상 발생'}</span>
              </div>
              {andonReportedAt && (
                <span className="text-[10px] text-red-700 bg-red-100 px-2 py-0.5 rounded-full font-bold">
                  {new Date(andonReportedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 접수
                </span>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs text-red-950 font-bold leading-relaxed bg-white/80 p-2 rounded-lg border border-red-200">
                {andonIssueNote || '현장 작업자에 의해 이상 발생이 보고되어 공정이 긴급 정지되었습니다.'}
              </p>
              {andonReportedBy && (
                <div className="text-[11px] text-red-800 font-semibold flex items-center justify-between">
                  <span>신고자: <strong className="text-red-950 font-bold">{andonReportedBy}</strong></span>
                  <span className="text-[10px] text-red-600 font-bold">관리자 실시간 상황 공유됨</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onOpenAndon(task)}
              className="w-full min-h-[44px] py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-98 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-white" />
              <span>이상 발생 원인 파악 및 조치 완료 해제</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. TOUCH ACTION BUTTONS (TOUCH TARGET >= 44px)                            */}
      {/* ========================================================================= */}
      <div className="p-4 pt-0 space-y-2.5">
        {/* State 1: PENDING -> START */}
        {isPending && (
          <button
            type="button"
            disabled={!canExecuteMES || isAndonHold}
            onClick={() => onStartProcess(task.processKey)}
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-base sm:text-lg shadow-lg flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50 border border-blue-400/40"
          >
            <Play className="w-6 h-6 fill-white" />
            <span>공정 시작 (START PROCESS)</span>
          </button>
        )}

        {/* State 2: IN_PROGRESS -> PAUSE + COMPLETE */}
        {isInProgress && (
          <div className="flex items-center gap-2">
            {onPauseProcess && (
              <button
                type="button"
                disabled={!canExecuteMES || isAndonHold}
                onClick={() => onPauseProcess(task)}
                className="h-14 px-3.5 sm:px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50 border border-amber-400/40 shrink-0"
                title="공정 일시정지 등록"
              >
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                <span className="whitespace-nowrap break-keep">일시정지</span>
              </button>
            )}
            <button
              type="button"
              disabled={!canExecuteMES || isAndonHold}
              onClick={() => onCompleteProcess(task.processKey)}
              className="flex-1 h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-sm sm:text-base shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50 border border-emerald-400/40 min-w-0"
            >
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              <span className="truncate whitespace-nowrap break-keep">가공 완료 (COMPLETE)</span>
            </button>
          </div>
        )}

        {/* State 3: PAUSED -> RESUME */}
        {isPaused && (
          <button
            type="button"
            disabled={!canExecuteMES || isAndonHold}
            onClick={() => onResumeProcess && onResumeProcess(task.processKey)}
            className="w-full h-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-base sm:text-lg shadow-lg flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50 border border-blue-400/40"
          >
            <Play className="w-6 h-6 fill-white" />
            <span>재진행 (RESUME PROCESS)</span>
          </button>
        )}

        {/* State 4: COMPLETED -> FINISHED + RESET */}
        {isCompleted && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-12 bg-slate-100 text-slate-700 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border border-slate-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="truncate">공정 완료됨 ({actualMinutes}분)</span>
            </div>
            {canExecuteMES && (
              <button
                type="button"
                onClick={() => onResetProcess(task.processKey)}
                className="h-12 px-4 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-2xl font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition shrink-0 shadow-xs"
                title="공정 대기 상태로 재설정"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>재작업</span>
              </button>
            )}
          </div>
        )}

        {/* Secondary Utility Buttons: QR Traveler & Issue Reporting (touch target >= 44px) */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => onOpenTraveler(task)}
            className="h-11 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 text-xs whitespace-nowrap"
          >
            <QrCode className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate break-keep">QR 공정이송표</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenAndon(task)}
            className={`h-11 rounded-xl font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 text-xs whitespace-nowrap ${
              isAndonHold
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
            }`}
          >
            <Flame className={`w-4 h-4 shrink-0 ${isAndonHold ? 'text-white' : 'text-red-600'}`} />
            <span className="truncate break-keep">{isAndonHold ? '이상 조치/해제' : '이상발생신고'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
