import React, { useState, useMemo } from 'react';
import {
  ScheduledTaskItem,
  ProcessProgressItem,
  User,
  Order,
  OrderStatus
} from '../types';
import { ALL_EQUIPMENT_LIST } from '../data/defaultData';
import { CalendarTaskDetailModal } from './CalendarTaskDetailModal';
import {
  getBaseWorkerName,
  getDepartmentSuffix,
  isValidRegisteredOperatorUser,
  extractFieldOperatorObjects
} from '../utils/operatorHelper';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Pause,
  Download,
  Search,
  Filter,
  Layers,
  FileText,
  User as UserIcon,
  Cpu,
  ArrowUpDown,
  RefreshCw,
  FileSpreadsheet,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  MinusSquare,
  Calendar,
  Sparkles,
  List,
  Workflow
} from 'lucide-react';
import { OrderProcessFlowDiagram } from './routing/OrderProcessFlowDiagram';
import { parseComponentTag } from '../utils/trackDependencyHelper';

interface ActualAnalysisViewProps {
  scheduledTasks: ScheduledTaskItem[];
  orders: Record<string, Order>;
  productTypes?: Record<string, import('../types').ProductType>;
  processProgressMap: import('../types').ProcessProgressMap;
  onUpdateProgress: (processKey: string, progress: ProcessProgressItem) => void;
  onUpdateOrder?: (updatedOrder: Order) => void;
  currentUser?: User | null;
  approvedOperators?: string[];
  usersList?: User[];
}

