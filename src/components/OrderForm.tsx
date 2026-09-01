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
import { buildOperatorSelectOptions, extractValidApprovedOperators } from '../utils/operatorHelper';
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
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Sliders,
  Check,
  ArrowRightLeft,
  MoveRight,
  ArrowRight,
  FolderSync,
  FolderPlus,
  Tag,
  RotateCcw,
  Palette,
  Printer,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { ProcessTravelerModal } from './ProcessTravelerModal';
import { subscribeUsersList } from '../lib/firebase';
import { extractSerialBase, formatSerialRange, getIndividualSerialNo, getSerialNoList } from '../utils/serialHelper';
import {
  StepAssignment,
  ResourceBusyInfo,
  ConflictItem,
  PhaseDefinition,
  PhaseGroup
} from './order-form/orderFormTypes';
import { OrderFormHeader } from './order-form/OrderFormHeader';
import { ProcessGridPanel } from './order-form/ProcessGridPanel';
import { ProcessDetailPanel } from './order-form/ProcessDetailPanel';
import { AiBatchRecommendationModal } from './order-form/AiBatchRecommendationModal';
import { ResetProcessDesignModal, ResetProcessOptions } from './order-form/ResetProcessDesignModal';
import {
  recordManagerDecision,
  RecommendationContext
} from '../utils/aiRecommendationEngine';

