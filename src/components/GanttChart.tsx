import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ScheduledTaskItem, Order, ProcessProgressItem, User } from '../types';
import { CalendarTaskDetailModal } from './CalendarTaskDetailModal';
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
  Search,
  RotateCcw,
  Sparkles,
  MoveHorizontal,
  ChevronsLeft,
  ChevronsRight,
  User as UserIcon,
  Play,
  AlertCircle
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
  currentUser?: User | null;
  approvedOperators?: string[];
}

const parseSafeDate = (val: any): Date => {
  if (!val) return new Date();
  if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
  if (typeof val.toDate === 'function') return val.toDate();
  if (typeof val === 'object' && 'seconds' in val) return new Date(val.seconds * 1000);
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
};

// Status Colors & Badges (Matching Google Calendar pastel design system)
const STATUS_META: Record<string, { bg: string; border: string; text: string; label: string; dot: string; barBg: string; barBorder: string }> = {
  READY: {
    bg: '#dbeafe',
    border: '#bfdbfe',
    text: '#1e40af',
    label: '계획',
    dot: '#2563eb',
    barBg: 'bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-300',
    barBorder: '#93c5fd',
  },
  PLANNED: {
    bg: '#dbeafe',
    border: '#bfdbfe',
    text: '#1e40af',
    label: '계획',
    dot: '#2563eb',
    barBg: 'bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-300',
    barBorder: '#93c5fd',
  },
  IN_PROGRESS: {
    bg: '#fef3c7',
    border: '#fde68a',
    text: '#92400e',
    label: '진행중',
    dot: '#d97706',
    barBg: 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-400 ring-1 ring-amber-400/50 shadow-xs animate-pulse',
    barBorder: '#f59e0b',
  },
  COMPLETED: {
    bg: '#dcfce7',
    border: '#bbf7d0',
    text: '#166534',
    label: '완료',
    dot: '#16a34a',
    barBg: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-emerald-300',
    barBorder: '#86efac',
  },
  DELAYED: {
    bg: '#fee2e2',
    border: '#fecaca',
    text: '#991b1b',
    label: '지연',
    dot: '#dc2626',
    barBg: 'bg-rose-100 hover:bg-rose-200 text-rose-950 border-rose-400 ring-1 ring-rose-400/50',
    barBorder: '#f87171',
  },
  PAUSED: {
    bg: '#ffedd5',
    border: '#fed7aa',
    text: '#9a3412',
    label: '일시정지',
    dot: '#ea580c',
    barBg: 'bg-orange-100 hover:bg-orange-200 text-orange-950 border-orange-300',
    barBorder: '#fdba74',
  },
};

