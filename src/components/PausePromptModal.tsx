import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Pause,
  Clock,
  User,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Wrench,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';
import { ScheduledTaskItem, User as UserType, Order, PauseReason } from '../types';

export const PAUSE_REASON_PRESETS: { id: string; label: PauseReason; desc: string; icon: string }[] = [
  {
    id: 'MACHINE_MAINTENANCE',
    label: '설비 점검/고장',
    desc: '설비 알람, 스핀들 점검, 절삭유/유압 보충 등',
    icon: '⚙️',
  },
  {
    id: 'MATERIAL_WAITING',
    label: '원소재/자재 대기',
    desc: '원소재 반입 대기, 전공정 지연, 전용 지그 준비 등',
    icon: '📦',
  },
  {
    id: 'QUALITY_CHECK',
    label: '품질/도면 확인',
    desc: '중간 치수 검사, 2D 도면 확인, CAM 좌표계 확인 등',
    icon: '📏',
  },
  {
    id: 'OPERATOR_BREAK',
    label: '작업자 교대/휴게',
    desc: '교대 근무 인수인계, 휴게 시간, 교육 등',
    icon: '☕',
  },
  {
    id: 'TOOL_CHANGE',
    label: '공구 교체/세팅',
    desc: '엔드밀/바이트 마모 교체, 공구 길이 측정 등',
    icon: '🔧',
  },
  {
    id: 'OTHER_REASON',
    label: '기타',
    desc: '기타 현장 사유 (아래 상세 사유 직접 입력)',
    icon: '📝',
  },
];

interface PausePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskItem: ScheduledTaskItem | null;
  order?: Order;
  currentUser?: UserType | null;
  approvedOperators?: string[];
  onConfirmPause: (
    processKey: string,
    reason: string,
    operatorName: string,
    detailNote?: string
  ) => void;
}

export const PausePromptModal: React.FC<PausePromptModalProps> = ({
  isOpen,
  onClose,
  taskItem,
  order,
  currentUser,
  approvedOperators = [],
  onConfirmPause,
}) => {
  const [selectedReason, setSelectedReason] = useState<PauseReason>(PAUSE_REASON_PRESETS[0].label);
  const [customReasonText, setCustomReasonText] = useState<string>('');
  const [operatorName, setOperatorName] = useState<string>('');

  const openedSessionRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !taskItem) {
      openedSessionRef.current = null;
      return;
    }

    const sessionKey = taskItem.processKey;
    if (openedSessionRef.current !== sessionKey) {
      openedSessionRef.current = sessionKey;
      setOperatorName(currentUser?.name || taskItem.worker || '현장 작업자');
      setSelectedReason(PAUSE_REASON_PRESETS[0].label);
      setCustomReasonText('');
    }
  }, [isOpen, taskItem?.processKey, currentUser?.name]);

  if (!isOpen || !taskItem) return null;

  const effectivePjtNo = order?.pjtNo || order?.poNumber || taskItem.orderId || '프로젝트번호 미지정';
  const effectivePjtName = order?.pjtName || order?.name || taskItem.orderName || '프로젝트명 미지정';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedReason === '기타'
      ? (customReasonText.trim() || '기타 현장 사유')
      : selectedReason;
    const finalOperator = operatorName.trim() || currentUser?.name || taskItem.worker || '현장 작업자';
    onConfirmPause(taskItem.processKey, finalReason, finalOperator, customReasonText.trim() || undefined);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs select-none">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border-2 border-amber-400 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 text-white shadow-inner">
              <Pause className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">
                  공정 일시정지 (PAUSE) 등록
                </h2>
                <span className="text-[10px] bg-white text-amber-900 px-2 py-0.5 rounded-full font-black uppercase shadow-2xs">
                  PAUSE
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                일시정지 중에는 실제 작업 소요시간 계산이 중단(제외)됩니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Details Summary */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 text-xs flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">프로젝트 번호</span>
              <span className="text-xs font-mono font-black text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block truncate max-w-full">
                {effectivePjtNo}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">프로젝트명 (품명)</span>
              <span className="text-xs font-extrabold text-slate-900 truncate block" title={effectivePjtName}>
                {effectivePjtName}
              </span>
            </div>
          </div>

          <div className="text-sm font-black text-slate-900 flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-2 truncate">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-extrabold shrink-0">
                {taskItem.category}
              </span>
              <span className="truncate">{taskItem.content || taskItem.groupName}</span>
            </div>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded shrink-0">
              설비: {taskItem.machine || '미배정'}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 space-y-4 text-xs">
          {/* Pause Reason Presets Selection */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>일시정지 사유 선택 *</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PAUSE_REASON_PRESETS.map((preset) => {
                const isSelected = selectedReason === preset.label;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedReason(preset.label)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/90 ring-2 ring-amber-500 font-black shadow-xs text-amber-950'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span>{preset.icon}</span>
                      <span>{preset.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 line-clamp-1 mt-1">
                      {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom / Detailed Reason Note */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>상세 사유 및 비고 (선택 사항)</span>
            </label>
            <textarea
              value={customReasonText}
              onChange={(e) => setCustomReasonText(e.target.value)}
              placeholder="예: 공구 마모 교체 및 툴 셋터 보정 진행 중 (약 15분 소요 예정)"
              rows={2}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Operator Name Input */}
          <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>일시정지 요청 작업자 *</span>
              </label>
              <span className="text-slate-400 font-mono text-[10px]">
                {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="작업자 성명"
                className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 bg-white rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
              {approvedOperators.length > 0 && (
                <select
                  value={approvedOperators.includes(operatorName) ? operatorName : ''}
                  onChange={(e) => {
                    if (e.target.value) setOperatorName(e.target.value);
                  }}
                  className="px-2 py-1 text-xs border border-slate-300 bg-white rounded-lg text-slate-700 font-semibold focus:outline-none"
                >
                  <option value="">담당자 선택...</option>
                  {approvedOperators.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer active:scale-95"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-2 h-12 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
            >
              <Pause className="w-4 h-4 fill-white" />
              <span>일시정지 적용 (PAUSE)</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
