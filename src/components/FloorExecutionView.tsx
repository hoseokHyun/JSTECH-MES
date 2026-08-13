import React, { useState } from 'react';
import {
  Order,
  ProductType,
  ScheduledTaskItem,
  ProcessProgressMap,
  ProcessCategory,
  User
} from '../types';
import { MCT_MACHINES, ALL_EQUIPMENT_LIST } from '../data/defaultData';
import {
  PlaySquare,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  UserCheck,
  Cpu,
  Clock,
  Layers,
  Sparkles,
  RefreshCw,
  Lock
} from 'lucide-react';

interface FloorExecutionViewProps {
  items: ScheduledTaskItem[];
  processProgressMap: ProcessProgressMap;
  currentUser: User | null;
  approvedOperators?: string[];
  onToggleComplete: (taskKey: string, worker?: string, machine?: string) => void;
  onUpdateAssignee: (taskKey: string, worker: string, machine: string) => void;
}

export const FloorExecutionView: React.FC<FloorExecutionViewProps> = ({
  items,
  processProgressMap,
  currentUser,
  approvedOperators = Array.from({ length: 20 }, (_, i) => `담당자 ${i + 1}`),
  onToggleComplete,
  onUpdateAssignee,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedWorkerFilter, setSelectedWorkerFilter] = useState<string>('ALL');
  const [showOnlyMyTasks, setShowOnlyMyTasks] = useState<boolean>(false);

  const isAdmin =
    currentUser?.role === 'ADMIN' ||
    currentUser?.name?.includes('관리자') ||
    currentUser?.name?.includes('대표');

  // Filter tasks
  const filteredTasks = items.filter((task) => {
    const matchesSearch =
      task.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.orderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.worker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.machine.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' || task.category === selectedCategory;

    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'COMPLETED' && task.isCompleted) ||
      (selectedStatus === 'PENDING' && !task.isCompleted);

    const matchesWorker =
      selectedWorkerFilter === 'ALL' || task.worker === selectedWorkerFilter;

    const matchesMyTask =
      !showOnlyMyTasks ||
      (currentUser?.name && task.worker?.trim() === currentUser.name.trim());

    return matchesSearch && matchesCategory && matchesStatus && matchesWorker && matchesMyTask;
  });

  const completedCount = items.filter((i) => i.isCompleted).length;
  const pendingCount = items.length - completedCount;

  const handleToggleClick = (task: ScheduledTaskItem) => {
    const isAssignedToMe = Boolean(
      currentUser?.name &&
        task.worker &&
        currentUser.name.trim() === task.worker.trim()
    );
    const canModify = isAdmin || isAssignedToMe;

    if (!canModify) {
      alert(
        `[권한 제한] 본인에게 배정된 공정만 완료 또는 취소할 수 있습니다.\n\n` +
          `• 공정명: ${task.content}\n` +
          `• 현재 담당자: ${task.worker || '(미지정)'}\n` +
          `• 로그인 계정: ${currentUser?.name || '미로그인'} (${isAdmin ? '관리자' : '일반사원'})\n\n` +
          `※ 담당자 본인 또는 대표/관리자 계정만 변경할 수 있습니다.`
      );
      return;
    }
    onToggleComplete(task.processKey, task.worker, task.machine);
  };

  const handleWorkerChange = (task: ScheduledTaskItem, newWorker: string) => {
    const isAssignedToMe = Boolean(
      currentUser?.name &&
        task.worker &&
        currentUser.name.trim() === task.worker.trim()
    );

    if (!isAdmin && task.worker && !isAssignedToMe) {
      alert(
        `[권한 제한] 타 담당자(${task.worker})의 공정 배정 정보는 관리자만 수정 가능합니다.`
      );
      return;
    }
    onUpdateAssignee(task.processKey, newWorker, task.machine);
  };

  const handleMachineChange = (task: ScheduledTaskItem, newMachine: string) => {
    const isAssignedToMe = Boolean(
      currentUser?.name &&
        task.worker &&
        currentUser.name.trim() === task.worker.trim()
    );
    const canModify = isAdmin || isAssignedToMe;

    if (!canModify && task.worker) {
      alert(
        `[권한 제한] 본인에게 배정된 공정의 설비만 변경할 수 있습니다. (현재 담당자: ${task.worker})`
      );
      return;
    }
    onUpdateAssignee(task.processKey, task.worker, newMachine);
  };

  return (
    <div className="space-y-4">
      {/* Floor Terminal Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md border border-slate-800 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <PlaySquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>현장 공정 실행 터미널 (Shop Floor MES Terminal)</span>
              <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-black">
                실시간 현장 공유 모드
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              공정 담당자는 담당 공정의 완료 처리(✓) 또는 취소를 클릭하여 실시간으로 진행 현황을 공유합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold">
          <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 text-blue-300">
            <span>대기/진행중:</span>
            <span className="text-white font-extrabold text-sm">{pendingCount}</span>건
          </div>
          <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 text-emerald-400">
            <span>완료 처리됨:</span>
            <span className="text-white font-extrabold text-sm">{completedCount}</span>건
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-wrap gap-2.5 items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="수주명, 공정명, 담당자, 설비 검색..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-800"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-500 font-bold shrink-0">구분:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-bold text-slate-800"
          >
            <option value="ALL">전체 공정</option>
            <option value="가공">가공 (MCT)</option>
            <option value="연마">연마 (Grinding)</option>
            <option value="외주">외주 (Subcontract)</option>
            <option value="품질">품질 (QA/CMM)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-500 font-bold shrink-0">상태:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-bold text-slate-800"
          >
            <option value="ALL">전체 상태</option>
            <option value="PENDING">🔄 진행 대기/중</option>
            <option value="COMPLETED">✅ 완료됨</option>
          </select>
        </div>

        {/* Worker Filter */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-500 font-bold shrink-0">담당자:</span>
          <select
            value={selectedWorkerFilter}
            onChange={(e) => setSelectedWorkerFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-bold text-slate-800 max-w-[160px] truncate"
          >
            <option value="ALL">전체 담당자</option>
            {approvedOperators.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        {/* Show Only My Tasks Toggle Button */}
        {currentUser?.name && (
          <button
            type="button"
            onClick={() => setShowOnlyMyTasks((prev) => !prev)}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 border cursor-pointer ${
              showOnlyMyTasks
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>내 담당 공정만 보기 ({currentUser.name})</span>
          </button>
        )}
      </div>

      {/* Task Execution Grid / Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 w-12 text-center">No</th>
                <th className="p-3">수주 / 프로젝트명</th>
                <th className="p-3">세부 공정명</th>
                <th className="p-3 text-center">공정구분</th>
                <th className="p-3 text-center">소요시간</th>
                <th className="p-3">공정 담당자</th>
                <th className="p-3">담당 설비 (MCT/연마/CMM)</th>
                <th className="p-3 text-center">상태</th>
                <th className="p-3 text-center w-36">원클릭 실시간 액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-semibold">
                    조건에 해당하는 현장 공정 항목이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task, idx) => {
                  const isAssignedToMe = Boolean(
                    currentUser?.name &&
                      task.worker &&
                      currentUser.name.trim() === task.worker.trim()
                  );
                  const canModify = isAdmin || isAssignedToMe;

                  return (
                    <tr
                      key={task.id}
                      className={`transition-colors ${
                        task.isCompleted ? 'bg-red-50/20 text-slate-500' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="p-3 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-bold text-slate-900 truncate max-w-[160px]">
                        {task.orderName}
                      </td>
                      <td className="p-3 font-extrabold text-slate-900">
                        {task.content}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            task.category === '가공'
                              ? 'bg-blue-100 text-blue-800'
                              : task.category === '연마'
                              ? 'bg-emerald-100 text-emerald-800'
                              : task.category === '외주'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {task.category}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-extrabold text-slate-800">
                        {task.duration}h
                      </td>
                      <td className="p-3">
                        <select
                          value={task.worker}
                          onChange={(e) => handleWorkerChange(task, e.target.value)}
                          className="text-xs px-2 py-1 border border-slate-300 rounded-md bg-white font-bold text-slate-800 focus:ring-1 focus:ring-blue-500 max-w-[150px] truncate"
                        >
                          <option value="">(미지정)</option>
                          {approvedOperators.map((w) => (
                            <option key={w} value={w}>
                              {w}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <select
                          value={task.machine}
                          onChange={(e) => handleMachineChange(task, e.target.value)}
                          className="text-xs px-2 py-1 border border-slate-300 rounded-md bg-white font-bold text-slate-800 focus:ring-1 focus:ring-blue-500 max-w-[150px] truncate"
                        >
                          <option value="">(미지정)</option>
                          {ALL_EQUIPMENT_LIST.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            task.isCompleted
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {task.isCompleted ? '✅ 완료' : '🔄 대기/진행'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleClick(task)}
                          title={canModify ? '' : `담당자 (${task.worker || '미지정'}) 전용`}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black shadow-xs transition flex items-center justify-center gap-1 mx-auto active:scale-95 cursor-pointer ${
                            !canModify
                              ? 'bg-slate-200 hover:bg-slate-300 text-slate-600 border border-slate-300'
                              : task.isCompleted
                              ? 'bg-red-800 hover:bg-red-700 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {!canModify ? (
                            <>
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <span>{task.isCompleted ? '취소' : '완료'}</span>
                            </>
                          ) : task.isCompleted ? (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>취소</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>공정 완료</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
