import React, { useState, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Cpu,
  UserCheck,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Trash2,
  Layers,
  HelpCircle,
  Save,
  Check,
  ChevronDown,
  ChevronUp,
  History,
  Building2,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Award,
  AlertCircle,
  Users,
  Activity,
  CheckCheck,
  Info
} from 'lucide-react';
import { ProcessStep, ProcessCategory, Order, ProcessProgressMap, User } from '../../types';
import { StepAssignment, ResourceBusyInfo, PhaseDefinition } from './orderFormTypes';
import { SearchableSelect, SelectOption } from '../SearchableSelect';
import {
  getProcessPairRecommendations,
  PairRecommendationItem,
  RecommendationContext
} from '../../utils/aiRecommendationEngine';

interface ProcessDetailPanelProps {
  stepIndex: number | null;
  currentProcesses: ProcessStep[];
  stepAssignments: Record<number, StepAssignment>;
  phases: PhaseDefinition[];
  equipmentOptions: SelectOption[];
  operatorOptions: SelectOption[];
  busyMachinesMap: Map<string, ResourceBusyInfo>;
  busyWorkersMap: Map<string, ResourceBusyInfo>;
  orderContext?: RecommendationContext;
  orders?: Record<string, Order>;
  processProgressMap?: ProcessProgressMap;
  usersList?: User[];
  onClose: () => void;
  onNavigateStep: (direction: 'PREV' | 'NEXT') => void;
  onStepMachineChange: (idx: number, machine: string) => void;
  onStepWorkerChange: (idx: number, worker: string) => void;
  onStepDurationChange: (idx: number, hours: number) => void;
  onUpdateProcessField: (idx: number, field: keyof ProcessStep, value: any) => void;
  onDuplicateStep: (idx: number) => void;
  onDeleteStep: (idx: number) => void;
  onApplyRecommendedPair?: (idx: number, worker: string, machine: string) => void;
}

