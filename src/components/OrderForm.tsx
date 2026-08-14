import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Order,
  ProductType,
  ProcessProgressMap,
  ProcessStep,
  ProcessCategory,
  ScheduledTaskItem,
  User
} from '../types';
import {
  MCT_MACHINES,
  GRINDER_MACHINES,
  CMM_MACHINES
} from '../data/defaultData';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import {
  ShoppingCart,
  Plus,
  Calendar,
  Layers,
  Cpu,
  UserCheck,
  Zap,
  CheckCircle2,
  FileText,
  AlertCircle,
  Copy,
  Archive,
  Sparkles,
  X,
  Search,
  ArrowUp,
  ArrowDown,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface OrderFormProps {
  productTypes: Record<string, ProductType>;
  orders?: Record<string, Order>;
  approvedOperators?: string[];
  onCreateOrder: (newOrder: Order, initialProgressMap?: ProcessProgressMap) => void;
  onUpdateOrder?: (updatedOrder: Order) => void;
  onDeleteOrder?: (orderId: string) => void;
  onArchiveOrder?: (orderId: string) => void;
  onCompleteAllOrderProcesses?: (
    orderId: string,
    forceComplete: boolean,
    overrideProcesses?: ProcessStep[],
    overrideQty?: number
  ) => void;
  scheduledTasks?: ScheduledTaskItem[];
  currentUser?: User | null;
  processProgressMap?: ProcessProgressMap;
  pendingCopyOrder?: Order | null;
  onClearPendingCopyOrder?: () => void;
  onOpenNewTypeModal?: () => void;
  onOpenCopyTypeModal?: () => void;
  onOrderCreatedSuccess?: () => void;
}

interface StepAssignment {
  machine: string;
  worker: string;
}

interface ResourceBusyInfo {
  orderName: string;
  orderId: string;
  productNo: number;
  processName: string;
  status: string;
  worker?: string;
  machine?: string;
}

interface ConflictItem {
  stepIndex: number;
  stepName: string;
  type: 'MACHINE' | 'WORKER';
  resourceName: string;
  busyInfo: ResourceBusyInfo;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  productTypes,
  orders = {},
  approvedOperators = [],
  onCreateOrder,
  onUpdateOrder,
  onDeleteOrder,
  onArchiveOrder,
  onCompleteAllOrderProcesses,
  scheduledTasks = [],
  currentUser,
  processProgressMap,
  pendingCopyOrder,
  onClearPendingCopyOrder,
  onOpenNewTypeModal,
  onOpenCopyTypeModal,
  onOrderCreatedSuccess,
}) => {
  const canEditOrder =
    !currentUser ||
    currentUser.role === 'ADMIN' ||
    currentUser.permissions?.canEditOrder === true;

  const canArchive =
    !currentUser ||
    currentUser.role === 'ADMIN' ||
    currentUser.permissions?.canArchive === true;

  const getCurrentDateTimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Form Basic Fields
  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState<string>(() => {
    return productTypes['TYPE_SLIT_NOZZLE'] ? 'TYPE_SLIT_NOZZLE' : Object.keys(productTypes)[0] || 'TYPE_CUSTOM';
  });
  const [qty, setQty] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>(getCurrentDateTimeString);
  const [memo, setMemo] = useState<string>('');

  // Editable Process Steps State
  const [currentProcesses, setCurrentProcesses] = useState<ProcessStep[]>([]);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // Per-step machine & worker assignment state
  const [stepAssignments, setStepAssignments] = useState<Record<number, StepAssignment>>({});

  // Archive copy modal state
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveSearchTerm, setArchiveSearchTerm] = useState('');
  const [copiedSourceOrder, setCopiedSourceOrder] = useState<Order | null>(null);
  const skipTypeResetRef = useRef(false);

  // Resource Conflict Confirmation Modal State
  const [pendingConflicts, setPendingConflicts] = useState<ConflictItem[] | null>(null);
  const [pendingSubmitPayload, setPendingSubmitPayload] = useState<{
    order: Order;
    initialProgressMap: ProcessProgressMap;
  } | null>(null);

  // Compute busy machines and workers from active tasks
  const { busyMachinesMap, busyWorkersMap } = useMemo(() => {
    const bMachines = new Map<string, ResourceBusyInfo>();
    const bWorkers = new Map<string, ResourceBusyInfo>();

    const activeTasks = scheduledTasks.filter(
      (t) => (t.status === 'IN_PROGRESS' || t.status === 'PAUSED') && !t.isCompleted
    );

    activeTasks.forEach((t) => {
      const info: ResourceBusyInfo = {
        orderName: t.orderName,
        orderId: t.orderId,
        productNo: t.productNo,
        processName: t.groupName,
        status: t.status === 'IN_PROGRESS' ? '작업 가동중' : '일시정지 중',
        machine: t.machine,
        worker: t.worker,
      };

      if (t.machine && t.machine !== '(외주/협력사)' && t.machine !== '(미지정)') {
        bMachines.set(t.machine, info);
      }

      if (t.worker && t.worker.trim() !== '' && t.worker !== '(미지정)') {
        bWorkers.set(t.worker.trim(), info);
      }
    });

    return { busyMachinesMap: bMachines, busyWorkersMap: bWorkers };
  }, [scheduledTasks]);

  // Options for Equipment Searchable Select with Busy status indicator
  const equipmentOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: '(미지정)' },
      ...MCT_MACHINES.map((m) => {
        const busy = busyMachinesMap.get(m);
        return {
          value: m,
          label: busy ? `${m} ⚠️(현재 가동중)` : m,
          badge: busy ? '가동중 충돌주의' : 'MCT가공',
          badgeColor: busy
            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
            : 'bg-indigo-100 text-indigo-800 border border-indigo-200',
        };
      }),
      ...GRINDER_MACHINES.map((m) => {
        const busy = busyMachinesMap.get(m);
        return {
          value: m,
          label: busy ? `${m} ⚠️(현재 가동중)` : m,
          badge: busy ? '가동중 충돌주의' : '연마설비',
          badgeColor: busy
            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
            : 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        };
      }),
      ...CMM_MACHINES.map((m) => {
        const busy = busyMachinesMap.get(m);
        return {
          value: m,
          label: busy ? `${m} ⚠️(현재 가동중)` : m,
          badge: busy ? '가동중 충돌주의' : 'CMM측정',
          badgeColor: busy
            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
            : 'bg-purple-100 text-purple-800 border border-purple-200',
        };
      }),
      {
        value: '(외주/협력사)',
        label: '(외주/협력사)',
        badge: '외주',
        badgeColor: 'bg-amber-100 text-amber-800',
      },
    ];
  }, [busyMachinesMap]);

  // Options for Operator Searchable Select with Busy status indicator
  const operatorOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: '(미지정)' },
      ...approvedOperators.map((op) => {
        const busy = busyWorkersMap.get(op.trim());
        return {
          value: op,
          label: busy ? `${op} ⚠️(작업중)` : op,
          badge: busy ? '작업중 충돌주의' : '승인회원',
          badgeColor: busy
            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
            : 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        };
      }),
    ];
  }, [approvedOperators, busyWorkersMap]);

  // Sync process steps and assignments when productType changes
  useEffect(() => {
    if (skipTypeResetRef.current) {
      skipTypeResetRef.current = false;
      return;
    }

    if (typeId === 'TYPE_CUSTOM') {
      setIsCustomMode(true);
      const customType = productTypes['TYPE_CUSTOM'];
      const initSteps: ProcessStep[] = customType?.processes?.length
        ? customType.processes.map((p) => ({ ...p }))
        : [
            { name: '1차 MCT 가공', category: '가공', durationHours: 4.0 },
            { name: '정밀 평면 연마', category: '연마', durationHours: 3.0 },
            { name: 'CMM 3차원 정밀 측정 및 검사', category: '품질', durationHours: 1.0 },
          ];

      setCurrentProcesses(initSteps);
      initStepAssignments(initSteps);
      return;
    }

    const selectedType = productTypes[typeId];
    if (selectedType && selectedType.processes) {
      const steps = selectedType.processes.map((p) => ({ ...p }));
      setCurrentProcesses(steps);
      initStepAssignments(steps);
    }
  }, [typeId, productTypes]);

  const initStepAssignments = (steps: ProcessStep[]) => {
    const initialAssignments: Record<number, StepAssignment> = {};
    steps.forEach((proc, idx) => {
      let defaultMachine = proc.assignedMachine || '';
      if (!defaultMachine) {
        if (proc.category === '가공') {
          defaultMachine = MCT_MACHINES[idx % MCT_MACHINES.length] || MCT_MACHINES[0];
        } else if (proc.category === '연마') {
          defaultMachine = GRINDER_MACHINES[idx % GRINDER_MACHINES.length] || GRINDER_MACHINES[0];
        } else if (proc.category === '품질') {
          defaultMachine = CMM_MACHINES[idx % CMM_MACHINES.length] || CMM_MACHINES[0];
        } else if (proc.category === '외주') {
          defaultMachine = '(외주/협력사)';
        }
      }

      const defaultWorker =
        approvedOperators.length > 0
          ? approvedOperators[idx % approvedOperators.length] || ''
          : '';

      initialAssignments[idx] = {
        machine: defaultMachine,
        worker: defaultWorker,
      };
    });
    setStepAssignments(initialAssignments);
  };

  const handleStepMachineChange = (stepIdx: number, machine: string) => {
    setStepAssignments((prev) => ({
      ...prev,
      [stepIdx]: {
        ...(prev[stepIdx] || { worker: '' }),
        machine,
      },
    }));
  };

  const handleStepWorkerChange = (stepIdx: number, worker: string) => {
    setStepAssignments((prev) => ({
      ...prev,
      [stepIdx]: {
        ...(prev[stepIdx] || { machine: '' }),
        worker,
      },
    }));
  };

  // Custom Process Editing Helpers
  const handleAddProcess = (presetCategory?: ProcessCategory) => {
    setIsCustomMode(true);
    const defaultCat: ProcessCategory = presetCategory || '가공';
    let defaultDuration = 2;
    let defaultName = `신규 ${defaultCat} 공정`;

    if (defaultCat === '가공') {
      defaultDuration = 4;
      defaultName = 'MCT 정밀 가공';
    } else if (defaultCat === '연마') {
      defaultDuration = 3;
      defaultName = '평면 정밀 연마';
    } else if (defaultCat === '품질') {
      defaultDuration = 1;
      defaultName = 'CMM 3차원 정밀 측정';
    } else if (defaultCat === '외주') {
      defaultDuration = 48;
      defaultName = '열처리/표면처리 외주';
    }

    const newStep: ProcessStep = {
      name: defaultName,
      category: defaultCat,
      durationHours: defaultDuration,
    };

    const newIndex = currentProcesses.length;
    setCurrentProcesses((prev) => [...prev, newStep]);

    let defaultMachine = '';
    if (defaultCat === '가공') defaultMachine = MCT_MACHINES[0];
    else if (defaultCat === '연마') defaultMachine = GRINDER_MACHINES[0];
    else if (defaultCat === '품질') defaultMachine = CMM_MACHINES[0];
    else if (defaultCat === '외주') defaultMachine = '(외주/협력사)';

    setStepAssignments((prev) => ({
      ...prev,
      [newIndex]: {
        machine: defaultMachine,
        worker: approvedOperators[0] || '',
      },
    }));
  };

  const handleRemoveProcess = (idx: number) => {
    if (currentProcesses.length <= 1) {
      alert('최소 1개 이상의 공정이 필요합니다.');
      return;
    }
    setIsCustomMode(true);
    setCurrentProcesses((prev) => prev.filter((_, i) => i !== idx));

    // Re-index step assignments
    setStepAssignments((prev) => {
      const next: Record<number, StepAssignment> = {};
      let currentIdx = 0;
      for (let i = 0; i < currentProcesses.length; i++) {
        if (i !== idx) {
          next[currentIdx] = prev[i] || { machine: '', worker: '' };
          currentIdx++;
        }
      }
      return next;
    });
  };

  const handleMoveProcess = (idx: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && idx === 0) ||
      (direction === 'down' && idx === currentProcesses.length - 1)
    ) {
      return;
    }
    setIsCustomMode(true);
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;

    setCurrentProcesses((prev) => {
      const updated = [...prev];
      const temp = updated[idx];
      updated[idx] = updated[targetIdx];
      updated[targetIdx] = temp;
      return updated;
    });

    setStepAssignments((prev) => {
      const updated = { ...prev };
      const temp = updated[idx];
      updated[idx] = updated[targetIdx];
      updated[targetIdx] = temp;
      return updated;
    });
  };

  const handleUpdateProcessField = (
    idx: number,
    field: keyof ProcessStep,
    value: any
  ) => {
    setIsCustomMode(true);
    setCurrentProcesses((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === 'category' && value === '외주') {
        handleStepMachineChange(idx, '(외주/협력사)');
      }
      return updated;
    });
  };

  // Copy from completed/archived order
  const completedOrArchivedOrders = useMemo(() => {
    return (Object.values(orders) as Order[]).filter(
      (o) => o.archived || o.status === 'COMPLETED'
    );
  }, [orders]);

  const applyCopyFromOrder = (sourceOrder: Order) => {
    skipTypeResetRef.current = true;
    setTypeId(sourceOrder.typeId || 'TYPE_CUSTOM');

    const processes =
      sourceOrder.customProcesses && sourceOrder.customProcesses.length > 0
        ? sourceOrder.customProcesses.map((p) => ({ ...p }))
        : productTypes[sourceOrder.typeId]?.processes
        ? productTypes[sourceOrder.typeId].processes.map((p) => ({ ...p }))
        : [];

    setCurrentProcesses(processes);
    setIsCustomMode(true);

    const newAssignments: Record<number, StepAssignment> = {};
    processes.forEach((proc, idx) => {
      let machine = '';
      let worker = '';

      if (processProgressMap) {
        const exactKey = `${sourceOrder.id}_Q1_P${idx}`;
        if (processProgressMap[exactKey]) {
          machine = processProgressMap[exactKey].machine || '';
          worker = processProgressMap[exactKey].worker || '';
        } else {
          const keys = Object.keys(processProgressMap);
          const fuzzyKey = keys.find(
            (k) => k.startsWith(`${sourceOrder.id}_`) && k.endsWith(`_P${idx}`)
          );
          if (fuzzyKey && processProgressMap[fuzzyKey]) {
            machine = processProgressMap[fuzzyKey].machine || '';
            worker = processProgressMap[fuzzyKey].worker || '';
          }
        }
      }

      if (!machine) machine = proc.assignedMachine || '';

      newAssignments[idx] = {
        machine,
        worker,
      };
    });

    setStepAssignments(newAssignments);
    setName(`[재수주] ${sourceOrder.name}`);
    setQty(sourceOrder.qty || 1);
    setMemo(`[완료보관함 사양복사] 원본: ${sourceOrder.id} (${sourceOrder.name})`);
    setStartDate(getCurrentDateTimeString());
    setCopiedSourceOrder(sourceOrder);
    setIsArchiveModalOpen(false);
  };

  useEffect(() => {
    if (pendingCopyOrder) {
      applyCopyFromOrder(pendingCopyOrder);
      if (onClearPendingCopyOrder) {
        onClearPendingCopyOrder();
      }
    }
  }, [pendingCopyOrder]);

  // Form Submit Handler with Conflict Detection
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditOrder) {
      alert(
        '⚠️ 신규 수주 등록 권한이 없습니다.\n(관리자 또는 영업담당자 계정으로 로그인해주세요.)'
      );
      return;
    }
    if (!name.trim()) {
      alert('수주번호 / 프로젝트명을 입력해주세요.');
      return;
    }
    if (currentProcesses.length === 0) {
      alert('최소 1개 이상의 공정 단계가 필요합니다.');
      return;
    }

    const newId = `ORD-2026-${String(Object.keys(orders).length + 1).padStart(3, '0')}`;
    const firstMachine = stepAssignments[0]?.machine || MCT_MACHINES[0];

    const finalProcesses: ProcessStep[] = currentProcesses.map((p, idx) => ({
      ...p,
      assignedMachine: stepAssignments[idx]?.machine || p.assignedMachine || '',
    }));

    const newOrder: Order = {
      id: newId,
      name: name.trim(),
      typeId,
      qty: Math.max(1, qty),
      startDate,
      status: 'IN_PROGRESS',
      archived: false,
      mctMachine: firstMachine,
      memo: memo.trim(),
      customProcesses: finalProcesses,
    };

    const initialProgressMap: ProcessProgressMap = {};
    for (let q = 1; q <= Math.max(1, qty); q++) {
      finalProcesses.forEach((_, pIdx) => {
        const processKey = `${newId}_Q${q}_P${pIdx}`;
        const assign = stepAssignments[pIdx] || { machine: '', worker: '' };
        initialProgressMap[processKey] = {
          isCompleted: false,
          machine: assign.machine,
          worker: assign.worker,
        };
      });
    }

    // Check for Resource Conflicts (Machine and Worker collisions)
    const detectedConflicts: ConflictItem[] = [];

    finalProcesses.forEach((proc, pIdx) => {
      const assign = stepAssignments[pIdx];
      if (assign?.machine && busyMachinesMap.has(assign.machine)) {
        detectedConflicts.push({
          stepIndex: pIdx,
          stepName: proc.name,
          type: 'MACHINE',
          resourceName: assign.machine,
          busyInfo: busyMachinesMap.get(assign.machine)!,
        });
      }
      if (assign?.worker && busyWorkersMap.has(assign.worker.trim())) {
        detectedConflicts.push({
          stepIndex: pIdx,
          stepName: proc.name,
          type: 'WORKER',
          resourceName: assign.worker.trim(),
          busyInfo: busyWorkersMap.get(assign.worker.trim())!,
        });
      }
    });

    if (detectedConflicts.length > 0) {
      // Open Warning Confirmation Modal
      setPendingConflicts(detectedConflicts);
      setPendingSubmitPayload({
        order: newOrder,
        initialProgressMap,
      });
      return;
    }

    // If no conflicts, create order directly
    executeCreateOrder(newOrder, initialProgressMap);
  };

  const executeCreateOrder = (
    newOrder: Order,
    initialProgressMap: ProcessProgressMap
  ) => {
    onCreateOrder(newOrder, initialProgressMap);
    setName('');
    setMemo('');
    setStartDate(getCurrentDateTimeString());
    setCopiedSourceOrder(null);
    setPendingConflicts(null);
    setPendingSubmitPayload(null);
    alert(
      `🎉 수주건 [${newOrder.name}] 등록이 완료되었습니다!\n설비 가동판(OEE) 및 Gantt 타임라인에 실시간 연동되었습니다.`
    );
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. ORDER REGISTRATION FORM CARD */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 space-y-5">
        {!canEditOrder && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                ⚠️ 현재 계정({currentUser?.name || '현장담당자'})은 수주 등록 권한이 없습니다. 수주 정보 등록은 관리자 또는 영업담당자 권한이 필요합니다.
              </span>
            </div>
            <span className="bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded text-[10px] font-black shrink-0">
              권한 제한됨
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">
                  신규 수주 등록 & 공정별 설비/담당자 지정
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                  커스텀 공정 지원
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                표준 제품 타입(BOP) 또는 커스텀 공정을 자유롭게 설계하고, 진행중인 설비/담당자 중복 충돌을 실시간으로 감지합니다.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsArchiveModalOpen(true)}
              disabled={!canEditOrder}
              className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              title="완료보관함 수주건의 공정 단계별 설비 및 담당자 정보를 복사하여 신규 수주에 적용합니다."
            >
              <Copy className="w-3.5 h-3.5 text-amber-600" />
              <span>완료보관함 사양 복사</span>
            </button>

            <button
              type="submit"
              form="new-order-form"
              disabled={!canEditOrder}
              className={`px-5 py-2.5 font-black rounded-xl text-xs transition flex items-center gap-2 shadow-md shrink-0 ${
                canEditOrder
                  ? 'bg-[#00C4B4] hover:bg-[#00a89a] text-white cursor-pointer hover:shadow-lg'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60'
              }`}
            >
              <Plus className="w-4 h-4 text-white" />
              <span>신규 수주 등록</span>
            </button>
          </div>
        </div>

        {/* Banner if copied from archived order */}
        {copiedSourceOrder && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-xs flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 animate-bounce" />
              <div>
                <span className="font-extrabold text-emerald-950">
                  [완료 보관함 사양 복사 완료]
                </span>{' '}
                <span>
                  원본 수주 <strong className="underline font-bold">{copiedSourceOrder.name}</strong> ({copiedSourceOrder.id})의 공정 구성과 설비/담당자 지정이 적용되었습니다.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCopiedSourceOrder(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form id="new-order-form" onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Basic Order Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Project Name */}
            <div className="lg:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                수주번호 / 프로젝트명 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 삼성디스플레이 8.6세대 슬릿 노즐"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Product Type (BOP) Select */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-600" /> 제품 타입 (BOP)
              </label>
              <select
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                {/* Standard Types */}
                {(Object.values(productTypes) as ProductType[]).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id === 'TYPE_CUSTOM' ? '✨ ' : ''}
                    {t.name.replace(/\s*\(\d+단계\)/g, '')} ({t.processes?.length || 0}단계)
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">생산 수량 (개)</label>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-black text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Start Date */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" /> 생산 시작일시
                </label>
                <button
                  type="button"
                  onClick={() => setStartDate(getCurrentDateTimeString())}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                >
                  현재 일시
                </button>
              </div>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Memo */}
            <div className="lg:col-span-5">
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" /> 수주 주요 비고 / 특이사항
              </label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예: 클린룸 포장 필수, 와이어 EDM 외주업체 사전 알림 완료"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-800 bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Process Steps Routing Editor Section */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap justify-between items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    공정 라우팅 단계 및 설비/담당자 지정
                  </h3>
                  <span className="text-[11px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                    총 {currentProcesses.length}개 공정
                  </span>
                  {isCustomMode && (
                    <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                      커스텀 편집 중
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  각 공정 단계별 담당 설비 및 작업자를 지정합니다. 이미 작업 중인 설비나 작업자는 실시간 경고 뱃지가 표시됩니다.
                </p>
              </div>

              {/* Quick Action Buttons for Custom Process Steps */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-bold hidden sm:inline">
                  공정 추가:
                </span>
                <button
                  type="button"
                  onClick={() => handleAddProcess('가공')}
                  className="px-2.5 py-1 text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ 가공</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddProcess('연마')}
                  className="px-2.5 py-1 text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ 연마</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddProcess('품질')}
                  className="px-2.5 py-1 text-[11px] bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ CMM품질</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddProcess('외주')}
                  className="px-2.5 py-1 text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ 외주</span>
                </button>
              </div>
            </div>

            {/* Table of Steps */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
              <table className="w-full text-left text-xs min-w-[780px]">
                <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-12 text-center">순서</th>
                    <th className="p-3 min-w-[200px]">공정명 (Process Step)</th>
                    <th className="p-3 text-center w-28">공정 구분</th>
                    <th className="p-3 text-center w-24">표준 소요시간</th>
                    <th className="p-3 min-w-[230px]">담당 설비 지정 (21대 설비)</th>
                    <th className="p-3 min-w-[230px]">공정 담당자 지정 (회원가입자)</th>
                    <th className="p-3 text-center w-20">순서/삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-semibold">
                  {currentProcesses.map((proc: ProcessStep, idx: number) => {
                    const assign = stepAssignments[idx] || { machine: '', worker: '' };
                    const machineBusy = assign.machine ? busyMachinesMap.get(assign.machine) : undefined;
                    const workerBusy = assign.worker ? busyWorkersMap.get(assign.worker.trim()) : undefined;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        {/* Step Number */}
                        <td className="p-3 text-center font-black text-slate-400">
                          {idx + 1}
                        </td>

                        {/* Process Name (Editable) */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={proc.name}
                            onChange={(e) => handleUpdateProcessField(idx, 'name', e.target.value)}
                            placeholder="공정명 입력"
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 hover:border-slate-400 focus:border-blue-500 rounded-lg font-bold text-slate-900 bg-white"
                          />
                        </td>

                        {/* Category Dropdown */}
                        <td className="p-2 text-center">
                          <select
                            value={proc.category}
                            onChange={(e) => handleUpdateProcessField(idx, 'category', e.target.value as ProcessCategory)}
                            className="text-[11px] px-2 py-1 border border-slate-200 rounded-lg font-bold bg-white text-slate-800 focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="가공">가공 (MCT)</option>
                            <option value="연마">연마 (Grinder)</option>
                            <option value="품질">품질 (CMM)</option>
                            <option value="외주">외주 (협력사)</option>
                          </select>
                        </td>

                        {/* Duration Hours (Editable) */}
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={proc.durationHours}
                              onChange={(e) => handleUpdateProcessField(idx, 'durationHours', parseFloat(e.target.value) || 0.1)}
                              className="w-16 text-center text-xs px-1.5 py-1 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 bg-white"
                            />
                            <span className="text-slate-500 font-bold text-[11px]">h</span>
                          </div>
                        </td>

                        {/* Machine Select with Real-Time Conflict Warning */}
                        <td className="p-2">
                          <div className="space-y-1">
                            <SearchableSelect
                              options={equipmentOptions}
                              value={assign.machine}
                              onChange={(val) => handleStepMachineChange(idx, val)}
                              placeholder="담당 설비 검색 또는 선택"
                              icon={Cpu}
                            />
                            {machineBusy && (
                              <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-md px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 shadow-2xs animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span className="truncate">
                                  가동중: [{machineBusy.orderName}] #{machineBusy.productNo}호기 {machineBusy.processName}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Operator Select with Real-Time Conflict Warning */}
                        <td className="p-2">
                          <div className="space-y-1">
                            <SearchableSelect
                              options={operatorOptions}
                              value={assign.worker}
                              onChange={(val) => handleStepWorkerChange(idx, val)}
                              placeholder="공정 담당자 검색 또는 선택"
                              icon={UserCheck}
                            />
                            {workerBusy && (
                              <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-md px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 shadow-2xs animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span className="truncate">
                                  작업중: [{workerBusy.orderName}] #{workerBusy.productNo}호기
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Action: Move up/down / Delete */}
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveProcess(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100 transition cursor-pointer"
                              title="위로 이동"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveProcess(idx, 'down')}
                              disabled={idx === currentProcesses.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100 transition cursor-pointer"
                              title="아래로 이동"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveProcess(idx)}
                              className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50 transition cursor-pointer ml-1"
                              title="공정 삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </form>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MODAL: RESOURCE CONFLICT CONFIRMATION (설비/담당자 실시간 중복 경고 모달) */}
      {/* ------------------------------------------------------------- */}
      {pendingConflicts && pendingConflicts.length > 0 && pendingSubmitPayload && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-amber-400 w-full max-w-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-amber-200 bg-amber-50/90 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-white shadow-sm">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
                    <span>⚠️ 설비 및 현장 담당자 실시간 중복 가동 경고</span>
                    <span className="bg-amber-200 text-amber-950 text-[10px] px-2 py-0.5 rounded-full font-black border border-amber-300">
                      충돌 {pendingConflicts.length}건 감지
                    </span>
                  </h3>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    현재 현장에서 다른 공정을 진행 중인 설비 또는 작업자가 배정되었습니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPendingConflicts(null);
                  setPendingSubmitPayload(null);
                }}
                className="text-amber-800 hover:text-amber-950 p-1.5 rounded-lg hover:bg-amber-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs max-h-[60vh] overflow-y-auto">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 space-y-1">
                <p className="font-extrabold">
                  💡 현장 작업 상황 안내:
                </p>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  현장에서는 이미 해당 설비가 가동 중이거나 담당자가 작업 중입니다. 관리자가 동일 설비 및 담당자를 중복 지정할 경우 현장 충돌이 발생할 수 있습니다.
                  <strong className="underline ml-1">현장 작업자와 사전 협의 후 순차 가동 또는 병행 작업이 합의된 경우에만</strong> 등록을 진행해 주십시오.
                </p>
              </div>

              {/* List of Detected Conflicts */}
              <div className="space-y-2">
                <div className="text-xs font-black text-slate-800">
                  🚨 감지된 중복 배정 내역:
                </div>
                <div className="space-y-2">
                  {pendingConflicts.map((c, cIdx) => (
                    <div
                      key={cIdx}
                      className="bg-white border-2 border-amber-200 rounded-xl p-3 shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-black text-slate-900">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                            공정 {c.stepIndex + 1}단계: {c.stepName}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            c.type === 'MACHINE'
                              ? 'bg-indigo-100 text-indigo-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}>
                            {c.type === 'MACHINE' ? `설비: ${c.resourceName}` : `담당자: ${c.resourceName}`}
                          </span>
                        </div>
                        <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-200">
                          {c.busyInfo.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                        현재 진행중인 작업: <strong className="text-slate-900">{c.busyInfo.orderName}</strong> ({c.busyInfo.orderId})
                        #{c.busyInfo.productNo}호기 - <span className="text-blue-700 font-bold">{c.busyInfo.processName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setPendingConflicts(null);
                  setPendingSubmitPayload(null);
                }}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl text-xs transition cursor-pointer shadow-2xs"
              >
                취소하고 설비/작업자 재선택
              </button>

              <button
                type="button"
                onClick={() => {
                  if (pendingSubmitPayload) {
                    executeCreateOrder(
                      pendingSubmitPayload.order,
                      pendingSubmitPayload.initialProgressMap
                    );
                  }
                }}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs transition flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>현장 합의 완료 - 강제 등록 진행</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL: COPY PROCESS SPECIFICATIONS FROM ARCHIVE VAULT */}
      {/* ------------------------------------------------------------- */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>완료 보관함 공정/설비/담당자 사양 복사</span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-extrabold border border-amber-200">
                      {completedOrArchivedOrders.length}건 보관 중
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    출하 완료된 이전 수주건의 공정 단계, 담당 설비 및 작업자 지정을 그대로 복사하여 신규 수주에 적용합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="수주명 또는 제품 타입 검색..."
                  value={archiveSearchTerm}
                  onChange={(e) => setArchiveSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              {/* List of Archived Orders */}
              <div className="space-y-2.5">
                {completedOrArchivedOrders.filter((ord) => {
                  if (!archiveSearchTerm.trim()) return true;
                  const term = archiveSearchTerm.toLowerCase();
                  const type = productTypes[ord.typeId];
                  return (
                    ord.name.toLowerCase().includes(term) ||
                    (type && type.name.toLowerCase().includes(term))
                  );
                }).length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-bold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Archive className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs text-slate-600">완료 보관함에 복사 가능한 수주가 없습니다.</p>
                  </div>
                ) : (
                  completedOrArchivedOrders
                    .filter((ord) => {
                      if (!archiveSearchTerm.trim()) return true;
                      const term = archiveSearchTerm.toLowerCase();
                      const type = productTypes[ord.typeId];
                      return (
                        ord.name.toLowerCase().includes(term) ||
                        (type && type.name.toLowerCase().includes(term))
                      );
                    })
                    .map((ord) => {
                      const type = productTypes[ord.typeId];
                      const processes =
                        ord.customProcesses && ord.customProcesses.length > 0
                          ? ord.customProcesses
                          : type?.processes || [];

                      return (
                        <div
                          key={ord.id}
                          className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-amber-400 hover:shadow-md transition space-y-2.5"
                        >
                          <div className="flex flex-wrap justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                  {ord.name}
                                </span>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold border border-slate-200">
                                  {ord.id}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                                <span>제품 타입: <strong className="text-slate-800">{type?.name || '커스텀'}</strong></span>
                                <span>•</span>
                                <span>수량: <strong className="text-slate-800">{ord.qty}개</strong></span>
                                <span>•</span>
                                <span>완료일시: <strong className="text-slate-700">{ord.completedAt || '-'}</strong></span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => applyCopyFromOrder(ord)}
                              className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 shrink-0"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>이 공정 사양 적용</span>
                            </button>
                          </div>

                          {/* Steps preview */}
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-500 mb-1.5">
                              📋 복사될 공정 단계별 설비 및 담당자 구성 ({processes.length}단계):
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {processes.map((proc, pIdx) => {
                                let m = proc.assignedMachine || '';
                                let w = '';
                                if (processProgressMap) {
                                  const exactKey = `${ord.id}_Q1_P${pIdx}`;
                                  if (processProgressMap[exactKey]) {
                                    m = processProgressMap[exactKey].machine || m;
                                    w = processProgressMap[exactKey].worker || '';
                                  } else {
                                    const keys = Object.keys(processProgressMap);
                                    const fuzzyKey = keys.find(
                                      (k) => k.startsWith(`${ord.id}_`) && k.endsWith(`_P${pIdx}`)
                                    );
                                    if (fuzzyKey && processProgressMap[fuzzyKey]) {
                                      m = processProgressMap[fuzzyKey].machine || m;
                                      w = processProgressMap[fuzzyKey].worker || '';
                                    }
                                  }
                                }

                                return (
                                  <div
                                    key={pIdx}
                                    className="bg-white border border-slate-200 p-1.5 rounded text-[11px] flex justify-between items-center"
                                  >
                                    <span className="font-bold text-slate-800 truncate mr-1">
                                      {pIdx + 1}. {proc.name}
                                    </span>
                                    <div className="flex items-center gap-1 text-[10px] shrink-0">
                                      <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded font-bold border border-blue-100">
                                        {m || '설비 미지정'}
                                      </span>
                                      <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold border border-emerald-100">
                                        {w || '담당자 미지정'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
