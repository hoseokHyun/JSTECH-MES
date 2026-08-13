import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Archive, User as UserIcon, LogIn, LogOut, Clock, UserCheck } from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  archivedCount: number;
  onOpenLoginModal: () => void;
  onOpenArchiveModal: () => void;
  onOpenUserApprovalModal?: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  archivedCount,
  onOpenLoginModal,
  onOpenArchiveModal,
  onOpenUserApprovalModal,
  onLogout,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white text-slate-900 shadow-sm sticky top-0 z-40 border-b-2 border-[#00C4B4]">
      <div className="w-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* JUN SUNG TECH Official Brand Logo from User URL */}
          <div className="flex items-center shrink-0">
            <img
              src="https://sign.mail.worksmobile.com/signature/logo/kr1/5ZbZaxUwKAgZaxUwBqM-aAM./SqbwKAgmKAuZFxKZKqg9aAJjaAuZaxEdKo2rKA2rFob."
              alt="JUN SUNG TECH"
              className="h-10 sm:h-12 w-auto object-contain select-none"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="h-7 w-[1px] bg-slate-200 hidden sm:block shrink-0" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                준성테크 MES 생산 스케줄러
              </h1>
              <span className="text-[10px] bg-[#00C4B4]/10 text-[#00A396] border border-[#00C4B4]/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00C4B4] animate-pulse" />
                Firebase Realtime Sync
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden xl:block">
              2차전지 코팅 장비 (Slot Die) 및 정밀 가공 생산 관리 시스템
            </p>
          </div>
        </div>

        {/* Right Info & Actions (Strictly Right Aligned) */}
        <div className="flex items-center gap-2.5 text-xs ml-auto shrink-0">
          {/* Live Clock */}
          <div className="hidden sm:flex items-center gap-1.5 text-slate-900 font-extrabold bg-slate-100/90 px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-[12px] tracking-tight shrink-0 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-[#00A396]" />
            <span className="text-slate-900 font-bold">{timeStr}</span>
          </div>

          {/* Archive Vault Button */}
          <button
            onClick={onOpenArchiveModal}
            className="bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-slate-700 border border-slate-300 font-bold transition flex items-center gap-1.5 shadow-xs shrink-0"
            title="완료 수주 보관함"
          >
            <Archive className="w-3.5 h-3.5 text-amber-600" />
            <span>보관함</span>
            {archivedCount > 0 && (
              <span className="bg-amber-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {archivedCount}
              </span>
            )}
          </button>

          {/* User Info / Login */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
              <UserIcon className="w-3.5 h-3.5 text-[#00C4B4]" />
              <span className="text-slate-800 font-bold">{currentUser.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                  currentUser.role === 'ADMIN'
                    ? 'bg-[#0B3A82] text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {currentUser.role === 'ADMIN' ? '관리자' : '일반사원'}
              </span>

              {currentUser.role === 'ADMIN' && onOpenUserApprovalModal && (
                <button
                  onClick={onOpenUserApprovalModal}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-extrabold transition flex items-center gap-1 ml-1 shrink-0"
                  title="회원가입 승인 및 권한 관리"
                >
                  <UserCheck className="w-3 h-3 text-amber-600" />
                  <span>회원 승인 관리</span>
                </button>
              )}

              <button
                onClick={onLogout}
                className="text-slate-500 hover:text-slate-900 ml-1 text-[11px] underline flex items-center gap-0.5 font-semibold shrink-0"
                title="로그아웃"
              >
                <LogOut className="w-3 h-3" />
                <span>로그아웃</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="bg-[#00C4B4] hover:bg-[#00B3A4] px-3.5 py-1.5 rounded-lg text-white font-black transition flex items-center gap-1 shadow-sm shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>로그인</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
