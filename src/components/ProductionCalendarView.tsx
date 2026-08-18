import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ScheduledTaskItem,
  ProcessProgressItem,
  User,
  Order
} from '../types';
import { ALL_EQUIPMENT_LIST, KOREAN_DAYS } from '../data/defaultData';
import { CalendarTaskDetailModal } from './CalendarTaskDetailModal';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  X,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  Wrench,
  User as UserIcon,
  Play,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Info
} from 'lucide-react';

interface ProductionCalendarViewProps {
  scheduledTasks: ScheduledTaskItem[];
  orders: Record<string, Order>;
  processProgressMap: import('../types').ProcessProgressMap;
  onUpdateProgress: (processKey: string, progress: ProcessProgressItem) => void;
  currentUser?: User | null;
  approvedOperators?: string[];
  onNavigateToOrderForm?: () => void;
}

// ---------------------------------------------------------------------------
// 1. Status to Color Mapping (구글 캘린더 파스텔톤 시스템 & 테두리 제거)
// ---------------------------------------------------------------------------
const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; label: string; badgeBg: string; dot: string }> = {
  READY: {
    bg: '#dbeafe', // 계획 (파랑): background-color: #dbeafe; color: #1e40af; border: none;
    border: 'transparent',
    text: '#1e40af',
    label: '계획',
    badgeBg: '#bfdbfe',
    dot: '#2563eb'
  },
  PLANNED: {
    bg: '#dbeafe', // 계획 (파랑)
    border: 'transparent',
    text: '#1e40af',
    label: '계획',
    badgeBg: '#bfdbfe',
    dot: '#2563eb'
  },
  IN_PROGRESS: {
    bg: '#fef3c7', // 진행중 (주황/노랑): background-color: #fef3c7; color: #92400e; border: none;
    border: 'transparent',
    text: '#92400e',
    label: '진행중',
    badgeBg: '#fde68a',
    dot: '#d97706'
  },
  COMPLETED: {
    bg: '#dcfce7', // 완료 (초록): background-color: #dcfce7; color: #166534; border: none;
    border: 'transparent',
    text: '#166534',
    label: '완료',
    badgeBg: '#bbf7d0',
    dot: '#16a34a'
  },
  DELAYED: {
    bg: '#fee2e2', // 지연 (빨강): background-color: #fee2e2; color: #991b1b; border: none;
    border: 'transparent',
    text: '#991b1b',
    label: '지연',
    badgeBg: '#fecaca',
    dot: '#dc2626'
  },
  PAUSED: {
    bg: '#ffedd5', // 일시정지 (진한 주황): background-color: #ffedd5; color: #9a3412; border: none;
    border: 'transparent',
    text: '#9a3412',
    label: '일시정지',
    badgeBg: '#fed7aa',
    dot: '#ea580c'
  }
};

// ---------------------------------------------------------------------------
// 2. Safe Date & Time Helpers
// ---------------------------------------------------------------------------
export const parseSafeDate = (val: any): Date => {
  if (!val) return new Date();
  if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
  if (typeof val.toDate === 'function') return val.toDate();
  if (typeof val === 'object' && typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000);
  }
  if (typeof val === 'string') {
    const normalized = val.includes(' ') && !val.includes('T') ? val.replace(' ', 'T') : val;
    const d = new Date(normalized);
    if (!isNaN(d.getTime())) return d;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
};

/**
 * Parses start and end Date for a task item with robust fallbacks
 */
export function getTaskStartEndDates(task: any): { startDate: Date; endDate: Date; durationMinutes: number } {
  const rawStart = task.startTime || task.planStart || task.plannedStart || task.start || task.startDate;
  const rawEnd = task.endTime || task.planEnd || task.plannedEnd || task.end || task.endDate;

  let startDate = parseSafeDate(rawStart);
  let endDate = parseSafeDate(rawEnd);

  // If time is completely missing or invalid, default to 08:30 on that day
  if (isNaN(startDate.getTime())) {
    startDate = new Date();
    startDate.setHours(8, 30, 0, 0);
  }

  // Duration in hours or minutes from data
  const durHours = typeof task.duration === 'number' ? task.duration : typeof task.durationHours === 'number' ? task.durationHours : 0;
  const plannedMins = typeof task.plannedMinutes === 'number' ? task.plannedMinutes : durHours > 0 ? Math.round(durHours * 60) : 60;

  // If endDate is invalid or before/equal startDate, add duration (min 10 mins)
  if (isNaN(endDate.getTime()) || endDate.getTime() <= startDate.getTime()) {
    endDate = new Date(startDate.getTime() + Math.max(10, plannedMins) * 60 * 1000);
  }

  const durationMinutes = Math.max(10, Math.round((endDate.getTime() - startDate.getTime()) / (60 * 1000)));

  return { startDate, endDate, durationMinutes };
}

