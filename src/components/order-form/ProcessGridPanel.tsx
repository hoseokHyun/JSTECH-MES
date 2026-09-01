import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Sliders,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  UserCheck,
  ArrowRightLeft,
  Clock,
  Layers,
  Filter,
  FolderPlus,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Sparkles,
  ShieldCheck,
  Wand2
} from 'lucide-react';
import { ProcessStep, ProcessCategory } from '../../types';
import { StepAssignment, ResourceBusyInfo, PhaseDefinition, PhaseGroup } from './orderFormTypes';
import { SearchableSelect, SelectOption } from '../SearchableSelect';

interface ProcessGridPanelProps {
  currentProcesses: ProcessStep[];
  stepAssignments: Record<number, StepAssignment>;
  selectedStepIndices: Set<number>;
  onToggleSelectStep: (idx: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectByCategory: (category: ProcessCategory) => void;
  activeStepIndex: number | null;
  onSetActiveStepIndex: (idx: number) => void;
  routingSearchTerm: string;
  setRoutingSearchTerm: (term: string) => void;
  selectedPhaseId: string | null;
  onSelectPhase: (phaseId: string | null) => void;
  phases: PhaseDefinition[];
  phaseGroups: PhaseGroup[];
  expandedPhases: Record<string, boolean>;
  onTogglePhaseExpand: (phaseId: string) => void;
  onExpandAllPhases: () => void;
  onCollapseAllPhases: () => void;
  onOpenAddPhaseModal: () => void;
  onOpenResetModal?: () => void;
  onRequestDeletePhase: (phase: { id: string; name: string }, stepsCount: number) => void;
  onMovePhaseUp: (idx: number) => void;
  onMovePhaseDown: (idx: number) => void;
  equipmentOptions: SelectOption[];
  operatorOptions: SelectOption[];
  busyMachinesMap: Map<string, ResourceBusyInfo>;
  busyWorkersMap: Map<string, ResourceBusyInfo>;
  onStepMachineChange: (idx: number, machine: string) => void;
  onStepWorkerChange: (idx: number, worker: string) => void;
  onStepDurationChange: (idx: number, hours: number) => void;
  onUpdateProcessField: (idx: number, field: keyof ProcessStep, value: any) => void;
  onAddProcess: (category?: ProcessCategory, targetPhaseId?: string) => void;
  onDeleteProcess: (idx: number) => void;
  onBatchDeleteSelectedSteps: () => void;
  onDuplicateStep: (idx: number) => void;
  batchMachine: string;
  setBatchMachine: (val: string) => void;
  batchWorker: string;
  setBatchWorker: (val: string) => void;
  batchDuration: string;
  setBatchDuration: (val: string) => void;
  batchTargetPhase: string;
  setBatchTargetPhase: (val: string) => void;
  onApplyBatchAssignment: () => void;
  onBatchMovePhases: () => void;
  filterOnlyUnassigned?: boolean;
  setFilterOnlyUnassigned?: (val: boolean) => void;
  filterOnlyConflicts?: boolean;
  setFilterOnlyConflicts?: (val: boolean) => void;
  onOpenAiBatchModal?: () => void;
  aiAppliedStepMap?: Record<number, { recWorker: string; recMachine: string; score: number }>;
  totalProcessesCount?: number;
  completedStepsCount?: number;
  unassignedStepsCount?: number;
  conflictStepsCount?: number;
  assignedMachineRate?: number;
  assignedWorkerRate?: number;
}

export const ProcessGridPanel: React.FC<ProcessGridPanelProps> = ({
  currentProcesses,
  stepAssignments,
  selectedStepIndices,
  onToggleSelectStep,
  onSelectAll,
  onDeselectAll,
  onSelectByCategory,
  activeStepIndex,
  onSetActiveStepIndex,
  routingSearchTerm,
  setRoutingSearchTerm,
  selectedPhaseId,
  onSelectPhase,
  phases,
  phaseGroups,
  expandedPhases,
  onTogglePhaseExpand,
  onExpandAllPhases,
  onCollapseAllPhases,
  onOpenAddPhaseModal,
  onOpenResetModal,
  onRequestDeletePhase,
  onMovePhaseUp,
  onMovePhaseDown,
  equipmentOptions,
  operatorOptions,
  busyMachinesMap,
  busyWorkersMap,
  onStepMachineChange,
  onStepWorkerChange,
  onStepDurationChange,
  onUpdateProcessField,
  onAddProcess,
  onDeleteProcess,
  onBatchDeleteSelectedSteps,
  onDuplicateStep,
  batchMachine,
  setBatchMachine,
  batchWorker,
  setBatchWorker,
  batchDuration,
  setBatchDuration,
  batchTargetPhase,
  setBatchTargetPhase,
  onApplyBatchAssignment,
  onBatchMovePhases,
  filterOnlyUnassigned = false,
  setFilterOnlyUnassigned,
  filterOnlyConflicts = false,
  setFilterOnlyConflicts,
  onOpenAiBatchModal,
  aiAppliedStepMap = {},
  totalProcessesCount,
  completedStepsCount,
  unassignedStepsCount,
  conflictStepsCount,
  assignedMachineRate = 0,
  assignedWorkerRate = 0,
}) => {
  // Tabs: 'TABLE' | 'BATCH'
  const [activeTab, setActiveTab] = useState<'TABLE' | 'BATCH'>('TABLE');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [pageSize, setPageSize] = useState<number>(0); // Default to show all in high-density view, or toggleable
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Grouped Steps by Phase with Filtering
  const groupedAndFilteredPhases = useMemo(() => {
    return phaseGroups
      .filter((group) => {
        if (selectedPhaseId && group.id !== selectedPhaseId) return false;
        return true;
      })
      .map((group) => {
        const filteredStepsInGroup = group.steps.filter(({ proc, originalIndex }) => {
          // Category Filter
          if (categoryFilter !== 'ALL' && proc.category !== categoryFilter) {
            return false;
          }

          // Unassigned Filter
          const assign = stepAssignments[originalIndex];
          const hasMachine = !!(assign?.machine || proc.assignedMachine);
          const hasWorker = !!(assign?.worker || proc.worker || proc.assignedWorker);
          if (filterOnlyUnassigned && (hasMachine && hasWorker)) {
            return false;
          }

          // Conflict Filter
          const isMachineBusy = assign?.machine ? busyMachinesMap.has(assign.machine) : false;
          const isWorkerBusy = assign?.worker ? busyWorkersMap.has(assign.worker.trim()) : false;
          if (filterOnlyConflicts && !isMachineBusy && !isWorkerBusy) {
            return false;
          }

          // Search Term
          if (routingSearchTerm.trim()) {
            const term = routingSearchTerm.toLowerCase();
            const pName = (proc.name || '').toLowerCase();
            const pCode = (proc.code || `OP${String(originalIndex + 1).padStart(3, '0')}`).toLowerCase();
            const pMach = (assign?.machine || proc.assignedMachine || '').toLowerCase();
            const pWork = (assign?.worker || proc.worker || proc.assignedWorker || '').toLowerCase();
            const pDesc = (proc.description || '').toLowerCase();
            return (
              pName.includes(term) ||
              pCode.includes(term) ||
              pMach.includes(term) ||
              pWork.includes(term) ||
              pDesc.includes(term)
            );
          }

          return true;
        });

        return {
          ...group,
          matchingSteps: filteredStepsInGroup
        };
      });
  }, [
    phaseGroups,
    selectedPhaseId,
    categoryFilter,
    filterOnlyUnassigned,
    filterOnlyConflicts,
    routingSearchTerm,
    stepAssignments,
    busyMachinesMap,
    busyWorkersMap
  ]);

  // Total matching steps count across all groups
  const totalMatchingStepsCount = useMemo(() => {
    return groupedAndFilteredPhases.reduce((acc, g) => acc + g.matchingSteps.length, 0);
  }, [groupedAndFilteredPhases]);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 flex flex-col h-full overflow-hidden">
      {/* 1. TOP COMPACT PHASE FILTER & GROUPING BAR */}
      <div className="p-2.5 bg-slate-50/90 border-b border-slate-200 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: Phase Filter Chips / Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-black text-slate-500 mr-0.5 shrink-0 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>공정 그룹:</span>
            </span>

            {/* 전체 보기 Chip */}
            <button
              type="button"
              onClick={() => onSelectPhase(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 border ${
                selectedPhaseId === null
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>전체</span>
              <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                selectedPhaseId === null ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-800'
              }`}>
                {currentProcesses.length}
              </span>
            </button>

            {/* Individual Phase Filter Chips */}
            {phaseGroups.map((group, idx) => {
              const isSelected = selectedPhaseId === group.id;
              const isFullyAssigned = group.assignedMachineCount === group.steps.length && group.steps.length > 0;

              return (
                <div
                  key={group.id}
                  className={`group relative inline-flex items-center rounded-lg border text-xs font-bold transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                  onClick={() => onSelectPhase(isSelected ? null : group.id)}
                  title={`${group.title}: ${group.description || ''}`}
                >
                  <span className="pl-2 pr-1 py-1 flex items-center gap-1">
                    <span className="text-xs">{group.icon || '⚙️'}</span>
                    <span className="font-extrabold">Phase {group.phaseNumber}</span>
                  </span>

                  <span className="pr-2 py-1 flex items-center gap-1">
                    <span
                      className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-black ${
                        isSelected
                          ? 'bg-blue-800 text-white'
                          : isFullyAssigned
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {group.assignedMachineCount}/{group.steps.length}
                    </span>
                  </span>

                  {/* Re-order / Delete quick controls on hover */}
                  <div
                    className="hidden group-hover:flex items-center gap-0.5 pr-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => onMovePhaseUp(idx)}
                        className={`p-0.5 rounded hover:bg-slate-200 ${isSelected ? 'text-white hover:text-slate-900' : 'text-slate-500'}`}
                        title="Phase 앞/위로 이동"
                      >
                        <ArrowUp className="w-2.5 h-2.5" />
                      </button>
                    )}
                    {idx < phaseGroups.length - 1 && (
                      <button
                        type="button"
                        onClick={() => onMovePhaseDown(idx)}
                        className={`p-0.5 rounded hover:bg-slate-200 ${isSelected ? 'text-white hover:text-slate-900' : 'text-slate-500'}`}
                        title="Phase 뒤/아래로 이동"
                      >
                        <ArrowDown className="w-2.5 h-2.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        onRequestDeletePhase(
                          { id: group.id, name: `Phase ${group.phaseNumber}` },
                          group.steps.length
                        )
                      }
                      className={`p-0.5 rounded hover:bg-rose-100 hover:text-rose-600 ${isSelected ? 'text-white' : 'text-slate-400'}`}
                      title="Phase 삭제"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* + 새 Phase 추가 버튼 */}
            <button
              type="button"
              onClick={onOpenAddPhaseModal}
              className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-dashed border-blue-300 rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
              title="새로운 공정 Phase 구간 추가"
            >
              <FolderPlus className="w-3 h-3" />
              <span>+ Phase 추가</span>
            </button>

            {/* ↻ 공정설계 초기화 버튼 */}
            {onOpenResetModal && (
              <button
                type="button"
                onClick={onOpenResetModal}
                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                title="공정설계 및 공정그룹(Phase) 구성을 초기 상태로 복원합니다"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>초기화</span>
              </button>
            )}
          </div>

          {/* Right: Expand/Collapse All Sections Toggle */}
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
            <button
              type="button"
              onClick={onExpandAllPhases}
              className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600 cursor-pointer"
              title="모든 Phase 섹션 펼치기"
            >
              모두 펼치기
            </button>
            <button
              type="button"
              onClick={onCollapseAllPhases}
              className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600 cursor-pointer"
              title="모든 Phase 섹션 접기"
            >
              모두 접기
            </button>
          </div>
        </div>
      </div>

      {/* 2. SUB-TOOLBAR: 공정설계 요약 + 작업 도구 (통합) */}
      <div className="p-2.5 bg-white border-b border-slate-200 space-y-2">
        {/* Top Row: Tabs, AI Allocation, Inline Summary (전체 · 배정완료 · 미지정), Progress Meters, Quick Add */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: View Tabs, AI Batch Button & Inline Progress Summary */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Tabs */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-black">
              <button
                type="button"
                onClick={() => setActiveTab('TABLE')}
                className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'TABLE'
                    ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📑 공정 목록</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 bg-blue-50 text-blue-800 rounded-full font-bold">
                  {totalProcessesCount ?? totalMatchingStepsCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('BATCH')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  activeTab === 'BATCH'
                    ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📋 일괄 배정 {selectedStepIndices.size > 0 && `(${selectedStepIndices.size}개)`}
              </button>
            </div>

            {/* AI Batch Allocation Button */}
            {onOpenAiBatchModal && (
              <button
                type="button"
                onClick={onOpenAiBatchModal}
                className="px-2.5 py-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-black transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap"
                title="과거 수주 데이터 기반 AI 공정 일괄 배정 미리보기 및 적용"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>AI 공정 일괄 배정</span>
              </button>
            )}

            {/* 공정설계 요약: 전체 · 배정 완료 · 미지정 */}
            <div className="flex items-center gap-1.5 text-xs font-bold pl-1.5 border-l border-slate-200">
              <span className="text-slate-600 text-[11px] flex items-center gap-1">
                <span className="opacity-70">전체</span>
                <b className="font-mono text-slate-900 font-extrabold">{totalProcessesCount ?? currentProcesses.length}</b>
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-emerald-700 text-[11px] flex items-center gap-1">
                <span className="opacity-80">배정 완료</span>
                <b className="font-mono text-emerald-800 font-extrabold">{completedStepsCount ?? 0}</b>
              </span>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={() => setFilterOnlyUnassigned && setFilterOnlyUnassigned(!filterOnlyUnassigned)}
                className={`text-[11px] px-1.5 py-0.5 rounded transition cursor-pointer flex items-center gap-1 ${
                  filterOnlyUnassigned
                    ? 'bg-amber-600 text-white font-black shadow-2xs'
                    : 'text-amber-800 hover:bg-amber-50'
                }`}
                title="클릭하여 미지정 공정만 필터링합니다"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${((unassignedStepsCount ?? 0) > 0) ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
                <span>미지정</span>
                <b className={`font-mono ${filterOnlyUnassigned ? 'text-white' : 'text-amber-900 font-extrabold'}`}>
                  {unassignedStepsCount ?? 0}
                </b>
              </button>

              {/* 오류 또는 충돌이 실제로 1건 이상 발생한 경우에만 경고 뱃지 표시 */}
              {(conflictStepsCount ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterOnlyConflicts && setFilterOnlyConflicts(!filterOnlyConflicts)}
                  className={`text-[11px] px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1 ${
                    filterOnlyConflicts
                      ? 'bg-rose-600 text-white font-black'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                  }`}
                  title="클릭하여 충돌 공정만 필터링합니다"
                >
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  <span>충돌</span>
                  <b className="font-mono font-extrabold text-rose-900">{conflictStepsCount}</b>
                </button>
              )}
            </div>
          </div>

          {/* Right: Progress Meters (설비/담당자 진행률) & Quick Process Addition */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 설비 배정 / 담당자 배정 진행률 (Compact Progress Bar) */}
            <div className="flex items-center gap-2.5 bg-slate-50/80 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-bold">
              {/* 설비 배정률 */}
              <div className="flex items-center gap-1.5" title={`설비 배정 진행률: ${assignedMachineRate}%`}>
                <span className="text-[10.5px] font-bold text-slate-500">설비 배정</span>
                <div className="w-14 sm:w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${assignedMachineRate}%` }}
                  />
                </div>
                <span className="font-mono font-black text-xs text-emerald-700">{assignedMachineRate}%</span>
              </div>

              <div className="h-3 w-px bg-slate-200" />

              {/* 담당자 배정률 */}
              <div className="flex items-center gap-1.5" title={`담당자 배정 진행률: ${assignedWorkerRate}%`}>
                <span className="text-[10.5px] font-bold text-slate-500">담당자 배정</span>
                <div className="w-14 sm:w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${assignedWorkerRate}%` }}
                  />
                </div>
                <span className="font-mono font-black text-xs text-blue-700">{assignedWorkerRate}%</span>
              </div>
            </div>

            {/* Quick Process Addition Chips */}
            <div className="flex items-center gap-1 text-[11px] font-black">
              <span className="text-slate-400 mr-0.5 hidden xl:inline text-[10.5px]">+ 신규 공정:</span>
              <button
                type="button"
                onClick={() => onAddProcess('가공', selectedPhaseId || undefined)}
                className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-md transition shadow-2xs cursor-pointer active:scale-95"
              >
                + 가공
              </button>
              <button
                type="button"
                onClick={() => onAddProcess('연마', selectedPhaseId || undefined)}
                className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md transition shadow-2xs cursor-pointer active:scale-95"
              >
                + 연마
              </button>
              <button
                type="button"
                onClick={() => onAddProcess('품질', selectedPhaseId || undefined)}
                className="px-2 py-1 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-md transition shadow-2xs cursor-pointer active:scale-95"
              >
                + CMM
              </button>
              <button
                type="button"
                onClick={() => onAddProcess('외주', selectedPhaseId || undefined)}
                className="px-2 py-1 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 rounded-md transition shadow-2xs cursor-pointer active:scale-95"
              >
                + 외주
              </button>
            </div>
          </div>
        </div>

        {/* Search, Category Filter & Quick Select All Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={routingSearchTerm}
              onChange={(e) => setRoutingSearchTerm(e.target.value)}
              placeholder="공정명, 공정번호(OP), 설비명, 담당자 검색..."
              className="w-full text-xs pl-8 pr-7 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
            />
            {routingSearchTerm && (
              <button
                type="button"
                onClick={() => setRoutingSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1 text-[11px] font-bold">
            {['ALL', '가공', '연마', '품질', '외주'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'ALL' ? '전체유형' : cat === '품질' ? 'CMM' : cat}
              </button>
            ))}
          </div>

          {/* Quick Select All / Deselect All */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={onSelectAll}
              className="text-blue-600 hover:text-blue-800 p-0.5 cursor-pointer"
            >
              전체 선택 ({currentProcesses.length})
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={onDeselectAll}
              className="text-slate-500 hover:text-slate-800 p-0.5 cursor-pointer"
            >
              선택 해제
            </button>
          </div>
        </div>
      </div>

      {/* 3. CONTEXTUAL BATCH ACTION BAR (Shown when items are selected or batch tab is active) */}
      {(selectedStepIndices.size > 0 || activeTab === 'BATCH') && (
        <div className="bg-slate-900 text-white p-2.5 border-b border-slate-800 space-y-2 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black bg-blue-600 px-2 py-0.5 rounded-full">
                {selectedStepIndices.size}개 공정 선택됨
              </span>
              <span className="text-xs text-slate-300 font-bold">선택 공정 일괄 지정/배정</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* AI Batch Recommendation Trigger */}
              {onOpenAiBatchModal && (
                <button
                  type="button"
                  onClick={onOpenAiBatchModal}
                  className="px-2.5 py-1 text-[11px] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded font-black transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                  title="선택된 공정에 AI 추천 조합 일괄 적용"
                >
                  <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                  <span>AI 추천 일괄 배정</span>
                </button>
              )}

              {/* Batch Move Phase */}
              <div className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-xs">
                <span className="text-slate-400 text-[11px]">Phase 이동:</span>
                <select
                  value={batchTargetPhase}
                  onChange={(e) => setBatchTargetPhase(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs outline-hidden cursor-pointer"
                >
                  {phases.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-800 text-white">
                      {p.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={onBatchMovePhases}
                  className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-bold"
                >
                  이동
                </button>
              </div>

              {/* Batch Delete */}
              <button
                type="button"
                onClick={onBatchDeleteSelectedSteps}
                className="px-2 py-1 text-[11px] bg-rose-600 hover:bg-rose-700 text-white rounded font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>선택 삭제</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-12 gap-2 text-slate-900 text-xs items-center">
            {/* Machine */}
            <div className="lg:col-span-4">
              <SearchableSelect
                options={equipmentOptions}
                value={batchMachine}
                onChange={(val) => setBatchMachine(val)}
                placeholder="일괄 지정 설비 선택..."
                icon={Cpu}
              />
            </div>

            {/* Worker */}
            <div className="lg:col-span-4">
              <SearchableSelect
                options={operatorOptions}
                value={batchWorker}
                onChange={(val) => setBatchWorker(val)}
                placeholder="일괄 지정 담당자 선택..."
                icon={UserCheck}
              />
            </div>

            {/* Duration */}
            <div className="lg:col-span-2 flex items-center gap-1 bg-white px-2 py-1.5 rounded border border-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={batchDuration}
                onChange={(e) => setBatchDuration(e.target.value)}
                placeholder="시간(h)"
                className="w-full text-xs font-mono font-bold outline-hidden"
              />
            </div>

            {/* Apply Button */}
            <div className="lg:col-span-2">
              <button
                type="button"
                onClick={onApplyBatchAssignment}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-black text-xs transition flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>일괄 적용</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MAIN PROCESS GRID TABLE WITH COLLAPSIBLE PHASE SECTION HEADERS */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 text-slate-600 font-extrabold sticky top-0 z-10 border-b border-slate-200 select-none">
            <tr>
              <th className="py-2 px-2.5 w-8 text-center whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedStepIndices.size === currentProcesses.length) {
                      onDeselectAll();
                    } else {
                      onSelectAll();
                    }
                  }}
                  className="cursor-pointer text-slate-500 hover:text-blue-600"
                >
                  {selectedStepIndices.size === currentProcesses.length && currentProcesses.length > 0 ? (
                    <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                </button>
              </th>
              <th className="py-2 px-2 w-10 text-center whitespace-nowrap">No</th>
              <th className="py-2 px-2.5 min-w-[76px] whitespace-nowrap">공정번호</th>
              <th className="py-2 px-3 min-w-[150px] whitespace-nowrap">공정명</th>
              <th className="py-2 px-2.5 w-16 text-center whitespace-nowrap">유형</th>
              <th className="py-2 px-3 min-w-[150px] whitespace-nowrap">설비 지정</th>
              <th className="py-2 px-3 min-w-[140px] whitespace-nowrap">담당자 지정</th>
              <th className="py-2 px-2 min-w-[68px] text-center whitespace-nowrap">상태</th>
              <th className="py-2 px-2 w-14 text-center whitespace-nowrap">시간</th>
              <th className="py-2 px-3 min-w-[130px] whitespace-nowrap">비고/가이드</th>
              <th className="py-2 px-2.5 w-16 text-center whitespace-nowrap">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groupedAndFilteredPhases.length === 0 || totalMatchingStepsCount === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400 font-bold">
                  일치하는 공정이 없습니다. 검색어 또는 필터를 조정해보세요.
                </td>
              </tr>
            ) : (
              groupedAndFilteredPhases.map((group) => {
                const isPhaseExpanded = expandedPhases[group.id] !== false; // default to true
                const matchingInGroup = group.matchingSteps;

                return (
                  <React.Fragment key={group.id}>
                    {/* PHASE SECTION GROUP HEADER ROW */}
                    <tr className="bg-slate-100/95 border-y border-slate-200 sticky top-7 z-9 select-none">
                      <td colSpan={11} className="py-1.5 px-3">
                        <div className="flex items-center justify-between">
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => onTogglePhaseExpand(group.id)}
                          >
                            <button
                              type="button"
                              className="text-slate-500 hover:text-slate-800 p-0.5"
                            >
                              {isPhaseExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-700" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-700" />
                              )}
                            </button>
                            <span className="text-base">{group.icon || '⚙️'}</span>
                            <span className="font-black text-xs text-slate-900">
                              Phase {group.phaseNumber}: {group.title}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500">
                              ({matchingInGroup.length}개 공정, {group.totalHours.toFixed(1)}h)
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-full font-mono ${
                                group.assignedMachineCount === group.steps.length && group.steps.length > 0
                                  ? 'bg-emerald-100 text-emerald-800 font-black'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              배정 {group.assignedMachineCount}/{group.steps.length}
                            </span>

                            {/* Quick Add Step directly to this phase */}
                            <button
                              type="button"
                              onClick={() => onAddProcess('가공', group.id)}
                              className="px-1.5 py-0.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                              title="이 Phase에 신규 공정 추가"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>공정 추가</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* PHASE STEPS ROWS */}
                    {isPhaseExpanded &&
                      matchingInGroup.map(({ proc, originalIndex }) => {
                        const isSelected = selectedStepIndices.has(originalIndex);
                        const isActive = activeStepIndex === originalIndex;
                        const assign = stepAssignments[originalIndex];
                        const currentMach = assign !== undefined ? assign.machine : (proc.assignedMachine || '');
                        const currentWork = assign !== undefined ? assign.worker : (proc.worker || proc.assignedWorker || '');

                        const isMachBusy = currentMach ? busyMachinesMap.has(currentMach) : false;
                        const isWorkBusy = currentWork ? busyWorkersMap.has(currentWork.trim()) : false;

                        const isComplete = !!(currentMach && currentWork);
                        const hasConflict = isMachBusy || isWorkBusy;

                        return (
                          <tr
                            key={originalIndex}
                            onClick={() => onSetActiveStepIndex(originalIndex)}
                            className={`transition cursor-pointer group ${
                              isActive
                                ? 'bg-blue-50/90 font-bold ring-1 ring-blue-500 inset-0'
                                : isSelected
                                ? 'bg-indigo-50/60'
                                : 'hover:bg-slate-50/80'
                            }`}
                          >
                            {/* Checkbox */}
                            <td
                              className="py-2 px-2.5 text-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleSelectStep(originalIndex);
                              }}
                            >
                              <button type="button" className="cursor-pointer text-slate-400 hover:text-blue-600">
                                {isSelected ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                                ) : (
                                  <Square className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </td>

                            {/* No */}
                            <td className="py-2 px-2 text-center font-mono text-[11px] text-slate-500 font-bold">
                              {String(originalIndex + 1).padStart(2, '0')}
                            </td>

                            {/* 공정번호 (OP Code) */}
                            <td className="py-2 px-2.5 font-mono text-[11px] font-black text-slate-800 whitespace-nowrap min-w-[76px]">
                              {proc.code || `OP${String(originalIndex + 1).padStart(3, '0')}`}
                            </td>

                            {/* 공정명 */}
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-extrabold text-slate-900 truncate">{proc.name}</span>
                                {proc.category === '외주' && (
                                  <span className="text-[9px] font-black text-amber-800 bg-amber-100 px-1 rounded">
                                    외주
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 유형 */}
                            <td className="py-2 px-2.5 text-center">
                              <span
                                className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                                  proc.category === '가공'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : proc.category === '연마'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : proc.category === '품질'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : proc.category === '외주'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                {proc.category === '품질' ? 'CMM' : proc.category}
                              </span>
                            </td>

                            {/* 설비 지정 */}
                            <td className="py-1 px-3" onClick={(e) => e.stopPropagation()}>
                              <div className="w-full text-slate-900">
                                <SearchableSelect
                                  options={equipmentOptions}
                                  value={currentMach}
                                  onChange={(val) => onStepMachineChange(originalIndex, val)}
                                  placeholder="설비 선택..."
                                  icon={Cpu}
                                />
                              </div>
                            </td>

                            {/* 담당자 지정 */}
                            <td className="py-1 px-3" onClick={(e) => e.stopPropagation()}>
                              <div className="w-full text-slate-900">
                                <SearchableSelect
                                  options={operatorOptions}
                                  value={currentWork}
                                  onChange={(val) => onStepWorkerChange(originalIndex, val)}
                                  placeholder="담당자 선택..."
                                  icon={UserCheck}
                                />
                              </div>
                            </td>

                            {/* 상태 Badge */}
                            <td className="py-2 px-2 text-center whitespace-nowrap min-w-[68px]">
                              <div className="inline-flex flex-col items-center justify-center gap-0.5 whitespace-nowrap">
                                {hasConflict ? (
                                  <span className="inline-flex items-center justify-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 whitespace-nowrap shrink-0 leading-none">
                                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                    <span className="whitespace-nowrap">충돌</span>
                                  </span>
                                ) : isComplete ? (
                                  <span className="inline-flex items-center justify-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 whitespace-nowrap shrink-0 leading-none">
                                    <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                                    <span className="whitespace-nowrap">완료</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 whitespace-nowrap shrink-0 leading-none">
                                    <span className="whitespace-nowrap">미지정</span>
                                  </span>
                                )}

                                {aiAppliedStepMap[originalIndex] && (
                                  <span
                                    className="inline-flex items-center justify-center gap-0.5 text-[9px] font-black text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-200 whitespace-nowrap shrink-0 leading-none"
                                    title={`AI 추천 적용 (적합도 ${aiAppliedStepMap[originalIndex].score}%)`}
                                  >
                                    <Sparkles className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                                    <span className="whitespace-nowrap">AI {aiAppliedStepMap[originalIndex].score}%</span>
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 예상시간 */}
                            <td className="py-2 px-2 text-center font-mono text-[11px] font-bold text-slate-700">
                              {proc.estimatedHours ? `${proc.estimatedHours}h` : '-'}
                            </td>

                            {/* 비고/가이드 */}
                            <td className="py-2 px-3 text-[11px] text-slate-500 truncate max-w-[160px]">
                              {proc.description || (isComplete ? '배정 완료' : '설비/담당자 지정 필요')}
                            </td>

                            {/* 행 작업 (복제 / 삭제) */}
                            <td className="py-2 px-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => onDuplicateStep(originalIndex)}
                                  className="p-1 hover:bg-slate-200 text-slate-500 hover:text-blue-600 rounded cursor-pointer"
                                  title="공정 복제"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteProcess(originalIndex)}
                                  className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                  title="공정 삭제"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. BOTTOM SUMMARY BAR */}
      <div className="p-2 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="text-[11px] font-bold text-slate-600">
          표시 중인 공정: <strong className="text-slate-900 font-black">{totalMatchingStepsCount}</strong> / 전체 {currentProcesses.length}개
        </div>

        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
          <span>* 테이블 내 설비 및 담당자를 직접 선택하거나, 행을 클릭하여 오른쪽 상세 창에서 수정할 수 있습니다.</span>
        </div>
      </div>
    </div>
  );
};
