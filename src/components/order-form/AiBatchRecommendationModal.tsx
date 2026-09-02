import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Filter,
  ArrowRight,
  UserCheck,
  Cpu,
  RefreshCw,
  Info,
  CheckSquare,
  Square,
  Sliders,
  ChevronDown,
  BarChart3,
  Award,
  AlertCircle
} from 'lucide-react';
import { ProcessStep, ProcessCategory, Order, ProcessProgressMap, User } from '../../types';
import { StepAssignment, ResourceBusyInfo, PhaseDefinition } from './orderFormTypes';
import {
  getProcessPairRecommendations,
  PairRecommendationItem,
  RecommendationContext
} from '../../utils/aiRecommendationEngine';

export interface AiBatchApplyResult {
  stepIndex: number;
  recommendedWorker: string;
  recommendedMachine: string;
  appliedWorker: string;
  appliedMachine: string;
  score: number;
  reason: string;
  willChangeWorker: boolean;
  willChangeMachine: boolean;
}

interface AiBatchRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProcesses: ProcessStep[];
  stepAssignments: Record<number, StepAssignment>;
  selectedStepIndices: Set<number>;
  phases: PhaseDefinition[];
  busyMachinesMap: Map<string, ResourceBusyInfo>;
  busyWorkersMap: Map<string, ResourceBusyInfo>;
  availableMachines: string[];
  availableOperators: string[];
  orderContext: RecommendationContext;
  orders?: Record<string, Order>;
  processProgressMap?: ProcessProgressMap;
  usersList?: User[];
  onApplyBatchRecommendations: (appliedUpdates: Record<number, StepAssignment>) => void;
}

type ScopeFilterType =
  | 'SELECTED'
  | 'ALL'
  | 'UNASSIGNED_ANY'
  | 'UNASSIGNED_MACHINE'
  | 'UNASSIGNED_WORKER'
  | 'CURRENT_PHASE'
  | 'CONFLICT_ONLY';

