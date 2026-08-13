import React, { useState } from 'react';
import {
  LayoutDashboard,
  PlaySquare,
  GitMerge,
  Cpu,
  CheckCircle2,
  Archive,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Users,
  Activity,
  Layers,
  Sparkles,
  FilePlus,
  Calendar
} from 'lucide-react';
import { ScheduledTaskItem, User } from '../types';
import { ALL_EQUIPMENT_LIST } from '../data/defaultData';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  inProgressCount?: number;
  completedCount?: number;
  archivedCount?: number;
  scheduledTasks?: ScheduledTaskItem[];
  operatorCount?: number;
  currentUser?: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  inProgressCount = 0,
  completedCount = 0,
  archivedCount = 0,
  scheduledTasks = [],
  operatorCount = 20,
  currentUser,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const canEditOrder =
    !currentUser ||
    currentUser.role === 'ADMIN' ||
    currentUser.permissions?.canEditOrder === true;
  const canArchive =
    !currentUser ||
    currentUser.role === 'ADMIN' ||
    currentUser.permissions?.canArchive === true;

  // Calculate real-time OEE / Active Line Utilization
  const activeMachinesCount = ALL_EQUIPMENT_LIST.filter((machineName) =>
    scheduledTasks.some((t) => t.machine === machineName && !t.isCompleted)
  ).length;

  const oeePct =
    scheduledTasks.length === 0 || activeMachinesCount === 0
      ? 0
      : Math.round((activeMachinesCount / ALL_EQUIPMENT_LIST.length) * 1000) / 10;

  const navItems = [
    {
      id: 'dashboard',
      label: '생산 종합 대시보드',
      sublabel: '설비 21대/담당자 20명 현황',
      icon: LayoutDashboard,
      badge: inProgressCount > 0 ? `${inProgressCount}건` : null,
      badgeColor: 'bg-blue-600 text-white',
    },
    {
      id: 'order-form',
      label: '신규 수주 등록',
      sublabel: '수주 스펙 입력 & 자동 BOP',
      icon: FilePlus,
      badge: '신규',
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'timeline',
      label: '공정 타임라인',
      sublabel: 'Gantt Chart & 작업 스케줄',
      icon: Calendar,
      badge: 'Gantt',
      badgeColor: 'bg-indigo-600 text-white',
    },
    {
      id: 'execution',
      label: '생산 실행 (Floor MES)',
      sublabel: '공정 완료/취소 터미널',
      icon: PlaySquare,
      badge: '완료/취소',
      badgeColor: 'bg-[#00A396] text-white',
    },
    {
      id: 'routing',
      label: '공정 라우팅 (BOP)',
      sublabel: '제품 타입 & 표준시간',
      icon: GitMerge,
      badge: '표준 공정',
      badgeColor: 'bg-slate-700 text-slate-300',
    },
    {
      id: 'equipment',
      label: '생산 설비 및 공정 담당자',
      sublabel: '총 21대 설비 가동 모니터링',
      icon: Cpu,
      badge: '21대',
      badgeColor: 'bg-blue-600 text-white',
    },
    {
      id: 'quality',
      label: '품질/검사',
      sublabel: 'CMM 3D 정밀 검사 & 불량 분석',
      icon: CheckCircle2,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'archive',
      label: '완료 보관함 (관리자)',
      sublabel: '아카이브 & 이력',
      icon: Archive,
      badge: archivedCount > 0 ? `${archivedCount}` : null,
      badgeColor: 'bg-amber-600 text-white',
    },
  ];

  return (
    <aside
      className={`bg-gradient-to-b from-[#F2F9F9] via-[#E8F5F5] to-[#F0F6F6] dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 dark:bg-slate-900 border-r border-[#D0E8E6] dark:border-slate-800 text-slate-800 dark:text-slate-100 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } shrink-0 hidden md:flex min-h-[calc(100vh-57px)] shadow-xs`}
    >
      {/* Sidebar Header */}
      <div className="p-3 border-b border-[#D0E8E6] dark:border-slate-800 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xs flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00A396]" />
            <span className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-wide">
              JUNSUNG MES Navigator
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition mx-auto border border-slate-200 dark:border-slate-700 cursor-pointer"
          title={collapsed ? '메뉴 펼치기' : '메뉴 접기'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4 text-slate-700 dark:text-slate-300" /> : <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-slate-300" />}
        </button>
      </div>

      {/* Navigation Group */}
      <div className="p-2 space-y-1.5 flex-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-2 py-1.5 text-[10px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider">
            준성테크 생산관리 모듈
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          const handleMenuClick = () => {
            if (item.id === 'order-form' && !canEditOrder) {
              alert('⚠️ 신규 수주 등록 권한이 없습니다.\n(현장담당자 계정은 신규 수주 등록 권한이 제한되어 있습니다. 관리자 또는 영업담당자 계정으로 로그인해주세요.)');
              return;
            }
            if (item.id === 'archive' && !canArchive) {
              alert('⚠️ 완료 보관함 접근 권한이 없습니다.\n(수주 아카이브 조회의 경우 관리자 권한이 필요합니다.)');
              return;
            }
            setActiveTab(item.id);
          };

          return (
            <button
              key={item.id}
              onClick={handleMenuClick}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group cursor-pointer ${
                isActive
                  ? 'bg-[#00C4B4] text-white shadow-md shadow-[#00C4B4]/25 border border-[#00B3A4]'
                  : 'bg-white/70 hover:bg-white text-slate-800 hover:text-slate-900 border border-[#E0F0EF] dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-200 dark:hover:text-white dark:border-slate-700/80 shadow-2xs'
              }`}
              title={collapsed ? `${item.label} (${item.sublabel})` : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-white' : 'text-[#00C4B4] group-hover:text-[#00A396]'
                }`}
              />
              {!collapsed && (
                <div className="flex-1 text-left truncate">
                  <div className={`leading-tight font-extrabold ${isActive ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                    {item.label}
                  </div>
                  <div
                    className={`text-[10px] truncate ${
                      isActive ? 'text-cyan-50 font-medium' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.sublabel}
                  </div>
                </div>
              )}
              {!collapsed && item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System Status Summary */}
      {!collapsed && (
        <div className="p-3 border-t border-[#D0E8E6] dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-xs space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-[#00C4B4]" /> 라인 가동율 (OEE)
            </span>
            <span
              className={`font-extrabold ${
                activeMachinesCount > 0 ? 'text-[#00A396] dark:text-[#00C4B4]' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {oeePct.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-700">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                activeMachinesCount > 0 ? 'bg-[#00C4B4]' : 'bg-slate-300 dark:bg-slate-600'
              }`}
              style={{ width: `${Math.max(oeePct, 2)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 pt-0.5 font-medium">
            <span>설비 21대 / 공정 담당자 {operatorCount}명</span>
            <span
              className={`font-bold ${
                activeMachinesCount > 0 ? 'text-[#00A396] dark:text-[#00C4B4]' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {activeMachinesCount > 0 ? `${activeMachinesCount}대 가동중` : '전체 대기중'}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
