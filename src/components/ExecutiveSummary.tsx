import React, { useState } from 'react';
import { Order, ProductType, ScheduledTaskItem, FilterOptions, ProcessStep, User } from '../types';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  Archive,
  Layers,
  ChevronRight,
  Sparkles,
  Trash2,
  Search,
  Filter,
  Pencil,
  Plus
} from 'lucide-react';
import { EditOrderModal } from './Modals';

interface ExecutiveSummaryProps {
  orders: Record<string, Order>;
  productTypes: Record<string, ProductType>;
  scheduledTasks: ScheduledTaskItem[];
  filterOptions: FilterOptions;
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onDeleteOrder: (orderId: string) => void;
  onArchiveOrder: (orderId: string) => void;
  onUpdateOrder: (updatedOrder: Order) => void;
  onOpenArchiveModal?: () => void;
  onNavigateToOrderForm?: () => void;
  onCompleteAllOrderProcesses?: (
    orderId: string,
    forceComplete: boolean,
    overrideProcesses?: ProcessStep[],
    overrideQty?: number
  ) => void;
  currentUser?: User | null;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  orders,
  productTypes,
  scheduledTasks,
  filterOptions,
  setFilterOptions,
  onDeleteOrder,
  onArchiveOrder,
  onUpdateOrder,
  onOpenArchiveModal,
  onNavigateToOrderForm,
  onCompleteAllOrderProcesses,
  currentUser,
}) => {
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Permission check for editing order details & archiving
  const canEditOrder =
    !currentUser ||
    currentUser.role === 'ADMIN' ||
    currentUser.permissions?.canEditOrder === true;
  const canArchive =
    !currentUser ||
    currentUser.role === 'ADMIN' ||
    currentUser.permissions?.canArchive === true;
  const activeOrders: Order[] = (Object.values(orders) as Order[]).filter((o) => !o.archived);
  
  // Calculate completion percentage for each order based on scheduledTasks
  const orderProgressMap = activeOrders.reduce((acc, ord) => {
    const tasks = scheduledTasks.filter((t) => t.orderId === ord.id);
    const completed = tasks.filter((t) => t.isCompleted).length;
    const total = tasks.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    acc[ord.id] = { completed, total, pct };
    return acc;
  }, {} as Record<string, { completed: number; total: number; pct: number }>);

  const completedTasksCount = scheduledTasks.filter((t) => t.isCompleted).length;
  const totalTasksCount = scheduledTasks.length;
  const totalWorkingHours = scheduledTasks.reduce((acc, t) => acc + t.duration, 0);

  const overallProgressPct =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const inProgressList: Order[] = activeOrders.filter((o) => (orderProgressMap[o.id]?.pct || 0) < 100);
  const completedList: Order[] = activeOrders.filter((o) => (orderProgressMap[o.id]?.pct || 0) === 100);
  const archivedList: Order[] = (Object.values(orders) as Order[]).filter((o) => o.archived);

  return (
    <section className="w-full space-y-4">
      {/* Top Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: In Progress */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm flex items-center justify-between hover:border-[#00C4B4] transition">
          <div>
            <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#00C4B4]" />
              진행중 수주 건수
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {inProgressList.length} <span className="text-xs font-semibold text-slate-500">건</span>
            </div>
            <p className="text-[10px] text-[#00A396] font-bold mt-1 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> 실시간 스케줄링 가동중
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#00C4B4]/10 border border-[#00C4B4]/30 flex items-center justify-center text-[#00A396] font-extrabold text-sm">
            🔄
          </div>
        </div>

        {/* Card 2: Completed */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm flex items-center justify-between hover:border-emerald-300 transition">
          <div>
            <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              공정 완료 수주
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {completedList.length} <span className="text-xs font-semibold text-slate-500">건</span>
            </div>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">
              품질/CMM 최종검사 완료
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-extrabold text-sm">
            ✅
          </div>
        </div>

        {/* Card 3: Overall Progress % */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm flex items-center justify-between hover:border-indigo-300 transition">
          <div className="w-full">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                전체 세부공정 달성률
              </span>
              <span className="text-indigo-600 font-extrabold">{overallProgressPct}%</span>
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">
              {completedTasksCount} / {totalTasksCount}{' '}
              <span className="text-xs font-normal text-slate-500">공정 완료</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-1.5 border border-slate-200">
              <div
                className="bg-gradient-to-r from-[#0B3A82] to-[#00C4B4] h-2 rounded-full transition-all duration-500"
                style={{ width: `${overallProgressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Total Lead Time */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm flex items-center justify-between hover:border-amber-300 transition">
          <div>
            <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              총 필요 작업시간 (Day/Hour)
            </div>
            <div className="text-xl font-black text-slate-900 mt-1 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl font-black text-slate-900">
                {Math.round(totalWorkingHours / 8)}일
              </span>
              <span className="text-slate-400 font-bold mx-0.5">/</span>
              <span className="text-xl font-black text-slate-900">
                {totalWorkingHours.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}시간
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-1">
              보관함 이동 수주: <span className="font-bold text-amber-700">{archivedList.length}건</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-extrabold text-sm shrink-0">
            ⏱️
          </div>
        </div>
      </div>

      {/* Main Executive Order Status Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                수주 종합 현황 (Executive Order Master)
              </h2>
              <p className="text-[11px] text-slate-500">
                담당자가 등록한 수주 정보 및 실시간 공정 달성률 요약
              </p>
            </div>
          </div>

          <div className="flex gap-2 text-xs flex-wrap">
            <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-bold flex items-center gap-1">
              🔄 진행중: <span className="text-blue-900 font-extrabold">{inProgressList.length}</span>건
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold flex items-center gap-1">
              ✅ 완료: <span className="text-emerald-900 font-extrabold">{completedList.length}</span>건
            </span>
            <button
              onClick={onOpenArchiveModal}
              className="bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 px-3 py-1 rounded-full font-bold flex items-center gap-1 transition cursor-pointer"
              title="완료 수주 보관함 열기"
            >
              📦 보관함: <span className="text-amber-900 font-extrabold">{archivedList.length}</span>건
            </button>
            {onNavigateToOrderForm && (
              <button
                onClick={() => {
                  if (!canEditOrder) {
                    alert('⚠️ 신규 수주 등록 권한이 없습니다.\n(현장담당자 계정은 신규 수주 등록이 제한되어 있습니다. 관리자 또는 영업담당자 계정으로 로그인해주세요.)');
                    return;
                  }
                  onNavigateToOrderForm();
                }}
                className={`px-3.5 py-1 rounded-full font-black flex items-center gap-1.5 transition shadow-xs ml-1 ${
                  canEditOrder
                    ? 'bg-[#0B3A82] hover:bg-[#00C4B4] text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-500 border border-slate-300 opacity-70 cursor-not-allowed'
                }`}
                title={canEditOrder ? "신규 수주 등록 페이지로 이동" : "신규 수주 등록 권한 없음 (관리자/영업 전용)"}
              >
                <Plus className="w-3.5 h-3.5 text-[#00C4B4]" />
                <span>신규 수주 등록</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls for Dashboard Timeline */}
        <div className="flex flex-wrap gap-2 items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={filterOptions.searchQuery}
              onChange={(e) =>
                setFilterOptions((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              placeholder="수주명 또는 작업자 검색..."
              className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded bg-white font-semibold"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold">공정구분:</span>
            <select
              value={filterOptions.category}
              onChange={(e) =>
                setFilterOptions((prev) => ({ ...prev, category: e.target.value }))
              }
              className="text-xs px-2 py-1 border border-slate-300 rounded bg-white font-bold"
            >
              <option value="ALL">전체</option>
              <option value="가공">가공</option>
              <option value="연마">연마</option>
              <option value="외주">외주</option>
              <option value="품질">품질</option>
            </select>

            <span className="text-slate-500 font-bold ml-2">상태:</span>
            <select
              value={filterOptions.completionStatus}
              onChange={(e) =>
                setFilterOptions((prev) => ({ ...prev, completionStatus: e.target.value }))
              }
              className="text-xs px-2 py-1 border border-slate-300 rounded bg-white font-bold"
            >
              <option value="ALL">전체</option>
              <option value="PENDING">진행 대기/중</option>
              <option value="COMPLETED">완료됨</option>
            </select>
          </div>
        </div>

        {/* Order Status Table */}
        <div className="overflow-x-auto max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10 shadow-2xs">
              <tr>
                <th className="p-2.5">수주번호 / 프로젝트명</th>
                <th className="p-2.5">제품 타입</th>
                <th className="p-2.5 text-center">수량</th>
                <th className="p-2.5 text-center">시작일시</th>
                <th className="p-2.5 text-center">공정 진행율</th>
                <th className="p-2.5 text-center">상태</th>
                <th className="p-2.5 text-center">관리 / 보관</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {activeOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 font-semibold">
                    등록된 수주 건이 없습니다. '신규 수주 등록'에서 수주를 새로 등록해 주세요.
                  </td>
                </tr>
              ) : (
                activeOrders.map((ord: Order) => {
                  const type = productTypes[ord.typeId];
                  const typeName = type ? type.name : '-';
                  const prog = orderProgressMap[ord.id] || { completed: 0, total: 0, pct: 0 };
                  const isCompleted = prog.pct === 100;

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-bold text-slate-900">
                        <span>{ord.name}</span>
                      </td>
                      <td className="p-2.5 text-slate-600 font-medium">{typeName}</td>
                      <td className="p-2.5 text-center font-bold text-slate-800">{ord.qty}개</td>
                      <td className="p-2.5 text-center text-slate-900 font-extrabold font-mono">
                        {ord.startDate ? ord.startDate.replace('T', ' ') : '-'}
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${prog.pct}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-[11px] text-slate-700">
                            {prog.pct}%
                          </span>
                        </div>
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => {
                            if (onCompleteAllOrderProcesses) {
                              onCompleteAllOrderProcesses(ord.id, !isCompleted);
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-black transition cursor-pointer hover:opacity-80 active:scale-95 ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                          title="클릭하여 공정 상태 전환 (진행중 ↔ 완료)"
                        >
                          {isCompleted ? '✅ 공정 완료' : '🔄 진행중'}
                        </button>
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              if (!canEditOrder) {
                                alert('⚠️ 수주 정보 수정 권한이 없습니다.\n(수주 스펙 수정 및 삭제는 시스템 관리자(ADMIN)만 가능합니다.)');
                                return;
                              }
                              setEditingOrder(ord);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-0.5 ${
                              canEditOrder
                                ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer'
                                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                            }`}
                            title={canEditOrder ? "수주 정보 수정" : "수주 정보 수정 권한 없음 (관리자 전용)"}
                          >
                            <Pencil className="w-3 h-3 text-blue-600" />
                            <span>수정</span>
                          </button>
                          <button
                            onClick={() => {
                              if (!canArchive) {
                                alert('⚠️ 수주 보관함 이동 권한이 없습니다.\n(수주 보관 처리 및 관리는 관리자(ADMIN) 또는 영업/수주 담당자 권한이 필요합니다.)');
                                return;
                              }
                              if (isCompleted) {
                                onArchiveOrder(ord.id);
                              } else {
                                if (onCompleteAllOrderProcesses) {
                                  onCompleteAllOrderProcesses(ord.id, true);
                                }
                                onArchiveOrder(ord.id);
                              }
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-0.5 ${
                              canArchive
                                ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer active:scale-95'
                                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                            }`}
                            title={canArchive ? "완료 보관함으로 이동" : "수주 보관 권한 없음 (관리자/영업 전용)"}
                          >
                            <Archive className="w-3 h-3 text-amber-600" />
                            <span>보관함</span>
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

      {/* Edit Order Modal */}
      <EditOrderModal
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        order={editingOrder}
        productTypes={productTypes}
        onUpdateOrder={onUpdateOrder}
        onDeleteOrder={onDeleteOrder}
        onCompleteAllOrderProcesses={onCompleteAllOrderProcesses}
        onArchiveOrder={onArchiveOrder}
        onOpenArchiveModal={onOpenArchiveModal}
      />
    </section>
  );
};