export const AiBatchRecommendationModal: React.FC<AiBatchRecommendationModalProps> = ({
  isOpen,
  onClose,
  currentProcesses,
  stepAssignments,
  selectedStepIndices,
  phases,
  busyMachinesMap,
  busyWorkersMap,
  availableMachines,
  availableOperators,
  orderContext,
  orders,
  processProgressMap,
  usersList,
  onApplyBatchRecommendations,
}) => {
  // Scope filter state
  const [scopeFilter, setScopeFilter] = useState<ScopeFilterType>(
    selectedStepIndices.size > 0 ? 'SELECTED' : 'UNASSIGNED_ANY'
  );
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>(phases[0]?.id || '');

  // Protection & Confidence Settings
  const [protectExisting, setProtectExisting] = useState<boolean>(true);
  const [minConfidenceScore, setMinConfidenceScore] = useState<number>(80); // 80% default threshold

  // Map of StepIndex -> Selected candidate rank (1, 2, 3)
  const [selectedRankMap, setSelectedRankMap] = useState<Record<number, number>>({});
  // Set of included step indices for final apply
  const [includedStepIndices, setIncludedStepIndices] = useState<Set<number>>(new Set());

  // 1. Calculate eligible process steps based on Scope Filter
  const eligibleSteps = useMemo(() => {
    return currentProcesses.map((proc, idx) => {
      const assign = stepAssignments[idx];
      const mach = assign !== undefined ? assign.machine : (proc.assignedMachine || '');
      const work = assign !== undefined ? assign.worker : (proc.worker || proc.assignedWorker || '');

      const isMachUnassigned = !mach;
      const isWorkUnassigned = !work;
      const isAnyUnassigned = isMachUnassigned || isWorkUnassigned;
      const isSelected = selectedStepIndices.has(idx);

      const isMachBusy = mach ? busyMachinesMap.has(mach) : false;
      const isWorkBusy = work ? busyWorkersMap.has(work.trim()) : false;
      const hasConflict = isMachBusy || isWorkBusy;

      let inScope = false;
      switch (scopeFilter) {
        case 'SELECTED':
          inScope = isSelected;
          break;
        case 'ALL':
          inScope = true;
          break;
        case 'UNASSIGNED_ANY':
          inScope = isAnyUnassigned;
          break;
        case 'UNASSIGNED_MACHINE':
          inScope = isMachUnassigned;
          break;
        case 'UNASSIGNED_WORKER':
          inScope = isWorkUnassigned;
          break;
        case 'CURRENT_PHASE':
          inScope = proc.phaseId === selectedPhaseFilter;
          break;
        case 'CONFLICT_ONLY':
          inScope = hasConflict;
          break;
      }

      return {
        proc,
        originalIndex: idx,
        currentMachine: mach,
        currentWorker: work,
        inScope,
        hasConflict,
        isMachUnassigned,
        isWorkUnassigned,
      };
    });
  }, [currentProcesses, stepAssignments, selectedStepIndices, scopeFilter, selectedPhaseFilter, busyMachinesMap, busyWorkersMap]);

  // Compute AI Recommendations for all in-scope steps
  const previewItems = useMemo(() => {
    return eligibleSteps
      .filter((s) => s.inScope)
      .map(({ proc, originalIndex, currentMachine, currentWorker, hasConflict }) => {
        const recommendations = getProcessPairRecommendations(
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

        const chosenRank = selectedRankMap[originalIndex] || 1;
        const chosenRec = recommendations[chosenRank - 1] || recommendations[0];

        // Determine what will actually be applied based on protectExisting
        let willApplyMachine = chosenRec.machine;
        let willApplyWorker = chosenRec.worker;

        if (protectExisting) {
          if (currentMachine) willApplyMachine = currentMachine;
          if (currentWorker) willApplyWorker = currentWorker;
        }

        const willChangeMachine = willApplyMachine !== currentMachine;
        const willChangeWorker = willApplyWorker !== currentWorker;
        const isBelowScore = chosenRec.score < minConfidenceScore;

        return {
          originalIndex,
          proc,
          currentMachine,
          currentWorker,
          recommendations,
          chosenRank,
          chosenRec,
          willApplyMachine,
          willApplyWorker,
          willChangeMachine,
          willChangeWorker,
          hasConflict,
          isBelowScore,
        };
      });
  }, [
    eligibleSteps,
    orderContext,
    busyMachinesMap,
    busyWorkersMap,
    availableMachines,
    availableOperators,
    selectedRankMap,
    protectExisting,
    minConfidenceScore,
    orders,
    processProgressMap,
    usersList,
  ]);

  // Auto-initialize included items when preview items change
  React.useEffect(() => {
    const defaultIncluded = new Set<number>();
    previewItems.forEach((item) => {
      // Include by default if it meets minConfidenceScore and will change at least one value
      if (!item.isBelowScore && (item.willChangeMachine || item.willChangeWorker)) {
        defaultIncluded.add(item.originalIndex);
      } else if (!protectExisting) {
        defaultIncluded.add(item.originalIndex);
      }
    });
    setIncludedStepIndices(defaultIncluded);
  }, [scopeFilter, protectExisting, minConfidenceScore, selectedPhaseFilter]);

  if (!isOpen) return null;

  const handleToggleInclude = (idx: number) => {
    setIncludedStepIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const all = new Set(previewItems.map((p) => p.originalIndex));
    setIncludedStepIndices(all);
  };

  const handleDeselectAll = () => {
    setIncludedStepIndices(new Set());
  };

  // Compile final updates and invoke parent
  const handleConfirmBatchApply = () => {
    const appliedUpdates: Record<number, StepAssignment> = {};

    previewItems.forEach((item) => {
      if (includedStepIndices.has(item.originalIndex)) {
        appliedUpdates[item.originalIndex] = {
          machine: item.willApplyMachine,
          worker: item.willApplyWorker,
        };
      }
    });

    onApplyBatchRecommendations(appliedUpdates);
    onClose();
  };

  const appliedItems = previewItems.filter((p) => includedStepIndices.has(p.originalIndex));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* 1. Modal Header */}
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-400/30 text-blue-300">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base tracking-tight text-white">
                  AI 공정 배정 일괄 추천 (담당자 + 설비)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200">
                  실제 MES 생산 실적 기반
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                과거 동일·유사 공정 수행 실적, 품질(불량/이상조치), 설비 가동 상태를 분석하여 전 공정에 최적 배정을 일괄 적용합니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Controls & Scope Filters Bar */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
          {/* Scope selection (7 cols) */}
          <div className="md:col-span-7 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-700 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                추천 적용 대상 범위 (Scope)
              </label>
              <span className="text-[11px] font-bold text-slate-500">
                대상: <strong>{previewItems.length}</strong>개 공정
              </span>
            </div>

            <div className="flex flex-wrap gap-1">
              {selectedStepIndices.size > 0 && (
                <button
                  type="button"
                  onClick={() => setScopeFilter('SELECTED')}
                  className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                    scopeFilter === 'SELECTED'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  선택 공정 ({selectedStepIndices.size}개)
                </button>
              )}

              <button
                type="button"
                onClick={() => setScopeFilter('UNASSIGNED_ANY')}
                className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                  scopeFilter === 'UNASSIGNED_ANY'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                미배정 공정 전체
              </button>

              <button
                type="button"
                onClick={() => setScopeFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                  scopeFilter === 'ALL'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                전체 공정 ({currentProcesses.length}개)
              </button>

              <button
                type="button"
                onClick={() => setScopeFilter('CONFLICT_ONLY')}
                className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                  scopeFilter === 'CONFLICT_ONLY'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                충돌 공정만
              </button>
            </div>
          </div>

          {/* Protection & Score Rules (5 cols) */}
          <div className="md:col-span-5 bg-white p-2.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                보호 및 적합도 설정
              </label>
              <label className="flex items-center gap-1.5 font-bold text-[11px] text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={protectExisting}
                  onChange={(e) => setProtectExisting(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span>기존 수동 배정 보호</span>
              </label>
            </div>

            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600">
              <span>최소 권장 적합도:</span>
              <div className="flex items-center gap-1">
                <input
                  type="range"
                  min="60"
                  max="95"
                  step="5"
                  value={minConfidenceScore}
                  onChange={(e) => setMinConfidenceScore(parseInt(e.target.value, 10))}
                  className="w-20 accent-blue-600 cursor-pointer"
                />
                <span className="font-mono font-black text-blue-700 w-9 text-right">
                  {minConfidenceScore}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Batch Action Table Toolbar */}
        <div className="px-4 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                전체 선택
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                선택 해제
              </button>
            </div>

            <span className="text-[11px] text-slate-500">
              적용 예정: <strong className="text-blue-700">{appliedItems.length}</strong> / {previewItems.length}건
            </span>
          </div>

          <div className="text-[11px] text-slate-500 hidden sm:block">
            ※ 1순위 추천이 기본 설정되며, 필요 시 개별 공정에서 순위를 변경할 수 있습니다.
          </div>
        </div>

        {/* 4. Recommendation Comparison List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {previewItems.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-sm text-slate-700">현재 조건에 해당하는 공정이 없습니다.</p>
              <p className="text-xs text-slate-400 mt-1">상단의 적용 범위(Scope) 필터를 변경해보세요.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {previewItems.map((item) => {
                const isChecked = includedStepIndices.has(item.originalIndex);
                const rec = item.chosenRec;

                return (
                  <div
                    key={item.originalIndex}
                    className={`p-3 rounded-xl border transition ${
                      isChecked
                        ? 'bg-white border-indigo-200 shadow-2xs'
                        : 'bg-slate-100/70 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5">
                      {/* Checkbox & OP Code & Process Name */}
                      <div className="flex items-center gap-2 min-w-0 lg:w-[260px]">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleInclude(item.originalIndex)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                          {item.proc.code || `OP${String(item.originalIndex + 1).padStart(3, '0')}`}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-black text-xs text-slate-900 truncate">
                            {item.proc.name}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-500">
                            {item.proc.category} • {item.proc.estimatedHours || 1.0}h
                          </span>
                        </div>
                      </div>

                      {/* Current Status vs AI Recommendation Comparison */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs w-full">
                        {/* Current Value */}
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 block mb-0.5">현재 배정 상태</span>
                          <div className="flex items-center gap-1.5 font-bold text-slate-700 truncate">
                            <span>{item.currentWorker || '(담당자 미지정)'}</span>
                            <span className="text-slate-300">•</span>
                            <span>{item.currentMachine || '(설비 미지정)'}</span>
                          </div>
                        </div>

                        {/* AI Recommended Pair */}
                        <div className="p-2 rounded-lg bg-indigo-50/80 border border-indigo-200">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-black text-indigo-900 flex items-center gap-1 shrink-0 whitespace-nowrap">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              AI 추천 (Rank {item.chosenRank})
                            </span>
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
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-black text-xs text-indigo-950 truncate">
                              <span>{rec.worker}</span>
                              <span className="text-indigo-300 font-normal">•</span>
                              <span>{rec.machine}</span>
                            </div>

                            {/* Alternative candidate switcher if multiple exist */}
                            {item.recommendations.length > 1 && (
                              <select
                                value={item.chosenRank}
                                onChange={(e) =>
                                  setSelectedRankMap((prev) => ({
                                    ...prev,
                                    [item.originalIndex]: parseInt(e.target.value, 10),
                                  }))
                                }
                                className="text-[11px] font-bold bg-white border border-indigo-200 rounded px-1.5 py-0.5 text-indigo-900 cursor-pointer shrink-0"
                              >
                                {item.recommendations.map((r) => (
                                  <option key={r.rank} value={r.rank}>
                                    {r.rank}순위 ({r.score}%)
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Primary Evidence Pill with Metrics */}
                      <div className="lg:w-[240px] shrink-0 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1">
                        <div className="font-bold text-slate-800 truncate text-[10px]">
                          • 실적: 수행 {rec.metrics.similarProcessCount}회 | 완료율 {rec.metrics.completionRate}%
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>불량률: <strong className={rec.metrics.defectRate > 0 ? 'text-rose-600' : 'text-emerald-600'}>{rec.metrics.defectRate}%</strong></span>
                          <span>이상조치: <strong className="text-slate-800">{rec.metrics.issueCount}회</strong></span>
                          <span className="text-emerald-700 font-bold">{rec.machineStatus}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Modal Footer Action */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600 font-bold flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-600" />
            <span>
              일괄 적용 후에도 공정 목록 및 상세 카드에서 언제든지 개별 수정할 수 있습니다.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              취소
            </button>

            <button
              type="button"
              disabled={appliedItems.length === 0}
              onClick={handleConfirmBatchApply}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-black transition flex items-center gap-1.5 shadow-md disabled:opacity-40 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI 추천 일괄 적용 ({appliedItems.length}건 실행)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
