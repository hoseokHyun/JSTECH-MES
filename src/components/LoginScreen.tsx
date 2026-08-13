import React, { useState } from 'react';
import { User } from '../types';
import {
  LogIn,
  UserPlus,
  Lock,
  Mail,
  User as UserIcon,
  Shield,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react';
import {
  registerUserAccount,
  loginUserAccount
} from '../lib/firebase';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Remember Email State
  const [rememberEmail, setRememberEmail] = useState<boolean>(() => {
    return localStorage.getItem('remember_email') === 'true';
  });

  // Login Form
  const [email, setEmail] = useState<string>(() => {
    if (localStorage.getItem('remember_email') === 'true') {
      return localStorage.getItem('saved_user_email') || '';
    }
    return '';
  });
  const [password, setPassword] = useState('');

  // Sign Up Form
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpPasswordConfirm, setSignUpPasswordConfirm] = useState('');
  const [signUpRole, setSignUpRole] = useState<'USER' | 'ADMIN'>('USER');

  // State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    // Save or clear remembered email
    if (rememberEmail) {
      localStorage.setItem('saved_user_email', email.trim());
      localStorage.setItem('remember_email', 'true');
    } else {
      localStorage.removeItem('saved_user_email');
      localStorage.setItem('remember_email', 'false');
    }

    setLoading(true);
    try {
      const user = await loginUserAccount(email.trim(), password);
      onLoginSuccess(user);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message === 'PENDING_APPROVAL') {
        setErrorMsg('⏳ 회원가입 승인 대기 중입니다.\n관리자가 승인한 후 로그인하실 수 있습니다.');
      } else {
        setErrorMsg('이메일 또는 비밀번호가 올바르지 않습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPassword) {
      setErrorMsg('모든 필드를 작성해주세요.');
      return;
    }
    if (signUpPassword.length < 6) {
      setErrorMsg('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    if (signUpPassword !== signUpPasswordConfirm) {
      setErrorMsg('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const newUser = await registerUserAccount(
        signUpEmail.trim(),
        signUpPassword,
        signUpName.trim(),
        signUpRole
      );
      if (newUser.isApproved) {
        setSuccessMsg('🎉 첫 번째 가입자로 시스템 관리자로 자동 승인되었습니다! 바로 로그인 가능합니다.');
      } else {
        setSuccessMsg('✅ 회원가입 신청이 완료되었습니다! 관리자 승인 후 로그인하실 수 있습니다.');
      }
      setTab('LOGIN');
      setEmail(signUpEmail.trim());
      setPassword('');
    } catch (err: any) {
      console.error('Sign up error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('이미 가입된 이메일 주소입니다.');
      } else {
        setErrorMsg('회원가입 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (role: 'ADMIN' | 'USER') => {
    const demoUser: User = {
      name: role === 'ADMIN' ? '관리자 (데모)' : '작업자 A1 (데모)',
      role,
      email: role === 'ADMIN' ? 'admin@jstech.co.kr' : 'worker1@jstech.co.kr',
      isApproved: true,
      loginAt: new Date().toISOString(),
    };
    onLoginSuccess(demoUser);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,196,180,0.15),rgba(255,255,255,0))] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 font-sans relative overflow-hidden">
      {/* Background Subtle Grid & Accent Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative z-10 my-auto">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="bg-white p-3 rounded-2xl border border-slate-700 shadow-md flex items-center justify-center max-w-[240px]">
            <img
              src="https://sign.mail.worksmobile.com/signature/logo/kr1/5ZbZaxUwKAgZaxUwBqM-aAM./SqbwKAgmKAuZFxKZKqg9aAJjaAuZaxEdKo2rKA2rFob."
              alt="(주)준성테크 JUN SUNG TECH"
              className="h-10 sm:h-12 w-auto object-contain select-none"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-[#00C4B4]/10 text-[#00C4B4] border border-[#00C4B4]/30 px-3 py-1 rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#00C4B4] animate-pulse" />
              준성테크 스마트 MES 시스템
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              생산 공정 스케줄러 로그인
            </h1>
            <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
              Slot Die 및 정밀 가공 생산 관리
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setTab('LOGIN');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              tab === 'LOGIN'
                ? 'bg-[#00C4B4] text-slate-950 shadow-lg font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>로그인 (Sign In)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('SIGNUP');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              tab === 'SIGNUP'
                ? 'bg-[#00C4B4] text-slate-950 shadow-lg font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>회원가입 (Sign Up)</span>
          </button>
        </div>

        {/* Alert Messages */}
        {errorMsg && (
          <div className="bg-red-950/80 border border-red-500/50 text-red-200 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 whitespace-pre-line">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 whitespace-pre-line">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">{successMsg}</div>
          </div>
        )}

        {/* Form Tab 1: LOGIN */}
        {tab === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#00C4B4]" />
                이메일 주소
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@jstech.co.kr"
                className="w-full bg-slate-950 border border-slate-800 focus:border-[#00C4B4] text-white px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[#00C4B4]" />
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-[#00C4B4] text-white px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none transition"
              />
            </div>

            {/* Remember Email Checkbox */}
            <div className="flex items-center justify-between pt-0.5 pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300 font-semibold hover:text-white transition">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setRememberEmail(checked);
                    if (!checked) {
                      localStorage.removeItem('saved_user_email');
                      localStorage.setItem('remember_email', 'false');
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-[#00C4B4] focus:ring-[#00C4B4] accent-[#00C4B4] cursor-pointer"
                />
                <span>아이디(이메일) 기억하기</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00C4B4] hover:bg-[#00B0A2] text-slate-950 font-black py-3 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin text-slate-950">⏳</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>시스템 로그인</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Form Tab 2: SIGN UP */}
        {tab === 'SIGNUP' && (
          <form onSubmit={handleSignUpSubmit} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-300 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-[#00C4B4]" />
                이름 (성함)
              </label>
              <input
                type="text"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                placeholder="홍길동"
                className="w-full bg-slate-950 border border-slate-800 focus:border-[#00C4B4] text-white px-3.5 py-2 rounded-xl outline-none transition font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#00C4B4]" />
                이메일 계정
              </label>
              <input
                type="email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                placeholder="user@jstech.co.kr"
                className="w-full bg-slate-950 border border-slate-800 focus:border-[#00C4B4] text-white px-3.5 py-2 rounded-xl outline-none transition font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-[#00C4B4]" />
                  비밀번호
                </label>
                <input
                  type="password"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="최소 6자 이상"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-[#00C4B4] text-white px-3.5 py-2 rounded-xl outline-none transition font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-300 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-[#00C4B4]" />
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  value={signUpPasswordConfirm}
                  onChange={(e) => setSignUpPasswordConfirm(e.target.value)}
                  placeholder="비밀번호 재입력"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-[#00C4B4] text-white px-3.5 py-2 rounded-xl outline-none transition font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#00C4B4]" />
                요청 직책 (구분)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSignUpRole('USER')}
                  className={`py-2 rounded-xl border text-center font-bold transition ${
                    signUpRole === 'USER'
                      ? 'bg-[#00C4B4]/20 border-[#00C4B4] text-[#00C4B4]'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  👷 현장 담당자 (USER)
                </button>
                <button
                  type="button"
                  onClick={() => setSignUpRole('ADMIN')}
                  className={`py-2 rounded-xl border text-center font-bold transition ${
                    signUpRole === 'ADMIN'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  🛡️ 시스템 관리자 (ADMIN)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00C4B4] hover:bg-[#00B0A2] text-slate-950 font-black py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="animate-spin text-slate-950">⏳</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>회원가입 신청</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 pt-1 border-t border-slate-800/80 mt-2">
          로그인 후 실시간 MES 생산 스케줄러 데이터 접근 및 편집이 가능합니다.
        </div>
      </div>
    </div>
  );
};
