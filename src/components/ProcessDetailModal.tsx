import React, { useMemo } from 'react';
import { ScheduledTaskItem, User } from '../types';
import { MCT_MACHINES, ALL_EQUIPMENT_LIST } from '../data/defaultData';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { Info, X, CheckCircle, RotateCcw, UserCheck, Cpu, Clock, Calendar, Lock } from 'lucide-react';

interface ProcessDetailModalProps {
  selectedItem: ScheduledTaskItem | null;
  currentUser: User | null;
  approvedOperators?: string[];
  onClose: () => void;
  onUpdateAssignee: (worker: string, machine: string) => void;
  onToggleComplete: () => void;
}

export const ProcessDetailModal: React.FC<ProcessDetailModalProps> = ({
  selectedItem,
  currentUser,
  approvedOperators = [],
  onClose,
  onUpdateAssignee,
  onToggleComplete,
}) => {
  if (!selectedItem) return null;

  const isAdmin =
    currentUser?.role === 'ADMIN' ||
    currentUser?.department === '시스템 관리자' ||
    currentUser?.name?.includes('관리자');

  const isAssignedToMe = Boolean(
    currentUser?.name &&
      selectedItem.worker &&
      currentUser.name.trim() === selectedItem.worker.trim()
  );

  const canModify = isAdmin || isAssignedToMe;

  const operatorOptions: SelectOption[] = useMemo(() => {
    const opts: SelectOption[] = [
      { value: '', label: '(미지정)', badge: '미지정', badgeColor: 'bg-slate-700 text-slate-300' }
    ];
    const added = new Set<string>(['']);

    approvedOperators.forEach((op) => {
      const clean = (op || '').trim();
      if (!clean || added.has(clean)) return;
      added.add(clean);

      let badge = '현장';
      let badgeColor = 'bg-blue-950 text-blue-300';
      if (clean.includes('(가공)') || clean.includes('가공')) {
        badge = '가공';
        badgeColor = 'bg-blue-950 text-blue-300';
      } else if (clean.includes('(연마)') || clean.includes('연마')) {
        badge = '연마';
        badgeColor = 'bg-emerald-950 text-emerald-300';
      } else if (clean.includes('(품질)') || clean.includes('품질') || clean.includes('검사')) {
        badge = '품질';
        badgeColor = 'bg-purple-950 text-purple-300';
      } else if (clean.includes('(조립)') || clean.includes('조립')) {
        badge = '조립';
        badgeColor = 'bg-teal-950 text-teal-300';
      } else if (clean.includes('생산')) {
        badge = '생산';
        badgeColor = 'bg-amber-950 text-amber-300';
      }

      opts.push({
        value: clean,
        label: clean,
        badge,
        badgeColor,
      });
    });

    if (selectedItem.worker && !added.has(selectedItem.worker.trim())) {
      const clean = selectedItem.worker.trim();
      opts.push({
        value: clean,
        label: clean,
        badge: '배정',
        badgeColor: 'bg-indigo-950 text-indigo-300',
      });
    }

    return opts;
  }, [approvedOperators, selectedItem.worker]);

  const machineOptions: SelectOption[] = useMemo(() => {
    const opts: SelectOption[] = [
      { value: '', label: '(미지정)', badge: '미지정', badgeColor: 'bg-slate-700 text-slate-300' }
    ];
    const added = new Set<string>(['']);

    ALL_EQUIPMENT_LIST.forEach((m) => {
      if (!m || added.has(m)) return;
      added.add(m);

      let badge = '설비';
      let badgeColor = 'bg-slate-800 text-slate-200';
      if (m.includes('MCT')) {
        badge = 'MCT';
        badgeColor = 'bg-blue-950 text-blue-300';
      } else if (m.includes('연마기')) {
        badge = '연마';
        badgeColor = 'bg-emerald-950 text-emerald-300';
      } else if (m.includes('CMM') || m.includes('측정')) {
        badge = '품질CMM';
        badgeColor = 'bg-purple-950 text-purple-300';
      } else if (m.includes('세척') || m.includes('초음파')) {
        badge = '세척';
        badgeColor = 'bg-teal-950 text-teal-300';
      } else if (m.includes('조립') || m.includes('클린룸')) {
        badge = '조립';
        badgeColor = 'bg-cyan-950 text-cyan-300';
      }

      opts.push({
        value: m,
        label: m,
        badge,
        badgeColor,
      });
    });

    if (selectedItem.machine && !added.has(selectedItem.machine.trim())) {
      const clean = selectedItem.machine.trim();
      opts.push({
        value: clean,
        label: clean,
        badge: '배정설비',
        badgeColor: 'bg-indigo-950 text-indigo-300',
      });
    }

    return opts;
  }, [selectedItem.machine]);

  const handleToggleClick = () => {
    if (!canModify) {
      alert(
        `[권한 제한] 본인에게 배정된 공정만 완료 또는 취소할 수 있습니다.\n\n` +
          `• 공정명: ${selectedItem.content}\n` +
          `• 현재 담당자: ${selectedItem.worker || '(미지정)'}\n` +
          `• 로그인 계정: ${currentUser?.name || '미로그인'} (${isAdmin ? '시스템 관리자' : '현장담당자'})\n\n` +
          `※ 담당자 본인 또는 시스템 관리자 계정만 처리 가능합니다.`
      );
      return;
    }
    onToggleComplete();
  };

  const handleWorkerChange = (newWorker: string) => {
    if (!isAdmin && selectedItem.worker && !isAssignedToMe) {
      alert(
        `[권한 제한] 타 담당자(${selectedItem.worker})의 배정 변경은 관리자만 가능합니다.`
      );
      return;
    }
    onUpdateAssignee(newWorker, selectedItem.machine);
  };

  const handleMachineChange = (newMachine: string) => {
    if (!canModify && selectedItem.worker) {
      alert(
        `[권한 제한] 본인에게 배정된 공정의 설비만 수정할 수 있습니다.\n` +
          `• 현재 담당자: ${selectedItem.worker}`
      );
      return;
    }
    onUpdateAssignee(selectedItem.worker, newMachine);
  };

  const startStr = selectedItem.start.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const endStr = selectedItem.end.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="sticky-detail-card bg-slate-900 text-white rounded-xl p-4 border border-slate-700 shadow-2xl space-y-3 mt-4">
      {/* Detail Header */}
      <div className="flex justify-between items-start border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 block uppercase tracking-wider">
              선택 공정 상세 정보 및 현장 작업 관리 (Shop Floor Operator Terminal)
            </span>
            <span className="text-[11px] text-slate-400">
              실시간 담당자 지정 및 완료/취소 상태 업데이트
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-800 text-blue-300 font-bold px-2.5 py-0.5 rounded border border-slate-700">
            제품 #{selectedItem.productNo}
          </span>
          <span
            className={`text-xs px-2.5 py-0.5 rounded font-black border ${
              selectedItem.isCompleted
                ? 'bg-red-950 text-red-400 border-red-800'
                : 'bg-blue-950 text-blue-400 border-blue-700'
            }`}
          >
            {selectedItem.isCompleted ? '✅ 공정 완료' : '🔄 진행 대기/중'}
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Order & Task Name */}
        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/80">
          <span className="text-slate-400 text-[10px] font-bold block mb-0.5">
            수주건 / 작업명
          </span>
          <span className="font-bold text-blue-300 block truncate text-[11px]">
            {selectedItem.orderName}
          </span>
          <span className="font-extrabold text-white text-sm block mt-0.5">
            {selectedItem.content}
          </span>
        </div>

        {/* Category & Duration */}
        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/80">
          <span className="text-slate-400 text-[10px] font-bold block mb-0.5">
            공정 구분 / 필요 작업시간
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`font-black px-2 py-0.5 rounded text-[11px] ${
                selectedItem.category === '가공'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  : selectedItem.category === '연마'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : selectedItem.category === '외주'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
              }`}
            >
              {selectedItem.category}
            </span>
            <span className="text-emerald-400 font-extrabold text-sm">
              {selectedItem.duration} 시간
            </span>
          </div>
        </div>

        {/* Planned Time */}
        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/80">
          <span className="text-slate-400 text-[10px] font-bold block mb-0.5 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-indigo-400" /> 계획 작업 일정
          </span>
          <span className="text-slate-200 font-semibold block text-[11px] mt-0.5">
            {startStr} ~
          </span>
          <span className="text-slate-200 font-semibold block text-[11px]">
            {endStr}
          </span>
        </div>

        {/* Real Completion Time */}
        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/80">
          <span className="text-slate-400 text-[10px] font-bold block mb-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" /> 실제 완료일시
          </span>
          <span className="text-amber-300 font-bold block text-xs mt-1">
            {selectedItem.completedAt || '- (진행 대기중)'}
          </span>
        </div>
      </div>

      {/* Operator & Machine Control Form */}
      <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        {/* Worker Selector */}
        <div>
          <label className="block text-[11px] text-slate-300 font-bold mb-1 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-blue-400" /> 공정 담당자 지정
          </label>
          <SearchableSelect
            options={operatorOptions}
            value={selectedItem.worker || ''}
            onChange={handleWorkerChange}
            placeholder="담당자 선택"
            icon={UserCheck}
            className="w-full"
            triggerClassName="w-full text-xs py-1.5 bg-slate-800 border border-slate-700 text-white font-bold"
          />
        </div>

        {/* Machine Selector */}
        <div>
          <label className="block text-[11px] text-slate-300 font-bold mb-1 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" /> 담당 설비 선택 (총 21대)
          </label>
          <SearchableSelect
            options={machineOptions}
            value={selectedItem.machine || ''}
            onChange={handleMachineChange}
            placeholder="설비 선택"
            icon={Cpu}
            className="w-full"
            triggerClassName="w-full text-xs py-1.5 bg-slate-800 border border-slate-700 text-white font-bold"
          />
        </div>

        {/* Toggle Complete Button */}
        <div>
          <button
            type="button"
            onClick={handleToggleClick}
            title={canModify ? '' : `배정 담당자 (${selectedItem.worker || '미지정'}) 전용`}
            className={`w-full py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer ${
              !canModify
                ? 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-650 opacity-90'
                : selectedItem.isCompleted
                ? 'bg-red-800 hover:bg-red-700 text-white border border-red-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500'
            }`}
          >
            {!canModify ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {selectedItem.isCompleted ? '공정 완료 취소 (권한 제한)' : '공정 완료 (권한 제한)'}
                </span>
              </>
            ) : selectedItem.isCompleted ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>공정 완료 취소</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>공정 완료 처리 (실시간 반영)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
