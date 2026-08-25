import React from 'react';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  QrCode,
  Flame,
  Clock,
  Wrench,
  User,
  Layers,
  ChevronRight,
  ShieldAlert,
  Printer,
  Sparkles
} from 'lucide-react';
import { ScheduledTaskItem, ProcessProgressItem, Order } from '../types';

interface FloorProcessCardProps {
  task: ScheduledTaskItem;
  order?: Order;
  progressItem?: ProcessProgressItem;
  canExecuteMES: boolean;
  onStartProcess: (processKey: string) => void;
  onCompleteProcess: (processKey: string) => void;
  onResetProcess: (processKey: string) => void;
  onOpenTraveler: (task: ScheduledTaskItem) => void;
  onOpenAndon: (task: ScheduledTaskItem) => void;
  onUpdateDefectQty?: (processKey: string, defectQty: number) => void;
}

export const FloorProcessCard: React.FC<FloorProcessCardProps> = ({
  task,
  order,
  progressItem,
  canExecuteMES,
  onStartProcess,
  onCompleteProcess,
  onResetProcess,
  onOpenTraveler,
  onOpenAndon,
  onUpdateDefectQty,
}) => {
  const isCompleted = task.status === 'COMPLETED';
  const isInProgress = task.status === 'IN_PROGRESS';
  const isPending = !isCompleted && !isInProgress;
  const isAndonHold = task.andonStatus === 'ISSUE_HOLD';
  const defectQty = progressItem?.defectQty ?? task.defectQty ?? 0;

  const handleDefectChange = (delta: number) => {
    if (!onUpdateDefectQty) return;
    const nextVal = Math.max(0, defectQty + delta);
    onUpdateDefectQty(task.processKey, nextVal);
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 shadow-sm flex flex-col justify-between overflow-hidden ${
        isAndonHold
          ? 'bg-red-50/90 border-red-500 ring-2 ring-red-500/40 shadow-red-200'
          : isCompleted
          ? 'bg-slate-50/90 border-slate-200 opacity-90'
          : isInProgress
          ? 'bg-blue-50/40 border-[#0066FF] ring-2 ring-[#0066FF]/20 shadow-blue-100'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Status & Meta Header */}
      <div className="p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Order Name & Badge */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg shrink-0">
              {task.orderId}
            </span>
            <span
              className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                task.category === '가공'
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : task.category === '연마'
                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}
            >
              {task.category}
            </span>
          </div>

          {/* Current Status Pill */}
          <div>
            {isAndonHold ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-black bg-red-600 text-white px-2.5 py-0.5 rounded-full animate-pulse shadow-xs">
                <Flame className="w-3 h-3" />
                <span>안돈 긴급정지</span>
              </span>
            ) : isCompleted ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-slate-500" />
                <span>공정 완료</span>
              </span>
            ) : isInProgress ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-black bg-[#0066FF] text-white px-2.5 py-0.5 rounded-full shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>가공 진행 중</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full">
                <Clock className="w-3 h-3" />
                <span>작업 대기</span>
              </span>
            )}
          </div>
        </div>

        {/* Process Name (Large bold) */}
        <div>
          <h3 className="text-base font-black text-slate-900 leading-snug tracking-tight">
            {task.content || task.title}
          </h3>
          {order && (
            <div className="text-xs text-slate-600 font-semibold mt-0.5 flex items-center gap-2">
              <span className="truncate max-w-[200px]">{order.name}</span>
              <span>•</span>
              <span className="font-mono text-slate-800">{order.qty} EA</span>
              {order.spec && (
                <>
                  <span>•</span>
                  <span className="font-mono text-slate-500">{order.spec}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Machine & Worker & Planned Time Badges */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-100/70 p-2 rounded-xl text-xs font-semibold text-slate-700">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold">배정 설비</span>
            <span className="font-black text-slate-900 truncate text-[11px]">{task.machine}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold">담당자</span>
            <span className="font-black text-slate-900 truncate text-[11px]">{task.worker}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold">계획 공수</span>
            <span className="font-mono font-black text-blue-700 text-[11px]">
              {task.plannedMinutes || (task.duration ? task.duration * 60 : 60)}분
            </span>
          </div>
        </div>

        {/* Andon Alarm Alert Banner if Triggered */}
        {isAndonHold && (
          <div className="bg-red-100 border border-red-300 p-2.5 rounded-xl text-xs space-y-1">
            <div className="font-black text-red-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{task.andonIssueType || '안돈 예외 발생'}</span>
            </div>
            <p className="text-[11px] text-red-800 line-clamp-2">
              {task.andonIssueNote || '현장 작업자에 의해 이상 발생이 보고되어 공정이 정지되었습니다.'}
            </p>
          </div>
        )}

        {/* Defect Counter Quick Widget */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
          <span className="text-slate-600 font-bold text-[11px]">불량(Scrap) 수량:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canExecuteMES || defectQty <= 0}
              onClick={() => handleDefectChange(-1)}
              className="w-6 h-6 rounded-lg bg-white border border-slate-300 text-slate-700 font-black hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center cursor-pointer active:scale-95"
            >
              -
            </button>
            <span className="font-mono font-black text-xs text-rose-700 min-w-[20px] text-center">
              {defectQty} EA
            </span>
            <button
              type="button"
              disabled={!canExecuteMES}
              onClick={() => handleDefectChange(1)}
              className="w-6 h-6 rounded-lg bg-white border border-slate-300 text-slate-700 font-black hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center cursor-pointer active:scale-95"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Large Touch Controls & Quick Tools */}
      <div className="p-4 pt-0 space-y-2">
        {/* Main Touch Execution Button (Extra Large for Mobile/Tablet) */}
        {isPending && (
          <button
            type="button"
            disabled={!canExecuteMES || isAndonHold}
            onClick={() => onStartProcess(task.processKey)}
            className="w-full py-3.5 px-4 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition disabled:opacity-50"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>작업 시작 (Start Cycle)</span>
          </button>
        )}

        {isInProgress && (
          <button
            type="button"
            disabled={!canExecuteMES || isAndonHold}
            onClick={() => onCompleteProcess(task.processKey)}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>가공 완료 (Finish Process)</span>
          </button>
        )}

        {isCompleted && (
          <div className="flex items-center gap-2">
            <div className="flex-1 py-2.5 px-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>공정 완료됨</span>
            </div>
            {canExecuteMES && (
              <button
                type="button"
                onClick={() => onResetProcess(task.processKey)}
                className="py-2.5 px-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer active:scale-95 transition shrink-0"
                title="공정 대기 상태로 재설정"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>재작업</span>
              </button>
            )}
          </div>
        )}

        {/* Secondary Tool Bar: QR Traveler & Andon Emergency Trigger */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
          <button
            type="button"
            onClick={() => onOpenTraveler(task)}
            className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 text-[11px]"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-600" />
            <span>QR 트래블러</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenAndon(task)}
            className={`py-2 px-2.5 rounded-xl font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 text-[11px] ${
              isAndonHold
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${isAndonHold ? 'text-white' : 'text-red-600'}`} />
            <span>{isAndonHold ? '안돈 해제/조치' : '안돈 긴급호출'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
