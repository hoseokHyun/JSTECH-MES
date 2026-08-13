import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ScheduledTaskItem, Order } from '../types';
import {
  Calendar,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  Clock,
  Wrench,
  Sparkles,
  Layers,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface GanttChartProps {
  items: ScheduledTaskItem[];
  itemsMap: Map<number, ScheduledTaskItem>;
  minStart: Date | null;
  maxEnd: Date | null;
  totalWorkingHours: number;
  onSelectItem: (item: ScheduledTaskItem) => void;
  selectedItemKey: string | null;
  orders?: Record<string, Order>;
}

declare global {
  interface Window {
    vis?: {
      Timeline: new (
        container: HTMLElement,
        items: any[],
        groups: any[],
        options: any
      ) => any;
    };
  }
}

export const GanttChart: React.FC<GanttChartProps> = ({
  items,
  itemsMap,
  minStart,
  maxEnd,
  totalWorkingHours,
  onSelectItem,
  selectedItemKey,
  orders,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<any>(null);

  const [viewMode, setViewMode] = useState<'ALL' | 'SINGLE'>('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  // Build unique orders list from items and orders prop
  const uniqueOrders = useMemo(() => {
    const map = new Map<string, { id: string; name: string; qty?: number }>();
    if (orders) {
      (Object.values(orders) as Order[]).forEach((ord) => {
        if (!ord.archived) {
          map.set(ord.id, { id: ord.id, name: ord.name, qty: ord.qty });
        }
      });
    }
    items.forEach((item) => {
      if (!map.has(item.orderId)) {
        map.set(item.orderId, { id: item.orderId, name: item.orderName });
      }
    });
    return Array.from(map.values());
  }, [items, orders]);

  // Set default selected order if switching to SINGLE mode or if not set
  useEffect(() => {
    if (viewMode === 'SINGLE' && !selectedOrderId && uniqueOrders.length > 0) {
      setSelectedOrderId(uniqueOrders[0].id);
    }
  }, [viewMode, selectedOrderId, uniqueOrders]);

  // Filter items based on viewMode and selectedOrderId
  const displayItems = useMemo(() => {
    if (viewMode === 'SINGLE' && selectedOrderId) {
      return items.filter((item) => item.orderId === selectedOrderId);
    }
    return items;
  }, [items, viewMode, selectedOrderId]);

  // Calculate dynamic minStart / maxEnd and summary metrics for displayed tasks
  const { effectiveMinStart, effectiveMaxEnd, selectedOrderInfo } = useMemo(() => {
    if (displayItems.length === 0) {
      return {
        effectiveMinStart: minStart,
        effectiveMaxEnd: maxEnd,
        selectedOrderInfo: null,
      };
    }
    let minS: Date | null = null;
    let maxE: Date | null = null;
    let completedCount = 0;
    let totalDur = 0;

    displayItems.forEach((it) => {
      if (!minS || it.start < minS) minS = it.start;
      if (!maxE || it.end > maxE) maxE = it.end;
      if (it.isCompleted) completedCount++;
      totalDur += it.duration;
    });

    const pct = displayItems.length > 0 ? Math.round((completedCount / displayItems.length) * 100) : 0;
    const currentOrderObj = uniqueOrders.find((o) => o.id === selectedOrderId);

    return {
      effectiveMinStart: minS,
      effectiveMaxEnd: maxE,
      selectedOrderInfo: {
        id: selectedOrderId,
        name: currentOrderObj ? currentOrderObj.name : (displayItems[0]?.orderName || ''),
        qty: currentOrderObj?.qty || 1,
        totalTasks: displayItems.length,
        completedTasks: completedCount,
        progressPct: pct,
        totalHours: Math.round(totalDur * 10) / 10,
      },
    };
  }, [displayItems, minStart, maxEnd, selectedOrderId, uniqueOrders]);

  useEffect(() => {
    if (!containerRef.current || !window.vis || !window.vis.Timeline) return;

    if (displayItems.length === 0) {
      if (timelineRef.current) {
        try {
          timelineRef.current.destroy();
        } catch (e) {
          // ignore
        }
        timelineRef.current = null;
      }
      return;
    }

    // Build timeline groups
    const groupsMap = new Map<string, { id: string; content: string; orderVal: number }>();
    let groupOrderCounter = 1;

    displayItems.forEach((item) => {
      if (!groupsMap.has(item.groupKey)) {
        groupsMap.set(item.groupKey, {
          id: item.groupKey,
          content: `<div class="leading-tight"><span class="text-[10px] text-blue-600 font-bold block">[${item.orderName}]</span><span>${item.groupName}</span></div>`,
          orderVal: groupOrderCounter++,
        });
      }
    });

    const groups = Array.from(groupsMap.values());

    // Build vis items
    const visItems = displayItems.map((item) => {
      let cssClass = 'machining';
      if (item.category === '연마') cssClass = 'polishing';
      else if (item.category === '외주') cssClass = 'outsourcing';
      else if (item.category === '품질') cssClass = 'quality';

      if (item.isCompleted) cssClass = 'completed';

      return {
        id: item.id,
        group: item.groupKey,
        content: `${item.isCompleted ? '✓ ' : ''}#${item.productNo} ${item.content.replace(/^✓\s*/, '')}`,
        title: `#${item.productNo} ${item.content} (${item.duration}h) - ${item.worker ? '작업자: ' + item.worker : '작업자 미지정'}`,
        start: item.start,
        end: item.end,
        className: cssClass,
      };
    });

    const viewStart = effectiveMinStart
      ? new Date(effectiveMinStart.getTime() - 86400000)
      : new Date();
    const viewEnd = effectiveMaxEnd
      ? new Date(effectiveMaxEnd.getTime() + 86400000 * 2)
      : new Date();

    const options = {
      stack: false,
      start: viewStart,
      end: viewEnd,
      editable: false,
      margin: { item: 6, axis: 4 },
      orientation: 'top',
      groupOrder: 'orderVal',
      timeAxis: { scale: 'day', step: 1 },
      format: {
        minorLabels: function (date: Date) {
          const d = new Date(date);
          const days = ['일', '월', '화', '수', '목', '금', '토'];
          return `${d.getDate()}(${days[d.getDay()]})`;
        },
        majorLabels: { day: 'YYYY년 MM월', month: 'YYYY년 MM월' },
      },
    };

    if (timelineRef.current) {
      try {
        timelineRef.current.destroy();
      } catch (e) {
        // ignore cleanup errors
      }
      timelineRef.current = null;
    }

    containerRef.current.innerHTML = '';
    const timeline = new window.vis.Timeline(
      containerRef.current,
      visItems,
      groups,
      options
    );
    timelineRef.current = timeline;

    timeline.on('select', (properties: { items: number[] }) => {
      if (properties.items.length > 0) {
        const selectedId = properties.items[0];
        const selectedTask = itemsMap.get(selectedId);
        if (selectedTask) {
          onSelectItem(selectedTask);
        }
      }
    });

    return () => {
      if (timelineRef.current) {
        try {
          timelineRef.current.destroy();
        } catch (e) {
          // ignore cleanup errors
        }
        timelineRef.current = null;
      }
    };
  }, [displayItems, effectiveMinStart, effectiveMaxEnd]);

  // Handle Zoom In / Zoom Out / Reset
  const handleZoom = (percentage: number) => {
    if (!timelineRef.current) return;
    const range = timelineRef.current.getWindow();
    const interval = range.end - range.start;
    const newInterval = interval * percentage;
    const middle = (range.start.getTime() + range.end.getTime()) / 2;

    timelineRef.current.setWindow(
      new Date(middle - newInterval / 2),
      new Date(middle + newInterval / 2)
    );
  };

  const handleResetView = () => {
    if (!timelineRef.current || !effectiveMinStart || !effectiveMaxEnd) return;
    timelineRef.current.setWindow(
      new Date(effectiveMinStart.getTime() - 86400000),
      new Date(effectiveMaxEnd.getTime() + 86400000 * 2)
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
      {/* Chart Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>수주별 종합 공정 타임라인 (SAP DMC Gantt Chart)</span>
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            ※ 08:30~20:30 근무 적용 / 점심(12~13h), 저녁(17~17.5h), 주말 및 공휴일 자동 차감 계산
          </p>
        </div>

        {/* Legend & Zoom Controls */}
        <div className="flex items-center gap-3 flex-wrap text-xs">
          {/* Category Color Legend */}
          <div className="flex gap-2 text-[11px] font-bold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-blue-100 border border-blue-400 rounded-sm"></span>가공
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-emerald-100 border border-emerald-400 rounded-sm"></span>연마
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-amber-100 border border-amber-400 rounded-sm"></span>외주
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-purple-100 border border-purple-400 rounded-sm"></span>품질
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-red-100 border border-red-800 rounded-sm"></span>완료
            </span>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
            <button
              onClick={() => handleZoom(0.7)}
              className="px-2.5 py-1 hover:bg-slate-100 text-slate-700 font-bold border-r border-slate-200 flex items-center gap-1 cursor-pointer"
              title="확대"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(1.3)}
              className="px-2.5 py-1 hover:bg-slate-100 text-slate-700 font-bold border-r border-slate-200 flex items-center gap-1 cursor-pointer"
              title="축소"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetView}
              className="px-2.5 py-1 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
              title="전체 범위 맞춤"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mode Selector & Order Filter Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
        {/* Left: View Mode Toggle Buttons */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('ALL')}
            className={`px-3 py-1.5 rounded-md font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>전체 수주 보기</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                viewMode === 'ALL' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {uniqueOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('SINGLE');
              if (!selectedOrderId && uniqueOrders.length > 0) {
                setSelectedOrderId(uniqueOrders[0].id);
              }
            }}
            className={`px-3 py-1.5 rounded-md font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'SINGLE'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>선택한 수주만 보기</span>
          </button>
        </div>

        {/* Right: Single Order Dropdown & Quick Navigation */}
        {viewMode === 'SINGLE' && (
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <button
              type="button"
              disabled={uniqueOrders.findIndex((o) => o.id === selectedOrderId) <= 0}
              onClick={() => {
                const idx = uniqueOrders.findIndex((o) => o.id === selectedOrderId);
                if (idx > 0) setSelectedOrderId(uniqueOrders[idx - 1].id);
              }}
              className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-slate-700 font-bold transition cursor-pointer"
              title="이전 수주"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-black text-indigo-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none max-w-xs truncate shadow-2xs cursor-pointer"
            >
              {uniqueOrders.map((ord) => (
                <option key={ord.id} value={ord.id}>
                  {ord.name} {ord.qty ? `(${ord.qty}EA)` : ''}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={
                uniqueOrders.findIndex((o) => o.id === selectedOrderId) >= uniqueOrders.length - 1
              }
              onClick={() => {
                const idx = uniqueOrders.findIndex((o) => o.id === selectedOrderId);
                if (idx >= 0 && idx < uniqueOrders.length - 1) {
                  setSelectedOrderId(uniqueOrders[idx + 1].id);
                }
              }}
              className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-slate-700 font-bold transition cursor-pointer"
              title="다음 수주"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Selected Order Summary Card (When SINGLE view mode is active) */}
      {viewMode === 'SINGLE' && selectedOrderInfo && (
        <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-indigo-600 text-white font-black text-[10px]">
              선택 수주 Focus
            </span>
            <span className="font-black text-indigo-950 text-sm">
              {selectedOrderInfo.name}
            </span>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
              수량: {selectedOrderInfo.qty} EA
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-700 font-bold">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                공정 진척:{' '}
                <strong className="text-slate-900 font-black">
                  {selectedOrderInfo.completedTasks} / {selectedOrderInfo.totalTasks}
                </strong>{' '}
                ({selectedOrderInfo.progressPct}%)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                총 가동 소요:{' '}
                <strong className="text-slate-900 font-black">
                  {selectedOrderInfo.totalHours}시간
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Render Container */}
      {displayItems.length === 0 ? (
        <div className="text-center py-24 text-slate-400 text-xs font-bold bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
          선택한 조건에 해당하는 수주 공정 타임라인 데이터가 없습니다.
        </div>
      ) : (
        <div ref={containerRef} className="w-full min-h-[460px] overflow-x-auto" />
      )}
    </div>
  );
};

