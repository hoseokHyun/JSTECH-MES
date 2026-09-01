import React, { useState } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { ProcessStep, ProcessCategory } from '../../types';
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

  if (stepIndex === null || !currentProcesses[stepIndex]) {
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

  const proc = currentProcesses[stepIndex];
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

  // Extract available machine & operator lists for recommendations
  const availableMachines = equipmentOptions
    .map((o) => o.value)
    .filter((v): v is string => typeof v === 'string' && !!v && !v.includes('미지정'));

  const availableOperators = operatorOptions
    .map((o) => o.value)
    .filter((v): v is string => typeof v === 'string' && !!v && !v.includes('미지정'));

  // Calculate AI Pair Recommendations based on Historical Decisions + Order Context
  const pairRecommendations = getProcessPairRecommendations(
    orderContext,
    proc,
    busyMachinesMap,
    busyWorkersMap,
    availableMachines,
    availableOperators
  );

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

          {/* Close Panel Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200 transition cursor-pointer"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Process Title & Status Sub-header */}
      <div className="p-3 bg-white border-b border-slate-100 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 whitespace-nowrap">
              {proc.code || `OP${String(stepIndex + 1).padStart(3, '0')}`}
            </span>
            <span className="font-black text-sm text-slate-900 truncate">
              {proc.name}
            </span>
          </div>

          <div className="shrink-0">
            {hasConflict ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>오류/충돌</span>
              </span>
            ) : isComplete ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>배정 완료</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                <span>미지정</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-bold">
          <span>Phase {phaseNumber}</span>
          <span>•</span>
          <span>{proc.category === '품질' ? 'CMM 검사' : `${proc.category} 공정`}</span>
          <span>•</span>
          <span>예상 {proc.estimatedHours || 1.0}h</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 px-3 bg-slate-50/50 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('BASIC')}
          className={`py-2 px-2.5 border-b-2 transition cursor-pointer ${
            activeTab === 'BASIC'
              ? 'border-blue-600 text-blue-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          기본 설정
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('RECOMMENDATION')}
          className={`py-2 px-2.5 border-b-2 transition cursor-pointer flex items-center gap-1 ${
            activeTab === 'RECOMMENDATION'
              ? 'border-indigo-600 text-indigo-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>AI 추천 근거</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('HISTORY')}
          className={`py-2 px-2.5 border-b-2 transition cursor-pointer ${
            activeTab === 'HISTORY'
              ? 'border-blue-600 text-blue-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          과거 이력
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('INSTRUCTION')}
          className={`py-2 px-2.5 border-b-2 transition cursor-pointer ${
            activeTab === 'INSTRUCTION'
              ? 'border-blue-600 text-blue-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          작업 지침
        </button>
      </div>

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 text-xs">
        {activeTab === 'BASIC' && (
          <>
            {/* 1. 공정번호 & 공정명 (공정카드와 상호 연동) */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">공정번호 (OP)</label>
                <input
                  type="text"
                  value={proc.code || `OP${String(stepIndex + 1).padStart(3, '0')}`}
                  onChange={(e) => onUpdateProcessField(stepIndex, 'code', e.target.value)}
                  placeholder="예: OP001"
                  className="w-full text-xs font-mono font-black px-2.5 py-1.5 border border-slate-300 rounded-lg text-blue-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">공정명 *</label>
                <input
                  type="text"
                  value={proc.name}
                  onChange={(e) => onUpdateProcessField(stepIndex, 'name', e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg font-black text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 2. 공정 유형 & Phase 선택 */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">공정 유형</label>
                <select
                  value={proc.category}
                  onChange={(e) =>
                    onUpdateProcessField(stepIndex, 'category', e.target.value as ProcessCategory)
                  }
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg font-bold bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="가공">가공</option>
                  <option value="연마">연마</option>
                  <option value="품질">품질 (CMM)</option>
                  <option value="외주">외주</option>
                  <option value="조립">조립</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">소속 Phase</label>
                <select
                  value={proc.phaseId || phases[0]?.id || ''}
                  onChange={(e) => onUpdateProcessField(stepIndex, 'phaseId', e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg font-bold bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {phases.map((p, pIdx) => (
                    <option key={p.id} value={p.id}>
                      Phase {pIdx + 1}: {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. 담당자 & 표준 설비 SearchableSelect (Manager Decision Area) */}
            <div className="space-y-2.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                  🛠️ 생산관리자 직접 배정
                </span>
                <span className="text-[10px] text-slate-500 font-bold">최종 결정권: 관리자</span>
              </div>

              {/* 담당자 배정 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> 담당자 배정
                  </label>
                  {isWorkBusy && (
                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                      ⚠️ 다른 작업 진행 중
                    </span>
                  )}
                </div>
                <div className="text-slate-900">
                  <SearchableSelect
                    options={operatorOptions}
                    value={currentWork}
                    onChange={(val) => onStepWorkerChange(stepIndex, val)}
                    placeholder="담당자 선택..."
                    icon={UserCheck}
                  />
                </div>
              </div>

              {/* 표준 설비 배정 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-blue-600" /> 표준 설비 배정
                  </label>
                  {isMachBusy && (
                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                      ⚠️ 다른 수주 가동 중
                    </span>
                  )}
                </div>
                <div className="text-slate-900">
                  <SearchableSelect
                    options={equipmentOptions}
                    value={currentMach}
                    onChange={(val) => onStepMachineChange(stepIndex, val)}
                    placeholder="설비 선택..."
                    icon={Cpu}
                  />
                </div>
              </div>
            </div>

            {/* 4. 예상 작업시간 */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> 예상 작업시간
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={proc.estimatedHours || 1.0}
                    onChange={(e) => onStepDurationChange(stepIndex, parseFloat(e.target.value) || 1.0)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                  <span className="text-slate-500 font-bold">h</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">실제 소요시간</label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    readOnly
                    value="- h"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono bg-slate-50 text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* 5. 공정 특이사항 / 비고 */}
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

            {/* 6. AI 공정 배정 추천 (담당자 + 설비 통합 조합 추천 카드) */}
            <div className="bg-gradient-to-br from-indigo-50/90 via-blue-50/90 to-purple-50/90 border border-indigo-200 rounded-xl p-3 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                  <span className="font-extrabold text-xs text-indigo-950">
                    AI 공정 배정 추천 (담당자 + 설비)
                  </span>
                </div>
                <span className="text-[10px] text-indigo-700 font-black bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200">
                  과거 의사결정 학습
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-snug">
                수주 정보와 과거 생산관리 의사결정 이력을 종합하여 가장 적합한 조합을 추천합니다.
              </p>

              {/* 1st, 2nd, 3rd Recommendation Cards */}
              <div className="space-y-2">
                {pairRecommendations.map((rec) => {
                  const isCurrentSelection =
                    currentWork === rec.worker && currentMach === rec.machine;

                  return (
                    <div
                      key={rec.rank}
                      className={`p-2.5 rounded-lg border transition ${
                        isCurrentSelection
                          ? 'bg-blue-50/90 border-blue-300 ring-1 ring-blue-300'
                          : 'bg-white border-indigo-100 hover:border-indigo-300 shadow-2xs'
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
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-slate-100 text-slate-600'
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
                            className={`inline-flex items-center justify-center text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 leading-none shadow-2xs ${
                              rec.score >= 90
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : rec.score >= 80
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            적합도 {rec.score}%
                          </span>

                          {/* Machine Status Dot */}
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              rec.machineStatus === '대기'
                                ? 'text-emerald-700 bg-emerald-50'
                                : rec.machineStatus === '외주'
                                ? 'text-amber-700 bg-amber-50'
                                : 'text-rose-700 bg-rose-50'
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
                            className={`px-2 py-1 text-[11px] font-black rounded transition cursor-pointer active:scale-95 ${
                              isCurrentSelection
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-white hover:bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {isCurrentSelection ? '적용됨' : '선택'}
                          </button>
                        </div>
                      </div>

                      {/* Recommendation Reason */}
                      <div className="mt-1.5 pt-1.5 border-t border-indigo-50 flex items-start justify-between gap-1 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-bold text-indigo-900 shrink-0">추천 이유:</span>
                          <span className="truncate">{rec.primaryReason}</span>
                        </div>

                        {/* Toggle Evidence Breakdown */}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedEvidenceRank(
                              expandedEvidenceRank === rec.rank ? null : rec.rank
                            )
                          }
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 shrink-0 flex items-center gap-0.5 cursor-pointer"
                        >
                          {expandedEvidenceRank === rec.rank ? '접기' : '근거 보기'}
                          {expandedEvidenceRank === rec.rank ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {/* Expandable Evidence Details */}
                      {expandedEvidenceRank === rec.rank && (
                        <div className="mt-2 p-2 bg-indigo-50/70 rounded-lg text-[11px] space-y-1 text-slate-700 animate-in fade-in duration-150">
                          <span className="font-bold text-indigo-950 block">📊 세부 추천 근거:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                            {rec.evidenceList.map((ev, eIdx) => (
                              <li key={eIdx}>{ev}</li>
                            ))}
                          </ul>
                          {rec.sampleSimilarOrders && rec.sampleSimilarOrders.length > 0 && (
                            <div className="mt-1 pt-1 border-t border-indigo-100 text-[10px] text-slate-500">
                              <span className="font-bold">참조 유사 수주: </span>
                              {rec.sampleSimilarOrders.map((o) => `${o.orderName} (${o.customer})`).join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  추천과 다른 값을 직접 선택하셔도 정상 반영되며, 향후 추천 품질을 높이는 학습 데이터로 활용됩니다.
                </span>
              </div>
            </div>
          </>
        )}

        {activeTab === 'RECOMMENDATION' && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <h4 className="font-black text-blue-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                AI 추천 시스템 동작 원리
              </h4>
              <p className="text-[11px] text-blue-900 leading-relaxed">
                본 MES의 AI 추천은 단순 설비 추천이 아닌, 과거 수주([고객사] + [품목] + [규격] + [공정])에서 생산관리자가 내린 담당자 및 설비 배정 의사결정 데이터를 지속적으로 학습합니다.
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-slate-700">현재 공정 분석 결과:</h5>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5 font-bold">
                <div className="flex justify-between">
                  <span className="text-slate-500">대상 고객사:</span>
                  <span className="text-slate-900">{orderContext.customer || '미지정'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">품목/규격:</span>
                  <span className="text-slate-900">{orderContext.partName || 'SLOT DIE'} ({orderContext.spec || '-'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">공정명 / 유형:</span>
                  <span className="text-blue-700">{proc.name} ({proc.category})</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'HISTORY' && (
          <div className="space-y-2 text-xs">
            <p className="text-slate-500 text-[11px]">과거 이 공정에서 작업된 주요 설비/담당자 이력:</p>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex justify-between font-bold text-slate-800">
                <span>최근 작업 설비:</span>
                <span className="text-blue-700">{proc.assignedMachine || 'MCT 5호기 #1'}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-800">
                <span>최근 작업자:</span>
                <span className="text-blue-700">{proc.worker || '박세령 (가공)'}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-800">
                <span>평균 가동시간:</span>
                <span className="font-mono">{proc.estimatedHours || 2.5}h</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'INSTRUCTION' && (
          <div className="space-y-2 text-xs">
            <p className="text-slate-500 text-[11px]">작업 표준 지시서 및 도면 요구사항:</p>
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs space-y-1">
              <span className="font-black block">※ 주요 주의 사항</span>
              <p className="text-[11px] leading-relaxed">
                공정 완료 후 외관 스크래치 및 립 치수(±0.002mm) 정밀 검사 필수. 이상 발생 시 즉시 긴급 이상 보고서를 발행하십시오.
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
