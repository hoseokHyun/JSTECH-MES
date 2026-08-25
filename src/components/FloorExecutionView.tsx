import React, { useState, useEffect } from 'react';
import {
  ScheduledTaskItem,
  ProcessProgressMap,
  ProcessProgressItem,
  User,
  PauseReason,
  PauseLog,
  Order
} from '../types';
import { ALL_EQUIPMENT_LIST } from '../data/defaultData';
import { CalendarTaskDetailModal } from './CalendarTaskDetailModal';
import { FloorProcessCard } from './FloorProcessCard';
import { EasyTravelerModal } from './EasyTravelerModal';
import { AndonReportModal } from './AndonReportModal';
import { PlcBridgeModal } from './PlcBridgeModal';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  UserCheck,
  Cpu,
  Clock,
  Layers,
  Sparkles,
  RefreshCw,
  Lock,
  Timer,
  Check,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Flame,
  QrCode,
  Wifi,
  Zap
} from 'lucide-react';

interface FloorExecutionViewProps {
  items?: ScheduledTaskItem[];
  scheduledTasks?: ScheduledTaskItem[];
  orders?: Record<string, Order>;
  productTypes?: Record<string, any>;
  processProgressMap: ProcessProgressMap;
  currentUser?: User | null;
  approvedOperators?: string[];
  onToggleComplete?: (taskKey: string, worker?: string, machine?: string) => void;
  onUpdateAssignee?: (taskKey: string, worker: string, machine: string) => void;
  onUpdateProgress: (processKey: string, progress: ProcessProgressItem) => void;
}

const PAUSE_REASONS: PauseReason[] = [
  '설비 고장',
  '자재 부족',
  '품질 문제',
  '작업자 부재',
  '도면 문제',
  '기타'
];

