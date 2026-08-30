import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  User as UserIcon,
  LogOut,
  Shield,
  Layers,
  Sparkles,
  Wifi,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Clock,
  Flame,
  Search,
  ScanLine
} from 'lucide-react';
import { User, ScheduledTaskItem, ProcessProgressMap, ProcessProgressItem, Order } from '../types';
import { FloorExecutionView } from './FloorExecutionView';

interface StandaloneFloorMESLayoutProps {
  scheduledTasks: ScheduledTaskItem[];
  orders: Record<string, Order>;
  productTypes: Record<string, any>;
  processProgressMap: ProcessProgressMap;
  currentUser: User | null;
  approvedOperators: string[];
  onUpdateProgress: (processKey: string, progress: ProcessProgressItem) => void;
  onLogout?: () => void;
  onSwitchToAdmin?: () => void;
  onSelectOperator?: (operatorName: string) => void;
}

export const StandaloneFloorMESLayout: React.FC<StandaloneFloorMESLayoutProps> = ({
  scheduledTasks,
  orders,
  productTypes,
  processProgressMap,
  currentUser,
  approvedOperators,
  onUpdateProgress,
  onLogout,
  onSwitchToAdmin,
  onSelectOperator,
}) => {
  const [activeWorker, setActiveWorker] = useState<string>(
    currentUser?.name || (approvedOperators.length > 0 ? approvedOperators[0] : '현장 작업자')
  );

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.department === '시스템 관리자' || currentUser?.department === '생산 관리';

  const handleWorkerSelect = (workerName: string) => {
    setActiveWorker(workerName);
    if (onSelectOperator) {
      onSelectOperator(workerName);
    }
  };

  // Compute live stats for Floor summary
  const inProgressCount = scheduledTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedCount = scheduledTasks.filter((t) => t.status === 'COMPLETED' || t.isCompleted).length;
  const andonCount = scheduledTasks.filter((t) => t.andonStatus === 'ISSUE_HOLD').length;

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col text-slate-900 font-sans">
      {/* ========================================================================= */}
      {/* 1. STANDALONE TOP NAVIGATION BAR (NO ADMIN SIDEBAR)                       */}
      {/* ========================================================================= */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          {/* Logo & Terminal Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md font-black text-xl">
              JS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-lg tracking-tight text-white">
                  JUNSUNG TECH
                </span>
                <span className="text-[11px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Floor MES
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 hidden sm:block">
                현장 작업자 공정 실행 및 실적 등록 터미널
              </p>
            </div>
          </div>

          {/* Center Status Indicators */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-slate-200">실시간 연동</span>
            </div>

            {andonCount > 0 && (
              <div className="flex items-center gap-1.5 bg-red-900/80 border border-red-500 px-3 py-1.5 rounded-xl text-red-200 font-black animate-pulse">
                <Flame className="w-4 h-4 text-red-400" />
                <span>이상 발생 {andonCount}건</span>
              </div>
            )}
          </div>

          {/* Right Controls: Worker Switcher & Admin Switch */}
          <div className="flex items-center gap-2.5">
            {/* Operator Quick Switcher */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-xs">
              <UserIcon className="w-4 h-4 text-blue-400 mr-1.5" />
              <span className="text-slate-400 text-[11px] font-bold mr-1.5 hidden md:inline">작업자:</span>
              <select
                value={activeWorker}
                onChange={(e) => handleWorkerSelect(e.target.value)}
                className="bg-transparent text-white font-black text-xs focus:outline-none cursor-pointer pr-2"
              >
                {currentUser?.name && (
                  <option value={currentUser.name} className="bg-slate-900 text-white">
                    {currentUser.name} (본인)
                  </option>
                )}
                {approvedOperators.map((op) => (
                  <option key={`op-opt-${op}`} value={op} className="bg-slate-900 text-white">
                    {op}
                  </option>
                ))}
              </select>
            </div>

            {/* Admin Switch button if authorized */}
            {isAdmin && onSwitchToAdmin && (
              <button
                type="button"
                onClick={onSwitchToAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                title="관리자 콘솔로 복귀"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">관리자 콘솔</span>
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. BODY CONTENT: STRICTLY SANDBOXED FLOOR MES VIEW                        */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        <FloorExecutionView
          scheduledTasks={scheduledTasks}
          orders={orders}
          productTypes={productTypes}
          processProgressMap={processProgressMap}
          currentUser={currentUser ? { ...currentUser, name: activeWorker } : { name: activeWorker, role: 'USER' }}
          approvedOperators={approvedOperators}
          onUpdateProgress={onUpdateProgress}
        />
      </main>

      {/* Footer Info */}
      <footer className="bg-slate-900/90 text-slate-400 border-t border-slate-800 py-3 text-center text-xs">
        <p className="font-semibold">
          © 준성테크(주) 스마트 MES 공정관리 시스템 • 현장 전용 실행 모드
        </p>
      </footer>
    </div>
  );
};