export const GanttChart: React.FC<GanttChartProps> = ({
  items,
  scheduledTasks,
  filteredTasks,
  onSelectItem,
  onSelectTask,
  selectedItemKey,
  orders = {},
  onUpdateProgress,
  currentUser,
  approvedOperators = [],
}) => {
  const taskList = items || filteredTasks || scheduledTasks || [];
  const containerRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef<boolean>(false);

  // View state & Filters
  const [scaleMode, setScaleMode] = useState<'DAY' | 'WEEK' | 'MONTH'>('DAY');
  const [viewMode, setViewMode] = useState<'ALL' | 'SINGLE'>('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 70% ~ 160%
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State for Task Detail (CalendarTaskDetailModal)
  const [modalTask, setModalTask] = useState<ScheduledTaskItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Mouse Drag-to-Pan state for easy horizontal scrolling
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const scrollLeftStartRef = useRef<number>(0);
  const didActuallyDragRef = useRef<boolean>(false);

  // Active Selected Task
  const selectedTask = useMemo(() => {
    if (modalTask) return modalTask;
    if (selectedItemKey) {
      return taskList.find((t) => t.processKey === selectedItemKey) || null;
    }
    return null;
  }, [modalTask, selectedItemKey, taskList]);

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

  // Filter items based on viewMode, selectedOrderId, statusFilter, and searchQuery
  const displayItems = useMemo(() => {
    let list = taskList;

    if (viewMode === 'SINGLE' && selectedOrderId) {
      list = list.filter((item) => item.orderId === selectedOrderId);
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((item) => {
        const s = item.status || 'READY';
        if (statusFilter === 'READY') return s === 'READY' || s === 'PLANNED';
        return s === statusFilter;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.orderName?.toLowerCase().includes(q) ||
          item.groupName?.toLowerCase().includes(q) ||
          item.content?.toLowerCase().includes(q) ||
          item.machine?.toLowerCase().includes(q) ||
          item.worker?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [taskList, viewMode, selectedOrderId, statusFilter, searchQuery]);

  // Status counts for legend
  const statusCounts = useMemo(() => {
    const counts = { ALL: taskList.length, READY: 0, IN_PROGRESS: 0, COMPLETED: 0, DELAYED: 0, PAUSED: 0 };
    taskList.forEach((t) => {
      const s = String(t.status || 'READY');
      if (s === 'PLANNED' || s === 'READY') counts.READY += 1;
      else if (s === 'IN_PROGRESS') counts.IN_PROGRESS += 1;
      else if (s === 'COMPLETED') counts.COMPLETED += 1;
      else if (s === 'DELAYED') counts.DELAYED += 1;
      else if (s === 'PAUSED') counts.PAUSED += 1;
      else counts.READY += 1;
    });
    return counts;
  }, [taskList]);

  // Determine global min and max dates (with dynamic buffer for Day/Week/Month)
  const { minDate, maxDate, totalDays } = useMemo(() => {
    let startBuffer = 2;
    let endBuffer = 5;
    let minDiff = 14;

    if (scaleMode === 'WEEK') {
      startBuffer = 7;
      endBuffer = 14;
      minDiff = 35;
    } else if (scaleMode === 'MONTH') {
      startBuffer = 15;
      endBuffer = 30;
      minDiff = 90;
    }

    if (displayItems.length === 0) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - startBuffer);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (minDiff - startBuffer));
      return { minDate: start, maxDate: end, totalDays: minDiff };
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
    start.setDate(start.getDate() - startBuffer);

    const end = new Date(maxT);
    end.setHours(23, 59, 59, 999);
    end.setDate(end.getDate() + endBuffer);

    const diffDays = Math.max(minDiff, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    return { minDate: start, maxDate: end, totalDays: diffDays };
  }, [displayItems, scaleMode]);

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

  // Day width in pixels calculated from scaleMode and zoomLevel
  const dayWidthPx = useMemo(() => {
    if (scaleMode === 'DAY') {
      return Math.round((zoomLevel / 100) * 100); // 70px ~ 160px per day
    }
    if (scaleMode === 'WEEK') {
      return Math.max(18, Math.round((zoomLevel / 100) * 32)); // ~22px ~ 51px per day (~154px ~ 357px per week)
    }
    // 'MONTH'
    return Math.max(6, Math.round((zoomLevel / 100) * 9)); // ~6px ~ 14px per day (~180px ~ 420px per month)
  }, [scaleMode, zoomLevel]);

  // Group timelineDays into Weeks for WEEK view header
  const weekGroups = useMemo(() => {
    if (timelineDays.length === 0) return [];
    const groups: {
      weekIndex: number;
      label: string;
      subLabel: string;
      daysCount: number;
      widthPx: number;
      startDate: Date;
      endDate: Date;
    }[] = [];

    let currentGroup: { startDate: Date; endDate: Date; daysCount: number } | null = null;
    let weekCounter = 1;

    timelineDays.forEach((d, idx) => {
      const isNewWeek = !currentGroup || d.getDay() === 1 || idx === 0;
      if (isNewWeek && currentGroup) {
        const m = currentGroup.startDate.getMonth() + 1;
        const startDay = currentGroup.startDate.getDate();
        const endM = currentGroup.endDate.getMonth() + 1;
        const endDay = currentGroup.endDate.getDate();
        const firstDayOfMonth = new Date(currentGroup.startDate.getFullYear(), currentGroup.startDate.getMonth(), 1);
        const weekNum = Math.ceil((startDay + firstDayOfMonth.getDay()) / 7);

        groups.push({
          weekIndex: weekCounter++,
          label: `${m}월 ${weekNum}주차`,
          subLabel: `${m}.${startDay} ~ ${endM}.${endDay}`,
          daysCount: currentGroup.daysCount,
          widthPx: currentGroup.daysCount * dayWidthPx,
          startDate: currentGroup.startDate,
          endDate: currentGroup.endDate,
        });
        currentGroup = null;
      }

      if (!currentGroup) {
        currentGroup = { startDate: d, endDate: d, daysCount: 1 };
      } else {
        currentGroup.endDate = d;
        currentGroup.daysCount += 1;
      }
    });

    if (currentGroup) {
      const m = currentGroup.startDate.getMonth() + 1;
      const startDay = currentGroup.startDate.getDate();
      const endM = currentGroup.endDate.getMonth() + 1;
      const endDay = currentGroup.endDate.getDate();
      const firstDayOfMonth = new Date(currentGroup.startDate.getFullYear(), currentGroup.startDate.getMonth(), 1);
      const weekNum = Math.ceil((startDay + firstDayOfMonth.getDay()) / 7);

      groups.push({
        weekIndex: weekCounter++,
        label: `${m}월 ${weekNum}주차`,
        subLabel: `${m}.${startDay} ~ ${endM}.${endDay}`,
        daysCount: currentGroup.daysCount,
        widthPx: currentGroup.daysCount * dayWidthPx,
        startDate: currentGroup.startDate,
        endDate: currentGroup.endDate,
      });
    }

    return groups;
  }, [timelineDays, dayWidthPx]);

  // Group timelineDays into Months for MONTH view header
  const monthGroups = useMemo(() => {
    if (timelineDays.length === 0) return [];
    const groups: {
      year: number;
      month: number;
      label: string;
      daysCount: number;
      widthPx: number;
      startDate: Date;
      endDate: Date;
    }[] = [];

    let currentGroup: { year: number; month: number; daysCount: number; startDate: Date; endDate: Date } | null = null;

    timelineDays.forEach((d) => {
      const y = d.getFullYear();
      const m = d.getMonth() + 1;

      if (!currentGroup || currentGroup.year !== y || currentGroup.month !== m) {
        if (currentGroup) {
          groups.push({
            year: currentGroup.year,
            month: currentGroup.month,
            label: `${currentGroup.year}년 ${currentGroup.month}월`,
            daysCount: currentGroup.daysCount,
            widthPx: currentGroup.daysCount * dayWidthPx,
            startDate: currentGroup.startDate,
            endDate: currentGroup.endDate,
          });
        }
        currentGroup = { year: y, month: m, daysCount: 1, startDate: d, endDate: d };
      } else {
        currentGroup.daysCount += 1;
        currentGroup.endDate = d;
      }
    });

    if (currentGroup) {
      groups.push({
        year: currentGroup.year,
        month: currentGroup.month,
        label: `${currentGroup.year}년 ${currentGroup.month}월`,
        daysCount: currentGroup.daysCount,
        widthPx: currentGroup.daysCount * dayWidthPx,
        startDate: currentGroup.startDate,
        endDate: currentGroup.endDate,
      });
    }

    return groups;
  }, [timelineDays, dayWidthPx]);

  // Group tasks by process / group key
  const groupedTasks = useMemo(() => {
    const map = new Map<string, { groupKey: string; groupName: string; orderName: string; orderId: string; tasks: ScheduledTaskItem[] }>();
    displayItems.forEach((item) => {
      if (!map.has(item.groupKey)) {
        map.set(item.groupKey, {
          groupKey: item.groupKey,
          groupName: item.groupName,
          orderName: item.orderName,
          orderId: item.orderId,
          tasks: [],
        });
      }
      map.get(item.groupKey)!.tasks.push(item);
    });
    return Array.from(map.values());
  }, [displayItems]);

  const leftHeaderWidth = 240;
  const totalTimelineWidth = leftHeaderWidth + totalDays * dayWidthPx;

  // Calculate Today's pixel offset
  const todayOffsetPx = useMemo(() => {
    const now = new Date();
    const diffMs = now.getTime() - minDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < 0 || diffDays > totalDays) return null;
    return leftHeaderWidth + diffDays * dayWidthPx;
  }, [minDate, totalDays, dayWidthPx, leftHeaderWidth]);

  // Synchronized Dual Scrollbars (Top & Main Container)
  const handleMainScroll = useCallback(() => {
    if (isSyncingRef.current) return;
    if (containerRef.current && topScrollRef.current) {
      isSyncingRef.current = true;
      topScrollRef.current.scrollLeft = containerRef.current.scrollLeft;
      requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    }
  }, []);

  const handleTopScroll = useCallback(() => {
    if (isSyncingRef.current) return;
    if (containerRef.current && topScrollRef.current) {
      isSyncingRef.current = true;
      containerRef.current.scrollLeft = topScrollRef.current.scrollLeft;
      requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    }
  }, []);

  // Smooth Scroll Handlers
  const scrollToToday = useCallback(() => {
    if (!containerRef.current) return;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffMs = now.getTime() - minDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const targetLeft = Math.max(0, diffDays * dayWidthPx - 150);
    containerRef.current.scrollTo({ left: targetLeft, behavior: 'smooth' });
  }, [minDate, dayWidthPx]);

  const scrollByDays = useCallback((days: number) => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: days * dayWidthPx, behavior: 'smooth' });
  }, [dayWidthPx]);

  const scrollToStart = useCallback(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
  }, []);

  const scrollToEnd = useCallback(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({ left: containerRef.current.scrollWidth, behavior: 'smooth' });
  }, []);

  // Auto-scroll to today or initial relevant position on load
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToToday();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Mouse Drag-to-Pan (Grab to Scroll) Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only left click on empty background
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('.gantt-task-bar') || target.closest('button') || target.closest('input') || target.closest('select')) {
      return;
    }
    if (!containerRef.current) return;
    isDraggingRef.current = true;
    didActuallyDragRef.current = false;
    dragStartXRef.current = e.pageX;
    scrollLeftStartRef.current = containerRef.current.scrollLeft;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    e.preventDefault();
    const diff = e.pageX - dragStartXRef.current;
    if (Math.abs(diff) > 4) {
      didActuallyDragRef.current = true;
    }
    containerRef.current.scrollLeft = scrollLeftStartRef.current - diff;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  // Open Process Detail Modal on Bar Click (Always triggers with zero interference)
  const handleTaskBarClick = (task: ScheduledTaskItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setModalTask(task);
    setIsDetailModalOpen(true);
    if (onSelectItem) onSelectItem(task);
    if (onSelectTask) onSelectTask(task.processKey);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900 overflow-hidden font-sans select-none border border-slate-200 dark:border-slate-800 rounded-none sm:rounded-xl shadow-xs">
      {/* ========================================================================= */}
      {/* 1. TOP TOOLBAR & CONTROLS                                                 */}
      {/* ========================================================================= */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Title & Stats */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600 text-white rounded-lg shadow-2xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-800 dark:text-white tracking-tight">
                공정 타임라인 (Gantt Chart)
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold font-mono">
                {displayItems.length}개 공정
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              공정 바(Bar)를 클릭하여 작업 시작/완료/일시정지 및 작업자 배정을 관리하세요.
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="수주/공정/설비 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 w-36 sm:w-44 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode (All / Single Order) */}
          <div className="flex bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-bold">
            <button
              onClick={() => {
                setViewMode('ALL');
                setSelectedOrderId('');
              }}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                viewMode === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
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
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                viewMode === 'SINGLE'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              단일 수주
            </button>
          </div>

          {/* Single Order Dropdown */}
          {viewMode === 'SINGLE' && (
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="py-1 px-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-100 max-w-[150px] truncate"
            >
              {uniqueOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} {o.qty ? `(${o.qty}EA)` : ''}
                </option>
              ))}
            </select>
          )}

          {/* Time Scale Mode Switcher [일별] [주별] [월별] */}
          <div className="flex bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-bold">
            <button
              onClick={() => setScaleMode('DAY')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                scaleMode === 'DAY'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="일별 정밀 타임라인"
            >
              일별
            </button>
            <button
              onClick={() => setScaleMode('WEEK')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                scaleMode === 'WEEK'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="주별 거시 타임라인 (7일 단위)"
            >
              주별
            </button>
            <button
              onClick={() => setScaleMode('MONTH')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                scaleMode === 'MONTH'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="월별 장기 프로젝트 스케줄 타임라인"
            >
              월별
            </button>
          </div>

          {/* Timeline Jump Controls (Today, Prev, Next) */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={() => scrollByDays(scaleMode === 'DAY' ? -3 : scaleMode === 'WEEK' ? -7 : -28)}
              className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition cursor-pointer"
              title={`${scaleMode === 'DAY' ? '3일' : scaleMode === 'WEEK' ? '1주일' : '1개월'} 좌측 이동`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={scrollToToday}
              className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800 transition cursor-pointer"
              title="오늘 날짜 위치로 부드럽게 이동"
            >
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>오늘 (Today)</span>
            </button>

            <button
              onClick={() => scrollByDays(scaleMode === 'DAY' ? 3 : scaleMode === 'WEEK' ? 7 : 28)}
              className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition cursor-pointer"
              title={`${scaleMode === 'DAY' ? '3일' : scaleMode === 'WEEK' ? '1주일' : '1개월'} 우측 이동`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom In / Out */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(70, z - 15))}
              className="p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition cursor-pointer"
              title="간트 차트 축소"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-black text-slate-700 dark:text-slate-300 px-1">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(160, z + 15))}
              className="p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition cursor-pointer"
              title="간트 차트 확대"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STATUS FILTER BAR & QUICK LEGEND                                       */}
      {/* ========================================================================= */}
      <div className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900 flex items-center justify-between gap-2 overflow-x-auto shrink-0 text-xs">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            상태 필터:
          </span>

          {/* ALL */}
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2 py-0.5 rounded-full font-bold text-[11px] transition cursor-pointer border ${
              statusFilter === 'ALL'
                ? 'bg-slate-800 text-white border-slate-900 dark:bg-slate-200 dark:text-slate-900 shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            전체 ({statusCounts.ALL})
          </button>

          {/* READY */}
          <button
            onClick={() => setStatusFilter(statusFilter === 'READY' ? 'ALL' : 'READY')}
            style={{ backgroundColor: STATUS_META.READY.bg, color: STATUS_META.READY.text, borderColor: STATUS_META.READY.border }}
            className={`px-2 py-0.5 rounded-full font-bold text-[11px] transition cursor-pointer border flex items-center gap-1 ${
              statusFilter === 'READY' ? 'ring-2 ring-blue-500 ring-offset-1 shadow-2xs font-black' : 'hover:opacity-90'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_META.READY.dot }} />
            <span>계획 ({statusCounts.READY})</span>
          </button>

          {/* IN_PROGRESS */}
          <button
            onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
            style={{ backgroundColor: STATUS_META.IN_PROGRESS.bg, color: STATUS_META.IN_PROGRESS.text, borderColor: STATUS_META.IN_PROGRESS.border }}
            className={`px-2 py-0.5 rounded-full font-bold text-[11px] transition cursor-pointer border flex items-center gap-1 ${
              statusFilter === 'IN_PROGRESS' ? 'ring-2 ring-amber-500 ring-offset-1 shadow-2xs font-black' : 'hover:opacity-90'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_META.IN_PROGRESS.dot }} />
            <span>진행중 ({statusCounts.IN_PROGRESS})</span>
          </button>

          {/* COMPLETED */}
          <button
            onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
            style={{ backgroundColor: STATUS_META.COMPLETED.bg, color: STATUS_META.COMPLETED.text, borderColor: STATUS_META.COMPLETED.border }}
            className={`px-2 py-0.5 rounded-full font-bold text-[11px] transition cursor-pointer border flex items-center gap-1 ${
              statusFilter === 'COMPLETED' ? 'ring-2 ring-emerald-500 ring-offset-1 shadow-2xs font-black' : 'hover:opacity-90'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_META.COMPLETED.dot }} />
            <span>완료 ({statusCounts.COMPLETED})</span>
          </button>

          {/* DELAYED */}
          <button
            onClick={() => setStatusFilter(statusFilter === 'DELAYED' ? 'ALL' : 'DELAYED')}
            style={{ backgroundColor: STATUS_META.DELAYED.bg, color: STATUS_META.DELAYED.text, borderColor: STATUS_META.DELAYED.border }}
            className={`px-2 py-0.5 rounded-full font-bold text-[11px] transition cursor-pointer border flex items-center gap-1 ${
              statusFilter === 'DELAYED' ? 'ring-2 ring-rose-500 ring-offset-1 shadow-2xs font-black' : 'hover:opacity-90'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_META.DELAYED.dot }} />
            <span>지연 ({statusCounts.DELAYED})</span>
          </button>

          {/* PAUSED */}
          <button
            onClick={() => setStatusFilter(statusFilter === 'PAUSED' ? 'ALL' : 'PAUSED')}
            style={{ backgroundColor: STATUS_META.PAUSED.bg, color: STATUS_META.PAUSED.text, borderColor: STATUS_META.PAUSED.border }}
            className={`px-2 py-0.5 rounded-full font-bold text-[11px] transition cursor-pointer border flex items-center gap-1 ${
              statusFilter === 'PAUSED' ? 'ring-2 ring-orange-500 ring-offset-1 shadow-2xs font-black' : 'hover:opacity-90'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_META.PAUSED.dot }} />
            <span>일시정지 ({statusCounts.PAUSED})</span>
          </button>
        </div>

        {/* Quick hint on right */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium shrink-0">
          <span className="flex items-center gap-1">
            <MoveHorizontal className="w-3 h-3 text-blue-500" />
            마우스 드래그 / 상단·하단 스크롤바로 좌우 이동
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DEDICATED TOP SYNCHRONIZED SCROLLBAR (상단 가로 스크롤바)                */}
      {/* ========================================================================= */}
      <div
        ref={topScrollRef}
        onScroll={handleTopScroll}
        className="w-full overflow-x-auto overflow-y-hidden bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 gantt-scrollbar shrink-0 h-4 z-20"
        title="상단 가로 스크롤바 (좌우 드래그로 타임라인 이동)"
      >
        <div style={{ width: `${totalTimelineWidth}px`, height: '1px' }} />
      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN GANTT TIMELINE BODY                                               */}
      {/* ========================================================================= */}
      <div
        ref={containerRef}
        onScroll={handleMainScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`flex-1 overflow-auto relative flex flex-col bg-white dark:bg-slate-900 gantt-scrollbar ${
          isDragging ? 'cursor-grabbing select-none' : 'cursor-default'
        }`}
      >
        <div
          style={{ width: `${totalTimelineWidth}px` }}
          className="flex flex-col min-h-full relative"
        >
          {/* ------------------------------------------------------------------- */}
          {/* 4.1 Multi-Tier Sticky Dates Header Row                              */}
          {/* ------------------------------------------------------------------- */}
          <div className="sticky top-0 z-30 flex flex-col bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs">
            {/* Upper Tier: Month / Week Big Groups */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              {/* Left Header Box (Spanning vertically) */}
              <div
                style={{ width: `${leftHeaderWidth}px` }}
                className="sticky left-0 z-40 shrink-0 p-2 border-r border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-extrabold text-slate-800 dark:text-white text-xs">수주 / 공정명</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono font-bold">
                  {groupedTasks.length}개 그룹
                </span>
              </div>

              {/* Right Upper Tier Content */}
              <div className="flex flex-1 overflow-hidden">
                {scaleMode === 'WEEK' ? (
                  weekGroups.map((wg, idx) => (
                    <div
                      key={idx}
                      style={{ width: `${wg.widthPx}px` }}
                      className="shrink-0 border-r border-slate-300 dark:border-slate-700 py-1 px-2 text-center bg-slate-200/60 dark:bg-slate-800/90 truncate flex items-center justify-center gap-1.5"
                    >
                      <span className="text-blue-700 dark:text-blue-300 font-black text-xs">{wg.label}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">({wg.subLabel})</span>
                    </div>
                  ))
                ) : (
                  monthGroups.map((mg, idx) => (
                    <div
                      key={idx}
                      style={{ width: `${mg.widthPx}px` }}
                      className="shrink-0 border-r border-slate-300 dark:border-slate-700 py-1 px-2 text-center bg-slate-200/60 dark:bg-slate-800/90 truncate flex items-center justify-center gap-1.5"
                    >
                      <span className="text-slate-800 dark:text-slate-100 font-black text-xs">{mg.label}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">({mg.daysCount}일)</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Lower Tier: Individual Days or Periodic Sub-ticks */}
            <div className="flex">
              {/* Empty placeholder for left sticky column */}
              <div
                style={{ width: `${leftHeaderWidth}px` }}
                className="sticky left-0 z-40 shrink-0 p-1.5 border-r border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-between shadow-xs text-[10px] text-slate-500 font-semibold"
              >
                <span>타임라인 눈금</span>
                <span className="font-bold text-blue-600 uppercase text-[9px] px-1 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60">
                  {scaleMode === 'DAY' ? '1일 단위' : scaleMode === 'WEEK' ? '주차별 (7일)' : '월별 장기'}
                </span>
              </div>

              {/* Lower Tier Date Blocks */}
              <div className="flex flex-1 overflow-hidden">
                {scaleMode === 'MONTH' ? (
                  timelineDays.map((d, idx) => {
                    const isFirstOfMonth = d.getDate() === 1;
                    const is10th = d.getDate() === 10;
                    const is20th = d.getDate() === 20;
                    const isKeyTick = isFirstOfMonth || is10th || is20th;
                    const isToday =
                      d.getFullYear() === new Date().getFullYear() &&
                      d.getMonth() === new Date().getMonth() &&
                      d.getDate() === new Date().getDate();

                    return (
                      <div
                        key={idx}
                        style={{ width: `${dayWidthPx}px` }}
                        className={`shrink-0 border-r ${
                          isFirstOfMonth
                            ? 'border-slate-400 dark:border-slate-500'
                            : 'border-slate-200/40 dark:border-slate-800/40'
                        } py-1 text-center flex flex-col justify-center transition relative ${
                          isToday ? 'bg-blue-100/90 dark:bg-blue-950/90' : ''
                        }`}
                      >
                        {isKeyTick && (
                          <span className={`text-[9px] font-extrabold absolute left-0.5 -top-0.5 whitespace-nowrap ${
                            isFirstOfMonth ? 'text-blue-700 dark:text-blue-300 font-black' : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {d.getDate()}일
                          </span>
                        )}
                        {isToday && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mx-auto" title="오늘" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  timelineDays.map((d, idx) => {
                    const isSun = d.getDay() === 0;
                    const isSat = d.getDay() === 6;
                    const isMon = d.getDay() === 1;
                    const isToday =
                      d.getFullYear() === new Date().getFullYear() &&
                      d.getMonth() === new Date().getMonth() &&
                      d.getDate() === new Date().getDate();

                    const isWeekView = scaleMode === 'WEEK';

                    return (
                      <div
                        key={idx}
                        style={{ width: `${dayWidthPx}px` }}
                        className={`shrink-0 border-r ${
                          isWeekView && isMon
                            ? 'border-slate-300 dark:border-slate-600'
                            : 'border-slate-200 dark:border-slate-700'
                        } p-1 text-center flex flex-col justify-center transition ${
                          isToday
                            ? 'bg-blue-100/80 dark:bg-blue-950/80 ring-1 ring-inset ring-blue-400'
                            : isSun || isSat
                            ? 'bg-slate-200/40 dark:bg-slate-800/40'
                            : ''
                        }`}
                      >
                        <span className={`text-[9px] font-bold ${isSun ? 'text-rose-500' : isSat ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400'}`}>
                          {KOREAN_DAYS[d.getDay()]}
                        </span>
                        <div className="flex items-center justify-center gap-0.5">
                          <span className={`text-xs ${isToday ? 'text-blue-700 dark:text-blue-300 font-black' : 'text-slate-800 dark:text-slate-200 font-extrabold'}`}>
                            {scaleMode === 'DAY' ? `${d.getMonth() + 1}.${d.getDate()}` : d.getDate()}
                          </span>
                          {isToday && scaleMode === 'DAY' && (
                            <span className="text-[8px] px-1 py-0.2 rounded bg-blue-600 text-white font-bold">
                              오늘
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* 4.2 Vertical Today Red Indicator Line                               */}
          {/* ------------------------------------------------------------------- */}
          {todayOffsetPx !== null && (
            <div
              style={{ left: `${todayOffsetPx}px` }}
              className="absolute top-0 bottom-0 w-[2px] bg-red-500/80 dark:bg-red-400/80 z-20 pointer-events-none shadow-xs"
            >
              <div className="sticky top-14 -translate-x-1/2 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md whitespace-nowrap">
                현재 (Today)
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* 4.3 Group Rows & Timeline Canvas                                    */}
          {/* ------------------------------------------------------------------- */}
          {groupedTasks.length === 0 ? (
            <div className="p-16 text-center text-slate-400 dark:text-slate-500 text-sm font-medium flex flex-col items-center gap-2">
              <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              <span>조건에 맞는 공정 일정이 없습니다.</span>
              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  setSearchQuery('');
                  setViewMode('ALL');
                }}
                className="mt-2 px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold cursor-pointer"
              >
                필터 초기화
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
              {groupedTasks.map((group) => (
                <div
                  key={group.groupKey}
                  className="flex hover:bg-blue-50/30 dark:hover:bg-slate-800/40 transition group"
                >
                  {/* Left Group Label (Sticky during horizontal scroll) */}
                  <div
                    style={{ width: `${leftHeaderWidth}px` }}
                    className="sticky left-0 z-20 shrink-0 p-2.5 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/90 flex flex-col justify-center truncate shadow-sm transition-colors"
                  >
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold truncate">
                      [{group.orderName}]
                    </span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate" title={group.groupName}>
                      {group.groupName}
                    </span>
                  </div>

                  {/* Right Timeline Canvas */}
                  <div className="flex-1 relative h-13 flex items-center">
                    {/* Background Day Columns */}
                    <div className="absolute inset-0 flex pointer-events-none z-0">
                      {timelineDays.map((d, idx) => {
                        const isSun = d.getDay() === 0;
                        const isSat = d.getDay() === 6;
                        const isMon = d.getDay() === 1;
                        const isFirstOfMonth = d.getDate() === 1;
                        const isToday =
                          d.getFullYear() === new Date().getFullYear() &&
                          d.getMonth() === new Date().getMonth() &&
                          d.getDate() === new Date().getDate();

                        let borderClass = 'border-r border-slate-100 dark:border-slate-800/60';
                        if (scaleMode === 'WEEK' && isMon) {
                          borderClass = 'border-r border-slate-300/80 dark:border-slate-700/80';
                        } else if (scaleMode === 'MONTH' && isFirstOfMonth) {
                          borderClass = 'border-r-2 border-slate-300 dark:border-slate-600';
                        }

                        return (
                          <div
                            key={idx}
                            style={{ width: `${dayWidthPx}px` }}
                            className={`shrink-0 ${borderClass} h-full ${
                              isToday
                                ? 'bg-blue-50/40 dark:bg-blue-950/20'
                                : isSun || isSat
                                ? 'bg-slate-50/60 dark:bg-slate-800/20'
                                : ''
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
                      const durDays = Math.max(0.15, (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));

                      const minBarPx = scaleMode === 'DAY' ? 42 : scaleMode === 'WEEK' ? 24 : 14;
                      const shortThreshold = scaleMode === 'DAY' ? 110 : scaleMode === 'WEEK' ? 75 : 45;

                      const leftPx = offsetDays * dayWidthPx;
                      const widthPx = Math.max(minBarPx, durDays * dayWidthPx);

                      const statusKey = task.status || (task.isCompleted ? 'COMPLETED' : 'READY');
                      const meta = STATUS_META[statusKey] || STATUS_META.READY;

                      // Display content name or process title cleanly
                      const taskDisplayName = task.content || task.title || task.groupName;
                      const isShortBar = widthPx < shortThreshold;

                      return (
                        <div
                          key={task.processKey}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => handleTaskBarClick(task, e)}
                          style={{
                            left: `${leftPx}px`,
                            width: `${widthPx}px`,
                            backgroundColor: meta.bg,
                            color: meta.text,
                            borderColor: meta.border,
                          }}
                          className={`gantt-task-bar group/bar absolute h-8 rounded-lg border-2 text-[11px] font-bold px-1 py-0.5 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-md hover:scale-[1.01] hover:brightness-95 active:scale-[0.99] z-10 select-none ${
                            task.status === 'IN_PROGRESS' ? 'ring-2 ring-amber-400 ring-offset-1 animate-pulse' : ''
                          }`}
                          title={`[${task.orderName}] ${taskDisplayName}\n• 공정 그룹: ${task.groupName}\n• 상태: ${meta.label}\n• 예정 일정: ${s.toLocaleDateString()} ~ ${e.toLocaleDateString()} (${task.duration || 1}시간)\n• 설비: ${task.machine || '미지정'}\n• 작업자: ${task.worker || '미지정'}\n\n💡 클릭하면 실시간 공정 상세 및 작업 실행 창이 열립니다.`}
                        >
                          {isShortBar ? (
                            /* ------------------------------------------------------------- */
                            /* Short Bar Rendering: Compact inside + External Crisp Label    */
                            /* ------------------------------------------------------------- */
                            <>
                              <div className="flex items-center justify-center w-full gap-0.5 min-w-0">
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: meta.dot }}
                                />
                                {widthPx >= 28 && (
                                  <span className="text-[9px] font-mono font-black opacity-90 truncate">
                                    {task.duration || 1}h
                                  </span>
                                )}
                              </div>

                              {/* External Smart Label (Positioned right outside the short bar in DAY / WEEK modes) */}
                              {scaleMode !== 'MONTH' && (
                                <div
                                  onClick={(e) => handleTaskBarClick(task, e)}
                                  className="absolute left-full ml-1 flex items-center gap-1 whitespace-nowrap z-20 cursor-pointer"
                                >
                                  <span
                                    className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 bg-white/95 dark:bg-slate-800/95 px-1.5 py-0.5 rounded-md shadow-xs border border-slate-300/80 dark:border-slate-700/80 hover:border-blue-500 hover:text-blue-600 transition"
                                  >
                                    {taskDisplayName}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                                    ({task.duration || 1}h)
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            /* ------------------------------------------------------------- */
                            /* Normal/Wide Bar Rendering: Full text & badge inside bar       */
                            /* ------------------------------------------------------------- */
                            <>
                              <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: meta.dot }}
                                />
                                <span className="font-extrabold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis leading-none" title={taskDisplayName}>
                                  {taskDisplayName}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 text-[10px] opacity-90 font-mono font-bold ml-1 pl-1 border-l border-current/20">
                                {task.machine && widthPx >= 140 && (
                                  <span className="hidden xl:inline text-[9px] opacity-80 truncate max-w-[45px]">
                                    {task.machine}
                                  </span>
                                )}
                                <span>{task.duration || 1}h</span>
                              </div>
                            </>
                          )}
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

      {/* ========================================================================= */}
      {/* 5. BOTTOM STATUS BAR & NAVIGATION HELPER                                  */}
      {/* ========================================================================= */}
      <div className="px-3 py-1.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-medium">
            전체 일정 범위: {minDate.getMonth() + 1}월 {minDate.getDate()}일 ~ {maxDate.getMonth() + 1}월 {maxDate.getDate()}일 (총 {totalDays}일간)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={scrollToStart}
            className="px-2 py-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded font-medium text-[11px] cursor-pointer"
            title="일정 시작일로 이동"
          >
            ⇤ 처음으로
          </button>
          <button
            onClick={scrollToToday}
            className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded font-bold text-[11px] cursor-pointer"
            title="오늘 날짜 위치로 이동"
          >
            오늘 위치
          </button>
          <button
            onClick={scrollToEnd}
            className="px-2 py-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded font-medium text-[11px] cursor-pointer"
            title="일정 종료일로 이동"
          >
            끝으로 ⇥
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. TASK DETAIL & MES EXECUTION MODAL (CalendarTaskDetailModal)            */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedTask && (
        <CalendarTaskDetailModal
          task={selectedTask}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setModalTask(null);
            if (onSelectTask) onSelectTask('');
          }}
          onUpdateProgress={(processKey, progress) => {
            if (onUpdateProgress) {
              onUpdateProgress(processKey, progress);
            }
            if (modalTask && modalTask.processKey === processKey) {
              setModalTask((prev) => prev ? { ...prev, status: progress.status as any, isCompleted: progress.status === 'COMPLETED' } : null);
            }
          }}
          currentUser={currentUser}
          approvedOperators={approvedOperators}
        />
      )}
    </div>
  );
};
