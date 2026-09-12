import React, { useMemo, useState } from 'react';
import {
  Order,
  ProcessStep,
  ProcessCategory,
  ScheduledTaskItem,
  ProcessProgressMap,
  User,
  TaskExecutionStatus
} from '../../types';
import {
  GitMerge,
  Clock,
  Layers,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tag,
  Split,
  Workflow,
  Zap,
  TrendingUp,
  GripVertical,
  Edit3,
  User as UserIcon,
  Cpu,
  Check,
  X,
  Lock,
  Calendar,
  AlertTriangle,
  Info
} from 'lucide-react';
import {
  parseComponentTag,
  getTrackColor,
  getComponentParts,
  isAssemblyTag,
  validateProcessReorder,
  PRESET_COMPONENT_TAGS
} from '../../utils/trackDependencyHelper';

export interface OrderProcessFlowDiagramProps {
  order: Order;
  productType?: { id: string; name: string; processes: ProcessStep[] } | null;
  scheduledTasks?: ScheduledTaskItem[];
  processProgressMap?: ProcessProgressMap;
  currentUser?: User | null;
  canEdit?: boolean;
  onUpdateOrder?: (updatedOrder: Order) => void;
  approvedOperators?: string[];
  usersList?: User[];
  defaultUnit?: number | 'ALL';
}

interface TrackStepInfo {
  step: ProcessStep;
  originalIndex: number;
  task?: ScheduledTaskItem;
  status: TaskExecutionStatus;
  actualMinutes: number;
  plannedMinutes: number;
  machine: string;
  worker: string;
}

interface ComponentTrack {
  tag: string;
  steps: TrackStepInfo[];
  totalPlannedHours: number;
  totalActualHours: number;
  isBottleneck: boolean;
  isAllCompleted: boolean;
  hasInProgress: boolean;
}