export const ProcessDetailPanel: React.FC<ProcessDetailPanelProps> = ({
  stepIndex,
  currentProcesses,
  stepAssignments,
  phases,
  equipmentOptions,
  operatorOptions,
  busyMachinesMap,
  busyWorkersMap,
  orderContext = {},
  orders,
  processProgressMap,
  usersList,
  onClose,
  onNavigateStep,
  onStepMachineChange,
  onStepWorkerChange,
  onStepDurationChange,
  onUpdateProcessField,
  onDuplicateStep,
  onDeleteStep,
  onApplyRecommendedPair,
}) => {
  const [activeTab, setActiveTab] = useState<'BASIC' | 'RECOMMENDATION' | 'HISTORY' | 'INSTRUCTION'>('BASIC');
  const [expandedEvidenceRank, setExpandedEvidenceRank] = useState<number | null>(null);
  const [selectedAuditRank, setSelectedAuditRank] = useState<number | null>(null);

  const proc = stepIndex !== null && currentProcesses[stepIndex] ? currentProcesses[stepIndex] : null;

  // Extract available machine & operator lists for recommendations
  const availableMachines = useMemo(() => {
    return equipmentOptions
      .map((o) => o.value)
      .filter((v): v is string => typeof v === 'string' && !!v && !v.includes('미지정'));
  }, [equipmentOptions]);

  const availableOperators = useMemo(() => {
    return operatorOptions
      .map((o) => o.value)
      .filter((v): v is string => typeof v === 'string' && !!v && !v.includes('미지정'));
  }, [operatorOptions]);

  // Calculate AI Pair Recommendations based on Historical Decisions + Real MES Orders
  const pairRecommendations = useMemo(() => {
    if (!proc) return [];
    return getProcessPairRecommendations(
      orderContext,
      proc,
      busyMachinesMap,
      busyWorkersMap,
      availableMachines,
      availableOperators,
      orders,
      processProgressMap,
      usersList
    );
  }, [
    orderContext,
    proc,
    busyMachinesMap,
    busyWorkersMap,
    availableMachines,
    availableOperators,
    orders,
    processProgressMap,
    usersList,
  ]);

  if (stepIndex === null || !proc) {
    return (
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col items-center justify-center text-center h-full">
        <div className="p-3 bg-slate-100 rounded-full text-slate-400 mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h4 className="font-extrabold text-sm text-slate-800 mb-1">공정 상세 정보</h4>
        <p className="text-xs text-slate-500 max-w-[220px]">
          왼쪽 공정 목록에서 세부 설정할 공정을 클릭하여 선택하세요.
        </p>
      </div>
    );
  }

  const assign = stepAssignments[stepIndex];
  const currentMach = assign !== undefined ? assign.machine : (proc.assignedMachine || '');
  const currentWork = assign !== undefined ? assign.worker : (proc.worker || proc.assignedWorker || '');

  const isMachBusy = currentMach ? busyMachinesMap.has(currentMach) : false;
  const isWorkBusy = currentWork ? busyWorkersMap.has(currentWork.trim()) : false;
  const isComplete = !!(currentMach && currentWork);
  const hasConflict = isMachBusy || isWorkBusy;

  // Phase Name lookup
  const phaseDef = phases.find((p) => p.id === proc.phaseId);
  const phaseNumber = phases.findIndex((p) => p.id === proc.phaseId) + 1 || 1;

  const handleSelectRecommendation = (rec: PairRecommendationItem) => {
    if (onApplyRecommendedPair) {
      onApplyRecommendedPair(stepIndex, rec.worker, rec.machine);
    } else {
      onStepWorkerChange(stepIndex, rec.worker);
      onStepMachineChange(stepIndex, rec.machine);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 flex flex-col h-full overflow-hidden">
      {/* Top Header */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="font-black text-xs text-slate-900 truncate">공정 상세 정보</h3>
        </div>

        <div className="flex items-center gap-1">
          {/* Prev / Next Navigation */}
          <button
            type="button"
            disabled={stepIndex <= 0}
            onClick={() => onNavigateStep('PREV')}
            className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer"
            title="이전 공정"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] font-bold text-slate-500 px-1">
            {stepIndex + 1}/{currentProcesses.length}
          </span>
          <button
            type="button"
            disabled={stepIndex >= currentProcesses.length - 1}
            onClick={() => onNavigateStep('NEXT')}
            className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer"
            title="다음 공정"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-slate-200 mx-1" />

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Process Header Summary Banner */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
              {phaseDef ? phaseDef.name.split(':')[0] : `Phase ${phaseNumber}`}
            </span>
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                proc.category === '가공'
                  ? 'bg-blue-100 text-blue-900 border border-blue-200'
                  : proc.category === '연마'
                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                  : proc.category === '품질'
                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
              }`}
            >
              {proc.category}
            </span>
            <h4 className="font-extrabold text-xs text-slate-900 truncate">{proc.name}</h4>
          </div>
        </div>

        {/* Completion status indicator */}
        <div className="shrink-0">
          {isComplete ? (
            hasConflict ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                설비/작업자 충돌
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                배정 완료
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              미배정
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-2 pt-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('BASIC')}
          className={`px-3 py-1.5 font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'BASIC'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          기본 설정
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('RECOMMENDATION')}
          className={`px-3 py-1.5 font-bold border-b-2 transition cursor-pointer flex items-center gap-1 ${
            activeTab === 'RECOMMENDATION'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sparkles className="w-3 h-3 text-indigo-600" />
          AI 추천 분석
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('HISTORY')}
          className={`px-3 py-1.5 font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'HISTORY'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          공정 이력
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('INSTRUCTION')}
          className={`px-3 py-1.5 font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'INSTRUCTION'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          작업 지침
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {activeTab === 'BASIC' && (
          <>
            {/* 1. 공정 기본 정보 */}
            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  공정명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={proc.name}
                  onChange={(e) => onUpdateProcessField(stepIndex, 'name', e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">공정 구분</label>
                  <select
                    value={proc.category}
                    onChange={(e) =>
                      onUpdateProcessField(stepIndex, 'category', e.target.value as ProcessCategory)
                    }
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold text-slate-800 bg-white"
                  >
                    <option value="가공">가공</option>
                    <option value="연마">연마</option>
                    <option value="품질">품질</option>
                    <option value="외주">외주</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Phase (단계)</label>
                  <select
                    value={proc.phaseId || (phases[0] && phases[0].id) || ''}
                    onChange={(e) => onUpdateProcessField(stepIndex, 'phaseId', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-white font-medium"
                  >
                    {phases.map((p, pIdx) => (
                      <option key={p.id} value={p.id}>
                        Phase {pIdx + 1}: {p.name.split(':')[0]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. 설비 및 담당자 선택 */}
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  설비 및 담당자 배정
                </span>
                {hasConflict && (
                  <span className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5">
                    <AlertCircle className="w-3 h-3" />
                    충돌 발생
                  </span>
                )}
              </div>

              {/* 설비 선택 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">지정 설비</label>
                <SearchableSelect
                  options={equipmentOptions}
                  value={currentMach}
                  onChange={(val) => onStepMachineChange(stepIndex, val)}
                  placeholder="설비를 선택하세요"
                  className="w-full text-xs"
                />
                {isMachBusy && (
                  <div className="mt-1 text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded flex items-center gap-1 border border-amber-200">
                    <AlertTriangle className="w-3 h-3 shrink-0 text-amber-600" />
                    <span>
                      <strong>{currentMach}</strong> : 타 수주에서 가동 중입니다.
                    </span>
                  </div>
                )}
              </div>

              {/* 담당자 선택 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">담당 작업자</label>
                <SearchableSelect
                  options={operatorOptions}
                  value={currentWork}
                  onChange={(val) => onStepWorkerChange(stepIndex, val)}
                  placeholder="작업자를 선택하세요"
                  className="w-full text-xs"
                />
                {isWorkBusy && (
                  <div className="mt-1 text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded flex items-center gap-1 border border-amber-200">
                    <AlertTriangle className="w-3 h-3 shrink-0 text-amber-600" />
                    <span>
                      <strong>{currentWork}</strong> : 현재 타 공정 작업 중입니다.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. 소요시간 설정 */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">표준 소요시간</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={proc.estimatedHours || proc.durationHours || 1.0}
                    onChange={(e) => onStepDurationChange(stepIndex, parseFloat(e.target.value) || 1.0)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                  <span className="text-slate-500 font-bold">h</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">실제 평균 소요시간</label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    readOnly
                    value={`${pairRecommendations[0]?.metrics?.avgActualHours || proc.durationHours || 1.0} h`}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono bg-slate-50 text-slate-600 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 4. 공정 특이사항 / 비고 */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                특이사항 및 작업 지침
              </label>
              <textarea
                rows={2}
                value={proc.description || ''}
                onChange={(e) => onUpdateProcessField(stepIndex, 'description', e.target.value)}
                placeholder="공정 세부 지침 및 특이사항을 입력하세요."
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 5. AI 공정 배정 추천 (담당자 + 설비 통합 조합 추천 카드) */}
            <div className="bg-slate-50/90 border border-indigo-200 rounded-xl p-3 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 bg-indigo-100 text-indigo-700 rounded-md">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-extrabold text-xs text-indigo-950">
                    AI 공정 배정 추천 (담당자 + 설비)
                  </span>
                </div>
                <span className="text-[10px] text-indigo-800 font-black bg-indigo-100/80 px-2 py-0.5 rounded-full border border-indigo-200">
                  실제 MES 생산 실적 기반
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-snug">
                동일·유사 공정 수행 이력, 작업 품질(불량률·이상조치), 장비 가동 상태 및 팀 실적을 종합 산출한 추천안입니다.
              </p>

              {/* 1st, 2nd, 3rd Recommendation Cards */}
              <div className="space-y-2.5">
                {pairRecommendations.map((rec) => {
                  const isCurrentSelection =
                    currentWork === rec.worker && currentMach === rec.machine;
                  const isExpanded = expandedEvidenceRank === rec.rank;

                  return (
                    <div
                      key={rec.rank}
                      className={`p-3 rounded-xl border transition ${
                        isCurrentSelection
                          ? 'bg-blue-50/95 border-blue-400 ring-1 ring-blue-300'
                          : 'bg-white border-slate-200 hover:border-indigo-300 shadow-2xs'
                      }`}
                    >
                      {/* Top row: Rank, Operator + Machine, Score, Status dot, Apply Button */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap leading-none ${
                              rec.rank === 1
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : rec.rank === 2
                                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {rec.rank}순위
                          </span>

                          <div className="flex items-center gap-1 font-black text-xs text-slate-900 truncate">
                            <span className="text-emerald-800">{rec.worker}</span>
                            <span className="text-slate-400 font-normal">·</span>
                            <span className="text-blue-800">{rec.machine}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Fit Score Badge */}
                          <span
                            className={`inline-flex items-center justify-center text-[11px] font-black px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 leading-none shadow-2xs ${
                              rec.score >= 90
                                ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                : rec.score >= 80
                                ? 'bg-blue-100 text-blue-950 border border-blue-300'
                                : 'bg-amber-100 text-amber-950 border border-amber-300'
                            }`}
                          >
                            적합도 {rec.score}%
                          </span>

                          {/* Machine Status Dot */}
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              rec.machineStatus === '대기'
                                ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                : rec.machineStatus === '외주'
                                ? 'text-amber-700 bg-amber-50 border border-amber-200'
                                : 'text-rose-700 bg-rose-50 border border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                rec.machineStatus === '대기'
                                  ? 'bg-emerald-500'
                                  : rec.machineStatus === '외주'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            {rec.machineStatus}
                          </span>

                          {/* Selection Button */}
                          <button
                            type="button"
                            onClick={() => handleSelectRecommendation(rec)}
                            className={`px-2.5 py-1 text-[11px] font-black rounded transition cursor-pointer active:scale-95 ${
                              isCurrentSelection
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white hover:bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {isCurrentSelection ? '적용됨' : '선택'}
                          </button>
                        </div>
                      </div>

                      {/* Data Scarcity Notice if applicable */}
                      {!rec.isDataSufficient && (
                        <div className="mt-2 p-1.5 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-900 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>추천 데이터 부족: 유사 공정 이력 {rec.metrics.similarProcessCount}건으로 추천 신뢰도가 낮습니다.</span>
                        </div>
                      )}

                      {/* Recommendation Evidence Bullets (Numerical MES Metrics) */}
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <div className="text-[11px] font-bold text-slate-800 mb-1 flex items-center gap-1">
                          <BarChart3 className="w-3 h-3 text-indigo-600" />
                          <span>추천 근거 (실제 MES 데이터)</span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-700 bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                          <div>
                            • 유사 공정 수행: <strong className="text-slate-900">{rec.metrics.similarProcessCount}회</strong>
                          </div>
                          <div>
                            • 동일 설비 조합: <strong className="text-slate-900">{rec.metrics.pairCount}회</strong>
                          </div>
                          <div>
                            • 공정 정상 완료율: <strong className="text-emerald-700">{rec.metrics.completionRate}%</strong>
                          </div>
                          <div>
                            • 이상조치 발생: <strong className={rec.metrics.issueCount > 0 ? 'text-amber-700' : 'text-slate-900'}>{rec.metrics.issueCount}회</strong>
                          </div>
                          <div>
                            • 불량률: <strong className={rec.metrics.defectRate > 0 ? 'text-rose-700' : 'text-emerald-700'}>{rec.metrics.defectRate}%</strong>
                          </div>
                          <div>
                            • 작업시간 성과: <strong className="text-blue-700">{rec.metrics.stdTimeRatio}%</strong> ({rec.metrics.avgActualHours}h)
                          </div>
                          <div className="col-span-2 text-[10px] text-slate-500 pt-0.5 border-t border-slate-200/60 flex items-center justify-between">
                            <span>
                              • 최근 동일 계열 공정 수행: <strong>{rec.metrics.lastPerformedDaysAgo !== null ? `${rec.metrics.lastPerformedDaysAgo}일 전` : '이력 없음'}</strong> ({rec.metrics.lastPerformedDate})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Toggle Evidence Breakdown */}
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="text-[10px] text-slate-500 truncate max-w-[200px]">
                          {rec.primaryReason}
                        </span>

                        <button
                          type="button"
                          onClick={() => setExpandedEvidenceRank(isExpanded ? null : rec.rank)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 shrink-0 flex items-center gap-0.5 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200"
                        >
                          {isExpanded ? '근거 접기' : '근거 보기'}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Expandable Evidence Details (Score Breakdown + Team Stats + Historical Audit Log) */}
                      {isExpanded && (
                        <div className="mt-2.5 p-2.5 bg-slate-900 text-white rounded-xl text-xs space-y-3 shadow-md">
                          {/* 1. Score Breakdown Table */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                              <span className="font-extrabold text-blue-400 flex items-center gap-1">
                                <Award className="w-3.5 h-3.5" />
                                추천 점수 산정 근거 ({rec.score}점)
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                5대 평가 지표 종합
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                              <div className="flex justify-between bg-slate-800/80 px-2 py-1 rounded">
                                <span className="text-slate-300 font-sans">경험 적합성</span>
                                <span className="font-bold text-emerald-400">{rec.scoreBreakdown.experienceScore}/30</span>
                              </div>
                              <div className="flex justify-between bg-slate-800/80 px-2 py-1 rounded">
                                <span className="text-slate-300 font-sans">설비 적합성</span>
                                <span className="font-bold text-emerald-400">{rec.scoreBreakdown.machineScore}/25</span>
                              </div>
                              <div className="flex justify-between bg-slate-800/80 px-2 py-1 rounded">
                                <span className="text-slate-300 font-sans">품질 및 안정성</span>
                                <span className="font-bold text-emerald-400">{rec.scoreBreakdown.qualityScore}/20</span>
                              </div>
                              <div className="flex justify-between bg-slate-800/80 px-2 py-1 rounded">
                                <span className="text-slate-300 font-sans">팀 적합성</span>
                                <span className="font-bold text-emerald-400">{rec.scoreBreakdown.teamScore}/15</span>
                              </div>
                              <div className="flex justify-between bg-slate-800/80 px-2 py-1 rounded col-span-2">
                                <span className="text-slate-300 font-sans">최근 작업 이력</span>
                                <span className="font-bold text-emerald-400">{rec.scoreBreakdown.recencyScore}/10</span>
                              </div>
                            </div>
                          </div>

                          {/* 2. Team Fit Analysis */}
                          <div className="p-2 bg-slate-800/90 rounded-lg text-[11px] space-y-1 border border-slate-700">
                            <div className="flex items-center justify-between font-bold text-slate-200">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-indigo-400" />
                                소속 팀: {rec.metrics.teamName}
                              </span>
                              <span className="text-[10px] text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-700">
                                팀 적합도: {rec.metrics.teamFitLevel}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-300">
                              팀 유사 공정 수행 <strong>{rec.metrics.teamSimilarCount}회</strong> | 정상 완료율 <strong>{rec.metrics.teamCompletionRate}%</strong> | 최근 이상조치 <strong>{rec.metrics.teamRecentIssues}건</strong>
                            </p>
                          </div>

                          {/* 3. Historical Audit Log Summary Table */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                              <span className="flex items-center gap-1">
                                <History className="w-3 h-3 text-blue-400" />
                                과거 공정 이력 목록 (최근 작업 로그)
                              </span>
                              <span className="text-[10px] text-slate-400">
                                최근 {rec.auditHistoryList.length}건 표시
                              </span>
                            </div>

                            <div className="max-h-40 overflow-y-auto rounded border border-slate-800">
                              <table className="w-full text-[10px] text-left">
                                <thead className="bg-slate-800 text-slate-300 sticky top-0 font-bold">
                                  <tr>
                                    <th className="p-1">작업일</th>
                                    <th className="p-1">고객사/수주명</th>
                                    <th className="p-1">공정명</th>
                                    <th className="p-1">시간</th>
                                    <th className="p-1">품질</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 text-slate-300">
                                  {rec.auditHistoryList.map((aud, aIdx) => (
                                    <tr key={aud.id || aIdx} className="hover:bg-slate-800/50">
                                      <td className="p-1 font-mono">{aud.dateStr}</td>
                                      <td className="p-1 truncate max-w-[80px]" title={aud.orderName}>
                                        {aud.customer}
                                      </td>
                                      <td className="p-1 truncate max-w-[80px]" title={aud.processName}>
                                        {aud.processName}
                                      </td>
                                      <td className="p-1 font-mono">{aud.actualHours}h</td>
                                      <td className="p-1">
                                        {aud.hasDefect ? (
                                          <span className="text-rose-400 font-bold">불량</span>
                                        ) : aud.hasIssue ? (
                                          <span className="text-amber-400 font-bold">이상조치</span>
                                        ) : (
                                          <span className="text-emerald-400 font-bold">정상</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </>
        )}

        {activeTab === 'RECOMMENDATION' && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <h4 className="font-black text-blue-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                AI 추천 시스템 데이터 검증 및 알고리즘
              </h4>
              <p className="text-[11px] text-blue-900 leading-relaxed">
                본 MES 추천 엔진은 임의의 점수를 생성하지 않고, MES 데이터베이스에 저장된 실제 생산 실적(완료율, 불량률, Andon 이상조치 횟수, 표준시간 대비 성과, 소속 팀 실적)을 통계적으로 분석하여 최적 조합을 도출합니다.
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-slate-800">현재 공정 분석 메타데이터:</h5>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5 font-bold">
                <div className="flex justify-between">
                  <span className="text-slate-500">고객사:</span>
                  <span className="text-slate-900">{orderContext.customer || '미지정'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">품목/규격:</span>
                  <span className="text-slate-900">{orderContext.partName || '정밀 가공품'} ({orderContext.spec || '-'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">공정명 / 구분:</span>
                  <span className="text-blue-700">{proc.name} ({proc.category})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">표준 소요시간:</span>
                  <span className="font-mono text-slate-800">{proc.estimatedHours || proc.durationHours || 2.0}h</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'HISTORY' && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-600 text-[11px] font-bold">
              MES에 기록된 해당 공정의 최근 작업 및 설비 실적:
            </p>
            <div className="space-y-2">
              {pairRecommendations[0]?.auditHistoryList?.slice(0, 5).map((rec, idx) => (
                <div key={rec.id || idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-900">{rec.orderName} ({rec.customer})</span>
                    <span className="text-[10px] font-mono text-slate-500">{rec.dateStr}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 flex justify-between">
                    <span>담당자/설비: <strong>{rec.worker}</strong> / <strong>{rec.machine}</strong></span>
                    <span className="font-mono">{rec.actualHours}h 소요</span>
                  </div>
                  <div className="text-[10px] flex items-center gap-2 pt-1 border-t border-slate-200">
                    <span className={rec.isCompleted ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                      {rec.isCompleted ? '● 정상 완료' : '○ 진행중'}
                    </span>
                    {rec.hasIssue && <span className="text-amber-700 font-bold">⚠️ 이상조치 이력</span>}
                    {rec.hasDefect && <span className="text-rose-700 font-bold">❌ 불량 발생</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'INSTRUCTION' && (
          <div className="space-y-2 text-xs">
            <p className="text-slate-500 text-[11px]">작업 표준 지시서 및 도면 요구사항:</p>
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs space-y-1">
              <span className="font-black block">※ 주요 품질 주의 사항</span>
              <p className="text-[11px] leading-relaxed">
                공정 완료 후 외관 스크래치 및 립 치수(±0.002mm) 정밀 검사 필수. 이상 발생 시 즉시 Andon 이상 보고서를 발행하십시오.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDuplicateStep(stepIndex)}
            className="p-1.5 text-slate-600 hover:text-blue-700 rounded border border-slate-200 bg-white hover:bg-blue-50 transition cursor-pointer"
            title="공정 복제"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteStep(stepIndex)}
            className="p-1.5 text-slate-600 hover:text-rose-700 rounded border border-slate-200 bg-white hover:bg-rose-50 transition cursor-pointer"
            title="공정 삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
        >
          <Save className="w-3.5 h-3.5" />
          <span>저장 및 닫기</span>
        </button>
      </div>
    </div>
  );
};
