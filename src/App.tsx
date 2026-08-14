import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Order,
  OrderStatus,
  ProductType,
  ProcessStep,
  User,
  ProcessProgressMap,
  ScheduledTaskItem,
  FilterOptions,
  ProcessCategory
} from './types';
import {
  DEFAULT_PRODUCT_TYPES,
  INITIAL_ORDERS,
  INITIAL_PROCESS_PROGRESS,
  MCT_MACHINES
} from './data/defaultData';
import { calculateSchedule } from './utils/scheduler';
import {
  subscribeOrders,
  saveOrderToFirestore,
  deleteOrderFromFirestore,
  subscribeProductTypes,
  saveProductTypeToFirestore,
  subscribeProcessProgress,
  saveProcessProgressToFirestore,
  subscribeUsersList,
  resetDataToDefaultInFirestore,
  logoutUserAccount,
  setUserOnlineStatus
} from './lib/firebase';
import {
  AuthSession,
  getStoredAuthSession,
  createAuthSession,
  clearAllAuthSessions,
  updateSessionActivity,
  extendSession,
  INACTIVITY_TIMEOUT_MS,
  INACTIVITY_WARNING_COUNTDOWN_SECONDS
} from './utils/authSession';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ProductionCalendarView } from './components/ProductionCalendarView';
import { ActualAnalysisView } from './components/ActualAnalysisView';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { OrderForm } from './components/OrderForm';
import { OrderMasterManagementView } from './components/OrderMasterManagementView';
import { GanttChart } from './components/GanttChart';
import { ProcessDetailModal } from './components/ProcessDetailModal';
import { FloorExecutionView } from './components/FloorExecutionView';
import { ProductRoutingView } from './components/ProductRoutingView';
import { EquipmentView } from './components/EquipmentView';
import { ArchiveView } from './components/ArchiveView';
import { QualityInspectionView } from './components/QualityInspectionView';
import { LoginScreen } from './components/LoginScreen';
import { SettingsModal } from './components/SettingsModal';
import { InactivityWarningModal } from './components/InactivityWarningModal';
import {
  ArchiveModal,
  LoginModal,
  UserApprovalModal,
  NewTypeModal,
  CopyTypeModal
} from './components/Modals';

const STORAGE_KEY_ORDERS = 'junsung_mes_orders_v2';
const STORAGE_KEY_TYPES = 'junsung_mes_types_v2';
const STORAGE_KEY_PROGRESS = 'junsung_mes_progress_v2';