interface OrderFormProps {
  productTypes: Record<string, ProductType>;
  orders?: Record<string, Order>;
  approvedOperators?: string[];
  usersList?: User[];
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

const INITIAL_PHASE_DEFS: PhaseDefinition[] = [
  {
    id: 'phase_1',
    name: 'Phase 1: 소재 준비 및 1차 황삭/밀링 가공',
    titleSuffix: '소재 준비 및 1차 황삭',
    defaultDesc: '소재 입고 검사, 소재 가공, 황삭 및 1차 밀링 가공 구간',
    icon: '📦',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  {
    id: 'phase_2',
    name: 'Phase 2: 열처리, 1차 연마 및 평면도 가공',
    titleSuffix: '열처리 및 1차 연마',
    defaultDesc: '열처리(서브제로), 평면 연마, 기준면 형성 및 중간 CMM 검사 구간',
    icon: '⚙️',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  {
    id: 'phase_3',
    name: 'Phase 3: 초정밀 립(LIP) 가공 및 유로/홈 정밀 가공',
    titleSuffix: '초정밀 립/유로 정밀가공',
    defaultDesc: '슬롯다이 립(LIP) 정밀연마, 매니폴드 유로 가공 및 고정밀 방전 가공 구간',
    icon: '✨',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
  },
  {
    id: 'phase_4',
    name: 'Phase 4: 최종 CMM 검사, 세척, 조립 및 출하 포장',
    titleSuffix: '최종검사 및 조립/출하',
    defaultDesc: '초정밀 3차원 측정(CMM), 클린룸 세척, 최종 조립 및 방청 포장 구간',
    icon: '📐',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
  },
];

const CUSTOM_INITIAL_PHASE: PhaseDefinition = {
  id: 'phase_custom_1',
  name: 'Phase 1: 사용자 정의 기본 공정 구간',
  titleSuffix: '사용자 정의 공정',
  defaultDesc: '자유롭게 세부 공정을 추가하고 설비와 담당자를 지정할 수 있습니다.',
  icon: '🛠️',
  badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
};

export const OrderForm: React.FC<OrderFormProps> = ({
  productTypes,
  orders = {},
  approvedOperators = [],
  usersList = [],
  onCreateOrder,
  onUpdateOrder,
  onDeleteOrder,
  onArchiveOrder,
  onCompleteAllOrderProcesses,
  scheduledTasks = [],
  currentUser = null,
  processProgressMap,
  pendingCopyOrder = null,
  onClearPendingCopyOrder,
  onOpenNewTypeModal,
  onOpenCopyTypeModal,
  onOrderCreatedSuccess,
}) => {
  // Permission checks
  const canEditOrder = useMemo(() => {
    if (!currentUser) return true;
    const role = currentUser.role || 'WORKER';
    return ['ADMIN', 'MANAGER', 'SALES'].includes(role.toUpperCase());
  }, [currentUser]);

  // Current DateTime Helper
  const getCurrentDateTimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${mins}`;
  };

  // Default Due Date: Tomorrow from current date
  const getDefaultDueDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Next Sequential Order ID Generator
  const getNextSequentialOrderId = () => {
    const today = new Date();
    const year = today.getFullYear();
    const existingOrders = Object.values(orders) as Order[];

    let maxNum = 0;
    const yearPrefix = `ORD-${year}-`;
    existingOrders.forEach((o) => {
      if (o.id && o.id.startsWith(yearPrefix)) {
        const numPart = parseInt(o.id.replace(yearPrefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });

    return `ORD-${year}-${String(maxNum + 1).padStart(3, '0')}`;
  };

  // Form Basic Fields
  const [autoOrderId, setAutoOrderId] = useState<string>(() => getNextSequentialOrderId());
  const [customOrderId, setCustomOrderId] = useState<string>(() => getNextSequentialOrderId());
  const [pjtNo, setPjtNo] = useState('');
  const [pjtName, setPjtName] = useState('');
  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState<string>(() => {
    return productTypes['TYPE_SLIT_NOZZLE']
      ? 'TYPE_SLIT_NOZZLE'
      : Object.keys(productTypes)[0] || 'TYPE_CUSTOM';
  });
  const [qty, setQty] = useState(1);
  const [startDate, setStartDate] = useState(getCurrentDateTimeString());
  const [memo, setMemo] = useState('공정 간 인수인계 철저히 할 것!');

  // Process Traveler Official Metadata Fields
  const [customer, setCustomer] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [partName, setPartName] = useState('');
  const [partType, setPartType] = useState('UPPER (상판)');
  const [spec, setSpec] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [isSerialCustomized, setIsSerialCustomized] = useState(false);
  const [dueDate, setDueDate] = useState<string>(() => getDefaultDueDateString());
  const [specialNotes, setSpecialNotes] = useState('공정 간 인수인계 철저히 할 것!');

  // Routing and Phase States
  const [phases, setPhases] = useState<PhaseDefinition[]>(INITIAL_PHASE_DEFS);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    phase_1: true,
    phase_2: true,
    phase_3: true,
    phase_4: true,
  });
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [currentProcesses, setCurrentProcesses] = useState<ProcessStep[]>([]);
  const [stepAssignments, setStepAssignments] = useState<Record<number, StepAssignment>>({});
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [routingSearchTerm, setRoutingSearchTerm] = useState<string>('');
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(0);
  const [filterOnlyUnassigned, setFilterOnlyUnassigned] = useState<boolean>(false);
  const [filterOnlyConflicts, setFilterOnlyConflicts] = useState<boolean>(false);

  // Batch Selection States
  const [selectedStepIndices, setSelectedStepIndices] = useState<Set<number>>(new Set());
  const [batchMachine, setBatchMachine] = useState<string>('');
  const [batchWorker, setBatchWorker] = useState<string>('');
  const [batchDuration, setBatchDuration] = useState<string>('');
  const [batchTargetPhase, setBatchTargetPhase] = useState<string>('phase_1');
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string>('');

  // AI Recommendation Engine Integration States
  const [isAiBatchModalOpen, setIsAiBatchModalOpen] = useState(false);
  const [aiAppliedStepMap, setAiAppliedStepMap] = useState<
    Record<number, { recWorker: string; recMachine: string; score: number }>
  >({});

  // Modals & Safety Dialog States
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [copiedSourceOrder, setCopiedSourceOrder] = useState<Order | null>(null);
  const [isPreviewTravelerOpen, setIsPreviewTravelerOpen] = useState(false);
  const [isPostCreateTravelerOpen, setIsPostCreateTravelerOpen] = useState(false);
  const [showCreatedOrderModal, setShowCreatedOrderModal] = useState(false);
  const [createdOrderForTraveler, setCreatedOrderForTraveler] = useState<Order | null>(null);

  const [isAddPhaseModalOpen, setIsAddPhaseModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseDesc, setNewPhaseDesc] = useState('');
  const [newPhaseIcon, setNewPhaseIcon] = useState('⚙️');
  const [newPhaseColor, setNewPhaseColor] = useState('bg-blue-100 text-blue-900 border-blue-300');

  const [deletePhaseTarget, setDeletePhaseTarget] = useState<{
    phase: { id: string; name: string };
    stepsCount: number;
  } | null>(null);
  const [deleteTargetPhaseId, setDeleteTargetPhaseId] = useState<string>('');

  const [pendingConflicts, setPendingConflicts] = useState<ConflictItem[] | null>(null);
  const [pendingSubmitPayload, setPendingSubmitPayload] = useState<{
    order: Order;
    initialProgressMap: ProcessProgressMap;
  } | null>(null);

  const skipTypeResetRef = useRef(false);

  // Helper to ensure steps have phaseId
  const ensureStepsWithPhases = (steps: ProcessStep[], phaseList: PhaseDefinition[] = phases) => {
    if (!steps || steps.length === 0) return [];
    const total = steps.length;
    const pCount = Math.max(1, phaseList.length);

    return steps.map((step, idx) => {
      if (step.phaseId && phaseList.some((p) => p.id === step.phaseId)) {
        return step;
      }
      const targetPhaseIdx = Math.min(Math.floor((idx / total) * pCount), pCount - 1);
      const assignedPhase = phaseList[targetPhaseIdx] || phaseList[0];
      return {
        ...step,
        phaseId: assignedPhase.id,
      };
    });
  };

  // Initialize stepAssignments
  const initStepAssignments = (steps: ProcessStep[]) => {
    const initialAssignments: Record<number, StepAssignment> = {};
    steps.forEach((step, idx) => {
      initialAssignments[idx] = {
        machine: step.assignedMachine || '',
        worker: step.worker || step.assignedWorker || '',
      };
    });
    setStepAssignments(initialAssignments);
  };

  // Dynamic initialization based on typeId
  useEffect(() => {
    if (skipTypeResetRef.current) {
      skipTypeResetRef.current = false;
      return;
    }

    if (typeId === 'TYPE_CUSTOM') {
      setIsCustomMode(true);
      setPhases([CUSTOM_INITIAL_PHASE]);
      setExpandedPhases({ phase_custom_1: true });
      setCurrentProcesses([]);
      setStepAssignments({});
    } else if (productTypes[typeId]?.processes) {
      setIsCustomMode(false);
      setPhases(INITIAL_PHASE_DEFS);
      const rawSteps = productTypes[typeId].processes.map((p) => ({ ...p }));
      const stepsWithPhases = ensureStepsWithPhases(rawSteps, INITIAL_PHASE_DEFS);
      setCurrentProcesses(stepsWithPhases);
      initStepAssignments(stepsWithPhases);
      setExpandedPhases({
        phase_1: true,
        phase_2: true,
        phase_3: true,
        phase_4: true,
      });
    }
  }, [typeId, productTypes]);

  // Sync autoOrderId when orders change
  useEffect(() => {
    const nextId = getNextSequentialOrderId();
    setAutoOrderId(nextId);
    if (!customOrderId || customOrderId.startsWith('ORD-')) {
      setCustomOrderId(nextId);
    }
  }, [orders]);

  // Two-way synchronization handlers
  const handlePjtNoChange = (newPjtNo: string) => {
    setPjtNo(newPjtNo);
    setPoNumber(newPjtNo);
    // 프로젝트번호 입력/변경 시, 각인번호 Prefix로 [프로젝트번호 전체]를 온전히 적용하여 순번 연동
    // 사용자가 직접 임의로 수정한 경우가 아니거나, 이전 프로젝트번호를 기반으로 생성된 각인번호인 경우 자동 연동
    if (!isSerialCustomized || !serialNo.trim()) {
      setSerialNo(newPjtNo.trim() ? formatSerialRange(newPjtNo.trim(), qty) : '');
    } else {
      // 이전에 다른 프로젝트번호로 자동 생성된 패턴이었는지 확인하여 갱신
      const prevBase = extractSerialBase(serialNo);
      if (prevBase === pjtNo.trim()) {
        setSerialNo(newPjtNo.trim() ? formatSerialRange(newPjtNo.trim(), qty) : '');
      }
    }
  };

  const handleSerialNoChange = (newSerialNo: string) => {
    setSerialNo(newSerialNo);
    setIsSerialCustomized(true);
  };

  const handlePjtNameChange = (newPjtName: string) => {
    setPjtName(newPjtName);
    setName(newPjtName);
    if (!partName) setPartName(newPjtName);
  };

  const handleQtyChange = (newQty: number) => {
    const safeQty = Math.max(1, newQty);
    setQty(safeQty);
    // 프로젝트번호 전체를 기본 Prefix로 사용하고, 사용자가 직접 수정한 경우 해당 Prefix를 보존
    const base = isSerialCustomized && serialNo.trim()
      ? (extractSerialBase(serialNo, pjtNo) || pjtNo.trim() || 'NN-NNNN-2608-01')
      : (pjtNo.trim() || extractSerialBase(serialNo) || 'NN-NNNN-2608-01');
    setSerialNo(formatSerialRange(base, safeQty));
  };

  // Real-time busy resources mapping (machines and operators currently active)
  const { busyMachinesMap, busyWorkersMap } = useMemo(() => {
    const busyMachines = new Map<string, ResourceBusyInfo>();
    const busyWorkers = new Map<string, ResourceBusyInfo>();

    const activeOrders = (Object.values(orders) as Order[]).filter(
      (o) => !o.archived && o.status === 'IN_PROGRESS'
    );

    activeOrders.forEach((o) => {
      const orderProcesses =
        o.customProcesses && o.customProcesses.length > 0
          ? o.customProcesses
          : productTypes[o.typeId]?.processes || [];

      for (let q = 1; q <= o.qty; q++) {
        orderProcesses.forEach((proc, pIdx) => {
          const processKey = `${o.id}_Q${q}_P${pIdx}`;
          const progress = processProgressMap?.[processKey];

          if (progress && progress.status === 'IN_PROGRESS') {
            const mach = progress.machine || proc.assignedMachine;
            const worker = progress.worker || proc.worker || proc.assignedWorker;

            if (mach) {
              busyMachines.set(mach, {
                orderName: o.name,
                orderId: o.id,
                productNo: q,
                processName: proc.name,
                status: '진행중',
                worker,
              });
            }

            if (worker && worker.trim()) {
              busyWorkers.set(worker.trim(), {
                orderName: o.name,
                orderId: o.id,
                productNo: q,
                processName: proc.name,
                status: '진행중',
                machine: mach,
              });
            }
          }
        });
      }
    });

    return { busyMachinesMap: busyMachines, busyWorkersMap: busyWorkers };
  }, [orders, productTypes, processProgressMap]);

  // Searchable select options
  const equipmentOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = [
      { value: '', label: '설비 미지정 (선택 안 함)' },
      { value: '(외주/협력사)', label: '🏭 (외주/협력사 가공)' },
    ];

    const addGroup = (groupLabel: string, machines: string[]) => {
      machines.forEach((m) => {
        const isBusy = busyMachinesMap.has(m);
        const busyInfo = busyMachinesMap.get(m);
        list.push({
          value: m,
          label: `${m} ${isBusy ? `[🔴 사용중: ${busyInfo?.orderName}]` : '[🟢 대기중]'}`,
          sublabel: isBusy ? `현재 '${busyInfo?.orderName}' (${busyInfo?.processName}) 작업 중` : '즉시 가동 가능',
          badge: isBusy ? '가동중' : '대기',
          badgeColor: isBusy ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800',
        });
      });
    };

    addGroup('MCT 가공기', MCT_MACHINES);
    addGroup('연마기', GRINDER_MACHINES);
    addGroup('측정기(CMM)', CMM_MACHINES);

    return list;
  }, [busyMachinesMap]);

  const operatorOptions: SelectOption[] = useMemo(() => {
    const validOperators = extractValidApprovedOperators(usersList, approvedOperators);
    const list: SelectOption[] = [
      { value: '', label: '담당자 미지정 (선택 안 함)' },
    ];

    validOperators.forEach((op) => {
      const isBusy = busyWorkersMap.has(op);
      const busyInfo = busyWorkersMap.get(op);
      list.push({
        value: op,
        label: `${op} ${isBusy ? `[🔴 작업중: ${busyInfo?.orderName}]` : '[🟢 대기]'}` ,
        sublabel: isBusy ? `현재 '${busyInfo?.orderName}' (${busyInfo?.processName}) 진행 중` : '작업 배정 가능',
        badge: isBusy ? '작업중' : '배정가능',
        badgeColor: isBusy ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800',
      });
    });

    return list;
  }, [approvedOperators, usersList, busyWorkersMap]);

  // Phase grouping calculation
  const phaseGroups: PhaseGroup[] = useMemo(() => {
    return phases.map((phaseDef, pIdx) => {
      const phaseSteps = currentProcesses
        .map((proc, originalIndex) => ({ proc, originalIndex }))
        .filter(({ proc }) => proc.phaseId === phaseDef.id);

      let totalHours = 0;
      let assignedMachineCount = 0;
      let assignedWorkerCount = 0;

      phaseSteps.forEach(({ proc, originalIndex }) => {
        totalHours += proc.estimatedHours || 0;
        const assign = stepAssignments[originalIndex];
        const mach = assign !== undefined ? assign.machine : (proc.assignedMachine || '');
        const work = assign !== undefined ? assign.worker : (proc.worker || proc.assignedWorker || '');
        if (mach) assignedMachineCount++;
        if (work) assignedWorkerCount++;
      });

      return {
        id: phaseDef.id,
        phaseNumber: pIdx + 1,
        title: phaseDef.name,
        titleSuffix: phaseDef.titleSuffix,
        description: phaseDef.defaultDesc,
        icon: phaseDef.icon,
        badgeColor: phaseDef.badgeColor,
        steps: phaseSteps,
        totalHours: Math.round(totalHours * 10) / 10,
        assignedMachineCount,
        assignedWorkerCount,
        unassignedMachineCount: phaseSteps.length - assignedMachineCount,
        unassignedWorkerCount: phaseSteps.length - assignedWorkerCount,
        startStep: phaseSteps.length > 0 ? phaseSteps[0].originalIndex + 1 : 0,
        endStep: phaseSteps.length > 0 ? phaseSteps[phaseSteps.length - 1].originalIndex + 1 : 0,
        startStepFormatted: phaseSteps.length > 0 ? String(phaseSteps[0].originalIndex + 1).padStart(2, '0') : '00',
        endStepFormatted: phaseSteps.length > 0 ? String(phaseSteps[phaseSteps.length - 1].originalIndex + 1).padStart(2, '0') : '00',
        rangeText: phaseSteps.length > 0 ? `#${String(phaseSteps[0].originalIndex + 1).padStart(2, '0')} ~ #${String(phaseSteps[phaseSteps.length - 1].originalIndex + 1).padStart(2, '0')}` : '공정 없음',
        matchingCount: phaseSteps.length,
      };
    });
  }, [phases, currentProcesses, stepAssignments]);

  // Overall Completion Rates
  const {
    totalStepsCount,
    completedStepsCount,
    unassignedStepsCount,
    conflictStepsCount,
    assignedMachineRate,
    assignedWorkerRate,
    assignedMachCount,
    assignedWorkCount
  } = useMemo(() => {
    const total = currentProcesses.length;
    if (total === 0) {
      return {
        totalStepsCount: 0,
        completedStepsCount: 0,
        unassignedStepsCount: 0,
        conflictStepsCount: 0,
        assignedMachineRate: 0,
        assignedWorkerRate: 0,
        assignedMachCount: 0,
        assignedWorkCount: 0,
      };
    }

    let machAssigned = 0;
    let workAssigned = 0;
    let completed = 0;
    let conflicts = 0;

    currentProcesses.forEach((proc, idx) => {
      const assign = stepAssignments[idx];
      const mach = assign !== undefined ? assign.machine : (proc.assignedMachine || '');
      const work = assign !== undefined ? assign.worker : (proc.worker || proc.assignedWorker || '');

      if (mach) machAssigned++;
      if (work) workAssigned++;
      if (mach && work) completed++;

      const isMachBusy = mach ? busyMachinesMap.has(mach) : false;
      const isWorkBusy = work ? busyWorkersMap.has(work.trim()) : false;
      if (isMachBusy || isWorkBusy) conflicts++;
    });

    return {
      totalStepsCount: total,
      completedStepsCount: completed,
      unassignedStepsCount: total - completed,
      conflictStepsCount: conflicts,
      assignedMachineRate: Math.round((machAssigned / total) * 100),
      assignedWorkerRate: Math.round((workAssigned / total) * 100),
      assignedMachCount: machAssigned,
      assignedWorkCount: workAssigned,
    };
  }, [currentProcesses, stepAssignments, busyMachinesMap, busyWorkersMap]);

  // Recommendation Context for AI Engine
  const orderContext: RecommendationContext = useMemo(() => ({
    customer: customer.trim() || undefined,
    partName: (partName || pjtName || name).trim() || undefined,
    partType: partType.trim() || undefined,
    spec: spec.trim() || undefined,
    qty: qty || 1,
    orderName: (pjtName || name).trim() || undefined,
  }), [customer, partName, pjtName, name, partType, spec, qty]);

  // AI Batch Recommendation Apply Handler
  const handleApplyBatchRecommendations = (appliedUpdates: Record<number, StepAssignment>) => {
    setIsCustomMode(true);
    setStepAssignments((prev) => {
      const updated = { ...prev };
      Object.entries(appliedUpdates).forEach(([idxStr, assign]) => {
        const idx = parseInt(idxStr, 10);
        updated[idx] = assign;
      });
      return updated;
    });

    setCurrentProcesses((prev) => {
      const updated = [...prev];
      Object.entries(appliedUpdates).forEach(([idxStr, assign]) => {
        const idx = parseInt(idxStr, 10);
        if (updated[idx]) {
          updated[idx] = {
            ...updated[idx],
            assignedMachine: assign.machine,
            worker: assign.worker,
            assignedWorker: assign.worker,
          };
        }
      });
      return updated;
    });

    // Record in aiAppliedStepMap for feedback loop and UI status badges
    setAiAppliedStepMap((prev) => {
      const nextMap = { ...prev };
      Object.entries(appliedUpdates).forEach(([idxStr, assign]) => {
        const idx = parseInt(idxStr, 10);
        nextMap[idx] = {
          recWorker: assign.worker,
          recMachine: assign.machine,
          score: 95,
        };
      });
      return nextMap;
    });

    setBatchSuccessMessage(`✨ AI 추천 ${Object.keys(appliedUpdates).length}건이 성공적으로 일괄 배정되었습니다.`);
    setTimeout(() => setBatchSuccessMessage(''), 4000);
  };

  // AI Single Step Recommended Pair Apply Handler
  const handleApplyRecommendedPair = (idx: number, worker: string, machine: string) => {
    setIsCustomMode(true);
    setStepAssignments((prev) => ({
      ...prev,
      [idx]: {
        machine,
        worker,
      },
    }));
    setCurrentProcesses((prev) => {
      const updated = [...prev];
      if (updated[idx]) {
        updated[idx] = {
          ...updated[idx],
          assignedMachine: machine,
          worker,
          assignedWorker: worker,
        };
      }
      return updated;
    });
    setAiAppliedStepMap((prev) => ({
      ...prev,
      [idx]: {
        recWorker: worker,
        recMachine: machine,
        score: 95,
      },
    }));
  };

  // Smart Auto Allocate Algorithm
  const handleSmartAutoAllocate = () => {
    setIsCustomMode(true);
    const newAssignments = { ...stepAssignments };
    const validOperators = extractValidApprovedOperators(usersList, approvedOperators);

    currentProcesses.forEach((proc, idx) => {
      let targetMachine = newAssignments[idx]?.machine;
      let targetWorker = newAssignments[idx]?.worker;

      if (!targetMachine) {
        if (proc.category === '가공') {
          targetMachine = MCT_MACHINES.find((m) => !busyMachinesMap.has(m)) || MCT_MACHINES[0];
        } else if (proc.category === '연마') {
          targetMachine = GRINDER_MACHINES.find((m) => !busyMachinesMap.has(m)) || GRINDER_MACHINES[0];
        } else if (proc.category === '품질') {
          targetMachine = CMM_MACHINES.find((m) => !busyMachinesMap.has(m)) || CMM_MACHINES[0];
        } else if (proc.category === '외주') {
          targetMachine = '(외주/협력사)';
        } else {
          targetMachine = MCT_MACHINES[0];
        }
      }

      if (!targetWorker && proc.category !== '외주') {
        const idleWorker = validOperators.find((op) => !busyWorkersMap.has(op));
        targetWorker = idleWorker || validOperators[0] || '김현수';
      }

      newAssignments[idx] = {
        machine: targetMachine,
        worker: targetWorker,
      };
    });

    setStepAssignments(newAssignments);
    setBatchSuccessMessage('✨ 설비 가동 상태 및 담당자 배정 가능 여부를 분석하여 최적 배정이 완료되었습니다.');
    setTimeout(() => setBatchSuccessMessage(''), 3500);
  };

  // Step Field Update Handlers
  const handleStepMachineChange = (idx: number, machine: string) => {
    setIsCustomMode(true);
    setStepAssignments((prev) => ({
      ...prev,
      [idx]: {
        machine,
        worker: prev[idx] !== undefined ? prev[idx].worker : (currentProcesses[idx]?.worker || currentProcesses[idx]?.assignedWorker || ''),
      },
    }));
    setCurrentProcesses((prev) => {
      const updated = [...prev];
      if (updated[idx]) {
        updated[idx] = {
          ...updated[idx],
          assignedMachine: machine,
        };
      }
      return updated;
    });
  };

  const handleStepWorkerChange = (idx: number, worker: string) => {
    setIsCustomMode(true);
    setStepAssignments((prev) => ({
      ...prev,
      [idx]: {
        machine: prev[idx] !== undefined ? prev[idx].machine : (currentProcesses[idx]?.assignedMachine || ''),
        worker,
      },
    }));
    setCurrentProcesses((prev) => {
      const updated = [...prev];
      if (updated[idx]) {
        updated[idx] = {
          ...updated[idx],
          worker,
          assignedWorker: worker,
        };
      }
      return updated;
    });
  };

  const handleStepDurationChange = (idx: number, hours: number) => {
    setIsCustomMode(true);
    setCurrentProcesses((prev) => {
      const updated = [...prev];
      if (updated[idx]) {
        const safeHours = Math.max(0.1, hours);
        updated[idx] = { ...updated[idx], durationHours: safeHours, estimatedHours: safeHours };
      }
      return updated;
    });
  };

  const handleUpdateProcessField = (idx: number, field: keyof ProcessStep, value: any) => {
    setIsCustomMode(true);
    setCurrentProcesses((prev) => {
      const updated = [...prev];
      if (updated[idx]) {
        updated[idx] = { ...updated[idx], [field]: value };
        if (field === 'category' && value === '외주') {
          handleStepMachineChange(idx, '(외주/협력사)');
        }
      }
      return updated;
    });
  };

  // Selection & Batch Action Handlers
  const handleToggleSelectStep = (idx: number) => {
    setSelectedStepIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedStepIndices(new Set(currentProcesses.map((_, i) => i)));
  };

  const handleDeselectAll = () => {
    setSelectedStepIndices(new Set());
  };

  const handleSelectByCategory = (cat: ProcessCategory) => {
    const matching = new Set<number>();
    currentProcesses.forEach((p, idx) => {
      if (p.category === cat) matching.add(idx);
    });
    setSelectedStepIndices(matching);
  };

  const handleApplyBatchAssignment = () => {
    if (selectedStepIndices.size === 0) return;
    setIsCustomMode(true);
    const newAssignments = { ...stepAssignments };
    const dur = parseFloat(batchDuration);

    selectedStepIndices.forEach((idx) => {
      const current = newAssignments[idx] || { machine: '', worker: '' };
      newAssignments[idx] = {
        machine: batchMachine !== '' ? batchMachine : current.machine,
        worker: batchWorker !== '' ? batchWorker : current.worker,
      };

      if (!isNaN(dur) && dur > 0) {
        handleStepDurationChange(idx, dur);
      }
    });

    setStepAssignments(newAssignments);
    setBatchSuccessMessage(`✨ 선택된 ${selectedStepIndices.size}개 공정에 설비/담당자 일괄 지정이 적용되었습니다.`);
    setTimeout(() => setBatchSuccessMessage(''), 3000);
  };

  const handleBatchMovePhases = () => {
    if (selectedStepIndices.size === 0 || !batchTargetPhase) return;
    setIsCustomMode(true);
    setCurrentProcesses((prev) =>
      prev.map((proc, idx) =>
        selectedStepIndices.has(idx) ? { ...proc, phaseId: batchTargetPhase } : proc
      )
    );
    setBatchSuccessMessage(`✨ 선택된 ${selectedStepIndices.size}개 공정이 '${batchTargetPhase}' 구간으로 이동되었습니다.`);
    setTimeout(() => setBatchSuccessMessage(''), 3000);
  };

  const handleBatchDeleteSelectedSteps = () => {
    if (selectedStepIndices.size === 0) return;
    if (!confirm(`선택한 ${selectedStepIndices.size}개 공정을 목록에서 삭제하시겠습니까?`)) return;

    setIsCustomMode(true);
    const newProcesses = currentProcesses.filter((_, idx) => !selectedStepIndices.has(idx));
    const newAssignments: Record<number, StepAssignment> = {};

    newProcesses.forEach((_, newIdx) => {
      let oldIdx = 0;
      let count = 0;
      for (let i = 0; i < currentProcesses.length; i++) {
        if (!selectedStepIndices.has(i)) {
          if (count === newIdx) {
            oldIdx = i;
            break;
          }
          count++;
        }
      }
      newAssignments[newIdx] = stepAssignments[oldIdx] || { machine: '', worker: '' };
    });

    setCurrentProcesses(newProcesses);
    setStepAssignments(newAssignments);
    setSelectedStepIndices(new Set());
    setActiveStepIndex(newProcesses.length > 0 ? 0 : null);
  };

  const handleAddProcess = (category: ProcessCategory = '가공', targetPhaseId?: string) => {
    setIsCustomMode(true);
    const targetPhase = targetPhaseId || selectedPhaseId || phases[0]?.id || 'phase_1';
    const newIndex = currentProcesses.length;
    const newCode = `OP${String(newIndex + 1).padStart(3, '0')}`;

    const newStep: ProcessStep = {
      id: `custom_step_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `신규 ${category} 공정`,
      code: newCode,
      category,
      phaseId: targetPhase,
      durationHours: 1.0,
      estimatedHours: 1.0,
      assignedMachine: '',
      assignedWorker: '',
      worker: '',
      description: '작업 표준 지침에 따라 가공 및 치수 검사를 진행합니다.',
    };

    setCurrentProcesses((prev) => [...prev, newStep]);
    setStepAssignments((prev) => ({
      ...prev,
      [newIndex]: {
        machine: '',
        worker: '',
      },
    }));
    setActiveStepIndex(newIndex);
  };

  const handleDeleteProcess = (idx: number) => {
    if (!confirm(`'${currentProcesses[idx]?.name}' 공정을 삭제하시겠습니까?`)) return;
    setIsCustomMode(true);
    const newProcesses = currentProcesses.filter((_, i) => i !== idx);
    const newAssignments: Record<number, StepAssignment> = {};

    newProcesses.forEach((_, newIdx) => {
      const oldIdx = newIdx >= idx ? newIdx + 1 : newIdx;
      newAssignments[newIdx] = stepAssignments[oldIdx] || { machine: '', worker: '' };
    });

    setCurrentProcesses(newProcesses);
    setStepAssignments(newAssignments);
    if (activeStepIndex === idx) {
      setActiveStepIndex(newProcesses.length > 0 ? Math.max(0, idx - 1) : null);
    }
  };

  const handleDuplicateStep = (idx: number) => {
    const src = currentProcesses[idx];
    if (!src) return;
    setIsCustomMode(true);
    const newStep: ProcessStep = {
      ...src,
      id: `copy_step_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${src.name} (복사본)`,
      code: `OP${String(currentProcesses.length + 1).padStart(3, '0')}`,
    };

    const newIndex = currentProcesses.length;
    setCurrentProcesses((prev) => [...prev, newStep]);
    setStepAssignments((prev) => ({
      ...prev,
      [newIndex]: {
        machine: stepAssignments[idx]?.machine || src.assignedMachine || '',
        worker: stepAssignments[idx]?.worker || src.worker || src.assignedWorker || '',
      },
    }));
    setActiveStepIndex(newIndex);
  };

  // Phase Management Handlers
  const handleAddPhaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhaseName.trim()) {
      alert('Phase 명칭을 입력해주세요.');
      return;
    }

    const newId = `phase_custom_${Date.now()}`;
    const newPhase: PhaseDefinition = {
      id: newId,
      name: newPhaseName.trim(),
      titleSuffix: newPhaseName.trim(),
      defaultDesc: newPhaseDesc.trim() || '사용자 정의 공정 구간',
      icon: newPhaseIcon,
      badgeColor: newPhaseColor,
    };

    setPhases((prev) => [...prev, newPhase]);
    setExpandedPhases((prev) => ({ ...prev, [newId]: true }));
    setIsAddPhaseModalOpen(false);
    setNewPhaseName('');
    setNewPhaseDesc('');
  };

  const handleMovePhaseUp = (idx: number) => {
    if (idx <= 0) return;
    setPhases((prev) => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[idx - 1];
      next[idx - 1] = temp;
      return next;
    });
  };

  const handleMovePhaseDown = (idx: number) => {
    if (idx >= phases.length - 1) return;
    setPhases((prev) => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[idx + 1];
      next[idx + 1] = temp;
      return next;
    });
  };

  const handleRequestDeletePhase = (phase: { id: string; name: string }, stepsCount: number) => {
    if (phases.length <= 1) {
      alert('최소 1개 이상의 Phase 구간이 유지되어야 합니다.');
      return;
    }

    if (stepsCount === 0) {
      setPhases((prev) => prev.filter((p) => p.id !== phase.id));
      return;
    }

    const fallbackPhase = phases.find((p) => p.id !== phase.id)?.id || '';
    setDeleteTargetPhaseId(fallbackPhase);
    setDeletePhaseTarget({ phase, stepsCount });
  };

  const executeMigrateStepsAndDeletePhase = () => {
    if (!deletePhaseTarget || !deleteTargetPhaseId) return;
    setIsCustomMode(true);
    setCurrentProcesses((prev) =>
      prev.map((proc) =>
        proc.phaseId === deletePhaseTarget.phase.id
          ? { ...proc, phaseId: deleteTargetPhaseId }
          : proc
      )
    );
    setPhases((prev) => prev.filter((p) => p.id !== deletePhaseTarget.phase.id));
    setDeletePhaseTarget(null);
  };

  const executeDeletePhaseAndAllSteps = () => {
    if (!deletePhaseTarget) return;
    setIsCustomMode(true);
    const newProcesses = currentProcesses.filter(
      (proc) => proc.phaseId !== deletePhaseTarget.phase.id
    );
    const newAssignments: Record<number, StepAssignment> = {};
    newProcesses.forEach((_, idx) => {
      newAssignments[idx] = { machine: MCT_MACHINES[0], worker: approvedOperators[0] || '김현수' };
    });
    setCurrentProcesses(newProcesses);
    setStepAssignments(newAssignments);
    setPhases((prev) => prev.filter((p) => p.id !== deletePhaseTarget.phase.id));
    setDeletePhaseTarget(null);
  };

  // Reset Process Design & Phase Groups Handler
  const handleExecuteResetProcessDesign = (options: ResetProcessOptions) => {
    const isCustom = typeId === 'TYPE_CUSTOM';
    const defaultPhases: PhaseDefinition[] = isCustom ? [CUSTOM_INITIAL_PHASE] : INITIAL_PHASE_DEFS;

    const rawTemplateSteps: ProcessStep[] =
      !isCustom && productTypes[typeId]?.processes
        ? productTypes[typeId].processes.map((p) => ({ ...p }))
        : [];

    let targetPhases = phases;
    if (options.resetPhases) {
      targetPhases = defaultPhases;
      setPhases(defaultPhases);
      setExpandedPhases(
        isCustom
          ? { phase_custom_1: true }
          : { phase_1: true, phase_2: true, phase_3: true, phase_4: true }
      );
      setSelectedPhaseId(null);
    }

    let workingSteps: ProcessStep[] = [];
    if (options.resetProcesses) {
      const stepsWithPhases = ensureStepsWithPhases(rawTemplateSteps, targetPhases);
      workingSteps = stepsWithPhases.map((step) => ({
        ...step,
        assignedMachine: options.resetMachines ? '' : step.assignedMachine || '',
        worker: options.resetWorkers ? '' : step.worker || step.assignedWorker || '',
        assignedWorker: options.resetWorkers ? '' : step.assignedWorker || step.worker || '',
      }));
      setIsCustomMode(false);
    } else {
      const remapped = ensureStepsWithPhases(currentProcesses, targetPhases);
      workingSteps = remapped.map((step) => ({
        ...step,
        assignedMachine: options.resetMachines ? '' : step.assignedMachine || '',
        worker: options.resetWorkers ? '' : step.worker || step.assignedWorker || '',
        assignedWorker: options.resetWorkers ? '' : step.assignedWorker || step.worker || '',
      }));
    }
    setCurrentProcesses(workingSteps);

    const newAssignments: Record<number, StepAssignment> = {};
    workingSteps.forEach((step, idx) => {
      const existingMach = stepAssignments[idx]?.machine || step.assignedMachine || '';
      const existingWork = stepAssignments[idx]?.worker || step.worker || step.assignedWorker || '';

      newAssignments[idx] = {
        machine: options.resetMachines ? '' : existingMach,
        worker: options.resetWorkers ? '' : existingWork,
      };
    });
    setStepAssignments(newAssignments);

    if (options.resetAiRecommendations) {
      setAiAppliedStepMap({});
    }

    setSelectedStepIndices(new Set());
    setFilterOnlyUnassigned(false);
    setFilterOnlyConflicts(false);
    setRoutingSearchTerm('');
    setActiveStepIndex(workingSteps.length > 0 ? 0 : null);
  };

  // Copy from completed order
  const completedOrArchivedOrders = useMemo(() => {
    return (Object.values(orders) as Order[]).filter(
      (o) => o.archived || o.status === 'COMPLETED'
    );
  }, [orders]);

  const applyCopyFromOrder = (sourceOrder: Order) => {
    skipTypeResetRef.current = true;
    setTypeId(sourceOrder.typeId || 'TYPE_CUSTOM');

    const rawProcesses =
      sourceOrder.customProcesses && sourceOrder.customProcesses.length > 0
        ? sourceOrder.customProcesses.map((p) => ({ ...p }))
        : productTypes[sourceOrder.typeId]?.processes
        ? productTypes[sourceOrder.typeId].processes.map((p) => ({ ...p }))
        : [];

    const steps = ensureStepsWithPhases(rawProcesses);
    setCurrentProcesses(steps);
    setIsCustomMode(true);

    const newAssignments: Record<number, StepAssignment> = {};
    steps.forEach((proc, idx) => {
      newAssignments[idx] = {
        machine: proc.assignedMachine || MCT_MACHINES[0],
        worker: proc.worker || proc.assignedWorker || '',
      };
    });

    setStepAssignments(newAssignments);
    setName(`[재수주] ${sourceOrder.name}`);
    setPjtName(sourceOrder.pjtName || sourceOrder.name);
    setPjtNo(sourceOrder.pjtNo || sourceOrder.poNumber || '');
    setQty(sourceOrder.qty || 1);
    setCustomer(sourceOrder.customer || '');
    setPoNumber(sourceOrder.poNumber || '');
    setPartName(sourceOrder.partName || '');
    setPartType(sourceOrder.partType || 'UPPER (상판)');
    setSpec(sourceOrder.spec || '');
    setSerialNo(sourceOrder.serialNo ? `${sourceOrder.serialNo}-RE` : '');
    setDueDate(sourceOrder.dueDate || '');
    setSpecialNotes(sourceOrder.specialNotes || '※ 공정 간 인수인계 철저히 할 것!');
    setCopiedSourceOrder(sourceOrder);
    setIsArchiveModalOpen(false);
  };

  useEffect(() => {
    if (pendingCopyOrder) {
      applyCopyFromOrder(pendingCopyOrder);
      if (onClearPendingCopyOrder) onClearPendingCopyOrder();
    }
  }, [pendingCopyOrder]);

  // Form Submit Handler
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canEditOrder) {
      alert('⚠️ 신규 수주 등록 권한이 없습니다.\n(관리자 또는 영업담당자 계정으로 로그인해주세요.)');
      return;
    }

    const finalPjtNo = pjtNo.trim() || poNumber.trim();
    const finalPjtName = pjtName.trim() || name.trim();

    if (!finalPjtNo) {
      alert('⚠️ [프로젝트 번호]는 필수 입력 항목입니다. 미작성 시 수주 등록이 불가합니다.\n(예: PRJ-2026-001)');
      return;
    }
    if (!customer.trim()) {
      alert('⚠️ [고객사]는 필수 입력 항목입니다. 미작성 시 수주 등록이 불가합니다.\n(예: (주)테스트코리아)');
      return;
    }
    if (!finalPjtName) {
      alert('⚠️ [프로젝트명/품명]은 필수 입력 항목입니다. 미작성 시 수주 등록이 불가합니다.\n(예: PNT Flex Bolt 2P SLOT DIE)');
      return;
    }
    if (currentProcesses.length === 0) {
      alert('최소 1개 이상의 공정 단계가 필요합니다.');
      return;
    }

    let targetOrderId = (customOrderId || autoOrderId || '').trim();
    if (!targetOrderId) targetOrderId = getNextSequentialOrderId();

    if (orders[targetOrderId]) {
      alert(`⚠️ 수주번호 '${targetOrderId}'는 이미 등록되어 있는 번호입니다. 중복되지 않는 수주번호를 입력해 주세요.`);
      return;
    }

    const finalProcesses: ProcessStep[] = currentProcesses.map((p, idx) => {
      const assign = stepAssignments[idx];
      const mach = assign !== undefined ? assign.machine : (p.assignedMachine || '');
      const work = assign !== undefined ? assign.worker : (p.worker || p.assignedWorker || '');
      return {
        ...p,
        assignedMachine: mach,
        worker: work,
        assignedWorker: work,
      };
    });

    const newOrder: Order = {
      id: targetOrderId,
      name: finalPjtName,
      pjtNo: finalPjtNo,
      pjtName: finalPjtName,
      typeId,
      qty: Math.max(1, qty),
      startDate,
      status: 'PENDING',
      archived: false,
      mctMachine: stepAssignments[0]?.machine || MCT_MACHINES[0],
      memo: (memo || specialNotes || '공정 간 인수인계 철저히 할 것!').trim(),
      customProcesses: finalProcesses,
      customer: customer.trim() || '고객사 지정',
      poNumber: poNumber.trim() || finalPjtNo,
      partName: partName.trim() || finalPjtName,
      partType: partType.trim() || 'UPPER (상판)',
      spec: spec.trim() || '650L',
      serialNo: serialNo.trim() || formatSerialRange(finalPjtNo, qty),
      dueDate: dueDate.trim() || getDefaultDueDateString(),
      specialNotes: (specialNotes || memo || '공정 간 인수인계 철저히 할 것!').trim(),
    };

    const initialProgressMap: ProcessProgressMap = {};
    for (let q = 1; q <= Math.max(1, qty); q++) {
      finalProcesses.forEach((_, pIdx) => {
        const processKey = `${targetOrderId}_Q${q}_P${pIdx}`;
        const assign = stepAssignments[pIdx] || { machine: '', worker: '' };
        initialProgressMap[processKey] = {
          isCompleted: false,
          status: 'READY',
          machine: assign.machine,
          worker: assign.worker,
          andonStatus: 'NORMAL',
        };
      });
    }

    // Check Resource Conflicts
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
      setPendingConflicts(detectedConflicts);
      setPendingSubmitPayload({
        order: newOrder,
        initialProgressMap,
      });
      return;
    }

    executeCreateOrder(newOrder, initialProgressMap);
  };

  const executeCreateOrder = (
    newOrder: Order,
    initialProgressMap: ProcessProgressMap
  ) => {
    // 🧠 AI Learning Feedback Loop: Record Manager Decisions
    try {
      const orderCtx: RecommendationContext = {
        customer: newOrder.customer,
        partName: newOrder.partName,
        partType: newOrder.partType,
        spec: newOrder.spec,
        qty: newOrder.qty,
        orderName: newOrder.name,
      };

      newOrder.customProcesses.forEach((proc, idx) => {
        const chosenWorker = proc.worker || proc.assignedWorker || '';
        const chosenMachine = proc.assignedMachine || '';
        const aiInfo = aiAppliedStepMap[idx];

        const wasAiOverridden = Boolean(
          aiInfo && (chosenWorker !== aiInfo.recWorker || chosenMachine !== aiInfo.recMachine)
        );

        recordManagerDecision(
          orderCtx,
          proc,
          chosenWorker,
          chosenMachine,
          wasAiOverridden,
          aiInfo ? { worker: aiInfo.recWorker, machine: aiInfo.recMachine } : undefined
        );
      });
    } catch (e) {
      console.warn('AI feedback learning record error:', e);
    }

    onCreateOrder(newOrder, initialProgressMap);
    setCreatedOrderForTraveler(newOrder);
    setShowCreatedOrderModal(true);
    setCopiedSourceOrder(null);
    setPendingConflicts(null);
    setPendingSubmitPayload(null);
  };

  // Live preview order object for the traveler modal before submission
  const previewOrderObject: Order = useMemo(() => {
    const finalPjtName = pjtName.trim() || name.trim() || '신규 프로젝트';
    const notes = (specialNotes || memo || '공정 간 인수인계 철저히 할 것!').trim();
    return {
      id: customOrderId.trim() || 'ORD-PREVIEW',
      name: finalPjtName,
      pjtNo: pjtNo.trim() || 'PRJ-2026-001',
      pjtName: finalPjtName,
      typeId,
      qty: Math.max(1, qty),
      startDate,
      status: 'IN_PROGRESS',
      archived: false,
      mctMachine: stepAssignments[0]?.machine || MCT_MACHINES[0],
      memo: notes,
      customProcesses: currentProcesses.map((p, idx) => {
        const assign = stepAssignments[idx];
        const mach = assign !== undefined ? assign.machine : (p.assignedMachine || '');
        const work = assign !== undefined ? assign.worker : (p.worker || p.assignedWorker || '');
        return {
          ...p,
          assignedMachine: mach,
          worker: work,
          assignedWorker: work,
        };
      }),
      customer: customer.trim() || '고객사 지정',
      poNumber: poNumber.trim() || pjtNo.trim() || 'PRJ-2026-001',
      partName: partName.trim() || finalPjtName,
      partType: partType.trim() || 'UPPER (상판)',
      spec: spec.trim() || '650L',
      serialNo: serialNo.trim() || formatSerialRange(pjtNo || 'NN-NNNN-2608-01', qty),
      dueDate: dueDate.trim() || getDefaultDueDateString(),
      specialNotes: notes,
    };
  }, [
    customOrderId,
    pjtName,
    name,
    typeId,
    qty,
    startDate,
    stepAssignments,
    memo,
    currentProcesses,
    customer,
    poNumber,
    pjtNo,
    partName,
    partType,
    spec,
    serialNo,
    dueDate,
    specialNotes,
  ]);

  return (
    <div className="space-y-3 pb-8">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER & SUMMARY METRICS BAR */}
      {/* ------------------------------------------------------------- */}
      <OrderFormHeader
        customOrderId={customOrderId}
        setCustomOrderId={setCustomOrderId}
        pjtNo={pjtNo}
        handlePjtNoChange={handlePjtNoChange}
        customer={customer}
        setCustomer={setCustomer}
        pjtName={pjtName}
        handlePjtNameChange={handlePjtNameChange}
        spec={spec}
        setSpec={setSpec}
        qty={qty}
        handleQtyChange={handleQtyChange}
        startDate={startDate}
        setStartDate={setStartDate}
        serialNo={serialNo}
        setSerialNo={handleSerialNoChange}
        dueDate={dueDate}
        setDueDate={setDueDate}
        memo={memo}
        setMemo={setMemo}
        specialNotes={specialNotes}
        setSpecialNotes={setSpecialNotes}
        totalProcessesCount={totalStepsCount}
        completedStepsCount={completedStepsCount}
        unassignedStepsCount={unassignedStepsCount}
        conflictStepsCount={conflictStepsCount}
        assignedMachineRate={assignedMachineRate}
        assignedWorkerRate={assignedWorkerRate}
        canEditOrder={canEditOrder}
        onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
        onOpenPreviewTraveler={() => setIsPreviewTravelerOpen(true)}
        onSmartAutoAllocate={handleSmartAutoAllocate}
        onOpenAiBatchModal={() => setIsAiBatchModalOpen(true)}
        onSubmit={handleSubmit}
        productTypes={productTypes}
        typeId={typeId}
        setTypeId={setTypeId}
        getCurrentDateTimeString={getCurrentDateTimeString}
        onValidate={() => {
          if (conflictStepsCount > 0) {
            alert(`⚠️ 현재 ${conflictStepsCount}개 공정에 설비/담당자 가동 충돌이 있습니다. 확인해주세요.`);
          } else if (unassignedStepsCount > 0) {
            alert(`ℹ️ 총 ${unassignedStepsCount}개 공정에 설비/담당자가 미지정되어 있습니다.`);
          } else {
            alert('✨ 모든 필수 정보 및 공정 설비/담당자 배정이 정상적으로 완료되었습니다.');
          }
        }}
        onSaveDraft={() => {
          localStorage.setItem('order_form_draft', JSON.stringify({ pjtNo, pjtName, customer, customProcesses: currentProcesses }));
          alert('💾 현재 입력 정보가 브라우저에 임시 저장되었습니다.');
        }}
        filterOnlyUnassigned={filterOnlyUnassigned}
        setFilterOnlyUnassigned={setFilterOnlyUnassigned}
        filterOnlyConflicts={filterOnlyConflicts}
        setFilterOnlyConflicts={setFilterOnlyConflicts}
        isOrderIdDuplicate={Boolean(customOrderId.trim() && orders[customOrderId.trim()])}
      />

      {/* ------------------------------------------------------------- */}
      {/* 2. 1440px DESKTOP-OPTIMIZED WORKSTATION LAYOUT (Grid Focus + Detail Panel) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start h-[calc(100vh-190px)] min-h-[640px]">
        {/* CENTER-LEFT: Process Grid & Compact Phase Grouping & Batch Actions (8 cols) */}
        <div className="lg:col-span-8 h-full">
          <ProcessGridPanel
            currentProcesses={currentProcesses}
            stepAssignments={stepAssignments}
            selectedStepIndices={selectedStepIndices}
            onToggleSelectStep={handleToggleSelectStep}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onSelectByCategory={handleSelectByCategory}
            activeStepIndex={activeStepIndex}
            onSetActiveStepIndex={setActiveStepIndex}
            routingSearchTerm={routingSearchTerm}
            setRoutingSearchTerm={setRoutingSearchTerm}
            selectedPhaseId={selectedPhaseId}
            onSelectPhase={setSelectedPhaseId}
            phases={phases}
            phaseGroups={phaseGroups}
            expandedPhases={expandedPhases}
            onTogglePhaseExpand={(id) =>
              setExpandedPhases((prev) => ({ ...prev, [id]: !prev[id] }))
            }
            onExpandAllPhases={() => {
              const all: Record<string, boolean> = {};
              phases.forEach((p) => (all[p.id] = true));
              setExpandedPhases(all);
            }}
            onCollapseAllPhases={() => setExpandedPhases({})}
            onOpenAddPhaseModal={() => setIsAddPhaseModalOpen(true)}
            onOpenResetModal={() => setIsResetModalOpen(true)}
            onRequestDeletePhase={handleRequestDeletePhase}
            onMovePhaseUp={handleMovePhaseUp}
            onMovePhaseDown={handleMovePhaseDown}
            equipmentOptions={equipmentOptions}
            operatorOptions={operatorOptions}
            busyMachinesMap={busyMachinesMap}
            busyWorkersMap={busyWorkersMap}
            onStepMachineChange={handleStepMachineChange}
            onStepWorkerChange={handleStepWorkerChange}
            onStepDurationChange={handleStepDurationChange}
            onUpdateProcessField={handleUpdateProcessField}
            onAddProcess={handleAddProcess}
            onDeleteProcess={handleDeleteProcess}
            onBatchDeleteSelectedSteps={handleBatchDeleteSelectedSteps}
            onDuplicateStep={handleDuplicateStep}
            batchMachine={batchMachine}
            setBatchMachine={setBatchMachine}
            batchWorker={batchWorker}
            setBatchWorker={setBatchWorker}
            batchDuration={batchDuration}
            setBatchDuration={setBatchDuration}
            batchTargetPhase={batchTargetPhase}
            setBatchTargetPhase={setBatchTargetPhase}
            onApplyBatchAssignment={handleApplyBatchAssignment}
            onBatchMovePhases={handleBatchMovePhases}
            filterOnlyUnassigned={filterOnlyUnassigned}
            setFilterOnlyUnassigned={setFilterOnlyUnassigned}
            filterOnlyConflicts={filterOnlyConflicts}
            setFilterOnlyConflicts={setFilterOnlyConflicts}
            onOpenAiBatchModal={() => setIsAiBatchModalOpen(true)}
            aiAppliedStepMap={aiAppliedStepMap}
            totalProcessesCount={totalStepsCount}
            completedStepsCount={completedStepsCount}
            unassignedStepsCount={unassignedStepsCount}
            conflictStepsCount={conflictStepsCount}
            assignedMachineRate={assignedMachineRate}
            assignedWorkerRate={assignedWorkerRate}
          />
        </div>

        {/* RIGHT: Process Detail & AI Recommendation Panel (4 cols) */}
        <div className="lg:col-span-4 h-full">
          <ProcessDetailPanel
            stepIndex={activeStepIndex}
            currentProcesses={currentProcesses}
            stepAssignments={stepAssignments}
            phases={phases}
            equipmentOptions={equipmentOptions}
            operatorOptions={operatorOptions}
            busyMachinesMap={busyMachinesMap}
            busyWorkersMap={busyWorkersMap}
            orderContext={orderContext}
            onApplyRecommendedPair={handleApplyRecommendedPair}
            onClose={() => setActiveStepIndex(null)}
            onNavigateStep={(direction) => {
              if (activeStepIndex === null) return;
              if (direction === 'PREV' && activeStepIndex > 0) {
                setActiveStepIndex(activeStepIndex - 1);
              } else if (direction === 'NEXT' && activeStepIndex < currentProcesses.length - 1) {
                setActiveStepIndex(activeStepIndex + 1);
              }
            }}
            onStepMachineChange={handleStepMachineChange}
            onStepWorkerChange={handleStepWorkerChange}
            onStepDurationChange={handleStepDurationChange}
            onUpdateProcessField={handleUpdateProcessField}
            onDuplicateStep={handleDuplicateStep}
            onDeleteStep={handleDeleteProcess}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. MODALS & SAFETY CONFIRMATION DIALOGS */}
      {/* ------------------------------------------------------------- */}

      {/* ADD PHASE MODAL */}
      {isAddPhaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <FolderPlus className="w-4 h-4" />
                <span>새로운 공정 구간(Phase) 추가</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddPhaseModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPhaseSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phase 명칭 *</label>
                <input
                  type="text"
                  value={newPhaseName}
                  onChange={(e) => setNewPhaseName(e.target.value)}
                  placeholder="예: Phase 5: 특수 코팅 및 베벨링 가공"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">구간 상세 설명</label>
                <input
                  type="text"
                  value={newPhaseDesc}
                  onChange={(e) => setNewPhaseDesc(e.target.value)}
                  placeholder="예: 코팅 전처리 및 표면 정밀 조도 측정 구간"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPhaseModalOpen(false)}
                  className="px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg shadow-xs"
                >
                  Phase 생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE PHASE SAFETY MODAL */}
      {deletePhaseTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-rose-200 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-rose-600 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>공정 구간(Phase) 삭제 확인</span>
              </h3>
              <button
                type="button"
                onClick={() => setDeletePhaseTarget(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <p className="text-slate-700">
                '{deletePhaseTarget.phase.name}' 구간에 소속된 {deletePhaseTarget.stepsCount}개 공정을 다른 구간으로 이동시키시겠습니까?
              </p>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600">이동 대상 Phase:</span>
                <select
                  value={deleteTargetPhaseId}
                  onChange={(e) => setDeleteTargetPhaseId(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-bold"
                >
                  {phases
                    .filter((p) => p.id !== deletePhaseTarget.phase.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={executeMigrateStepsAndDeletePhase}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black"
                >
                  공정 이동 후 구간 삭제
                </button>
                <button
                  type="button"
                  onClick={executeDeletePhaseAndAllSteps}
                  className="w-full py-2 bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 rounded-lg font-bold"
                >
                  소속 공정도 함께 영구 삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFLICT WARNING CONFIRMATION MODAL */}
      {pendingConflicts && pendingSubmitPayload && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-amber-300 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-amber-500 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span>설비 / 담당자 중복 충돌 감지</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setPendingConflicts(null);
                  setPendingSubmitPayload(null);
                }}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <p className="text-slate-700">
                다음 설비/담당자가 현재 다른 수주에서 가동 또는 작업 중입니다. 계속 등록하시겠습니까?
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1 bg-amber-50/50 p-2 rounded-lg border border-amber-200">
                {pendingConflicts.map((c, i) => (
                  <div key={i} className="text-[11px] text-amber-900 font-bold flex justify-between">
                    <span>• {c.stepName} ({c.type === 'MACHINE' ? '설비' : '담당자'}: {c.resourceName})</span>
                    <span className="text-slate-500 font-normal">'{c.busyInfo.orderName}' 진행중</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingConflicts(null);
                    setPendingSubmitPayload(null);
                  }}
                  className="px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  수정하러 가기
                </button>
                <button
                  type="button"
                  onClick={() =>
                    executeCreateOrder(
                      pendingSubmitPayload.order,
                      pendingSubmitPayload.initialProgressMap
                    )
                  }
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-lg shadow-xs"
                >
                  충돌 무시하고 등록 계속
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ARCHIVE / PREVIOUS ORDER COPY MODAL */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-gradient-to-r from-amber-600 to-yellow-600 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Copy className="w-4 h-4" />
                <span>이전 수주 및 완료보관함 사양 복사</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <p className="text-slate-600">
                과거 완료된 수주의 공정 구성 및 설비/담당자 지정 정보를 복사하여 신규 수주에 즉시 적용합니다.
              </p>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {completedOrArchivedOrders.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-bold">
                    복사 가능한 완료 수주가 없습니다.
                  </div>
                ) : (
                  completedOrArchivedOrders.map((ord) => (
                    <div
                      key={ord.id}
                      onClick={() => applyCopyFromOrder(ord)}
                      className="p-3 hover:bg-amber-50/60 transition cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="font-extrabold text-slate-900 text-xs">{ord.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {ord.id} | {ord.customer || '고객사'} | {ord.customProcesses?.length || 0}단계 공정
                        </div>
                      </div>
                      <button
                        type="button"
                        className="px-2.5 py-1 text-[11px] font-black text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-md transition"
                      >
                        선택 적용
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATION SUCCESS MODAL */}
      {showCreatedOrderModal && createdOrderForTraveler && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-emerald-500 animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-7 h-7 text-white" />
                <div>
                  <h3 className="font-extrabold text-base">🎉 신규 수주가 성공적으로 등록되었습니다!</h3>
                  <p className="text-xs text-emerald-100 font-mono mt-0.5">
                    {createdOrderForTraveler.id} | {createdOrderForTraveler.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreatedOrderModal(false);
                  setCreatedOrderForTraveler(null);
                }}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">수주명 / 프로젝트:</span>
                  <span className="font-extrabold text-slate-900">{createdOrderForTraveler.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">고객사 / PO:</span>
                  <span className="font-bold text-slate-900">
                    {createdOrderForTraveler.customer} / {createdOrderForTraveler.poNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">공정 구성:</span>
                  <span className="font-black text-blue-700">
                    총 {createdOrderForTraveler.customProcesses?.length || 0}단계 공정 구성 완료
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreatedOrderModal(false);
                    setCreatedOrderForTraveler(null);
                  }}
                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  확인 (신규 등록 계속)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreatedOrderModal(false);
                    setIsPostCreateTravelerOpen(true);
                  }}
                  className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>공정 이동표 즉시 인쇄 (A4)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROCESS TRAVELER MODALS */}
      {isPreviewTravelerOpen && (
        <ProcessTravelerModal
          isOpen={isPreviewTravelerOpen}
          onClose={() => setIsPreviewTravelerOpen(false)}
          order={previewOrderObject}
          productTypes={productTypes}
          currentUser={currentUser}
          processProgressMap={processProgressMap}
        />
      )}

      {isPostCreateTravelerOpen && createdOrderForTraveler && (
        <ProcessTravelerModal
          isOpen={isPostCreateTravelerOpen}
          onClose={() => {
            setIsPostCreateTravelerOpen(false);
            setCreatedOrderForTraveler(null);
          }}
          order={createdOrderForTraveler}
          productTypes={productTypes}
          currentUser={currentUser}
          processProgressMap={processProgressMap}
          onUpdateOrder={onUpdateOrder}
        />
      )}

      {/* AI BATCH RECOMMENDATION MODAL */}
      {isAiBatchModalOpen && (
        <AiBatchRecommendationModal
          isOpen={isAiBatchModalOpen}
          onClose={() => setIsAiBatchModalOpen(false)}
          currentProcesses={currentProcesses}
          stepAssignments={stepAssignments}
          selectedStepIndices={selectedStepIndices}
          phases={phases}
          availableMachines={equipmentOptions.map((o) => o.value)}
          availableOperators={operatorOptions.map((o) => o.value)}
          orderContext={orderContext}
          busyMachinesMap={busyMachinesMap}
          busyWorkersMap={busyWorkersMap}
          onApplyBatchRecommendations={handleApplyBatchRecommendations}
        />
      )}

      {/* PROCESS DESIGN & PHASE RESET MODAL */}
      {isResetModalOpen && (
        <ResetProcessDesignModal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          onConfirmReset={handleExecuteResetProcessDesign}
          currentPhasesCount={phases.length}
          currentProcessesCount={currentProcesses.length}
          assignedMachineCount={assignedMachCount}
          assignedWorkerCount={assignedWorkCount}
          aiAppliedCount={Object.keys(aiAppliedStepMap).length}
        />
      )}
    </div>
  );
};
