import React, { useState, useMemo } from 'react';
import {
  Order,
  ProductType,
  ProcessProgressMap,
  ProcessStep,
  ScheduledTaskItem,
  User,
} from '../types';
import { EditOrderModal } from './Modals';
import { ProcessTravelerModal } from './ProcessTravelerModal';
import { DispatchModal } from './DispatchModal';
import {
  FileText,
  Search,
  Pencil,
  Copy,
  Archive,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  Filter,
  Plus,
  RefreshCw,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  Send,
  X
} from 'lucide-react';

interface OrderMasterManagementViewProps {
  orders?: Record<string, Order>;
  productTypes?: Record<string, ProductType>;
  scheduledTasks?: ScheduledTaskItem[];
  currentUser?: User | null;
  approvedOperators?: string[];
  usersList?: User[];
  processProgressMap?: ProcessProgressMap;
  onUpdateOrder?: (updatedOrder: Order) => void;
  onDeleteOrder?: (orderId: string) => void;
  onArchiveOrder?: (orderId: string) => void;
  onRestoreOrder?: (orderId: string) => void;
  onCompleteAllOrderProcesses?: (
    orderId: string,
    forceComplete: boolean,
    overrideProcesses?: ProcessStep[],
    overrideQty?: number
  ) => void;
  onCompleteAllProcesses?: (
    orderId: string,
    forceComplete: boolean,
    overrideProcesses?: ProcessStep[],
    overrideQty?: number
  ) => void;
  onNavigateToNewOrder?: () => void;
  onNavigateToOrderForm?: () => void;
  onCopyOrderToNew?: (order: Order) => void;
}

