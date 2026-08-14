import React, { useState, useMemo } from 'react';
import {
  ScheduledTaskItem,
  ProcessProgressItem,
  User,
  Order
} from '../types';
import { ALL_EQUIPMENT_LIST } from '../data/defaultData';
import { CalendarTaskDetailModal } from './CalendarTaskDetailModal';
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
  RefreshCw
} from 'lucide-react';

interface ActualAnalysisViewProps {
  scheduledTasks: ScheduledTaskItem[];
  orders: Record<string, Order>;
  processProgressMap: import('../types').ProcessProgressMap;
  onUpdateProgress: (processKey: string, progress: ProcessProgressItem) => void;
  currentUser?: User | null;
  approvedOperators?: string[];
}

export const ActualAnalysisView: React.FC<ActualAnalysisViewProps> = ({
  scheduledTasks,
  orders,
  processProgressMap,
  onUpdateProgress,
  currentUser,
  approvedOperators = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [varianceFilter, setVarianceFilter] = useState<string>('ALL'); // ALL, DELAYED, ADVANCED, ON_TIME
  const [machineFilter, setMachineFilter] = useState<string>('ALL');
  const [workerFilter, setWorkerFilter] = useState<string>('ALL');
  const [orderFilter, setOrderFilter] = useState<string>('ALL');

  const [selectedTask, setSelectedTask] = useState<ScheduledTaskItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Format Date Helper
  const formatDateTime = (dateVal: Date | string | null | undefined): string => {
    if (!dateVal) return '-';
    const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
    if (isNaN(d.getTime())) return '-';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
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
      if (workerFilter !== 'ALL' && t.worker !== workerFilter) return false;
      if (orderFilter !== 'ALL' && t.orderId !== orderFilter) return false;

      return true;
    });
  }, [tasksAnalysis, searchQuery, statusFilter, varianceFilter, machineFilter, workerFilter, orderFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      '수주번호',
      '수주명',
      '호기(Unit)',
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

    const rows = filteredList.map((t) => [
      t.orderId,
      `"${t.orderName.replace(/"/g, '""')}"`,
      `#${t.productNo}`,
      t.processIndex + 1,
      `"${t.groupName.replace(/"/g, '""')}"`,
      t.category,
      formatDateTime(t.plannedStart),
      formatDateTime(t.plannedEnd),
      t.plannedMins,
      formatDateTime(t.actualStart),
      formatDateTime(t.actualEnd),
      t.actualMins !== null ? t.actualMins : '',
      t.pauseTotal,
      t.varianceMins,
      t.status,
      `"${t.worker || ''}"`,
      `"${t.machine || ''}"`,
      `"${t.pauseReason || ''}"`,
      `"${t.delayReason || ''}"`,
      `"${t.memo || ''}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `생산실적_계획대비분석_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-sm">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              생산 실적 및 계획대비 분석 (Plan vs. Actual Analysis)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              표준 BOP 계획 시간 대비 실제 현장 소요시간, 일시정지 이력, 지연 원인을 정밀 추적합니다.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>분석 리포트 CSV 내보내기</span>
        </button>
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

            <select
              value={workerFilter}
              onChange={(e) => setWorkerFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900"
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

      {/* Detailed Plan vs Actual Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>상세 계획 대비 실적 목록 ({filteredList.length}건)</span>
          </h2>
          <span className="text-xs text-slate-500">
            행을 클릭하면 상세 비교 및 이력을 확인하고 설비/작업자를 수정할 수 있습니다.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/80 font-black text-slate-700 dark:text-slate-300">
              <tr>
                <th className="py-3 px-3">수주 / 품번</th>
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
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-bold">
                    일치하는 공정 실적 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredList.map((task) => (
                  <tr
                    key={task.processKey}
                    onClick={() => {
                      setSelectedTask(task);
                      setIsDetailModalOpen(true);
                    }}
                    className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition cursor-pointer"
                  >
                    {/* Order & Product Unit */}
                    <td className="py-3 px-3">
                      <div className="font-mono font-black text-blue-700 dark:text-blue-400">
                        {task.orderId} #{task.productNo}호기
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-bold truncate max-w-[130px]">
                        {task.orderName}
                      </div>
                    </td>

                    {/* Process Step */}
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {task.processIndex + 1}. {task.groupName}
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                        {task.category}
                      </span>
                    </td>

                    {/* Planned Schedule */}
                    <td className="py-3 px-3">
                      <div className="font-mono text-slate-700 dark:text-slate-300">
                        {formatDateTime(task.plannedStart)} ~ {formatDateTime(task.plannedEnd)}
                      </div>
                      <div className="font-black text-blue-600 dark:text-blue-400 text-[11px]">
                        {task.plannedMins}분 ({task.duration}시간)
                      </div>
                    </td>

                    {/* Actual Schedule */}
                    <td className="py-3 px-3">
                      {task.actualStart ? (
                        <>
                          <div className="font-mono text-slate-700 dark:text-slate-300">
                            {formatDateTime(task.actualStart)} ~ {task.actualEnd ? formatDateTime(task.actualEnd) : '진행중'}
                          </div>
                          <div className="font-black text-emerald-600 dark:text-emerald-400 text-[11px]">
                            {task.actualMins !== null ? `${task.actualMins}분` : '작업 진행중'}
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-400 font-mono">미착수</span>
                      )}
                    </td>

                    {/* Pause Time */}
                    <td className="py-3 px-3">
                      {task.pauseTotal > 0 ? (
                        <div className="text-orange-600 dark:text-orange-400 font-bold">
                          {task.pauseTotal}분 ({task.pauseHistory?.length}회)
                          {task.pauseReason && (
                            <div className="text-[10px] text-slate-500 font-normal">
                              ({task.pauseReason})
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Variance */}
                    <td className="py-3 px-3">
                      {task.actualMins !== null && task.actualMins > 0 ? (
                        task.varianceMins > 0 ? (
                          <span className="inline-flex items-center gap-1 font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                            <TrendingUp className="w-3 h-3" />
                            +{task.varianceMins}분 지연
                          </span>
                        ) : task.varianceMins < 0 ? (
                          <span className="inline-flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            <TrendingDown className="w-3 h-3" />
                            {Math.abs(task.varianceMins)}분 단축
                          </span>
                        ) : (
                          <span className="font-bold text-blue-600">✓ 표준시간 정합</span>
                        )
                      ) : task.status === 'DELAYED' ? (
                        <span className="font-bold text-rose-500">기한 지연</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : task.status === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300 animate-pulse'
                            : task.status === 'PAUSED'
                            ? 'bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-300'
                            : task.status === 'DELAYED'
                            ? 'bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>

                    {/* Machine & Worker */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {task.machine || '(설비 미지정)'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {task.worker || '(작업자 미지정)'}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <CalendarTaskDetailModal
        task={selectedTask}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onUpdateProgress={onUpdateProgress}
        currentUser={currentUser}
        approvedOperators={approvedOperators}
      />
    </div>
  );
};
