import React from 'react';
import {
  Layers,
  FolderPlus,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { PhaseGroup } from './orderFormTypes';

interface PhaseNavigationPanelProps {
  phaseGroups: PhaseGroup[];
  selectedPhaseId: string | null;
  onSelectPhase: (phaseId: string | null) => void;
  expandedPhases: Record<string, boolean>;
  onTogglePhaseExpand: (phaseId: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onOpenAddPhaseModal: () => void;
  onOpenResetModal?: () => void;
  onRequestDeletePhase: (phase: { id: string; name: string }, stepsCount: number) => void;
  onMovePhaseUp: (idx: number) => void;
  onMovePhaseDown: (idx: number) => void;
  totalStepsCount: number;
  completedStepsCount: number;
  unassignedStepsCount: number;
  conflictStepsCount: number;
}

export const PhaseNavigationPanel: React.FC<PhaseNavigationPanelProps> = ({
  phaseGroups,
  selectedPhaseId,
  onSelectPhase,
  expandedPhases,
  onTogglePhaseExpand,
  onExpandAll,
  onCollapseAll,
  onOpenAddPhaseModal,
  onOpenResetModal,
  onRequestDeletePhase,
  onMovePhaseUp,
  onMovePhaseDown,
  totalStepsCount,
  completedStepsCount,
  unassignedStepsCount,
  conflictStepsCount
}) => {
  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <h3 className="font-extrabold text-xs text-slate-900">공정 구성 (Phase)</h3>
          <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded-full">
            {phaseGroups.length}
          </span>
        </div>

        {/* View All Button */}
        <button
          type="button"
          onClick={() => onSelectPhase(null)}
          className={`text-[10px] font-extrabold px-2 py-0.5 rounded transition cursor-pointer ${
            selectedPhaseId === null
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          전체 보기
        </button>
      </div>

      {/* Phase Cards Scrollable List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {phaseGroups.map((group, idx) => {
          const isSelected = selectedPhaseId === group.id;
          const assignedCount = group.assignedMachineCount;
          const totalInPhase = group.steps.length;
          const unassignedCount = totalInPhase - assignedCount;

          return (
            <div
              key={group.id}
              onClick={() => onSelectPhase(isSelected ? null : group.id)}
              className={`group relative rounded-xl border p-2.5 transition cursor-pointer select-none ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/60 shadow-xs ring-2 ring-blue-400/30'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              {/* Header: Phase Title & Step Ratio */}
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm shrink-0">{group.icon || '⚙️'}</span>
                  <span className="font-black text-xs text-slate-900 truncate">
                    Phase {group.phaseNumber}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 truncate max-w-[80px]">
                    {group.titleSuffix || group.title}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`font-mono text-[11px] font-black px-1.5 py-0.2 rounded ${
                      assignedCount === totalInPhase && totalInPhase > 0
                        ? 'text-emerald-700 bg-emerald-100'
                        : 'text-slate-700 bg-slate-100'
                    }`}
                  >
                    {assignedCount} / {totalInPhase}
                  </span>

                  {/* Phase re-order & delete controls (appear on hover) */}
                  <div
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => onMovePhaseUp(idx)}
                        className="p-0.5 text-slate-400 hover:text-blue-600 rounded"
                        title="Phase 위로 이동"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                    )}
                    {idx < phaseGroups.length - 1 && (
                      <button
                        type="button"
                        onClick={() => onMovePhaseDown(idx)}
                        className="p-0.5 text-slate-400 hover:text-blue-600 rounded"
                        title="Phase 아래로 이동"
                      >
                        <ArrowDown className="w-3 h-3" />
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
                      className="p-0.5 text-slate-400 hover:text-rose-600 rounded"
                      title="Phase 구간 삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-[10px] text-slate-500 line-clamp-1 mb-2">
                {group.description || `${group.title} 공정 구간`}
              </p>

              {/* Badges: 완료 / 미지정 / 오류 */}
              <div className="flex items-center gap-1 text-[10px] font-bold">
                <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  완료 {assignedCount}
                </span>

                <span
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded border ${
                    unassignedCount > 0
                      ? 'text-amber-800 bg-amber-50 border-amber-200'
                      : 'text-slate-400 bg-slate-50 border-slate-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      unassignedCount > 0 ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                  />
                  미지정 {unassignedCount}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Footer: Stats & Add Phase Button */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50/70 space-y-2">
        {/* Total stats row */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">전체 공정</span>
            <span className="font-mono font-black text-slate-900">
              {completedStepsCount} / {totalStepsCount}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onExpandAll}
              className="text-[10px] font-bold text-slate-600 hover:text-blue-600 p-1"
              title="모든 Phase 펼치기"
            >
              펼치기
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={onCollapseAll}
              className="text-[10px] font-bold text-slate-600 hover:text-blue-600 p-1"
              title="모든 Phase 접기"
            >
              접기
            </button>
          </div>
        </div>

        {/* Add Phase & Reset Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenAddPhaseModal}
            className="flex-1 py-1.5 text-xs font-black bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-95"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ 새 Phase 추가</span>
          </button>

          {onOpenResetModal && (
            <button
              type="button"
              onClick={onOpenResetModal}
              className="py-1.5 px-2.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-95"
              title="공정설계 및 공정그룹 초기화"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>초기화</span>
            </button>
          )}
        </div>

        {/* Live Validation Bar */}
        <div className="p-2 rounded-lg bg-slate-900 text-white text-[10px] font-bold flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="font-extrabold text-slate-200">검증 결과</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-emerald-400">● 정상 {completedStepsCount}</span>
            <span className="text-amber-400">● 미지정 {unassignedStepsCount}</span>
            {conflictStepsCount > 0 && (
              <span className="text-rose-400">● 충돌 {conflictStepsCount}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
