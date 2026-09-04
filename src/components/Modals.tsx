import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, ProductType, User, UserPermissions, UserDepartment, ProcessCategory, ProcessStep } from '../types';
import { MCT_MACHINES, GRINDER_MACHINES, CMM_MACHINES } from '../data/defaultData';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { buildOperatorSelectOptions, extractValidApprovedOperators } from '../utils/operatorHelper';
import { extractSerialBase, formatSerialRange } from '../utils/serialHelper';
import {
  Archive,
  X,
  RotateCcw,
  User as UserIcon,
  Shield,
  ShieldCheck,
  Plus,
  Trash2,
  Copy,
  Check,
  Lock,
  Layers,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  Mail,
  Key,
  AlertCircle,
  UserPlus,
  Pencil,
  Wrench,
  Settings,
  CheckSquare,
  Square,
  Sliders,
  Sparkles,
  Building2,
  Microscope,
  FileCheck2,
  BarChart3,
  Phone,
  Smartphone,
  Search,
  Cpu,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  registerUserAccount,
  loginUserAccount,
  subscribeUsersList,
  updateUserApprovalStatus,
  updateUserRoleInFirestore,
  updateUserPermissionsInFirestore,
  updateUserPhoneNumber,
  deleteUserFromFirestore
} from '../lib/firebase';
import {
  MenuId,
  MENU_DEFINITIONS,
  MENU_LABELS,
  ALL_MENU_IDS,
  DEPARTMENT_OPTIONS,
  DEPARTMENT_PRESETS,
  computeEffectivePermissions,
  EffectivePermissions,
} from '../utils/permissionManager';

