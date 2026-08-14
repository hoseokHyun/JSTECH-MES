import React from 'react';
import { Clock, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';

interface InactivityWarningModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  onExtendSession: () => void;
  onLogout: () => void;
}

export const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({
  isOpen,
  remainingSeconds,
  onExtendSession,
  onLogout,
}) => {
  if (!isOpen) return null;

  const circumference = 2 * Math.PI * 36;
  const progressPercent = Math.max(0, Math.min(100, (remainingSeconds / 60) * 100));
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl shadow-2xl w-full max-w-md p-6 text-white text-center space-y-5 relative overflow-hidden">
        {/* Subtle Accent Glow */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-[#00C4B4]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
          <ShieldAlert className="w-8 h-8 animate-pulse" />
        </div>

        {/* Title and Descriptions */}
        <div className="space-y-2">
          <h2 className="text-lg font-black text-amber-300 flex items-center justify-center gap-2">
            <span>자동 로그아웃 경고</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            <strong className="text-white font-extrabold">30분간 사용자 활동이 감지되지 않았습니다.</strong>
            <br />
            보안 정책에 따라 남은 시간 내에 응답이 없으면 시스템에서 자동으로 로그아웃됩니다.
          </p>
        </div>

        {/* Circular Countdown Display */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 88 88">
              <circle
                cx="44"
                cy="44"
                r="36"
                className="text-slate-800"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="44"
                cy="44"
                r="36"
                className="text-amber-400 transition-all duration-1000 ease-linear"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black font-mono text-white tracking-tight">
                {remainingSeconds}
              </span>
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                초 남음
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={onExtendSession}
            className="flex-1 bg-[#00C4B4] hover:bg-[#00B0A2] text-slate-950 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>로그인 유지 (세션 연장)</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="sm:w-36 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>지금 로그아웃</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1 pt-1 border-t border-slate-800">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>기본 세션 유효시간: 8시간 | 비활동 제한: 30분</span>
        </div>
      </div>
    </div>
  );
};
