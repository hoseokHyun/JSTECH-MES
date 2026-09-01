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
  ChevronDown
} from 'lucide-react';
import { ProcessStep, ProcessCategory } from '../../types';
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
          availableOperators
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
  ]);

  // Sync included steps when previewItems change
  React.useEffect(() => {
    if (isOpen) {
      const initialIncluded = new Set<number>();
      previewItems.forEach((item) => {
        if (!item.isBelowScore) {
          initialIncluded.add(item.originalIndex);
        }
      });
      setIncludedStepIndices(initialIncluded);
    }
  }, [isOpen, scopeFilter, protectExisting, minConfidenceScore, previewItems.length]);

  if (!isOpen) return null;

  // Summary statistics
  const totalTargetCount = previewItems.length;
  const highConfidenceCount = previewItems.filter((p) => p.chosenRec.score >= 90).length;
  const mediumConfidenceCount = previewItems.filter((p) => p.chosenRec.score >= 80 && p.chosenRec.score < 90).length;
  const lowConfidenceCount = previewItems.filter((p) => p.chosenRec.score < 80).length;

  const appliedItems = previewItems.filter((p) => includedStepIndices.has(p.originalIndex));
  const willChangeWorkerCount = appliedItems.filter((p) => p.willChangeWorker).length;
  const willChangeMachineCount = appliedItems.filter((p) => p.willChangeMachine).length;
  const unchangedCount = appliedItems.filter((p) => !p.willChangeWorker && !p.willChangeMachine).length;

  const handleToggleInclude = (originalIndex: number) => {
    setIncludedStepIndices((prev) => {
      const next = new Set(prev);
      if (next.has(originalIndex)) {
        next.delete(originalIndex);
      } else {
        next.add(originalIndex);
      }
      return next;
    });
  };

  const handleSelectAllIncluded = () => {
    const all = new Set<number>();
    previewItems.forEach((p) => all.add(p.originalIndex));
    setIncludedStepIndices(all);
  };

  const handleDeselectAllIncluded = () => {
    setIncludedStepIndices(new Set());
  };

  const handleConfirmBatchApply = () => {
    const finalUpdates: Record<number, StepAssignment> = {};

    appliedItems.forEach((item) => {
      finalUpdates[item.originalIndex] = {
        machine: item.willApplyMachine,
        worker: item.willApplyWorker,
      };
    });

    onApplyBatchRecommendations(finalUpdates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* 1. Modal Header */}
        <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between border-b border-indigo-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">AI 공정 배정 추천 일괄 적용</h2>
                <span className="text-[11px] font-extrabold bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded-full">
                  의사결정 학습 모델
                </span>
              </div>
              <p className="text-xs text-slate-300">
                과거 유사 수주 의사결정 및 설비 실시간 상태를 종합 분석하여 최적의 [담당자 + 설비] 조합을 일괄 추천합니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Control Toolbar: Scope Filters, Protection Toggle, Confidence Slider */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Target Scope Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <span className="text-slate-500 dark:text-slate-400 text-[11px] mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> 적용 대상:
              </span>

              {selectedStepIndices.size > 0 && (
                <button
                  type="button"
                  onClick={() => setScopeFilter('SELECTED')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    scopeFilter === 'SELECTED'
                      ? 'bg-blue-600 text-white shadow-2xs font-black'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  선택된 공정 ({selectedStepIndices.size}건)
                </button>
              )}

              <button
                type="button"
                onClick={() => setScopeFilter('UNASSIGNED_ANY')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  scopeFilter === 'UNASSIGNED_ANY'
                    ? 'bg-blue-600 text-white shadow-2xs font-black'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                미배정 공정만 (추천)
              </button>

              <button
                type="button"
                onClick={() => setScopeFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  scopeFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-2xs font-black'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                전체 공정 ({currentProcesses.length}건)
              </button>

              <button
                type="button"
                onClick={() => setScopeFilter('CURRENT_PHASE')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  scopeFilter === 'CURRENT_PHASE'
                    ? 'bg-blue-600 text-white shadow-2xs font-black'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                Phase별 공정
              </button>

              {scopeFilter === 'CURRENT_PHASE' && (
                <select
                  value={selectedPhaseFilter}
                  onChange={(e) => setSelectedPhaseFilter(e.target.value)}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  {phases.map((p, idx) => (
                    <option key={p.id} value={p.id}>
                      Phase {idx + 1}: {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Quick Protection Setting */}
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 cursor-pointer bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={protectExisting}
                  onChange={(e) => setProtectExisting(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>기존 배정값 보호 (미지정 항목만 채움)</span>
              </label>
            </div>
          </div>

          {/* Confidence Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600 dark:text-slate-400">추천 적합도 필터:</span>
              <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setMinConfidenceScore(90)}
                  className={`px-2 py-0.5 rounded transition ${
                    minConfidenceScore === 90
                      ? 'bg-emerald-600 text-white font-black'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  90% 이상 (안전 추천)
                </button>
                <button
                  type="button"
                  onClick={() => setMinConfidenceScore(80)}
                  className={`px-2 py-0.5 rounded transition ${
                    minConfidenceScore === 80
                      ? 'bg-blue-600 text-white font-black'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  80% 이상 (권장)
                </button>
                <button
                  type="button"
                  onClick={() => setMinConfidenceScore(0)}
                  className={`px-2 py-0.5 rounded transition ${
                    minConfidenceScore === 0
                      ? 'bg-slate-700 text-white font-black'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  전체 적용 (제한 없음)
                </button>
              </div>
            </div>

            {/* Quick check/uncheck all in preview */}
            <div className="flex items-center gap-2 text-[11px] font-bold">
              <button
                type="button"
                onClick={handleSelectAllIncluded}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 cursor-pointer"
              >
                미리보기 전체 선택 ({previewItems.length})
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleDeselectAllIncluded}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
              >
                선택 해제
              </button>
            </div>
          </div>
        </div>

        {/* 3. Summary Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">대상 공정</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-slate-900 dark:text-white">{totalTargetCount}</span>
              <span className="text-xs text-slate-500">건</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">고적합도 (90%↑)</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">{highConfidenceCount}</span>
              <span className="text-xs text-emerald-600">건 적용 가능</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
            <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 block">적용 예정 변경</span>
            <div className="flex items-center gap-2 mt-0.5 text-xs font-bold text-blue-900 dark:text-blue-300">
              <span>담당자: {willChangeWorkerCount}건</span>
              <span>•</span>
              <span>설비: {willChangeMachineCount}건</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
            <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 block">최종 일괄 적용</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-indigo-700 dark:text-indigo-400">{appliedItems.length}</span>
              <span className="text-xs text-indigo-600">건 배정 예정</span>
            </div>
          </div>
        </div>

        {/* 4. Interactive Step-by-Step Recommendation Preview Table */}
        <div className="flex-1 overflow-y-auto p-3 bg-slate-50/50 dark:bg-slate-900/50">
          {previewItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
              선택한 조건에 부합하는 대상 공정이 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {previewItems.map((item) => {
                const isChecked = includedStepIndices.has(item.originalIndex);
                const rec = item.chosenRec;

                return (
                  <div
                    key={item.originalIndex}
                    className={`p-2.5 rounded-xl border transition ${
                      isChecked
                        ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 shadow-2xs'
                        : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5">
                      {/* Checkbox & OP Code & Process Name */}
                      <div className="flex items-center gap-2 min-w-0 lg:w-[280px]">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleInclude(item.originalIndex)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="font-mono font-black text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 shrink-0">
                          {item.proc.code || `OP${String(item.originalIndex + 1).padStart(3, '0')}`}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-black text-xs text-slate-900 dark:text-white truncate">
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
                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold text-slate-400 block mb-0.5">현재 배정 상태</span>
                          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 truncate">
                            <span>{item.currentWorker || '(담당자 미지정)'}</span>
                            <span className="text-slate-300">•</span>
                            <span>{item.currentMachine || '(설비 미지정)'}</span>
                          </div>
                        </div>

                        {/* AI Recommended Pair */}
                        <div className="p-2 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1 shrink-0 whitespace-nowrap">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              AI 추천 (Rank {item.chosenRank})
                            </span>
                            <span
                              className={`inline-flex items-center justify-center text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 leading-none shadow-2xs ${
                                rec.score >= 90
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-700'
                                  : rec.score >= 80
                                  ? 'bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-700'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700'
                              }`}
                            >
                              적합도 {rec.score}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-black text-xs text-indigo-950 dark:text-indigo-200 truncate">
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
                                className="text-[11px] font-bold bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded px-1.5 py-0.5 text-indigo-900 dark:text-indigo-300 cursor-pointer shrink-0"
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

                      {/* Primary Evidence Pill */}
                      <div className="lg:w-[220px] shrink-0 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/80 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block truncate">
                          💡 {rec.primaryReason}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-emerald-600 font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>설비 {rec.machineStatus} • 담당자 {rec.workerStatus}</span>
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
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-600" />
            <span>
              일괄 적용 후에도 공정 목록 및 상세 카드에서 언제든지 개별 수정할 수 있습니다.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
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
