import React, { useState, useMemo, useRef } from 'react';
import { ScheduledTaskItem, Order, ProcessProgressItem } from '../types';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  Wrench,
  Sparkles
} from 'lucide-react';
import { KOREAN_DAYS } from '../data/defaultData';

interface GanttChartProps {
  items?: ScheduledTaskItem[];
  scheduledTasks?: ScheduledTaskItem[];
  filteredTasks?: ScheduledTaskItem[];
  itemsMap?: Map<number, ScheduledTaskItem>;
  minStart?: Date | null;
  maxEnd?: Date | null;
  totalWorkingHours?: number;
  onSelectItem?: (item: ScheduledTaskItem) => void;
  onSelectTask?: (key: string) => void;
  selectedItemKey?: string | null;
  orders?: Record<string, Order>;
  filterOptions?: any;
  setFilterOptions?: any;
  onUpdateProgress?: (processKey: string, progress: ProcessProgressItem) => void;
}

const parseSafeDate = (val: any): Date => {
  if (!val) return new Date();
  if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
  if (typeof val.toDate === 'function') return val.toDate();
  if (typeof val === 'object' && 'seconds' in val) return new Date(val.seconds * 1000);
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
};

export const GanttChart: React.FC<GanttChartProps> = ({
  items,
  scheduledTasks,
  filteredTasks,
  onSelectItem,
  onSelectTask,
  selectedItemKey,
  orders = {},
}) => {
  const taskList = items || filteredTasks || scheduledTasks || [];
  const containerRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<'ALL' | 'SINGLE'>('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 80, 100, 120, 150 px per day

  // Build unique orders list
  const uniqueOrders = useMemo(() => {
    const map = new Map<string, { id: string; name: string; qty?: number }>();
    if (orders) {
      (Object.values(orders) as Order[]).forEach((ord) => {
        if (!ord.archived) {
          map.set(ord.id, { id: ord.id, name: ord.name, qty: ord.qty });
        }
      });
    }
    taskList.forEach((item) => {
      if (!map.has(item.orderId)) {
        map.set(item.orderId, { id: item.orderId, name: item.orderName });
      }
    });
    return Array.from(map.values());
  }, [taskList, orders]);

  // Filter items based on viewMode and selectedOrderId
  const displayItems = useMemo(() => {
    if (viewMode === 'SINGLE' && selectedOrderId) {
      return taskList.filter((item) => item.orderId === selectedOrderId);
    }
    return taskList;
  }, [taskList, viewMode, selectedOrderId]);

  // Determine global min and max dates
  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (displayItems.length === 0) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 12);
      return { minDate: start, maxDate: end, totalDays: 14 };
    }

    let minT = Infinity;
    let maxT = -Infinity;

    displayItems.forEach((t) => {
      const s = parseSafeDate(t.plannedStart || t.start).getTime();
      const e = parseSafeDate(t.plannedEnd || t.end).getTime();
      if (s < minT) minT = s;
      if (e > maxT) maxT = e;
    });

    const start = new Date(minT);
    start.setHours(0, 0, 0, 0);
    // Add 1 day buffer before
    start.setDate(start.getDate() - 1);

    const end = new Date(maxT);
    end.setHours(23, 59, 59, 999);
    // Add 2 days buffer after
    end.setDate(end.getDate() + 2);

    const diffDays = Math.max(7, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    return { minDate: start, maxDate: end, totalDays: diffDays };
  }, [displayItems]);

  // Generate days array for timeline header
  const timelineDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(minDate);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [minDate, totalDays]);

  // Group tasks by process / group key
  const groupedTasks = useMemo(() => {
    const map = new Map<string, { groupKey: string; groupName: string; orderName: string; tasks: ScheduledTaskItem[] }>();
    displayItems.forEach((item) => {
      if (!map.has(item.groupKey)) {
        map.set(item.groupKey, {
          groupKey: item.groupKey,
          groupName: item.groupName,
          orderName: item.orderName,
          tasks: [],
        });
      }
      map.get(item.groupKey)!.tasks.push(item);
    });
    return Array.from(map.values());
  }, [displayItems]);

  const dayWidthPx = (zoomLevel / 100) * 90; // Default 90px per day

  const getTaskStyle = (item: ScheduledTaskItem) => {
    switch (item.status) {
      case 'COMPLETED':
        return 'bg-emerald-500 text-white border-emerald-600';
      case 'IN_PROGRESS':
        return 'bg-amber-500 text-slate-900 border-amber-600 shadow-sm animate-pulse';
      case 'PAUSED':
        return 'bg-orange-500 text-white border-orange-600';
      case 'DELAYED':
        return 'bg-rose-500 text-white border-rose-600';
      default:
        return 'bg-blue-600 text-white border-blue-700';
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden font-sans select-none">
      {/* Header Controls */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              공정 타임라인 (Gantt Chart)
            </h2>
            <p className="text-[11px] text-slate-500">
              수주별 공정 흐름 및 설비 일정 배치
            </p>
          </div>
        </div>

        {/* View Mode & Order Selection */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-bold">
            <button
              onClick={() => setViewMode('ALL')}
              className={`px-3 py-1 rounded-md transition ${
                viewMode === 'ALL'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              전체 수주 ({uniqueOrders.length})
            </button>
            <button
              onClick={() => {
                setViewMode('SINGLE');
                if (!selectedOrderId && uniqueOrders.length > 0) {
                  setSelectedOrderId(uniqueOrders[0].id);
                }
              }}
              className={`px-3 py-1 rounded-md transition ${
                viewMode === 'SINGLE'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              단일 수주
            </button>
          </div>

          {viewMode === 'SINGLE' && (
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="p-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
            >
              {uniqueOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} {o.qty ? `(${o.qty}EA)` : ''}
                </option>
              ))}
            </select>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(60, z - 20))}
              className="p-1 text-slate-500 hover:text-slate-800 rounded"
              title="축소"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-slate-600 px-1">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(180, z + 20))}
              className="p-1 text-slate-500 hover:text-slate-800 rounded"
              title="확대"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Gantt Body */}
      <div ref={containerRef} className="flex-1 overflow-auto relative flex flex-col bg-white">
        <div
          style={{ width: `${220 + totalDays * dayWidthPx}px` }}
          className="flex flex-col min-h-full"
        >
          {/* Header Row */}
          <div className="sticky top-0 z-20 flex bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">
            {/* Left Label Header */}
            <div className="w-[220px] shrink-0 p-2.5 border-r border-slate-200 bg-slate-100 flex items-center justify-between">
              <span>수주 / 공정명</span>
              <span className="text-[10px] text-slate-400 font-mono">Total {groupedTasks.length}</span>
            </div>

            {/* Dates Grid Header */}
            <div className="flex flex-1">
              {timelineDays.map((d, idx) => {
                const isSun = d.getDay() === 0;
                const isSat = d.getDay() === 6;
                const isToday =
                  d.getFullYear() === new Date().getFullYear() &&
                  d.getMonth() === new Date().getMonth() &&
                  d.getDate() === new Date().getDate();

                return (
                  <div
                    key={idx}
                    style={{ width: `${dayWidthPx}px` }}
                    className={`shrink-0 border-r border-slate-200 p-1 text-center flex flex-col justify-center ${
                      isToday ? 'bg-blue-100/50' : isSun || isSat ? 'bg-slate-200/30' : ''
                    }`}
                  >
                    <span className={`text-[10px] ${isSun ? 'text-rose-500' : isSat ? 'text-blue-500' : 'text-slate-500'}`}>
                      {KOREAN_DAYS[d.getDay()]}
                    </span>
                    <span className={`text-xs font-bold ${isToday ? 'text-blue-600 font-black' : 'text-slate-800'}`}>
                      {d.getMonth() + 1}.{d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group Rows */}
          {groupedTasks.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              표시할 공정 일정이 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 flex-1">
              {groupedTasks.map((group) => (
                <div key={group.groupKey} className="flex hover:bg-slate-50/70 transition">
                  {/* Left Group Label */}
                  <div className="w-[220px] shrink-0 p-2.5 border-r border-slate-200 bg-white/90 flex flex-col justify-center truncate">
                    <span className="text-[10px] text-blue-600 font-bold truncate">
                      [{group.orderName}]
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {group.groupName}
                    </span>
                  </div>

                  {/* Right Timeline Canvas */}
                  <div className="flex-1 relative h-12 flex items-center">
                    {/* Background Day Columns */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {timelineDays.map((d, idx) => {
                        const isSun = d.getDay() === 0;
                        const isSat = d.getDay() === 6;
                        return (
                          <div
                            key={idx}
                            style={{ width: `${dayWidthPx}px` }}
                            className={`shrink-0 border-r border-slate-100 h-full ${
                              isSun || isSat ? 'bg-slate-50/50' : ''
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Task Bars */}
                    {group.tasks.map((task) => {
                      const s = parseSafeDate(task.plannedStart || task.start);
                      const e = parseSafeDate(task.plannedEnd || task.end);

                      const offsetDays = (s.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
                      const durDays = Math.max(0.1, (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));

                      const leftPx = offsetDays * dayWidthPx;
                      const widthPx = Math.max(30, durDays * dayWidthPx);

                      const styleClass = getTaskStyle(task);

                      return (
                        <div
                          key={task.processKey}
                          onClick={() => {
                            if (onSelectItem) onSelectItem(task);
                            if (onSelectTask) onSelectTask(task.processKey);
                          }}
                          style={{
                            left: `${leftPx}px`,
                            width: `${widthPx}px`,
                          }}
                          className={`absolute h-7 rounded-md border text-[11px] font-bold px-2 flex items-center justify-between cursor-pointer transition shadow-2xs hover:shadow-md hover:scale-[1.01] z-10 truncate ${styleClass}`}
                          title={`[${task.orderName}] ${task.groupName}\n시간: ${s.toLocaleString()} ~ ${e.toLocaleString()}\n설비: ${task.machine || '미지정'}\n작업자: ${task.worker || '미지정'}`}
                        >
                          <span className="truncate mr-1">{task.groupName}</span>
                          <span className="text-[9px] opacity-90 font-mono shrink-0">
                            {task.duration || 1}h
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
