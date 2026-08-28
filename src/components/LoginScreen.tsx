import React, { useState, useEffect } from 'react';
import { User } from '../types';
import {
  LogIn,
  UserPlus,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Clock,
  ShieldCheck,
  Info,
  Smartphone,
  Zap
} from 'lucide-react';
import {
  registerUserAccount,
  loginUserAccount
} from '../lib/firebase';
import { STORAGE_KEY_REMEMBER_EMAIL, STORAGE_KEY_SAVED_EMAIL } from '../utils/authSession';

interface LoginScreenProps {
  onLoginSuccess: (user: User, rememberMe?: boolean) => void;
  sessionNotice?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, sessionNotice }) => {
  const [tab, setTab] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Detect Deep Link from URL (SMS / Email links)
  const [deepLinkOrderId, setDeepLinkOrderId] = useState<string | null>(null);
  const [deepLinkProcessId, setDeepLinkProcessId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const oId = urlParams.get('orderId');
        const pId = urlParams.get('processId');
        if (oId) {
          setDeepLinkOrderId(oId);
          setDeepLinkProcessId(pId);
        }
      } catch (e) {
        console.error('Error parsing deep link in login screen', e);
      }
    }
  }, []);

  // Remember Email State (Only stores email text in local storage)
  const [rememberEmail, setRememberEmail] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_REMEMBER_EMAIL) === 'true';
    } catch {
      return false;
    }
  });

  // Login State Retention (Remember Me) -> DEFAULT IS STRICTLY FALSE (OFF)
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  // Password Visibility Toggle
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState<boolean>(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState<boolean>(false);

  // Login Form
  const [email, setEmail] = useState<string>(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY_REMEMBER_EMAIL) === 'true') {
        return localStorage.getItem(STORAGE_KEY_SAVED_EMAIL) || '';
      }
    } catch {}
    return '';
  });
  const [password, setPassword] = useState('');

  // Sign Up Form
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpPasswordConfirm, setSignUpPasswordConfirm] = useState('');

  // Helper: Format Phone Number
  const formatPhoneNumber = (value: string) => {
    const raw = value.replace(/[^0-9]/g, '').slice(0, 11);
    if (raw.length <= 3) return raw;
    if (raw.length <= 7) return `${raw.slice(0, 3)}-${raw.slice(3)}`;
    return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`;
  };

  // State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('아이디(이메일)와 비밀번호를 모두 입력해 주세요.');
      return;
    }

    // Save or clear remembered email text
    try {
      if (rememberEmail) {
        localStorage.setItem(STORAGE_KEY_SAVED_EMAIL, email.trim());
        localStorage.setItem(STORAGE_KEY_REMEMBER_EMAIL, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEY_SAVED_EMAIL);
        localStorage.setItem(STORAGE_KEY_REMEMBER_EMAIL, 'false');
      }
    } catch (e) {
      console.warn('Storage save error:', e);
    }

    setLoading(true);
    try {
      const user = await loginUserAccount(email.trim(), password);
      onLoginSuccess(user, rememberMe);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message === 'PENDING_APPROVAL') {
        setErrorMsg('⏳ 회원가입 승인 대기 중입니다.\n관리자가 부서 및 권한을 지정하여 승인한 후 로그인하실 수 있습니다.');
      } else {
        setErrorMsg('아이디(이메일) 또는 비밀번호가 올바르지 않습니다.\n정보를 다시 확인해 주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPassword || !signUpPhone.trim()) {
      setErrorMsg('이름, 연락처, 이메일, 비밀번호 등 모든 필수 항목을 입력해 주세요.');
      return;
    }
    if (signUpPhone.replace(/[^0-9]/g, '').length < 10) {
      setErrorMsg('올바른 휴대전화 번호 10~11자리를 입력해 주세요 (예: 010-1234-5678).');
      return;
    }
    if (signUpPassword.length < 6) {
      setErrorMsg('비밀번호는 최소 6자 이상으로 설정해 주세요.');
      return;
    }
    if (signUpPassword !== signUpPasswordConfirm) {
      setErrorMsg('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      // Sign up with phone number & default skill levels
      const newUser = await registerUserAccount(
        signUpEmail.trim(),
        signUpPassword,
        signUpName.trim(),
        'USER',
        undefined,
        signUpPhone.trim(),
        3,
        3
      );
      if (newUser.isApproved) {
        setSuccessMsg('🎉 시스템 관리자로 자동 승인되었습니다! 바로 로그인 가능합니다.');
      } else {
        setSuccessMsg('✅ 회원가입 신청이 정상적으로 완료되었습니다!\n관리자가 부서 및 권한을 지정하여 승인한 후 로그인하실 수 있습니다.');
      }
      setTab('LOGIN');
      setEmail(signUpEmail.trim());
      setPassword('');
      setSignUpName('');
      setSignUpEmail('');
      setSignUpPhone('');
      setSignUpPassword('');
      setSignUpPasswordConfirm('');
    } catch (err: any) {
      console.error('Sign up error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('이미 가입된 이메일 주소입니다.');
      } else {
        setErrorMsg('회원가입 처리 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 font-sans select-none relative"
      style={{ backgroundColor: '#F7F9FA' }}
    >
      {/* Background Subtle Accent Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#E2E8F0_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Center Card Container (Naver Works Style Light & Clean) */}
      <div
        className="w-full max-w-[460px] bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-7 sm:p-9 space-y-6 relative z-10 my-auto"
        style={{
          boxShadow: '0 10px 35px -5px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04)'
        }}
      >
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Official Brand Logo */}
          <div className="flex items-center justify-center py-1">
            <img
              src="https://sign.mail.worksmobile.com/signature/logo/kr1/5ZbZaxUwKAgZaxUwBqM-aAM./SqbwKAgmKAuZFxKZKqg9aAJjaAuZaxEdKo2rKA2rFob."
              alt="(주)준성테크 JUN SUNG TECH"
              className="h-10 sm:h-12 w-auto object-contain select-none"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              스마트 MES 공정 스케줄러
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              비밀번호를 입력하거나, 시스템 인증을 진행하세요.
            </p>
          </div>
        </div>

        {/* Deep Link Quick Field Worker Access Banner */}
        {deepLinkOrderId && (
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl space-y-2 text-xs text-blue-900 animate-in fade-in shadow-xs">
            <div className="flex items-center gap-2 font-black text-blue-950">
              <span className="p-1 bg-blue-600 text-white rounded-md shrink-0">
                <Smartphone className="w-3.5 h-3.5" />
              </span>
              <span>현장 공정 알림(딥링크) 수신됨</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-snug">
              수주 번호: <strong>{deepLinkOrderId}</strong>
              {deepLinkProcessId ? ` · 공정: ${deepLinkProcessId}` : ''}
            </p>
            <button
              type="button"
              onClick={() => {
                const guestOperator: User = {
                  uid: `operator_${Date.now()}`,
                  email: 'operator@jstech.kr',
                  name: '현장 작업자',
                  role: 'USER',
                  isApproved: true,
                  permissions: {
                    canExecuteMES: true,
                    canEditOrder: false,
                  },
                };
                onLoginSuccess(guestOperator, false);
              }}
              className="w-full py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>현장 작업자 원터치 바로가기 (공정 착수)</span>
            </button>
          </div>
        )}

        {/* Session Notice / Logout reason if present */}
        {sessionNotice && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{sessionNotice}</div>
          </div>
        )}

        {/* Tab Switcher (Naver Works Clean Style) */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setTab('LOGIN');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'LOGIN'
                ? 'bg-white text-slate-900 shadow-xs font-extrabold border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>로그인</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('SIGNUP');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'SIGNUP'
                ? 'bg-white text-slate-900 shadow-xs font-extrabold border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>회원가입 신청</span>
          </button>
        </div>

        {/* Alert Messages */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 whitespace-pre-line leading-relaxed">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 whitespace-pre-line leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">{successMsg}</div>
          </div>
        )}

        {/* Form Tab 1: LOGIN */}
        {tab === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email / ID Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                아이디 또는 이메일
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="아이디 또는 이메일 (예: admin@jstech.co.kr)"
                  className="w-full bg-white border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 text-slate-900 px-3.5 py-2.5 rounded-xl text-xs font-semibold outline-none transition placeholder:text-slate-400"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Input with Visibility Toggle */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  비밀번호
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full bg-white border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 text-slate-900 px-3.5 py-2.5 pr-10 rounded-xl text-xs font-semibold outline-none transition placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Options: Remember ID & Stay Signed In */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-semibold hover:text-slate-900 transition">
                  <input
                    type="checkbox"
                    checked={rememberEmail}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setRememberEmail(checked);
                      if (!checked) {
                        try {
                          localStorage.removeItem(STORAGE_KEY_SAVED_EMAIL);
                          localStorage.setItem(STORAGE_KEY_REMEMBER_EMAIL, 'false');
                        } catch {}
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-[#0066FF] focus:ring-[#0066FF] accent-[#0066FF] cursor-pointer"
                  />
                  <span>아이디 저장</span>
                </label>

                <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>세션 유지: 8시간</span>
                </div>
              </div>

              {/* Remember Login (Auto-login) Option -> Default OFF */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-800 hover:text-slate-900 transition">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#0066FF] focus:ring-[#0066FF] accent-[#0066FF] cursor-pointer"
                  />
                  <span className="text-[#0066FF]">로그인 상태 유지 (자동 로그인)</span>
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-normal">
                    기본: OFF
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 leading-tight pl-6">
                  {rememberMe ? (
                    <span className="text-amber-700 font-medium">
                      ⚡ 선택 시 최대 7일간 로그인 상태가 유지됩니다. (공용 PC 해제 권장)
                    </span>
                  ) : (
                    <span>
                      🔒 브라우저 종료 시 다시 로그인 화면이 표시됩니다.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Primary Login Button (Naver Works Blue) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <span className="animate-spin text-sm">⏳</span>
                  <span>사용자 인증 중...</span>
                </div>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>로그인</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Form Tab 2: SIGN UP */}
        {tab === 'SIGNUP' && (
          <form onSubmit={handleSignUpSubmit} className="space-y-3.5 text-xs">
            {/* User Name */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                성명 (이름) *
              </label>
              <input
                type="text"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                placeholder="예: 홍길동"
                className="w-full bg-white border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 text-slate-900 px-3.5 py-2.5 rounded-xl outline-none transition font-semibold placeholder:text-slate-400"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                이메일 주소 *
              </label>
              <input
                type="email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                placeholder="예: user@jstech.co.kr"
                className="w-full bg-white border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 text-slate-900 px-3.5 py-2.5 rounded-xl outline-none transition font-semibold placeholder:text-slate-400"
                required
              />
            </div>

            {/* Phone Number (멀티채널 자동 알림 및 현장 배포 필수) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  휴대전화 번호 *
                </label>
                <span className="text-[10px] text-blue-600 font-semibold">
                  (SMS / 알림톡 배포 연동)
                </span>
              </div>
              <input
                type="tel"
                value={signUpPhone}
                onChange={(e) => setSignUpPhone(formatPhoneNumber(e.target.value))}
                placeholder="예: 010-1234-5678"
                className="w-full bg-white border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 text-slate-900 px-3.5 py-2.5 rounded-xl outline-none transition font-semibold font-mono placeholder:text-slate-400"
                required
              />
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  비밀번호 *
                </label>
                <div className="relative">
                  <input
                    type={showSignUpPassword ? 'text' : 'password'}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="최소 6자"
                    className="w-full bg-white border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 text-slate-900 px-3 py-2 pr-8 rounded-xl outline-none transition font-semibold placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    tabIndex={-1}
                  >
                    {showSignUpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  비밀번호 확인 *
                </label>
                <div className="relative">
                  <input
                    type={showSignUpConfirmPassword ? 'text' : 'password'}
                    value={signUpPasswordConfirm}
                    onChange={(e) => setSignUpPasswordConfirm(e.target.value)}
                    placeholder="비밀번호 재입력"
                    className="w-full bg-white border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 text-slate-900 px-3 py-2 pr-8 rounded-xl outline-none transition font-semibold placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    tabIndex={-1}
                  >
                    {showSignUpConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Department / Role Notice (No selection on signup -> Admin assigns upon approval) */}
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1 text-slate-700">
              <div className="flex items-center gap-1.5 font-bold text-blue-900 text-xs">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>부서 및 권한 지정 안내</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                회원가입 신청 후 시스템 관리자가 <strong className="text-slate-900">[가공팀 / 연마팀 / 품질팀 / 생산 관리 / 시스템 관리자]</strong> 중 적합한 부서 및 세부 권한을 지정하여 최종 승인합니다.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold py-3 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-2 cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <div className="flex items-center gap-2 text-white font-bold">
                  <span className="animate-spin text-sm">⏳</span>
                  <span>신청서 전송 중...</span>
                </div>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>회원가입 신청 완료</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Security Footer */}
        <div className="text-center text-[11px] text-slate-400 pt-3 border-t border-slate-100 space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>암호화된 안전한 전송 및 접근 통제가 적용되어 있습니다.</span>
          </div>
          <p className="text-[10px] text-slate-400">
            © JUN SUNG TECH Co., Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
