import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ScheduledTaskItem,
  CalendarViewMode,
  TaskExecutionStatus,
  ProcessProgressItem,
  User,
  Order
} from '../types';
import { ALL_EQUIPMENT_LIST, KOREAN_DAYS } from '../data/defaultData';
import { CalendarTaskDetailModal } from './CalendarTaskDetailModal';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  HelpCircle,
  Settings,
  Plus,
  Check,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar as CalendarIcon,
  X,
  Filter
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

// Google Calendar Time Bounds (03:00 AM ~ 24:00 Midnight)
const START_HOUR = 3;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOUR_HEIGHT = 58; // Standard Google Calendar row height (px)

interface LayoutEvent {
  task: ScheduledTaskItem;
  topPx: number;
  heightPx: number;
  colIndex: number;
  totalCols: number;
  startTimeStr: string;
  endTimeStr: string;
  title: string;
}

export const ProductionCalendarView: React.FC<ProductionCalendarViewProps> = ({
  scheduledTasks,
  orders,
  processProgressMap,
  onUpdateProgress,
  currentUser,
  approvedOperators = [],
  onNavigateToOrderForm,
}) => {
  // Navigation & View Mode ('day' | 'week' | 'month' | 'year' | '4days')
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (scheduledTasks.length > 0) {
      const activeTask = scheduledTasks.find((t) => !t.isCompleted);
      if (activeTask) return new Date(activeTask.start);
      return new Date(scheduledTasks[0].start);
    }
    return new Date();
  });

  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'year' | '4days'>('week');
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Display Options (Google Calendar standard toggles)
  const [showWeekends, setShowWeekends] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showDeclined, setShowDeclined] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMachineFilter, setSelectedMachineFilter] = useState('ALL');
  const [selectedWorkerFilter, setSelectedWorkerFilter] = useState('ALL');
  const [selectedOrderFilter, setSelectedOrderFilter] = useState('ALL');

  // Modal State
  const [selectedTask, setSelectedTask] = useState<ScheduledTaskItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [monthMoreDate, setMonthMoreDate] = useState<Date | null>(null);

  const [nowTime, setNowTime] = useState<Date>(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsViewDropdownOpen(false);
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll to 08:00 on view change
  useEffect(() => {
    if (scrollContainerRef.current && (viewMode === 'day' || viewMode === 'week' || viewMode === '4days')) {
      const targetScroll = Math.max(0, (8 - START_HOUR) * HOUR_HEIGHT - 30);
      scrollContainerRef.current.scrollTop = targetScroll;
    }
  }, [viewMode]);

  // Keyboard Shortcuts (Google Calendar standard shortcuts: D, W, M, Y, X, T)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === 'd' || e.key === 'D') setViewMode('day');
      if (e.key === 'w' || e.key === 'W') setViewMode('week');
      if (e.key === 'm' || e.key === 'M') setViewMode('month');
      if (e.key === 'y' || e.key === 'Y') setViewMode('year');
      if (e.key === 'x' || e.key === 'X') setViewMode('4days');
      if (e.key === 't' || e.key === 'T') setCurrentDate(new Date());
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navigation Handlers
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() - 1);
    else if (viewMode === '4days') d.setDate(d.getDate() - 4);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'year') d.setFullYear(d.getFullYear() - 1);
    setCurrentDate(d);
  };

  const goToNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() + 1);
    else if (viewMode === '4days') d.setDate(d.getDate() + 4);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'year') d.setFullYear(d.getFullYear() + 1);
    setCurrentDate(d);
  };

  // Google Calendar Header Title (Exact format: "2026년 8월 14일" or "2026년 8월" or "2026")
  const headerTitle = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth() + 1;
    const day = currentDate.getDate();

    if (viewMode === 'day') {
      return `${y}년 ${m}월 ${day}일`;
    } else if (viewMode === 'year') {
      return `${y}년`;
    } else if (viewMode === '4days') {
      const end = new Date(currentDate);
      end.setDate(end.getDate() + 3);
      if (currentDate.getMonth() === end.getMonth()) {
        return `${y}년 ${m}월`;
      }
      return `${y}년 ${m}월 ~ ${end.getMonth() + 1}월`;
    } else {
      return `${y}년 ${m}월`;
    }
  }, [currentDate, viewMode]);

  // Active Days for Current View (Week = 7 days or 5 days if weekend hidden, 4days = 4 days)
  const activeDays = useMemo(() => {
    if (viewMode === 'day') {
      return [new Date(currentDate)];
    }

    if (viewMode === '4days') {
      const days: Date[] = [];
      for (let i = 0; i < 4; i++) {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + i);
        days.push(d);
      }
      return days;
    }

    // Week view
    const days: Date[] = [];
    const startOfWeek = new Date(currentDate);
    const dayOffset = startOfWeek.getDay(); // 0 is Sunday
    startOfWeek.setDate(startOfWeek.getDate() - dayOffset);
    startOfWeek.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      if (!showWeekends && (d.getDay() === 0 || d.getDay() === 6)) {
        continue;
      }
      days.push(d);
    }
    return days;
  }, [currentDate, viewMode, showWeekends]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return scheduledTasks.filter((task) => {
      if (!showCompleted && task.isCompleted) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = task.orderName.toLowerCase().includes(q);
        const matchesId = task.orderId.toLowerCase().includes(q);
        const matchesProc = task.groupName.toLowerCase().includes(q);
        const matchesWorker = (task.worker || '').toLowerCase().includes(q);
        const matchesMachine = (task.machine || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesProc && !matchesWorker && !matchesMachine) {
          return false;
        }
      }

      if (selectedMachineFilter !== 'ALL' && task.machine !== selectedMachineFilter) return false;
      if (selectedWorkerFilter !== 'ALL' && task.worker !== selectedWorkerFilter) return false;
      if (selectedOrderFilter !== 'ALL' && task.orderId !== selectedOrderFilter) return false;

      return true;
    });
  }, [
    scheduledTasks,
    showCompleted,
    searchQuery,
    selectedMachineFilter,
    selectedWorkerFilter,
    selectedOrderFilter,
  ]);

  const isSameDay = (d1: Date, d2: Date): boolean => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const getTasksForDay = (day: Date) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    return filteredTasks.filter((t) => {
      const taskStart = new Date(t.plannedStart);
      const taskEnd = new Date(t.plannedEnd);
      return taskStart <= dayEnd && taskEnd >= dayStart;
    });
  };

  // Google Calendar Multicolumn layout calculation
  const calculateDayLayoutEvents = (dayTasks: ScheduledTaskItem[], dayRef: Date): LayoutEvent[] => {
    if (dayTasks.length === 0) return [];

    const refDay = new Date(dayRef);
    refDay.setHours(0, 0, 0, 0);

    const parsed = dayTasks.map((task) => {
      const s = new Date(task.plannedStart);
      const e = new Date(task.plannedEnd);

      const sDay = new Date(s);
      sDay.setHours(0, 0, 0, 0);

      let startHour = s.getHours() + s.getMinutes() / 60;
      if (sDay < refDay) startHour = START_HOUR;

      let endHour = e.getHours() + e.getMinutes() / 60;
      if (
        e.getFullYear() > refDay.getFullYear() ||
        e.getMonth() > refDay.getMonth() ||
        e.getDate() > refDay.getDate()
      ) {
        endHour = END_HOUR;
      }

      const clampedStart = Math.max(START_HOUR, Math.min(END_HOUR, startHour));
      const clampedEnd = Math.max(START_HOUR, Math.min(END_HOUR, endHour));

      const topPx = (clampedStart - START_HOUR) * HOUR_HEIGHT;
      const durationHours = Math.max(0.45, clampedEnd - clampedStart);
      const heightPx = Math.max(38, durationHours * HOUR_HEIGHT);

      const formatTime = (d: Date) => {
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      };

      return {
        task,
        startHour: clampedStart,
        endHour: clampedEnd,
        topPx,
        heightPx,
        startTimeStr: formatTime(s),
        endTimeStr: formatTime(e),
        title: `${task.groupName} #${task.productNo}호기`,
      };
    });

    parsed.sort((a, b) => {
      if (a.startHour !== b.startHour) return a.startHour - b.startHour;
      return (b.endHour - b.startHour) - (a.endHour - a.startHour);
    });

    const clusters: (typeof parsed)[] = [];
    let currentCluster: typeof parsed = [];
    let clusterEnd = -1;

    parsed.forEach((item) => {
      if (currentCluster.length === 0) {
        currentCluster.push(item);
        clusterEnd = item.endHour;
      } else if (item.startHour < clusterEnd) {
        currentCluster.push(item);
        clusterEnd = Math.max(clusterEnd, item.endHour);
      } else {
        clusters.push(currentCluster);
        currentCluster = [item];
        clusterEnd = item.endHour;
      }
    });
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    const layoutResults: LayoutEvent[] = [];

    clusters.forEach((cluster) => {
      const columns: { endHour: number }[] = [];
      const itemAssignments: { item: (typeof parsed)[0]; colIndex: number }[] = [];

      cluster.forEach((item) => {
        let placedCol = -1;
        for (let i = 0; i < columns.length; i++) {
          if (columns[i].endHour <= item.startHour + 0.05) {
            placedCol = i;
            columns[i].endHour = item.endHour;
            break;
          }
        }

        if (placedCol === -1) {
          placedCol = columns.length;
          columns.push({ endHour: item.endHour });
        }

        itemAssignments.push({ item, colIndex: placedCol });
      });

      const totalCols = columns.length;

      itemAssignments.forEach(({ item, colIndex }) => {
        layoutResults.push({
          task: item.task,
          topPx: item.topPx,
          heightPx: item.heightPx,
          colIndex,
          totalCols,
          startTimeStr: item.startTimeStr,
          endTimeStr: item.endTimeStr,
          title: item.title,
        });
      });
    });

    return layoutResults;
  };

  // Google Calendar Exact Card Style (Warm Ivory Soft Beige Card)
  const getGoogleEventCardStyle = (task: ScheduledTaskItem) => {
    if (task.status === 'COMPLETED') {
      return {
        bg: 'bg-[#E6F4EA] hover:bg-[#D4EDDA] border border-[#CEEAD6] text-[#137333]',
        dotColor: 'bg-[#188038]',
        titleColor: 'text-[#0D652D]',
        timeColor: 'text-[#137333]',
      };
    }
    if (task.status === 'IN_PROGRESS') {
      return {
        bg: 'bg-[#FEF7E0] hover:bg-[#FEEFC3] border border-[#FEEFC3] text-[#7A4100]',
        dotColor: 'bg-[#F29900]',
        titleColor: 'text-[#7A4100]',
        timeColor: 'text-[#9A5200]',
      };
    }
    // Default Beige/Warm Ivory Soft Style (as in User Screenshots 1 & 2)
    return {
      bg: 'bg-[#F1EAE2] hover:bg-[#E8DFC] border border-[#E3D7CB] text-[#3E322D]',
      dotColor: 'bg-[#8D6E63]',
      titleColor: 'text-[#202124]',
      timeColor: 'text-[#5F6368]',
    };
  };

  // Red line for current time
  const currentTimePosition = useMemo(() => {
    const h = nowTime.getHours() + nowTime.getMinutes() / 60;
    if (h < START_HOUR || h > END_HOUR) return null;
    return (h - START_HOUR) * HOUR_HEIGHT;
  }, [nowTime]);

  // Month Grid Calculation
  const monthGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startOffset = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({ date: d, isCurrentMonth: false });
    }

    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true });
    }

    const remaining = 35 - days.length >= 0 ? 35 - days.length : 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  // Year View 12 Months Generator
  const yearMonths = useMemo(() => {
    const year = currentDate.getFullYear();
    return Array.from({ length: 12 }).map((_, mIdx) => {
      const firstDay = new Date(year, mIdx, 1);
      const lastDay = new Date(year, mIdx + 1, 0);
      const startOffset = firstDay.getDay();
      const totalDays = lastDay.getDate();

      const days: { date: Date; isCurrentMonth: boolean }[] = [];

      const prevLast = new Date(year, mIdx, 0).getDate();
      for (let i = startOffset - 1; i >= 0; i--) {
        days.push({ date: new Date(year, mIdx - 1, prevLast - i), isCurrentMonth: false });
      }
      for (let i = 1; i <= totalDays; i++) {
        days.push({ date: new Date(year, mIdx, i), isCurrentMonth: true });
      }
      const rem = 35 - days.length >= 0 ? 35 - days.length : 42 - days.length;
      for (let i = 1; i <= rem; i++) {
        days.push({ date: new Date(year, mIdx + 1, i), isCurrentMonth: false });
      }

      return {
        monthIndex: mIdx,
        monthName: `${mIdx + 1}월`,
        days,
      };
    });
  }, [currentDate]);

  return (
    <div className="flex flex-col h-full bg-white text-[#202124] overflow-hidden select-none font-sans">
      {/* ========================================================================= */}
      {/* 1. GOOGLE CALENDAR OFFICIAL TOP HEADER (Identical to screenshots 1, 2, 3, 4) */}
      {/* ========================================================================= */}
      <header className="h-16 px-4 border-b border-[#E0E0E0] bg-white flex items-center justify-between gap-4 shrink-0 z-30">
        {/* Left Section: [오늘] Button, < >, Date Title */}
        <div className="flex items-center gap-3">
          {/* Official Google [오늘] Pill Button */}
          <button
            onClick={goToToday}
            className="px-5 py-2 text-sm font-medium text-[#3C4043] hover:bg-[#F1F3F4] rounded-full border border-[#DADCE0] transition active:scale-95 cursor-pointer"
          >
            오늘
          </button>

          {/* Nav Arrows < > */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={goToPrev}
              className="p-2 text-[#5F6368] hover:bg-[#F1F3F4] rounded-full transition cursor-pointer"
              title="이전 (P)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="p-2 text-[#5F6368] hover:bg-[#F1F3F4] rounded-full transition cursor-pointer"
              title="다음 (N)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Date Title (e.g. "2026년 8월 14일" or "2026년 8월") */}
          <h1 className="text-[22px] font-normal text-[#3C4043] tracking-tight ml-2">
            {headerTitle}
          </h1>
        </div>

        {/* Right Section: Search, Help, Settings, View Dropdown, Order Button */}
        <div className="flex items-center gap-2" ref={dropdownRef}>
          {/* Quick Search Toggle */}
          {isSearchOpen ? (
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="공정/설비/작업자 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 py-1.5 text-xs border border-slate-300 rounded-full w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-2.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-[#5F6368] hover:bg-[#F1F3F4] rounded-full transition cursor-pointer"
              title="검색"
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          {/* Help Button */}
          <button
            onClick={() => alert('ℹ️ 구글 캘린더 단축키 안내:\n\n• D: 일간 뷰\n• W: 주간 뷰\n• M: 월간 뷰\n• Y: 연도 뷰\n• X: 4일 뷰\n• T: 오늘 날짜로 이동\n• 각 일정 클릭 시 상세 모달 및 작업 상태 변경 가능')}
            className="p-2 text-[#5F6368] hover:bg-[#F1F3F4] rounded-full transition cursor-pointer"
            title="도움말 및 단축키"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Filter / Settings Button */}
          <div className="relative">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-2 text-[#5F6368] hover:bg-[#F1F3F4] rounded-full transition cursor-pointer ${
                isSettingsOpen ? 'bg-[#E8F0FE] text-[#1A73E8]' : ''
              }`}
              title="설정 및 필터"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Settings & Filter Dropdown */}
            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 text-xs space-y-3">
                <div className="font-bold text-slate-800 border-b pb-1.5 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-blue-600" />
                  <span>설비 및 작업자 필터</span>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">설비 선택</label>
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
                  <label className="block text-[11px] text-slate-500 mb-1">작업자 선택</label>
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
              </div>
            )}
          </div>

          {/* Official Google View Mode Dropdown (일, 주, 월, 연도, 4일, 옵션 체크) */}
          <div className="relative">
            <button
              onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#3C4043] hover:bg-[#F1F3F4] rounded-lg border border-[#DADCE0] transition cursor-pointer"
            >
              <span>
                {viewMode === 'day' && '일'}
                {viewMode === 'week' && '주'}
                {viewMode === 'month' && '월'}
                {viewMode === 'year' && '연도'}
                {viewMode === '4days' && '4일'}
              </span>
              <ChevronDown className="w-4 h-4 text-[#5F6368]" />
            </button>

            {/* View Dropdown Menu (Screenshot 4 exact replica) */}
            {isViewDropdownOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-2xl border border-[#DADCE0] py-1.5 z-50 text-sm">
                <button
                  onClick={() => {
                    setViewMode('day');
                    setIsViewDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 hover:bg-[#F1F3F4] text-left cursor-pointer ${
                    viewMode === 'day' ? 'bg-[#E8F0FE] text-[#1A73E8] font-medium' : 'text-[#3C4043]'
                  }`}
                >
                  <span>일</span>
                  <span className="text-xs text-[#80868B] font-mono">D</span>
                </button>

                <button
                  onClick={() => {
                    setViewMode('week');
                    setIsViewDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 hover:bg-[#F1F3F4] text-left cursor-pointer ${
                    viewMode === 'week' ? 'bg-[#E8F0FE] text-[#1A73E8] font-medium' : 'text-[#3C4043]'
                  }`}
                >
                  <span>주</span>
                  <span className="text-xs text-[#80868B] font-mono">W</span>
                </button>

                <button
                  onClick={() => {
                    setViewMode('month');
                    setIsViewDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 hover:bg-[#F1F3F4] text-left cursor-pointer ${
                    viewMode === 'month' ? 'bg-[#E8F0FE] text-[#1A73E8] font-medium' : 'text-[#3C4043]'
                  }`}
                >
                  <span>월</span>
                  <span className="text-xs text-[#80868B] font-mono">M</span>
                </button>

                <button
                  onClick={() => {
                    setViewMode('year');
                    setIsViewDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 hover:bg-[#F1F3F4] text-left cursor-pointer ${
                    viewMode === 'year' ? 'bg-[#E8F0FE] text-[#1A73E8] font-medium' : 'text-[#3C4043]'
                  }`}
                >
                  <span>연도</span>
                  <span className="text-xs text-[#80868B] font-mono">Y</span>
                </button>

                <button
                  onClick={() => {
                    setViewMode('4days');
                    setIsViewDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 hover:bg-[#F1F3F4] text-left cursor-pointer ${
                    viewMode === '4days' ? 'bg-[#E8F0FE] text-[#1A73E8] font-medium' : 'text-[#3C4043]'
                  }`}
                >
                  <span>4일</span>
                  <span className="text-xs text-[#80868B] font-mono">X</span>
                </button>

                <div className="my-1.5 border-t border-[#E0E0E0]" />

                {/* Checklist items in dropdown (as in Screenshot 4) */}
                <button
                  onClick={() => setShowWeekends(!showWeekends)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F1F3F4] text-left text-xs text-[#3C4043] cursor-pointer"
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    {showWeekends && <Check className="w-4 h-4 text-[#1A73E8]" />}
                  </div>
                  <span>주말 표시</span>
                </button>

                <button
                  onClick={() => setShowDeclined(!showDeclined)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F1F3F4] text-left text-xs text-[#3C4043] cursor-pointer"
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    {showDeclined && <Check className="w-4 h-4 text-[#1A73E8]" />}
                  </div>
                  <span>거절한 일정 표시</span>
                </button>

                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F1F3F4] text-left text-xs text-[#3C4043] cursor-pointer"
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    {showCompleted && <Check className="w-4 h-4 text-[#1A73E8]" />}
                  </div>
                  <span>완료된 할 일 표시</span>
                </button>
              </div>
            )}
          </div>

          {/* New Order Button */}
          {onNavigateToOrderForm && (
            <button
              onClick={onNavigateToOrderForm}
              className="ml-2 px-4 py-2 text-sm font-bold bg-[#00C4B4] hover:bg-[#00a89a] text-white rounded-full shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>신규 수주</span>
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. CALENDAR BODY (DAY, WEEK, 4DAYS, MONTH, YEAR) */}
      {/* ========================================================================= */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-auto relative flex flex-col bg-white"
      >
        {/* ------------------------------------------------------------- */}
        {/* VIEW: DAY, WEEK, 4DAYS (Hourly Time Grid) */}
        {/* ------------------------------------------------------------- */}
        {(viewMode === 'day' || viewMode === 'week' || viewMode === '4days') && (
          <div className="flex flex-col min-w-[800px] flex-1">
            {/* Header Row: GMT + Day Column Headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `64px repeat(${activeDays.length}, minmax(0, 1fr))`,
              }}
              className="sticky top-0 z-20 bg-white border-b border-[#E0E0E0] shadow-2xs"
            >
              {/* GMT Timezone Label (Screenshot 1 & 2) */}
              <div className="py-4 text-center text-[11px] font-mono text-[#70757A] border-r border-[#E0E0E0] flex flex-col items-center justify-center">
                <span>GMT+09</span>
              </div>

              {/* Day Headers (Day Korean name + Big Round Date Number) */}
              {activeDays.map((d, idx) => {
                const isToday = isSameDay(d, nowTime);
                const isSun = d.getDay() === 0;
                const isSat = d.getDay() === 6;

                return (
                  <div
                    key={idx}
                    className={`py-3 px-2 text-center border-r border-[#E0E0E0] last:border-r-0 ${
                      isToday ? 'bg-transparent' : ''
                    }`}
                  >
                    {/* Day name (일, 월, 화, 수, 목, 금, 토) */}
                    <div
                      className={`text-xs font-medium mb-1.5 ${
                        isToday
                          ? 'text-[#1A73E8] font-bold'
                          : isSun
                          ? 'text-[#D93025]'
                          : isSat
                          ? 'text-[#1A73E8]'
                          : 'text-[#70757A]'
                      }`}
                    >
                      {KOREAN_DAYS[d.getDay()]}
                    </div>

                    {/* Round Date Number Badge (Blue circle if today - Screenshot 1 & 2) */}
                    <div className="flex justify-center">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center text-2xl font-normal transition ${
                          isToday
                            ? 'bg-[#1A73E8] text-white font-medium shadow-sm'
                            : isSun
                            ? 'text-[#D93025]'
                            : isSat
                            ? 'text-[#1A73E8]'
                            : 'text-[#3C4043]'
                        }`}
                      >
                        {d.getDate()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main Hourly Time Grid (03:00 ~ 24:00) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `64px repeat(${activeDays.length}, minmax(0, 1fr))`,
              }}
              className="relative flex-1"
            >
              {/* Left Time Label Column */}
              <div className="border-r border-[#E0E0E0] bg-white relative select-none">
                {Array.from({ length: TOTAL_HOURS }).map((_, hIdx) => {
                  const hour = START_HOUR + hIdx;
                  return (
                    <div
                      key={hour}
                      style={{ height: `${HOUR_HEIGHT}px` }}
                      className="border-b border-[#F1F3F4] pr-2 text-right text-[11px] font-mono text-[#70757A] relative"
                    >
                      <span className="relative -top-2.5">
                        {String(hour).padStart(2, '0')}:00
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Day Event Columns */}
              {activeDays.map((day, colIdx) => {
                const isToday = isSameDay(day, nowTime);
                const dayTasks = getTasksForDay(day);
                const layoutEvents = calculateDayLayoutEvents(dayTasks, day);

                return (
                  <div
                    key={colIdx}
                    className={`relative border-r border-[#E0E0E0] last:border-r-0 ${
                      isToday ? 'bg-blue-50/10' : 'bg-white'
                    }`}
                  >
                    {/* Hourly Horizontal Lines */}
                    {Array.from({ length: TOTAL_HOURS }).map((_, hIdx) => (
                      <div
                        key={hIdx}
                        style={{ height: `${HOUR_HEIGHT}px` }}
                        className="border-b border-[#F1F3F4]"
                      />
                    ))}

                    {/* Red line for current time */}
                    {isToday && currentTimePosition !== null && (
                      <div
                        style={{ top: `${currentTimePosition}px` }}
                        className="absolute inset-x-0 border-t-2 border-[#EA4335] z-20 pointer-events-none flex items-center"
                      >
                        <div className="w-3 h-3 rounded-full bg-[#EA4335] -ml-1.5 shadow-xs" />
                      </div>
                    )}

                    {/* Event Cards (Screenshot 1 & 2 Exact Match: Warm Ivory / Beige Rounded Cards) */}
                    {layoutEvents.map((evt) => {
                      const { task, topPx, heightPx, colIndex, totalCols, startTimeStr, endTimeStr, title } = evt;
                      const cardStyle = getGoogleEventCardStyle(task);

                      const widthPercent = 100 / totalCols;
                      const leftPercent = colIndex * widthPercent;

                      return (
                        <div
                          key={task.processKey}
                          onClick={() => {
                            setSelectedTask(task);
                            setIsDetailModalOpen(true);
                          }}
                          style={{
                            top: `${topPx}px`,
                            height: `${heightPx}px`,
                            left: `calc(${leftPercent}% + 3px)`,
                            width: `calc(${widthPercent}% - 6px)`,
                          }}
                          className={`absolute rounded-lg p-2 z-10 cursor-pointer overflow-hidden transition-all duration-150 hover:z-30 hover:shadow-md hover:ring-1 hover:ring-[#1A73E8] ${cardStyle.bg} flex flex-col justify-start leading-tight`}
                          title={`${title}\n${startTimeStr}~${endTimeStr}\n수주: ${task.orderName}\n설비: ${task.machine || '미지정'} / 작업자: ${task.worker || '미지정'}`}
                        >
                          {/* Row 1: Title (e.g. "Go to work", "The Simpson", "11. 2차가공 #1호기") */}
                          <div className={`text-[13px] font-normal truncate ${cardStyle.titleColor}`}>
                            {title}
                          </div>

                          {/* Row 2: Time Range (e.g. "05:10~06:10", "10:00~11:00") */}
                          <div className={`text-[12px] font-mono mt-0.5 truncate ${cardStyle.timeColor}`}>
                            {startTimeStr}~{endTimeStr}
                          </div>

                          {/* Row 3: Order / Machine / Worker (if height permits >= 60px) */}
                          {heightPx >= 60 && (
                            <div className="text-[11px] text-[#5F6368] truncate mt-1">
                              {task.orderName} {task.machine ? `· ${task.machine}` : ''}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW: MONTH VIEW (Screenshot 3 Exact Replica with Dots & +More) */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'month' && (
          <div className="flex flex-col flex-1 min-w-[850px]">
            {/* Weekday Names Header */}
            <div className="grid grid-cols-7 border-b border-[#E0E0E0] bg-white text-center py-2 text-xs font-medium text-[#70757A]">
              {KOREAN_DAYS.map((d, i) => (
                <div key={i} className={i === 0 ? 'text-[#D93025]' : i === 6 ? 'text-[#1A73E8]' : ''}>
                  {d}
                </div>
              ))}
            </div>

            {/* 7x5 or 7x6 Month Matrix Grid */}
            <div className="grid grid-cols-7 flex-1 border-l border-[#E0E0E0] bg-white">
              {monthGrid.map(({ date, isCurrentMonth }, idx) => {
                const isToday = isSameDay(date, nowTime);
                const dayTasks = getTasksForDay(date);
                const visibleTasks = dayTasks.slice(0, 3);
                const moreCount = dayTasks.length - visibleTasks.length;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setCurrentDate(date);
                      setViewMode('day');
                    }}
                    className={`border-r border-b border-[#E0E0E0] p-1.5 flex flex-col justify-start min-h-[110px] transition hover:bg-[#F8F9FA] cursor-pointer ${
                      !isCurrentMonth ? 'bg-[#FAFAFA] text-[#80868B]' : 'bg-white'
                    }`}
                  >
                    {/* Date Number (Blue circle if today - Screenshot 3) */}
                    <div className="flex items-center justify-center mb-1">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          isToday
                            ? 'bg-[#1A73E8] text-white font-medium shadow-xs'
                            : date.getDay() === 0
                            ? 'text-[#D93025]'
                            : date.getDay() === 6
                            ? 'text-[#1A73E8]'
                            : 'text-[#3C4043]'
                        }`}
                      >
                        {date.getDate()}
                        {date.getDate() === 1 && `일`}
                      </span>
                    </div>

                    {/* Google Calendar Dot Event Items (Screenshot 3: ● 05:10 Go to work) */}
                    <div className="space-y-1 flex-1 overflow-hidden">
                      {visibleTasks.map((t) => {
                        const s = new Date(t.plannedStart);
                        const timeStr = `${String(s.getHours()).padStart(2, '0')}:${String(s.getMinutes()).padStart(2, '0')}`;
                        const cardStyle = getGoogleEventCardStyle(t);

                        return (
                          <div
                            key={t.processKey}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask(t);
                              setIsDetailModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[11px] text-[#3C4043] hover:bg-[#E8F0FE] truncate cursor-pointer transition"
                            title={`${t.groupName} (${timeStr})`}
                          >
                            <span className={`w-2 h-2 rounded-full shrink-0 ${cardStyle.dotColor}`} />
                            <span className="font-mono text-[#5F6368] text-[10px] shrink-0">{timeStr}</span>
                            <span className="truncate">{t.groupName}</span>
                          </div>
                        );
                      })}

                      {/* "+N개 더보기" link */}
                      {moreCount > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMonthMoreDate(date);
                          }}
                          className="text-[11px] font-bold text-[#1A73E8] hover:underline px-1.5 py-0.5 block text-left"
                        >
                          {moreCount}개 더보기
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW: YEAR VIEW (Screenshot 4 Exact Replica: 12 Mini Calendars) */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'year' && (
          <div className="p-6 max-w-7xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {yearMonths.map((ym) => (
              <div
                key={ym.monthIndex}
                className="bg-white rounded-xl p-3 border border-transparent hover:border-[#DADCE0] hover:shadow-xs transition"
              >
                {/* Month Name (e.g. "8월") */}
                <h3
                  onClick={() => {
                    const d = new Date(currentDate);
                    d.setMonth(ym.monthIndex);
                    setCurrentDate(d);
                    setViewMode('month');
                  }}
                  className="text-sm font-bold text-[#3C4043] hover:text-[#1A73E8] cursor-pointer mb-2 px-1"
                >
                  {ym.monthName}
                </h3>

                {/* Day Headers (일 월 화 수 목 금 토) */}
                <div className="grid grid-cols-7 text-center text-[10px] text-[#70757A] mb-1 font-medium">
                  {KOREAN_DAYS.map((d, i) => (
                    <div key={i} className={i === 0 ? 'text-[#D93025]' : i === 6 ? 'text-[#1A73E8]' : ''}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Month Days Grid */}
                <div className="grid grid-cols-7 text-center gap-y-1">
                  {ym.days.map(({ date, isCurrentMonth }, dIdx) => {
                    const isToday = isSameDay(date, nowTime);
                    const tasksCount = getTasksForDay(date).length;

                    return (
                      <div
                        key={dIdx}
                        onClick={() => {
                          setCurrentDate(date);
                          setViewMode('day');
                        }}
                        className={`text-[11px] h-6 flex items-center justify-center rounded-full cursor-pointer transition ${
                          !isCurrentMonth
                            ? 'text-transparent'
                            : isToday
                            ? 'bg-[#1A73E8] text-white font-bold'
                            : tasksCount > 0
                            ? 'font-bold text-[#202124] hover:bg-[#F1F3F4]'
                            : 'text-[#5F6368] hover:bg-[#F1F3F4]'
                        }`}
                      >
                        {isCurrentMonth ? date.getDate() : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. Month "+N More" Popover Modal */}
      {/* ========================================================================= */}
      {monthMoreDate && (
        <div
          onClick={() => setMonthMoreDate(null)}
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-2xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#3C4043]">
                  {monthMoreDate.getFullYear()}년 {monthMoreDate.getMonth() + 1}월 {monthMoreDate.getDate()}일 (
                  {KOREAN_DAYS[monthMoreDate.getDay()]})
                </h3>
                <p className="text-xs text-[#5F6368]">
                  총 {getTasksForDay(monthMoreDate).length}건의 생산 공정 일정
                </p>
              </div>
              <button
                onClick={() => setMonthMoreDate(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {getTasksForDay(monthMoreDate).map((t) => {
                const s = new Date(t.plannedStart);
                const e = new Date(t.plannedEnd);
                const format = (d: Date) =>
                  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                const cardStyle = getGoogleEventCardStyle(t);

                return (
                  <div
                    key={t.processKey}
                    onClick={() => {
                      setSelectedTask(t);
                      setIsDetailModalOpen(true);
                      setMonthMoreDate(null);
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer hover:shadow-sm transition ${cardStyle.bg}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#202124]">{t.groupName} #{t.productNo}호기</span>
                      <span className="text-[11px] font-mono text-[#5F6368]">
                        {format(s)}~{format(e)}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5F6368] mt-0.5 truncate">
                      {t.orderName} · {t.machine || '설비미지정'} ({t.worker || '작업자미지정'})
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. Task Detail / State Change Modal */}
      {/* ========================================================================= */}
      {selectedTask && isDetailModalOpen && (
        <CalendarTaskDetailModal
          task={selectedTask}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedTask(null);
          }}
          onUpdateProgress={onUpdateProgress}
          currentUser={currentUser}
          approvedOperators={approvedOperators}
        />
      )}
    </div>
  );
};
