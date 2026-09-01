import React, { useState } from 'react';
import {
  RotateCcw,
  X,
  AlertCircle,
  CheckSquare,
  Square,
  Layers,
  FileSpreadsheet,
  Cpu,
  UserCheck,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export interface ResetProcessOptions {
  resetPhases: boolean;
  resetProcesses: boolean;
  resetMachines: boolean;
  resetWorkers: boolean;
  resetAiRecommendations: boolean;
}

interface ResetProcessDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: (options: ResetProcessOptions) => void;
  currentPhasesCount: number;
  currentProcessesCount: number;
  assignedMachineCount: number;
  assignedWorkerCount: number;
  aiAppliedCount: number;
}

export const ResetProcessDesignModal: React.FC<ResetProcessDesignModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  currentPhasesCount,
  currentProcessesCount,
  assignedMachineCount,
  assignedWorkerCount,
  aiAppliedCount,
}) => {
  const [options, setOptions] = useState<ResetProcessOptions>({
    resetPhases: true,
    resetProcesses: true,
    resetMachines: true,
    resetWorkers: true,
    resetAiRecommendations: true,
  });

  if (!isOpen) return null;

  const toggleOption = (key: keyof ResetProcessOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAll = () => {
    setOptions({
      resetPhases: true,
      resetProcesses: true,
      resetMachines: true,
      resetWorkers: true,
      resetAiRecommendations: true,
    });
  };

  const handleDeselectAll = () => {
    setOptions({
      resetPhases: false,
      resetProcesses: false,
      resetMachines: false,
      resetWorkers: false,
      resetAiRecommendations: false,
    });
  };

  const isAnySelected = Object.values(options).some(Boolean);

  const handleExecute = () => {
    if (!isAnySelected) {
      alert('초기화할 항목을 최소 1개 이상 선택해주세요.');
      return;
    }
    onConfirmReset(options);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-300">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">공정그룹 및 공정설계 초기화</h3>
              <p className="text-[11px] text-slate-300">
                공정 구성 및 배정 정보를 기본 상태로 되돌립니다
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Safe Notice Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5 text-blue-900">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <b className="font-black text-blue-950">수주 기본정보는 안전하게 유지됩니다.</b>
              <br />
              고객사, 프로젝트명, 수주번호, 각인번호, 생산수량, 납기일, 특이사항 등은 절대로 삭제되지 않으며
              오직 선택한 <b>공정설계 영역</b>만 초기 상태로 복원됩니다.
            </div>
          </div>

          {/* Scope Selection Header */}
          <div className="flex items-center justify-between pt-1">
            <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
              <span>초기화 대상 항목 선택</span>
              <span className="text-[10px] text-slate-500 font-normal">
                (원하는 항목만 체크 해제 가능)
              </span>
            </span>
            <div className="flex items-center gap-1.5 text-[10px] font-bold">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition cursor-pointer"
              >
                전체 선택
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition cursor-pointer"
              >
                선택 해제
              </button>
            </div>
          </div>

          {/* Checklist Options */}
          <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
            {/* 1. Reset Phases */}
            <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white transition cursor-pointer border border-transparent hover:border-slate-200">
              <input
                type="checkbox"
                checked={options.resetPhases}
                onChange={() => toggleOption('resetPhases')}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>사용자 추가 Phase 제거 및 표준 Phase 복원</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">현재 {currentPhasesCount}개</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  추가/수정된 Phase 구간을 초기 표준 4단계(Phase 1~4) 구성으로 복원합니다.
                </p>
              </div>
            </label>

            {/* 2. Reset Processes */}
            <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white transition cursor-pointer border border-transparent hover:border-slate-200">
              <input
                type="checkbox"
                checked={options.resetProcesses}
                onChange={() => toggleOption('resetProcesses')}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                    <span>공정 목록을 초기 표준 템플릿으로 복원</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">현재 {currentProcessesCount}단계</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  추가되거나 삭제된 공정을 제품 유형의 표준 템플릿(80개 공정)으로 재정렬하여 복원합니다.
                </p>
              </div>
            </label>

            {/* 3. Reset Machine Assignments */}
            <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white transition cursor-pointer border border-transparent hover:border-slate-200">
              <input
                type="checkbox"
                checked={options.resetMachines}
                onChange={() => toggleOption('resetMachines')}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                    <span>설비 배정 초기화</span>
                  </span>
                  <span className="font-mono text-[10px] text-emerald-700 font-bold">배정 {assignedMachineCount}건</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  지정된 모든 설비를 '설비 미지정' 상태로 초기화합니다.
                </p>
              </div>
            </label>

            {/* 4. Reset Worker Assignments */}
            <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white transition cursor-pointer border border-transparent hover:border-slate-200">
              <input
                type="checkbox"
                checked={options.resetWorkers}
                onChange={() => toggleOption('resetWorkers')}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>담당자 배정 초기화</span>
                  </span>
                  <span className="font-mono text-[10px] text-blue-700 font-bold">배정 {assignedWorkerCount}건</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  지정된 모든 작업자를 '담당자 미지정' 상태로 초기화합니다.
                </p>
              </div>
            </label>

            {/* 5. Reset AI Recommendation results */}
            <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white transition cursor-pointer border border-transparent hover:border-slate-200">
              <input
                type="checkbox"
                checked={options.resetAiRecommendations}
                onChange={() => toggleOption('resetAiRecommendations')}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>AI 공정 일괄 배정 추천 적용 결과 초기화</span>
                  </span>
                  <span className="font-mono text-[10px] text-purple-700 font-bold">적용 {aiAppliedCount}건</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  AI 일괄 배정으로 자동 입력된 설비/담당자 추천 기록을 초기화합니다.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={!isAnySelected}
            className={`px-5 py-2 rounded-xl font-black text-white transition flex items-center gap-2 shadow-sm cursor-pointer ${
              isAnySelected
                ? 'bg-slate-900 hover:bg-slate-800 active:scale-98'
                : 'bg-slate-300 cursor-not-allowed text-slate-500'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>선택 항목 초기화</span>
          </button>
        </div>
      </div>
    </div>
  );
};