export function formatTimeHHMM(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export const ProductionCalendarView: React.FC<ProductionCalendarViewProps> = ({
  scheduledTasks = [],
  orders = {},
  processProgressMap,
  onUpdateProgress,
  currentUser,
  approvedOperators = [],
  onNavigateToOrderForm,
}) => {
  const calendarRef = useRef<HTMLDivElement>(null);
  const fcInstanceRef = useRef<any>(null);

  // View state: 'timeGridWeek' | 'timeGridDay'
  const [currentViewMode, setCurrentViewMode] = useState<'timeGridWeek' | 'timeGridDay'>('timeGridWeek');
  const [calendarTitle, setCalendarTitle] = useState<string>('');
  const [isFcLoaded, setIsFcLoaded] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedMachineFilter, setSelectedMachineFilter] = useState('ALL');
  const [selectedWorkerFilter, setSelectedWorkerFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [showCompleted, setShowCompleted] = useState(true);
  const [showWeekends, setShowWeekends] = useState(true);

  // Modal State
  const [selectedTaskKey, setSelectedTaskKey] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Derive the active task item directly from scheduledTasks so any real-time update is instantly reflected
  const selectedTask = useMemo(() => {
    if (!selectedTaskKey) return null;
    return scheduledTasks.find((t) => t.processKey === selectedTaskKey) || null;
  }, [selectedTaskKey, scheduledTasks]);

  // Calculate status counts for legend
  const statusCounts = useMemo(() => {
    const counts = { READY: 0, IN_PROGRESS: 0, COMPLETED: 0, DELAYED: 0, PAUSED: 0 };
    scheduledTasks.forEach((t) => {
      const s = String(t.status || 'READY');
      if (s === 'PLANNED' || s === 'READY') {
        counts.READY += 1;
      } else if (s === 'IN_PROGRESS') {
        counts.IN_PROGRESS += 1;
      } else if (s === 'COMPLETED') {
        counts.COMPLETED += 1;
      } else if (s === 'DELAYED') {
        counts.DELAYED += 1;
      } else if (s === 'PAUSED') {
        counts.PAUSED += 1;
      } else {
        counts.READY += 1;
      }
    });
    return counts;
  }, [scheduledTasks]);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered task items
  const filteredTasks = useMemo(() => {
    return scheduledTasks.filter((task) => {
      if (!showCompleted && task.isCompleted) return false;

      // Status Filter from Legend
      if (selectedStatusFilter !== 'ALL') {
        const taskStatus = String(task.status || 'READY');
        if (selectedStatusFilter === 'READY' && taskStatus !== 'READY' && taskStatus !== 'PLANNED') {
          return false;
        }
        if (selectedStatusFilter !== 'READY' && taskStatus !== selectedStatusFilter) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (task.orderName || '').toLowerCase().includes(q);
        const matchesId = (task.orderId || '').toLowerCase().includes(q);
        const matchesProc = (task.groupName || '').toLowerCase().includes(q);
        const matchesWorker = (task.worker || '').toLowerCase().includes(q);
        const matchesMachine = (task.machine || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesProc && !matchesWorker && !matchesMachine) {
          return false;
        }
      }

      if (selectedMachineFilter !== 'ALL' && task.machine !== selectedMachineFilter) return false;
      if (selectedWorkerFilter !== 'ALL' && task.worker !== selectedWorkerFilter) return false;

      return true;
    });
  }, [scheduledTasks, showCompleted, searchQuery, selectedMachineFilter, selectedWorkerFilter, selectedStatusFilter]);

  // FullCalendar Events format with pastel background & dark text colors
  const fcEvents = useMemo(() => {
    return filteredTasks.map((task) => {
      const { startDate, endDate, durationMinutes } = getTaskStartEndDates(task);
      const statusKey = task.status || 'READY';
      const colorScheme = STATUS_COLORS[statusKey] || STATUS_COLORS.READY;

      const startTimeStr = formatTimeHHMM(startDate);
      const endTimeStr = formatTimeHHMM(endDate);

      return {
        id: task.processKey,
        title: `[${task.orderName || '수주'}] ${task.groupName}`,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        backgroundColor: colorScheme.bg,
        borderColor: 'transparent',
        textColor: colorScheme.text,
        extendedProps: {
          task,
          orderName: task.orderName || '수주',
          groupName: task.groupName,
          status: statusKey,
          statusLabel: colorScheme.label,
          bgColor: colorScheme.bg,
          textColor: colorScheme.text,
          badgeBg: colorScheme.badgeBg,
          dotColor: colorScheme.dot,
          worker: task.worker,
          machine: task.machine,
          durationMinutes,
          startTimeStr,
          endTimeStr,
        },
      };
    });
  }, [filteredTasks]);

  // Load FullCalendar from window or inject script if not present
  useEffect(() => {
    let checkInterval: any = null;

    const initCheck = () => {
      if ((window as any).FullCalendar) {
        setIsFcLoaded(true);
        if (checkInterval) clearInterval(checkInterval);
      }
    };

    if ((window as any).FullCalendar) {
      setIsFcLoaded(true);
    } else {
      const existingScript = document.querySelector('script[src*="fullcalendar"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/index.global.min.js';
        script.async = true;
        script.onload = () => setIsFcLoaded(true);
        document.head.appendChild(script);
      } else {
        checkInterval = setInterval(initCheck, 100);
      }
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  // Initialize and update FullCalendar instance
  useEffect(() => {
    if (!isFcLoaded || !calendarRef.current) return;

    const FullCalendar = (window as any).FullCalendar;
    if (!FullCalendar || !FullCalendar.Calendar) return;

    // Destroy existing instance if any
    if (fcInstanceRef.current) {
      fcInstanceRef.current.destroy();
      fcInstanceRef.current = null;
    }

    // Determine initial date
    let initialDate = new Date();
    if (scheduledTasks.length > 0) {
      const activeTask = scheduledTasks.find((t) => !t.isCompleted);
      if (activeTask) {
        initialDate = parseSafeDate(activeTask.plannedStart || activeTask.start);
      } else {
        initialDate = parseSafeDate(scheduledTasks[0].plannedStart || scheduledTasks[0].start);
      }
    }

    const calendar = new FullCalendar.Calendar(calendarRef.current, {
      initialView: currentViewMode,
      initialDate: initialDate,
      timeZone: 'local',
      headerToolbar: false, // Custom Google Calendar header toolbar used
      slotMinTime: '08:00:00', // 업무 시간대 시작: 08:00
      slotMaxTime: '21:00:00', // 업무 시간대 종료: 21:00
      scrollTime: '08:00:00', // 초기 스크롤 위치: 08:00
      slotDuration: '00:30:00', // 30분 보조선 단위
      slotLabelInterval: '01:00:00', // 1시간 단위 명확한 시간 라벨
      slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      },
      slotEventOverlap: false, // 겹치는 일정 컬럼 자동 분할 (Side-by-Side 분할 정렬)
      eventMinHeight: 30, // 짧은 공정 최소 높이 보장
      allDaySlot: false,
      nowIndicator: true,
      height: '100%',
      expandRows: true,
      weekends: showWeekends,
      locale: 'ko',
      dayHeaderFormat: {
        weekday: 'short',
        month: 'numeric',
        day: 'numeric',
        omitCommas: true,
      },
      events: fcEvents,
      eventClick: (info: any) => {
        const taskData = info.event.extendedProps?.task;
        if (taskData) {
          setSelectedTaskKey(taskData.processKey);
          setIsDetailModalOpen(true);
        }
      },
      eventContent: (arg: any) => {
        const { event } = arg;
        const props = event.extendedProps || {};
        const isShort = (props.durationMinutes || 30) <= 25;

        // Custom HTML node for event card with clean pastel styling and no borders
        const container = document.createElement('div');
        container.className = 'fc-custom-event-content w-full h-full flex flex-col justify-between overflow-hidden leading-tight select-none cursor-pointer p-1.5';
        container.style.backgroundColor = props.bgColor;
        container.style.color = props.textColor;

        if (isShort) {
          // Compact 1-line format for 10~20m short tasks
          container.innerHTML = `
            <div class="flex items-center justify-between gap-1 h-full w-full overflow-hidden" style="color: ${props.textColor};">
              <div class="flex items-center gap-1.5 min-w-0 truncate">
                <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${props.dotColor};"></span>
                <span class="font-bold text-[11px] truncate tracking-tight">[${props.orderName}] ${props.groupName}</span>
              </div>
              <span class="text-[10px] font-mono shrink-0 font-bold opacity-80">${props.startTimeStr}~${props.endTimeStr}</span>
            </div>
          `;
        } else {
          // Rich multi-line card for standard / long tasks
          container.innerHTML = `
            <div class="flex flex-col justify-between h-full w-full" style="color: ${props.textColor};">
              <div>
                <div class="text-[10px] font-bold opacity-75 truncate mb-0.5">${props.orderName}</div>
                <div class="flex items-center justify-between gap-1">
                  <span class="font-extrabold text-xs truncate tracking-tight">${props.groupName}</span>
                  <span class="text-[9px] px-1.5 py-0.5 rounded font-black shrink-0" style="background-color: ${props.badgeBg}; color: ${props.textColor};">${props.statusLabel}</span>
                </div>
                <div class="text-[10px] font-mono font-bold mt-1 opacity-90">${props.startTimeStr} ~ ${props.endTimeStr} (${props.durationMinutes}분)</div>
              </div>
              ${
                props.machine || props.worker
                  ? `<div class="flex items-center gap-1.5 text-[10px] truncate mt-1 pt-1 border-t border-black/10 font-medium opacity-85">
                      ${props.machine ? `<span class="truncate">⚙️ ${props.machine}</span>` : ''}
                      ${props.worker ? `<span class="truncate">👤 ${props.worker}</span>` : ''}
                    </div>`
                  : ''
              }
            </div>
          `;
        }

        return { domNodes: [container] };
      },
      datesSet: (dateInfo: any) => {
        setCalendarTitle(dateInfo.view.title);
      },
    });

    calendar.render();
    fcInstanceRef.current = calendar;

    // Initial title update
    setCalendarTitle(calendar.view.title);

    return () => {
      if (calendar) {
        calendar.destroy();
      }
    };
  }, [isFcLoaded, currentViewMode, showWeekends]);

  // Update events dynamically when fcEvents change
  useEffect(() => {
    if (fcInstanceRef.current) {
      fcInstanceRef.current.removeAllEvents();
      fcInstanceRef.current.addEventSource(fcEvents);
    }
  }, [fcEvents]);

  // Calendar Navigation Handlers
  const handleToday = () => {
    if (fcInstanceRef.current) {
      fcInstanceRef.current.today();
      setCalendarTitle(fcInstanceRef.current.view.title);
    }
  };

  const handlePrev = () => {
    if (fcInstanceRef.current) {
      fcInstanceRef.current.prev();
      setCalendarTitle(fcInstanceRef.current.view.title);
    }
  };

  const handleNext = () => {
    if (fcInstanceRef.current) {
      fcInstanceRef.current.next();
      setCalendarTitle(fcInstanceRef.current.view.title);
    }
  };

  const handleViewChange = (viewName: 'timeGridWeek' | 'timeGridDay') => {
    setCurrentViewMode(viewName);
    if (fcInstanceRef.current) {
      fcInstanceRef.current.changeView(viewName);
      setCalendarTitle(fcInstanceRef.current.view.title);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white text-slate-800 overflow-hidden select-none font-sans relative">
      {/* Custom Scoped CSS for Google Calendar Look & Feel in FullCalendar */}
      <style>{`
        /* Google Calendar Clean Theme Overrides */
        .fc-theme-standard td,
        .fc-theme-standard th,
        .fc-theme-standard .fc-scrollgrid {
          border-color: #e2e8f0 !important; /* 연하고 부드러운 border-slate-200 */
        }
        .fc-scrollgrid-section > td {
          border: none !important;
        }
        .fc .fc-col-header-cell {
          background-color: #ffffff;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .fc .fc-col-header-cell-cushion {
          color: #334155;
          font-weight: 700;
          font-size: 13px;
          text-decoration: none !important;
        }
        .fc-day-today .fc-col-header-cell-cushion {
          color: #2563eb !important;
        }
        .fc-timegrid-slot {
          height: 32px !important;
          border-bottom: 1px solid #e2e8f0 !important; /* 1시간 단위 실선 */
        }
        .fc-timegrid-slot-minor {
          border-bottom: 1px dashed #f1f5f9 !important; /* 30분 단위 보조선 */
        }
        .fc-timegrid-slot-label-cushion {
          font-size: 11px;
          font-weight: 700;
          font-family: monospace;
          color: #64748b;
          padding-right: 6px;
        }
        
        /* Event Block: No Border, Clean Pastel Background & Shadow */
        .fc-timegrid-event {
          border: none !important;
          border-radius: 6px !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06) !important;
          padding: 0 !important;
          margin: 1px !important;
          min-height: 28px !important;
          overflow: hidden !important;
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        }
        .fc-timegrid-event:hover {
          transform: translateY(-1px);
          z-index: 30 !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        }
        .fc-timegrid-event-harness {
          border: none !important;
        }
        .fc-v-event {
          border: none !important;
          background-color: transparent !important;
        }
        .fc-v-event .fc-event-main {
          padding: 0 !important;
          border: none !important;
          height: 100% !important;
        }
        
        /* Now Indicator */
        .fc-timegrid-now-indicator-line {
          border-color: #ef4444 !important;
          border-width: 2px !important;
          z-index: 20 !important;
        }
        .fc-timegrid-now-indicator-arrow {
          border-color: #ef4444 transparent transparent !important;
        }
        
        /* Smooth Scrollbar */
        .fc-scroller {
          overflow-y: auto !important;
        }
        .fc-scroller::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .fc-scroller::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .fc-scroller::-webkit-scrollbar-track {
          background: #f8fafc;
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. TOP GOOGLE CALENDAR HEADER                                             */}
      {/* ========================================================================= */}
      <header className="h-14 px-4 border-b border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0 z-30 shadow-2xs">
        {/* Left: [오늘], < >, Header Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleToday}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition active:scale-95 cursor-pointer"
            title="오늘 날짜로 이동"
          >
            오늘
          </button>

          <div className="flex items-center gap-0.5">
            <button
              onClick={handlePrev}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
              title="이전"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
              title="다음"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight ml-1 sm:ml-2 truncate">
            {calendarTitle || '생산 일정 캘린더'}
          </h1>
        </div>

        {/* Right: View Switcher, Search, Filter, New Order */}
        <div className="flex items-center gap-2" ref={filterDropdownRef}>
          {isSearchOpen ? (
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="공정/설비/수주 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-7 py-1 text-xs border border-slate-300 rounded-lg w-40 sm:w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title="검색"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer ${
                isFilterOpen ? 'bg-blue-50 text-blue-600' : ''
              }`}
              title="필터"
            >
              <Filter className="w-4 h-4" />
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 text-xs space-y-2.5">
                <div className="font-bold text-slate-800 border-b pb-1 flex justify-between items-center">
                  <span>캘린더 필터</span>
                  <button
                    onClick={() => {
                      setSelectedMachineFilter('ALL');
                      setSelectedWorkerFilter('ALL');
                    }}
                    className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                  >
                    초기화
                  </button>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">설비 필터</label>
                  <select
                    value={selectedMachineFilter}
                    onChange={(e) => setSelectedMachineFilter(e.target.value)}
                    className="w-full p-1.5 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="ALL">전체 설비 (21대)</option>
                    {ALL_EQUIPMENT_LIST.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">작업자 필터</label>
                  <select
                    value={selectedWorkerFilter}
                    onChange={(e) => setSelectedWorkerFilter(e.target.value)}
                    className="w-full p-1.5 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="ALL">전체 작업자</option>
                    {approvedOperators.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div className="border-t pt-2 space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCompleted}
                      onChange={(e) => setShowCompleted(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-700">완료된 공정 표시</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showWeekends}
                      onChange={(e) => setShowWeekends(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-700">주말 표시</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* View Mode Switcher: [일] [주] */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => handleViewChange('timeGridDay')}
              className={`px-3.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                currentViewMode === 'timeGridDay'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              일
            </button>
            <button
              onClick={() => handleViewChange('timeGridWeek')}
              className={`px-3.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                currentViewMode === 'timeGridWeek'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              주
            </button>
          </div>

          {onNavigateToOrderForm && (
            <button
              onClick={onNavigateToOrderForm}
              className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>신규 수주</span>
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1.5. STATUS COLOR LEGEND BAR (색상별 상태 범례)                             */}
      {/* ========================================================================= */}
      <div className="h-10 px-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 overflow-x-auto text-xs select-none shadow-2xs">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1 shrink-0">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            상태 범례:
          </span>

          {/* All Filter Button */}
          <button
            onClick={() => setSelectedStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-full font-bold text-[11px] transition cursor-pointer shrink-0 ${
              selectedStatusFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-100'
            }`}
          >
            전체 ({scheduledTasks.length})
          </button>

          {/* 계획 (READY/PLANNED) */}
          <button
            onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'READY' ? 'ALL' : 'READY')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-extrabold text-[11px] transition cursor-pointer shrink-0 border ${
              selectedStatusFilter === 'READY'
                ? 'ring-2 ring-blue-500 ring-offset-1 shadow-xs'
                : 'hover:opacity-90'
            }`}
            style={{ backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#bfdbfe' }}
            title="계획 상태 공정 필터"
          >
            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
            <span>계획</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-200/80 text-blue-900 font-mono font-bold">
              {statusCounts.READY}
            </span>
          </button>

          {/* 진행중 (IN_PROGRESS) */}
          <button
            onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-extrabold text-[11px] transition cursor-pointer shrink-0 border ${
              selectedStatusFilter === 'IN_PROGRESS'
                ? 'ring-2 ring-amber-500 ring-offset-1 shadow-xs'
                : 'hover:opacity-90'
            }`}
            style={{ backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}
            title="진행중 상태 공정 필터"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse"></span>
            <span>진행중</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200/80 text-amber-900 font-mono font-bold">
              {statusCounts.IN_PROGRESS}
            </span>
          </button>

          {/* 완료 (COMPLETED) */}
          <button
            onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-extrabold text-[11px] transition cursor-pointer shrink-0 border ${
              selectedStatusFilter === 'COMPLETED'
                ? 'ring-2 ring-emerald-500 ring-offset-1 shadow-xs'
                : 'hover:opacity-90'
            }`}
            style={{ backgroundColor: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }}
            title="완료 상태 공정 필터"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
            <span>완료</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-200/80 text-emerald-900 font-mono font-bold">
              {statusCounts.COMPLETED}
            </span>
          </button>

          {/* 지연 (DELAYED) */}
          <button
            onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'DELAYED' ? 'ALL' : 'DELAYED')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-extrabold text-[11px] transition cursor-pointer shrink-0 border ${
              selectedStatusFilter === 'DELAYED'
                ? 'ring-2 ring-red-500 ring-offset-1 shadow-xs'
                : 'hover:opacity-90'
            }`}
            style={{ backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fecaca' }}
            title="지연 상태 공정 필터"
          >
            <span className="w-2 h-2 rounded-full bg-red-600 shrink-0"></span>
            <span>지연</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-200/80 text-red-900 font-mono font-bold">
              {statusCounts.DELAYED}
            </span>
          </button>

          {/* 일시정지 (PAUSED) */}
          <button
            onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'PAUSED' ? 'ALL' : 'PAUSED')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-extrabold text-[11px] transition cursor-pointer shrink-0 border ${
              selectedStatusFilter === 'PAUSED'
                ? 'ring-2 ring-orange-500 ring-offset-1 shadow-xs'
                : 'hover:opacity-90'
            }`}
            style={{ backgroundColor: '#ffedd5', color: '#9a3412', borderColor: '#fed7aa' }}
            title="일시정지 상태 공정 필터"
          >
            <span className="w-2 h-2 rounded-full bg-orange-600 shrink-0"></span>
            <span>일시정지</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-orange-200/80 text-orange-900 font-mono font-bold">
              {statusCounts.PAUSED}
            </span>
          </button>
        </div>

        {/* Quick hint on right */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-500 shrink-0 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>운영 시간: 08:00 ~ 21:00 (30분 보조선)</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FULLCALENDAR TIMEGRID CONTAINER (08:00 ~ 21:00)                         */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-hidden relative p-2 bg-white">
        {!isFcLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20 gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-600">FullCalendar 라이브러리를 불러오는 중...</p>
          </div>
        )}
        <div ref={calendarRef} className="w-full h-full" />
      </div>

      {/* ========================================================================= */}
      {/* 3. TASK DETAIL & MES EXECUTION MODAL                                      */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedTask && (
        <CalendarTaskDetailModal
          task={selectedTask}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedTaskKey(null);
          }}
          onUpdateProgress={onUpdateProgress}
          currentUser={currentUser}
          approvedOperators={approvedOperators}
        />
      )}
    </div>
  );
};
