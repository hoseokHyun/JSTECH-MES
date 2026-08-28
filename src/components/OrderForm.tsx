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
  usersList = [],
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
  // Live Firestore users subscription for real-time operator sync
  const [dbUsers, setDbUsers] = useState<User[]>(usersList);

  useEffect(() => {
    if (usersList && usersList.length > 0) {
      setDbUsers(usersList);
    }
  }, [usersList]);

  useEffect(() => {
    const unsub = subscribeUsersList((list) => {
      setDbUsers(list);
    });
    return () => unsub();
  }, []);
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

  // Process Traveler Metadata States (공정 이동표 실시간 연동)
  const [customer, setCustomer] = useState<string>('');
  const [poNumber, setPoNumber] = useState<string>('');
  const [partName, setPartName] = useState<string>('');
  const [partType, setPartType] = useState<string>('UPPER (상판)');
  const [spec, setSpec] = useState<string>('');
  const [serialNo, setSerialNo] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [specialNotes, setSpecialNotes] = useState<string>('※ 공정 간 인수인계 철저히 할 것!');
  const [isTravelerMetaExpanded, setIsTravelerMetaExpanded] = useState<boolean>(true);
  const [isPreviewTravelerOpen, setIsPreviewTravelerOpen] = useState<boolean>(false);
  const [createdOrderForTraveler, setCreatedOrderForTraveler] = useState<Order | null>(null);
  const [showCreatedOrderModal, setShowCreatedOrderModal] = useState<boolean>(false);
  const [isPostCreateTravelerOpen, setIsPostCreateTravelerOpen] = useState<boolean>(false);

  // Auto-fill traveler fields when project name is typed
  const handleNameChange = (val: string) => {
    setName(val);
    if (!customer) {
      if (val.includes('삼성')) setCustomer('삼성디스플레이');
      else if (val.includes('LG')) setCustomer('LG디스플레이');
      else if (val.includes('SK')) setCustomer('SK온');
      else if (val.includes('PNT')) setCustomer('PNT');
    }
    if (!partName && val.trim()) {
      setPartName(val.replace(/(삼성디스플레이|LG디스플레이|SK온|PNT)/g, '').trim());
    }
    const specMatch = val.match(/(\d+mm|\d+L|\d+세대)/i);
    if (specMatch && !spec) {
      setSpec(specMatch[0]);
    }
  };

  // Editable Process Steps State
  const [currentProcesses, setCurrentProcesses] = useState<ProcessStep[]>([]);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // Per-step machine & worker assignment state
  const [stepAssignments, setStepAssignments] = useState<Record<number, StepAssignment>>({});

  // Phase accordion expanded state (default collapsed for all blocks)
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});

  // Quick Filter / Search Term for routing processes
  const [routingSearchTerm, setRoutingSearchTerm] = useState<string>('');

  // Batch selection of step indices & empty phase IDs
  const [selectedStepIndices, setSelectedStepIndices] = useState<Set<number>>(new Set());
  const [selectedEmptyPhaseIds, setSelectedEmptyPhaseIds] = useState<Set<string>>(new Set());

  // Batch assignment target inputs
  const [batchMachine, setBatchMachine] = useState<string>('');
  const [batchWorker, setBatchWorker] = useState<string>('');
  const [batchDuration, setBatchDuration] = useState<string>('');
  const [batchTargetPhase, setBatchTargetPhase] = useState<string>('phase_1');
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string>('');

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

  // Compute live operator options dynamically strictly from verified registered users & approvedOperators
  const dynamicOperators = useMemo(() => {
    return extractValidApprovedOperators(dbUsers, approvedOperators);
  }, [dbUsers, approvedOperators]);

  // Options for Operator Searchable Select with Busy status indicator
  const operatorOptions: SelectOption[] = useMemo(() => {
    return buildOperatorSelectOptions(
      dynamicOperators,
      undefined,
      {
        placeholderLabel: '(미지정)',
        allowOutsourcing: true,
        busyWorkersMap,
      }
    );
  }, [dynamicOperators, busyWorkersMap]);

  // Phase Definition Interface for Dynamic Phase Blocks
  interface PhaseDefinition {
    id: string;
    name: string;
    titleSuffix: string;
    defaultDesc: string;
    icon: string;
    badgeColor: string;
  }

  // 4 Standard Initial Milestone Phase Definitions
  const INITIAL_PHASE_DEFS: PhaseDefinition[] = [
    {
      id: 'phase_1',
      name: '[Phase 1] 소재 준비, 황삭 및 1차 가공 구간',
      titleSuffix: '소재 준비, 황삭 및 1차 가공 구간',
      defaultDesc: '소재 입고 검사, 정밀 절단, 외곽 황삭 가공 및 1차 기준면 가공 공정',
      icon: '📦',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    },
    {
      id: 'phase_2',
      name: '[Phase 2] 열처리, 1차 연마 및 평면도 가공 구간',
      titleSuffix: '열처리, 1차 연마 및 평면도 가공 구간',
      defaultDesc: '진공 열처리 경화, 1차 정밀 평면연마 및 주요 유로/단차 MCT 중가공 공정',
      icon: '⚙️',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    },
    {
      id: 'phase_3',
      name: '[Phase 3] 초정밀 립(LIP) 가공 및 유로/홀 정밀 가공 구간',
      titleSuffix: '초정밀 립(LIP) 가공 및 유로/홀 정밀 가공 구간',
      defaultDesc: '초정밀 립(Lip) 가공, 경면 래핑, 도금 및 딥핑(Dipping) 특수 표면처리 공정',
      icon: '✨',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    },
    {
      id: 'phase_4',
      name: '[Phase 4] 랩핑, CMM 3차원 정밀 측정 및 최종 출하 검사 구간',
      titleSuffix: '랩핑, CMM 3차원 정밀 측정 및 최종 출하 검사 구간',
      defaultDesc: '3차원 CMM 정밀 치수 측정, 초음파 세척, 조립 및 최종 포장/출하 공정',
      icon: '📐',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    },
  ];

  // Practical Quick Presets for New Phase Creation (정밀 기계 부품 및 노즐 가공 현장 표준 6대 공정)
  const QUICK_PHASE_PRESETS = [
    {
      titleSuffix: '소재 발주 및 외주 열처리',
      defaultDesc: '소재 발주 및 입고 치수 검사, 협력사 연계 용체화, 석출경화 및 서브제로 열처리 공정',
      icon: '🔥',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    },
    {
      titleSuffix: 'MCT 가공',
      defaultDesc: 'MCT를 활용한 형상 황삭(Rough) 및 고정밀 치수 정삭(Finish) 가공 공정',
      icon: '⚙️',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    },
    {
      titleSuffix: '연마 공정',
      defaultDesc: '요구 공차 확보를 위한 황삭/정삭 연마 및 결합 부위 조립 연마 가공 공정',
      icon: '🔘',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    },
    {
      titleSuffix: '세척 및 클린룸 조립',
      defaultDesc: '초음파 탈지 세척, 에어 건조 및 부품 클린룸 조립 공정',
      icon: '💧',
      badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    },
    {
      titleSuffix: '품질 검사',
      defaultDesc: '3차원 측정기(CMM) 치수 검수, 표면 거칠기 측정 및 품질 성적서 발행 공정',
      icon: '🔬',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    },
    {
      titleSuffix: '포장 및 출하',
      defaultDesc: '제품 출하 포장, 바코드 라벨링 및 물류 배송 공정',
      icon: '📦',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    },
  ];

  const AVAILABLE_ICONS = ['🔥', '⚙️', '🔘', '💧', '🔬', '📦', '🔍', '🧪', '💎', '🛠️', '🛡️', '📋', '🎯', '📐'];

  const AVAILABLE_COLORS = [
    { name: '앰버 (소재/황삭)', value: 'bg-amber-100 text-amber-900 border-amber-300' },
    { name: '블루 (MCT/정밀)', value: 'bg-blue-100 text-blue-900 border-blue-300' },
    { name: '에메랄드 (연마/랩핑)', value: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    { name: '퍼플 (CMM/검사)', value: 'bg-purple-100 text-purple-900 border-purple-300' },
    { name: '인디고 (표면처리/도금)', value: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
    { name: '로즈 (출하/패키징)', value: 'bg-rose-100 text-rose-900 border-rose-300' },
    { name: '시안 (클린룸/세척)', value: 'bg-cyan-100 text-cyan-900 border-cyan-300' },
    { name: '슬레이트 (기타/외주)', value: 'bg-slate-100 text-slate-800 border-slate-300' },
  ];

  const CUSTOM_INITIAL_PHASE: PhaseDefinition = {
    id: 'phase_custom_1',
    name: '[Phase 1] 커스텀 공정 구간',
    titleSuffix: '커스텀 공정 구간',
    defaultDesc: '공정을 직접 추가하고 설비와 담당자를 지정하여 유연하게 구성하는 공정 구간입니다.',
    icon: '✨',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
  };

  // Dynamic Phases State
  const [phases, setPhases] = useState<PhaseDefinition[]>(() => {
    return typeId === 'TYPE_CUSTOM' ? [CUSTOM_INITIAL_PHASE] : INITIAL_PHASE_DEFS;
  });

  // Add Phase Modal State
  const [isAddPhaseModalOpen, setIsAddPhaseModalOpen] = useState<boolean>(false);
  const [newPhaseTitle, setNewPhaseTitle] = useState<string>('');
  const [newPhaseDesc, setNewPhaseDesc] = useState<string>('');
  const [newPhaseIcon, setNewPhaseIcon] = useState<string>('⚙️');
  const [newPhaseColor, setNewPhaseColor] = useState<string>('bg-blue-100 text-blue-900 border-blue-300');

  // Delete Phase Safeguard Modal State
  const [deletePhaseTarget, setDeletePhaseTarget] = useState<{
    phase: PhaseDefinition;
    stepsCount: number;
  } | null>(null);
  const [deleteTargetPhaseId, setDeleteTargetPhaseId] = useState<string>('');

  // Helper to ensure all steps have valid unique id and phaseId in sequential order across active phases
  const ensureStepsWithPhases = (
    steps: ProcessStep[],
    activePhases: PhaseDefinition[] = phases
  ): ProcessStep[] => {
    const total = steps.length;
    if (total === 0) return [];

    const validPhaseIds = activePhases.map((p) => p.id);
    const fallbackPhaseId = validPhaseIds[0] || 'phase_1';
    const numBlocks = Math.max(1, activePhases.length);
    const baseBlockSize = Math.floor(total / numBlocks);
    const remainder = total % numBlocks;

    let currentBound = 0;
    const initialized = steps.map((s, idx) => {
      let assignedPhase = s.phaseId;
      if (!assignedPhase || !validPhaseIds.includes(assignedPhase)) {
        for (let b = 0; b < numBlocks; b++) {
          const blockSize = baseBlockSize + (b < remainder ? 1 : 0);
          if (idx < currentBound + blockSize || b === numBlocks - 1) {
            assignedPhase = activePhases[b]?.id || fallbackPhaseId;
            break;
          }
          currentBound += blockSize;
        }
      }
      return {
        ...s,
        phaseId: assignedPhase || fallbackPhaseId,
        id: s.id || `step_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      };
    });

    // Sort by sequential Phase Order: activePhases order
    const sorted: ProcessStep[] = [];
    activePhases.forEach((p) => {
      initialized.forEach((s) => {
        if ((s.phaseId || fallbackPhaseId) === p.id) {
          sorted.push(s);
        }
      });
    });

    return sorted;
  };

  // Sync process steps and assignments when productType changes
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
      setSelectedStepIndices(new Set());
      return;
    }

    const selectedType = productTypes[typeId];
    if (selectedType && selectedType.processes) {
      setIsCustomMode(false);
      setPhases(INITIAL_PHASE_DEFS);
      const rawSteps = selectedType.processes.map((p) => ({ ...p }));
      const steps = ensureStepsWithPhases(rawSteps, INITIAL_PHASE_DEFS);
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

  // Phase Group Interface for Dynamic Sequential Routing Blocks
  interface PhaseGroup {
    id: string;
    phaseNumber: number;
    title: string;
    titleSuffix: string;
    description: string;
    icon: string;
    badgeColor: string;
    steps: { proc: ProcessStep; originalIndex: number }[];
    totalHours: number;
    assignedMachineCount: number;
    assignedWorkerCount: number;
    unassignedMachineCount: number;
    unassignedWorkerCount: number;
    startStep: number;
    endStep: number;
    startStepFormatted: string;
    endStepFormatted: string;
    rangeText: string;
    matchingCount: number;
  }

  // Dynamic grouping calculation: strictly computed from actual steps assigned to each phase
  const phaseGroups: PhaseGroup[] = useMemo(() => {
    const lowerSearch = routingSearchTerm.trim().toLowerCase();

    return phases.map((def, phaseIndex) => {
      // Find all steps belonging to this phase in currentProcesses
      const stepsInPhase: { proc: ProcessStep; originalIndex: number }[] = [];

      currentProcesses.forEach((proc, idx) => {
        const stepPhase = proc.phaseId || phases[0]?.id || 'phase_1';
        if (stepPhase === def.id) {
          stepsInPhase.push({ proc, originalIndex: idx });
        }
      });

      let totalHours = 0;
      let assignedMachineCount = 0;
      let assignedWorkerCount = 0;
      let matchingCount = 0;

      stepsInPhase.forEach(({ proc, originalIndex }) => {
        totalHours += Number(proc.durationHours) || 0;
        const assign = stepAssignments[originalIndex] || { machine: '', worker: '' };
        if (assign.machine && assign.machine !== '(미지정)' && assign.machine !== '') {
          assignedMachineCount++;
        }
        if (assign.worker && assign.worker !== '(미지정)' && assign.worker !== '') {
          assignedWorkerCount++;
        }

        if (lowerSearch) {
          const isMatched =
            proc.name.toLowerCase().includes(lowerSearch) ||
            proc.category.toLowerCase().includes(lowerSearch) ||
            (assign.machine && assign.machine.toLowerCase().includes(lowerSearch)) ||
            (assign.worker && assign.worker.toLowerCase().includes(lowerSearch));
          if (isMatched) matchingCount++;
        }
      });

      const count = stepsInPhase.length;
      let startStep = 0;
      let endStep = 0;
      let startStepFormatted = '-';
      let endStepFormatted = '-';
      let rangeText = '공정 없음';

      if (count > 0) {
        startStep = stepsInPhase[0].originalIndex + 1;
        endStep = stepsInPhase[count - 1].originalIndex + 1;
        const startNum = String(startStep).padStart(2, '0');
        const endNum = String(endStep).padStart(2, '0');
        startStepFormatted = `#${startNum}`;
        endStepFormatted = `#${endNum}`;
        rangeText = `${startStepFormatted} ~ ${endStepFormatted}`;
      }

      // Generate context-aware representative description based on actual step names
      const stepNames = stepsInPhase.map((s) => s.proc.name);
      let autoSummary = def.defaultDesc;
      if (stepNames.length >= 3) {
        autoSummary = `${stepNames[0]} ➔ ${stepNames[Math.floor(stepNames.length / 2)]} ➔ ${stepNames[stepNames.length - 1]}`;
      } else if (stepNames.length === 2) {
        autoSummary = `${stepNames[0]} ➔ ${stepNames[1]}`;
      } else if (stepNames.length === 1) {
        autoSummary = `${stepNames[0]} (단일 공정)`;
      } else {
        autoSummary = '현재 구간에 배치된 공정이 없습니다. 아래에서 공정을 추가하거나 이동하세요.';
      }

      return {
        id: def.id,
        phaseNumber: phaseIndex + 1,
        title: `[Phase ${phaseIndex + 1}] ${def.titleSuffix}`,
        titleSuffix: def.titleSuffix,
        description: autoSummary,
        icon: def.icon,
        badgeColor: def.badgeColor,
        steps: stepsInPhase,
        totalHours,
        assignedMachineCount,
        assignedWorkerCount,
        unassignedMachineCount: count - assignedMachineCount,
        unassignedWorkerCount: count - assignedWorkerCount,
        startStep,
        endStep,
        startStepFormatted,
        endStepFormatted,
        rangeText,
        matchingCount,
      };
    });
  }, [phases, currentProcesses, stepAssignments, routingSearchTerm]);

  // Total matching steps count across all processes for search summary
  const totalMatchedStepsCount = useMemo(() => {
    if (!routingSearchTerm.trim()) return 0;
    const term = routingSearchTerm.trim().toLowerCase();
    return currentProcesses.filter((p, idx) => {
      const assign = stepAssignments[idx] || { machine: '', worker: '' };
      return (
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (assign.machine && assign.machine.toLowerCase().includes(term)) ||
        (assign.worker && assign.worker.toLowerCase().includes(term))
      );
    }).length;
  }, [currentProcesses, stepAssignments, routingSearchTerm]);

  // Auto-expand phases when search term is active
  useEffect(() => {
    if (routingSearchTerm.trim() !== '') {
      const autoExpanded: Record<string, boolean> = {};
      phaseGroups.forEach((group) => {
        if (group.matchingCount > 0) {
          autoExpanded[group.id] = true;
        }
      });
      setExpandedPhases(autoExpanded);
    }
  }, [routingSearchTerm, phaseGroups]);

  // Accordion Toggle Handlers
  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  const handleExpandAllPhases = () => {
    const allOpen: Record<string, boolean> = {};
    phases.forEach((p) => {
      allOpen[p.id] = true;
    });
    setExpandedPhases(allOpen);
  };

  const handleCollapseAllPhases = () => {
    setExpandedPhases({});
  };

  // Phase Dynamic Management: Add New Phase
  const handleCreateNewPhase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhaseTitle.trim()) {
      alert('페이즈 구간 명칭을 입력해주세요.');
      return;
    }

    const newPhaseNum = phases.length + 1;
    const newPhaseId = `phase_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPhaseDef: PhaseDefinition = {
      id: newPhaseId,
      name: `[Phase ${newPhaseNum}] ${newPhaseTitle.trim()}`,
      titleSuffix: newPhaseTitle.trim(),
      defaultDesc: newPhaseDesc.trim() || '신규 등록된 공정 구간입니다.',
      icon: newPhaseIcon || '⚙️',
      badgeColor: newPhaseColor || 'bg-blue-100 text-blue-900 border-blue-300',
    };

    const updatedPhases = [...phases, newPhaseDef];
    setPhases(updatedPhases);
    setExpandedPhases((prev) => ({ ...prev, [newPhaseId]: true }));
    setIsAddPhaseModalOpen(false);
    setNewPhaseTitle('');
    setNewPhaseDesc('');
    setBatchSuccessMessage(`✨ 새로운 공정 구간 '[Phase ${newPhaseNum}] ${newPhaseTitle.trim()}'이(가) 추가되었습니다.`);
    setTimeout(() => setBatchSuccessMessage(''), 4000);
  };

  // Phase Dynamic Management: Request Delete Phase
  const handleRequestDeletePhase = (phaseToDelete: PhaseDefinition) => {
    if (phases.length <= 1) {
      alert('⚠️ 최소 1개 이상의 Phase 공정 구간이 유지되어야 합니다.');
      return;
    }

    const stepsInPhase = currentProcesses.filter((p) => (p.phaseId || phases[0]?.id) === phaseToDelete.id);

    if (stepsInPhase.length === 0) {
      if (confirm(`'${phaseToDelete.name}' 구간을 삭제하시겠습니까?`)) {
        executeDeletePhaseWithoutSteps(phaseToDelete.id);
      }
    } else {
      const remainingPhases = phases.filter((p) => p.id !== phaseToDelete.id);
      setDeleteTargetPhaseId(remainingPhases[0]?.id || '');
      setDeletePhaseTarget({
        phase: phaseToDelete,
        stepsCount: stepsInPhase.length,
      });
    }
  };

  // Delete Empty Phase
  const executeDeletePhaseWithoutSteps = (phaseIdToDelete: string) => {
    const updatedPhases = phases
      .filter((p) => p.id !== phaseIdToDelete)
      .map((p, idx) => ({
        ...p,
        name: `[Phase ${idx + 1}] ${p.titleSuffix}`,
      }));
    setPhases(updatedPhases);
    setBatchSuccessMessage('🗑️ 공정 구간이 삭제되었습니다.');
    setTimeout(() => setBatchSuccessMessage(''), 4000);
  };

  // Migrate steps to target phase and then delete phase
  const executeMigrateStepsAndDeletePhase = () => {
    if (!deletePhaseTarget || !deleteTargetPhaseId) return;

    setIsCustomMode(true);
    const phaseIdToDelete = deletePhaseTarget.phase.id;

    // Update process steps whose phaseId was deleted
    const updatedProcessesWithTarget = currentProcesses.map((p) => {
      if ((p.phaseId || phases[0]?.id) === phaseIdToDelete) {
        return { ...p, phaseId: deleteTargetPhaseId };
      }
      return p;
    });

    const updatedPhases = phases
      .filter((p) => p.id !== phaseIdToDelete)
      .map((p, idx) => ({
        ...p,
        name: `[Phase ${idx + 1}] ${p.titleSuffix}`,
      }));

    // Re-order by remaining phases
    const newProcesses: ProcessStep[] = [];
    const newAssignments: Record<number, StepAssignment> = {};
    let newIdx = 0;

    updatedPhases.forEach((p) => {
      updatedProcessesWithTarget.forEach((proc, oldIdx) => {
        if ((proc.phaseId || updatedPhases[0]?.id) === p.id) {
          newProcesses.push(proc);
          newAssignments[newIdx] = stepAssignments[oldIdx] || { machine: '', worker: '' };
          newIdx++;
        }
      });
    });

    setPhases(updatedPhases);
    setCurrentProcesses(newProcesses);
    setStepAssignments(newAssignments);
    setExpandedPhases((prev) => ({ ...prev, [deleteTargetPhaseId]: true }));
    setDeletePhaseTarget(null);

    const targetDef = updatedPhases.find((p) => p.id === deleteTargetPhaseId);
    setBatchSuccessMessage(
      `✨ ${deletePhaseTarget.stepsCount}개 공정이 [${targetDef?.name || deleteTargetPhaseId}] 구간으로 안전하게 이동되고 이전 구간이 삭제되었습니다.`
    );
    setTimeout(() => setBatchSuccessMessage(''), 4000);
  };

  // Delete phase along with all of its steps
  const executeDeletePhaseAndAllSteps = () => {
    if (!deletePhaseTarget) return;

    setIsCustomMode(true);
    const phaseIdToDelete = deletePhaseTarget.phase.id;

    const remainingProcesses: ProcessStep[] = [];
    const remainingAssignments: Record<number, StepAssignment> = {};
    let newIdx = 0;

    currentProcesses.forEach((proc, oldIdx) => {
      if ((proc.phaseId || phases[0]?.id) !== phaseIdToDelete) {
        remainingProcesses.push(proc);
        remainingAssignments[newIdx] = stepAssignments[oldIdx] || { machine: '', worker: '' };
        newIdx++;
      }
    });

    const updatedPhases = phases
      .filter((p) => p.id !== phaseIdToDelete)
      .map((p, idx) => ({
        ...p,
        name: `[Phase ${idx + 1}] ${p.titleSuffix}`,
      }));

    setPhases(updatedPhases);
    setCurrentProcesses(remainingProcesses);
    setStepAssignments(remainingAssignments);
    setDeletePhaseTarget(null);
    setBatchSuccessMessage(
      `🗑️ '${deletePhaseTarget.phase.name}' 구간 및 소속 공정 ${deletePhaseTarget.stepsCount}개가 모두 삭제되었습니다.`
    );
    setTimeout(() => setBatchSuccessMessage(''), 4000);
  };

  // Batch Selection Handlers
  const handleToggleSelectStep = (idx: number) => {
    setSelectedStepIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleToggleSelectEmptyPhase = (phaseId: string) => {
    setSelectedEmptyPhaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  const handleToggleSelectGroup = (group: PhaseGroup) => {
    if (group.steps.length === 0) {
      handleToggleSelectEmptyPhase(group.id);
      return;
    }

    const groupIndices = group.steps.map((s) => s.originalIndex);
    const allSelected = groupIndices.every((idx) => selectedStepIndices.has(idx));

    setSelectedStepIndices((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        groupIndices.forEach((idx) => next.delete(idx));
      } else {
        groupIndices.forEach((idx) => next.add(idx));
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedStepIndices(new Set(currentProcesses.map((_, i) => i)));
  };

  const handleDeselectAll = () => {
    setSelectedStepIndices(new Set());
    setSelectedEmptyPhaseIds(new Set());
  };

  const handleSelectByCategory = (cat: ProcessCategory) => {
    const matching = currentProcesses
      .map((p, idx) => (p.category === cat ? idx : -1))
      .filter((idx) => idx !== -1);
    setSelectedStepIndices(new Set(matching));
  };

  const handleBatchDeleteSelectedSteps = () => {
    if (selectedStepIndices.size === 0) return;
    if (!confirm(`선택한 ${selectedStepIndices.size}개의 공정을 정말 삭제하시겠습니까?`)) {
      return;
    }
    setIsCustomMode(true);
    const count = selectedStepIndices.size;
    const remainingProcesses: ProcessStep[] = [];
    const remainingAssignments: Record<number, StepAssignment> = {};
    let newIdx = 0;

    currentProcesses.forEach((proc, idx) => {
      if (!selectedStepIndices.has(idx)) {
        remainingProcesses.push(proc);
        remainingAssignments[newIdx] = stepAssignments[idx] || { machine: '', worker: '' };
        newIdx++;
      }
    });

    setCurrentProcesses(remainingProcesses);
    setStepAssignments(remainingAssignments);
    setSelectedStepIndices(new Set());
    setBatchSuccessMessage(`🗑️ 선택된 ${count}개 공정이 삭제되었습니다.`);
    setTimeout(() => setBatchSuccessMessage(''), 4000);
  };

  const handleDeleteSelectedEmptyPhases = () => {
    if (selectedEmptyPhaseIds.size === 0) return;
    if (phases.length - selectedEmptyPhaseIds.size < 1) {
      alert('⚠️ 최소 1개 이상의 Phase 공정 구간이 유지되어야 합니다.');
      return;
    }
    if (!confirm(`선택한 ${selectedEmptyPhaseIds.size}개 빈 Phase 구간을 삭제하시겠습니까?`)) {
      return;
    }
    const count = selectedEmptyPhaseIds.size;
    const updatedPhases = phases
      .filter((p) => !selectedEmptyPhaseIds.has(p.id))
      .map((p, idx) => ({
        ...p,
        name: `[Phase ${idx + 1}] ${p.titleSuffix}`,
      }));
    setPhases(updatedPhases);
    setSelectedEmptyPhaseIds(new Set());
    setBatchSuccessMessage(`🗑️ 선택된 ${count}개 빈 Phase 구간이 삭제되었습니다.`);
    setTimeout(() => setBatchSuccessMessage(''), 4000);
  };

  // Step Migration: Move single step to target phase with preserved assignments
  const handleMoveStepToPhase = (stepOriginalIndex: number, targetPhaseId: string) => {
    setIsCustomMode(true);
    const targetStep = currentProcesses[stepOriginalIndex];
    if (!targetStep || targetStep.phaseId === targetPhaseId) return;

    const updatedWithPhase = currentProcesses.map((p, idx) => {
      if (idx === stepOriginalIndex) {
        return { ...p, phaseId: targetPhaseId };
      }
      return p;
    });

    // Reorder whole array by dynamic phases order to keep routing continuous
    const newProcesses: ProcessStep[] = [];
    const newAssignments: Record<number, StepAssignment> = {};

    let newIdx = 0;
    phases.forEach((p) => {
      updatedWithPhase.forEach((proc, oldIdx) => {
        if ((proc.phaseId || phases[0]?.id) === p.id) {
          newProcesses.push(proc);
          newAssignments[newIdx] = stepAssignments[oldIdx] || { machine: '', worker: '' };
          newIdx++;
        }
      });
    });

    setCurrentProcesses(newProcesses);
    setStepAssignments(newAssignments);
    setSelectedStepIndices(new Set());

    // Auto-open target phase
    setExpandedPhases((prev) => ({ ...prev, [targetPhaseId]: true }));

    const targetDef = phases.find((d) => d.id === targetPhaseId);
    setBatchSuccessMessage(`✨ '${targetStep.name}' 공정이 [${targetDef?.name || targetPhaseId}] 구간으로 이동되었습니다.`);
    setTimeout(() => setBatchSuccessMessage(''), 4000);
  };

  // Batch Step Migration: Move all selected steps to target phase
  const handleBatchMoveStepsToPhase = (targetPhaseId: string) => {
    if (selectedStepIndices.size === 0) {
      alert('⚠️ 구간을 이동할 공정 항목을 먼저 체크(선택)해 주세요.');
      return;
    }
    setIsCustomMode(true);

    const updatedWithPhase = currentProcesses.map((p, idx) => {
      if (selectedStepIndices.has(idx)) {
        return { ...p, phaseId: targetPhaseId };
      }
      return p;
    });

    const newProcesses: ProcessStep[] = [];
    const newAssignments: Record<number, StepAssignment> = {};

    let newIdx = 0;
    phases.forEach((p) => {
      updatedWithPhase.forEach((proc, oldIdx) => {
        if ((proc.phaseId || phases[0]?.id) === p.id) {
          newProcesses.push(proc);
          newAssignments[newIdx] = stepAssignments[oldIdx] || { machine: '', worker: '' };
          newIdx++;
        }
      });
    });

    const count = selectedStepIndices.size;
    setCurrentProcesses(newProcesses);
    setStepAssignments(newAssignments);
    setSelectedStepIndices(new Set());

    // Auto-open target phase
    setExpandedPhases((prev) => ({ ...prev, [targetPhaseId]: true }));

    const targetDef = phases.find((d) => d.id === targetPhaseId);
    setBatchSuccessMessage(`✨ 선택된 ${count}개 공정이 [${targetDef?.name || targetPhaseId}] 구간으로 일괄 이동되었습니다!`);
    setTimeout(() => setBatchSuccessMessage(''), 4000);
  };

  // Batch Apply Assignment (Machine, Worker, Duration)
  const handleApplyBatchAssignment = () => {
    if (selectedStepIndices.size === 0) {
      alert('⚠️ 일괄 지정할 공정 항목을 먼저 체크(선택)해 주세요.');
      return;
    }
    if (!batchMachine && !batchWorker && !batchDuration) {
      alert('⚠️ 일괄 적용할 [설비], [담당자], 또는 [소요시간] 중 최소 하나를 선택해주세요.');
      return;
    }

    setIsCustomMode(true);
    const updatedAssignments = { ...stepAssignments };
    let updatedProcesses = [...currentProcesses];

    selectedStepIndices.forEach((idx) => {
      const currentAssign = updatedAssignments[idx] || { machine: '', worker: '' };
      updatedAssignments[idx] = {
        machine: batchMachine !== '' ? batchMachine : currentAssign.machine,
        worker: batchWorker !== '' ? batchWorker : currentAssign.worker,
      };

      if (batchDuration && parseFloat(batchDuration) > 0) {
        updatedProcesses[idx] = {
          ...updatedProcesses[idx],
          durationHours: parseFloat(batchDuration),
        };
      }
    });

    setStepAssignments(updatedAssignments);
    setCurrentProcesses(updatedProcesses);

    const count = selectedStepIndices.size;
    setBatchSuccessMessage(`✨ 선택된 ${count}개 공정에 일괄 설정이 즉시 적용되었습니다!`);
    setTimeout(() => setBatchSuccessMessage(''), 4000);
  };

  // Smart Machine & Worker Allocation Algorithm (Pure Heuristic Scoring)
  const handleSmartAutoAllocate = () => {
    setIsCustomMode(true);
    const updatedAssignments = { ...stepAssignments };
    let assignedCount = 0;

    // Filter available machine pools
    const mctPool = MCT_MACHINES.filter((m) => !busyMachinesMap.has(m)).concat(MCT_MACHINES);
    const grinderPool = GRINDER_MACHINES.filter((m) => !busyMachinesMap.has(m)).concat(GRINDER_MACHINES);
    const cmmPool = CMM_MACHINES.filter((m) => !busyMachinesMap.has(m)).concat(CMM_MACHINES);

    // Filter available worker pools
    const availableOperators = dynamicOperators.length > 0 ? dynamicOperators : approvedOperators;
    const idleOperators = availableOperators.filter((op) => !busyWorkersMap.has(op.trim())).concat(availableOperators);

    currentProcesses.forEach((proc, idx) => {
      let recMachine = '';
      let recWorker = '';

      if (proc.category === '가공') {
        recMachine = mctPool[idx % mctPool.length] || MCT_MACHINES[0];
        const mctWorkers = idleOperators.filter((w) => w.includes('가공') || w.includes('MCT'));
        recWorker = mctWorkers.length > 0 ? mctWorkers[idx % mctWorkers.length] : idleOperators[idx % idleOperators.length];
      } else if (proc.category === '연마') {
        recMachine = grinderPool[idx % grinderPool.length] || GRINDER_MACHINES[0];
        const grinderWorkers = idleOperators.filter((w) => w.includes('연마') || w.includes('랩핑'));
        recWorker = grinderWorkers.length > 0 ? grinderWorkers[idx % grinderWorkers.length] : idleOperators[idx % idleOperators.length];
      } else if (proc.category === '품질') {
        recMachine = cmmPool[idx % cmmPool.length] || CMM_MACHINES[0];
        const qualityWorkers = idleOperators.filter((w) => w.includes('품질') || w.includes('검사') || w.includes('CMM'));
        recWorker = qualityWorkers.length > 0 ? qualityWorkers[idx % qualityWorkers.length] : idleOperators[idx % idleOperators.length];
      } else if (proc.category === '외주') {
        recMachine = '(외주/협력사)';
        recWorker = '외주 관리팀';
      }

      updatedAssignments[idx] = {
        machine: recMachine,
        worker: recWorker,
      };
      assignedCount++;
    });

    setStepAssignments(updatedAssignments);
    setBatchSuccessMessage(`🧠 스마트 알고리즘 적용: 전체 ${assignedCount}개 공정에 최적 설비(대기/부하 균등) 및 숙련 담당자가 자동 배정되었습니다!`);
    setTimeout(() => setBatchSuccessMessage(''), 5000);
  };

  // Add process step directly into a specific Phase
  const handleAddProcessToPhase = (phaseId: string, presetCategory?: ProcessCategory) => {
    setIsCustomMode(true);
    const targetPhaseDef = phases.find((p) => p.id === phaseId);
    const phaseSuffix = targetPhaseDef?.titleSuffix || '';

    let defaultCat: ProcessCategory = presetCategory || '가공';
    if (!presetCategory) {
      if (phaseSuffix.includes('연마') || phaseSuffix.includes('래핑') || phaseSuffix.includes('랩핑')) {
        defaultCat = '연마';
      } else if (phaseSuffix.includes('검사') || phaseSuffix.includes('CMM') || phaseSuffix.includes('품질') || phaseSuffix.includes('측정')) {
        defaultCat = '품질';
      } else if (phaseSuffix.includes('외주') || phaseSuffix.includes('열처리') || phaseSuffix.includes('도금')) {
        defaultCat = '외주';
      }
    }

    let defaultDuration = 2;
    let defaultName = `신규 ${defaultCat} 공정`;

    if (defaultCat === '가공') {
      defaultDuration = 4;
      defaultName = phaseSuffix.includes('황삭') ? '소재 1차 황삭 가공' : '초정밀 립(LIP) 및 유로 가공';
    } else if (defaultCat === '연마') {
      defaultDuration = 3;
      defaultName = '정밀 평면 연마 가공';
    } else if (defaultCat === '품질') {
      defaultDuration = 1;
      defaultName = 'CMM 3차원 정밀 측정 및 전수 검사';
    } else if (defaultCat === '외주') {
      defaultDuration = 48;
      defaultName = '진공 열처리/표면처리 외주';
    }

    let defaultMachine = '';
    if (defaultCat === '가공') defaultMachine = MCT_MACHINES[0];
    else if (defaultCat === '연마') defaultMachine = GRINDER_MACHINES[0];
    else if (defaultCat === '품질') defaultMachine = CMM_MACHINES[0];
    else if (defaultCat === '외주') defaultMachine = '(외주/협력사)';

    const newStep: ProcessStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      phaseId: phaseId,
      name: defaultName,
      category: defaultCat,
      durationHours: defaultDuration,
    };

    const updated = [...currentProcesses, newStep];
    const newProcesses: ProcessStep[] = [];
    const newAssignments: Record<number, StepAssignment> = {};

    let newIdx = 0;
    phases.forEach((p) => {
      updated.forEach((proc, oldIdx) => {
        if ((proc.phaseId || phases[0]?.id) === p.id) {
          newProcesses.push(proc);
          if (oldIdx === currentProcesses.length) {
            newAssignments[newIdx] = {
              machine: defaultMachine,
              worker: approvedOperators[0] || '',
            };
          } else {
            newAssignments[newIdx] = stepAssignments[oldIdx] || { machine: '', worker: '' };
          }
          newIdx++;
        }
      });
    });

    setCurrentProcesses(newProcesses);
    setStepAssignments(newAssignments);
    setExpandedPhases((prev) => ({ ...prev, [phaseId]: true }));
  };

  // General process add helper
  const handleAddProcess = (presetCategory?: ProcessCategory) => {
    handleAddProcessToPhase(phases[0]?.id || 'phase_1', presetCategory);
  };

  const handleRemoveProcess = (idx: number) => {
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
      // If moving across different phases, align phaseId with target slot to keep sequence continuous
      const targetPhase = updated[targetIdx].phaseId || phases[0]?.id || 'phase_1';
      updated[idx] = { ...updated[targetIdx] };
      updated[targetIdx] = { ...temp, phaseId: targetPhase };
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

    const rawProcesses =
      sourceOrder.customProcesses && sourceOrder.customProcesses.length > 0
        ? sourceOrder.customProcesses.map((p) => ({ ...p }))
        : productTypes[sourceOrder.typeId]?.processes
        ? productTypes[sourceOrder.typeId].processes.map((p) => ({ ...p }))
        : [];

    const processes = ensureStepsWithPhases(rawProcesses);
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
    if (sourceOrder.customer) setCustomer(sourceOrder.customer);
    if (sourceOrder.poNumber) setPoNumber(`RE-${sourceOrder.poNumber}`);
    if (sourceOrder.partName) setPartName(sourceOrder.partName);
    if (sourceOrder.partType) setPartType(sourceOrder.partType);
    if (sourceOrder.spec) setSpec(sourceOrder.spec);
    if (sourceOrder.serialNo) setSerialNo(`${sourceOrder.serialNo}-RE`);
    if (sourceOrder.dueDate) setDueDate(sourceOrder.dueDate);
    if (sourceOrder.specialNotes) setSpecialNotes(sourceOrder.specialNotes);
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

  // Reset entire form inputs and routing state
  const handleResetForm = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setName('');
    setCustomer('');
    setPoNumber('');
    setPartName('');
    setPartType('UPPER (상판)');
    setSpec('');
    setSerialNo('');
    setDueDate('');
    setMemo('');
    setSpecialNotes('※ 공정 간 인수인계 철저히 할 것!');
    setQty(1);
    setStartDate(getCurrentDateTimeString());
    setRoutingSearchTerm('');
    setSelectedStepIndices(new Set());
    setSelectedEmptyPhaseIds(new Set());
    setCopiedSourceOrder(null);
    setBatchMachine('');
    setBatchWorker('');
    setBatchDuration('');
    setBatchSuccessMessage('✨ 수주 정보 및 공정 라우팅 설정이 깨끗하게 초기화되었습니다.');

    // Auto-dismiss the reset toast after 3 seconds
    setTimeout(() => {
      setBatchSuccessMessage((prev) =>
        prev === '✨ 수주 정보 및 공정 라우팅 설정이 깨끗하게 초기화되었습니다.' ? '' : prev
      );
    }, 3000);

    const defaultTypeId = productTypes['TYPE_SLIT_NOZZLE']
      ? 'TYPE_SLIT_NOZZLE'
      : Object.keys(productTypes)[0] || 'TYPE_CUSTOM';
    setTypeId(defaultTypeId);

    if (defaultTypeId === 'TYPE_CUSTOM') {
      setIsCustomMode(true);
      setPhases([CUSTOM_INITIAL_PHASE]);
      setExpandedPhases({ phase_custom_1: true });
      setCurrentProcesses([]);
      setStepAssignments({});
    } else if (productTypes[defaultTypeId]?.processes) {
      setIsCustomMode(false);
      setPhases(INITIAL_PHASE_DEFS);
      const rawSteps = productTypes[defaultTypeId].processes.map((p) => ({ ...p }));
      const steps = ensureStepsWithPhases(rawSteps, INITIAL_PHASE_DEFS);
      setCurrentProcesses(steps);
      initStepAssignments(steps);
    }
  };

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

    // Generate guaranteed unique sequential Order ID (ORD-2026-00X)
    let maxNum = 0;
    Object.keys(orders).forEach((id) => {
      const match = id.match(/ORD-(\d{4})-(\d+)/i);
      if (match) {
        const num = parseInt(match[2], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const nextNum = Math.max(maxNum + 1, Object.keys(orders).length + 1);
    let newId = `ORD-2026-${String(nextNum).padStart(3, '0')}`;
    let counter = 1;
    while (orders[newId]) {
      newId = `ORD-2026-${String(nextNum + counter).padStart(3, '0')}`;
      counter++;
    }

    const firstMachine = stepAssignments[0]?.machine || MCT_MACHINES[0];

    const finalProcesses: ProcessStep[] = currentProcesses.map((p, idx) => ({
      ...p,
      assignedMachine: stepAssignments[idx]?.machine || p.assignedMachine || '',
      worker: stepAssignments[idx]?.worker || p.worker || p.assignedWorker || '',
      assignedWorker: stepAssignments[idx]?.worker || p.worker || p.assignedWorker || '',
    }));

    const computedCustomer = customer.trim() || (name.includes('삼성') ? '삼성디스플레이' : name.includes('LG') ? 'LG디스플레이' : name.includes('SK') ? 'SK온' : name.includes('PNT') ? 'PNT' : '고객사 지정');
    const computedPo = poNumber.trim() || newId;
    const computedPartName = partName.trim() || name.trim() || 'SLOT DIE';
    const computedPartType = partType.trim() || 'UPPER (상판)';
    const computedSpec = spec.trim() || '650L';
    const computedSerial = serialNo.trim() || `${computedPo.replace(/[^a-zA-Z0-9-]/g, '')}-01`;
    const computedDueDate = dueDate.trim() || '2026-06-30';
    const computedNotes = specialNotes.trim() || (memo.trim() ? `※ ${memo.trim()}` : '※ 공정 간 인수인계 철저히 할 것!');

    const newOrder: Order = {
      id: newId,
      name: name.trim(),
      typeId,
      qty: Math.max(1, qty),
      startDate,
      status: 'PENDING',
      archived: false,
      mctMachine: firstMachine,
      memo: memo.trim(),
      customProcesses: finalProcesses,
      customer: computedCustomer,
      poNumber: computedPo,
      partName: computedPartName,
      partType: computedPartType,
      spec: computedSpec,
      serialNo: computedSerial,
      dueDate: computedDueDate,
      specialNotes: computedNotes,
    };

    const initialProgressMap: ProcessProgressMap = {};
    for (let q = 1; q <= Math.max(1, qty); q++) {
      finalProcesses.forEach((_, pIdx) => {
        const processKey = `${newId}_Q${q}_P${pIdx}`;
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
    setCreatedOrderForTraveler(newOrder);
    setShowCreatedOrderModal(true);
    setName('');
    setMemo('');
    setCustomer('');
    setPoNumber('');
    setPartName('');
    setSpec('');
    setSerialNo('');
    setDueDate('');
    setStartDate(getCurrentDateTimeString());
    setCopiedSourceOrder(null);
    setPendingConflicts(null);
    setPendingSubmitPayload(null);
  };

  // Live preview order object for the traveler modal before submission
  const previewOrderObject: Order = useMemo(() => {
    return {
      id: 'ORD-PREVIEW',
      name: name.trim() || '신규 프로젝트 공정 이동표 미리보기',
      typeId,
      qty: Math.max(1, qty),
      startDate,
      status: 'IN_PROGRESS',
      archived: false,
      mctMachine: stepAssignments[0]?.machine || MCT_MACHINES[0],
      memo: memo.trim(),
      customProcesses: currentProcesses.map((p, idx) => ({
        ...p,
        assignedMachine: stepAssignments[idx]?.machine || p.assignedMachine || '',
        worker: stepAssignments[idx]?.worker || p.worker || p.assignedWorker || '',
        assignedWorker: stepAssignments[idx]?.worker || p.worker || p.assignedWorker || '',
      })),
      customer: customer.trim() || (name.includes('삼성') ? '삼성디스플레이' : name.includes('LG') ? 'LG디스플레이' : name.includes('SK') ? 'SK온' : name.includes('PNT') ? 'PNT' : '고객사 지정'),
      poNumber: poNumber.trim() || 'PO-2026-001',
      partName: partName.trim() || name.trim() || 'SLOT DIE',
      partType: partType.trim() || 'UPPER (상판)',
      spec: spec.trim() || '650L',
      serialNo: serialNo.trim() || `${(poNumber || 'PO-2026-001').replace(/[^a-zA-Z0-9-]/g, '')}-01`,
      dueDate: dueDate.trim() || '2026-06-30',
      specialNotes: specialNotes.trim() || (memo.trim() ? `※ ${memo.trim()}` : '※ 공정 간 인수인계 철저히 할 것!'),
    };
  }, [name, typeId, qty, startDate, stepAssignments, memo, currentProcesses, customer, poNumber, partName, partType, spec, serialNo, dueDate, specialNotes]);

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
              onClick={() => setIsPreviewTravelerOpen(true)}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              title="현재 입력된 수주 정보와 공정 라우팅으로 공식 공정 이동표(Process Traveler)를 미리보고 인쇄합니다."
            >
              <Printer className="w-3.5 h-3.5 text-emerald-700" />
              <span>공정 이동표 미리보기/인쇄</span>
            </button>

            <button
              type="button"
              onClick={() => setIsArchiveModalOpen(true)}
              disabled={!canEditOrder}
              className="bg-[#FFF9EB] hover:bg-[#FEF3D6] text-[#B45309] border border-[#FCD34D] font-extrabold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              title="완료보관함 수주건의 공정 단계별 설비 및 담당자 정보를 복사하여 신규 수주에 적용합니다."
            >
              <Copy className="w-3.5 h-3.5 text-[#B45309]" />
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
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="예: PNT Flex Bolt 2P SLOT DIE 상판"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Product Type (BOP) Select */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-blue-600" /> 제품 타입 (BOP)
                </label>
                {typeId === 'TYPE_CUSTOM' && (
                  <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded border border-blue-200">
                    커스텀
                  </span>
                )}
              </div>
              <select
                id="order-product-type-select"
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                {/* 1. Custom Process Option */}
                <option value="TYPE_CUSTOM" className="font-black text-blue-900 bg-blue-50">
                  ✨ 커스텀 공정 (사용자 직접 유연 설계)
                </option>

                {/* 2. Registered Standard BOP Product Types */}
                <optgroup label="--- 등록된 표준 제품 타입 (BOP) ---">
                  {(Object.values(productTypes) as ProductType[])
                    .filter((t) => t.id !== 'TYPE_CUSTOM')
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name.replace(/\s*\(\d+단계\)/g, '')} ({t.processes?.length || 0}단계)
                      </option>
                    ))}
                </optgroup>
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

          {/* Process Traveler Official Metadata Card (A4 Form Binding) */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div
              onClick={() => setIsTravelerMetaExpanded(!isTravelerMetaExpanded)}
              className="p-3 bg-slate-100/90 hover:bg-slate-200/70 flex items-center justify-between cursor-pointer border-b border-slate-200 select-none transition"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="font-extrabold text-slate-800 text-xs">
                  공정 이동표 (Process Traveler) 공식 메타데이터 연동
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                  A4 인쇄 자동 바인딩
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-semibold">
                  {isTravelerMetaExpanded ? '접기' : '상세 입력 펼치기'}
                </span>
                {isTravelerMetaExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </div>
            </div>

            {isTravelerMetaExpanded && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white">
                {/* 고객사 */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">고객사</label>
                  <input
                    type="text"
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    placeholder="예: PNT, 삼성디스플레이"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* PO. (PJT) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PO. (PJT)</label>
                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="예: PNT-BNSH650L-26-02"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 품 명 */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">품 명</label>
                  <input
                    type="text"
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                    placeholder="예: Flex Bolt 2P SLOT DIE"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 품 목 */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">품 목</label>
                  <input
                    type="text"
                    value={partType}
                    onChange={(e) => setPartType(e.target.value)}
                    placeholder="예: UPPER (상판), LOWER (하판)"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-black text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 규 격 */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">규 격</label>
                  <input
                    type="text"
                    value={spec}
                    onChange={(e) => setSpec(e.target.value)}
                    placeholder="예: 650L, 1850L"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 각인번호 */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">각인번호</label>
                  <input
                    type="text"
                    value={serialNo}
                    onChange={(e) => setSerialNo(e.target.value)}
                    placeholder="예: PNT-BNSH650L-265-02-02"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 납 기 */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">납 기</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 특이사항 */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">특이사항 (인수인계)</label>
                  <input
                    type="text"
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="※ 공정 간 인수인계 철저히 할 것!"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Process Steps Routing Editor Section */}
          <div className="space-y-3.5 pt-1">
            {/* Header & Global Control Bar */}
            <div className="flex flex-wrap justify-between items-center gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    공정 라우팅 단계 및 설비/담당자 지정
                  </h3>
                  <span className="text-[11px] font-extrabold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                    총 {currentProcesses.length}개 세부 공정 ({phaseGroups.length}개 Phase 구간)
                  </span>
                  {isCustomMode && (
                    <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                      커스텀 편집 중
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  정밀가공 공정 순서(Routing Sequence)를 유지하며 Phase 구간별로 설비·담당자를 검토하고 체크박스로 선택하여 일괄 지정할 수 있습니다.
                </p>
              </div>

              {/* Accordion Expand/Collapse All & Add Phase Button & Reset */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-routing-reset-form"
                  type="button"
                  onClick={handleResetForm}
                  className="px-2.5 py-1.5 text-xs font-extrabold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                  title="수주 입력 정보 및 공정 라우팅 전체를 초기화합니다"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>초기화</span>
                </button>

                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={handleExpandAllPhases}
                    className="px-2.5 py-1 text-[11px] font-black text-slate-700 hover:text-blue-700 hover:bg-blue-50/70 rounded transition cursor-pointer flex items-center gap-1"
                    title="모든 Phase 구간 펼치기"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>모두 펼치기</span>
                  </button>
                  <span className="text-slate-200">|</span>
                  <button
                    type="button"
                    onClick={handleCollapseAllPhases}
                    className="px-2.5 py-1 text-[11px] font-black text-slate-700 hover:text-blue-700 hover:bg-blue-50/70 rounded transition cursor-pointer flex items-center gap-1"
                    title="모든 Phase 구간 접기"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>모두 접기</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSmartAutoAllocate}
                    className="px-3 py-1.5 text-xs bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    title="설비 대기 상태 및 작업자 숙련도를 분석하여 최적의 설비/담당자를 자동 배정합니다"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
                    <span>스마트 최적 배정</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddPhaseModalOpen(true)}
                    className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 hover:shadow"
                    title="새로운 Phase 공정 구간을 추가합니다"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ 새 페이즈 추가</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Search & Quick Category Selection / Add Process Toolbar */}
            <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={routingSearchTerm}
                  onChange={(e) => setRoutingSearchTerm(e.target.value)}
                  placeholder="공정명, 설비명, 담당자 빠른 검색 (예: 유로가공, 립, 연마, MCT...)"
                  className="w-full text-xs pl-9 pr-8 py-2 border border-slate-200 rounded-lg bg-slate-50/60 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400 transition"
                />
                {routingSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setRoutingSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                    title="검색어 지우기"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Quick Select & Quick Add Process Chips */}
              <div className="flex flex-wrap items-center gap-1.5 justify-between lg:justify-end">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-bold mr-0.5">선택:</span>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-md font-bold transition cursor-pointer"
                    title="전체 공정 선택"
                  >
                    전체({currentProcesses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectByCategory('가공')}
                    className="px-2 py-1 text-[10px] bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md font-bold transition cursor-pointer"
                  >
                    가공만
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectByCategory('연마')}
                    className="px-2 py-1 text-[10px] bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md font-bold transition cursor-pointer"
                  >
                    연마만
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectByCategory('품질')}
                    className="px-2 py-1 text-[10px] bg-purple-50/80 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-md font-bold transition cursor-pointer"
                  >
                    CMM만
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectByCategory('외주')}
                    className="px-2 py-1 text-[10px] bg-amber-50/80 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-md font-bold transition cursor-pointer"
                  >
                    외주만
                  </button>
                </div>

                <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-bold mr-0.5">추가:</span>
                  <button
                    type="button"
                    onClick={() => handleAddProcess('가공')}
                    className="px-2 py-1 text-[10px] bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-bold transition flex items-center gap-0.5 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>가공</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddProcess('연마')}
                    className="px-2 py-1 text-[10px] bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold transition flex items-center gap-0.5 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>연마</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddProcess('품질')}
                    className="px-2 py-1 text-[10px] bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-md font-bold transition flex items-center gap-0.5 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>CMM</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddProcess('외주')}
                    className="px-2 py-1 text-[10px] bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-bold transition flex items-center gap-0.5 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>외주</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* INTEGRATED CONTEXTUAL ACTION BAR (선택 공정 일괄 제어 바) */}
            {/* ------------------------------------------------------------- */}
            {(selectedStepIndices.size > 0 || selectedEmptyPhaseIds.size > 0) && (
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-xl p-3.5 shadow-lg border-2 border-blue-400/50 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                {/* Contextual Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500 text-white shadow-2xs">
                      <Sliders className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs font-black text-white">
                        선택 공정 일괄 제어 (Batch Action)
                      </h4>
                      {selectedStepIndices.size > 0 && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-black bg-blue-500 text-white shadow-xs">
                          {selectedStepIndices.size}개 공정 선택됨
                        </span>
                      )}
                      {selectedEmptyPhaseIds.size > 0 && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-black bg-amber-400 text-slate-950 shadow-xs">
                          {selectedEmptyPhaseIds.size}개 빈 페이즈 선택됨
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions & Deselect Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {selectedEmptyPhaseIds.size > 0 && (
                      <button
                        type="button"
                        onClick={handleDeleteSelectedEmptyPhases}
                        className="px-2.5 py-1 text-[11px] bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-black transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>선택한 빈 페이즈 삭제 ({selectedEmptyPhaseIds.size}개)</span>
                      </button>
                    )}
                    {selectedStepIndices.size > 0 && (
                      <button
                        type="button"
                        onClick={handleBatchDeleteSelectedSteps}
                        className="px-2.5 py-1 text-[11px] bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg font-black transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>선택 공정 삭제 ({selectedStepIndices.size}개)</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="px-2.5 py-1 text-[11px] bg-white/15 hover:bg-white/25 text-white rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      <span>선택 해제</span>
                    </button>
                  </div>
                </div>

                {/* Batch Assignment Controls (when steps are selected) */}
                {selectedStepIndices.size > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                    {/* Machine Target */}
                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-200 mb-1 flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-blue-300" /> 일괄 지정 설비
                      </label>
                      <div className="text-slate-900">
                        <SearchableSelect
                          options={equipmentOptions}
                          value={batchMachine}
                          onChange={(val) => setBatchMachine(val)}
                          placeholder="적용할 설비 선택..."
                          icon={Cpu}
                        />
                      </div>
                    </div>

                    {/* Worker Target */}
                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-200 mb-1 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-300" /> 일괄 지정 담당자
                      </label>
                      <div className="text-slate-900">
                        <SearchableSelect
                          options={operatorOptions}
                          value={batchWorker}
                          onChange={(val) => setBatchWorker(val)}
                          placeholder="적용할 담당자 선택..."
                          icon={UserCheck}
                        />
                      </div>
                    </div>

                    {/* Duration Target */}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-200 mb-1">
                        소요시간 (선택)
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={batchDuration}
                          onChange={(e) => setBatchDuration(e.target.value)}
                          placeholder="시간(h)"
                          className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg font-mono font-bold bg-white text-slate-900 focus:ring-2 focus:ring-blue-400"
                        />
                        <span className="text-slate-300 font-bold text-[11px]">h</span>
                      </div>
                    </div>

                    {/* Apply Button */}
                    <div className="md:col-span-4 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleApplyBatchAssignment}
                        className="w-full py-2 px-3 rounded-lg text-xs font-black bg-blue-500 hover:bg-blue-400 text-white transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>선택 공정 설비/담당자 일괄 적용</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Batch Phase Migration Sub-row */}
                {selectedStepIndices.size > 0 && (
                  <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-200 font-bold">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-300" />
                      <span>선택 공정 일괄 구간(Phase) 이동:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={batchTargetPhase}
                        onChange={(e) => setBatchTargetPhase(e.target.value)}
                        className="text-xs px-2.5 py-1.5 border border-indigo-300 rounded-lg font-bold bg-white text-slate-900 focus:ring-2 focus:ring-indigo-400 cursor-pointer shadow-2xs"
                      >
                        {phases.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleBatchMoveStepsToPhase(batchTargetPhase)}
                        className="px-3 py-1.5 rounded-lg text-xs font-black bg-indigo-500 hover:bg-indigo-400 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      >
                        <MoveRight className="w-3.5 h-3.5" />
                        <span>선택 공정 구간 이동 실행</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Batch Success Message Toast */}
                {batchSuccessMessage && (
                  <div className="bg-emerald-500/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between animate-in fade-in duration-200">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                      {batchSuccessMessage}
                    </span>
                    <button
                      type="button"
                      onClick={() => setBatchSuccessMessage('')}
                      className="text-white/80 hover:text-white p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Standalone Success Message Toast when Contextual Bar is closed */}
            {batchSuccessMessage && selectedStepIndices.size === 0 && selectedEmptyPhaseIds.size === 0 && (
              <div className="bg-emerald-100 border border-emerald-300 text-emerald-950 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in duration-200 shadow-2xs">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {batchSuccessMessage}
                </span>
                <button
                  type="button"
                  onClick={() => setBatchSuccessMessage('')}
                  className="text-emerald-700 hover:text-emerald-900 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* PHASE-BASED ACCORDION LIST */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-3">
              {phaseGroups.map((group) => {
                const isExpanded = !!expandedPhases[group.id];
                const groupStepIndices = group.steps.map((s) => s.originalIndex);
                const isGroupEmpty = group.steps.length === 0;

                const allGroupSelected = isGroupEmpty
                  ? selectedEmptyPhaseIds.has(group.id)
                  : (groupStepIndices.length > 0 && groupStepIndices.every((idx) => selectedStepIndices.has(idx)));

                const someGroupSelected =
                  !isGroupEmpty &&
                  groupStepIndices.some((idx) => selectedStepIndices.has(idx)) &&
                  !allGroupSelected;

                return (
                  <div
                    key={group.id}
                    className={`bg-white border rounded-xl overflow-hidden shadow-2xs transition ${
                      group.matchingCount > 0 && routingSearchTerm
                        ? 'border-blue-300 ring-2 ring-blue-100'
                        : isGroupEmpty && selectedEmptyPhaseIds.has(group.id)
                        ? 'border-amber-400 ring-2 ring-amber-100'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Accordion Header */}
                    <div
                      className={`p-3.5 flex flex-wrap items-center justify-between gap-3 transition cursor-pointer select-none ${
                        isExpanded ? 'bg-slate-50/95 border-b border-slate-200' : 'bg-white hover:bg-slate-50/60'
                      }`}
                      onClick={() => togglePhase(group.id)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Group Selection Checkbox */}
                        <div
                          className="flex items-center p-1 hover:bg-blue-50 rounded cursor-pointer transition"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={allGroupSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someGroupSelected;
                            }}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleSelectGroup(group);
                            }}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                            title={isGroupEmpty ? '빈 Phase 구간 선택 (상단 일괄 제어 바에서 관리 및 삭제 가능)' : '소속 모든 공정 일괄 선택/해제'}
                          />
                        </div>

                        {/* Title & Badge */}
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base">{group.icon}</span>
                            <h4 className="text-xs sm:text-sm font-black text-slate-900">
                              {group.title}
                            </h4>
                            {/* Dynamic Sequence Range Badge (Only when steps exist) */}
                            {group.steps.length > 0 && (
                              <span className="font-mono text-[11px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                                {group.rangeText}
                              </span>
                            )}
                            {/* Dynamic Process Count Badge */}
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${group.badgeColor}`}>
                              {group.steps.length}개 공정
                            </span>
                            {group.matchingCount > 0 && routingSearchTerm && (
                              <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
                                🔍 {group.matchingCount}건 검색 일치
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 font-medium">
                            {group.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: Detailed Summary Metric Badges & Toggle Arrow */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Total Hours Badge */}
                        <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-700 font-mono">
                          총 {group.totalHours.toFixed(1)}h
                        </span>

                        {/* Machine Assignment Badge (only if has steps) */}
                        {group.steps.length > 0 && (
                          group.unassignedMachineCount === 0 ? (
                            <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-md text-[11px] font-extrabold flex items-center gap-1">
                              <Check className="w-3 h-3 text-indigo-600" />
                              <span>설비: {group.assignedMachineCount}/{group.steps.length} 완료</span>
                            </span>
                          ) : (
                            <span className="bg-amber-100 border border-amber-300 text-amber-950 px-2.5 py-1 rounded-md text-[11px] font-black flex items-center gap-1 shadow-2xs">
                              <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                              <span>설비: {group.assignedMachineCount}/{group.steps.length} ({group.unassignedMachineCount}대 미지정)</span>
                            </span>
                          )
                        )}

                        {/* Worker Assignment Badge (only if has steps) */}
                        {group.steps.length > 0 && (
                          group.unassignedWorkerCount === 0 ? (
                            <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-md text-[11px] font-extrabold flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>담당자: {group.assignedWorkerCount}/{group.steps.length} 완료</span>
                            </span>
                          ) : (
                            <span className="bg-rose-100 border border-rose-300 text-rose-950 px-2.5 py-1 rounded-md text-[11px] font-black flex items-center gap-1 shadow-2xs">
                              <AlertTriangle className="w-3 h-3 text-rose-700 shrink-0" />
                              <span>담당자: {group.assignedWorkerCount}/{group.steps.length} ({group.unassignedWorkerCount}명 미지정)</span>
                            </span>
                          )
                        )}

                        {/* Delete Phase Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentDef = phases.find((p) => p.id === group.id);
                            if (currentDef) handleRequestDeletePhase(currentDef);
                          }}
                          disabled={phases.length <= 1}
                          className={`p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer ${
                            phases.length <= 1 ? 'opacity-25 cursor-not-allowed' : ''
                          }`}
                          title={
                            phases.length <= 1
                              ? '최소 1개의 Phase 구간이 유지되어야 합니다'
                              : `'${group.title}' 구간 삭제`
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition ml-0.5">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Accordion Body: Compact Process Table */}
                    {isExpanded && (
                      <div className="p-0">
                        {group.steps.length === 0 ? (
                          <div className="py-12 px-6 text-center bg-white space-y-4">
                            <div className="text-slate-500 text-xs font-bold">
                              현재 이 Phase 구간에 등록된 공정이 없습니다. 아래 버튼을 눌러 공정을 직접 추가해보세요.
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                              <button
                                type="button"
                                onClick={() => handleAddProcessToPhase(group.id, '가공')}
                                className="px-3.5 py-2 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>가공 공정 추가</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddProcessToPhase(group.id, '연마')}
                                className="px-3.5 py-2 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>연마 공정 추가</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddProcessToPhase(group.id, '품질')}
                                className="px-3.5 py-2 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>품질검사 추가</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddProcessToPhase(group.id, '외주')}
                                className="px-3.5 py-2 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>외주/열처리 추가</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs min-w-[900px]">
                                <thead className="bg-slate-100/70 text-slate-600 font-extrabold border-b border-slate-200 text-[11px]">
                                  <tr>
                                    <th className="py-2 px-2.5 w-10 text-center">선택</th>
                                    <th className="py-2 px-2.5 w-12 text-center">순번</th>
                                    <th className="py-2 px-2.5 min-w-[200px]">공정명 (Process Step)</th>
                                    <th className="py-2 px-2.5 text-center w-28">공정 구분</th>
                                    <th className="py-2 px-2.5 text-center w-20">시간(h)</th>
                                    <th className="py-2 px-2.5 min-w-[200px]">담당 설비 지정</th>
                                    <th className="py-2 px-2.5 min-w-[200px]">공정 담당자 지정</th>
                                    <th className="py-2 px-2.5 min-w-[130px] text-center">구간(Phase) 이동</th>
                                    <th className="py-2 px-2.5 text-center w-20">순서/삭제</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-800 font-semibold">
                                  {group.steps.map(({ proc, originalIndex: idx }) => {
                                    const isSelected = selectedStepIndices.has(idx);
                                    const assign = stepAssignments[idx] || { machine: '', worker: '' };
                                    const machineBusy = assign.machine ? busyMachinesMap.get(assign.machine) : undefined;
                                    const workerBusy = assign.worker ? busyWorkersMap.get(assign.worker.trim()) : undefined;

                                    const isSearchMatched =
                                      routingSearchTerm.trim() !== '' &&
                                      (proc.name.toLowerCase().includes(routingSearchTerm.toLowerCase()) ||
                                        proc.category.toLowerCase().includes(routingSearchTerm.toLowerCase()) ||
                                        (assign.machine && assign.machine.toLowerCase().includes(routingSearchTerm.toLowerCase())) ||
                                        (assign.worker && assign.worker.toLowerCase().includes(routingSearchTerm.toLowerCase())));

                                    return (
                                      <tr
                                        key={proc.id || idx}
                                        className={`transition ${
                                          isSelected
                                            ? 'bg-blue-50/70 hover:bg-blue-50'
                                            : isSearchMatched
                                            ? 'bg-amber-50/60 hover:bg-amber-50 border-l-4 border-amber-400'
                                            : 'hover:bg-slate-50/80'
                                        }`}
                                      >
                                        {/* Selection Checkbox */}
                                        <td className="py-1.5 px-2.5 text-center">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleToggleSelectStep(idx)}
                                            className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                          />
                                        </td>

                                        {/* Step Number */}
                                        <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-500 text-[11px]">
                                          #{String(idx + 1).padStart(2, '0')}
                                        </td>

                                        {/* Process Name (Editable) */}
                                        <td className="py-1.5 px-2">
                                          <input
                                            type="text"
                                            value={proc.name}
                                            onChange={(e) => handleUpdateProcessField(idx, 'name', e.target.value)}
                                            placeholder="공정명 입력"
                                            className={`w-full text-xs px-2 py-1 border rounded-md font-bold text-slate-900 bg-white ${
                                              isSearchMatched
                                                ? 'border-amber-400 ring-1 ring-amber-300'
                                                : 'border-slate-200 hover:border-slate-400 focus:border-blue-500'
                                            }`}
                                          />
                                        </td>

                                        {/* Category Dropdown */}
                                        <td className="py-1.5 px-2 text-center">
                                          <select
                                            value={proc.category}
                                            onChange={(e) => handleUpdateProcessField(idx, 'category', e.target.value as ProcessCategory)}
                                            className={`text-[10px] px-2 py-1 border rounded-md font-black cursor-pointer ${
                                              proc.category === '가공'
                                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                                : proc.category === '연마'
                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                : proc.category === '품질'
                                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                                : 'bg-amber-50 text-amber-800 border-amber-200'
                                            }`}
                                          >
                                            <option value="가공">가공 (MCT)</option>
                                            <option value="연마">연마 (Grinder)</option>
                                            <option value="품질">품질 (CMM)</option>
                                            <option value="외주">외주 (협력사)</option>
                                          </select>
                                        </td>

                                        {/* Duration Hours (Editable) */}
                                        <td className="py-1.5 px-2 text-center">
                                          <input
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            value={proc.durationHours}
                                            onChange={(e) => handleUpdateProcessField(idx, 'durationHours', parseFloat(e.target.value) || 0.1)}
                                            className="w-14 text-center text-xs px-1 py-1 border border-slate-200 rounded-md font-mono font-bold text-slate-900 bg-white"
                                          />
                                        </td>

                                        {/* Machine Select with Real-Time Conflict Warning */}
                                        <td className="py-1.5 px-2">
                                          <div className="space-y-0.5">
                                            <SearchableSelect
                                              options={equipmentOptions}
                                              value={assign.machine}
                                              onChange={(val) => handleStepMachineChange(idx, val)}
                                              placeholder="담당 설비 검색/선택"
                                              icon={Cpu}
                                            />
                                            {machineBusy && (
                                              <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-1 shadow-2xs animate-pulse">
                                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                                <span className="truncate">
                                                  가동중: [{machineBusy.orderName}] #{machineBusy.productNo}호기 {machineBusy.processName}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </td>

                                        {/* Operator Select with Real-Time Conflict Warning */}
                                        <td className="py-1.5 px-2">
                                          <div className="space-y-0.5">
                                            <SearchableSelect
                                              options={operatorOptions}
                                              value={assign.worker}
                                              onChange={(val) => handleStepWorkerChange(idx, val)}
                                              placeholder="공정 담당자 검색/선택"
                                              icon={UserCheck}
                                            />
                                            {workerBusy && (
                                              <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-1 shadow-2xs animate-pulse">
                                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                                <span className="truncate">
                                                  작업중: [{workerBusy.orderName}] #{workerBusy.productNo}호기
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </td>

                                        {/* Step Phase Migration Dropdown */}
                                        <td className="py-1.5 px-2 text-center">
                                          <select
                                            value={proc.phaseId || group.id}
                                            onChange={(e) => handleMoveStepToPhase(idx, e.target.value)}
                                            className="text-[10px] px-1.5 py-1 border border-indigo-200 rounded-md font-bold bg-indigo-50/50 text-indigo-900 hover:bg-indigo-50 cursor-pointer shadow-2xs"
                                            title="다른 Phase 구간으로 공정 이동"
                                          >
                                            {phases.map((p) => (
                                              <option key={p.id} value={p.id}>
                                                {p.name}
                                              </option>
                                            ))}
                                          </select>
                                        </td>

                                        {/* Action: Move up/down / Delete */}
                                        <td className="py-1.5 px-2 text-center">
                                          <div className="flex items-center justify-center gap-0.5">
                                            <button
                                              type="button"
                                              onClick={() => handleMoveProcess(idx, 'up')}
                                              disabled={idx === 0}
                                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded hover:bg-slate-100 transition cursor-pointer"
                                              title="위로 이동"
                                            >
                                              <ArrowUp className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleMoveProcess(idx, 'down')}
                                              disabled={idx === currentProcesses.length - 1}
                                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded hover:bg-slate-100 transition cursor-pointer"
                                              title="아래로 이동"
                                            >
                                              <ArrowDown className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveProcess(idx)}
                                              className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 transition cursor-pointer ml-0.5"
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

                            {/* Phase Footer Main Add Buttons Bar */}
                            <div className="bg-slate-50/80 border-t border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2.5">
                              <span className="text-xs text-slate-600 font-extrabold flex items-center gap-1">
                                <span>{group.title} 공정 추가:</span>
                              </span>
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAddProcessToPhase(group.id, '가공')}
                                  className="px-3 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>가공 공정 추가</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddProcessToPhase(group.id, '연마')}
                                  className="px-3 py-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>연마 공정 추가</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddProcessToPhase(group.id, '품질')}
                                  className="px-3 py-1.5 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>품질검사 추가</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddProcessToPhase(group.id, '외주')}
                                  className="px-3 py-1.5 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>외주/열처리 추가</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
                <div className="p-2 rounded-xl bg-[#FFF9EB] text-[#B45309] border border-[#FCD34D] shadow-2xs">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>완료 보관함 공정/설비/담당자 사양 복사</span>
                    <span className="bg-[#FFF9EB] text-[#B45309] text-[10px] px-2 py-0.5 rounded-full font-extrabold border border-[#FCD34D] shadow-2xs">
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

      {/* ------------------------------------------------------------- */}
      {/* ADD NEW PHASE MODAL */}
      {/* ------------------------------------------------------------- */}
      {isAddPhaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
                  <FolderPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">새로운 Phase 공정 구간 추가</h3>
                  <p className="text-[11px] text-blue-100">
                    현재 {phases.length}개 구간 ➔ [Phase {phases.length + 1}] 신규 구간 생성
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPhaseModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateNewPhase} className="p-5 space-y-4">
              {/* Quick Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-blue-600" /> 빠른 추천 프리셋 적용
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUICK_PHASE_PRESETS.map((preset, pIdx) => {
                    const isSelected = newPhaseTitle === preset.titleSuffix;
                    return (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          setNewPhaseTitle(preset.titleSuffix);
                          setNewPhaseDesc(preset.defaultDesc);
                          setNewPhaseIcon(preset.icon);
                          setNewPhaseColor(preset.badgeColor);
                        }}
                        className={`text-left p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-2.5 group ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/90 ring-1.5 ring-blue-400 shadow-xs'
                            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 bg-white'
                        }`}
                      >
                        <span className="text-lg p-1.5 bg-slate-50 rounded-lg border border-slate-100 group-hover:scale-110 transition shrink-0">
                          {preset.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className={`text-xs font-bold truncate ${isSelected ? 'text-blue-800' : 'text-slate-800 group-hover:text-blue-700'}`}>
                            {preset.titleSuffix}
                          </div>
                          <div className="text-[10px] text-slate-500 line-clamp-1">{preset.defaultDesc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Phase Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  페이즈 공정 명칭 *
                </label>
                <input
                  type="text"
                  value={newPhaseTitle}
                  onChange={(e) => setNewPhaseTitle(e.target.value)}
                  placeholder="예: 정밀 방전(EDM) 및 미세 홀 가공"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Phase Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  공정 상세 설명 및 가공 요건
                </label>
                <input
                  type="text"
                  value={newPhaseDesc}
                  onChange={(e) => setNewPhaseDesc(e.target.value)}
                  placeholder="예: 와이어 컷팅, 방전 가공 및 미세 노즐 홀 형성 작업"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Icon & Color Selector */}
              <div className="grid grid-cols-2 gap-3">
                {/* Icon Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">아이콘</label>
                  <div className="flex flex-wrap gap-1">
                    {['🔥', '⚙️', '🔘', '💧', '🔬', '📦', '🔍', '🧪', '💎', '🛠️', '🛡️'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewPhaseIcon(emoji)}
                        className={`w-8 h-8 rounded-lg text-base flex items-center justify-center border transition cursor-pointer ${
                          newPhaseIcon === emoji
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Theme Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-slate-500" /> 뱃지 테마 색상
                  </label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { label: '블루', color: 'bg-blue-100 text-blue-900 border-blue-300', dot: 'bg-blue-600' },
                      { label: '에메랄드', color: 'bg-emerald-100 text-emerald-900 border-emerald-300', dot: 'bg-emerald-600' },
                      { label: '퍼플', color: 'bg-purple-100 text-purple-900 border-purple-300', dot: 'bg-purple-600' },
                      { label: '엠버', color: 'bg-amber-100 text-amber-900 border-amber-300', dot: 'bg-amber-600' },
                      { label: '로즈', color: 'bg-rose-100 text-rose-900 border-rose-300', dot: 'bg-rose-600' },
                      { label: '청록', color: 'bg-teal-100 text-teal-900 border-teal-300', dot: 'bg-teal-600' },
                    ].map((c) => (
                      <button
                        key={c.label}
                        type="button"
                        onClick={() => setNewPhaseColor(c.color)}
                        className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition cursor-pointer ${
                          newPhaseColor === c.color ? 'ring-2 ring-blue-500 font-black' : 'opacity-80 hover:opacity-100'
                        } ${c.color}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex justify-end items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPhaseModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Phase 구간 생성 완료</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DELETE PHASE SAFETY MODAL */}
      {/* ------------------------------------------------------------- */}
      {deletePhaseTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-rose-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-rose-600 to-red-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">공정 구간(Phase) 삭제 확인</h3>
                  <p className="text-[11px] text-rose-100">
                    '{deletePhaseTarget.phase.name}' 삭제 요청
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeletePhaseTarget(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-1">
                <div className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>구간 내에 {deletePhaseTarget.stepsCount}개의 세부 공정이 소속되어 있습니다.</span>
                </div>
                <p className="text-[11px] text-rose-700 pl-5 leading-relaxed">
                  소속된 공정들을 인접 Phase 구간으로 안전하게 이동시킨 후 구간을 삭제할지, 또는 공정까지 함께 삭제할지 선택해주세요.
                </p>
              </div>

              {/* Option 1: Safe Migration (Recommended) */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-2.5">
                <div className="text-xs font-black text-blue-900 flex items-center justify-between">
                  <span>1. 다른 Phase 구간으로 공정 안전 이동 후 삭제 (권장)</span>
                  <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                    데이터 보존
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-600 font-bold shrink-0">이동 대상 구간:</span>
                  <select
                    value={deleteTargetPhaseId}
                    onChange={(e) => setDeleteTargetPhaseId(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-blue-300 rounded-lg font-bold bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                <button
                  type="button"
                  onClick={executeMigrateStepsAndDeletePhase}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>공정 {deletePhaseTarget.stepsCount}개 일괄 이동 후 구간 삭제</span>
                </button>
              </div>

              {/* Option 2: Delete Everything */}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={executeDeletePhaseAndAllSteps}
                  className="w-full py-2 bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 hover:text-rose-800 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>소속 공정 {deletePhaseTarget.stepsCount}개도 함께 영구 삭제</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeletePhaseTarget(null)}
                  className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition cursor-pointer"
                >
                  취소하고 돌아가기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CREATION SUCCESS MODAL WITH PROCESS TRAVELER PRINT SHORTCUT   */}
      {/* ------------------------------------------------------------- */}
      {showCreatedOrderModal && createdOrderForTraveler && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-emerald-500 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base flex items-center gap-2">
                    <span>🎉 신규 수주가 성공적으로 등록되었습니다!</span>
                  </h3>
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
                  setIsPostCreateTravelerOpen(false);
                }}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>데이터베이스(Firestore) 및 공정 타임라인에 실시간 저장 동기화가 완료되었습니다.</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">수주명 / 프로젝트:</span>
                  <span className="font-extrabold text-slate-900">{createdOrderForTraveler.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">고객사 / 발주번호(PO):</span>
                  <span className="font-bold text-slate-900">
                    {createdOrderForTraveler.customer || '미지정'} / {createdOrderForTraveler.poNumber || createdOrderForTraveler.id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">품목 / 규격 / 수량:</span>
                  <span className="font-bold text-slate-900">
                    {createdOrderForTraveler.partType || 'UPPER'} ({createdOrderForTraveler.spec || '-'}) | <strong className="text-blue-700 font-black">{createdOrderForTraveler.qty}개</strong>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">공정 구성 (BOP):</span>
                  <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    총 {createdOrderForTraveler.customProcesses?.length || 0}단계 라우팅 구성 완료
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">생산 시작일 / 납기일:</span>
                  <span className="font-mono text-slate-700 font-bold">
                    {createdOrderForTraveler.startDate?.split('T')[0] || '-'} ~ {createdOrderForTraveler.dueDate || '미지정'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                신규 수주가 생산관리 타임라인과 설비 가동판(OEE)에 즉시 배치되었습니다. 현장 작업용 <strong>공식 공정 이동표(Process Traveler)</strong>를 즉시 인쇄(A4)하거나 등록 작업을 계속할 수 있습니다.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreatedOrderModal(false);
                    setCreatedOrderForTraveler(null);
                    setIsPostCreateTravelerOpen(false);
                  }}
                  className="w-full sm:w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-500" />
                  <span>확인 (신규 등록 계속)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreatedOrderModal(false);
                    setIsPostCreateTravelerOpen(true);
                  }}
                  className="w-full sm:w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>공정 이동표 즉시 인쇄 (A4)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PROCESS TRAVELER MODALS (PREVIEW & POST-CREATION)             */}
      {/* ------------------------------------------------------------- */}
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
    </div>
  );
};