export const FloorExecutionView: React.FC<FloorExecutionViewProps> = ({
  items,
  scheduledTasks,
  orders = {},
  processProgressMap,
  currentUser,
  approvedOperators = [],
  onUpdateProgress,
}) => {
  const taskList = items || scheduledTasks || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedWorkerFilter, setSelectedWorkerFilter] = useState<string>('ALL');
  const [selectedMachineFilter, setSelectedMachineFilter] = useState<string>('ALL');
  const [showOnlyMyTasks, setShowOnlyMyTasks] = useState<boolean>(false);

  // Modals state
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<ScheduledTaskItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [travelerTask, setTravelerTask] = useState<ScheduledTaskItem | null>(null);
  const [isTravelerOpen, setIsTravelerOpen] = useState(false);

  const [andonTask, setAndonTask] = useState<ScheduledTaskItem | null>(null);
  const [isAndonOpen, setIsAndonOpen] = useState(false);

  const [isPlcBridgeOpen, setIsPlcBridgeOpen] = useState(false);

  // Live Timer tick
  const [, setTick] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const canExecuteMES =
    currentUser?.role === 'ADMIN' ||
    currentUser?.permissions?.canExecuteMES !== false;

  // Filter tasks
  const filteredTasks = taskList.filter((task) => {
    const matchesSearch =
      task.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.orderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.worker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.machine.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' || task.category === selectedCategory;

    let matchesStatus = true;
    if (selectedStatus === 'ANDON') {
      matchesStatus = task.andonStatus === 'ISSUE_HOLD';
    } else if (selectedStatus !== 'ALL') {
      matchesStatus = task.status === selectedStatus;
    }

    const matchesWorker =
      selectedWorkerFilter === 'ALL' || task.worker === selectedWorkerFilter;

    const matchesMachine =
      selectedMachineFilter === 'ALL' || task.machine === selectedMachineFilter;

    const matchesMyTask =
      !showOnlyMyTasks ||
      (currentUser?.name && task.worker?.trim() === currentUser.name.trim());

    return matchesSearch && matchesCategory && matchesStatus && matchesWorker && matchesMachine && matchesMyTask;
  });

  const completedCount = taskList.filter((i) => i.isCompleted || i.status === 'COMPLETED').length;
  const inProgressCount = taskList.filter((i) => i.status === 'IN_PROGRESS').length;
  const andonCount = taskList.filter((i) => i.andonStatus === 'ISSUE_HOLD').length;
  const readyCount = taskList.filter((i) => i.status === 'READY' || i.status === 'PLANNED' || !i.status).length;

  // Actions
  const handleStartProcess = (processKey: string) => {
    const task = taskList.find((t) => t.processKey === processKey);
    const nowIso = new Date().toISOString();
    const workerName = task?.worker || currentUser?.name || '현장 작업자';
    const existing = processProgressMap[processKey] || {};

    onUpdateProgress(processKey, {
      ...existing,
      status: 'IN_PROGRESS',
      actualStart: nowIso,
      worker: workerName,
      machine: task?.machine || existing.machine,
      isCompleted: false,
      completedAt: null,
    });
  };

  const handleCompleteProcess = (processKey: string) => {
    const task = taskList.find((t) => t.processKey === processKey);
    const now = new Date();
    const nowIso = now.toISOString();
    const existing = processProgressMap[processKey] || {};
    const start = task?.actualStart ? new Date(task.actualStart).getTime() : Date.now() - 3600000;
    const rawMinutes = Math.max(1, Math.round((now.getTime() - start) / 60000));
    const plannedMins = task?.plannedMinutes || (task?.duration ? task.duration * 60 : 60);

    onUpdateProgress(processKey, {
      ...existing,
      status: 'COMPLETED',
      isCompleted: true,
      completedAt: nowIso,
      actualEnd: nowIso,
      actualMinutes: rawMinutes,
      delayMinutes: rawMinutes > plannedMins ? rawMinutes - plannedMins : 0,
      worker: task?.worker || currentUser?.name || existing.worker,
      machine: task?.machine || existing.machine,
    });
  };

  const handleResetProcess = (processKey: string) => {
    const existing = processProgressMap[processKey] || {};
    onUpdateProgress(processKey, {
      ...existing,
      status: 'PLANNED',
      isCompleted: false,
      completedAt: null,
      actualStart: undefined,
      actualEnd: undefined,
      actualMinutes: undefined,
      andonStatus: 'NORMAL',
    });
  };

  const handleUpdateDefectQty = (processKey: string, defectQty: number) => {
    const existing = processProgressMap[processKey] || {};
    onUpdateProgress(processKey, {
      ...existing,
      defectQty,
    });
  };

  // Andon handlers
  const handleOpenAndon = (task: ScheduledTaskItem) => {
    setAndonTask(task);
    setIsAndonOpen(true);
  };

  const handleSubmitAndonIssue = (
    processKey: string,
    issueType: string,
    note: string,
    reporterName: string
  ) => {
    const existing = processProgressMap[processKey] || {};
    const nowIso = new Date().toISOString();
    onUpdateProgress(processKey, {
      ...existing,
      andonStatus: 'ISSUE_HOLD',
      andonIssueType: issueType,
      andonIssueNote: note,
      andonReportedAt: nowIso,
      andonReportedBy: reporterName,
    });
  };

  const handleResolveAndonIssue = (processKey: string, resolveNote: string) => {
    const existing = processProgressMap[processKey] || {};
    onUpdateProgress(processKey, {
      ...existing,
      andonStatus: 'RESOLVED',
      andonIssueNote: `${existing.andonIssueNote || ''} [해제 조치: ${resolveNote}]`,
    });
  };

  // Traveler handler
  const handleOpenTraveler = (task: ScheduledTaskItem) => {
    setTravelerTask(task);
    setIsTravelerOpen(true);
  };

  // PLC rising edge cycle start trigger
  const handleTriggerPlcCycleStart = (machineId: string, machineName: string) => {
    const targetTask = taskList.find(
      (t) => (t.machine?.includes(machineId) || t.machine?.includes(machineName)) && t.status !== 'COMPLETED'
    );
    if (targetTask) {
      handleStartProcess(targetTask.processKey);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 overflow-y-auto p-3 sm:p-5 space-y-4">
      {/* Top Main Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#0066FF] text-white shadow-md shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                현장 모바일 MES 공정 실행 터미널
              </h1>
              <span className="text-[10px] bg-blue-100 text-[#0066FF] px-2.5 py-0.5 rounded-full font-black">
                스마트 공정 실행기
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              원클릭 대형 터치 버튼, 이지 트래블러 QR 라벨 스캔, 안돈 긴급 호출 및 PLC M100 신호 연동
            </p>
          </div>
        </div>

        {/* Action Buttons & Quick KPI Strip */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* PLC Bridge Button */}
          <button
            type="button"
            onClick={() => setIsPlcBridgeOpen(true)}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-xs"
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>PLC IoT 브리지 (M100)</span>
          </button>

          {/* Quick KPI Strip */}
          <div className="flex items-center gap-1.5 text-xs font-black">
            {andonCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedStatus('ANDON')}
                className="px-2.5 py-1.5 rounded-xl bg-red-600 text-white flex items-center gap-1 shadow-sm animate-pulse cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>안돈 {andonCount}건</span>
              </button>
            )}
            <span className="px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              진행중 {inProgressCount}건
            </span>
            <span className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              완료 {completedCount}건
            </span>
            <span className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-300">
              대기 {readyCount}건
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="수주명, 공정명, 설비, 작업자 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF] font-semibold"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowOnlyMyTasks(!showOnlyMyTasks)}
              className={`px-3 py-2 text-xs font-black rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                showOnlyMyTasks
                  ? 'bg-[#0066FF] text-white border-[#0066FF] shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>내 배정 공정만</span>
            </button>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
            >
              <option value="ALL">전체 상태</option>
              <option value="IN_PROGRESS">진행중 (IN_PROGRESS)</option>
              <option value="READY">작업 대기 (READY/PLANNED)</option>
              <option value="COMPLETED">완료 (COMPLETED)</option>
              <option value="ANDON">🚨 안돈 긴급 호출 (ISSUE_HOLD)</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
            >
              <option value="ALL">전체 공정 분류</option>
              <option value="가공">MCT 가공</option>
              <option value="연마">정밀 연마</option>
              <option value="품질">품질 검사</option>
              <option value="후처리">후처리/세척</option>
            </select>

            <select
              value={selectedMachineFilter}
              onChange={(e) => setSelectedMachineFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
            >
              <option value="ALL">전체 설비</option>
              {ALL_EQUIPMENT_LIST.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedWorkerFilter}
              onChange={(e) => setSelectedWorkerFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
            >
              <option value="ALL">전체 작업자</option>
              {approvedOperators.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Unit-by-Unit Floor Process Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 font-bold text-xs">
            조건에 일치하는 현장 작업 공정이 없습니다.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const taskOrder = orders[task.orderId];
            const progressItem = processProgressMap[task.processKey];

            return (
              <FloorProcessCard
                key={task.processKey}
                task={task}
                order={taskOrder}
                progressItem={progressItem}
                canExecuteMES={canExecuteMES}
                onStartProcess={handleStartProcess}
                onCompleteProcess={handleCompleteProcess}
                onResetProcess={handleResetProcess}
                onOpenTraveler={handleOpenTraveler}
                onOpenAndon={handleOpenAndon}
                onUpdateDefectQty={handleUpdateDefectQty}
              />
            );
          })
        )}
      </div>

      {/* Easy Traveler QR Modal */}
      {isTravelerOpen && travelerTask && (
        <EasyTravelerModal
          isOpen={isTravelerOpen}
          onClose={() => {
            setIsTravelerOpen(false);
            setTravelerTask(null);
          }}
          order={orders[travelerTask.orderId] || null}
          taskItem={travelerTask}
          processKey={travelerTask.processKey}
          processName={travelerTask.content}
          assignedMachine={travelerTask.machine}
          assignedWorker={travelerTask.worker}
          plannedMinutes={travelerTask.plannedMinutes}
          category={travelerTask.category}
        />
      )}

      {/* Andon Report Modal */}
      {isAndonOpen && andonTask && (
        <AndonReportModal
          isOpen={isAndonOpen}
          onClose={() => {
            setIsAndonOpen(false);
            setAndonTask(null);
          }}
          taskItem={andonTask}
          currentUser={currentUser}
          onSubmitIssue={handleSubmitAndonIssue}
          onResolveIssue={handleResolveAndonIssue}
        />
      )}

      {/* PLC IoT Bridge Controller Modal */}
      {isPlcBridgeOpen && (
        <PlcBridgeModal
          isOpen={isPlcBridgeOpen}
          onClose={() => setIsPlcBridgeOpen(false)}
          onTriggerPlcCycleStart={handleTriggerPlcCycleStart}
        />
      )}
    </div>
  );
};
