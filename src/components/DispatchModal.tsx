import React, { useState, useMemo, useEffect } from 'react';
import { Order, ProcessStep, User } from '../types';
import {
  validateOrderForDispatch,
  executeOrderDispatch,
  retryOperatorNotification,
  ValidationResult,
  DispatchExecutionResult,
  OperatorDispatchDetail,
} from '../utils/dispatchHelper';
import { resolvePublicAppUrl, buildFloorMesDeepLink } from '../utils/urlResolver';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  X,
  Layers,
  Calendar,
  Clock,
  UserCheck,
  Cpu,
  Sparkles,
  Globe,
  Settings,
  Edit3,
  MessageSquare,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';

interface DispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  processes: ProcessStep[];
  usersList: User[];
  currentUser?: User | null;
  onDispatchSuccess?: (result: DispatchExecutionResult) => void;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  isOpen,
  onClose,
  order,
  processes,
  usersList,
  currentUser,
  onDispatchSuccess,
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<DispatchExecutionResult | null>(null);
  const [operatorDetailsList, setOperatorDetailsList] = useState<OperatorDispatchDetail[]>([]);
  const [retryingChannel, setRetryingChannel] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedSmsKey, setCopiedSmsKey] = useState<string | null>(null);

  // Channels state
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(true);

  // Base URL configuration
  const defaultPublicUrl = useMemo(() => resolvePublicAppUrl(), []);
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [showUrlConfig, setShowUrlConfig] = useState(false);

  // Editable contacts overrides (phone / email)
  const [contactOverrides, setContactOverrides] = useState<Record<string, { email?: string; phone?: string }>>({});

  const effectiveBaseUrl = useMemo(() => {
    return resolvePublicAppUrl(customBaseUrl || defaultPublicUrl);
  }, [customBaseUrl, defaultPublicUrl]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setDispatchResult(null);
      setOperatorDetailsList([]);
      setRetryingChannel(null);
      setCopiedKey(null);
      setCopiedSmsKey(null);
      setCustomBaseUrl('');
      setContactOverrides({});
    }
  }, [isOpen]);

  // Validate processes
  const validation: ValidationResult = useMemo(() => {
    if (!order) return { valid: false, errors: [], warnings: [], unassignedMachines: 0, unassignedWorkers: 0 };
    return validateOrderForDispatch(order, processes);
  }, [order, processes]);

  // Group processes by assigned worker for preview
  const operatorPreview = useMemo(() => {
    if (!order || !processes) return [];

    const map = new Map<
      string,
      {
        name: string;
        email?: string;
        phone?: string;
        dept?: string;
        processes: ProcessStep[];
      }
    >();

    const userMap = new Map<string, User>();
    usersList.forEach((u) => {
      const rawName = (u.name || '').trim();
      const baseName = rawName.replace(/\s*\([^)]*\)/g, '').trim();
      if (baseName) userMap.set(baseName, u);
      if (rawName) userMap.set(rawName, u);
    });

    processes.forEach((p) => {
      const rawWorker = (p.worker || p.assignedWorker || '').trim();
      if (!rawWorker || rawWorker === '(미지정)' || rawWorker === '미지정') return;

      const baseName = rawWorker.replace(/\s*\([^)]*\)/g, '').trim();
      const u = userMap.get(baseName) || userMap.get(rawWorker);
      const override = contactOverrides[baseName] || contactOverrides[rawWorker];

      if (!map.has(baseName)) {
        map.set(baseName, {
          name: baseName,
          email: override?.email !== undefined ? override.email : u?.email,
          phone: override?.phone !== undefined ? override.phone : u?.phoneNumber || u?.phone_number,
          dept: u?.department || undefined,
          processes: [],
        });
      }

      map.get(baseName)!.processes.push(p);
    });

    return Array.from(map.values());
  }, [order, processes, usersList, contactOverrides]);

  if (!isOpen || !order) return null;

  const handleExecuteDispatch = async () => {
    try {
      setIsExecuting(true);
      const result = await executeOrderDispatch(order, processes, usersList, currentUser, {
        baseUrl: effectiveBaseUrl,
        sendEmail,
        sendSms,
        overrideContacts: contactOverrides,
      });
      setDispatchResult(result);
      setOperatorDetailsList(result.operatorDetails || []);
      if (onDispatchSuccess) {
        onDispatchSuccess(result);
      }
    } catch (err: any) {
      alert(`배포 실행 중 오류가 발생했습니다: ${err?.message || '알 수 없는 오류'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRetrySingle = async (operator: OperatorDispatchDetail, channel: 'EMAIL' | 'SMS' | 'ALL') => {
    const key = `${operator.name}-${channel}`;
    try {
      setRetryingChannel(key);
      const res = await retryOperatorNotification(order, operator, channel, effectiveBaseUrl);
      
      // Update local state for this operator
      setOperatorDetailsList((prev) =>
        prev.map((op) => {
          if (op.name !== operator.name) return op;
          return {
            ...op,
            emailStatus: res.emailStatus !== undefined ? res.emailStatus : op.emailStatus,
            error: res.emailError !== undefined ? res.emailError : (channel === 'EMAIL' || channel === 'ALL' ? undefined : op.error),
            smsStatus: res.smsStatus !== undefined ? res.smsStatus : op.smsStatus,
            smsError: res.smsError !== undefined ? res.smsError : (channel === 'SMS' || channel === 'ALL' ? undefined : op.smsError),
          };
        })
      );
    } catch (err: any) {
      alert(`재시도 중 오류: ${err?.message || err}`);
    } finally {
      setRetryingChannel(null);
    }
  };

  const handleCopyLink = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const handleCopySms = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSmsKey(key);
    setTimeout(() => {
      setCopiedSmsKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 px-6 py-4.5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <Send className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="text-[11px] font-black tracking-wider uppercase text-blue-200">
                DISPATCH ORDER & NOTIFICATIONS
              </div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>수주 확정 및 현장 공정 배포</span>
                <span className="text-xs bg-blue-500/30 text-blue-100 border border-blue-300/30 px-2 py-0.5 rounded-full font-bold">
                  {order.id}
                </span>
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800 dark:text-slate-200 text-sm">
          {!dispatchResult ? (
            /* PRE-DISPATCH CONFIRMATION SCREEN */
            <>
              {/* Order Info Strip */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">수주/PJT명</span>
                  <span className="font-black text-slate-900 dark:text-white text-base">
                    {order.name}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">고객사 / PO</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {order.customer || '-'} / {order.poNumber || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">품명 / 규격</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {order.partName || '-'} {order.spec ? `(${order.spec})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">수량</span>
                    <span className="font-black text-blue-600 dark:text-blue-400">
                      {order.qty || 1} 개
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">납기일자</span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      {order.dueDate || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notification Channels & Public DeepLink URL Config */}
              <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-extrabold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>발송 채널 및 딥링크 프로덕션 도메인 설정</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUrlConfig(!showUrlConfig)}
                    className="text-[11px] font-bold text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>도메인 변경 {showUrlConfig ? '▲' : '▼'}</span>
                  </button>
                </div>

                {/* Channel Checkboxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-400 transition">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                        <span>네이버웍스 이메일 발송</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        noworries004@jstech.kr (SMTP 연동)
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-400 transition">
                    <input
                      type="checkbox"
                      checked={sendSms}
                      onChange={(e) => setSendSms(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>휴대폰 문자 (SMS / 알림톡)</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        담당자 휴대전화로 딥링크 포함 전송
                      </div>
                    </div>
                  </label>
                </div>

                {/* Base URL Input for 403 prevention */}
                {showUrlConfig && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-800/80 space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-blue-600" />
                        <span>딥링크 접속 기본 URL (Base URL)</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold">
                        ✓ 403 오류 방지 공개 도메인 자동 적용
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setCustomBaseUrl('https://jstech-mes.vercel.app')}
                        className="px-2 py-1 text-[10px] font-bold rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 cursor-pointer transition"
                      >
                        🌐 Vercel 실서버 (권장)
                      </button>
                      {typeof window !== 'undefined' && window.location.origin.includes('ais-') && (
                        <button
                          type="button"
                          onClick={() => setCustomBaseUrl(window.location.origin.replace('ais-dev-', 'ais-pre-'))}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer transition"
                        >
                          🧪 AI Studio 프리뷰 도메인
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={customBaseUrl || defaultPublicUrl}
                      onChange={(e) => setCustomBaseUrl(e.target.value)}
                      placeholder="https://jstech-mes.vercel.app"
                      className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
                    />
                    <div className="text-[10px] text-slate-500">
                      ※ SMS/이메일로 발송되는 딥링크는 스마트폰 외부 브라우저에서도 접근 가능한 실서버 도메인으로 전송됩니다.
                    </div>
                  </div>
                )}
              </div>

              {/* Validation Feedback & Warnings */}
              {validation.warnings.length > 0 && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>배정 검증 안내 ({validation.warnings.length}건 미배정)</span>
                  </div>
                  <ul className="text-xs text-amber-800 dark:text-amber-300/90 list-disc list-inside space-y-0.5 max-h-24 overflow-y-auto pl-1">
                    {validation.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Assigned Operators & Contact Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>공정 담당자 및 발송 대상 ({operatorPreview.length}명)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    연락처 미등록 시 즉시 입력 가능
                  </span>
                </div>

                {operatorPreview.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    공정에 지정된 작업자가 없습니다. 공정 구성에서 담당자를 지정해주세요.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {operatorPreview.map((op, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black shrink-0 text-xs">
                              {op.name.slice(0, 1)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-900 dark:text-white">
                                  {op.name}
                                </span>
                                {op.dept && (
                                  <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded font-bold text-slate-600 dark:text-slate-300">
                                    {op.dept}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate flex items-center gap-2">
                                <span>{op.processes.map((p) => p.name).join(', ')}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="inline-block bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-extrabold px-2 py-0.5 rounded-md">
                              {op.processes.length}개 공정
                            </span>
                          </div>
                        </div>

                        {/* Contact Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-700/60 text-[11px]">
                          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <input
                              type="email"
                              placeholder="이메일 입력 (예: name@jstech.kr)"
                              value={op.email || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setContactOverrides((prev) => ({
                                  ...prev,
                                  [op.name]: {
                                    ...prev[op.name],
                                    email: val,
                                    phone: prev[op.name]?.phone !== undefined ? prev[op.name].phone : op.phone,
                                  },
                                }));
                              }}
                              className="bg-transparent w-full outline-hidden text-slate-800 dark:text-slate-200 text-xs"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <Smartphone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <input
                              type="tel"
                              placeholder="휴대폰 번호 (예: 010-1234-5678)"
                              value={op.phone || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setContactOverrides((prev) => ({
                                  ...prev,
                                  [op.name]: {
                                    ...prev[op.name],
                                    email: prev[op.name]?.email !== undefined ? prev[op.name].email : op.email,
                                    phone: val,
                                  },
                                }));
                              }}
                              className="bg-transparent w-full outline-hidden text-slate-800 dark:text-slate-200 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Description */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[11px]">
                  <strong>배포 실행 시 자동 처리 사항:</strong>
                  <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-slate-600 dark:text-slate-400">
                    <li>수주 상태가 <strong>배포완료 (DISPATCHED)</strong>로 안전하게 확정됩니다.</li>
                    <li>모든 단위 공정이 현장 대기 상태로 등록되며 이메일과 휴대폰 문자로 <strong>공개 딥링크</strong>가 전송됩니다.</li>
                    <li>외부 및 모바일 환경에서도 403 에러 없이 즉시 공정 착수 화면으로 연결됩니다.</li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            /* POST-DISPATCH SUCCESS & DEEPLINK REPORT */
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-2xl flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                    수주 확정 및 현장 공정 배포 완료 (DISPATCHED)
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {dispatchResult.dispatchedProcessesCount}개 단위 공정이 현장 배포되었습니다.
                  </p>
                </div>
              </div>

              {/* Data Safety Notice */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="text-[11px]">
                  <strong>데이터 보존 보장:</strong> 수주 확정 및 공정/설비 배정 데이터는 정상적으로 데이터베이스에 저장되었습니다. 메일 또는 문자 발송 실패로 인해 수주 데이터가 롤백되지 않습니다.
                </div>
              </div>

              {/* Server Config Diagnostics */}
              {dispatchResult.apiResponse && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div
                    className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      dispatchResult.apiResponse.smtpConfigured
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                        : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    <Mail className="w-4 h-4 shrink-0 text-blue-600" />
                    <div>
                      <div className="font-bold">
                        네이버웍스 SMTP: {dispatchResult.apiResponse.smtpConfigured ? '연동 모드' : '시뮬레이션 모드'}
                      </div>
                      <div className="text-[10px] opacity-80 font-mono">
                        {dispatchResult.apiResponse.smtpUser || 'noworries004@jstech.kr'} (smtp.worksmobile.com:465)
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      dispatchResult.apiResponse.smsConfigured
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 shrink-0 text-emerald-600" />
                    <div>
                      <div className="font-bold">
                        솔라피 문자(SMS): {dispatchResult.apiResponse.smsConfigured ? '연동 모드' : '시뮬레이션 모드'}
                      </div>
                      <div className="text-[10px] opacity-80 font-mono">
                        발신번호: {dispatchResult.apiResponse.solapiFromNumber || '(미설정)'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Applied Base URL Banner */}
              <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>적용된 프로덕션 딥링크:</span>
                </span>
                <strong className="font-mono text-[11px] text-blue-700 dark:text-blue-300">
                  {dispatchResult.resolvedBaseUrl}
                </strong>
              </div>

              {/* Deep Link & Recipient List with SMS/Email Statuses */}
              <div className="space-y-2">
                <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>📲 담당자별 발송 현황 및 독립 재시도</span>
                  <span className="text-[10px] text-slate-400">메일/문자 실패 시 개별 재시도 가능</span>
                </div>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {operatorDetailsList.map((op, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
                    >
                      {/* Operator Title & Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 dark:text-white text-sm">
                            {op.name}
                          </span>
                          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                            {op.processCount}개 공정 ({op.processes.join(', ')})
                          </span>
                        </div>
                      </div>

                      {/* Decoupled Channel Statuses: 1. Email Channel Card */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-[11px] text-slate-800 dark:text-slate-200">
                            <Mail className="w-3.5 h-3.5 text-blue-500" />
                            <span>이메일 (네이버웍스 SMTP):</span>
                            {op.emailStatus === 'SENT' && (
                              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.2 rounded border border-blue-300 dark:border-blue-700">
                                ✓ 발송 완료
                              </span>
                            )}
                            {op.emailStatus === 'FAILED' && (
                              <span className="text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.2 rounded border border-rose-300 dark:border-rose-700">
                                ✕ 발송 실패
                              </span>
                            )}
                            {op.emailStatus === 'SIMULATED' && (
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.2 rounded">
                                시뮬레이션
                              </span>
                            )}
                            {op.emailStatus === 'SKIPPED' && (
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded">
                                제외됨
                              </span>
                            )}
                          </div>

                          {/* Email Retry Button */}
                          {op.emailStatus === 'FAILED' && (
                            <button
                              type="button"
                              disabled={retryingChannel === `${op.name}-EMAIL`}
                              onClick={() => handleRetrySingle(op, 'EMAIL')}
                              className="px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 transition flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCw className={`w-3 h-3 ${retryingChannel === `${op.name}-EMAIL` ? 'animate-spin' : ''}`} />
                              <span>메일만 재시도</span>
                            </button>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-500">
                          수신 이메일: {op.email || '(이메일 미등록)'}
                        </div>

                        {/* Email Specific Failure Message */}
                        {op.error && (
                          <div className="text-[10px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 p-2 rounded-lg border border-rose-200 dark:border-rose-800 space-y-1">
                            <div className="font-bold">⚠️ 네이버웍스 SMTP 발송 실패 상세:</div>
                            <div className="whitespace-pre-wrap">{op.error}</div>
                          </div>
                        )}
                      </div>

                      {/* Decoupled Channel Statuses: 2. SMS Channel Card */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-[11px] text-slate-800 dark:text-slate-200">
                            <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                            <span>문자 (솔라피 Solapi):</span>
                            {op.smsStatus === 'SENT' && (
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-700">
                                ✓ 발송 완료
                              </span>
                            )}
                            {op.smsStatus === 'FAILED' && (
                              <span className="text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.2 rounded border border-rose-300 dark:border-rose-700">
                                ✕ 발송 실패
                              </span>
                            )}
                            {op.smsStatus === 'SIMULATED' && (
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.2 rounded">
                                시뮬레이션
                              </span>
                            )}
                            {op.smsStatus === 'SKIPPED' && (
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded">
                                제외됨
                              </span>
                            )}
                          </div>

                          {/* SMS Retry Button */}
                          {op.smsStatus === 'FAILED' && (
                            <button
                              type="button"
                              disabled={retryingChannel === `${op.name}-SMS`}
                              onClick={() => handleRetrySingle(op, 'SMS')}
                              className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-md hover:bg-emerald-100 transition flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCw className={`w-3 h-3 ${retryingChannel === `${op.name}-SMS` ? 'animate-spin' : ''}`} />
                              <span>문자만 재시도</span>
                            </button>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-500">
                          수신 번호: {op.phoneNumber || '(휴대폰 번호 미등록)'}
                        </div>

                        {/* SMS Specific Failure Message */}
                        {op.smsError && (
                          <div className="text-[10px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 p-2 rounded-lg border border-rose-200 dark:border-rose-800">
                            <strong>⚠️ 솔라피 문자 발송 상세:</strong> {op.smsError}
                          </div>
                        )}

                        {/* Quick Manual SMS/App fallback if SMS text available */}
                        {op.smsText && (
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400">
                              수동 전송:
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopySms(op.name, op.smsText!)}
                                className="text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                              >
                                {copiedSmsKey === op.name ? (
                                  <span className="text-emerald-600">✓ 전문 복사됨</span>
                                ) : (
                                  <span>📋 문자전문 복사</span>
                                )}
                              </button>
                              {op.phoneNumber && (
                                <a
                                  href={`sms:${op.phoneNumber.replace(/[^0-9]/g, '')}?body=${encodeURIComponent(op.smsText)}`}
                                  className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                                >
                                  <Smartphone className="w-3 h-3" />
                                  <span>문자앱 열기</span>
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Deep Link URL Bar */}
                      {op.deepLink && (
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                          <input
                            type="text"
                            readOnly
                            value={op.deepLink}
                            className="bg-transparent text-[11px] text-slate-600 dark:text-slate-400 w-full outline-hidden font-mono select-all truncate"
                          />
                          <button
                            type="button"
                            onClick={() => handleCopyLink(op.name, op.deepLink!)}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            {copiedKey === op.name ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>링크 복사됨</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>링크 복사</span>
                              </>
                            )}
                          </button>
                          <a
                            href={op.deepLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-1 shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>열기</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl transition cursor-pointer"
          >
            {dispatchResult ? '닫기' : '취소'}
          </button>

          {!dispatchResult && (
            <button
              type="button"
              disabled={isExecuting || !validation.valid}
              onClick={handleExecuteDispatch}
              className={`px-5 py-2.5 rounded-xl font-black text-xs shadow-md transition flex items-center gap-2 ${
                isExecuting || !validation.valid
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95 shadow-blue-500/20'
              }`}
            >
              {isExecuting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>현장 배포 및 메일/문자 발송 중...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>수주 확정 및 현장 배포 (DISPATCH)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