export const ActualAnalysisView: React.FC<ActualAnalysisViewProps> = ({
  scheduledTasks,
  orders,
  productTypes = {},
  processProgressMap,
  onUpdateProgress,
  onUpdateOrder,
  currentUser,
  approvedOperators = [],
  usersList = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [varianceFilter, setVarianceFilter] = useState<string>('ALL'); // ALL, DELAYED, ADVANCED, ON_TIME
  const [machineFilter, setMachineFilter] = useState<string>('ALL');
  const [workerFilter, setWorkerFilter] = useState<string>('ALL');
  const [orderFilter, setOrderFilter] = useState<string>('ALL');

  const [selectedTask, setSelectedTask] = useState<ScheduledTaskItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // CSV Export Scope Modal states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedExportOrderId, setSelectedExportOrderId] = useState<string>('');
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  // 1단계 & 2단계: 프로젝트 단위 아코디언, 뷰 모드(리스트 vs 흐름도) 및 체크박스 상태
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [projectViewModes, setProjectViewModes] = useState<Record<string, 'LIST' | 'FLOW'>>({});
  const [selectedProcesses, setSelectedProcesses] = useState<Record<string, string[]>>({}); // projectKey -> string[] of processKeys
  const [unitFilters, setUnitFilters] = useState<Record<string, number | 'ALL'>>({}); // projectKey -> number | 'ALL'

  const currentSelectedTask = useMemo(() => {
    if (!selectedTask) return null;
    return scheduledTasks.find((t) => t.processKey === selectedTask.processKey) || selectedTask;
  }, [scheduledTasks, selectedTask]);

  // Format Date Helper
  const formatDateTime = (dateVal: Date | string | null | undefined, includeYear = false): string => {
    if (!dateVal) return '-';
    const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
    if (isNaN(d.getTime())) return '-';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    if (includeYear) {
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    }
    return `${mm}/${dd} ${hh}:${min}`;
  };

  // Calculations for analysis
  const tasksAnalysis = useMemo(() => {
    return scheduledTasks.map((t) => {
      const plannedMins = t.plannedMinutes;
      const actualMins = t.actualMinutes !== null && t.actualMinutes !== undefined ? t.actualMinutes : null;
      const pauseTotal = (t.pauseHistory || []).reduce((acc, p) => acc + (p.durationMinutes || 0), 0);

      let varianceMins = 0;
      let varianceType: 'DELAYED' | 'ADVANCED' | 'ON_TIME' | 'PENDING' = 'PENDING';

      if (actualMins !== null && actualMins > 0) {
        varianceMins = actualMins - plannedMins;
        if (varianceMins > 0) varianceType = 'DELAYED';
        else if (varianceMins < 0) varianceType = 'ADVANCED';
        else varianceType = 'ON_TIME';
      } else if (t.status === 'DELAYED') {
        varianceType = 'DELAYED';
      }

      const efficiencyRate =
        actualMins && actualMins > 0
          ? Math.round((plannedMins / actualMins) * 100)
          : null;

      return {
        ...t,
        plannedMins,
        actualMins,
        pauseTotal,
        varianceMins,
        varianceType,
        efficiencyRate,
      };
    });
  }, [scheduledTasks]);

  // Unique Orders list for filtering and scoped export
  const uniqueOrders = useMemo(() => {
    const map = new Map<string, { orderId: string; orderName: string; count: number }>();
    tasksAnalysis.forEach((t) => {
      if (!map.has(t.orderId)) {
        map.set(t.orderId, { orderId: t.orderId, orderName: t.orderName, count: 0 });
      }
      map.get(t.orderId)!.count += 1;
    });
    return Array.from(map.values()).sort((a, b) => a.orderId.localeCompare(b.orderId));
  }, [tasksAnalysis]);

  // Dynamically filter field operators (가공팀, 연마팀, 품질팀) from usersList (Source of Truth)
  // Strictly excludes: 영업팀, 경영진, 생산관리, 시스템 관리자 using centralized operatorHelper utility
  const fieldOperators = useMemo(() => {
    return extractFieldOperatorObjects(usersList, approvedOperators);
  }, [usersList, approvedOperators]);

  // Overall KPI Metrics
  const kpis = useMemo(() => {
    const total = tasksAnalysis.length;
    const completed = tasksAnalysis.filter((t) => t.isCompleted);
    const inProgress = tasksAnalysis.filter((t) => t.status === 'IN_PROGRESS');
    const paused = tasksAnalysis.filter((t) => t.status === 'PAUSED');
    const delayed = tasksAnalysis.filter((t) => t.varianceType === 'DELAYED' || t.status === 'DELAYED');

    const totalPlannedMins = tasksAnalysis.reduce((acc, t) => acc + t.plannedMins, 0);
    const completedPlannedMins = completed.reduce((acc, t) => acc + t.plannedMins, 0);
    const completedActualMins = completed.reduce((acc, t) => acc + (t.actualMins || t.plannedMins), 0);
    const totalPauseMins = tasksAnalysis.reduce((acc, t) => acc + t.pauseTotal, 0);

    const netVariance = completedActualMins - completedPlannedMins;
    const overallEfficiency =
      completedActualMins > 0 ? Math.round((completedPlannedMins / completedActualMins) * 100) : 100;

    return {
      total,
      completedCount: completed.length,
      inProgressCount: inProgress.length,
      pausedCount: paused.length,
      delayedCount: delayed.length,
      completionRate: total > 0 ? Math.round((completed.length / total) * 100) : 0,
      totalPlannedHours: (totalPlannedMins / 60).toFixed(1),
      completedActualHours: (completedActualMins / 60).toFixed(1),
      netVarianceMins: netVariance,
      totalPauseMins,
      overallEfficiency,
    };
  }, [tasksAnalysis]);

  // Filtered List
  const filteredList = useMemo(() => {
    return tasksAnalysis.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const m1 = t.orderName.toLowerCase().includes(q);
        const m2 = t.orderId.toLowerCase().includes(q);
        const m3 = t.groupName.toLowerCase().includes(q);
        const m4 = (t.worker || '').toLowerCase().includes(q);
        const m5 = (t.machine || '').toLowerCase().includes(q);
        if (!m1 && !m2 && !m3 && !m4 && !m5) return false;
      }

      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (varianceFilter !== 'ALL' && t.varianceType !== varianceFilter) return false;
      if (machineFilter !== 'ALL' && t.machine !== machineFilter) return false;
      if (orderFilter !== 'ALL' && t.orderId !== orderFilter) return false;

      // Match worker with both displayName ("박세령 (가공)") and baseName ("박세령")
      if (workerFilter !== 'ALL') {
        const baseSelected = getBaseWorkerName(workerFilter);
        const taskWorker = t.worker || '';
        const baseTaskWorker = getBaseWorkerName(taskWorker);
        const matches =
          taskWorker === workerFilter ||
          baseTaskWorker === baseSelected ||
          taskWorker.includes(baseSelected);
        if (!matches) return false;
      }

      return true;
    });
  }, [tasksAnalysis, searchQuery, statusFilter, varianceFilter, machineFilter, workerFilter, orderFilter]);

  // Robust CSV Exporter using Blob and UTF-8 BOM
  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/\r\n/g, ' ').replace(/[\r\n]/g, ' ');
    return `"${str.replace(/"/g, '""')}"`;
  };

  const generateCsvContent = (items: typeof tasksAnalysis) => {
    const headers = [
      '수주번호',
      '수주명',
      '호기',
      '공정순서',
      '공정명',
      '카테고리',
      '계획시작',
      '계획종료',
      '계획시간(분)',
      '실제시작',
      '실제종료',
      '실제작업시간(분)',
      '일시정지(분)',
      '시간차이(분)',
      '상태',
      '작업자',
      '설비',
      '일시정지사유',
      '지연사유',
      '메모'
    ];

    const rows = items.map((t) => {
      const pauseReasons =
        t.pauseReason ||
        (t.pauseHistory && t.pauseHistory.length > 0
          ? t.pauseHistory.map((p) => p.reason).filter(Boolean).join(' / ')
          : '');

      return [
        escapeCsv(t.orderId),
        escapeCsv(t.orderName),
        escapeCsv(`${t.productNo}호기`),
        t.processIndex + 1,
        escapeCsv(t.groupName),
        escapeCsv(t.category),
        escapeCsv(formatDateTime(t.plannedStart, true)),
        escapeCsv(formatDateTime(t.plannedEnd, true)),
        t.plannedMins,
        escapeCsv(t.actualStart ? formatDateTime(t.actualStart, true) : '미착수'),
        escapeCsv(t.actualEnd ? formatDateTime(t.actualEnd, true) : (t.actualStart ? '진행중' : '-')),
        t.actualMins !== null && t.actualMins !== undefined ? t.actualMins : '',
        t.pauseTotal || 0,
        t.actualMins !== null && t.actualMins !== undefined ? t.varianceMins : (t.status === 'DELAYED' ? '지연' : 0),
        escapeCsv(t.status),
        escapeCsv(t.worker || '미지정'),
        escapeCsv(t.machine || '미지정'),
        escapeCsv(pauseReasons),
        escapeCsv(t.delayReason || ''),
        escapeCsv(t.memo || '')
      ].join(',');
    });

    return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  };

  const triggerDownload = (csvData: string, filename: string) => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleExportCSV = (scope: 'FILTERED' | 'ALL' | 'ORDER', targetOrderId?: string) => {
    let exportItems = filteredList;
    let filename = `공정분석_리포트_${new Date().toISOString().slice(0, 10)}.csv`;

    if (scope === 'ALL') {
      exportItems = tasksAnalysis;
      filename = `공정분석_전체수주_${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (scope === 'ORDER') {
      const ordId =
        targetOrderId ||
        selectedExportOrderId ||
        (orderFilter !== 'ALL' ? orderFilter : uniqueOrders[0]?.orderId);

      if (!ordId) {
        alert('내보낼 수주를 선택해 주세요.');
        return;
      }
      exportItems = tasksAnalysis.filter((t) => t.orderId === ordId);
      const ordName = exportItems[0]?.orderName || ordId;
      filename = `공정분석_${ordId}_${ordName.replace(/[/\\?%*:|"<>]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    }

    if (exportItems.length === 0) {
      alert('내보낼 공정 실적 데이터가 없습니다.');
      return;
    }

    const csvData = generateCsvContent(exportItems);
    triggerDownload(csvData, filename);

    setDownloadSuccessToast(
      `${filename} 파일 다운로드가 완료되었습니다. (${exportItems.length}개 공정 행)`
    );
    setTimeout(() => setDownloadSuccessToast(null), 4000);
    setIsExportModalOpen(false);
  };

  // 1단계 & 2단계: 수주(Order / 프로젝트) 단위 그룹 인터페이스
  interface ProjectAnalysisGroup {
    projectKey: string;
    orderId: string;
    quantity: number;
    productNos: number[];
    orderName: string;
    pjtNo: string;
    pjtName: string;
    partName: string;
    customer: string;
    dueDate: string;
    allTasks: typeof tasksAnalysis;
    matchingTasks: typeof tasksAnalysis;
    totalCount: number;
    completedCount: number;
    inProgressCount: number;
    delayedCount: number;
    pausedCount: number;
    readyCount: number;
    completionRate: number;
    totalPlannedHours: string;
    completedActualHours: string;
    netVarianceMins: number;
    hasDelay: boolean;
  }

  const projectGroups = useMemo<ProjectAnalysisGroup[]>(() => {
    const map = new Map<string, ProjectAnalysisGroup>();

    tasksAnalysis.forEach((t) => {
      const pKey = t.orderId;
      if (!map.has(pKey)) {
        const orderInfo = orders[t.orderId];
        map.set(pKey, {
          projectKey: pKey,
          orderId: t.orderId,
          quantity: orderInfo?.qty || 1,
          productNos: [],
          orderName: t.orderName,
          pjtNo: orderInfo?.pjtNo || t.orderId,
          pjtName: orderInfo?.pjtName || orderInfo?.name || t.orderName,
          partName: orderInfo?.partName || t.orderName,
          customer: orderInfo?.customer || '',
          dueDate: orderInfo?.dueDate || '',
          allTasks: [],
          matchingTasks: [],
          totalCount: 0,
          completedCount: 0,
          inProgressCount: 0,
          delayedCount: 0,
          pausedCount: 0,
          readyCount: 0,
          completionRate: 0,
          totalPlannedHours: '0',
          completedActualHours: '0',
          netVarianceMins: 0,
          hasDelay: false
        });
      }

      const group = map.get(pKey)!;
      group.allTasks.push(t);
      if (!group.productNos.includes(t.productNo)) {
        group.productNos.push(t.productNo);
      }
    });

    const filteredKeys = new Set(filteredList.map((f) => f.processKey));

    map.forEach((group) => {
      group.productNos.sort((a, b) => a - b);
      group.quantity = Math.max(group.quantity, group.productNos.length);

      group.matchingTasks = group.allTasks.filter((t) => filteredKeys.has(t.processKey));
      // 정렬: 호기 오름차순, 공정순서 오름차순
      group.allTasks.sort((a, b) => a.productNo - b.productNo || a.processIndex - b.processIndex);
      group.matchingTasks.sort((a, b) => a.productNo - b.productNo || a.processIndex - b.processIndex);

      group.totalCount = group.allTasks.length;
      group.completedCount = group.allTasks.filter((t) => t.status === 'COMPLETED').length;
      group.inProgressCount = group.allTasks.filter((t) => t.status === 'IN_PROGRESS').length;
      group.delayedCount = group.allTasks.filter((t) => t.status === 'DELAYED' || t.varianceType === 'DELAYED').length;
      group.pausedCount = group.allTasks.filter((t) => t.status === 'PAUSED').length;
      group.readyCount = group.allTasks.filter((t) => t.status === 'READY' || t.status === 'PLANNED' || t.status === 'DISPATCHED').length;
      group.completionRate = group.totalCount > 0 ? Math.round((group.completedCount / group.totalCount) * 100) : 0;
      group.hasDelay = group.delayedCount > 0;

      const plannedMins = group.allTasks.reduce((acc, t) => acc + (t.plannedMins || 0), 0);
      const actualMins = group.allTasks.reduce((acc, t) => acc + (t.actualMins || 0), 0);
      group.totalPlannedHours = (plannedMins / 60).toFixed(1);
      group.completedActualHours = (actualMins / 60).toFixed(1);
      group.netVarianceMins = group.allTasks.reduce((acc, t) => acc + (t.varianceMins || 0), 0);
    });

    return Array.from(map.values()).sort((a, b) => {
      return a.orderId.localeCompare(b.orderId);
    });
  }, [tasksAnalysis, filteredList, orders]);

  // Projects to display based on active filters
  const visibleProjects = useMemo(() => {
    const isFilterActive =
      searchQuery.trim() !== '' ||
      statusFilter !== 'ALL' ||
      varianceFilter !== 'ALL' ||
      machineFilter !== 'ALL' ||
      workerFilter !== 'ALL' ||
      orderFilter !== 'ALL';

    if (!isFilterActive) return projectGroups;
    return projectGroups.filter((g) => g.matchingTasks.length > 0);
  }, [projectGroups, searchQuery, statusFilter, varianceFilter, machineFilter, workerFilter, orderFilter]);

  // Accordion Expand / Collapse
  const toggleProjectExpand = (projectKey: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectKey]: !prev[projectKey]
    }));
  };

  const expandAllProjects = () => {
    const next: Record<string, boolean> = {};
    visibleProjects.forEach((p) => {
      next[p.projectKey] = true;
    });
    setExpandedProjects(next);
  };

  const collapseAllProjects = () => {
    setExpandedProjects({});
  };

  // Checkbox Selection
  const toggleProcessSelect = (projectKey: string, processKey: string) => {
    setSelectedProcesses((prev) => {
      const current = prev[projectKey] || [];
      const exists = current.includes(processKey);
      const updated = exists ? current.filter((k) => k !== processKey) : [...current, processKey];
      return {
        ...prev,
        [projectKey]: updated
      };
    });
  };

  const toggleSelectAllInProject = (projectKey: string, tasksToSelect: typeof tasksAnalysis) => {
    setSelectedProcesses((prev) => {
      const current = prev[projectKey] || [];
      const allKeys = tasksToSelect.map((t) => t.processKey);
      const allSelected = allKeys.length > 0 && allKeys.every((k) => current.includes(k));
      return {
        ...prev,
        [projectKey]: allSelected ? [] : allKeys
      };
    });
  };

  // Export selected processes in project
  const handleExportSelectedProcesses = (project: ProjectAnalysisGroup) => {
    const selectedKeys = selectedProcesses[project.projectKey] || [];
    if (selectedKeys.length === 0) {
      alert('내보낼 공정을 하나 이상 선택해 주세요.');
      return;
    }
    const selectedTasks = project.allTasks.filter((t) => selectedKeys.includes(t.processKey));
    const filename = `공정분석_선택_${project.orderId}_${project.orderName.replace(/[/\\?%*:|"<>]/g, '_')}_${selectedTasks.length}건_${new Date().toISOString().slice(0, 10)}.csv`;
    const csvContent = generateCsvContent(selectedTasks);
    triggerDownload(csvContent, filename);
    setDownloadSuccessToast(
      `[${project.orderId}] 선택된 ${selectedTasks.length}개 공정이 CSV로 다운로드되었습니다.`
    );
    setTimeout(() => setDownloadSuccessToast(null), 4000);
  };

  // Export entire project
  const handleExportProjectAll = (project: ProjectAnalysisGroup) => {
    const filename = `공정분석_${project.orderId}_${project.orderName.replace(/[/\\?%*:|"<>]/g, '_')}_전체${project.totalCount}건_${new Date().toISOString().slice(0, 10)}.csv`;
    const csvContent = generateCsvContent(project.allTasks);
    triggerDownload(csvContent, filename);
    setDownloadSuccessToast(
      `[${project.orderId}] 전체 ${project.totalCount}개 공정이 CSV로 다운로드되었습니다.`
    );
    setTimeout(() => setDownloadSuccessToast(null), 4000);
  };

  return (
    <div className="w-full flex-1 flex flex-col space-y-6 pb-28">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-sm">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              공정 분석
            </h1>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              계획 대비 실적 분석 (Plan vs. Actual Analysis)
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              표준 공정 계획 시간 대비 실제 현장 소요시간, 일시정지 이력, 지연 원인을 정밀 추적합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Filtered Export Button */}
          <button
            onClick={() => handleExportCSV('FILTERED')}
            className="px-4 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="현재 화면에 필터링되어 표시 중인 전체 공정 실적을 CSV 파일로 다운로드합니다."
          >
            <Download className="w-4 h-4" />
            <span>분석 리포트 CSV 내보내기 ({filteredList.length}건)</span>
          </button>

          {/* Export Range Selector Button */}
          <button
            onClick={() => {
              if (orderFilter !== 'ALL') {
                setSelectedExportOrderId(orderFilter);
              } else if (uniqueOrders.length > 0) {
                setSelectedExportOrderId(uniqueOrders[0].orderId);
              }
              setIsExportModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-bold bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="전체 수주 또는 특정 수주 지정 내보내기"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>범위 선택</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Total & Completion */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-extrabold">전체 공정 완료율</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {kpis.completionRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-bold">
            {kpis.completedCount} / {kpis.total} 건 완료
          </div>
        </div>

        {/* Card 2: Live In Progress */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-extrabold">현재 진행중 공정</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400">
            {kpis.inProgressCount} 건
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-bold">
            일시정지: {kpis.pausedCount}건
          </div>
        </div>

        {/* Card 3: Delayed Tasks */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-extrabold">지연 발생 공정</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400">
            {kpis.delayedCount} 건
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-bold">
            표준시간 초과 및 기한 지연
          </div>
        </div>

        {/* Card 4: Overall Efficiency */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-extrabold">공정 표준 달성도</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400">
            {kpis.overallEfficiency}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-bold">
            (계획소요 / 실제소요)
          </div>
        </div>

        {/* Card 5: Net Variance */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-extrabold">순 소요시간 차이</span>
            {kpis.netVarianceMins > 0 ? (
              <TrendingUp className="w-4 h-4 text-rose-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <div
            className={`text-xl font-black ${
              kpis.netVarianceMins > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {kpis.netVarianceMins > 0 ? `+${kpis.netVarianceMins}분` : `${kpis.netVarianceMins}분`}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-bold">
            {kpis.netVarianceMins > 0 ? '총 지연 누적' : '단축 조기완료'}
          </div>
        </div>

        {/* Card 6: Total Pause Time */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-extrabold">누적 일시정지 시간</span>
            <Pause className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-xl font-black text-orange-600 dark:text-orange-400">
            {kpis.totalPauseMins} 분
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-bold">
            설비/자재/품질 대기시간
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="수주번호, 품명, 공정명, 설비, 작업자 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Order Filter */}
            <select
              value={orderFilter}
              onChange={(e) => {
                setOrderFilter(e.target.value);
                if (e.target.value !== 'ALL') {
                  setSelectedExportOrderId(e.target.value);
                }
              }}
              className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200"
              title="특정 수주 필터"
            >
              <option value="ALL">전체 수주</option>
              {uniqueOrders.map((o) => (
                <option key={o.orderId} value={o.orderId}>
                  [{o.orderId}] {o.orderName} ({o.count}공정)
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 font-bold"
            >
              <option value="ALL">전체 상태</option>
              <option value="COMPLETED">완료 (COMPLETED)</option>
              <option value="IN_PROGRESS">진행중 (IN_PROGRESS)</option>
              <option value="PAUSED">일시정지 (PAUSED)</option>
              <option value="DELAYED">지연 (DELAYED)</option>
              <option value="PLANNED">계획됨 (PLANNED)</option>
              <option value="READY">대기 (READY)</option>
            </select>

            {/* Variance Filter */}
            <select
              value={varianceFilter}
              onChange={(e) => setVarianceFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 font-bold"
            >
              <option value="ALL">전체 실적 차이</option>
              <option value="DELAYED">⚠️ 지연 발생 공정</option>
              <option value="ADVANCED">⚡ 시간 단축 공정</option>
              <option value="ON_TIME">✓ 표준시간 정합 공정</option>
            </select>

            {/* Equipment Filter */}
            <select
              value={machineFilter}
              onChange={(e) => setMachineFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900"
            >
              <option value="ALL">전체 설비</option>
              {ALL_EQUIPMENT_LIST.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* Field Operator Filter (현장 담당자: 가공팀, 연마팀, 품질팀 동적 필터링) */}
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="worker-filter-select"
                className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap hidden sm:inline"
              >
                현장 담당자:
              </label>
              <select
                id="worker-filter-select"
                value={workerFilter}
                onChange={(e) => setWorkerFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200"
                title="현장 담당자 필터 (가공, 연마, 품질팀)"
              >
                <option value="ALL">현장 담당자 (전체)</option>
                {fieldOperators.map((op) => (
                  <option key={op.baseName} value={op.baseName}>
                    {op.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 1단계 & 2단계: 프로젝트 단위 계층형 계획 대비 실적 목록 */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>프로젝트(수주)별 계획 대비 실적 목록 (총 {visibleProjects.length}개 수주 / {filteredList.length}건 공정)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              1단계: 수주 요약 정보 확인 / 2단계: 행 클릭 시 호기별 세부 공정 단계(Step) 및 체크박스 선택 CSV 내보내기
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAllProjects}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 transition cursor-pointer"
            >
              모두 펼치기
            </button>
            <button
              type="button"
              onClick={collapseAllProjects}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 transition cursor-pointer"
            >
              모두 접기
            </button>
          </div>
        </div>

        {/* Project List */}
        {visibleProjects.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-2xs">
            <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              조건에 일치하는 수주 또는 공정 실적 데이터가 없습니다.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              상단 검색어 및 필터 조건을 초기화해 보세요.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleProjects.map((project) => {
              const isExpanded = !!expandedProjects[project.projectKey];
              const displayTasks = project.matchingTasks.length > 0 ? project.matchingTasks : project.allTasks;
              const currentUnitFilter = unitFilters[project.projectKey] || 'ALL';
              const unitFilteredTasks = currentUnitFilter === 'ALL'
                ? displayTasks
                : displayTasks.filter((t) => t.productNo === currentUnitFilter);

              const selectedKeys = selectedProcesses[project.projectKey] || [];
              const allSelected = unitFilteredTasks.length > 0 && unitFilteredTasks.every((t) => selectedKeys.includes(t.processKey));
              const hasSomeSelected = selectedKeys.length > 0 && !allSelected;
              const viewMode = projectViewModes[project.projectKey] || 'LIST';

              const targetOrder: Order = orders[project.orderId] || {
                id: project.orderId,
                name: project.orderName,
                pjtNo: project.orderId,
                pjtName: project.pjtName || project.orderName,
                customer: project.customer || '고객사',
                partName: project.pjtName || project.orderName,
                qty: project.quantity,
                typeId: 'TYPE_CUSTOM',
                status: (project.completedCount === project.totalCount ? 'COMPLETED' : 'IN_PROGRESS') as OrderStatus,
                startDate: '',
                dueDate: project.dueDate || '',
                customProcesses: project.allTasks.map((t, idx) => ({
                  id: t.processKey || `proc_${idx}`,
                  name: t.groupName,
                  code: `OP${String(idx + 1).padStart(3, '0')}`,
                  category: t.category,
                  componentTag: t.componentTag || parseComponentTag(t.groupName, '', ''),
                  durationHours: (t.plannedMinutes || 60) / 60,
                  estimatedHours: (t.plannedMinutes || 60) / 60,
                  assignedMachine: t.machine,
                  assignedWorker: t.worker,
                })),
              };
              const currentProductType = productTypes && targetOrder.typeId ? productTypes[targetOrder.typeId] : null;

              return (
                <div
                  key={project.projectKey}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden transition-all duration-200"
                >
                  {/* 1단계: 프로젝트 요약 헤더 (클릭 시 아코디언 토글) */}
                  <div
                    onClick={() => toggleProjectExpand(project.projectKey)}
                    className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-750 transition"
                  >
                    {/* Left: Expand icon + Project Identifier */}
                    <div className="flex items-center gap-3 min-w-[280px]">
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-black text-sm text-blue-700 dark:text-blue-400">
                            {project.orderId}
                          </span>
                          {project.productNos.length > 1 ? (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              수량 {project.quantity}개 (#{project.productNos.join(', #')}호기)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              #{project.productNos[0] || 1}호기 (1개)
                            </span>
                          )}
                          {project.customer && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {project.customer}
                            </span>
                          )}
                          {project.dueDate && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              납기: {project.dueDate}
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                          {project.pjtName || project.orderName}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Progress Bar & Process Counts */}
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      {/* Process Count Badge */}
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 text-xs font-black bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800">
                          총 {project.totalCount}개 공정
                        </span>
                        {project.matchingTasks.length !== project.totalCount && (
                          <span className="px-2 py-0.5 text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md">
                            ({project.matchingTasks.length}건 일치)
                          </span>
                        )}
                      </div>

                      {/* Mini Progress Bar */}
                      <div className="flex items-center gap-2">
                        <div className="w-20 sm:w-28 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${project.completionRate}%` }}
                          />
                        </div>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          {project.completionRate}%
                        </span>
                        <span className="text-[11px] text-slate-500 hidden md:inline">
                          (완료 {project.completedCount} / 진행 {project.inProgressCount} / 대기 {project.readyCount})
                        </span>
                      </div>

                      {/* Time Plan vs Actual */}
                      <div className="hidden lg:flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-bold">
                        <span>계획 {project.totalPlannedHours}h</span>
                        <span className="text-slate-400">/</span>
                        <span>실적 {project.completedActualHours}h</span>
                        {project.netVarianceMins > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 text-[11px]">
                            (+{project.netVarianceMins}분)
                          </span>
                        ) : project.netVarianceMins < 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">
                            ({project.netVarianceMins}분)
                          </span>
                        ) : null}
                      </div>

                      {/* Delay Status */}
                      <div>
                        {project.hasDelay ? (
                          <span className="px-2.5 py-1 text-xs font-black bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>지연 {project.delayedCount}건</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-black bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>정상</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Project-level Export & Expand Toggle Button */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportProjectAll(project);
                        }}
                        className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-600 hover:border-emerald-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                        title={`[${project.orderId}] 전체 ${project.totalCount}개 공정을 CSV로 다운로드합니다.`}
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>이 수주 전체 CSV</span>
                      </button>

                      <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                        {isExpanded && viewMode === 'FLOW' ? (
                          <>
                            <Workflow className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>공정 흐름도</span>
                          </>
                        ) : (
                          <>
                            <List className="w-3.5 h-3.5" />
                            <span>{isExpanded ? '접기' : `공정 목록 (${displayTasks.length})`}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2단계: 아코디언 바디 (리스트 보기 / 공정 흐름도 보기 토글 통합) */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/40 p-4 sm:p-5 space-y-3">
                      {/* Sub-toolbar: View Mode Toggle (리스트 보기 vs 흐름도 보기) + Unit filter tabs + Checkbox select all & Selection CSV Export */}
                      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                        <div className="flex flex-wrap items-center gap-3">
                          {/* View Mode Toggle: 리스트 보기 vs 흐름도 보기 */}
                          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl border border-slate-200 dark:border-slate-600">
                            <button
                              type="button"
                              onClick={() => setProjectViewModes((prev) => ({ ...prev, [project.projectKey]: 'LIST' }))}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg transition cursor-pointer whitespace-nowrap ${
                                viewMode === 'LIST'
                                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              <List className="w-3.5 h-3.5" />
                              <span>리스트 보기</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setProjectViewModes((prev) => ({ ...prev, [project.projectKey]: 'FLOW' }))}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg transition cursor-pointer whitespace-nowrap ${
                                viewMode === 'FLOW'
                                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              <Workflow className="w-3.5 h-3.5" />
                              <span>흐름도 보기</span>
                            </button>
                          </div>

                          <span className="text-slate-300 dark:text-slate-700">|</span>

                          {/* Unit filter tabs for multi-quantity orders */}
                          {project.productNos.length > 1 && (
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl">
                              <button
                                type="button"
                                onClick={() => setUnitFilters((prev) => ({ ...prev, [project.projectKey]: 'ALL' }))}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap ${
                                  currentUnitFilter === 'ALL'
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                              >
                                전체 호기 ({displayTasks.length})
                              </button>
                              {project.productNos.map((pNo) => (
                                <button
                                  key={pNo}
                                  type="button"
                                  onClick={() => setUnitFilters((prev) => ({ ...prev, [project.projectKey]: pNo }))}
                                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap ${
                                    currentUnitFilter === pNo
                                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                  }`}
                                >
                                  #{pNo}호기 ({displayTasks.filter((t) => t.productNo === pNo).length})
                                </button>
                              ))}
                            </div>
                          )}

                          {project.productNos.length > 1 && viewMode === 'LIST' && (
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                          )}

                          {/* Toggle Select All (only relevant in List mode) */}
                          {viewMode === 'LIST' && (
                            <>
                              <button
                                type="button"
                                onClick={() => toggleSelectAllInProject(project.projectKey, unitFilteredTasks)}
                                className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer whitespace-nowrap"
                              >
                                {allSelected ? (
                                  <CheckSquare className="w-4 h-4 text-blue-600" />
                                ) : hasSomeSelected ? (
                                  <MinusSquare className="w-4 h-4 text-blue-500" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400" />
                                )}
                                <span>현재 화면 전체 선택</span>
                              </button>

                              <span className="text-slate-300 dark:text-slate-700">|</span>

                              {/* Selection status */}
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                선택: <strong className="text-blue-600 dark:text-blue-400 font-bold">{selectedKeys.length}</strong> / {displayTasks.length}건
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Export Selected Processes Button (only in List view) */}
                          {viewMode === 'LIST' && (
                            <button
                              type="button"
                              onClick={() => handleExportSelectedProcesses(project)}
                              disabled={selectedKeys.length === 0}
                              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                              title={
                                selectedKeys.length > 0
                                  ? `선택한 ${selectedKeys.length}개 공정만 CSV 파일로 다운로드합니다.`
                                  : '내보낼 공정을 체크박스로 선택해 주세요.'
                              }
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>선택 항목 CSV 내보내기 ({selectedKeys.length}건)</span>
                            </button>
                          )}

                          {/* Export Project All */}
                          <button
                            type="button"
                            onClick={() => handleExportProjectAll(project)}
                            className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                            title="해당 수주의 전체 공정을 CSV로 다운로드합니다."
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>수주 전체 내보내기</span>
                          </button>
                        </div>
                      </div>

                      {/* Content: List View vs Flow Diagram View */}
                      {viewMode === 'FLOW' ? (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-3 sm:p-5">
                          <OrderProcessFlowDiagram
                            order={targetOrder}
                            productType={currentProductType}
                            scheduledTasks={scheduledTasks.filter((t) => t.orderId === project.orderId)}
                            processProgressMap={processProgressMap}
                            currentUser={currentUser}
                            canEdit={Boolean(onUpdateOrder)}
                            onUpdateOrder={onUpdateOrder}
                            approvedOperators={approvedOperators}
                            usersList={usersList}
                            defaultUnit={currentUnitFilter}
                          />
                        </div>
                      ) : (
                        /* Process Steps Table */
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-700">
                              <thead className="bg-slate-50 dark:bg-slate-900/80 font-black text-slate-700 dark:text-slate-300">
                                <tr>
                                  <th className="py-3 px-3 w-10 text-center">선택</th>
                                  <th className="py-3 px-3">공정명 (Step)</th>
                                  <th className="py-3 px-3">계획 일정 & 시간</th>
                                  <th className="py-3 px-3">실제 실적 & 시간</th>
                                  <th className="py-3 px-3">일시정지</th>
                                  <th className="py-3 px-3">차이 / 지연 여부</th>
                                  <th className="py-3 px-3">상태</th>
                                  <th className="py-3 px-3">설비 / 담당자</th>
                                  <th className="py-3 px-3">특이사항 / 사유</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                {unitFilteredTasks.map((task) => {
                                  const isChecked = selectedKeys.includes(task.processKey);

                                  return (
                                    <tr
                                      key={task.processKey}
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setIsDetailModalOpen(true);
                                      }}
                                      className={`transition cursor-pointer ${
                                        isChecked
                                          ? 'bg-blue-50/60 dark:bg-blue-950/30'
                                          : 'hover:bg-slate-50 dark:hover:bg-slate-750'
                                      }`}
                                    >
                                      {/* Checkbox */}
                                      <td
                                        className="py-3 px-3 text-center"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleProcessSelect(project.projectKey, task.processKey);
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => {}}
                                          className="w-4 h-4 text-blue-600 rounded cursor-pointer focus:ring-blue-500"
                                        />
                                      </td>

                                      {/* Process Step Name */}
                                      <td className="py-3 px-3">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="whitespace-nowrap px-1.5 py-0.5 text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                                            #{task.productNo}호기
                                          </span>
                                          <span className="whitespace-nowrap px-1.5 py-0.5 text-[10px] font-black bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300">
                                            Step {task.processIndex + 1}
                                          </span>
                                          <span className="font-bold text-slate-900 dark:text-white">
                                            {task.groupName}
                                          </span>
                                          <span
                                            className={`whitespace-nowrap text-[10px] px-1.5 py-0.5 rounded font-extrabold ${
                                              task.category === '가공'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                                                : task.category === '연마'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                                                : task.category === '외주'
                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                                                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                                            }`}
                                          >
                                            {task.category}
                                          </span>
                                          {(() => {
                                            const compTag = task.componentTag || parseComponentTag(task.groupName, '', '');
                                            if (!compTag) return null;
                                            const isAssembly = compTag.includes('+');
                                            return (
                                              <span
                                                className={`whitespace-nowrap text-[10px] px-2 py-0.5 rounded-md font-black border shadow-2xs ${
                                                  isAssembly
                                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                                                    : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700'
                                                }`}
                                              >
                                                {isAssembly ? `🔗 ${compTag}` : `[${compTag}]`}
                                              </span>
                                            );
                                          })()}
                                        </div>
                                      </td>

                                    {/* Planned Start / End / Duration */}
                                    <td className="py-3 px-3">
                                      <div className="font-semibold text-slate-700 dark:text-slate-300">
                                        {formatDateTime(task.plannedStart)} ~ {formatDateTime(task.plannedEnd)}
                                      </div>
                                      <div className="text-[11px] text-slate-500 font-bold">
                                        계획 {task.plannedMins}분 ({(task.plannedMins / 60).toFixed(1)}h)
                                      </div>
                                    </td>

                                    {/* Actual Start / End / Duration */}
                                    <td className="py-3 px-3">
                                      {task.actualStart ? (
                                        <div>
                                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                                            {formatDateTime(task.actualStart)} ~{' '}
                                            {task.actualEnd ? formatDateTime(task.actualEnd) : '진행중'}
                                          </div>
                                          <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                                            실적 {task.actualMins !== null ? `${task.actualMins}분` : '-'}
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-slate-400 font-semibold">미착수</span>
                                      )}
                                    </td>

                                    {/* Pause History */}
                                    <td className="py-3 px-3">
                                      {task.pauseTotal > 0 ? (
                                        <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold">
                                          <Pause className="w-3 h-3" />
                                          <span>{task.pauseTotal}분</span>
                                        </div>
                                      ) : (
                                        <span className="text-slate-400">-</span>
                                      )}
                                    </td>

                                    {/* Variance */}
                                    <td className="py-3 px-3">
                                      {task.actualMins !== null ? (
                                        task.varianceType === 'DELAYED' ? (
                                          <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                                            <TrendingDown className="w-3.5 h-3.5" />
                                            <span>+{task.varianceMins}분 초과</span>
                                          </span>
                                        ) : task.varianceType === 'ADVANCED' ? (
                                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                                            <TrendingUp className="w-3.5 h-3.5" />
                                            <span>{task.varianceMins}분 단축</span>
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 font-bold text-slate-600 dark:text-slate-400">
                                            <Check className="w-3.5 h-3.5" />
                                            <span>표준 정합</span>
                                          </span>
                                        )
                                      ) : task.status === 'DELAYED' ? (
                                        <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                                          <AlertTriangle className="w-3.5 h-3.5" />
                                          <span>지연 중</span>
                                        </span>
                                      ) : (
                                        <span className="text-slate-400">-</span>
                                      )}
                                    </td>

                                    {/* Status Badge */}
                                    <td className="py-3 px-3">
                                      <span
                                        className={`px-2 py-1 rounded-md text-[11px] font-black ${
                                          task.status === 'COMPLETED'
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                            : task.status === 'IN_PROGRESS'
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 animate-pulse'
                                            : task.status === 'PAUSED'
                                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300'
                                            : task.status === 'DELAYED'
                                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                        }`}
                                      >
                                        {task.status}
                                      </span>
                                    </td>

                                    {/* Machine / Worker */}
                                    <td className="py-3 px-3">
                                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                        <Cpu className="w-3 h-3 text-slate-400" />
                                        <span>{task.machine || '미지정'}</span>
                                      </div>
                                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                        <UserIcon className="w-3 h-3 text-slate-400" />
                                        <span>{task.worker || '미지정'}</span>
                                      </div>
                                    </td>

                                    {/* Notes & Delay Reason */}
                                    <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-400 max-w-[160px] truncate">
                                      {task.delayReason ? (
                                        <span className="text-rose-600 font-bold">{task.delayReason}</span>
                                      ) : task.memo ? (
                                        <span>{task.memo}</span>
                                      ) : (
                                        <span className="text-slate-400">-</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CSV Export Scope Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    분석 리포트 CSV 내보내기 범위 선택
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    내보낼 공정 실적 데이터의 범위를 지정해 다운로드합니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Option 1: Entire All Projects */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    <span>전체 프로젝트 공정 일괄 내보내기</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    필터와 무관하게 시스템 내 등록된 전체 공정 실적 데이터 ({tasksAnalysis.length}건)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleExportCSV('ALL')}
                  className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>전체 다운로드</span>
                </button>
              </div>

              {/* Option 2: Specific Single Project */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-500" />
                      <span>특정 프로젝트 지정 내보내기</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      원하는 프로젝트를 드롭다운에서 선택하여 해당 공정만 다운로드
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportCSV('ORDER', selectedExportOrderId)}
                    disabled={!selectedExportOrderId}
                    className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>프로젝트 다운로드</span>
                  </button>
                </div>
                <div>
                  <select
                    value={selectedExportOrderId}
                    onChange={(e) => setSelectedExportOrderId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  >
                    {uniqueOrders.map((o) => (
                      <option key={o.orderId} value={o.orderId}>
                        [{o.orderId}] {o.orderName} ({o.count}개 공정)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Feedback Toast */}
      {downloadSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 dark:border-slate-200 flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{downloadSuccessToast}</span>
          <button
            onClick={() => setDownloadSuccessToast(null)}
            className="p-1 hover:bg-white/20 dark:hover:bg-black/20 rounded-md transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modal */}
      {isDetailModalOpen && currentSelectedTask && (
        <CalendarTaskDetailModal
          task={currentSelectedTask}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedTask(null);
          }}
          onUpdateProgress={onUpdateProgress}
          currentUser={currentUser}
          approvedOperators={approvedOperators}
          onExportOrderCsv={(orderId) => handleExportCSV('ORDER', orderId)}
        />
      )}
    </div>
  );
};
