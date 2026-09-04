import React, { useState, useMemo } from 'react';
import { Order, ProductType, ScheduledTaskItem, ProcessStep } from '../types';
import {
  Archive,
  RotateCcw,
  Search,
  CheckCircle2,
  Copy,
  ArrowRight,
  Package,
  Layers,
  Calendar,
  Eye,
  TrendingUp,
  Award,
  Building2,
  Clock,
  X,
  FileText,
  Check,
  Sparkles,
  BarChart2
} from 'lucide-react';

interface ArchiveViewProps {
  orders?: Record<string, Order>;
  productTypes?: Record<string, ProductType>;
  scheduledTasks?: ScheduledTaskItem[];
  processProgressMap?: any;
  onRestoreOrder: (orderId: string) => void;
  onCopyOrderToNew?: (order: Order) => void;
  onNavigateToOrderMaster?: () => void;
}

// Helper to extract year from order
function getOrderYear(order: Order): number {
  if (order.completedAt) {
    const match = order.completedAt.match(/\b(20\d{2})\b/);
    if (match) return parseInt(match[1], 10);
    const d = new Date(order.completedAt);
    if (!isNaN(d.getFullYear())) return d.getFullYear();
  }
  if (order.dueDate) {
    const match = order.dueDate.match(/\b(20\d{2})\b/);
    if (match) return parseInt(match[1], 10);
  }
  if (order.startDate) {
    const match = order.startDate.match(/\b(20\d{2})\b/);
    if (match) return parseInt(match[1], 10);
  }
  const idMatch = order.id.match(/\b(20\d{2})\b/);
  if (idMatch) return parseInt(idMatch[1], 10);
  return 2026; // Default to 2026
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  orders = {},
  productTypes = {},
  onRestoreOrder,
  onCopyOrderToNew,
  onNavigateToOrderMaster,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>('ALL');
  const [restoredAlert, setRestoredAlert] = useState<string | null>(null);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);

  const allOrdersList = useMemo(() => Object.values(orders || {}) as Order[], [orders]);

  // Extract all distinct years from archived orders (with 2026 and 2025 defaults)
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>([2026, 2025]);
    allOrdersList
      .filter((o) => Boolean(o.archived))
      .forEach((o) => {
        yearSet.add(getOrderYear(o));
      });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [allOrdersList]);

  // All archived orders
  const allArchivedList = useMemo(() => {
    return allOrdersList.filter((o) => Boolean(o.archived));
  }, [allOrdersList]);

  // Filtered archived list based on Year and Search
  const archivedList = useMemo(() => {
    return allArchivedList
      .filter((o) => {
        if (selectedYear === 'ALL') return true;
        return getOrderYear(o) === selectedYear;
      })
      .filter((o) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const type = productTypes[o.typeId];
        return (
          o.name.toLowerCase().includes(term) ||
          o.id.toLowerCase().includes(term) ||
          (o.customer && o.customer.toLowerCase().includes(term)) ||
          (o.pjtName && o.pjtName.toLowerCase().includes(term)) ||
          (o.pjtNo && o.pjtNo.toLowerCase().includes(term)) ||
          (o.partName && o.partName.toLowerCase().includes(term)) ||
          (o.spec && o.spec.toLowerCase().includes(term)) ||
          (type && type.name.toLowerCase().includes(term))
        );
      });
  }, [allArchivedList, selectedYear, searchTerm, productTypes]);

  // Compact summary metrics
  const totalArchivedQty = useMemo(() => {
    return archivedList.reduce((sum, o) => sum + (o.qty || 1), 0);
  }, [archivedList]);

  // Yearly Performance & Achievement Comparison Matrix Data
  const yearlyPerformanceMatrix = useMemo(() => {
    return availableYears.map((yr) => {
      const yearOrders = allArchivedList.filter((o) => getOrderYear(o) === yr);
      const orderCount = yearOrders.length;
      const totalQty = yearOrders.reduce((sum, o) => sum + (o.qty || 1), 0);

      // Unique customers & product types for that year
      const customers = Array.from(new Set(yearOrders.map((o) => o.customer).filter(Boolean))) as string[];
      const topCustomer = customers.length > 0 ? customers.slice(0, 2).join(', ') + (customers.length > 2 ? ` 외 ${customers.length - 2}사` : '') : '-';

      // On-time delivery / achievement calculation (defaulting high for completed orders)
      const onTimeCount = yearOrders.filter((o) => {
        if (!o.dueDate || !o.completedAt) return true;
        return new Date(o.completedAt).getTime() <= new Date(o.dueDate).getTime();
      }).length;
      const achievementRate = orderCount > 0 ? Math.round((onTimeCount / orderCount) * 100) : 100;

      return {
        year: yr,
        orderCount,
        totalQty,
        topCustomer,
        customerCount: customers.length,
        achievementRate: achievementRate || 100,
      };
    });
  }, [availableYears, allArchivedList]);

  const handleRestoreClick = (order: Order) => {
    onRestoreOrder(order.id);
    const prevInfo =
      order.wasActuallyCompleted === false && order.previousProgress !== undefined
        ? ` (보관 전 진행률: ${order.previousProgress}%)`
        : '';
    setRestoredAlert(`수주 [${order.name}] (${order.id})이(가) 활성 수주로 정상 복원되었습니다.${prevInfo}`);
    setTimeout(() => {
      setRestoredAlert(null);
    }, 4500);
  };

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Restored Toast Notification */}
      {restoredAlert && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-200 px-4 py-3 rounded-xl flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-black">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{restoredAlert}</span>
          </div>
          {onNavigateToOrderMaster && (
            <button
              onClick={onNavigateToOrderMaster}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100 underline ml-4 cursor-pointer shrink-0"
            >
              수주관리에서 확인
            </button>
          )}
        </div>
      )}

      {/* 1. Header Card with Year Filter Tabs & Search */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-3 bg-[#FFF9EB] dark:bg-amber-950/60 text-[#B45309] dark:text-amber-300 border border-[#FCD34D] dark:border-amber-700/80 rounded-2xl shadow-2xs shrink-0">
            <Archive className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                완료 수주 보관함 (Archive Vault)
              </h2>
              <span className="bg-[#FFF9EB] dark:bg-amber-950/60 text-[#B45309] dark:text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-black border border-[#FCD34D] dark:border-amber-700/80 shadow-2xs">
                {selectedYear === 'ALL' ? '전체 연도' : `${selectedYear}년`} 보관 {archivedList.length}건
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              공정 완료 후 보관된 수주 이력을 연도별로 조회하고, 사양 복사 및 보관 전 진행 상태로의 복원을 지원합니다.
            </p>
          </div>
        </div>

        {/* Year Selector Tabs & Search */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto min-w-0">
          {/* Year Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-xl border border-slate-200 dark:border-slate-600 shrink-0">
            <button
              onClick={() => setSelectedYear('ALL')}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                selectedYear === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 shadow-xs border border-slate-200/80 dark:border-slate-600'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              전체
            </button>
            {availableYears.map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  selectedYear === yr
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 shadow-xs border border-slate-200/80 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {yr}년
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="수주명 / 프로젝트명 / 고객사 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 transition font-medium"
            />
          </div>
        </div>
      </div>

      {/* 2. 연도별 실적 & 달성률 종합 비교 현황 (Yearly Performance & Achievement Matrix) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs min-w-0">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
              연도별 실적 및 달성률 비교 현황
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            * 연도 행을 클릭하여 해당 연도 수주 내역을 바로 필터링할 수 있습니다.
          </span>
        </div>

        <div className="w-full overflow-x-auto overflow-y-hidden border border-slate-200 dark:border-slate-700 rounded-xl">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-extrabold border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th className="p-2.5 text-center w-24">연도</th>
                <th className="p-2.5 text-center w-28">보관 완료 건수</th>
                <th className="p-2.5 text-center w-32">총 생산 수량 (EA)</th>
                <th className="p-2.5 text-center w-36">납기 달성률 (%)</th>
                <th className="p-2.5 min-w-[200px]">주요 고객사 실적</th>
                <th className="p-2.5 text-center w-24">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-semibold">
              {yearlyPerformanceMatrix.map((row) => {
                const isSelected = selectedYear === row.year;
                return (
                  <tr
                    key={row.year}
                    onClick={() => setSelectedYear(row.year)}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-750'
                    }`}
                  >
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-md font-extrabold font-mono text-xs ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}>
                        {row.year}년
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-bold text-slate-900 dark:text-white">
                      {row.orderCount}건
                    </td>
                    <td className="p-2.5 text-center font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      {row.totalQty.toLocaleString()} EA
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, row.achievementRate)}%` }}
                          />
                        </div>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                          {row.achievementRate}%
                        </span>
                      </div>
                    </td>
                    <td className="p-2.5 text-slate-700 dark:text-slate-300 text-xs">
                      {row.topCustomer}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>정상 마감</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Compact Information Summary Strip */}
      <div className="bg-slate-50/90 dark:bg-slate-800/60 p-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs min-w-0">
        <div className="flex items-center gap-4 flex-wrap text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>선택 보관 건수:</span>
            <strong className="text-slate-900 dark:text-white font-black">{archivedList.length}건</strong>
          </span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>총 보관 수량:</span>
            <strong className="text-slate-900 dark:text-white font-black">{totalArchivedQty.toLocaleString()} EA</strong>
          </span>
        </div>

        {onNavigateToOrderMaster && (
          <button
            onClick={onNavigateToOrderMaster}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>활성 수주관리로 이동</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 4. Archived Orders List Table (Responsive Scroll Container) */}
      <div className="w-full min-w-0 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 shadow-xs overflow-hidden">
        <div className="w-full overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[1020px] text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th className="p-3.5 min-w-[220px]">수주번호 / 프로젝트명</th>
                <th className="p-3.5 min-w-[120px]">고객사</th>
                <th className="p-3.5 min-w-[180px]">제품 타입 및 공정 스펙</th>
                <th className="p-3.5 text-center w-20">수량</th>
                <th className="p-3.5 text-center min-w-[100px]">투입 방식</th>
                <th className="p-3.5 text-center min-w-[120px]">수주 완료일</th>
                <th className="p-3.5 text-center min-w-[100px] whitespace-nowrap">상태</th>
                <th className="p-3.5 text-center min-w-[240px] whitespace-nowrap">관리 액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-800 dark:text-slate-200 font-semibold">
              {archivedList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Archive className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        {selectedYear === 'ALL'
                          ? '보관함에 보관된 수주건이 없습니다.'
                          : `${selectedYear}년도에 보관된 수주건이 없습니다.`}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        상단 연도 탭을 변경하거나 수주관리/대시보드에서 완료된 수주를 보관할 수 있습니다.
                      </p>
                      {selectedYear !== 'ALL' && (
                        <button
                          onClick={() => setSelectedYear('ALL')}
                          className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          전체 연도 보기
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                archivedList.map((ord) => {
                  const type = productTypes[ord.typeId];
                  const processCount =
                    ord.customProcesses && ord.customProcesses.length > 0
                      ? ord.customProcesses.length
                      : type
                      ? type.processes.length
                      : 0;

                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition"
                    >
                      {/* Order Name & Details */}
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {ord.name}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                          ID: {ord.id}
                        </div>
                        {(ord.pjtName || ord.pjtNo || ord.partName) && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            {ord.pjtName || ord.pjtNo || ord.partName}
                          </div>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 font-bold">
                        {ord.customer || '-'}
                      </td>

                      {/* Product Type & Steps */}
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {type ? type.name : '커스텀 공정 구성'}
                        </span>
                        <span className="ml-1.5 text-[11px] text-slate-400 font-normal">
                          ({processCount}단계 공정)
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="p-3.5 text-center font-extrabold text-slate-800 dark:text-slate-200">
                        <span className="inline-block bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md font-mono font-bold text-xs">
                          {ord.qty}개
                        </span>
                      </td>

                      {/* Strategy */}
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                          {ord.strategy === 'SERIAL' ? '직렬 투입' : '연속 투입'}
                        </span>
                      </td>

                      {/* Completion Date */}
                      <td className="p-3.5 text-center text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        {ord.completedAt || ord.dueDate || '-'}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-[#FFF9EB] dark:bg-amber-950/60 text-[#B45309] dark:text-amber-300 border border-[#FCD34D] dark:border-amber-700/80 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#B45309] dark:text-amber-400" />
                          <span>완료 보관</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                          {/* Detail View Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedDetailOrder(ord)}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 rounded-lg font-bold transition inline-flex items-center gap-1 text-xs shadow-2xs cursor-pointer active:scale-95 shrink-0"
                            title="이 수주의 상세 규격, 공정 이동표 사양 및 공정 단계별 담당자/설비 이력을 확인합니다."
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                            <span>상세</span>
                          </button>

                          {/* Copy Specs Button */}
                          {onCopyOrderToNew && (
                            <button
                              type="button"
                              onClick={() => onCopyOrderToNew(ord)}
                              className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 px-2.5 py-1.5 rounded-lg font-bold transition inline-flex items-center gap-1 text-xs shadow-2xs cursor-pointer active:scale-95 shrink-0"
                              title="이 수주의 공정 구성 및 설비/담당자 사양을 신규 수주 등록으로 복사합니다."
                            >
                              <Copy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>사양복사</span>
                            </button>
                          )}

                          {/* Restore Button */}
                          <button
                            type="button"
                            onClick={() => handleRestoreClick(ord)}
                            className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 px-2.5 py-1.5 rounded-lg font-bold transition inline-flex items-center gap-1 text-xs shadow-2xs cursor-pointer active:scale-95 shrink-0"
                            title="이 수주를 완료 보관함에서 활성 수주로 복원합니다. (보관 전 진행 상태와 진행률이 정확히 복구됩니다)"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>복원</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Archive Order Detail Modal (수주 상세 확인) */}
      {selectedDetailOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-750">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#FFF9EB] text-[#B45309] border border-[#FCD34D] shadow-2xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{selectedDetailOrder.name}</span>
                    <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-md font-bold border border-amber-300 dark:border-amber-700">
                      보관 수주 상세
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    ID: {selectedDetailOrder.id} | 수량: {selectedDetailOrder.qty}개 | 완료일: {selectedDetailOrder.completedAt || '-'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailOrder(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Pre-Archive Snapshot Status Badge */}
              <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-extrabold text-blue-900 dark:text-blue-200">
                    보관 전 원래 상태:
                  </span>
                  <span className="font-bold text-blue-700 dark:text-blue-300">
                    {selectedDetailOrder.wasActuallyCompleted
                      ? '실제 공정 100% 완료 후 보관'
                      : `진행 중 강제 보관 (보관 전 진행률: ${selectedDetailOrder.previousProgress || 0}%, 상태: ${selectedDetailOrder.previousOrderStatus || 'IN_PROGRESS'})`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleRestoreClick(selectedDetailOrder);
                    setSelectedDetailOrder(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-black transition flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>지금 바로 복원</span>
                </button>
              </div>

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-200 dark:border-slate-600">
                  <div className="text-slate-400 dark:text-slate-400 font-bold mb-1">고객사</div>
                  <div className="font-black text-slate-900 dark:text-white text-sm">{selectedDetailOrder.customer || '-'}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-200 dark:border-slate-600">
                  <div className="text-slate-400 dark:text-slate-400 font-bold mb-1">프로젝트 번호</div>
                  <div className="font-black text-slate-900 dark:text-white text-sm">{selectedDetailOrder.pjtNo || '-'}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-200 dark:border-slate-600">
                  <div className="text-slate-400 dark:text-slate-400 font-bold mb-1">품명 / 품목</div>
                  <div className="font-black text-slate-900 dark:text-white text-sm">{selectedDetailOrder.partName || '-'} ({selectedDetailOrder.partType || '단품'})</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-200 dark:border-slate-600">
                  <div className="text-slate-400 dark:text-slate-400 font-bold mb-1">규격 / 소재</div>
                  <div className="font-black text-slate-900 dark:text-white">{selectedDetailOrder.spec || '-'} / {selectedDetailOrder.material || '-'}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-200 dark:border-slate-600">
                  <div className="text-slate-400 dark:text-slate-400 font-bold mb-1">정밀공차 / 코팅규격</div>
                  <div className="font-black text-slate-900 dark:text-white">{selectedDetailOrder.tolerance || '-'} / {selectedDetailOrder.coatingSpec || '-'}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-200 dark:border-slate-600">
                  <div className="text-slate-400 dark:text-slate-400 font-bold mb-1">투입 방식 / 납기일</div>
                  <div className="font-black text-slate-900 dark:text-white">{selectedDetailOrder.strategy === 'SERIAL' ? '직렬 투입' : '연속 투입'} / {selectedDetailOrder.dueDate || '-'}</div>
                </div>
              </div>

              {/* Routing Processes List */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-700 p-2.5 px-3.5 font-black text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center">
                  <span>공정 라우팅 단계 ({
                    (selectedDetailOrder.customProcesses && selectedDetailOrder.customProcesses.length > 0)
                      ? selectedDetailOrder.customProcesses.length
                      : (productTypes[selectedDetailOrder.typeId]?.processes?.length || 0)
                  }단계)</span>
                  <span className="text-[11px] font-normal text-slate-500">배정 설비 및 담당자</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-56 overflow-y-auto">
                  {(
                    (selectedDetailOrder.customProcesses && selectedDetailOrder.customProcesses.length > 0)
                      ? selectedDetailOrder.customProcesses
                      : (productTypes[selectedDetailOrder.typeId]?.processes || [])
                  ).map((p: ProcessStep, idx: number) => (
                    <div key={idx} className="p-2.5 px-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-750">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-200">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                          {p.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
                        <span>설비: <strong className="text-slate-700 dark:text-slate-200">{p.assignedMachine || '-'}</strong></span>
                        <span>담당자: <strong className="text-slate-700 dark:text-slate-200">{p.assignedWorker || p.worker || '-'}</strong></span>
                        <span>소요: <strong className="text-slate-700 dark:text-slate-200">{p.durationHours}h</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedDetailOrder.memo && (
                <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-3 rounded-xl">
                  <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-0.5">특이사항 / 메모</div>
                  <div className="text-slate-700 dark:text-slate-300">{selectedDetailOrder.memo}</div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 flex justify-end gap-2">
              {onCopyOrderToNew && (
                <button
                  type="button"
                  onClick={() => {
                    onCopyOrderToNew(selectedDetailOrder);
                    setSelectedDetailOrder(null);
                  }}
                  className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:hover:bg-amber-800/80 dark:text-amber-200 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>사양 복사하여 신규 수주 등록</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedDetailOrder(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
