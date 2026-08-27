import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Archive, User as UserIcon, LogIn, LogOut, Clock, UserCheck, Settings } from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  archivedCount: number;
  onOpenLoginModal: () => void;
  onOpenArchiveModal: () => void;
  onOpenUserApprovalModal?: () => void;
  onOpenSettingsModal?: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  archivedCount,
  onOpenLoginModal,
  onOpenArchiveModal,
  onOpenUserApprovalModal,
  onOpenSettingsModal,
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
    <header className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm sticky top-0 z-40 border-b-2 border-[#00C4B4]">
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

          <div className="h-7 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block shrink-0" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
                준성테크 MES 생산 스케줄러
              </h1>
              <span className="text-[10px] bg-[#00C4B4]/10 text-[#00A396] dark:text-[#00C4B4] border border-[#00C4B4]/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00C4B4] animate-pulse" />
                Firebase Realtime Sync
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden xl:block">
              2차전지 코팅 장비 (Slot Die) 및 정밀 가공 생산 관리 시스템
            </p>
          </div>
        </div>

        {/* Right Info & Actions (Strictly Right Aligned) */}
        <div className="flex items-center gap-2.5 text-xs ml-auto shrink-0">
          {/* Live Clock */}
          <div className="hidden sm:flex items-center gap-1.5 text-slate-900 dark:text-slate-100 font-extrabold bg-slate-100/90 dark:bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs sm:text-[12px] tracking-tight shrink-0 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-[#00A396] dark:text-[#00C4B4]" />
            <span className="text-slate-900 dark:text-slate-100 font-bold">{timeStr}</span>
          </div>

          {/* Archive Vault Button */}
          <button
            onClick={onOpenArchiveModal}
            className="bg-[#FFF9EB] hover:bg-[#FEF3D6] dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-[#B45309] dark:text-amber-300 border border-[#FCD34D] dark:border-amber-700/80 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
            title="완료 수주 보관함"
          >
            <Archive className="w-3.5 h-3.5 text-[#B45309] dark:text-amber-400" />
            <span>보관함</span>
            {archivedCount > 0 && (
              <span className="bg-[#B45309] dark:bg-amber-600 text-white px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {archivedCount}
              </span>
            )}
          </button>

          {/* Settings Modal Button */}
          {onOpenSettingsModal && (
            <button
              onClick={onOpenSettingsModal}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 text-xs shadow-xs shrink-0 cursor-pointer"
              title="시스템 환경설정 및 데이터 백업/초기화"
            >
              <Settings className="w-3.5 h-3.5 text-[#00C4B4]" />
              <span>설정</span>
            </button>
          )}

          {/* User Info / Login */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
              <UserIcon className="w-3.5 h-3.5 text-[#00C4B4]" />
              <span className="text-slate-800 dark:text-slate-200 font-bold">{currentUser.name}</span>
              {(() => {
                const isSysAdmin = currentUser.role === 'ADMIN' || currentUser.department === '시스템 관리자' || currentUser.email === 'noworriesmate01@gmail.com';
                const dept = currentUser.department || (isSysAdmin ? '시스템 관리자' : '가공팀');

                if (isSysAdmin) {
                  return (
                    <span className="text-[10px] px-2 py-0.5 rounded font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                      <span>👑</span>
                      <span>시스템 관리자(나)</span>
                    </span>
                  );
                }
                if (dept === '생산 관리') {
                  return (
                    <span className="text-[10px] px-2 py-0.5 rounded font-black bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-0.5">
                      <span>📊</span>
                      <span>생산 관리(나)</span>
                    </span>
                  );
                }
                if (dept === '가공팀' || dept.includes('가공')) {
                  return (
                    <span className="text-[10px] px-2 py-0.5 rounded font-black bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-0.5">
                      <span>⚙️</span>
                      <span>가공팀(나)</span>
                    </span>
                  );
                }
                if (dept === '연마팀' || dept.includes('연마')) {
                  return (
                    <span className="text-[10px] px-2 py-0.5 rounded font-black bg-cyan-100 text-cyan-800 border border-cyan-300 flex items-center gap-0.5">
                      <span>✨</span>
                      <span>연마팀(나)</span>
                    </span>
                  );
                }
                if (dept === '품질팀' || dept.includes('품질')) {
                  return (
                    <span className="text-[10px] px-2 py-0.5 rounded font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-0.5">
                      <span>🔬</span>
                      <span>품질팀(나)</span>
                    </span>
                  );
                }
                return (
                  <span className="text-[10px] px-2 py-0.5 rounded font-black bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-0.5">
                    <span>👷</span>
                    <span>{dept}(나)</span>
                  </span>
                );
              })()}

              {(currentUser.role === 'ADMIN' || currentUser.permissions?.canManageUsers) && onOpenUserApprovalModal && (
                <button
                  onClick={onOpenUserApprovalModal}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded text-[10px] font-extrabold transition flex items-center gap-1 ml-1 shrink-0 cursor-pointer"
                  title="회원가입 승인 및 권한 관리"
                >
                  <UserCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>회원 승인 관리</span>
                </button>
              )}

              <button
                onClick={onLogout}
                className="bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60 px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition ml-1.5 shadow-2xs cursor-pointer active:scale-95"
                title="안전하게 로그아웃하고 세션을 종료합니다"
              >
                <LogOut className="w-3 h-3" />
                <span>로그아웃</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="bg-[#00C4B4] hover:bg-[#00B3A4] px-3.5 py-1.5 rounded-lg text-white font-black transition flex items-center gap-1 shadow-sm shrink-0 cursor-pointer"
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
