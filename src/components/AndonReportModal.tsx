import React, { useState, useEffect } from 'react';
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
  RotateCcw,
  Layers,
  Tag,
  History,
  CheckCheck,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ScheduledTaskItem, User as UserType, Order, IncidentIssueLog } from '../types';

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
  order?: Order;
  currentUser?: UserType | null;
  approvedOperators?: string[];
  onSubmitIssue: (
    processKey: string,
    issueType: string,
    note: string,
    reporterName: string
  ) => void;
  onResolveIssue?: (processKey: string, resolveNote: string, resolverName?: string) => void;
}

export const AndonReportModal: React.FC<AndonReportModalProps> = ({
  isOpen,
  onClose,
  taskItem,
  order,
  currentUser,
  approvedOperators = [],
  onSubmitIssue,
  onResolveIssue,
}) => {
  const isCurrentIssueHold = taskItem?.andonStatus === 'ISSUE_HOLD';
  const [activeTab, setActiveTab] = useState<'ACTION' | 'HISTORY'>('ACTION');

  const [selectedIssueType, setSelectedIssueType] = useState<string>(
    ANDON_ISSUE_PRESETS[0].label
  );
  const [issueNote, setIssueNote] = useState<string>('');
  const [reporterName, setReporterName] = useState<string>('');
  
  // Resolver input state
  const [resolverName, setResolverName] = useState<string>('');
  const [resolveNote, setResolveNote] = useState<string>('');

  const openedSessionRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !taskItem) {
      openedSessionRef.current = null;
      return;
    }

    // Only initialize form values and tab on initial modal open or when target task changes
    const sessionKey = `${taskItem.processKey}_${taskItem.andonStatus || 'NORMAL'}`;
    if (openedSessionRef.current !== sessionKey) {
      openedSessionRef.current = sessionKey;
      setReporterName(currentUser?.name || taskItem.worker || '현장 작업자');
      setResolverName(currentUser?.name || '시스템 관리자');
      setResolveNote('');
      setIssueNote('');
      setSelectedIssueType(ANDON_ISSUE_PRESETS[0].label);
      setActiveTab(taskItem.andonStatus === 'ISSUE_HOLD' ? 'ACTION' : 'ACTION');
    }
  }, [isOpen, taskItem?.processKey, taskItem?.andonStatus, currentUser?.name]);

  if (!isOpen || !taskItem) return null;

  const effectivePjtNo = order?.pjtNo || order?.poNumber || taskItem.orderId || '프로젝트번호 미지정';
  const effectivePjtName = order?.pjtName || order?.name || taskItem.orderName || '프로젝트명 미지정';

  // Construct history items
  const historyList: IncidentIssueLog[] = taskItem.andonHistory && taskItem.andonHistory.length > 0
    ? taskItem.andonHistory
    : (isCurrentIssueHold ? [{
        id: 'CURRENT_ACTIVE',
        issueType: taskItem.andonIssueType || '현장 이상 발생',
        note: taskItem.andonIssueNote || '상세 내용 없음',
        reportedAt: taskItem.andonReportedAt || new Date().toISOString(),
        reportedBy: taskItem.andonReportedBy || '작업자',
        isResolved: false
      }] : []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueNote.trim()) {
      alert('이상 발생 사유 및 현장 상황을 상세히 입력해 주세요.');
      return;
    }
    const finalReporter = reporterName.trim() || currentUser?.name || '현장 작업자';
    onSubmitIssue(taskItem.processKey, selectedIssueType, issueNote.trim(), finalReporter);
    onClose();
  };

  const handleResolve = () => {
    if (onResolveIssue) {
      const finalResolver = resolverName.trim() || currentUser?.name || '시스템 관리자';
      const finalNote = resolveNote.trim() || '현장 조치 완료 및 가공 재개';
      onResolveIssue(taskItem.processKey, finalNote, finalResolver);
      onClose();
    }
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const h = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${m}/${day} ${h}:${min}`;
    } catch {
      return isoString;
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
                  현장 이상발생 긴급 신고 / 조치
                </h2>
                <span className="text-[10px] bg-white text-red-700 px-2 py-0.5 rounded-full font-black uppercase shadow-2xs">
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

        {/* Task Details Card with Project Number & Name */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 text-xs flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">프로젝트 번호</span>
              <span className="text-xs font-mono font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block truncate max-w-full">
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
            {order?.customer && (
              <span className="text-[11px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded shrink-0">
                {order.customer}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-slate-600 text-[11px] pt-1 border-t border-slate-200">
            <div>
              <strong>배정 설비:</strong> {taskItem.machine || '미지정'}
            </div>
            <div>
              <strong>담당 작업자:</strong> {taskItem.worker || '미지정'}
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-100/75 p-1 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('ACTION')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'ACTION'
                ? 'bg-white text-red-600 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{isCurrentIssueHold ? '이상 조치 및 정상 복귀' : '이상 발생 신고 접수'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>이상 발생 및 조치 이력</span>
            {historyList.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-200 text-slate-800 font-bold">
                {historyList.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: ACTION (Resolve or Report) */}
        {activeTab === 'ACTION' && (
          <div className="overflow-y-auto flex-1 p-4 space-y-4 text-xs">
            {/* Existing Active Issue Banner if Already in ISSUE_HOLD */}
            {isCurrentIssueHold ? (
              <div className="space-y-3.5">
                <div className="bg-red-50 border-2 border-red-400 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-red-900 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      현재 접수된 긴급 이상 내역 (공정 정지 중)
                    </span>
                    <span className="text-[10px] text-red-600 font-mono font-bold bg-red-100 px-2 py-0.5 rounded">
                      {taskItem.andonReportedAt ? formatDateTime(taskItem.andonReportedAt) : '접수됨'}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-red-200 space-y-1.5">
                    <div className="text-xs font-bold text-red-950 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-red-600" />
                      <span>{taskItem.andonIssueType || '이상 발생'}</span>
                    </div>
                    <p className="text-xs text-slate-800 font-semibold bg-red-50/50 p-2 rounded border border-red-100">
                      "{taskItem.andonIssueNote || '상세 사유 없음'}"
                    </p>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>신고자: <strong className="text-slate-800">{taskItem.andonReportedBy || '작업자'}</strong></span>
                      <span className="text-[10px] text-red-600 font-bold">라인 알림 전달 완료</span>
                    </div>
                  </div>
                </div>

                {/* Resolve Issue Action Box with Resolver Input Field */}
                <div className="bg-emerald-50/60 border border-emerald-300 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950 border-b border-emerald-200 pb-2">
                    <Wrench className="w-4 h-4 text-emerald-600" />
                    <span>현장 이상 조치 완료 및 정상 공정 복귀 입력</span>
                  </div>

                  {/* Resolver (조치자) Field */}
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-800 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>조치자 (조치 담당자) *</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={resolverName}
                        onChange={(e) => setResolverName(e.target.value)}
                        placeholder="조치자 성명 입력"
                        className="flex-1 text-xs px-3 py-2 border border-emerald-300 bg-white rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        required
                      />
                      {approvedOperators.length > 0 && (
                        <select
                          value={approvedOperators.includes(resolverName) ? resolverName : ''}
                          onChange={(e) => {
                            if (e.target.value) setResolverName(e.target.value);
                          }}
                          className="px-2 py-1 text-xs border border-emerald-300 bg-white rounded-xl text-slate-700 font-semibold focus:outline-none"
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

                  {/* Resolve Note */}
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-800 flex items-center gap-1">
                      <span>조치 완료 내역 (이상 해제 사유) *</span>
                    </label>
                    <textarea
                      value={resolveNote}
                      onChange={(e) => setResolveNote(e.target.value)}
                      placeholder="예: 공구 신품 교체 및 Z축 옵셋 재측정 완료, 가공 재개"
                      rows={2}
                      className="w-full text-xs p-2.5 border border-emerald-300 bg-white rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Submit Resolve Action Button */}
                  <button
                    type="button"
                    onClick={handleResolve}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>이상 조치 완료 및 정상 공정 복귀</span>
                  </button>
                </div>
              </div>
            ) : (
              /* New Issue Report Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Presets Selection */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    이상 발생 유형 선택 *
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

                {/* Reporter Info Field */}
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>신고자 (현장 작업자) *</span>
                    </label>
                    <span className="text-slate-400 font-mono">
                      신고 시점: {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="신고자 성명"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 bg-white rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
                  >
                    <Flame className="w-4 h-4 animate-bounce" />
                    <span>현장 이상 발생 긴급 신고 접수</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: HISTORY TIMELINE */}
        {activeTab === 'HISTORY' && (
          <div className="overflow-y-auto flex-1 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between text-xs font-black text-slate-900 border-b border-slate-200 pb-2">
              <span className="flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-600" />
                <span>이상 발생 및 조치 전체 이력 추적</span>
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                총 {historyList.length}건의 이상 기록
              </span>
            </div>

            {historyList.length === 0 ? (
              <div className="text-center py-10 text-slate-400 space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
                <p className="font-bold text-slate-600">등록된 이상 발생 및 조치 이력이 없습니다.</p>
                <p className="text-[11px]">해당 공정은 이상 없이 정상적으로 진행되고 있습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyList.map((item, idx) => {
                  const isResolved = item.isResolved;
                  return (
                    <div
                      key={item.id || idx}
                      className={`p-3.5 rounded-xl border-2 space-y-2.5 transition ${
                        isResolved
                          ? 'border-slate-200 bg-slate-50/70 text-slate-800'
                          : 'border-red-400 bg-rose-50/80 text-red-950'
                      }`}
                    >
                      {/* Timeline Card Header */}
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs px-2 py-0.5 rounded bg-slate-800 text-white">
                            이력 #{historyList.length - idx}
                          </span>
                          <span className="font-bold text-xs">
                            {item.issueType}
                          </span>
                        </div>
                        {isResolved ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <CheckCheck className="w-3 h-3" />
                            조치 완료 / 정상 복귀
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse flex items-center gap-1 shadow-2xs">
                            <Flame className="w-3 h-3" />
                            긴급 정지 중
                          </span>
                        )}
                      </div>

                      {/* Phase 1: Reported Details */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-extrabold text-red-700 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            1. 이상 신고 접수
                          </span>
                          <span className="font-mono text-slate-400 text-[10px]">
                            {formatDateTime(item.reportedAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 font-semibold pl-4">
                          "{item.note}"
                        </p>
                        <div className="text-[10px] text-slate-500 pl-4 font-bold">
                          신고자: <span className="text-slate-800">{item.reportedBy || '작업자'}</span>
                        </div>
                      </div>

                      {/* Phase 2: Resolved Details */}
                      {isResolved ? (
                        <div className="bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-extrabold text-emerald-800 flex items-center gap-1">
                              <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                              2. 현장 조치 및 복귀 확인
                            </span>
                            <span className="font-mono text-emerald-700 text-[10px]">
                              {formatDateTime(item.resolvedAt)}
                            </span>
                          </div>
                          <p className="text-xs text-emerald-950 font-bold pl-4">
                            "{item.resolvedNote || '현장 조치 완료 및 정상 가공 복귀'}"
                          </p>
                          <div className="text-[10px] text-emerald-800 pl-4 font-bold">
                            조치자: <span className="text-emerald-950">{item.resolvedBy || '조치자'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-red-700 bg-red-100/60 p-2 rounded-lg border border-red-200 flex items-center justify-between font-bold">
                          <span>현장 조치 및 관리자 확인 대기 중...</span>
                          <button
                            type="button"
                            onClick={() => setActiveTab('ACTION')}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-black cursor-pointer"
                          >
                            지금 조치하기 →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