export default function App() {
  // 1. Navigation Tab State (Default: Production Executive Dashboard - 대표화면)
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // 2. Core Application Domain State with LocalStorage Persistence
  const [orders, setOrders] = useState<Record<string, Order>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [productTypes, setProductTypes] = useState<Record<string, ProductType>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TYPES);
      return saved ? JSON.parse(saved) : DEFAULT_PRODUCT_TYPES;
    } catch {
      return DEFAULT_PRODUCT_TYPES;
    }
  });

  const [processProgressMap, setProcessProgressMap] = useState<ProcessProgressMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROGRESS);
      return saved ? JSON.parse(saved) : INITIAL_PROCESS_PROGRESS;
    } catch {
      return INITIAL_PROCESS_PROGRESS;
    }
  });

  // Authentication & Secure Session Management (Default Remember Me is OFF)
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    return getStoredAuthSession();
  });
  const currentUser: User | null = authSession ? authSession.user : null;

  // Inactivity Warning & Auto-Logout State
  const [isWarningOpen, setIsWarningOpen] = useState<boolean>(false);
  const [warningSeconds, setWarningSeconds] = useState<number>(INACTIVITY_WARNING_COUNTDOWN_SECONDS);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  const [usersList, setUsersList] = useState<User[]>([]);

  // 3. Firebase Realtime Subscriptions
  useEffect(() => {
    const unsubOrders = subscribeOrders((fireOrders) => {
      setOrders(fireOrders);
    });
    const unsubTypes = subscribeProductTypes((fireTypes) => {
      setProductTypes(fireTypes);
    });
    const unsubProgress = subscribeProcessProgress((fireProgress) => {
      setProcessProgressMap(fireProgress);
    });
    const unsubUsers = subscribeUsersList((uList) => {
      setUsersList(uList);
    });

    return () => {
      unsubOrders();
      unsubTypes();
      unsubProgress();
      unsubUsers();
    };
  }, []);

  // Sync current user online status with Firestore
  useEffect(() => {
    if (currentUser) {
      const ident = currentUser.uid || currentUser.email || currentUser.name;
      setUserOnlineStatus(ident, true);
    }
  }, [currentUser]);

  // Real-time account status & permission revocation sync
  useEffect(() => {
    if (!authSession || !currentUser || usersList.length === 0) return;

    const dbUser = usersList.find(
      (u) =>
        (u.uid && currentUser.uid && u.uid === currentUser.uid) ||
        (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase())
    );

    if (dbUser) {
      if (dbUser.isApproved === false) {
        handleLogout('관리자에 의해 계정 사용이 비활성화되었습니다. 관리자에게 문의하세요.');
        return;
      }

      // Check if role or permissions changed dynamically by admin
      if (
        dbUser.role !== currentUser.role ||
        JSON.stringify(dbUser.permissions) !== JSON.stringify(currentUser.permissions)
      ) {
        const updatedUser: User = {
          ...currentUser,
          role: dbUser.role,
          permissions: dbUser.permissions,
        };
        const updatedSession: AuthSession = {
          ...authSession,
          user: updatedUser,
        };
        setAuthSession(updatedSession);
      }
    }
  }, [usersList, authSession, currentUser]);

  // Inactivity DOM Event Tracking (throttled to once every 15 seconds)
  useEffect(() => {
    if (!authSession) return;

    let lastActivityTime = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivityTime > 15000) {
        lastActivityTime = now;
        updateSessionActivity();
        setAuthSession((prev) => (prev ? { ...prev, lastActiveAt: now } : null));
      }
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
    };
  }, [authSession]);

  // Inactivity & Session Expiration Interval (Checks every 1 second)
  useEffect(() => {
    if (!authSession) {
      setIsWarningOpen(false);
      return;
    }

    const intervalId = setInterval(() => {
      const now = Date.now();

      // 1. Check Hard Expiration (8 hours or 7 days)
      if (now > authSession.expiresAt) {
        handleLogout('세션 유효시간이 만료되어 자동 로그아웃되었습니다.');
        return;
      }

      // 2. Check 30-minute Inactivity Timeout
      const idleTime = now - authSession.lastActiveAt;
      if (idleTime >= INACTIVITY_TIMEOUT_MS) {
        if (!isWarningOpen) {
          setIsWarningOpen(true);
          setWarningSeconds(INACTIVITY_WARNING_COUNTDOWN_SECONDS);
        } else {
          setWarningSeconds((prev) => {
            if (prev <= 1) {
              handleLogout('30분간 활동이 없어 보안을 위해 자동 로그아웃되었습니다.');
              return 0;
            }
            return prev - 1;
          });
        }
      } else {
        if (isWarningOpen) {
          setIsWarningOpen(false);
        }
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [authSession, isWarningOpen]);

  // Back/Forward Navigation Security: prevent history cache from bypassing login
  useEffect(() => {
    const handlePopState = () => {
      const stored = getStoredAuthSession();
      if (!stored && !authSession) {
        setAuthSession(null);
        window.history.replaceState(null, '', window.location.pathname);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [authSession]);

  // Initial Theme Initialization
  useEffect(() => {
    const themeMode = (localStorage.getItem('mes_theme_mode') as 'light' | 'dark' | 'system') || 'light';
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
  }, []);

  // Compute approvedOperators list containing registered approved field operators (role !== 'ADMIN')
  const approvedOperators = useMemo(() => {
    const registeredApproved = usersList
      .filter((u) => u.isApproved && u.role !== 'ADMIN')
      .map((u) => u.name);
    return Array.from(new Set(registeredApproved));
  }, [usersList]);

  // 3. Selection & Modal States
  const [selectedTaskKey, setSelectedTaskKey] = useState<string | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUserApprovalModalOpen, setIsUserApprovalModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isNewTypeModalOpen, setIsNewTypeModalOpen] = useState(false);
  const [isCopyTypeModalOpen, setIsCopyTypeModalOpen] = useState(false);
  const [pendingCopyOrder, setPendingCopyOrder] = useState<Order | null>(null);

  const handleCopyOrderToNew = (order: Order) => {
    setPendingCopyOrder(order);
    setActiveTab('order-form');
  };

  // 4. Filters State
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    category: 'ALL',
    completionStatus: 'ALL',
    searchQuery: '',
    selectedWorker: 'ALL',
  });

  // Save persistent application data to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders', e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TYPES, JSON.stringify(productTypes));
    } catch (e) {
      console.error('Failed to save productTypes', e);
    }
  }, [productTypes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(processProgressMap));
    } catch (e) {
      console.error('Failed to save progress map', e);
    }
  }, [processProgressMap]);

  // 5. Recalculate Master Schedule
  const { scheduledTasks, taskMap, minStart, maxEnd, totalWorkingHours } = useMemo(() => {
    return calculateSchedule(orders, productTypes, processProgressMap);
  }, [orders, productTypes, processProgressMap]);

  // Filtered Tasks for Gantt Chart & Dashboard
  const filteredScheduledTasks = useMemo(() => {
    return scheduledTasks.filter((task) => {
      // Category filter
      if (
        filterOptions.category !== 'ALL' &&
        task.category !== filterOptions.category
      ) {
        return false;
      }
      // Status filter
      if (filterOptions.completionStatus === 'COMPLETED' && !task.isCompleted) {
        return false;
      }
      if (filterOptions.completionStatus === 'PENDING' && task.isCompleted) {
        return false;
      }
      // Worker filter
      if (
        filterOptions.selectedWorker !== 'ALL' &&
        task.worker !== filterOptions.selectedWorker
      ) {
        return false;
      }
      // Search query
      if (filterOptions.searchQuery) {
        const q = filterOptions.searchQuery.toLowerCase();
        const matchesName = task.content.toLowerCase().includes(q);
        const matchesOrder = task.orderName.toLowerCase().includes(q);
        const matchesWorker = task.worker.toLowerCase().includes(q);
        const matchesMachine = task.machine.toLowerCase().includes(q);
        if (!matchesName && !matchesOrder && !matchesWorker && !matchesMachine) {
          return false;
        }
      }
      return true;
    });
  }, [scheduledTasks, filterOptions]);

  // Selected Task Details Object
  const selectedTaskItem = useMemo(() => {
    if (!selectedTaskKey) return null;
    return scheduledTasks.find((t) => t.processKey === selectedTaskKey) || null;
  }, [selectedTaskKey, scheduledTasks]);

  // Handler Actions connected to Firebase
  const handleCreateOrder = (
    newOrder: Order,
    initialProgressMap?: ProcessProgressMap
  ) => {
    const canEditOrder =
      !currentUser ||
      currentUser.role === 'ADMIN' ||
      currentUser.permissions?.canEditOrder === true;

    if (!canEditOrder) {
      alert('⚠️ 신규 수주 등록 권한이 없습니다.\n(현장담당자 계정은 신규 수주 등록 권한이 제한되어 있습니다.)');
      return;
    }

    setOrders((prev) => ({
      ...prev,
      [newOrder.id]: newOrder,
    }));
    saveOrderToFirestore(newOrder);

    if (initialProgressMap && Object.keys(initialProgressMap).length > 0) {
      setProcessProgressMap((prev) => ({
        ...prev,
        ...initialProgressMap,
      }));
      Object.entries(initialProgressMap).forEach(([key, val]) => {
        saveProcessProgressToFirestore(key, {
          isCompleted: val.isCompleted ?? false,
          completedAt: val.completedAt,
          worker: val.worker,
          machine: val.machine,
        });
      });
    }
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    setOrders((prev) => ({
      ...prev,
      [updatedOrder.id]: updatedOrder,
    }));
    saveOrderToFirestore(updatedOrder);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('선택하신 수주건을 삭제하시겠습니까? 관련 공정 진행 현황이 함께 삭제됩니다.')) {
      setOrders((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      deleteOrderFromFirestore(orderId);
      if (selectedTaskItem?.orderId === orderId) {
        setSelectedTaskKey(null);
      }
    }
  };

  const handleArchiveOrder = (orderId: string) => {
    const canArchive =
      !currentUser ||
      currentUser.role === 'ADMIN' ||
      currentUser.permissions?.canArchive === true;

    if (!canArchive) {
      alert('⚠️ 수주 보관함 이동 권한이 없습니다.\n(수주 보관 처리 및 관리는 관리자(ADMIN) 또는 영업/수주 담당자 권한이 필요합니다.)');
      return;
    }

    const nowStr = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    setOrders((prev) => {
      const target = prev[orderId];
      if (!target) return prev;

      const archivedOrder: Order = {
        ...target,
        status: 'COMPLETED',
        archived: true,
        completedAt: target.completedAt || nowStr,
      };
      saveOrderToFirestore(archivedOrder);
      return {
        ...prev,
        [orderId]: archivedOrder,
      };
    });

    handleCompleteAllOrderProcesses(orderId, true, undefined, undefined, true);
  };

  const handleRestoreOrder = (orderId: string) => {
    setOrders((prev) => {
      const target = prev[orderId];
      if (!target) return prev;

      const restoredOrder: Order = {
        ...target,
        archived: false,
      };
      saveOrderToFirestore(restoredOrder);
      return {
        ...prev,
        [orderId]: restoredOrder,
      };
    });
  };

  const handleCompleteAllOrderProcesses = (
    orderId: string,
    forceComplete: boolean,
    overrideProcesses?: ProcessStep[],
    overrideQty?: number,
    overrideArchived?: boolean
  ) => {
    setOrders((prev) => {
      const ord = prev[orderId];
      if (!ord) return prev;

      const type = productTypes[ord.typeId];
      const baseProcesses = (overrideProcesses && overrideProcesses.length > 0)
        ? overrideProcesses
        : ((ord.customProcesses && ord.customProcesses.length > 0)
          ? ord.customProcesses
          : (type ? type.processes : []));

      const qty = Math.max(1, overrideQty || parseInt(String(ord.qty)) || 1);

      const nowStr = new Date().toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      setProcessProgressMap((prevProgress) => {
        const next = { ...prevProgress };

        // 1. Update standard generated process keys
        for (let q = 1; q <= qty; q++) {
          baseProcesses.forEach((_, pIdx) => {
            const processKey = `${ord.id}_Q${q}_P${pIdx}`;
            const existing = next[processKey] || {};
            const updated = {
              ...existing,
              isCompleted: forceComplete,
              completedAt: forceComplete ? (existing.completedAt || nowStr) : undefined,
            };
            next[processKey] = updated;
            saveProcessProgressToFirestore(processKey, updated);
          });
        }

        // 2. Also update any keys that start with orderId prefix
        Object.keys(next).forEach((k) => {
          if (k.startsWith(`${ord.id}_`)) {
            const existing = next[k];
            const updated = {
              ...existing,
              isCompleted: forceComplete,
              completedAt: forceComplete ? (existing.completedAt || nowStr) : undefined,
            };
            next[k] = updated;
            saveProcessProgressToFirestore(k, updated);
          }
        });

        return next;
      });

      const updatedOrder: Order = {
        ...ord,
        status: forceComplete ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: forceComplete ? (ord.completedAt || nowStr) : null,
        archived: overrideArchived !== undefined ? overrideArchived : ord.archived,
      };
      saveOrderToFirestore(updatedOrder);

      return {
        ...prev,
        [orderId]: updatedOrder,
      };
    });
  };

  const handleUpdateProgress = (processKey: string, updates: Partial<ProcessProgressMap[string]>) => {
    const canExecuteMES =
      !currentUser ||
      currentUser.role === 'ADMIN' ||
      currentUser.permissions?.canExecuteMES === true;

    if (!canExecuteMES) {
      alert('⚠️ 공정 상태 변경 권한이 없습니다.');
      return;
    }

    setProcessProgressMap((prev) => {
      const existing = prev[processKey] || {};
      const updated = { ...existing, ...updates };

      if (updates.isCompleted !== undefined) {
        if (updates.isCompleted) {
          updated.completedAt =
            updates.completedAt ||
            new Date().toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
        } else {
          updated.completedAt = undefined;
        }
      }

      saveProcessProgressToFirestore(processKey, updated);

      return {
        ...prev,
        [processKey]: updated,
      };
    });
  };

  const handleSaveNewProductType = (newType: ProductType) => {
    setProductTypes((prev) => ({
      ...prev,
      [newType.id]: newType,
    }));
    saveProductTypeToFirestore(newType);
  };

  const handleCopyProductType = (sourceTypeId: string, newTypeName: string, selectedIndexes: number[]) => {
    const source = productTypes[sourceTypeId];
    if (!source) return;

    const filteredProcesses = source.processes.filter((_, idx) =>
      selectedIndexes.includes(idx)
    );

    const newTypeId = `TYPE_COPY_${Date.now()}`;
    const newType: ProductType = {
      id: newTypeId,
      name: newTypeName,
      isReference: false,
      processes: filteredProcesses,
    };

    setProductTypes((prev) => ({
      ...prev,
      [newTypeId]: newType,
    }));
    saveProductTypeToFirestore(newType);
  };

  const handleUpdateProductType = (updatedType: ProductType) => {
    setProductTypes((prev) => ({
      ...prev,
      [updatedType.id]: updatedType,
    }));
    saveProductTypeToFirestore(updatedType);
  };

  const handleResetData = async () => {
    try {
      setOrders(INITIAL_ORDERS);
      setProductTypes(DEFAULT_PRODUCT_TYPES);
      setProcessProgressMap(INITIAL_PROCESS_PROGRESS);
      localStorage.removeItem(STORAGE_KEY_ORDERS);
      localStorage.removeItem(STORAGE_KEY_TYPES);
      localStorage.removeItem(STORAGE_KEY_PROGRESS);
      setSelectedTaskKey(null);
      await resetDataToDefaultInFirestore();
      alert('✅ 수주 및 공정 데이터가 초기 기본 데이터로 원복되었습니다.');
    } catch (e) {
      console.error(e);
      alert('데이터 초기화 중 오류가 발생했습니다.');
    }
  };

  const handleImportBackupData = (importedData: {
    orders?: Record<string, Order>;
    productTypes?: Record<string, ProductType>;
    processProgressMap?: ProcessProgressMap;
  }) => {
    if (importedData.orders) {
      setOrders(importedData.orders);
      Object.values(importedData.orders).forEach((o) => saveOrderToFirestore(o));
    }
    if (importedData.productTypes) {
      setProductTypes(importedData.productTypes);
      Object.values(importedData.productTypes).forEach((pt) => saveProductTypeToFirestore(pt));
    }
    if (importedData.processProgressMap) {
      setProcessProgressMap(importedData.processProgressMap);
      Object.entries(importedData.processProgressMap).forEach(([k, v]) =>
        saveProcessProgressToFirestore(k, {
          isCompleted: Boolean(v.isCompleted),
          completedAt: v.completedAt,
          worker: v.worker,
          machine: v.machine,
        })
      );
    }
  };

  // Login Success Handler
  const handleLoginSuccess = (user: User, rememberMe: boolean = false) => {
    const session = createAuthSession(user, rememberMe);
    setAuthSession(session);
    setSessionNotice(null);
    setIsWarningOpen(false);
  };

  // Logout Handler with complete session purge and state clear
  const handleLogout = async (reasonNotice?: string) => {
    const userIdent = currentUser?.uid || currentUser?.email || currentUser?.name;
    setIsWarningOpen(false);
    clearAllAuthSessions();
    setAuthSession(null);

    if (reasonNotice) {
      setSessionNotice(reasonNotice);
    }

    try {
      if (userIdent) {
        await setUserOnlineStatus(userIdent, false);
      }
      await logoutUserAccount(currentUser);
    } catch (err) {
      console.warn('Logout cleanup error:', err);
    }
  };

  // Extend Session Handler (from Inactivity warning modal)
  const handleExtendSession = () => {
    extendSession();
    setIsWarningOpen(false);
    setWarningSeconds(INACTIVITY_WARNING_COUNTDOWN_SECONDS);
    if (authSession) {
      setAuthSession({
        ...authSession,
        lastActiveAt: Date.now(),
        expiresAt: Date.now() + (authSession.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000),
      });
    }
  };

  // Enforce Login before accessing the Dashboard and Scheduler
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        sessionNotice={sessionNotice}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F0F6F9] dark:bg-[#090d16] text-[#0F172A] dark:text-slate-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        inProgressCount={(Object.values(orders) as Order[]).filter((o) => !o.archived && o.status !== 'COMPLETED').length}
        completedCount={(Object.values(orders) as Order[]).filter((o) => !o.archived && o.status === 'COMPLETED').length}
        archivedCount={(Object.values(orders) as Order[]).filter((o) => o.archived).length}
        scheduledTasks={scheduledTasks}
        operatorCount={approvedOperators.length}
        currentUser={currentUser}
        onLogout={() => handleLogout()}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          currentUser={currentUser}
          archivedCount={(Object.values(orders) as Order[]).filter((o) => o.archived).length}
          onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onOpenUserApprovalModal={() => setIsUserApprovalModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onLogout={() => handleLogout()}
        />

        {/* Content View Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB: GOOGLE CALENDAR-STYLE PRODUCTION CALENDAR (PRIMARY / DEFAULT) */}
          {activeTab === 'calendar' && (
            <ProductionCalendarView
              scheduledTasks={scheduledTasks}
              orders={orders}
              processProgressMap={processProgressMap}
              onUpdateProgress={handleUpdateProgress}
              currentUser={currentUser}
              approvedOperators={approvedOperators}
              onNavigateToOrderForm={() => setActiveTab('order-form')}
            />
          )}

          {/* TAB: PLAN VS ACTUAL VARIANCE ANALYSIS */}
          {activeTab === 'actual-analysis' && (
            <ActualAnalysisView
              scheduledTasks={scheduledTasks}
              orders={orders}
              processProgressMap={processProgressMap}
              onUpdateProgress={handleUpdateProgress}
              currentUser={currentUser}
              approvedOperators={approvedOperators}
            />
          )}

          {/* TAB: EXECUTIVE DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              {/* Executive Summary Metrics & Orders List */}
              <ExecutiveSummary
                orders={orders}
                productTypes={productTypes}
                processProgressMap={processProgressMap}
                scheduledTasks={scheduledTasks}
                filterOptions={filterOptions}
                setFilterOptions={setFilterOptions}
                onSelectTask={(key) => setSelectedTaskKey(key)}
                onUpdateOrder={handleUpdateOrder}
                onArchiveOrder={handleArchiveOrder}
                onDeleteOrder={handleDeleteOrder}
                onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
                onCompleteAllProcesses={handleCompleteAllOrderProcesses}
                onNavigateToOrderForm={() => setActiveTab('order-form')}
                currentUser={currentUser}
              />
            </>
          )}

          {/* TAB: NEW ORDER CREATION */}
          {activeTab === 'order-form' && (
            <OrderForm
              productTypes={productTypes}
              onCreateOrder={handleCreateOrder}
              onOpenNewTypeModal={() => setIsNewTypeModalOpen(true)}
              onOpenCopyTypeModal={() => setIsCopyTypeModalOpen(true)}
              onOrderCreatedSuccess={() => setActiveTab('order-master')}
              pendingCopyOrder={pendingCopyOrder}
              onClearPendingCopyOrder={() => setPendingCopyOrder(null)}
              approvedOperators={approvedOperators}
            />
          )}

          {/* TAB: ORDER MASTER TABLE & ROUTING SPEC EDITOR */}
          {activeTab === 'order-master' && (
            <OrderMasterManagementView
              orders={orders}
              productTypes={productTypes}
              processProgressMap={processProgressMap}
              scheduledTasks={scheduledTasks}
              onUpdateOrder={handleUpdateOrder}
              onDeleteOrder={handleDeleteOrder}
              onArchiveOrder={handleArchiveOrder}
              onRestoreOrder={handleRestoreOrder}
              onCompleteAllProcesses={handleCompleteAllOrderProcesses}
              onNavigateToOrderForm={() => setActiveTab('order-form')}
              onCopyOrderToNew={handleCopyOrderToNew}
              currentUser={currentUser}
              approvedOperators={approvedOperators}
            />
          )}

          {/* TAB: GANTT CHART TIMELINE */}
          {activeTab === 'timeline' && (
            <GanttChart
              scheduledTasks={scheduledTasks}
              filteredTasks={filteredScheduledTasks}
              orders={orders}
              minStart={minStart}
              maxEnd={maxEnd}
              filterOptions={filterOptions}
              setFilterOptions={setFilterOptions}
              onSelectTask={(key) => setSelectedTaskKey(key)}
              onUpdateProgress={handleUpdateProgress}
            />
          )}

          {/* TAB: FLOOR MES TERMINAL */}
          {activeTab === 'execution' && (
            <FloorExecutionView
              scheduledTasks={scheduledTasks}
              orders={orders}
              productTypes={productTypes}
              processProgressMap={processProgressMap}
              onUpdateProgress={handleUpdateProgress}
              currentUser={currentUser}
              approvedOperators={approvedOperators}
            />
          )}

          {/* TAB: PRODUCT ROUTING MASTER */}
          {activeTab === 'routing' && (
            <ProductRoutingView
              productTypes={productTypes}
              onSaveNewProductType={handleSaveNewProductType}
              onUpdateProductType={handleUpdateProductType}
            />
          )}

          {/* TAB: EQUIPMENT & PERSONNEL OEE MONITOR */}
          {activeTab === 'equipment' && (
            <EquipmentView
              items={scheduledTasks}
              orders={orders}
              approvedOperators={approvedOperators}
            />
          )}

          {/* TAB: QUALITY INSPECTION & CMM DASHBOARD */}
          {activeTab === 'quality' && <QualityInspectionView />}

          {/* TAB: ARCHIVE MASTER VAULT (완료 수주 보관함) */}
          {activeTab === 'archive' && (
            <ArchiveView
              orders={orders}
              productTypes={productTypes}
              onRestoreOrder={handleRestoreOrder}
              onCopyOrderToNew={handleCopyOrderToNew}
            />
          )}
        </div>
      </div>

      {/* Global Inactivity Warning Modal */}
      <InactivityWarningModal
        isOpen={isWarningOpen}
        remainingSeconds={warningSeconds}
        onExtendSession={handleExtendSession}
        onLogout={() => handleLogout()}
      />

      {/* Global Modals */}
      <ArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        orders={orders}
        productTypes={productTypes}
        onRestoreOrder={handleRestoreOrder}
        onCopyOrderToNew={handleCopyOrderToNew}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(user) => {
          handleLoginSuccess(user, false);
        }}
      />

      <UserApprovalModal
        isOpen={isUserApprovalModalOpen}
        onClose={() => setIsUserApprovalModalOpen(false)}
        currentUser={currentUser}
      />

      <NewTypeModal
        isOpen={isNewTypeModalOpen}
        onClose={() => setIsNewTypeModalOpen(false)}
        onSaveType={handleSaveNewProductType}
      />

      <CopyTypeModal
        isOpen={isCopyTypeModalOpen}
        onClose={() => setIsCopyTypeModalOpen(false)}
        productTypes={productTypes}
        onCopyType={handleCopyProductType}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentUser={currentUser}
        orders={orders}
        productTypes={productTypes}
        processProgressMap={processProgressMap}
        onResetData={handleResetData}
        onImportBackupData={handleImportBackupData}
      />
    </div>
  );
}
