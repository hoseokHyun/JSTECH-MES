import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  AlertTriangle,
  AlertCircle,
  Wrench,
  ShieldAlert,
  Flame,
  FileWarning,
  CheckCircle2,
  BellRing,
  Send,
  User,
  Clock,
  RotateCcw
} from 'lucide-react';
import { ScheduledTaskItem, User as UserType } from '../types';

export const ANDON_ISSUE_PRESETS = [
  {
    id: 'TOOL_BREAKAGE',
    label: '공구 파손 / 엔드밀 마모',
    desc: '가공 중 공구 파손 또는 팁 마모로 즉시 교체 및 옵셋 보정 필요',
    icon: '⚡',
    color: 'border-red-400 bg-red-50 text-red-900',
  },
  {
    id: 'TOLERANCE_EXCEEDED',
    label: '가공 치수 미달 / 공차 초과 (±5µm 초과)',
    desc: '정밀 측정 결과 허용 공차 초과 발생, 가공 중단 및 품질팀 확인 요망',
    icon: '📏',
    color: 'border-amber-400 bg-amber-50 text-amber-900',
  },
  {
    id: 'DRAWING_CAM_MISMATCH',
    label: '도면 / CAM 데이터 불일치',
    desc: '2D 도면 사양과 NC 프로그램 좌표계/형상 불일치 발견',
    icon: '📐',
    color: 'border-purple-400 bg-purple-50 text-purple-900',
  },
  {
    id: 'MACHINE_ALARM',
    label: '설비 알람 및 긴급정지 (PLC Trip)',
    desc: '스핀들 과부하, 절삭유 압력 저하, 서보 드라이버 에러 발생',
    icon: '🚨',
    color: 'border-rose-400 bg-rose-50 text-rose-900',
  },
  {
    id: 'RAW_MATERIAL_DEFECT',
    label: '원소재 결함 / 찍힘 / 휨',
    desc: 'SUS316L 모재 내부 기포, 스크래치 또는 평면도 이상',
    icon: '📦',
    color: 'border-orange-400 bg-orange-50 text-orange-900',
  },
  {
    id: 'OTHER_EMERGENCY',
    label: '기타 현장 긴급 요청',
    desc: '작업자 안전, 전원 이상, 클램프 간섭 등 기타 예외 상황',
    icon: '⚠️',
    color: 'border-slate-400 bg-slate-50 text-slate-900',
  },
];

interface AndonReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskItem: ScheduledTaskItem | null;
  currentUser?: UserType | null;
  onSubmitIssue: (
    processKey: string,
    issueType: string,
    note: string,
    reporterName: string
  ) => void;
  onResolveIssue?: (processKey: string, resolveNote: string) => void;
}

export const AndonReportModal: React.FC<AndonReportModalProps> = ({
  isOpen,
  onClose,
  taskItem,
  currentUser,
  onSubmitIssue,
  onResolveIssue,
}) => {
  const [selectedIssueType, setSelectedIssueType] = useState<string>(
    ANDON_ISSUE_PRESETS[0].label
  );
  const [issueNote, setIssueNote] = useState<string>('');
  const [resolveNote, setResolveNote] = useState<string>('');
  const [isResolvingMode, setIsResolvingMode] = useState<boolean>(false);

  if (!isOpen || !taskItem) return null;

  const isCurrentIssueHold = taskItem.andonStatus === 'ISSUE_HOLD';
  const reporter = currentUser?.name || taskItem.worker || '현장 작업자';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueNote.trim()) {
      alert('안돈 발령 사유 및 현장 상황을 상세히 입력해 주세요.');
      return;
    }
    onSubmitIssue(taskItem.processKey, selectedIssueType, issueNote.trim(), reporter);
    onClose();
  };

  const handleResolve = () => {
    if (onResolveIssue) {
      onResolveIssue(
        taskItem.processKey,
        resolveNote.trim() || '현장 조치 완료 및 가공 재개'
      );
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs select-none">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border-2 border-red-500 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 text-white shadow-inner animate-pulse">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">
                  실시간 안돈(Andon) 예외/불량 긴급 호출
                </h2>
                <span className="text-[10px] bg-white text-red-700 px-2 py-0.5 rounded-full font-black uppercase">
                  EMERGENCY
                </span>
              </div>
              <p className="text-xs text-red-100 mt-0.5">
                현장 이상 발생 시 즉시 생산 라인에 경보를 전송하고 공정을 대기 상태로 전환합니다.
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

        {/* Task Details Card */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">대상 공정 / 수주:</span>
            <span className="text-[11px] font-mono font-bold text-slate-700">
              {taskItem.orderId}
            </span>
          </div>
          <div className="text-sm font-black text-slate-900 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-extrabold">
              {taskItem.category}
            </span>
            <span>{taskItem.content}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600 text-[11px] pt-1 border-t border-slate-200">
            <div>
              <strong>배정 설비:</strong> {taskItem.machine}
            </div>
            <div>
              <strong>담당 작업자:</strong> {taskItem.worker}
            </div>
          </div>
        </div>

        {/* Existing Active Issue Banner if Already in ISSUE_HOLD */}
        {isCurrentIssueHold && (
          <div className="p-4 bg-red-50 border-b border-red-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-red-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                현재 발령 중인 안돈 이슈
              </span>
              <span className="text-[10px] text-red-600 font-mono font-bold">
                {taskItem.andonReportedAt ? new Date(taskItem.andonReportedAt).toLocaleTimeString() : ''}
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-red-300 space-y-1">
              <div className="text-xs font-bold text-red-900">
                🚨 {taskItem.andonIssueType || '이상 발생'}
              </div>
              <p className="text-xs text-slate-700 font-medium">
                {taskItem.andonIssueNote || '상세 내용 없음'}
              </p>
              <div className="text-[10px] text-slate-500 font-bold">
                보고자: {taskItem.andonReportedBy || '작업자'}
              </div>
            </div>

            {/* Resolve Issue Action Box */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                조치 완료 내역 (해제 사유):
              </label>
              <input
                type="text"
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                placeholder="예: 공구 신품 교체 및 Z축 옵셋 재측정 완료, 가공 재개"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none mb-2"
              />
              <button
                type="button"
                onClick={handleResolve}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>안돈 해제 및 정상 공정 복귀 (Resolve Andon)</span>
              </button>
            </div>
          </div>
        )}

        {/* New Issue Report Form */}
        {!isCurrentIssueHold && (
          <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
            {/* Presets Selection */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600" />
                불량 / 예외 발생 유형 선택 *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ANDON_ISSUE_PRESETS.map((preset) => {
                  const isSelected = selectedIssueType === preset.label;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedIssueType(preset.label)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? `${preset.color} ring-2 ring-red-500 font-black shadow-xs`
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

            {/* Detailed Notes */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <span>상세 현장 상황 및 조치 요구사항 *</span>
              </label>
              <textarea
                value={issueNote}
                onChange={(e) => setIssueNote(e.target.value)}
                placeholder="예: MCT 1호기 황삭 중 4번 엔드밀 파손 발생, 절삭음 이상으로 즉시 정지함. 교체용 엔드밀 지원 요망."
                rows={3}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none placeholder:text-slate-400"
                required
              />
            </div>

            {/* Reporter Info */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>보고자: <strong>{reporter}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>발령 시점: <strong>{new Date().toLocaleTimeString()}</strong></span>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
              >
                <Flame className="w-4 h-4 animate-bounce" />
                <span>긴급 안돈 경보 발령 (Trigger Andon Alert)</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