export const OrderProcessFlowDiagram: React.FC<OrderProcessFlowDiagramProps> = ({
  order,
  productType,
  scheduledTasks = [],
  processProgressMap = {},
  currentUser,
  canEdit = false,
  onUpdateOrder,
  approvedOperators = [],
  usersList = [],
  defaultUnit = 1
}) => {
  // Selected Unit Filter (e.g. 1, 2... or 'ALL')
  const [selectedUnit, setSelectedUnit] = useState<number | 'ALL'>(defaultUnit);

  // Drag-and-Drop state
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Toast / Alert message state
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);

  // Edit Step Modal state
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<ProcessStep | null>(null);

  // Get current processes array (single source of truth)
  const currentProcesses: ProcessStep[] = useMemo(() => {
    if (order.customProcesses && order.customProcesses.length > 0) {
      return order.customProcesses;
    }
    if (productType?.processes && productType.processes.length > 0) {
      return productType.processes;
    }
    return [];
  }, [order.customProcesses, productType?.processes]);

  // Filter tasks belonging strictly to this order
  const orderTasks = useMemo(() => {
    return scheduledTasks.filter((t) => t.orderId === order.id);
  }, [scheduledTasks, order.id]);

  // Compute unit quantities available
  const unitCount = Math.max(1, parseInt(String(order.qty)) || 1);
  const unitList = useMemo(() => {
    return Array.from({ length: unitCount }, (_, i) => i + 1);
  }, [unitCount]);

  // Tasks filtered for the active unit display
  const activeTasks = useMemo(() => {
    if (selectedUnit === 'ALL') {
      return orderTasks;
    }
    return orderTasks.filter((t) => t.productNo === selectedUnit);
  }, [orderTasks, selectedUnit]);

  // Build step execution info mapping
  const stepInfoList: TrackStepInfo[] = useMemo(() => {
    return currentProcesses.map((step, idx) => {
      // Find matching scheduled tasks for this step
      const matchedTasks = activeTasks.filter((t) => {
        if (t.processKey) {
          return t.processKey.includes(`_P${idx}`);
        }
        return false;
      });

      const firstTask = matchedTasks[0];

      // Resolve status
      let status: TaskExecutionStatus = 'READY';
      let actualMinutes = 0;
      let plannedMinutes = Math.round((step.durationHours || 0) * 60);
      let machine = step.assignedMachine || '';
      let worker = step.assignedWorker || step.worker || '';

      if (matchedTasks.length > 0) {
        // If ALL unit mode, aggregate or take worst status
        const isAllDone = matchedTasks.every((t) => t.isCompleted);
        const hasProgress = matchedTasks.some((t) => t.status === 'IN_PROGRESS');
        const hasDelayed = matchedTasks.some((t) => t.status === 'DELAYED');
        const hasPaused = matchedTasks.some((t) => t.status === 'PAUSED');

        if (isAllDone) {
          status = 'COMPLETED';
        } else if (hasProgress) {
          status = 'IN_PROGRESS';
        } else if (hasDelayed) {
          status = 'DELAYED';
        } else if (hasPaused) {
          status = 'PAUSED';
        } else {
          status = firstTask.status || 'READY';
        }

        actualMinutes = matchedTasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0);
        if (selectedUnit === 'ALL' && matchedTasks.length > 1) {
          actualMinutes = Math.round(actualMinutes / matchedTasks.length);
        }

        if (firstTask.machine) machine = firstTask.machine;
        if (firstTask.worker) worker = firstTask.worker;
        if (firstTask.plannedMinutes) plannedMinutes = firstTask.plannedMinutes;
      } else {
        // Fallback to processProgressMap
        const qNo = typeof selectedUnit === 'number' ? selectedUnit : 1;
        const pKey = `${order.id}_Q${qNo}_P${idx}`;
        const pInfo = processProgressMap[pKey];
        if (pInfo) {
          if (pInfo.isCompleted || pInfo.completed) status = 'COMPLETED';
          else if (pInfo.status) status = pInfo.status;
          if (pInfo.machine) machine = pInfo.machine;
          if (pInfo.worker) worker = pInfo.worker;
          if (pInfo.actualMinutes) actualMinutes = pInfo.actualMinutes;
        }
      }

      return {
        step,
        originalIndex: idx,
        task: firstTask,
        status,
        actualMinutes,
        plannedMinutes,
        machine,
        worker
      };
    });
  }, [currentProcesses, activeTasks, selectedUnit, order.id, processProgressMap]);

  // Group steps into tracks, assembly convergence, and final quality phases
  const {
    singleTracks,
    assemblySteps,
    finalSteps,
    maxTrackHours,
    bottleneckTrackName,
    totalSequentialHours,
    estimatedCriticalPathHours,
    hasComponentTracks
  } = useMemo(() => {
    const totalSeq = currentProcesses.reduce((sum, p) => sum + (p.durationHours || 0), 0);

    const trackMap = new Map<string, TrackStepInfo[]>();
    const assemblies: TrackStepInfo[] = [];
    const finals: TrackStepInfo[] = [];

    let reachedAssembly = false;

    stepInfoList.forEach((info) => {
      const { step } = info;
      const tag = (step.componentTag || parseComponentTag(step.name, '', '')).trim();

      if (isAssemblyTag(tag) || step.name.includes('용접') || step.name.includes('조립')) {
        reachedAssembly = true;
        assemblies.push(info);
      } else if (reachedAssembly && (!tag || tag === '공통' || tag === 'Default')) {
        finals.push(info);
      } else if (tag && !tag.includes('+')) {
        const existing = trackMap.get(tag) || [];
        existing.push(info);
        trackMap.set(tag, existing);
      } else if (reachedAssembly) {
        assemblies.push(info);
      } else {
        const commonTag = '공통';
        const existing = trackMap.get(commonTag) || [];
        existing.push(info);
        trackMap.set(commonTag, existing);
      }
    });

    const tracksList: ComponentTrack[] = [];
    let maxHours = 0;
    let bTrack = '';

    trackMap.forEach((steps, tag) => {
      const totalPlanned = steps.reduce((sum, s) => sum + (s.step.durationHours || 0), 0);
      const totalActual = steps.reduce((sum, s) => sum + s.actualMinutes / 60, 0);

      if (totalPlanned > maxHours) {
        maxHours = totalPlanned;
        bTrack = tag;
      }

      const isAllDone = steps.every((s) => s.status === 'COMPLETED');
      const hasInProgress = steps.some((s) => s.status === 'IN_PROGRESS' || s.status === 'DELAYED');

      tracksList.push({
        tag,
        steps,
        totalPlannedHours: totalPlanned,
        totalActualHours: totalActual,
        isBottleneck: false,
        isAllCompleted: isAllDone,
        hasInProgress
      });
    });

    tracksList.forEach((t) => {
      if (t.tag === bTrack && maxHours > 0) {
        t.isBottleneck = true;
      }
    });

    // Priority sort
    const priorityOrder = ['Base', 'Head', 'Block', 'Pipe', '공통'];
    tracksList.sort((a, b) => {
      const aIdx = priorityOrder.indexOf(a.tag);
      const bIdx = priorityOrder.indexOf(b.tag);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.tag.localeCompare(b.tag);
    });

    const assemblyTotal = assemblies.reduce((sum, s) => sum + (s.step.durationHours || 0), 0);
    const finalTotal = finals.reduce((sum, s) => sum + (s.step.durationHours || 0), 0);
    const critPathHours = maxHours + assemblyTotal + finalTotal;

    const hasTracks = tracksList.some((t) => t.tag !== '공통') || tracksList.length > 1;

    return {
      singleTracks: tracksList,
      assemblySteps: assemblies,
      finalSteps: finals,
      maxTrackHours: maxHours,
      bottleneckTrackName: bTrack,
      totalSequentialHours: totalSeq,
      estimatedCriticalPathHours: critPathHours,
      hasComponentTracks: hasTracks
    };
  }, [currentProcesses, stepInfoList]);

  const timeSaved = Math.max(0, totalSequentialHours - estimatedCriticalPathHours);

  // Overall order progress calculation
  const progressStats = useMemo(() => {
    const total = stepInfoList.length;
    if (total === 0) return { percent: 0, completed: 0, inProgress: 0, delayed: 0, ready: 0 };

    const completed = stepInfoList.filter((s) => s.status === 'COMPLETED').length;
    const inProgress = stepInfoList.filter((s) => s.status === 'IN_PROGRESS').length;
    const delayed = stepInfoList.filter((s) => s.status === 'DELAYED').length;
    const ready = total - completed - inProgress - delayed;
    const percent = Math.round((completed / total) * 100);

    return { percent, completed, inProgress, delayed, ready };
  }, [stepInfoList]);

  // Helper for Category badge class
  const getCategoryBadgeClass = (category: ProcessCategory) => {
    switch (category) {
      case '가공':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case '연마':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case '외주':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case '품질':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Helper for Status badge
  const renderStatusBadge = (status: TaskExecutionStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="whitespace-nowrap inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded-md">
            <Check className="w-2.5 h-2.5" />
            완료
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="whitespace-nowrap inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-300 px-1.5 py-0.5 rounded-md animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            진행중
          </span>
        );
      case 'DELAYED':
        return (
          <span className="whitespace-nowrap inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-300 px-1.5 py-0.5 rounded-md">
            <AlertTriangle className="w-2.5 h-2.5" />
            지연
          </span>
        );
      case 'PAUSED':
        return (
          <span className="whitespace-nowrap inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded-md">
            일시정지
          </span>
        );
      default:
        return (
          <span className="whitespace-nowrap inline-flex items-center text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
            대기
          </span>
        );
    }
  };

  // Drag and Drop Reordering Handlers
  const handleDragStart = (e: React.DragEvent, originalIndex: number) => {
    if (!canEdit) {
      e.preventDefault();
      setToastMessage({
        type: 'warning',
        text: '⚠️ 공정 순서 변경 권한이 없습니다. (영업팀/경영진 등 읽기 전용 계정은 모니터링만 가능합니다)'
      });
      return;
    }
    setDraggingIndex(originalIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(originalIndex));
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!canEdit) return;
    if (dragOverIndex !== targetIndex) {
      setDragOverIndex(targetIndex);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (!canEdit) return;

    if (draggingIndex === null || draggingIndex === targetIndex) {
      setDraggingIndex(null);
      return;
    }

    // Validate dependency integrity
    const validation = validateProcessReorder(currentProcesses, draggingIndex, targetIndex);
    if (!validation.isValid) {
      setToastMessage({
        type: 'error',
        text: `⚠️ 순서 변경 불가: ${validation.reason || '의존관계를 위반합니다.'}`
      });
      setDraggingIndex(null);
      return;
    }

    // Reorder the customProcesses array
    const nextProcesses = [...currentProcesses];
    const [movedStep] = nextProcesses.splice(draggingIndex, 1);
    nextProcesses.splice(targetIndex, 0, movedStep);

    // Create updated order
    const updatedOrder: Order = {
      ...order,
      customProcesses: nextProcesses
    };

    if (onUpdateOrder) {
      onUpdateOrder(updatedOrder);
      setToastMessage({
        type: 'success',
        text: `✅ '${movedStep.name}' 공정 순서가 성공적으로 변경되었습니다.`
      });
    }

    setDraggingIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  // Open Step Edit Modal
  const handleOpenEdit = (originalIndex: number) => {
    const step = currentProcesses[originalIndex];
    if (!step) return;
    setEditingStepIndex(originalIndex);
    setEditFormData({ ...step });
  };

  // Save Step Edit
  const handleSaveStepEdit = () => {
    if (editingStepIndex === null || !editFormData) return;
    if (!canEdit) {
      setToastMessage({
        type: 'warning',
        text: '⚠️ 공정 수정 권한이 없습니다.'
      });
      return;
    }

    const nextProcesses = [...currentProcesses];
    nextProcesses[editingStepIndex] = {
      ...editFormData,
      durationHours: Number(editFormData.durationHours) || 0.1
    };

    const updatedOrder: Order = {
      ...order,
      customProcesses: nextProcesses
    };

    if (onUpdateOrder) {
      onUpdateOrder(updatedOrder);
      setToastMessage({
        type: 'success',
        text: `✅ '${editFormData.name}' 공정 정보가 저장되었습니다.`
      });
    }

    setEditingStepIndex(null);
    setEditFormData(null);
  };

  return (
    <div className="space-y-5">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold border flex items-center justify-between transition shadow-sm animate-in fade-in duration-150 ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-300 text-amber-800'
              : 'bg-emerald-50 border-emerald-300 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            ) : toastMessage.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Critical Path & Parallel Track Metric Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  {hasComponentTracks
                    ? '부품별 병렬 공정 & 조립 합류 흐름도'
                    : '공정 흐름도 (순차 파이프라인)'}
                </h3>
                <span className="whitespace-nowrap text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                  {order.pjtNo || order.name}
                </span>
                {!canEdit && (
                  <span className="whitespace-nowrap inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                    <Lock className="w-2.5 h-2.5" />
                    조회 전용 (모니터링)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {hasComponentTracks
                  ? '단품 부품(Base, Head, Block, Pipe)들이 독립적으로 동시 가공되며, 조립(용접) 시점에 하나로 합류합니다.'
                  : '등록된 표준 공정 순서에 따라 단계별로 순차 진행되는 공정 파이프라인입니다.'}
              </p>
            </div>
          </div>

          {/* Unit Switcher Tabs (if qty > 1) */}
          {unitCount > 1 && (
            <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs">
              <span className="text-[11px] font-bold text-slate-400 px-2">호기 선택:</span>
              <button
                type="button"
                onClick={() => setSelectedUnit('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer whitespace-nowrap ${
                  selectedUnit === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                전체 ({unitCount}개)
              </button>
              {unitList.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setSelectedUnit(u)}
                  className={`px-2 py-1 rounded-lg font-bold text-xs transition cursor-pointer whitespace-nowrap ${
                    selectedUnit === u
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  #{u}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lead time comparison cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/40">
            <span className="text-[11px] text-slate-400 block font-medium">
              기존 단일 순차 계산 (Flat Sum)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-slate-300 font-mono">
                {totalSequentialHours.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-bold">시간</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {currentProcesses.length}개 공정을 1열 직렬로 진행할 때 총 소요시간
            </p>
          </div>

          <div className="bg-indigo-950/60 rounded-xl p-3 border border-indigo-700/50">
            <span className="text-[11px] text-indigo-300 block font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              병렬 스케줄링 임계경로 시간 (Critical Path)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-amber-300 font-mono">
                {estimatedCriticalPathHours.toFixed(1)}
              </span>
              <span className="text-xs text-amber-200/80 font-bold">시간</span>
            </div>
            <p className="text-[10px] text-indigo-300/80 mt-1">
              {hasComponentTracks && bottleneckTrackName
                ? `최장 부품 트랙(${bottleneckTrackName}) + 조립/후공정 소요시간`
                : '순차 진행 임계 공정 계획 시간'}
            </p>
          </div>

          <div className="bg-emerald-950/50 rounded-xl p-3 border border-emerald-700/40">
            <span className="text-[11px] text-emerald-300 block font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              병렬 동시 가공으로 단축되는 리드타임
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-emerald-400 font-mono">
                약 {timeSaved.toFixed(1)}
              </span>
              <span className="text-xs text-emerald-300/80 font-bold">시간 단축</span>
            </div>
            <p className="text-[10px] text-emerald-400/70 mt-1">
              독립 부품들을 병렬 설비에서 동시 가공함에 따른 납기 단축 효과
            </p>
          </div>
        </div>

        {/* Real-time Execution Summary Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-bold">실시간 진행 현황:</span>
            <span className="text-white font-mono font-black">{progressStats.percent}%</span>
            <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${progressStats.percent}%` }}
              ></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold font-mono">완료 {progressStats.completed}</span>
            <span className="text-slate-600">•</span>
            <span className="text-blue-400 font-bold font-mono">진행 {progressStats.inProgress}</span>
            {progressStats.delayed > 0 && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-rose-400 font-bold font-mono">지연 {progressStats.delayed}</span>
              </>
            )}
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-bold font-mono">대기 {progressStats.ready}</span>
          </div>
        </div>
      </div>

      {/* Reorder instructions banner for editable users */}
      {canEdit && (
        <div className="flex items-center justify-between text-xs bg-indigo-50/70 border border-indigo-200 text-indigo-800 px-3.5 py-2 rounded-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>공정 순서 변경 및 편집:</strong> 카드를 드래그 앤 드롭하여 공정 순서를 변경하거나, 카드를 클릭하여 설비·담당자·소요시간을 즉시 수정할 수 있습니다. (의존관계 자동 검증)
            </span>
          </div>
          <span className="text-[11px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-200 shrink-0">
            실시간 Firestore 동기화
          </span>
        </div>
      )}

      {/* 2. Parallel Component Tracks (or Sequential Chain if no component tags) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Split className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-extrabold text-slate-900">
              {hasComponentTracks
                ? '단품 부품별 독립 병렬 가공 트랙 (Parallel Component Tracks)'
                : '공정 파이프라인 (Sequential Steps)'}
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {hasComponentTracks
              ? '수주 시작 시점부터 각 부품 트랙이 서로 간섭 없이 독립적으로 동시 가공됩니다.'
              : '순서대로 진행되는 공정 단계 목록입니다.'}
          </span>
        </div>

        {hasComponentTracks ? (
          /* Multi-track grid layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {singleTracks.map((track) => {
              const color = getTrackColor(track.tag);

              return (
                <div
                  key={track.tag}
                  className={`bg-white rounded-2xl border ${
                    track.isBottleneck
                      ? 'border-amber-400 shadow-md ring-2 ring-amber-300/30'
                      : 'border-slate-200 shadow-2xs'
                  } overflow-hidden flex flex-col`}
                >
                  {/* Track Header - whitespace-nowrap guaranteed */}
                  <div
                    className={`p-3.5 border-b ${
                      track.isBottleneck ? 'bg-amber-50/80 border-amber-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`whitespace-nowrap inline-flex items-center shrink-0 text-xs font-black px-2.5 py-1 rounded-lg border ${color.badge}`}
                        >
                          [{track.tag}] 트랙
                        </span>
                        {track.isBottleneck && (
                          <span className="whitespace-nowrap inline-flex items-center text-[10px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded shadow-2xs animate-pulse">
                            🔥 Critical Path
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs font-black text-slate-700 whitespace-nowrap">
                        {track.totalPlannedHours.toFixed(1)}h
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>총 {track.steps.length}개 공정</span>
                      {track.isAllCompleted ? (
                        <span className="whitespace-nowrap text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          ✓ 전체 완료
                        </span>
                      ) : track.hasInProgress ? (
                        <span className="whitespace-nowrap text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          진행중
                        </span>
                      ) : (
                        <span className="whitespace-nowrap text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          병렬 시작 가능
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Track Steps List */}
                  <div className="p-3 space-y-2 bg-slate-50/40">
                    {track.steps.map((info, sIdx) => {
                      const isLast = sIdx === track.steps.length - 1;
                      const isDraggingThis = draggingIndex === info.originalIndex;
                      const isDragOverThis = dragOverIndex === info.originalIndex;

                      return (
                        <React.Fragment key={info.originalIndex}>
                          <div
                            draggable={canEdit}
                            onDragStart={(e) => handleDragStart(e, info.originalIndex)}
                            onDragOver={(e) => handleDragOver(e, info.originalIndex)}
                            onDrop={(e) => handleDrop(e, info.originalIndex)}
                            onDragEnd={handleDragEnd}
                            onClick={() => handleOpenEdit(info.originalIndex)}
                            className={`bg-white p-3 rounded-xl border transition cursor-pointer group select-none ${
                              isDraggingThis
                                ? 'opacity-40 border-dashed border-indigo-400 bg-indigo-50/30'
                                : isDragOverThis
                                ? 'border-2 border-indigo-600 shadow-md bg-indigo-50/40'
                                : 'border-slate-200 hover:border-indigo-400 hover:shadow-xs'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5 mb-1.5">
                              <div className="flex items-center gap-1.5">
                                {canEdit && (
                                  <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 cursor-grab" />
                                )}
                                <span className="font-mono text-[10px] font-bold text-slate-400">
                                  #{info.originalIndex + 1}
                                </span>
                                <span
                                  className={`whitespace-nowrap text-[9px] font-black px-1.5 py-0.2 rounded border ${getCategoryBadgeClass(
                                    info.step.category
                                  )}`}
                                >
                                  {info.step.category === '품질' ? 'CMM' : info.step.category}
                                </span>
                              </div>
                              {renderStatusBadge(info.status)}
                            </div>

                            <p className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition truncate">
                              {info.step.name}
                            </p>

                            {/* Machine and Worker */}
                            <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">설비:</span>
                                <span className="font-bold text-slate-700 truncate max-w-[120px]">
                                  {info.machine || '미지정'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">담당:</span>
                                <span className="font-bold text-slate-700 truncate max-w-[120px]">
                                  {info.worker || '미지정'}
                                </span>
                              </div>
                            </div>

                            {/* Timing planned vs actual */}
                            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px]">
                              <span className="text-slate-500">
                                계획 <strong className="font-mono text-indigo-700">{info.step.durationHours}h</strong>
                              </span>
                              <span className="text-slate-500">
                                실적{' '}
                                <strong className="font-mono text-slate-800">
                                  {(info.actualMinutes / 60).toFixed(1)}h
                                </strong>
                              </span>
                            </div>
                          </div>

                          {!isLast && (
                            <div className="flex justify-center py-0.5">
                              <ArrowDown className="w-3.5 h-3.5 text-slate-300" />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}

                    {/* Track Completion Milestone Marker - whitespace-nowrap */}
                    <div className="mt-3 pt-2 border-t-2 border-dashed border-slate-300 text-center">
                      <div className="whitespace-nowrap inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>[{track.tag}] 가공 완료 시 조립 대기</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Single Sequential Process Chain */
          <div className="space-y-2">
            {stepInfoList.map((info, sIdx) => {
              const isLast = sIdx === stepInfoList.length - 1;
              const isDraggingThis = draggingIndex === info.originalIndex;
              const isDragOverThis = dragOverIndex === info.originalIndex;

              return (
                <React.Fragment key={info.originalIndex}>
                  <div
                    draggable={canEdit}
                    onDragStart={(e) => handleDragStart(e, info.originalIndex)}
                    onDragOver={(e) => handleDragOver(e, info.originalIndex)}
                    onDrop={(e) => handleDrop(e, info.originalIndex)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleOpenEdit(info.originalIndex)}
                    className={`bg-white p-3.5 rounded-2xl border transition cursor-pointer group flex flex-wrap items-center justify-between gap-3 ${
                      isDraggingThis
                        ? 'opacity-40 border-dashed border-indigo-400 bg-indigo-50/30'
                        : isDragOverThis
                        ? 'border-2 border-indigo-600 shadow-md bg-indigo-50/40'
                        : 'border-slate-200 hover:border-indigo-400 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {canEdit && (
                        <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 cursor-grab shrink-0" />
                      )}
                      <span className="font-mono text-xs font-extrabold text-slate-400 w-8 text-center">
                        #{info.originalIndex + 1}
                      </span>
                      <span
                        className={`whitespace-nowrap text-[10px] font-black px-2 py-0.5 rounded border ${getCategoryBadgeClass(
                          info.step.category
                        )}`}
                      >
                        {info.step.category}
                      </span>
                      <div>
                        <p className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition">
                          {info.step.name}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                          <span>
                            설비: <strong className="text-slate-700">{info.machine || '미지정'}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            담당: <strong className="text-slate-700">{info.worker || '미지정'}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">표준 계획</span>
                        <span className="font-mono font-black text-indigo-700">{info.step.durationHours}h</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">실적 소요</span>
                        <span className="font-mono font-black text-slate-800">
                          {(info.actualMinutes / 60).toFixed(1)}h
                        </span>
                      </div>
                      <div>{renderStatusBadge(info.status)}</div>
                    </div>
                  </div>

                  {!isLast && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Assembly & Merge Convergence Section */}
      {assemblySteps.length > 0 && (
        <div className="space-y-3">
          {/* Visual Convergence Arrow Banner */}
          <div className="flex flex-col items-center justify-center py-2 text-center">
            <div className="w-full border-t border-indigo-200 relative mb-4">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-black px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs whitespace-nowrap">
                <GitMerge className="w-3.5 h-3.5 text-indigo-600" />
                <span>독립 부품 트랙 완료 후 조립 합류 지점 (Convergence Junction)</span>
              </span>
            </div>
            <ArrowDown className="w-6 h-6 text-indigo-500 animate-bounce" />
          </div>

          <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <GitMerge className="w-4 h-4 text-indigo-700 shrink-0" />
                <h4 className="text-sm font-extrabold text-indigo-950">
                  조립 및 합류 공정 (Assembly & Convergence)
                </h4>
              </div>
              <span className="text-xs text-indigo-700 font-bold">
                선행 지정 부품들의 가공이 모두 완료되어야 현장에서 착수할 수 있습니다.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {assemblySteps.map((info) => {
                const tag = (info.step.componentTag || parseComponentTag(info.step.name, '', '')).trim();
                const parts = getComponentParts(tag);
                const isDraggingThis = draggingIndex === info.originalIndex;
                const isDragOverThis = dragOverIndex === info.originalIndex;

                return (
                  <div
                    key={info.originalIndex}
                    draggable={canEdit}
                    onDragStart={(e) => handleDragStart(e, info.originalIndex)}
                    onDragOver={(e) => handleDragOver(e, info.originalIndex)}
                    onDrop={(e) => handleDrop(e, info.originalIndex)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleOpenEdit(info.originalIndex)}
                    className={`bg-white rounded-xl p-3.5 border transition cursor-pointer space-y-2.5 ${
                      isDraggingThis
                        ? 'opacity-40 border-dashed border-indigo-400 bg-indigo-50/30'
                        : isDragOverThis
                        ? 'border-2 border-indigo-600 shadow-md bg-indigo-50/40'
                        : 'border-indigo-200 hover:border-indigo-400 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {canEdit && (
                          <GripVertical className="w-3.5 h-3.5 text-slate-300 hover:text-indigo-500 cursor-grab" />
                        )}
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          #{info.originalIndex + 1}
                        </span>
                        <span
                          className={`whitespace-nowrap text-[9px] font-black px-1.5 py-0.5 rounded border ${getCategoryBadgeClass(
                            info.step.category
                          )}`}
                        >
                          {info.step.category}
                        </span>
                      </div>
                      {renderStatusBadge(info.status)}
                    </div>

                    <p className="text-xs font-black text-slate-900 truncate">{info.step.name}</p>

                    {/* Pre-requisite Components Tag Highlight */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 space-y-1">
                      <span className="text-[10px] font-bold text-amber-800 block">
                        🔗 필수 선행 부품 (합류 조건):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {parts.length > 0 ? (
                          parts.map((p) => (
                            <span
                              key={p}
                              className="whitespace-nowrap text-[10px] font-black bg-white text-slate-800 border border-amber-300 px-1.5 py-0.5 rounded shadow-2xs"
                            >
                              ✓ [{p}] 완료 필수
                            </span>
                          ))
                        ) : (
                          <span className="whitespace-nowrap text-[10px] font-bold text-amber-700">
                            모든 선행 부품 트랙 완료 필요
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Machine & Worker */}
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>설비: {info.machine || '미지정'}</span>
                      <span>담당: {info.worker || '미지정'}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>소요시간</span>
                      <span className="font-mono font-bold text-indigo-700">
                        {info.step.durationHours}h
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Final Quality & Outgoing Section */}
      {finalSteps.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-extrabold text-slate-900">
              최종 품질 검사 및 출하 (Final Quality & Outgoing)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {finalSteps.map((info) => {
              const isDraggingThis = draggingIndex === info.originalIndex;
              const isDragOverThis = dragOverIndex === info.originalIndex;

              return (
                <div
                  key={info.originalIndex}
                  draggable={canEdit}
                  onDragStart={(e) => handleDragStart(e, info.originalIndex)}
                  onDragOver={(e) => handleDragOver(e, info.originalIndex)}
                  onDrop={(e) => handleDrop(e, info.originalIndex)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleOpenEdit(info.originalIndex)}
                  className={`bg-white rounded-xl p-3 border transition cursor-pointer space-y-1.5 ${
                    isDraggingThis
                      ? 'opacity-40 border-dashed border-indigo-400 bg-indigo-50/30'
                      : isDragOverThis
                      ? 'border-2 border-indigo-600 shadow-md bg-indigo-50/40'
                      : 'border-slate-200 hover:border-emerald-400 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {canEdit && (
                        <GripVertical className="w-3.5 h-3.5 text-slate-300 hover:text-indigo-500 cursor-grab" />
                      )}
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        #{info.originalIndex + 1}
                      </span>
                      <span
                        className={`whitespace-nowrap text-[9px] font-black px-1.5 py-0.5 rounded border ${getCategoryBadgeClass(
                          info.step.category
                        )}`}
                      >
                        {info.step.category}
                      </span>
                    </div>
                    {renderStatusBadge(info.status)}
                  </div>
                  <p className="text-xs font-extrabold text-slate-900 truncate">{info.step.name}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>소요시간</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {info.step.durationHours}h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: Edit Process Step Modal                                       */}
      {/* ==================================================================== */}
      {editingStepIndex !== null && editFormData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900">
                      공정 상세 정보 {canEdit ? '수정' : '조회'}
                    </h3>
                    <span className="font-mono text-xs font-bold text-slate-400">
                      #{editingStepIndex + 1}
                    </span>
                    {!canEdit && (
                      <span className="whitespace-nowrap text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded">
                        🔒 조회 전용
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    수주 #{order.pjtNo || order.name}의 공정 정보입니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingStepIndex(null);
                  setEditFormData(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {!canEdit && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    영업팀, 경영진 등 읽기 전용 계정은 모니터링만 가능하며 공정 설정을 수정할 수 없습니다.
                  </span>
                </div>
              )}

              {/* Process Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  공정명 (Process Step)
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="예: MCT 형상 가공_Base"
                />
              </div>

              {/* Category & Standard Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    공정 카테고리
                  </label>
                  <select
                    disabled={!canEdit}
                    value={editFormData.category}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        category: e.target.value as ProcessCategory
                      })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="가공">가공 (MCT)</option>
                    <option value="연마">연마 (Grind)</option>
                    <option value="외주">외주 (Outsource)</option>
                    <option value="품질">품질 (CMM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    표준 계획 소요시간 (h)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    disabled={!canEdit}
                    value={editFormData.durationHours}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        durationHours: parseFloat(e.target.value) || 0.1
                      })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-indigo-700 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>

              {/* Component Track Tag */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  부품 트랙 태그 (Component Tag)
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={editFormData.componentTag || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, componentTag: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                    placeholder="예: Base, Head, Block, Pipe, Block+Pipe"
                  />
                  {canEdit && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {PRESET_COMPONENT_TAGS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setEditFormData({ ...editFormData, componentTag: t })}
                          className="whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 cursor-pointer"
                        >
                          +{t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Machine & Worker */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    배정 설비
                  </label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={editFormData.assignedMachine || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, assignedMachine: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                    placeholder="예: MCT-01"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    담당 작업자
                  </label>
                  {approvedOperators.length > 0 && canEdit ? (
                    <select
                      value={editFormData.assignedWorker || editFormData.worker || ''}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          assignedWorker: e.target.value,
                          worker: e.target.value
                        })
                      }
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">담당자 미지정</option>
                      {approvedOperators.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={editFormData.assignedWorker || editFormData.worker || ''}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          assignedWorker: e.target.value,
                          worker: e.target.value
                        })
                      }
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                      placeholder="예: 홍길동"
                    />
                  )}
                </div>
              </div>

              {/* Memo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  공정 메모 / 특이사항
                </label>
                <textarea
                  rows={2}
                  disabled={!canEdit}
                  value={editFormData.memo || editFormData.description || ''}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      memo: e.target.value,
                      description: e.target.value
                    })
                  }
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl text-slate-800 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 resize-none"
                  placeholder="공정 주의사항 및 특이사항을 입력하세요"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingStepIndex(null);
                  setEditFormData(null);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                닫기
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={handleSaveStepEdit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition cursor-pointer shadow-sm"
                >
                  저장하기
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
