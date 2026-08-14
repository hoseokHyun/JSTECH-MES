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
} from 'lucide-react';

interface OrderMasterManagementViewProps {
  orders: Record<string, Order>;
  productTypes: Record<string, ProductType>;
  scheduledTasks?: ScheduledTaskItem[];
  currentUser?: User | null;
  processProgressMap?: ProcessProgressMap;
  onUpdateOrder?: (updatedOrder: Order) => void;
  onDeleteOrder?: (orderId: string) => void;
  onArchiveOrder?: (orderId: string) => void;
  onCompleteAllOrderProcesses?: (
    orderId: string,
    forceComplete: boolean,
    overrideProcesses?: ProcessStep[],
    overrideQty?: number
  ) => void;
  onNavigateToNewOrder?: () => void;
  onCopyOrderToNew?: (order: Order) => void;
}

export const OrderMasterManagementView: React.FC<OrderMasterManagementViewProps> = ({
  orders,
  productTypes,
  scheduledTasks = [],
  currentUser,
  processProgressMap = {},
  onUpdateOrder,
  onDeleteOrder,
  onArchiveOrder,
  onCompleteAllOrderProcesses,
  onNavigateToNewOrder,
  onCopyOrderToNew,
}) => {
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
          {onNavigateToNewOrder && (
            <button
              onClick={onNavigateToNewOrder}
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
              ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-400 shadow-xs'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1">
            <Archive className="w-3.5 h-3.5" />
            <span>완료 보관함 (아카이브)</span>
          </div>
          <div className="text-2xl font-black text-purple-800 dark:text-purple-300 mt-1">
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
                  ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
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
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th className="p-3 min-w-[220px]">수주번호 / 프로젝트명</th>
                <th className="p-3 min-w-[160px]">제품 타입 (BOP)</th>
                <th className="p-3 text-center w-20">수량</th>
                <th className="p-3 text-center min-w-[130px]">착수 일시</th>
                <th className="p-3 text-center min-w-[140px]">공정 진행률</th>
                <th className="p-3 text-center w-24">상태</th>
                <th className="p-3 text-center min-w-[230px]">수주 관리 및 수정 액션</th>
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
                      <td className="p-3 text-center">
                        {isArch ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <Archive className="w-3 h-3" />
                            보관됨
                          </span>
                        ) : isDone ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            완료
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            진행중
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
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
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                              canEditOrder
                                ? 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 cursor-pointer active:scale-95'
                                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                            }`}
                            title="수주 기본정보 및 공정 라우팅 단계 수정"
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
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
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
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                                canArchive
                                  ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 cursor-pointer active:scale-95'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                              }`}
                              title="완료 보관함으로 이동"
                            >
                              <Archive className="w-3 h-3 text-amber-600" />
                              <span>보관</span>
                            </button>
                          )}

                          {/* Delete Button */}
                          {onDeleteOrder && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!canArchive) {
                                  alert('⚠️ 삭제 권한이 없습니다.');
                                  return;
                                }
                                onDeleteOrder(ord.id);
                              }}
                              className={`p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer ${
                                !canArchive ? 'opacity-40 cursor-not-allowed' : ''
                              }`}
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
        />
      )}
    </div>
  );
};
