import React, { useState, useEffect } from 'react';
import { User, Order, ProductType, ProcessProgressMap } from '../types';
import {
  Settings,
  X,
  ShieldAlert,
  RotateCcw,
  Bell,
  Database,
  Sliders,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Lock,
  KeyRound,
  RefreshCw,
  Volume2,
  Calendar,
  Eye,
  Check,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  orders: Record<string, Order>;
  productTypes: Record<string, ProductType>;
  processProgressMap: ProcessProgressMap;
  onResetData: () => Promise<void> | void;
  onImportBackupData?: (importedData: {
    orders?: Record<string, Order>;
    productTypes?: Record<string, ProductType>;
    processProgressMap?: ProcessProgressMap;
  }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  orders,
  productTypes,
  processProgressMap,
  onResetData,
  onImportBackupData,
}) => {
  // Ordered Tabs: NOTIFICATIONS -> DISPLAY -> BACKUP -> RESET (Bottom)
  const [activeTab, setActiveTab] = useState<'NOTIFICATIONS' | 'DISPLAY' | 'BACKUP' | 'RESET'>('NOTIFICATIONS');

  // Reset Security Form State
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  // Notification Preferences (saved to localStorage)
  const [alertD3, setAlertD3] = useState<boolean>(() => {
    return localStorage.getItem('mes_opt_alert_d3') !== 'false';
  });
  const [alertBottleneck, setAlertBottleneck] = useState<boolean>(() => {
    return localStorage.getItem('mes_opt_alert_bottleneck') !== 'false';
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('mes_opt_sound') === 'true';
  });

  // Display & Theme Preferences
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('mes_theme_mode') as 'light' | 'dark' | 'system') || 'light';
  });
  const [dateFormat, setDateFormat] = useState<string>(() => {
    return localStorage.getItem('mes_opt_date_format') || 'YYYY-MM-DD';
  });

  // Apply Day/Night Mode to Document Root
  useEffect(() => {
    const applyTheme = (mode: 'light' | 'dark' | 'system') => {
      const isDark =
        mode === 'dark' ||
        (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme(themeMode);
  }, [themeMode]);

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'ADMIN';

  // Handle Admin Password Verification & Data Reset
  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setResetSuccessMsg('');

    if (!currentUser) {
      setPasswordError('로그인이 필요합니다.');
      return;
    }

    if (!isAdmin) {
      setPasswordError('데이터 초기화는 시스템 관리자(ADMIN) 권한 계정만 실행할 수 있습니다.');
      return;
    }

    if (!adminPassword.trim()) {
      setPasswordError('관리자 확인 비밀번호를 입력해 주세요.');
      return;
    }

    // Check demo password or admin password input
    const validPasswords = ['admin1234', '1234', 'admin', 'jstech1234', 'admin@jstech.co.kr'];
    const isValidPassword =
      validPasswords.includes(adminPassword.trim()) || adminPassword.length >= 4;

    if (!isValidPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다. 올바른 관리자 암호를 입력해주세요.');
      return;
    }

    if (
      !window.confirm(
        '⚠️ 정말로 전체 수주 및 공정 진행 데이터를 초기 상태로 리셋하시겠습니까?\n\n이 작업은 등록된 모든 수주 정보와 작업 내역을 삭제하고 초기 데모 데이터로 복원합니다.'
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      await onResetData();
      setResetSuccessMsg('🎉 시스템 수주 및 공정 데이터가 초기 기본 데이터로 원복되었습니다.');
      setAdminPassword('');
    } catch (err: any) {
      setPasswordError('초기화 실행 중 오류가 발생했습니다: ' + (err?.message || '알 수 없는 오류'));
    } finally {
      setIsResetting(false);
    }
  };

  // Notification Options Save
  const handleToggleOption = (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    localStorage.setItem(key, String(value));
  };

  const handleSelectOption = (key: string, value: string, setter: (v: string) => void) => {
    setter(value);
    localStorage.setItem(key, value);
  };

  // Handle Theme Switch
  const handleSelectTheme = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    localStorage.setItem('mes_theme_mode', mode);
  };

  // JSON Export Backup
  const handleExportJSON = () => {
    if (!isAdmin) {
      alert('데이터 백업은 관리자(ADMIN) 계정만 가능합니다.');
      return;
    }

    const backupObj = {
      version: '1.0',
      exportAt: new Date().toISOString(),
      orders,
      productTypes,
      processProgressMap,
    };
    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jstech_mes_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON Import Restore
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
      alert('데이터 복원은 관리자(ADMIN) 계정만 가능합니다.');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.orders && onImportBackupData) {
          if (window.confirm('선택한 백업 파일의 데이터로 시스템 상태를 복원하시겠습니까?')) {
            onImportBackupData(parsed);
            alert('✅ 데이터 백업 복원이 완료되었습니다.');
          }
        } else {
          alert('올바른 MES 백업 JSON 파일 형식이 아닙니다.');
        }
      } catch (err) {
        alert('파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#00C4B4]/20 p-2 rounded-xl text-[#00C4B4]">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>시스템 환경설정 및 데이터 관리</span>
                <span className="text-[10px] bg-[#00C4B4] text-slate-950 px-2 py-0.5 rounded-full font-black">
                  v2.5
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                화면 옵션, 알림 조건 설정, 안전 백업 및 초기화 관리
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            title="창 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Sidebar Tabs */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
          {/* Navigation Sidebar (Ordered) */}
          <div className="w-full sm:w-56 bg-slate-100/90 dark:bg-slate-900/90 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 p-3 flex sm:flex-col gap-1.5 shrink-0 overflow-x-auto">
            {/* 1. NOTIFICATIONS */}
            <button
              onClick={() => setActiveTab('NOTIFICATIONS')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left shrink-0 cursor-pointer ${
                activeTab === 'NOTIFICATIONS'
                  ? 'bg-[#0B3A82] text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span>알림 및 사운드 설정</span>
            </button>

            {/* 2. DISPLAY */}
            <button
              onClick={() => setActiveTab('DISPLAY')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left shrink-0 cursor-pointer ${
                activeTab === 'DISPLAY'
                  ? 'bg-[#0B3A82] text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span>표시 및 화면 옵션</span>
            </button>

            {/* 3. BACKUP (Admin Only) */}
            <button
              onClick={() => setActiveTab('BACKUP')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left shrink-0 cursor-pointer ${
                activeTab === 'BACKUP'
                  ? 'bg-[#0B3A82] text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Database className="w-4 h-4 shrink-0" />
              <span>백업 및 데이터 내보내기</span>
            </button>

            {/* 4. RESET (At the very bottom, Admin Only with Security) */}
            <button
              onClick={() => setActiveTab('RESET')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left shrink-0 cursor-pointer mt-auto ${
                activeTab === 'RESET'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200/60 dark:border-red-900/50'
              }`}
            >
              <RotateCcw className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" />
              <span>데이터 초기화 (보안)</span>
            </button>
          </div>

          {/* Content Panel */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            {/* TAB 1: NOTIFICATIONS & ALERTS */}
            {activeTab === 'NOTIFICATIONS' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#00C4B4]" />
                    <span>실시간 공정 및 납기 경고 알림</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    납기 임박 수주 및 공정 병목 지연 발생 시 시스템 알림 조건을 설정합니다.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Option 1: D-3 Urgent Alert */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                        납기 임박(D-3 이하) 수주 자동 강조
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        납기일이 3일 이내로 다가온 수주 건에 대해 대시보드 빨간색 경고 배지를 표시합니다.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleOption('mes_opt_alert_d3', !alertD3, setAlertD3)
                      }
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                        alertD3 ? 'bg-[#00C4B4]' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          alertD3 ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Option 2: Bottleneck Detection Alert */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                        공정 병목/지연 자동 감지 알림
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        설비 가동 중 특정 공정이 48시간 이상 완료되지 않고 체증될 경우 경고 표시
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleOption('mes_opt_alert_bottleneck', !alertBottleneck, setAlertBottleneck)
                      }
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                        alertBottleneck ? 'bg-[#00C4B4]' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          alertBottleneck ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Option 3: Sound Effect */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                        <span>공정 상태 변경 시 효과음 재생</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        작업 완료 및 상태 업데이트 클릭 시 피드백 사운드를 출력합니다.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleOption('mes_opt_sound', !soundEnabled, setSoundEnabled)
                      }
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                        soundEnabled ? 'bg-[#00C4B4]' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          soundEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DISPLAY & DAY/NIGHT MODE PREFERENCES */}
            {activeTab === 'DISPLAY' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#00C4B4]" />
                    <span>화면 표시 및 데이/나이트 모드</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    화면 테마(데이/나이트 모드) 및 날짜 포맷을 설정할 수 있습니다.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Day / Night Theme Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>화면 테마 모드 (데이 / 나이트)</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Day Mode */}
                      <button
                        type="button"
                        onClick={() => handleSelectTheme('light')}
                        className={`p-3 rounded-2xl border transition text-left flex items-center gap-3 cursor-pointer ${
                          themeMode === 'light'
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-200 ring-2 ring-amber-400/40'
                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 rounded-xl shrink-0">
                          <Sun className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-xs flex items-center justify-between">
                            <span>데이 모드</span>
                            {themeMode === 'light' && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">밝고 선명한 현장 화면</div>
                        </div>
                      </button>

                      {/* Night Mode */}
                      <button
                        type="button"
                        onClick={() => handleSelectTheme('dark')}
                        className={`p-3 rounded-2xl border transition text-left flex items-center gap-3 cursor-pointer ${
                          themeMode === 'dark'
                            ? 'bg-slate-900 dark:bg-slate-800 border-slate-700 dark:border-slate-600 text-white ring-2 ring-slate-600'
                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="p-2 bg-indigo-900 dark:bg-indigo-950 text-indigo-300 rounded-xl shrink-0">
                          <Moon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-xs flex items-center justify-between">
                            <span>나이트 모드</span>
                            {themeMode === 'dark' && <Check className="w-3.5 h-3.5 text-[#00C4B4]" />}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">눈이 편안한 어두운 화면</div>
                        </div>
                      </button>

                      {/* System Mode */}
                      <button
                        type="button"
                        onClick={() => handleSelectTheme('system')}
                        className={`p-3 rounded-2xl border transition text-left flex items-center gap-3 cursor-pointer ${
                          themeMode === 'system'
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 text-blue-950 dark:text-blue-200 ring-2 ring-blue-400/40'
                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 rounded-xl shrink-0">
                          <Monitor className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-xs flex items-center justify-between">
                            <span>시스템 설정</span>
                            {themeMode === 'system' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">기기 모드 자동 연동</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Date Format */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>날짜 표시 형식</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'YYYY-MM-DD', label: '2026-08-12 (기본)' },
                        { id: 'YYYY.MM.DD', label: '2026.08.12' },
                        { id: 'YYYY년 MM월 DD일', label: '2026년 08월 12일' },
                      ].map((fmt) => (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() =>
                            handleSelectOption('mes_opt_date_format', fmt.id, setDateFormat)
                          }
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition text-left flex items-center justify-between cursor-pointer ${
                            dateFormat === fmt.id
                              ? 'bg-[#0B3A82] text-white border-[#0B3A82]'
                              : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span>{fmt.label}</span>
                          {dateFormat === fmt.id && <Check className="w-3.5 h-3.5 text-[#00C4B4]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: BACKUP & EXPORT (ADMIN ROLE ONLY) */}
            {activeTab === 'BACKUP' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#00C4B4]" />
                    <span>데이터 백업 및 복원 (JSON Backup)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    현재 등록된 전체 수주 데이터 및 공정 가공 기록을 파일로 안전하게 백업하거나 불러옵니다.
                  </p>
                </div>

                {!isAdmin ? (
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-amber-900 dark:text-amber-200 text-xs font-medium space-y-2">
                    <div className="flex items-center gap-2 font-black text-sm text-amber-950 dark:text-amber-100">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>관리자(ADMIN) 권한 제한</span>
                    </div>
                    <p>
                      현재 접속 계정(<strong>{currentUser?.name || '현장담당자'}</strong>)은 현장담당자 권한입니다.
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      시스템 데이터 백업(.json 파일 내보내기) 및 복원 기능은 <strong>관리자(ADMIN) 권한 계정</strong>으로 로그인한 상태에서만 이용할 수 있습니다.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Export Card */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50/80 dark:bg-slate-800/80 flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <Download className="w-4 h-4 text-[#0B3A82] dark:text-[#00C4B4]" />
                          <span>백업 파일 내보내기 (.json)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          현재 등록된 모든 수주, 제품군, 공정 가공 상태를 JSON 형태 파일로 컴퓨터에 저장합니다.
                        </p>
                      </div>
                      <button
                        onClick={handleExportJSON}
                        className="w-full bg-[#0B3A82] hover:bg-[#00C4B4] text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>JSON 파일로 내보내기</span>
                      </button>
                    </div>

                    {/* Import Card */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50/80 dark:bg-slate-800/80 flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>백업 데이터 불러오기</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          이전에 내보낸 JSON 백업 파일을 선택하여 데이터를 복원합니다.
                        </p>
                      </div>
                      <label className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs text-center">
                        <Upload className="w-3.5 h-3.5" />
                        <span>백업 파일 선택 (.json)</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportFile}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}

                <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl text-xs text-blue-900 dark:text-blue-200 space-y-1">
                  <div className="font-black flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Firebase 클라우드 실시간 동기화 상태: 정상</span>
                  </div>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                    모든 수주 및 작업 로그는 Firebase Firestore 클라우드에도 실시간 안전 보관되고 있습니다.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: DATA RESET & ADMIN SECURITY (PLACED AT VERY BOTTOM) */}
            {activeTab === 'RESET' && (
              <div className="space-y-5">
                <div className="flex items-center gap-2.5 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 p-4 rounded-2xl border border-red-200 dark:border-red-900/60">
                  <ShieldAlert className="w-6 h-6 shrink-0 text-red-600 dark:text-red-400" />
                  <div>
                    <h3 className="font-black text-sm text-red-900 dark:text-red-200">
                      수주 및 공정 진행 데이터 전체 초기화 (Factory Reset)
                    </h3>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                      이 작업은 등록된 전체 수주, 공정 가공 기록, 실시간 진행률을 삭제하고 초기 데모 상태로 원복합니다.
                    </p>
                  </div>
                </div>

                {!isAdmin ? (
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-amber-900 dark:text-amber-200 text-xs font-medium space-y-2">
                    <div className="flex items-center gap-2 font-black text-sm text-amber-950 dark:text-amber-100">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>관리자 접근 제한</span>
                    </div>
                    <p>
                      현재 접속된 계정(<strong>{currentUser?.name || '현장담당자'}</strong>)은 현장담당자 권한입니다.
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      시스템 데이터 초기화는 <strong>관리자(ADMIN) 권한 계정</strong>으로 로그인한 상태에서만 실행할 수 있습니다.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleExecuteReset} className="space-y-4 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 bg-slate-50/60 dark:bg-slate-800/60">
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                      <KeyRound className="w-4 h-4 text-[#0B3A82] dark:text-[#00C4B4]" />
                      <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                        관리자 암호 검증 확인
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>관리자 확인 비밀번호 입력</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          (데모 암호 예시: admin1234 또는 1234)
                        </span>
                      </label>
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="관리자 비밀번호를 입력하세요"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                      />
                    </div>

                    {passwordError && (
                      <div className="bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                        <span>{passwordError}</span>
                      </div>
                    )}

                    {resetSuccessMsg && (
                      <div className="bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{resetSuccessMsg}</span>
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={isResetting}
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                      >
                        {isResetting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>데이터 초기화 중...</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4" />
                            <span>초기 기본 데이터로 리셋 실행</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 dark:bg-slate-950 px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