export const OrderMasterManagementView: React.FC<OrderMasterManagementViewProps> = ({
  orders = {},
  productTypes = {},
  scheduledTasks = [],
  currentUser,
  approvedOperators = [],
  usersList = [],
  processProgressMap = {},
  onUpdateOrder,
  onDeleteOrder,
  onArchiveOrder,
  onRestoreOrder,
  onCompleteAllOrderProcesses,
  onCompleteAllProcesses,
  onNavigateToNewOrder,
  onNavigateToOrderForm,
  onCopyOrderToNew,
}) => {
  const completeAllFn = onCompleteAllOrderProcesses || onCompleteAllProcesses;
  const navigateToOrderFn = onNavigateToNewOrder || onNavigateToOrderForm;
  const canEditOrder =
    !currentUser ||
    currentUser.role === 'ADMIN' ||
    currentUser.permissions?.canEditOrder === true;

  const canArchive =
    !currentUser ||
    currentUser.role === 'ADMIN' ||
    currentUser.permissions?.canArchive === true;

  const [orderTableSearch, setOrderTableSearch] = useState('');
  const [orderTableFilter, setOrderTableFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [travelerOrder, setTravelerOrder] = useState<Order | null>(null);
  const [dispatchingOrder, setDispatchingOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const allOrdersList: Order[] = useMemo(() => {
    return (Object.values(orders) as Order[]).sort((a, b) => {
      return new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime();
    });
  }, [orders]);

  const activeCount = useMemo(
    () => allOrdersList.filter((o) => !o.archived && o.status !== 'COMPLETED').length,
    [allOrdersList]
  );
  const completedCount = useMemo(
    () => allOrdersList.filter((o) => o.status === 'COMPLETED' && !o.archived).length,
    [allOrdersList]
  );
  const archivedCount = useMemo(
    () => allOrdersList.filter((o) => o.archived).length,
    [allOrdersList]
  );

  const filteredOrders = useMemo(() => {
    return allOrdersList.filter((ord) => {
      // 1. Status filter
      if (orderTableFilter === 'ACTIVE' && (ord.archived || ord.status === 'COMPLETED')) return false;
      if (orderTableFilter === 'COMPLETED' && (ord.status !== 'COMPLETED' || ord.archived)) return false;
      if (orderTableFilter === 'ARCHIVED' && !ord.archived) return false;

      // 2. Type filter
      if (selectedTypeFilter !== 'ALL' && ord.typeId !== selectedTypeFilter) return false;

      // 3. Search query
      if (orderTableSearch.trim()) {
        const term = orderTableSearch.toLowerCase();
        const type = productTypes[ord.typeId];
        const matchName = ord.name.toLowerCase().includes(term);
        const matchId = ord.id.toLowerCase().includes(term);
        const matchType = type && type.name.toLowerCase().includes(term);
        const matchMemo = ord.memo && ord.memo.toLowerCase().includes(term);
        if (!matchName && !matchId && !matchType && !matchMemo) return false;
      }

      return true;
    });
  }, [allOrdersList, orderTableFilter, selectedTypeFilter, orderTableSearch, productTypes]);

  // Calculate order progress percentage
  const getOrderProgressInfo = (ord: Order) => {
    const type = productTypes[ord.typeId];
    const processes =
      ord.customProcesses && ord.customProcesses.length > 0
        ? ord.customProcesses
        : type?.processes || [];
    const totalCount = processes.length * (ord.qty || 1);

    if (totalCount === 0) return { completed: 0, total: 0, pct: 0 };

    let completed = 0;
    for (let q = 1; q <= ord.qty; q++) {
      processes.forEach((_, pIdx) => {
        const pKey = `${ord.id}_Q${q}_P${pIdx}`;
        if (processProgressMap[pKey]?.isCompleted) {
          completed++;
        }
      });
    }

    const pct = Math.round((completed / totalCount) * 100);
    return { completed, total: totalCount, pct };
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto p-4 sm:p-6 space-y-5">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-sm shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>수주관리</span>
              <span className="text-xs bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                Order Master
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              등록된 모든 수주의 실시간 공정 상태 추적, 사양 수정, 보관함 이동 및 원클릭 복사
            </p>
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="flex items-center gap-2">
          {navigateToOrderFn && (
            <button
              onClick={navigateToOrderFn}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>신규 수주 등록하기</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setOrderTableFilter('ALL')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            orderTableFilter === 'ALL'
              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 shadow-xs'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">전체 등록 수주</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {allOrdersList.length}<span className="text-xs font-medium ml-1">건</span>
          </div>
        </div>

        <div
          onClick={() => setOrderTableFilter('ACTIVE')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            orderTableFilter === 'ACTIVE'
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 shadow-xs'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>생산 진행중 수주</span>
          </div>
          <div className="text-2xl font-black text-amber-800 dark:text-amber-300 mt-1">
            {activeCount}<span className="text-xs font-medium ml-1">건</span>
          </div>
        </div>

        <div
          onClick={() => setOrderTableFilter('COMPLETED')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            orderTableFilter === 'COMPLETED'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 shadow-xs'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>공정 완료 수주</span>
          </div>
          <div className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-1">
            {completedCount}<span className="text-xs font-medium ml-1">건</span>
          </div>
        </div>

        <div
          onClick={() => setOrderTableFilter('ARCHIVED')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            orderTableFilter === 'ARCHIVED'
              ? 'bg-[#FFF9EB] dark:bg-amber-950/40 border-[#FCD34D] dark:border-amber-700/80 shadow-xs'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-300'
          }`}
        >
          <div className="text-[11px] font-bold text-[#B45309] dark:text-amber-400 flex items-center gap-1">
            <Archive className="w-3.5 h-3.5 text-[#B45309] dark:text-amber-400" />
            <span>완료 보관함 (아카이브)</span>
          </div>
          <div className="text-2xl font-black text-[#B45309] dark:text-amber-300 mt-1">
            {archivedCount}<span className="text-xs font-medium ml-1">건</span>
          </div>
        </div>
      </div>

      {/* Order Master Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs p-4 sm:p-5 space-y-4">
        {/* Table Filter & Search Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setOrderTableFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                orderTableFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              전체 ({allOrdersList.length})
            </button>
            <button
              type="button"
              onClick={() => setOrderTableFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg transition ${
                orderTableFilter === 'ACTIVE'
                  ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              진행중 ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setOrderTableFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg transition ${
                orderTableFilter === 'COMPLETED'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              완료 ({completedCount})
            </button>
            <button
              type="button"
              onClick={() => setOrderTableFilter('ARCHIVED')}
              className={`px-3 py-1.5 rounded-lg transition ${
                orderTableFilter === 'ARCHIVED'
                  ? 'bg-[#FFF9EB] dark:bg-amber-950/50 text-[#B45309] dark:text-amber-300 border border-[#FCD34D]/80 shadow-2xs font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#B45309]'
              }`}
            >
              보관함 ({archivedCount})
            </button>
          </div>

          {/* Type Selector & Search Input */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            {/* Product Type Filter */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="p-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">전체 제품 타입</option>
              {(Object.values(productTypes) as ProductType[]).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="수주명 또는 ID 검색..."
                value={orderTableSearch}
                onChange={(e) => setOrderTableSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Master Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-2xs">
          <table className="w-full text-left text-xs min-w-[1080px]">
            <thead className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th className="p-3 min-w-[220px]">수주번호 / 프로젝트명</th>
                <th className="p-3 min-w-[160px]">제품 타입 (공정 구성)</th>
                <th className="p-3 text-center w-16">수량</th>
                <th className="p-3 text-center min-w-[130px]">착수 일시</th>
                <th className="p-3 text-center min-w-[130px]">공정 진행률</th>
                <th className="p-3 text-center min-w-[100px] whitespace-nowrap">상태</th>
                <th className="p-3 text-center min-w-[360px]">수주 관리 및 수정 액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-800 dark:text-slate-200 font-semibold">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 dark:text-slate-500 font-bold">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    검색 조건에 일치하는 수주 건이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const type = productTypes[ord.typeId];
                  const { completed, total, pct } = getOrderProgressInfo(ord);
                  const isDone = ord.status === 'COMPLETED';
                  const isArch = ord.archived;

                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition"
                    >
                      {/* Order Name & ID */}
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {ord.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                            ID: {ord.id}
                          </span>
                          {ord.memo && (
                            <span className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                              💬 {ord.memo}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Product Type */}
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {type?.name || '커스텀 공정'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            총 {ord.customProcesses?.length || type?.processes.length || 0}개 공정
                          </span>
                        </div>
                      </td>

                      {/* Qty */}
                      <td className="p-3 text-center">
                        <span className="inline-block bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {ord.qty}개
                        </span>
                      </td>

                      {/* Start Date */}
                      <td className="p-3 text-center text-[11px] font-mono text-slate-600 dark:text-slate-300">
                        {ord.startDate ? ord.startDate.replace('T', ' ') : '-'}
                      </td>

                      {/* Progress Bar */}
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1 w-full max-w-[120px] mx-auto">
                          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className={`h-full transition-all duration-300 ${
                                isDone
                                  ? 'bg-emerald-500'
                                  : pct > 50
                                  ? 'bg-blue-500'
                                  : pct > 0
                                  ? 'bg-amber-500'
                                  : 'bg-slate-300 dark:bg-slate-600'
                              }`}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {pct}% ({completed}/{total})
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {isArch ? (
                          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black whitespace-nowrap shrink-0 bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-2xs">
                            <Archive className="w-3.5 h-3.5" />
                            <span>보관됨</span>
                          </span>
                        ) : isDone ? (
                          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black whitespace-nowrap shrink-0 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>완료</span>
                          </span>
                        ) : ord.status === 'DISPATCHED' ? (
                          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black whitespace-nowrap shrink-0 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700 shadow-2xs">
                            <Send className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>배포완료</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black whitespace-nowrap shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>배포대기</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-nowrap whitespace-nowrap">
                          {/* Dispatch Trigger Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (!canEditOrder) {
                                alert('⚠️ 수주 배포 권한이 없습니다.');
                                return;
                              }
                              setDispatchingOrder(ord);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black transition flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer active:scale-95 ${
                              ord.status === 'DISPATCHED'
                                ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-950/50 dark:text-blue-300'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                            }`}
                            title={
                              ord.status === 'DISPATCHED'
                                ? '현장 작업자들에게 배포된 공정 지시 및 딥링크를 재전송합니다.'
                                : '설비 및 담당자 지정 후 수주를 확정하고 네이버웍스 메일 및 딥링크를 현장 작업자에게 일괄 배포합니다.'
                            }
                          >
                            <Send className="w-3 h-3" />
                            <span>{ord.status === 'DISPATCHED' ? '재배포' : '현장 배포'}</span>
                          </button>

                          {/* Process Traveler Print Button */}
                          <button
                            type="button"
                            onClick={() => setTravelerOrder(ord)}
                            className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 px-2 py-1.5 rounded-lg text-[11px] font-black transition flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 shadow-2xs"
                            title="현장 배포용 공식 공정 이동표(Process Traveler) A4 양식 조회 및 인쇄"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>공정 이동표</span>
                          </button>

                          {/* Edit / Modify Specs Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (!canEditOrder) {
                                alert('⚠️ 수주 수정 권한이 없습니다.');
                                return;
                              }
                              setEditingOrder(ord);
                            }}
                            className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shrink-0 ${
                              canEditOrder
                                ? 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 cursor-pointer active:scale-95'
                                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                            }`}
                            title="수주 기본정보 및 공정 구성 단계 수정"
                          >
                            <Pencil className="w-3 h-3 text-blue-600" />
                            <span>수정/편집</span>
                          </button>

                          {/* Copy Specs to New Order */}
                          <button
                            type="button"
                            onClick={() => {
                              if (onCopyOrderToNew) {
                                onCopyOrderToNew(ord);
                              }
                            }}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-2 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
                            title="이 수주의 공정 구성 및 설비/담당자를 신규 수주 등록으로 복사합니다."
                          >
                            <Copy className="w-3 h-3 text-slate-600" />
                            <span>사양복사</span>
                          </button>

                          {/* Archive Button */}
                          {!ord.archived && onArchiveOrder && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!canArchive) {
                                  alert('⚠️ 보관함 이동 권한이 없습니다.');
                                  return;
                                }
                                onArchiveOrder(ord.id);
                              }}
                              className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shrink-0 ${
                                canArchive
                                  ? 'bg-[#FFF9EB] hover:bg-[#FEF3D6] dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-[#B45309] dark:text-amber-300 border border-[#FCD34D] dark:border-amber-700/80 cursor-pointer active:scale-95 shadow-2xs'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                              }`}
                              title="완료 보관함으로 이동"
                            >
                              <Archive className="w-3 h-3 text-[#B45309] dark:text-amber-400" />
                              <span>보관</span>
                            </button>
                          )}

                          {/* Delete Button */}
                          {onDeleteOrder && (
                            <button
                              type="button"
                              onClick={() => {
                                setOrderToDelete(ord);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 border border-transparent hover:border-red-200 dark:hover:border-red-900/50 transition cursor-pointer shrink-0"
                              title="수주 영구 삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-red-50/60 dark:bg-red-950/30">
              <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/50">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">수주 데이터 영구 삭제</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">관련 공정 구성 및 생산 현황이 함께 삭제됩니다.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {orderToDelete.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                  <span>수주번호: <strong>{orderToDelete.id}</strong></span>
                  <span>|</span>
                  <span>발주(PO): <strong>{orderToDelete.poNumber || '-'}</strong></span>
                  <span>|</span>
                  <span>수량: <strong>{orderToDelete.qty}개</strong></span>
                </div>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-300 text-[11px] flex items-start gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <span>삭제된 수주 프로젝트는 복구할 수 없으며, 데이터베이스 및 공정 진행 현황에서 즉시 완전히 제거됩니다.</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteOrder) {
                    onDeleteOrder(orderToDelete.id);
                  }
                  setOrderToDelete(null);
                }}
                className="px-4 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>영구 삭제 실행</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <EditOrderModal
          isOpen={!!editingOrder}
          onClose={() => setEditingOrder(null)}
          order={editingOrder}
          productTypes={productTypes}
          onUpdateOrder={onUpdateOrder || (() => {})}
          onDeleteOrder={onDeleteOrder || (() => {})}
          onCompleteAllOrderProcesses={onCompleteAllOrderProcesses}
          onArchiveOrder={onArchiveOrder}
          approvedOperators={approvedOperators}
        />
      )}

      {/* Official Process Traveler Modal */}
      {travelerOrder && (
        <ProcessTravelerModal
          isOpen={!!travelerOrder}
          onClose={() => setTravelerOrder(null)}
          order={travelerOrder}
          productTypes={productTypes}
          currentUser={currentUser}
          processProgressMap={processProgressMap}
          onUpdateOrder={onUpdateOrder}
        />
      )}

      {/* Field Dispatch & Notification Modal */}
      {dispatchingOrder && (
        <DispatchModal
          isOpen={!!dispatchingOrder}
          onClose={() => setDispatchingOrder(null)}
          order={dispatchingOrder}
          processes={
            dispatchingOrder.customProcesses && dispatchingOrder.customProcesses.length > 0
              ? dispatchingOrder.customProcesses
              : productTypes[dispatchingOrder.typeId]?.processes || []
          }
          usersList={usersList}
          currentUser={currentUser}
          onDispatchSuccess={(res) => {
            if (onUpdateOrder && dispatchingOrder) {
              onUpdateOrder({
                ...dispatchingOrder,
                status: 'DISPATCHED',
                dispatchedAt: new Date().toISOString(),
              });
            }
          }}
        />
      )}
    </div>
  );
};