/* ==================================================================== */
/* 1. Archive Vault Modal                                                */
/* ==================================================================== */
interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Record<string, Order>;
  productTypes: Record<string, ProductType>;
  onRestoreOrder: (orderId: string) => void;
  onCopyOrderToNew?: (order: Order) => void;
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  onClose,
  orders,
  productTypes,
  onRestoreOrder,
  onCopyOrderToNew,
}) => {
  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const allOrdersList: Order[] = Object.values(orders || {}) as Order[];

  const getYear = (o: Order) => {
    if (o.completedAt) {
      const m = o.completedAt.match(/\b(20\d{2})\b/);
      if (m) return parseInt(m[1], 10);
    }
    if (o.dueDate) {
      const m = o.dueDate.match(/\b(20\d{2})\b/);
      if (m) return parseInt(m[1], 10);
    }
    return 2026;
  };

  const years = Array.from(
    new Set([2026, 2025, ...allOrdersList.map(getYear)])
  ).sort((a, b) => b - a);

  const archivedList: Order[] = allOrdersList
    .filter((o) => Boolean(o.archived))
    .filter((o) => {
      if (selectedYear === 'ALL') return true;
      return getYear(o) === selectedYear;
    })
    .filter((o) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const type = productTypes[o.typeId];
      return (
        o.name.toLowerCase().includes(term) ||
        (o.customer && o.customer.toLowerCase().includes(term)) ||
        (type && type.name.toLowerCase().includes(term))
      );
    });

  const totalCompletedInYear = allOrdersList.filter(
    (o) =>
      (o.status === 'COMPLETED' || o.archived) &&
      (selectedYear === 'ALL' || getYear(o) === selectedYear)
  ).length;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#FFF9EB] text-[#B45309] border border-[#FCD34D] shadow-2xs">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">
                  완료 수주 보관함 (Archive Vault)
                </h3>
                <span className="text-[11px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-300">
                  {selectedYear === 'ALL' ? '전체' : `${selectedYear}년`} {archivedList.length}건
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                공정 완료 후 대시보드에서 보관함으로 이동된 수주 데이터 및 연도별 실적 관리
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar (Year Pills & Search) */}
        <div className="p-3 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setSelectedYear('ALL')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                selectedYear === 'ALL' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              전체
            </button>
            {years.map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  selectedYear === yr ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                {yr}년
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="수주명 / 고객사 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">수주번호 / 프로젝트명</th>
                  <th className="p-3">고객사</th>
                  <th className="p-3">제품 타입</th>
                  <th className="p-3 text-center">수량</th>
                  <th className="p-3 text-center">완료일시</th>
                  <th className="p-3 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {archivedList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                      보관된 수주 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  archivedList.map((ord) => {
                    const type = productTypes[ord.typeId];
                    return (
                      <tr key={ord.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{ord.name}</td>
                        <td className="p-3 text-slate-700 font-medium">{ord.customer || '-'}</td>
                        <td className="p-3 text-slate-600 font-medium">
                          {type ? type.name : '-'}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">
                          {ord.qty}개
                        </td>
                        <td className="p-3 text-center text-slate-500 font-mono">
                          {ord.completedAt || ord.dueDate || '-'}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {onCopyOrderToNew && (
                              <button
                                onClick={() => {
                                  onCopyOrderToNew(ord);
                                  onClose();
                                }}
                                className="bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 text-xs cursor-pointer active:scale-95 shrink-0"
                                title="이 수주의 공정, 설비, 담당자 사양을 신규 수주 등록으로 복사합니다."
                              >
                                <Copy className="w-3 h-3 text-amber-600" />
                                <span>공정 복사</span>
                              </button>
                            )}
                            <button
                              onClick={() => onRestoreOrder(ord.id)}
                              className="bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 text-xs cursor-pointer active:scale-95 shrink-0"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>복원</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 flex justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

/* ==================================================================== */
/* 2. Login & Sign-Up Modal                                            */
/* ==================================================================== */
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [tab, setTab] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Login Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up Form
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpPasswordConfirm, setSignUpPasswordConfirm] = useState('');

  // State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('아이디(이메일)와 비밀번호를 모두 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const user = await loginUserAccount(email.trim(), password);
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message === 'PENDING_APPROVAL') {
        setErrorMsg('⏳ 회원가입 승인 대기 중입니다.\n관리자가 부서 및 권한을 지정하여 승인한 후 로그인하실 수 있습니다.');
      } else {
        setErrorMsg('아이디(이메일) 또는 비밀번호가 올바르지 않습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
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
        'USER'
      );
      if (newUser.isApproved) {
        alert('🎉 시스템 관리자로 자동 승인되었습니다!\n로그인해 주세요.');
      } else {
        alert('✅ 회원가입 신청이 성공적으로 완료되었습니다!\n관리자가 부서 및 권한을 지정하여 승인한 후 로그인하실 수 있습니다.');
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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#0066FF] border border-blue-200">
              <UserIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">준성테크 스마트 MES 로그인</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => { setTab('LOGIN'); setErrorMsg(''); }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              tab === 'LOGIN' ? 'bg-white text-[#0066FF] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔑 로그인 (Sign In)
          </button>
          <button
            onClick={() => { setTab('SIGNUP'); setErrorMsg(''); }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              tab === 'SIGNUP' ? 'bg-white text-[#0066FF] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📝 회원가입 신청 (Sign Up)
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-lg text-xs font-semibold flex items-start gap-2 whitespace-pre-line">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        {tab === 'LOGIN' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" /> 아이디 또는 이메일
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="예: admin@jstech.co.kr"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-[#0066FF] focus:outline-none"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-slate-500" /> 비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-[#0066FF] focus:outline-none"
                required
              />
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium">
                계정이 없으신가요? <button type="button" onClick={() => setTab('SIGNUP')} className="text-[#0066FF] font-bold underline cursor-pointer">회원가입 신청</button>
              </span>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-extrabold shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? '인증 중...' : '로그인'}
              </button>
            </div>
          </form>
        ) : (
          /* Sign Up Form */
          <form onSubmit={handleSignUpSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">성명 / 작업자명 *</label>
              <input
                type="text"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                placeholder="예: 홍길동"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-[#0066FF] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">이메일 주소 *</label>
              <input
                type="email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                placeholder="예: hong@jstech.co.kr"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-[#0066FF] focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">비밀번호 *</label>
                <input
                  type="password"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="최소 6자"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-[#0066FF] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">비밀번호 확인 *</label>
                <input
                  type="password"
                  value={signUpPasswordConfirm}
                  onChange={(e) => setSignUpPasswordConfirm(e.target.value)}
                  placeholder="비밀번호 재입력"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-[#0066FF] focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-slate-700 font-medium">
              💡 회원가입 신청 후 관리자가 <strong>[가공팀/연마팀/품질팀/생산 관리/시스템 관리자]</strong> 중 적합한 부서 및 세부 권한을 지정하여 최종 승인합니다.
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTab('LOGIN')}
                className="text-slate-600 font-bold hover:underline cursor-pointer"
              >
                로그인으로 돌아가기
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-extrabold shadow-sm transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{loading ? '신청 처리 중...' : '회원가입 신청'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/* ==================================================================== */
/* 2-B. Admin User Approval & Permissions Management Modal              */
/* ==================================================================== */

interface UserApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
}

export const UserApprovalModal: React.FC<UserApprovalModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | UserDepartment>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPhoneUid, setEditingPhoneUid] = useState<string | null>(null);
  const [tempPhone, setTempPhone] = useState<string>('');
  const [expandedUserMenusUid, setExpandedUserMenusUid] = useState<string | null>(null);

  // Format phone helper
  const formatPhone = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '').slice(0, 11);
    if (raw.length <= 3) return raw;
    if (raw.length <= 7) return `${raw.slice(0, 3)}-${raw.slice(3)}`;
    return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`;
  };

  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeUsersList((list) => {
      setUsers(list);
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const pendingUsers = users.filter((u) => !u.isApproved);
  const approvedUsers = users.filter((u) => u.isApproved);

  // Filter users list based on tab and search
  const filteredUsers = users.filter((u) => {
    let matchesTab = true;
    if (filterTab === 'PENDING') {
      matchesTab = !u.isApproved;
    } else if (filterTab === 'APPROVED') {
      matchesTab = Boolean(u.isApproved);
    } else if (filterTab !== 'ALL') {
      matchesTab = u.department === filterTab;
    }

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      u.name.toLowerCase().includes(query) ||
      (u.email && u.email.toLowerCase().includes(query)) ||
      (u.department && u.department.toLowerCase().includes(query)) ||
      ((u.phoneNumber || (u as any).phone_number || '').includes(query));

    return matchesTab && matchesSearch;
  });

  const getUserPermissions = (u: User): UserPermissions => {
    const isAdmin = u.role === 'ADMIN' || u.department === '시스템 관리자';
    const dept = (u.department as UserDepartment) || '가공팀';
    const preset = DEPARTMENT_PRESETS[dept] || DEPARTMENT_PRESETS['가공팀'];
    const effective = computeEffectivePermissions(u);

    return {
      canEditOrder: u.permissions?.canEditOrder ?? (isAdmin ? true : (preset.permissions.canEditOrder || false)),
      canExecuteMES: u.permissions?.canExecuteMES ?? (isAdmin ? true : (preset.permissions.canExecuteMES !== false)),
      canManageUsers: u.permissions?.canManageUsers ?? (isAdmin ? true : (preset.permissions.canManageUsers || false)),
      canEditMaster: u.permissions?.canEditMaster ?? (isAdmin ? true : (preset.permissions.canEditMaster || false)),
      canArchive: u.permissions?.canArchive ?? (isAdmin ? true : (preset.permissions.canArchive || false)),
      canQualityInspection: u.permissions?.canQualityInspection ?? (isAdmin ? true : (preset.permissions.canQualityInspection || false)),
      canShipmentControl: u.permissions?.canShipmentControl ?? (isAdmin ? true : (preset.permissions.canShipmentControl || false)),
      allowedMenus: u.permissions?.allowedMenus ? [...u.permissions.allowedMenus] : [...effective.allowedMenus],
      menuEdits: u.permissions?.menuEdits ? { ...u.permissions.menuEdits } : { ...effective.canEditMenu },
    };
  };

  const updateLocalUser = (uidOrEmail: string, patch: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if ((u.uid && u.uid === uidOrEmail) || u.email === uidOrEmail) {
          return { ...u, ...patch };
        }
        return u;
      })
    );
  };

  const handleStartEditPhone = (u: User) => {
    const targetId = u.uid || u.email || '';
    setEditingPhoneUid(targetId);
    setTempPhone(u.phoneNumber || (u as any).phone_number || '');
  };

  const handleSavePhone = async (u: User) => {
    const targetId = u.uid || u.email || '';
    if (!targetId) return;
    const formatted = tempPhone.trim();
    updateLocalUser(targetId, {
      phoneNumber: formatted,
      phone_number: formatted,
    });
    if (u.uid) {
      await updateUserPhoneNumber(u.uid, formatted);
    }
    setEditingPhoneUid(null);
  };

  const handleToggleApproval = async (user: User) => {
    const targetId = user.uid || user.email;
    if (!targetId) return;
    const nextApproved = !user.isApproved;
    
    // If approving for first time without department, default to '가공팀'
    const dept = user.department || '가공팀';
    const perms = getUserPermissions(user);

    updateLocalUser(targetId, { isApproved: nextApproved, department: dept });
    if (user.uid) {
      await updateUserApprovalStatus(user.uid, nextApproved, dept, perms);
    }
  };

  const handleDepartmentChange = async (user: User, newDept: UserDepartment) => {
    const targetId = user.uid || user.email;
    if (!targetId) return;

    const preset = DEPARTMENT_PRESETS[newDept];
    if (!preset) return;

    // Automatically approve user when department is assigned by admin
    updateLocalUser(targetId, {
      department: newDept,
      role: preset.role,
      permissions: preset.permissions,
      isApproved: true,
      status: 'approved',
    });

    if (user.uid) {
      await updateUserPermissionsInFirestore(
        user.uid,
        preset.permissions,
        preset.role,
        newDept,
        true // Force isApproved: true
      );
    }
  };

  const handleApplyPreset = async (user: User, deptPreset: UserDepartment) => {
    await handleDepartmentChange(user, deptPreset);
  };

  const handleApproveAllPending = async () => {
    const pendingList = users.filter((u) => !u.isApproved);
    if (pendingList.length === 0) {
      alert('현재 승인 대기 중인 회원이 없습니다.');
      return;
    }
    if (!confirm(`대기 중인 ${pendingList.length}명의 회원을 모두 승인하시겠습니까?`)) {
      return;
    }
    for (const pu of pendingList) {
      const targetId = pu.uid || pu.email;
      if (!targetId) continue;
      const dept = pu.department && pu.department !== '미지정' ? pu.department : '가공팀';
      const perms = getUserPermissions(pu);
      updateLocalUser(targetId, { isApproved: true, department: dept, status: 'approved' });
      if (pu.uid) {
        await updateUserApprovalStatus(pu.uid, true, dept, perms);
      }
    }
    alert(`${pendingList.length}명의 회원이 모두 승인되었습니다.`);
  };

  const handlePermissionToggle = async (user: User, permKey: keyof UserPermissions) => {
    const targetId = user.uid || user.email;
    if (!targetId) return;
    const currentPerms = getUserPermissions(user);
    const updatedPerms: UserPermissions = {
      ...currentPerms,
      [permKey]: !currentPerms[permKey],
    };
    updateLocalUser(targetId, { permissions: updatedPerms });
    if (user.uid) {
      await updateUserPermissionsInFirestore(
        user.uid,
        updatedPerms,
        user.role,
        user.department
      );
    }
  };

  const handleToggleMenuExposure = async (user: User, menuId: MenuId) => {
    const targetId = user.uid || user.email;
    if (!targetId) return;
    const currentPerms = getUserPermissions(user);
    const allowed = currentPerms.allowedMenus ? [...currentPerms.allowedMenus] : [...ALL_MENU_IDS];
    let nextAllowed: string[];
    if (allowed.includes(menuId)) {
      if (allowed.length <= 1) {
        alert('최소 1개 이상의 메뉴는 노출되어야 합니다.');
        return;
      }
      nextAllowed = allowed.filter((m) => m !== menuId);
    } else {
      nextAllowed = [...allowed, menuId];
    }
    const updatedPerms: UserPermissions = {
      ...currentPerms,
      allowedMenus: nextAllowed,
    };
    updateLocalUser(targetId, { permissions: updatedPerms });
    if (user.uid) {
      await updateUserPermissionsInFirestore(user.uid, updatedPerms, user.role, user.department);
    }
  };

  const handleToggleMenuEdit = async (user: User, menuId: MenuId) => {
    const targetId = user.uid || user.email;
    if (!targetId) return;
    const currentPerms = getUserPermissions(user);
    const edits = { ...(currentPerms.menuEdits || {}) };

    const effective = computeEffectivePermissions(user);
    const isCurrentlyEditable = effective.canEditMenu[menuId] ?? false;
    const nextVal = !isCurrentlyEditable;
    edits[menuId] = nextVal;

    // If making it editable, ensure menu is also exposed
    let nextAllowed = currentPerms.allowedMenus ? [...currentPerms.allowedMenus] : [...effective.allowedMenus];
    if (nextVal && !nextAllowed.includes(menuId)) {
      nextAllowed.push(menuId);
    }

    const updatedPerms: UserPermissions = {
      ...currentPerms,
      allowedMenus: nextAllowed,
      menuEdits: edits,
    };
    updateLocalUser(targetId, { permissions: updatedPerms });
    if (user.uid) {
      await updateUserPermissionsInFirestore(user.uid, updatedPerms, user.role, user.department);
    }
  };

  const handleBatchMenuAction = async (user: User, action: 'ALL_EXPOSE' | 'ALL_EDIT' | 'RESET_DEPT') => {
    const targetId = user.uid || user.email;
    if (!targetId) return;
    const currentPerms = getUserPermissions(user);
    const deptPreset = DEPARTMENT_PRESETS[user.department || '가공팀'] || DEPARTMENT_PRESETS['가공팀'];

    let updatedPerms: UserPermissions;
    if (action === 'ALL_EXPOSE') {
      updatedPerms = {
        ...currentPerms,
        allowedMenus: [...ALL_MENU_IDS],
      };
    } else if (action === 'ALL_EDIT') {
      const allEdits: Record<string, boolean> = {};
      ALL_MENU_IDS.forEach((m) => {
        allEdits[m] = true;
      });
      updatedPerms = {
        ...currentPerms,
        allowedMenus: [...ALL_MENU_IDS],
        menuEdits: allEdits,
        canEditOrder: true,
        canExecuteMES: true,
        canEditMaster: true,
        canArchive: true,
        canQualityInspection: true,
        canShipmentControl: true,
      };
    } else {
      // RESET_DEPT
      updatedPerms = {
        ...deptPreset.permissions,
        allowedMenus: [...deptPreset.defaultMenus],
        menuEdits: { ...deptPreset.defaultEdits },
      };
    }

    updateLocalUser(targetId, { permissions: updatedPerms });
    if (user.uid) {
      await updateUserPermissionsInFirestore(user.uid, updatedPerms, user.role, user.department);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!user.uid) return;
    if (confirm(`[${user.name} (${user.email || '미지정'})] 사용자 계정을 삭제하시겠습니까?`)) {
      await deleteUserFromFirestore(user.uid);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl p-5 space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#0066FF] border border-blue-200 shadow-xs">
              <ShieldCheck className="w-6 h-6 text-[#0066FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  회원가입 승인 & 부서별 권한 관리 시스템
                </h3>
                <span className="text-[10px] bg-blue-100 text-[#0066FF] border border-blue-200 px-2.5 py-0.5 rounded-full font-extrabold">
                  관리자 전용 RBAC
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                신규 가입 사용자의 부서(가공팀, 연마팀, 품질팀, 생산 관리, 시스템 관리자)를 지정하고 One-Click 프리셋 및 세부 권한을 즉시 동기화합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-Department Quick Info Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 shrink-0">
          {DEPARTMENT_OPTIONS.map((dept) => {
            const p = DEPARTMENT_PRESETS[dept];
            return (
              <div
                key={dept}
                className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 space-y-1 hover:border-blue-300 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                    <span>{p.icon}</span> {dept}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black border ${p.badgeClass}`}>
                    {p.role === 'ADMIN' ? '관리자' : '담당자'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Filter Controls & Stats Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          {/* Tab Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              전체 ({users.length})
            </button>
            <button
              onClick={() => setFilterTab('PENDING')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                filterTab === 'PENDING'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-800 hover:bg-amber-100/60'
              }`}
            >
              ⏳ 승인 대기 ({pendingUsers.length})
            </button>
            <button
              onClick={() => setFilterTab('APPROVED')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                filterTab === 'APPROVED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800 hover:bg-emerald-100/60'
              }`}
            >
              ✅ 승인 완료 ({approvedUsers.length})
            </button>
            {DEPARTMENT_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setFilterTab(d)}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer text-[11px] ${
                  filterTab === d
                    ? 'bg-[#0066FF] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Quick Actions & Search Input */}
          <div className="flex items-center gap-2">
            {pendingUsers.length > 0 && (
              <button
                type="button"
                onClick={handleApproveAllPending}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                title="승인 대기 중인 모든 회원을 일괄 승인합니다"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>대기자 전체 승인 ({pendingUsers.length}명)</span>
              </button>
            )}
            <div className="relative min-w-[180px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="성명, 이메일, 부서 검색..."
                className="w-full text-xs pl-8 pr-7 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* User List & Permission Matrix Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs min-w-[950px]">
            <thead className="bg-slate-100/90 text-slate-700 font-black sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="p-3 w-44">성명 / 이메일</th>
                <th className="p-3 w-36 text-center">직책 (부서/역할)</th>
                <th className="p-3 text-center min-w-[420px]">
                  <span>세부 기능 권한 & 원클릭 프리셋</span>
                </th>
                <th className="p-3 w-28 text-center">승인 상태</th>
                <th className="p-3 w-32 text-center">관리 액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 bg-white">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-400 font-semibold">
                    조건에 해당하는 사용자 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const perms = getUserPermissions(u);
                  const effective = computeEffectivePermissions(u);
                  const targetUid = u.uid || u.email || '';
                  const isExpanded = expandedUserMenusUid === targetUid;
                  const isSuperAdmin = u.email === 'noworriesmate01@gmail.com' || u.department === '시스템 관리자' || u.name === '시스템 관리자';
                  const isCurrent = currentUser?.email && u.email && currentUser.email === u.email;
                  const currentDept = (u.department as UserDepartment) || (isSuperAdmin ? '시스템 관리자' : '가공팀');
                  const displayName = u.name === '대표 관리자' || u.name.includes('대표') ? '시스템 관리자' : u.name;

                  return (
                    <tr
                      key={u.uid || u.email}
                      className={`hover:bg-slate-50 transition ${
                        !u.isApproved ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-sm">{displayName}</span>
                          {isCurrent ? (
                            <span className="text-[10px] bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.5 rounded font-black flex items-center gap-0.5">
                              {isSuperAdmin ? '👑 시스템 관리자(나)' : '(나)'}
                            </span>
                          ) : isSuperAdmin ? (
                            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-black flex items-center gap-0.5">
                              👑 시스템 관리자
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-slate-500 font-sans mt-0.5 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{u.email || '(이메일 미등록)'}</span>
                        </div>
                        {/* Phone Number Display & Inline Edit */}
                        {editingPhoneUid === (u.uid || u.email) ? (
                          <div className="mt-1.5 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-blue-600 shrink-0" />
                            <input
                              type="tel"
                              value={tempPhone}
                              onChange={(e) => setTempPhone(formatPhone(e.target.value))}
                              placeholder="010-1234-5678"
                              className="w-28 text-xs px-2 py-0.5 border border-blue-400 rounded font-mono font-bold bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSavePhone(u)}
                              className="px-2 py-0.5 bg-blue-600 text-white rounded text-[11px] font-bold hover:bg-blue-700 cursor-pointer"
                              title="저장"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPhoneUid(null)}
                              className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[11px] font-bold hover:bg-slate-300 cursor-pointer"
                              title="취소"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs font-sans mt-1 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            {(() => {
                              const phone = (u.phoneNumber || (u as any).phone_number || (u as any).phone || '').trim();
                              const hasValidPhone = phone && phone !== '010-0000-0000';
                              return (
                                <div className="flex items-center gap-1.5">
                                  {hasValidPhone ? (
                                    <span className="text-blue-700 font-bold font-mono text-xs">{phone}</span>
                                  ) : (
                                    <span className="inline-flex items-center text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md leading-normal tracking-normal">
                                      연락처 미등록
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditPhone(u)}
                                    title="연락처 변경/등록"
                                    className="text-[11px] text-slate-500 hover:text-blue-600 hover:underline cursor-pointer flex items-center gap-0.5 font-medium ml-0.5"
                                  >
                                    <Pencil className="w-2.5 h-2.5" />
                                    <span>{hasValidPhone ? '수정' : '등록'}</span>
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 mt-0.5 font-sans">
                          가입: {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ko-KR') : '-'}
                        </div>
                      </td>

                      {/* Department / Role Dropdown Selection */}
                      <td className="p-3 text-center">
                        <select
                          value={currentDept}
                          onChange={(e) => handleDepartmentChange(u, e.target.value as UserDepartment)}
                          className="w-full text-xs px-2.5 py-1.5 rounded-xl font-black border border-slate-300 bg-white hover:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF] cursor-pointer shadow-2xs"
                        >
                          {DEPARTMENT_OPTIONS.map((dept) => (
                            <option key={dept} value={dept}>
                              {DEPARTMENT_PRESETS[dept].icon} {dept}
                            </option>
                          ))}
                        </select>
                        <div className="mt-1">
                          {(() => {
                            const dPreset = DEPARTMENT_PRESETS[currentDept] || {
                              icon: '👷',
                              label: u.department || '현장담당자',
                              badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
                            };
                            return (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${dPreset.badgeClass} inline-flex items-center gap-1`}>
                                <span>{dPreset.icon} {dPreset.label}{isCurrent ? '(나)' : ''}</span>
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Granular Permissions Checkboxes & Presets */}
                      <td className="p-3">
                        <div className="space-y-2">
                          {/* 7 Checkboxes Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                            {/* 1. canEditOrder */}
                            <label
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition cursor-pointer select-none ${
                                perms.canEditOrder
                                  ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                              title="수주 등록 및 공정 스펙/스케줄러 편집 권한"
                            >
                              <input
                                type="checkbox"
                                checked={perms.canEditOrder}
                                onChange={() => handlePermissionToggle(u, 'canEditOrder')}
                                className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                              />
                              <span>수주/공정 편집</span>
                            </label>

                            {/* 2. canExecuteMES */}
                            <label
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition cursor-pointer select-none ${
                                perms.canExecuteMES
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                              title="생산 실행 터미널에서 공정 완료/취소 처리 권한"
                            >
                              <input
                                type="checkbox"
                                checked={perms.canExecuteMES}
                                onChange={() => handlePermissionToggle(u, 'canExecuteMES')}
                                className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                              />
                              <span>MES 공정완료</span>
                            </label>

                            {/* 3. canQualityInspection */}
                            <label
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition cursor-pointer select-none ${
                                perms.canQualityInspection
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                              title="수입/공정/출하검사 및 성적서 발행 권한"
                            >
                              <input
                                type="checkbox"
                                checked={perms.canQualityInspection}
                                onChange={() => handlePermissionToggle(u, 'canQualityInspection')}
                                className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                              />
                              <span>품질 검사</span>
                            </label>

                            {/* 4. canShipmentControl */}
                            <label
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition cursor-pointer select-none ${
                                perms.canShipmentControl
                                  ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                              title="출하 검사 및 출하 승인 권한"
                            >
                              <input
                                type="checkbox"
                                checked={perms.canShipmentControl}
                                onChange={() => handlePermissionToggle(u, 'canShipmentControl')}
                                className="w-3.5 h-3.5 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                              />
                              <span>출하 관리</span>
                            </label>

                            {/* 5. canEditMaster */}
                            <label
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition cursor-pointer select-none ${
                                perms.canEditMaster
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                              title="표준 공정 구성, 설비 및 마스터 데이터 관리"
                            >
                              <input
                                type="checkbox"
                                checked={perms.canEditMaster}
                                onChange={() => handlePermissionToggle(u, 'canEditMaster')}
                                className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                              />
                              <span>마스터 관리</span>
                            </label>

                            {/* 6. canManageUsers */}
                            <label
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition cursor-pointer select-none ${
                                perms.canManageUsers
                                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                              title="회원가입 승인 및 사용자 권한 관리 권한"
                            >
                              <input
                                type="checkbox"
                                checked={perms.canManageUsers}
                                onChange={() => handlePermissionToggle(u, 'canManageUsers')}
                                className="w-3.5 h-3.5 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                              />
                              <span>회원/권한 승인</span>
                            </label>

                            {/* 7. canArchive */}
                            <label
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition cursor-pointer select-none col-span-2 ${
                                perms.canArchive
                                  ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                              title="완료 보관함 이동 및 수주 데이터 삭제 권한"
                            >
                              <input
                                type="checkbox"
                                checked={perms.canArchive}
                                onChange={() => handlePermissionToggle(u, 'canArchive')}
                                className="w-3.5 h-3.5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                              />
                              <span>보관함/수주삭제</span>
                            </label>
                          </div>

                          {/* Quick 5-Department Preset Buttons */}
                          <div className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-slate-100">
                            <span className="text-[10px] font-black text-slate-500">원클릭 프리셋:</span>
                            {DEPARTMENT_OPTIONS.map((dept) => {
                              const p = DEPARTMENT_PRESETS[dept];
                              const isCurrentDept = currentDept === dept;
                              return (
                                <button
                                  key={dept}
                                  type="button"
                                  onClick={() => handleApplyPreset(u, dept)}
                                  className={`text-[10px] font-black px-2 py-0.5 rounded-md border transition cursor-pointer flex items-center gap-1 shadow-2xs ${
                                    isCurrentDept
                                      ? 'bg-blue-600 text-white border-blue-700 ring-1 ring-blue-400'
                                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                  title={`${dept} 기본 권한 자동 설정`}
                                >
                                  <span>{p.icon}</span>
                                  <span>{dept}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Granular Menu Exposure & Edit UI (11 Menus) */}
                          <div className="pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setExpandedUserMenusUid(isExpanded ? null : targetUid)}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-blue-50/80 hover:bg-blue-100/90 border border-blue-200 text-blue-900 text-[11px] font-bold transition cursor-pointer"
                            >
                              <div className="flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                                <span>메뉴별 세부 권한 (노출 & 편집)</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-black">
                                <span className="bg-blue-200/80 text-blue-900 px-1.5 py-0.5 rounded-full">
                                  {effective.allowedMenus.length}/11 메뉴 노출
                                </span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-blue-700" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-700" />}
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                {/* Batch Actions Bar */}
                                <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] pb-1 border-b border-slate-200">
                                  <span className="font-black text-slate-700 flex items-center gap-1">
                                    <span>⚙️</span> 11개 메뉴별 개별 권한 지정:
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleBatchMenuAction(u, 'ALL_EXPOSE')}
                                      className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold transition cursor-pointer shadow-2xs"
                                    >
                                      전체 노출
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleBatchMenuAction(u, 'ALL_EDIT')}
                                      className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer shadow-2xs"
                                    >
                                      전체 편집 허용
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleBatchMenuAction(u, 'RESET_DEPT')}
                                      className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition cursor-pointer shadow-2xs"
                                    >
                                      부서 기본값 복원
                                    </button>
                                  </div>
                                </div>

                                {/* 11 Menus Matrix */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-0.5">
                                  {MENU_DEFINITIONS.map((menuDef) => {
                                    const isExposed = effective.allowedMenus.includes(menuDef.id);
                                    const isEditable = effective.canEditMenu[menuDef.id] ?? false;

                                    return (
                                      <div
                                        key={menuDef.id}
                                        className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-between gap-2 transition ${
                                          isExposed
                                            ? 'bg-white border-slate-200 shadow-2xs'
                                            : 'bg-slate-100/70 border-slate-200/60 opacity-60'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="text-xs shrink-0">{menuDef.icon}</span>
                                          <div className="truncate">
                                            <span className="font-bold text-slate-800 truncate block">
                                              {menuDef.label}
                                            </span>
                                            <span className="text-[9px] text-slate-500 truncate block">
                                              {menuDef.category}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                          {/* 노출(조회) 체크박스 */}
                                          <label
                                            className="flex items-center gap-1 cursor-pointer select-none"
                                            title="메뉴 사이드바 노출 및 조회 허용"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isExposed}
                                              onChange={() => handleToggleMenuExposure(u, menuDef.id)}
                                              className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                            />
                                            <span className={`text-[10px] font-bold ${isExposed ? 'text-blue-700' : 'text-slate-400'}`}>
                                              노출
                                            </span>
                                          </label>

                                          {/* 편집(쓰기) 체크박스 */}
                                          <label
                                            className={`flex items-center gap-1 select-none ${
                                              isExposed ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                                            }`}
                                            title={isExposed ? "메뉴 내 데이터 등록/수정/삭제/실행 허용" : "메뉴 노출을 먼저 체크해야 편집 권한을 부여할 수 있습니다"}
                                          >
                                            <input
                                              type="checkbox"
                                              disabled={!isExposed}
                                              checked={isExposed && isEditable}
                                              onChange={() => handleToggleMenuEdit(u, menuDef.id)}
                                              className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                                            />
                                            <span className={`text-[10px] font-bold ${isExposed && isEditable ? 'text-emerald-700' : 'text-slate-400'}`}>
                                              편집
                                            </span>
                                          </label>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Approval Status */}
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                            u.isApproved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                          }`}
                        >
                          {u.isApproved ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>승인 완료</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>승인 대기</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleToggleApproval(u)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 border shadow-xs cursor-pointer ${
                              u.isApproved
                                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                            }`}
                          >
                            {u.isApproved ? (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                <span>승인 취소</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>승인 완료</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="계정 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex justify-between items-center shrink-0">
          <div className="text-[11px] text-slate-500 font-medium">
            ※ 관리자가 변경한 부서 및 세부 권한은 실시간으로 Firestore DB에 즉시 반영됩니다.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-sm"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};

/* ==================================================================== */
/* 3. New Product Type Modal                                            */
/* ==================================================================== */
interface NewTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveType: (typeName: string, processes: { name: string; category: ProcessCategory; durationHours: number }[]) => void;
}

export const NewTypeModal: React.FC<NewTypeModalProps> = ({ isOpen, onClose, onSaveType }) => {
  const [typeName, setTypeName] = useState('');
  const [rows, setRows] = useState<
    { id: string; name: string; category: ProcessCategory; durationHours: number }[]
  >([
    { id: '1', name: '가공 공정 1', category: '가공', durationHours: 8.0 },
  ]);

  if (!isOpen) return null;

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        id: String(Date.now()),
        name: `신규 공정 ${rows.length + 1}`,
        category: '가공',
        durationHours: 2.0,
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  const handleRowChange = (id: string, field: string, val: any) => {
    setRows(
      rows.map((r) => {
        if (r.id === id) {
          return { ...r, [field]: val };
        }
        return r;
      })
    );
  };

  const handleSave = () => {
    if (!typeName.trim()) {
      alert('제품 타입명을 입력해주세요.');
      return;
    }
    if (rows.length === 0) {
      alert('최소 1개 이상의 공정 단계를 추가해야 합니다.');
      return;
    }
    const processes = rows.map((r) => ({
      name: r.name.trim() || '공정',
      category: r.category,
      durationHours: Math.max(0.01, parseFloat(String(r.durationHours)) || 0.1),
    }));

    onSaveType(typeName.trim(), processes);
    setTypeName('');
    setRows([{ id: '1', name: '가공 공정 1', category: '가공', durationHours: 8.0 }]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">신규 제품 타입 생성 (공정 구성 템플릿)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">새 제품 타입명</label>
            <input
              type="text"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              placeholder="예: 광폭 3P 맞춤 공정"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-bold focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block font-bold text-slate-700">공정 단계 및 필요 작업시간 설정</label>
              <button
                onClick={handleAddRow}
                className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg border border-blue-200 font-bold hover:bg-blue-100 transition flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> 공정 단계 추가
              </button>
            </div>

            <div className="space-y-2 border border-slate-200 p-2.5 rounded-xl bg-slate-50 max-h-60 overflow-y-auto">
              {rows.map((row, idx) => (
                <div
                  key={row.id}
                  className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs"
                >
                  <span className="text-xs font-bold text-slate-400 w-5 text-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => handleRowChange(row.id, 'name', e.target.value)}
                    placeholder="공정명 입력"
                    className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-md font-semibold"
                  />
                  <select
                    value={row.category}
                    onChange={(e) => handleRowChange(row.id, 'category', e.target.value)}
                    className="text-xs px-2 py-1.5 border border-slate-300 rounded-md font-bold"
                  >
                    <option value="가공">가공</option>
                    <option value="연마">연마</option>
                    <option value="외주">외주</option>
                    <option value="품질">품질</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={row.durationHours}
                    onChange={(e) =>
                      handleRowChange(row.id, 'durationHours', parseFloat(e.target.value) || 0.1)
                    }
                    className="w-16 text-xs px-2 py-1.5 border border-slate-300 rounded-md text-right font-mono font-bold"
                  />
                  <span className="text-slate-500 font-bold">h</span>
                  <button
                    onClick={() => handleRemoveRow(row.id)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-bold"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg shadow-sm"
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
};

/* ==================================================================== */
/* 4. Copy Product Type Modal                                           */
/* ==================================================================== */
interface CopyTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTypes: Record<string, ProductType>;
  onCopyType: (sourceTypeId: string, newTypeName: string, selectedIndexes: number[]) => void;
}

export const CopyTypeModal: React.FC<CopyTypeModalProps> = ({
  isOpen,
  onClose,
  productTypes,
  onCopyType,
}) => {
  const [sourceTypeId, setSourceTypeId] = useState<string>('');
  const [newTypeName, setNewTypeName] = useState<string>('');
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);

  React.useEffect(() => {
    if (isOpen && Object.keys(productTypes).length > 0) {
      const firstKey = Object.keys(productTypes)[0];
      setSourceTypeId(firstKey);
      const base = productTypes[firstKey];
      if (base) {
        setNewTypeName(`${base.name} - 사본`);
        setSelectedIndexes(base.processes.map((_, i) => i));
      }
    }
  }, [isOpen, productTypes]);

  if (!isOpen) return null;

  const handleSourceChange = (typeId: string) => {
    setSourceTypeId(typeId);
    const base = productTypes[typeId];
    if (base) {
      setNewTypeName(`${base.name} - 사본`);
      setSelectedIndexes(base.processes.map((_, i) => i));
    }
  };

  const handleToggleIndex = (idx: number) => {
    if (selectedIndexes.includes(idx)) {
      setSelectedIndexes(selectedIndexes.filter((i) => i !== idx));
    } else {
      setSelectedIndexes([...selectedIndexes, idx].sort((a, b) => a - b));
    }
  };

  const handleToggleAll = (check: boolean) => {
    const base = productTypes[sourceTypeId];
    if (base) {
      if (check) setSelectedIndexes(base.processes.map((_, i) => i));
      else setSelectedIndexes([]);
    }
  };

  const handleSubmit = () => {
    if (!newTypeName.trim()) {
      alert('새 사본 타입명을 입력해주세요.');
      return;
    }
    if (selectedIndexes.length === 0) {
      alert('최소 1개 이상의 공정을 선택해야 합니다.');
      return;
    }
    onCopyType(sourceTypeId, newTypeName.trim(), selectedIndexes);
    onClose();
  };

  const currentBase = productTypes[sourceTypeId];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Copy className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">
              제품 타입 및 공정 복사 (Routing Duplication)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Source Selection */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">복사할 원본 제품 타입 선택</label>
            <select
              value={sourceTypeId}
              onChange={(e) => handleSourceChange(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-bold bg-slate-50 focus:ring-2 focus:ring-emerald-500"
            >
              {(Object.values(productTypes) as ProductType[]).map((t) => {
                const cleanedName = t.name.replace(/\s*\(\d+단계\)/g, '');
                return (
                  <option key={t.id} value={t.id}>
                    {t.isReference ? `🔒 ${cleanedName}` : cleanedName}
                  </option>
                );
              })}
            </select>
          </div>

          {/* New Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">새 사본 타입명</label>
            <input
              type="text"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-bold focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Process Checkboxes */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block font-bold text-slate-700">
                복사에 포함할 공정 선택 ({selectedIndexes.length}개 선택됨)
              </label>
              <div className="space-x-2 text-[11px]">
                <button
                  onClick={() => handleToggleAll(true)}
                  className="text-blue-600 font-bold hover:underline"
                >
                  전체 선택
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => handleToggleAll(false)}
                  className="text-slate-500 font-bold hover:underline"
                >
                  전체 해제
                </button>
              </div>
            </div>

            <div className="space-y-1.5 border border-slate-200 p-2.5 rounded-xl bg-slate-50 max-h-56 overflow-y-auto">
              {currentBase?.processes.map((p, idx) => {
                const isChecked = selectedIndexes.includes(idx);
                return (
                  <label
                    key={idx}
                    className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg text-xs cursor-pointer hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleIndex(idx)}
                        className="text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="font-bold text-slate-900">
                        {idx + 1}. {p.name}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                          p.category === '가공'
                            ? 'bg-blue-100 text-blue-800'
                            : p.category === '연마'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.category === '외주'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {p.category}
                      </span>
                    </div>
                    <span className="text-slate-500 font-bold font-mono">{p.durationHours}h</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-bold"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg shadow-sm flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>선택 공정 복사 실행</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ==================================================================== */
/* 6. Edit Order Modal                                                  */
/* ==================================================================== */
interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  productTypes: Record<string, ProductType>;
  onUpdateOrder: (updatedOrder: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onCompleteAllOrderProcesses?: (
    orderId: string,
    forceComplete: boolean,
    overrideProcesses?: ProcessStep[],
    overrideQty?: number
  ) => void;
  onArchiveOrder?: (orderId: string) => void;
  onOpenArchiveModal?: () => void;
  usersList?: User[];
  approvedOperators?: string[];
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  productTypes,
  onUpdateOrder,
  onDeleteOrder,
  onCompleteAllOrderProcesses,
  onArchiveOrder,
  onOpenArchiveModal,
  usersList,
  approvedOperators,
}) => {
  const [name, setName] = useState(order?.name || '');
  const [selectedTypeId, setSelectedTypeId] = useState(order?.typeId || '');
  const [qty, setQty] = useState(order?.qty || 1);
  const [startDate, setStartDate] = useState(order?.startDate || '');
  const [strategy, setStrategy] = useState<'SERIAL' | 'CONTINUOUS'>(order?.strategy || 'CONTINUOUS');
  const [status, setStatus] = useState<OrderStatus>(order?.status || 'IN_PROGRESS');
  const [memo, setMemo] = useState(order?.memo || '');
  const [customer, setCustomer] = useState(order?.customer || '');
  const [poNumber, setPoNumber] = useState(order?.poNumber || '');
  const [partName, setPartName] = useState(order?.partName || '');
  const [partType, setPartType] = useState(order?.partType || '');
  const [spec, setSpec] = useState(order?.spec || '');
  const [serialNo, setSerialNo] = useState(order?.serialNo || '');
  const [dueDate, setDueDate] = useState(order?.dueDate || '');
  const [specialNotes, setSpecialNotes] = useState(order?.specialNotes || '');
  const [customProcesses, setCustomProcesses] = useState<ProcessStep[]>([]);
  const [users, setUsers] = useState<User[]>(usersList || []);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeUsersList((list) => {
      setUsers(list);
    });
    return () => unsub();
  }, [isOpen]);

  // Compute unified operator list strictly from verified registered users and approvedOperators
  const effectiveOperators = React.useMemo(() => {
    return extractValidApprovedOperators(users, approvedOperators);
  }, [approvedOperators, users]);

  // Options for Operator Searchable Select in Edit Modal
  const operatorOptions: SelectOption[] = React.useMemo(() => {
    const currentAssignedWorkers = customProcesses
      .map((p) => p.assignedWorker || p.worker)
      .filter(Boolean) as string[];

    return buildOperatorSelectOptions(
      effectiveOperators,
      currentAssignedWorkers,
      {
        placeholderLabel: '담당자 미지정 (현장 배정)',
        allowOutsourcing: true,
      }
    );
  }, [effectiveOperators, customProcesses]);

  // Options for Equipment Searchable Select in Edit Modal
  const equipmentOptions: SelectOption[] = React.useMemo(() => {
    const list: SelectOption[] = [
      { value: '', label: '자동 지정 (기본)' },
      {
        value: '(외주/협력사)',
        label: '(외주/협력사)',
        badge: '외주',
        badgeColor: 'bg-amber-100 text-amber-800 border border-amber-300',
      },
    ];

    MCT_MACHINES.forEach((m) => {
      list.push({
        value: m,
        label: m,
        badge: 'MCT가공',
        badgeColor: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      });
    });
    GRINDER_MACHINES.forEach((m) => {
      list.push({
        value: m,
        label: m,
        badge: '연마',
        badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      });
    });
    CMM_MACHINES.forEach((m) => {
      list.push({
        value: m,
        label: m,
        badge: '품질CMM',
        badgeColor: 'bg-purple-100 text-purple-800 border border-purple-200',
      });
    });

    return list;
  }, []);

  useEffect(() => {
    if (order) {
      setName(order.name || '');
      setSelectedTypeId(
        order.typeId || (order.customProcesses && order.customProcesses.length > 0 ? 'CUSTOM' : '')
      );
      setQty(order.qty || 1);
      setStartDate(order.startDate || '');
      setStrategy(order.strategy || 'CONTINUOUS');
      setStatus(order.status || 'PENDING');
      setMemo(order.memo || '');
      setCustomer(order.customer || '');
      setPoNumber(order.poNumber || '');
      setPartName(order.partName || '');
      setPartType(order.partType || '');
      setSpec(order.spec || '');
      setSerialNo(order.serialNo || '');
      setDueDate(order.dueDate || '');
      setSpecialNotes(order.specialNotes || '');

      if (order.customProcesses && order.customProcesses.length > 0) {
        setCustomProcesses(
          order.customProcesses.map((p) => {
            const workerVal = (p.assignedWorker || p.worker || '').trim();
            return {
              ...p,
              assignedWorker: workerVal,
              worker: workerVal,
              assignedMachine: p.assignedMachine || '',
            };
          })
        );
      } else {
        const type = productTypes[order.typeId];
        setCustomProcesses(
          type
            ? type.processes.map((p) => {
                const workerVal = (p.assignedWorker || p.worker || '').trim();
                return {
                  ...p,
                  assignedWorker: workerVal,
                  worker: workerVal,
                  assignedMachine: p.assignedMachine || '',
                };
              })
            : []
        );
      }
    }
  }, [order, productTypes, isOpen]);

  if (!isOpen || !order) return null;

  const handleTypeChange = (newTypeId: string) => {
    setSelectedTypeId(newTypeId);
    if (newTypeId === 'CUSTOM') {
      return;
    }
    const newType = productTypes[newTypeId];
    if (newType && newType.processes) {
      setCustomProcesses(
        newType.processes.map((p) => {
          const workerVal = (p.assignedWorker || p.worker || '').trim();
          return {
            ...p,
            assignedWorker: workerVal,
            worker: workerVal,
            assignedMachine: p.assignedMachine || '',
          };
        })
      );
    }
  };

  const handleAddProcess = () => {
    setCustomProcesses((prev) => [
      ...prev,
      {
        name: `신규 공정 ${prev.length + 1}`,
        category: '가공',
        durationHours: 2,
        assignedMachine: '',
        assignedWorker: '',
        worker: '',
      },
    ]);
  };

  const handleRemoveProcess = (index: number) => {
    if (customProcesses.length <= 1) {
      alert('최소 1개 이상의 공정이 필요합니다.');
      return;
    }
    setCustomProcesses((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleProcessChange = (index: number, field: keyof ProcessStep, value: any) => {
    setCustomProcesses((prev) => {
      const updated = [...prev];
      const step = { ...updated[index], [field]: value };

      // If category changed to 외주, default machine and worker to (외주/협력사)
      if (field === 'category' && value === '외주') {
        step.assignedMachine = '(외주/협력사)';
        step.assignedWorker = '(외주/협력사)';
        step.worker = '(외주/협력사)';
      }

      if (field === 'assignedWorker') {
        step.worker = value;
      } else if (field === 'worker') {
        step.assignedWorker = value;
      }

      updated[index] = step;
      return updated;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const isCompleted = status === 'COMPLETED';

    const sanitizedProcesses: ProcessStep[] = customProcesses.map((p) => {
      const workerVal = p.assignedWorker || p.worker || '';
      return {
        ...p,
        worker: workerVal,
        assignedWorker: workerVal,
      };
    });

    const updated: Order = {
      ...order,
      name,
      typeId: selectedTypeId,
      qty: Number(qty),
      startDate,
      strategy,
      memo,
      customer,
      poNumber,
      partName,
      partType,
      spec,
      serialNo,
      dueDate,
      specialNotes,
      customProcesses: sanitizedProcesses,
      status,
    };

    onUpdateOrder(updated);

    if (onCompleteAllOrderProcesses) {
      onCompleteAllOrderProcesses(order.id, isCompleted, sanitizedProcesses, Number(qty));
    }

    onClose();
  };

  const handleForceComplete = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setStatus('COMPLETED');
    const updated: Order = {
      ...order,
      name,
      typeId: selectedTypeId,
      qty: Number(qty),
      startDate,
      strategy,
      memo,
      customProcesses,
      status: 'COMPLETED',
    };
    onUpdateOrder(updated);
    if (onCompleteAllOrderProcesses) {
      onCompleteAllOrderProcesses(order.id, true, customProcesses, Number(qty));
    }
    onClose();
  };

  const handleMoveToArchive = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setStatus('COMPLETED');
    const updated: Order = {
      ...order,
      name,
      typeId: selectedTypeId,
      qty: Number(qty),
      startDate,
      strategy,
      memo,
      customProcesses,
      status: 'COMPLETED',
      archived: true,
    };
    onUpdateOrder(updated);
    if (onArchiveOrder) {
      onArchiveOrder(order.id);
    } else if (onCompleteAllOrderProcesses) {
      onCompleteAllOrderProcesses(order.id, true, customProcesses, Number(qty));
    }
    onClose();
    if (onOpenArchiveModal) {
      onOpenArchiveModal();
    }
  };

  const handleDelete = () => {
    if (window.confirm(`'${order.name || order.id}' 수주를 정말 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      onDeleteOrder(order.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">수주 및 공정 구성 수정 (Edit Order & Processes)</h3>
              <p className="text-[11px] text-slate-500">
                수주 기본정보, 사내/외주 공정 변경, 지정 설비 및 공정별 담당자(소속팀 연계) 배정
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Order Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                수주번호 / 프로젝트명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                적용 공정 구성 (제품 타입 변경)
              </label>
              <select
                value={selectedTypeId}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-blue-50/50 font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {selectedTypeId === 'CUSTOM' && (
                  <option value="CUSTOM">✨ 커스텀 공정 (사용자 직접 유연 설계)</option>
                )}
                {Object.values(productTypes).map((pt: ProductType) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.name} ({pt.processes ? pt.processes.length : 0}단계 공정)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                수량 (EA) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                생산 시작 일시
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                투입 방식
              </label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="CONTINUOUS">연속 투입 (스펙 다중할당)</option>
                <option value="SERIAL">직렬 투입 (완료후 투입)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                수주 진행 상태
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className={`w-full px-3 py-2 border rounded-lg font-extrabold focus:ring-2 focus:outline-none ${
                  status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 focus:ring-emerald-500'
                    : 'bg-white text-slate-900 border-slate-300 focus:ring-blue-500'
                }`}
              >
                <option value="IN_PROGRESS">🔄 진행중 (In Progress)</option>
                <option value="COMPLETED">✅ 전 공정 완료 (Completed)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">작업 비고 / 특이사항</label>
            <textarea
              rows={2}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="수주 관련 메모를 입력하세요."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Section: Process Traveler Official Metadata */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <span className="font-extrabold text-slate-900 text-xs">
                공정 이동표 (Process Traveler) 공식 메타데이터
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                A4 양식 연동
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block font-bold text-slate-600 text-[11px] mb-1">고객사</label>
                <input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="예: PNT"
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-bold text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 text-[11px] mb-1">PO. (PJT)</label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="예: PNT-26-01"
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 text-[11px] mb-1">품 명</label>
                <input
                  type="text"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  placeholder="예: SLOT DIE"
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-bold text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 text-[11px] mb-1">품 목</label>
                <input
                  type="text"
                  value={partType}
                  onChange={(e) => setPartType(e.target.value)}
                  placeholder="예: UPPER (상판)"
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-bold text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 text-[11px] mb-1">규 격</label>
                <input
                  type="text"
                  value={spec}
                  onChange={(e) => setSpec(e.target.value)}
                  placeholder="예: 650L"
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 text-[11px] mb-1">각인번호</label>
                <input
                  type="text"
                  value={serialNo}
                  onChange={(e) => setSerialNo(e.target.value)}
                  onBlur={() => {
                    if (serialNo.trim()) {
                      const base = extractSerialBase(serialNo, poNumber);
                      setSerialNo(formatSerialRange(base || poNumber || name, qty, poNumber));
                    }
                  }}
                  placeholder={`예: ${formatSerialRange(poNumber || 'NN-NNNNN-2608-01', qty, poNumber)}`}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 text-[11px] mb-1">납 기</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 text-[11px] mb-1">특이사항</label>
                <input
                  type="text"
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="※ 공정 간 인수인계 철저히"
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-bold text-slate-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section: Process Routing, Machine & Assignee Assignment Editor */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-indigo-600" />
                <span className="font-extrabold text-slate-900 text-xs">
                  수주 공정 흐름, 설비 및 담당자 지정 (Process Routing, Machine & Assignee)
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddProcess}
                className="px-2.5 py-1 text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>공정 단계 추가</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              사내 제작 ↔ 외주 가공 변경, 또는 MCT/연마기/CMM 특정 설비 및 공정별 담당자(소속팀 연계) 지정이 가능합니다.
            </p>

            {/* Desktop Column Header + Rows in a unified horizontal/vertical scroll container */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-100/50 p-2">
              <div className="min-w-[760px] space-y-1.5">
                {/* Column Header */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-200/80 rounded-lg text-[10px] font-extrabold text-slate-700">
                  <span className="w-6 text-center shrink-0">#</span>
                  <span className="flex-1 min-w-[120px]">공정명 (Process)</span>
                  <span className="w-24 shrink-0">공정 구분</span>
                  <span className="w-20 shrink-0 text-center">소요시간</span>
                  <span className="w-40 lg:w-44 shrink-0">지정 설비 (Machine)</span>
                  <span className="w-44 lg:w-48 shrink-0">공정 담당자 (Assignee)</span>
                  <span className="w-12 text-center shrink-0 text-red-600 font-black">삭제</span>
                </div>

                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                  {customProcesses.map((proc, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-2 bg-white border border-slate-200 rounded-lg flex items-center gap-2 shadow-2xs hover:border-slate-300 transition"
                    >
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center shrink-0 text-[10px]">
                        {pIdx + 1}
                      </span>

                      {/* Process Name */}
                      <div className="flex-1 min-w-[120px]">
                        <input
                          type="text"
                          value={proc.name}
                          onChange={(e) => handleProcessChange(pIdx, 'name', e.target.value)}
                          placeholder="공정명 입력"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-1 focus:ring-blue-500 text-xs"
                        />
                      </div>

                      {/* Process Category */}
                      <div className="w-24 shrink-0">
                        <select
                          value={proc.category}
                          onChange={(e) => handleProcessChange(pIdx, 'category', e.target.value as ProcessCategory)}
                          className={`w-full px-2 py-1.5 border rounded-lg font-black text-[11px] ${
                            proc.category === '외주'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : proc.category === '가공'
                              ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                              : proc.category === '연마'
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : 'bg-purple-50 text-purple-900 border-purple-300'
                          }`}
                        >
                          <option value="가공">가공 (In-H)</option>
                          <option value="연마">연마 (In-H)</option>
                          <option value="외주">외주 (Out)</option>
                          <option value="품질">품질 (In-H)</option>
                        </select>
                      </div>

                      {/* Duration */}
                      <div className="w-20 shrink-0">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0.01}
                            step="any"
                            value={proc.durationHours}
                            onChange={(e) => handleProcessChange(pIdx, 'durationHours', parseFloat(e.target.value) || 0)}
                            className="w-12 px-1 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-center text-slate-900 text-xs"
                          />
                          <span className="text-[10px] font-bold text-slate-500">시간</span>
                        </div>
                      </div>

                      {/* Machine Assignment (Searchable Select) */}
                      <div className="w-40 lg:w-44 shrink-0">
                        <SearchableSelect
                          options={equipmentOptions}
                          value={proc.assignedMachine || ''}
                          onChange={(val) => handleProcessChange(pIdx, 'assignedMachine', val)}
                          placeholder="자동 지정 (기본)"
                          icon={Cpu}
                          dropdownClassName="min-w-[200px]"
                        />
                      </div>

                      {/* Assignee / Worker Selection (Searchable Select) */}
                      <div className="w-44 lg:w-48 shrink-0">
                        <SearchableSelect
                          options={operatorOptions}
                          value={proc.assignedWorker || proc.worker || ''}
                          onChange={(val) => {
                            handleProcessChange(pIdx, 'assignedWorker', val);
                            handleProcessChange(pIdx, 'worker', val);
                          }}
                          placeholder="담당자 미지정"
                          icon={UserCheck}
                          dropdownClassName="min-w-[230px]"
                        />
                      </div>

                      {/* Remove Process Button */}
                      <div className="w-12 flex justify-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveProcess(pIdx)}
                          className="w-7 h-7 flex items-center justify-center text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-lg transition cursor-pointer shrink-0 shadow-2xs active:scale-95"
                          title="이 공정 단계 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
              <span>빠른 상태 변경 및 보관함 이동</span>
              <span className="text-slate-400">Quick Actions</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleForceComplete}
                className="flex-1 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>전 공정 완료 처리</span>
              </button>
              <button
                type="button"
                onClick={handleMoveToArchive}
                className="flex-1 py-1.5 bg-[#FFF9EB] text-[#B45309] border border-[#FCD34D] hover:bg-[#FEF3D6] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
              >
                <Archive className="w-3.5 h-3.5 text-[#B45309]" />
                <span>완료 보관함 이동</span>
              </button>
            </div>
          </div>

          {/* Modal Action Buttons Footer */}
          <div className="border-t border-slate-200 pt-4 mt-2 flex justify-between items-center shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3.5 py-2 text-xs bg-red-50 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200 hover:border-red-300 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title="이 수주 건을 영구히 삭제합니다."
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              <span>수주 삭제</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl font-bold transition cursor-pointer shadow-2xs active:scale-95"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-sm shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>수정사항 저장</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
