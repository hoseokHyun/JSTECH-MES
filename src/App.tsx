import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Order,
  OrderStatus,
  ProductType,
  ProcessStep,
  User,
  ProcessProgressMap,
  ProcessProgressItem,
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
import { extractValidApprovedOperators } from './utils/operatorHelper';
import {
  subscribeOrders,
  saveOrderToFirestore,
  deleteOrderFromFirestore,
  subscribeProductTypes,
  saveProductTypeToFirestore,
  deleteProductTypeFromFirestore,
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
  updateStoredAuthSessionUser,
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
import { StandaloneFloorMESLayout } from './components/StandaloneFloorMESLayout';
import { ProductRoutingView } from './components/ProductRoutingView';
import { EquipmentView } from './components/EquipmentView';
import { ArchiveView } from './components/ArchiveView';
import { QualityInspectionView } from './components/QualityInspectionView';
import { LoginScreen } from './components/LoginScreen';
import { SettingsModal } from './components/SettingsModal';
import { InactivityWarningModal } from './components/InactivityWarningModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  ArchiveModal,
  LoginModal,
  UserApprovalModal,
  NewTypeModal,
  CopyTypeModal
} from './components/Modals';
import { ShieldAlert } from 'lucide-react';
import {
  MenuId,
  MENU_LABELS,
  computeEffectivePermissions,
} from './utils/permissionManager';

const STORAGE_KEY_ORDERS = 'junsung_mes_orders_v2';
const STORAGE_KEY_TYPES = 'junsung_mes_types_v2';
const STORAGE_KEY_PROGRESS = 'junsung_mes_progress_v2';

export default function App() {
  // 1. Navigation Tab State (Default: Production Executive Dashboard - 메인화면 or /floor /floor-mes on DeepLink)
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const search = window.location.search;
      if (
        path === '/floor' ||
        path.startsWith('/floor/') ||
        path.startsWith('/floor-mes') ||
        path.includes('/floor') ||
        search.includes('orderId=') ||
        search.includes('tab=execution')
      ) {
        return 'execution';
      }
    }
    return 'dashboard';
  });

  const [isFloorStandaloneMode, setIsFloorStandaloneMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const search = window.location.search;
      return (
        path === '/floor' ||
        path.startsWith('/floor/') ||
        path.startsWith('/floor-mes') ||
        path.includes('/floor') ||
        search.includes('orderId=') ||
        search.includes('floor=true')
      );
    }
    return false;
  });

  // 2. Core Application Domain State with LocalStorage Persistence
  const [orders, setOrders] = useState<Record<string, Order>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
      return {};
    } catch {
      return {};
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
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Authentication & Secure Session Management (Default Remember Me is OFF)
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    return getStoredAuthSession();
  });
  const currentUser: User | null = authSession ? authSession.user : null;

  // RBAC: Granular Effective Permissions Calculation
  const effectivePerms = useMemo(() => computeEffectivePermissions(currentUser), [currentUser]);

  // Route Guarding: Ensure user cannot remain on an unauthorized menu
  useEffect(() => {
    if (activeTab && !effectivePerms.allowedMenus.includes(activeTab as MenuId)) {
      const fallbackTab = effectivePerms.primaryMenu || effectivePerms.allowedMenus[0] || 'dashboard';
      console.warn(`[RBAC Guard] Menu '${activeTab}' is not permitted for current user. Redirecting to '${fallbackTab}'.`);
      setActiveTab(fallbackTab);
    }
  }, [currentUser, activeTab, effectivePerms]);

  // Safe navigation handler checking menu permissions before switching tabs
  const handleSelectTab = (tab: string) => {
    if (!effectivePerms.allowedMenus.includes(tab as MenuId)) {
      alert(`[접근 제한] '${MENU_LABELS[tab] || tab}' 메뉴에 대한 접근 권한이 없습니다.\n관리자에게 권한을 요청하세요.`);
      return;
    }
    setActiveTab(tab);
  };

  // Inactivity Warning & Auto-Logout State
  const [isWarningOpen, setIsWarningOpen] = useState<boolean>(false);
  const [warningSeconds, setWarningSeconds] = useState<number>(INACTIVITY_WARNING_COUNTDOWN_SECONDS);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  const [usersList, setUsersList] = useState<User[]>([]);

  // 3. Firebase Realtime Subscriptions
  useEffect(() => {
    const unsubOrders = subscribeOrders((fireOrders) => {
      const currentOrders = fireOrders || {};
      setOrders(currentOrders);
      try {
        localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(currentOrders));
      } catch (e) {
        console.error('Failed to sync orders to localStorage', e);
      }
    });
    const unsubTypes = subscribeProductTypes((fireTypes) => {
      if (fireTypes && Object.keys(fireTypes).length > 0) {
        setProductTypes(fireTypes);
      }
    });
    const unsubProgress = subscribeProcessProgress((fireProgress) => {
      setProcessProgressMap(fireProgress || {});
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

      // Check if role, department, or permissions changed dynamically by admin
      const roleChanged = dbUser.role !== currentUser.role;
      const deptChanged = (dbUser.department || '') !== (currentUser.department || '');
      const permsChanged = JSON.stringify(dbUser.permissions) !== JSON.stringify(currentUser.permissions);

      if (roleChanged || deptChanged || permsChanged) {
        const updatedUser: User = {
          ...currentUser,
          role: dbUser.role,
          department: dbUser.department,
          permissions: dbUser.permissions,
        };
        const updatedSession: AuthSession = {
          ...authSession,
          user: updatedUser,
        };
        setAuthSession(updatedSession);
        updateStoredAuthSessionUser(updatedUser);
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
    if (!effectivePerms.allowedMenus.includes('order-form')) {
      alert('[접근 제한] 신규 수주 등록 메뉴에 대한 접근 권한이 없습니다.');
      return;
    }
    setPendingCopyOrder(order);
    handleSelectTab('order-form');
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

  // Compute approvedOperators list containing only valid registered workers and floor operators from Firestore usersList
  const approvedOperators = useMemo(() => {
    return extractValidApprovedOperators(usersList);
  }, [usersList]);

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

    // 1. Accurately update State & LocalStorage
    setOrders((prev) => {
      const next = {
        ...prev,
        [newOrder.id]: newOrder,
      };
      try {
        localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save orders to localStorage', e);
      }
      return next;
    });

    // 2. Persist to Firestore DB (Save new order)
    saveOrderToFirestore(newOrder);

    if (initialProgressMap && Object.keys(initialProgressMap).length > 0) {
      setProcessProgressMap((prev) => {
        const next = {
          ...prev,
          ...initialProgressMap,
        };
        try {
          localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(next));
        } catch (e) {
          console.error('Failed to save progress map to localStorage', e);
        }
        return next;
      });
      Object.entries(initialProgressMap).forEach(([key, val]) => {
        saveProcessProgressToFirestore(key, {
          isCompleted: val.isCompleted ?? false,
          completedAt: val.completedAt,
          worker: val.worker,
          machine: val.machine,
          status: val.status,
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

    // Sync progress map workers/machines if updated
    if (updatedOrder.customProcesses && updatedOrder.customProcesses.length > 0) {
      setProcessProgressMap((prev) => {
        const next = { ...prev };
        let changed = false;
        const qty = Math.max(1, Number(updatedOrder.qty) || 1);

        updatedOrder.customProcesses?.forEach((p, pIdx) => {
          const workerVal = (p.assignedWorker || p.worker || '').trim();
          const machineVal = (p.assignedMachine || '').trim();

          // Sync across all product units (Q1..Qn) and standard key variants
          for (let q = 1; q <= qty; q++) {
            const possibleKeys = [
              `${updatedOrder.id}_Q${q}_P${pIdx}`,
              `${updatedOrder.id}-Q${q}-${pIdx}`,
              `${updatedOrder.id}-${pIdx}`,
              `${updatedOrder.id}_${pIdx}`,
            ];

            possibleKeys.forEach((key) => {
              const current = next[key];
              if (current) {
                let itemChanged = false;
                const updatedItem = { ...current };
                if (workerVal && updatedItem.worker !== workerVal) {
                  updatedItem.worker = workerVal;
                  itemChanged = true;
                }
                if (machineVal && updatedItem.machine !== machineVal) {
                  updatedItem.machine = machineVal;
                  itemChanged = true;
                }
                if (itemChanged) {
                  next[key] = updatedItem;
                  changed = true;
                  saveProcessProgressToFirestore(key, updatedItem);
                }
              } else if (workerVal || machineVal) {
                next[key] = {
                  isCompleted: updatedOrder.status === 'COMPLETED',
                  worker: workerVal,
                  machine: machineVal,
                };
                changed = true;
                saveProcessProgressToFirestore(key, next[key]);
              }
            });
          }
        });

        if (changed) {
          try {
            localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(next));
          } catch (e) {
            console.error('Failed to save progress map update to localStorage', e);
          }
        }
        return changed ? next : prev;
      });
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders((prev) => {
      const next = { ...prev };
      delete next[orderId];
      try {
        localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save orders after delete', e);
      }
      return next;
    });

    setProcessProgressMap((prev) => {
      const next = { ...prev };
      let changed = false;
      Object.keys(next).forEach((key) => {
        if (key.startsWith(`${orderId}-`) || key.startsWith(`${orderId}_`) || key.includes(`-${orderId}-`)) {
          delete next[key];
          changed = true;
        }
      });
      if (changed) {
        try {
          localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(next));
        } catch (e) {
          console.error('Failed to update progress map in localStorage', e);
        }
      }
      return changed ? next : prev;
    });

    deleteOrderFromFirestore(orderId);
    if (selectedTaskItem?.orderId === orderId) {
      setSelectedTaskKey(null);
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

      // 1. Calculate actual progress before archiving
      const type = productTypes[target.typeId];
      const baseProcesses = (target.customProcesses && target.customProcesses.length > 0)
        ? target.customProcesses
        : (type ? type.processes : []);
      const qty = Math.max(1, parseInt(String(target.qty)) || 1);
      const totalUnits = baseProcesses.length * qty;

      let completedUnits = 0;
      const orderProcessSnapshot: Record<string, ProcessProgressItem> = {};

      // Snapshot all current processProgressMap items for this order
      Object.entries(processProgressMap).forEach(([k, v]) => {
        if (k.startsWith(`${target.id}_`) || k.startsWith(`${target.id}-`) || k.includes(`-${target.id}-`)) {
          orderProcessSnapshot[k] = { ...v };
        }
      });

      for (let q = 1; q <= qty; q++) {
        baseProcesses.forEach((_, pIdx) => {
          const key = `${target.id}_Q${q}_P${pIdx}`;
          const currentItem = processProgressMap[key];
          if (currentItem) {
            orderProcessSnapshot[key] = { ...currentItem };
            if (currentItem.isCompleted || currentItem.completed) {
              completedUnits++;
            }
          }
        });
      }

      const calculatedPct = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;
      const wasActuallyCompleted =
        (calculatedPct === 100 && target.status === 'COMPLETED') ||
        (totalUnits > 0 && completedUnits === totalUnits);

      const archivedOrder: Order = {
        ...target,
        status: 'COMPLETED', // In Archive Vault, always displayed as completed
        archived: true,
        completedAt: target.completedAt || nowStr,
        // Snapshot pre-archive state
        previousOrderStatus: target.status || 'PENDING',
        previousProgress: calculatedPct,
        preArchiveCompletedAt: target.completedAt || null,
        wasActuallyCompleted: wasActuallyCompleted,
        preArchiveProcessMap: orderProcessSnapshot,
      };

      saveOrderToFirestore(archivedOrder);
      return {
        ...prev,
        [orderId]: archivedOrder,
      };
    });
  };

  const handleRestoreOrder = (orderId: string) => {
    setOrders((prev) => {
      const target = prev[orderId];
      if (!target) return prev;

      const wasCompleted =
        target.wasActuallyCompleted === true ||
        (target.previousProgress === 100 && target.previousOrderStatus === 'COMPLETED');

      let restoredStatus: OrderStatus;
      if (wasCompleted) {
        restoredStatus = 'COMPLETED';
      } else if (target.previousOrderStatus && target.previousOrderStatus !== 'COMPLETED') {
        restoredStatus = target.previousOrderStatus;
      } else {
        restoredStatus = 'IN_PROGRESS';
      }

      const restoredOrder: Order = {
        ...target,
        archived: false,
        status: restoredStatus,
        completedAt: wasCompleted ? (target.completedAt || target.preArchiveCompletedAt || null) : null,
      };

      // If it was force-archived and had a snapshot of processProgressMap, restore exact process progress
      if (!wasCompleted && target.preArchiveProcessMap && Object.keys(target.preArchiveProcessMap).length > 0) {
        setProcessProgressMap((prevProg) => {
          const nextProg = { ...prevProg };
          Object.entries(target.preArchiveProcessMap!).forEach(([pKey, pVal]) => {
            nextProg[pKey] = { ...pVal };
            saveProcessProgressToFirestore(pKey, pVal);
          });
          try {
            localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(nextProg));
          } catch (e) {
            console.error('Failed to save restored progress map', e);
          }
          return nextProg;
        });
      }

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
          baseProcesses.forEach((p, pIdx) => {
            const processKey = `${ord.id}_Q${q}_P${pIdx}`;
            const existing = next[processKey] || {};
            const workerVal = (p?.assignedWorker || p?.worker || existing.worker || '').trim();
            const machineVal = (p?.assignedMachine || existing.machine || '').trim();
            const updated = {
              ...existing,
              worker: workerVal || existing.worker,
              machine: machineVal || existing.machine,
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

  const handleUpdateProgress = (
    processKey: string,
    updates: Partial<ProcessProgressMap[string]> & {
      planStart?: string;
      planEnd?: string;
      durationHours?: number;
    }
  ) => {
    const canExecuteMES =
      !currentUser ||
      currentUser.role === 'ADMIN' ||
      currentUser.permissions?.canExecuteMES !== false;

    if (!canExecuteMES) {
      alert('⚠️ 공정 상태 변경 권한이 없습니다.');
      return;
    }

    // Parse orderId and process index (pIdx) from processKey
    let orderId: string | null = null;
    let pIdx = -1;

    const match1 = processKey.match(/^(.*?)_Q(\d+)_P(\d+)$/i);
    if (match1) {
      orderId = match1[1];
      pIdx = parseInt(match1[3], 10);
    } else {
      const match2 = processKey.match(/^(.*?)-Q(\d+)-(\d+)$/i);
      if (match2) {
        orderId = match2[1];
        pIdx = parseInt(match2[3], 10);
      } else {
        const match3 = processKey.match(/^(.*?)[-_](\d+)$/);
        if (match3) {
          orderId = match3[1];
          pIdx = parseInt(match3[2], 10);
        }
      }
    }

    // 1. Update processProgressMap state & Firestore (and all sibling unit keys if worker/machine changed)
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

      const nextMap = {
        ...prev,
        [processKey]: updated,
      };

      saveProcessProgressToFirestore(processKey, updated);

      // If worker, machine, memo, or planStart was changed, sync to sibling units for that order & process step
      if (
        orderId &&
        pIdx >= 0 &&
        (updates.worker !== undefined ||
          updates.machine !== undefined ||
          updates.memo !== undefined)
      ) {
        const ord = orders[orderId];
        const totalQty = ord ? Math.max(1, parseInt(String(ord.qty)) || 1) : 10;
        for (let q = 1; q <= totalQty; q++) {
          const siblingKeys = [
            `${orderId}_Q${q}_P${pIdx}`,
            `${orderId}-Q${q}-${pIdx}`,
          ];
          siblingKeys.forEach((sKey) => {
            if (sKey !== processKey) {
              const currentSib = nextMap[sKey] || {};
              const updatedSib = {
                ...currentSib,
                ...(updates.worker !== undefined ? { worker: updates.worker } : {}),
                ...(updates.machine !== undefined ? { machine: updates.machine } : {}),
                ...(updates.memo !== undefined ? { memo: updates.memo } : {}),
              };
              nextMap[sKey] = updatedSib;
              saveProcessProgressToFirestore(sKey, updatedSib);
            }
          });
        }

        const flatKey = `${orderId}-${pIdx}`;
        if (flatKey !== processKey) {
          const currentFlat = nextMap[flatKey] || {};
          const updatedFlat = {
            ...currentFlat,
            ...(updates.worker !== undefined ? { worker: updates.worker } : {}),
            ...(updates.machine !== undefined ? { machine: updates.machine } : {}),
            ...(updates.memo !== undefined ? { memo: updates.memo } : {}),
          };
          nextMap[flatKey] = updatedFlat;
          saveProcessProgressToFirestore(flatKey, updatedFlat);
        }
      }

      try {
        localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(nextMap));
      } catch (e) {
        console.error('Failed to sync progress map to localStorage', e);
      }

      return nextMap;
    });

    // 2. Bidirectional Sync: Update Central Order & Routing in Single Source of Truth
    if (orderId && orders[orderId]) {
      setOrders((prevOrders) => {
        const ord = prevOrders[orderId!];
        if (!ord) return prevOrders;

        const type = productTypes[ord.typeId];
        const baseProcesses: ProcessStep[] =
          ord.customProcesses && ord.customProcesses.length > 0
            ? ord.customProcesses.map((p) => ({ ...p }))
            : (type?.processes || []).map((p) => ({ ...p }));

        let orderModified = false;

        if (pIdx >= 0 && pIdx < baseProcesses.length) {
          const targetProc = { ...baseProcesses[pIdx] };

          if (updates.worker !== undefined && targetProc.assignedWorker !== updates.worker) {
            targetProc.assignedWorker = updates.worker;
            targetProc.worker = updates.worker;
            orderModified = true;
          }
          if (updates.machine !== undefined && targetProc.assignedMachine !== updates.machine) {
            targetProc.assignedMachine = updates.machine;
            orderModified = true;
          }
          if (
            updates.durationHours !== undefined &&
            updates.durationHours > 0 &&
            targetProc.durationHours !== updates.durationHours
          ) {
            targetProc.durationHours = updates.durationHours;
            orderModified = true;
          }
          if (updates.memo !== undefined && targetProc.memo !== updates.memo) {
            targetProc.memo = updates.memo;
            orderModified = true;
          }

          baseProcesses[pIdx] = targetProc;
        }

        // If planStart of the first step changed, sync order start date
        let newStartDate = ord.startDate;
        if (pIdx === 0 && updates.planStart) {
          newStartDate = updates.planStart;
          orderModified = true;
        }

        if (orderModified || !ord.customProcesses || ord.customProcesses.length === 0) {
          const updatedOrder: Order = {
            ...ord,
            startDate: newStartDate,
            customProcesses: baseProcesses,
          };

          saveOrderToFirestore(updatedOrder);

          const nextOrders = {
            ...prevOrders,
            [orderId!]: updatedOrder,
          };

          try {
            localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(nextOrders));
          } catch (e) {
            console.error('Failed to sync orders to localStorage', e);
          }

          return nextOrders;
        }

        return prevOrders;
      });
    }
  };

  const handleSaveNewProductType = (newType: ProductType) => {
    setProductTypes((prev) => ({
      ...prev,
      [newType.id]: newType,
    }));
    saveProductTypeToFirestore(newType);
  };

  const handleCreateNewProductTypeFromModal = (
    typeName: string,
    processes: { name: string; category: ProcessCategory; durationHours: number }[]
  ) => {
    const trimmed = typeName.trim();
    const isDuplicate = Object.values(productTypes).some(
      (t) => t.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      alert('이미 존재하는 마스터 이름입니다. 다른 이름을 입력해주세요.');
      return;
    }

    const newTypeId = `TYPE_${Date.now()}`;
    const newType: ProductType = {
      id: newTypeId,
      name: trimmed,
      isReference: false,
      processes: processes.map((p) => ({
        name: p.name,
        category: p.category,
        durationHours: p.durationHours,
      })),
    };
    handleSaveNewProductType(newType);
  };

  const handleCopyProductType = (sourceTypeId: string, newTypeName: string, selectedIndexes: number[]) => {
    const source = productTypes[sourceTypeId];
    if (!source) return;

    const trimmed = newTypeName.trim();
    const isDuplicate = Object.values(productTypes).some(
      (t) => t.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      alert('이미 존재하는 마스터 이름입니다. 다른 이름을 입력해주세요.');
      return;
    }

    const filteredProcesses = source.processes.filter((_, idx) =>
      selectedIndexes.includes(idx)
    );

    const newTypeId = `TYPE_COPY_${Date.now()}`;
    const newType: ProductType = {
      id: newTypeId,
      name: trimmed,
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

  const handleDeleteProductType = (typeId: string) => {
    setProductTypes((prev) => {
      const next = { ...prev };
      delete next[typeId];
      try {
        localStorage.setItem(STORAGE_KEY_TYPES, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to update localStorage for productTypes:', e);
      }
      return next;
    });
    deleteProductTypeFromFirestore(typeId);
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

    // 로그인 완료 후 기본 진입 화면: "생산 종합 대시보드" ('dashboard')
    // 단, 사용자가 직접 특정 URL 또는 파라미터(/floor, ?tab=..., ?orderId=...)로 접근한 경우 기존 목적지로 정상 이동
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const search = window.location.search;
      if (
        path === '/floor' ||
        path.startsWith('/floor/') ||
        path.startsWith('/floor-mes') ||
        path.includes('/floor') ||
        search.includes('orderId=') ||
        search.includes('tab=execution')
      ) {
        setActiveTab('execution');
      } else if (search.includes('tab=')) {
        const urlParams = new URLSearchParams(search);
        const t = urlParams.get('tab');
        if (t) {
          setActiveTab(t);
        } else {
          setActiveTab('dashboard');
        }
      } else {
        setActiveTab('dashboard');
      }
    } else {
      setActiveTab('dashboard');
    }
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

  // Field Operator Isolated View / QR Deep-Link Standalone Mode
  // Only users whose ONLY permitted menu is 'execution' (Floor MES) and belong to field shop floor teams,
  // or explicit kiosk/standalone URL parameters should enter StandaloneFloorMESLayout.
  // Office, sales, admin, and managerial roles must always enter the full application portal.
  const isPureFieldOperator =
    currentUser.role !== 'ADMIN' &&
    currentUser.department !== '시스템 관리자' &&
    currentUser.department !== '생산 관리' &&
    currentUser.department !== '생산관리' &&
    currentUser.department !== '영업팀' &&
    currentUser.department !== '임원진' &&
    effectivePerms.allowedMenus.length === 1 &&
    effectivePerms.allowedMenus.includes('execution');

  const isAdminOrManager =
    currentUser.role === 'ADMIN' ||
    currentUser.department === '시스템 관리자' ||
    currentUser.department === '생산 관리' ||
    currentUser.department === '생산관리';

  if (isPureFieldOperator || isFloorStandaloneMode) {
    return (
      <StandaloneFloorMESLayout
        scheduledTasks={scheduledTasks}
        orders={orders}
        productTypes={productTypes}
        processProgressMap={processProgressMap}
        currentUser={currentUser}
        approvedOperators={approvedOperators}
        onUpdateProgress={handleUpdateProgress}
        onLogout={() => handleLogout()}
        onSwitchToAdmin={isAdminOrManager ? () => setIsFloorStandaloneMode(false) : undefined}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F0F6F9] dark:bg-[#090d16] text-[#0F172A] dark:text-slate-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        inProgressCount={(Object.values(orders) as Order[]).filter((o) => !o.archived && o.status !== 'COMPLETED').length}
        completedCount={(Object.values(orders) as Order[]).filter((o) => !o.archived && o.status === 'COMPLETED').length}
        archivedCount={(Object.values(orders) as Order[]).filter((o) => o.archived).length}
        scheduledTasks={scheduledTasks}
        operatorCount={approvedOperators.length}
        currentUser={currentUser}
        onLogout={() => handleLogout()}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
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
        <div className={`flex-1 flex flex-col min-w-0 min-h-0 w-full ${activeTab === 'calendar' || activeTab === 'timeline' ? 'overflow-hidden p-0' : 'overflow-y-auto p-4 space-y-4'}`}>
          <ErrorBoundary
            fallbackTitle="선택하신 화면을 불러오는 중 오류가 발생했습니다."
            onReset={() => setActiveTab(effectivePerms.primaryMenu || 'dashboard')}
          >
            {/* RBAC Route Guard Screen */}
            {!effectivePerms.allowedMenus.includes(activeTab as MenuId) ? (
              <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center my-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 mb-4 shadow-2xs">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  메뉴 접근 권한 제한
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  현재 계정(<strong className="text-slate-700 dark:text-slate-200">{currentUser?.name || '사용자'}</strong> / {currentUser?.department || '현장담당자'})에게는 <strong className="text-blue-600 dark:text-blue-400">[{MENU_LABELS[activeTab] || activeTab}]</strong> 메뉴에 대한 접근 권한이 부여되지 않았습니다.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab(effectivePerms.primaryMenu || 'dashboard')}
                    className="px-4 py-2.5 bg-[#0066FF] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>기본 허용 메뉴로 이동 ({MENU_LABELS[effectivePerms.primaryMenu] || '대시보드'})</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* TAB: GOOGLE CALENDAR-STYLE PRODUCTION CALENDAR (PRIMARY / DEFAULT) */}
                {activeTab === 'calendar' && (
                  <ProductionCalendarView
                    scheduledTasks={scheduledTasks}
                    orders={orders}
                    processProgressMap={processProgressMap}
                    onUpdateProgress={handleUpdateProgress}
                    currentUser={currentUser}
                    approvedOperators={approvedOperators}
                    onNavigateToOrderForm={() => handleSelectTab('order-form')}
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
                    onNavigateToOrderForm={() => handleSelectTab('order-form')}
                    onNavigateToOrderMaster={() => handleSelectTab('order-master')}
                    onNavigateToTimeline={() => handleSelectTab('timeline')}
                    onNavigateToExecution={() => handleSelectTab('execution')}
                    onNavigateToArchive={() => handleSelectTab('archive')}
                    onNavigateToEquipment={() => handleSelectTab('equipment')}
                    onNavigateToCalendar={() => handleSelectTab('calendar')}
                    onUpdateProgress={handleUpdateProgress}
                    approvedOperators={approvedOperators}
                    currentUser={currentUser}
                  />
                )}

                {/* TAB: NEW ORDER CREATION */}
                {activeTab === 'order-form' && (
                  <OrderForm
                    productTypes={productTypes}
                    orders={orders}
                    currentUser={currentUser}
                    scheduledTasks={scheduledTasks}
                    processProgressMap={processProgressMap}
                    onCreateOrder={handleCreateOrder}
                    onOpenNewTypeModal={() => setIsNewTypeModalOpen(true)}
                    onOpenCopyTypeModal={() => setIsCopyTypeModalOpen(true)}
                    onOrderCreatedSuccess={() => handleSelectTab('order-master')}
                    pendingCopyOrder={pendingCopyOrder}
                    onClearPendingCopyOrder={() => setPendingCopyOrder(null)}
                    approvedOperators={approvedOperators}
                    usersList={usersList}
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
                    onNavigateToOrderForm={() => handleSelectTab('order-form')}
                    onCopyOrderToNew={handleCopyOrderToNew}
                    currentUser={currentUser}
                    approvedOperators={approvedOperators}
                    usersList={usersList}
                  />
                )}

                {/* TAB: GANTT CHART TIMELINE */}
                {activeTab === 'timeline' && (
                  <GanttChart
                    items={scheduledTasks}
                    scheduledTasks={scheduledTasks}
                    filteredTasks={filteredScheduledTasks}
                    orders={orders}
                    minStart={minStart}
                    maxEnd={maxEnd}
                    filterOptions={filterOptions}
                    setFilterOptions={setFilterOptions}
                    onSelectItem={(item) => setSelectedTaskKey(item.processKey)}
                    onSelectTask={(key) => setSelectedTaskKey(key)}
                    selectedItemKey={selectedTaskKey}
                    onUpdateProgress={handleUpdateProgress}
                    currentUser={currentUser}
                    approvedOperators={approvedOperators}
                  />
                )}

                {/* TAB: FLOOR MES TERMINAL */}
                {activeTab === 'execution' && (
                  <FloorExecutionView
                    items={scheduledTasks}
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
                    orders={orders}
                    currentUser={currentUser}
                    onSaveNewProductType={handleSaveNewProductType}
                    onUpdateProductType={handleUpdateProductType}
                    onDeleteProductType={handleDeleteProductType}
                    onOpenNewTypeModal={() => setIsNewTypeModalOpen(true)}
                    onOpenCopyTypeModal={() => setIsCopyTypeModalOpen(true)}
                  />
                )}

                {/* TAB: EQUIPMENT & PERSONNEL OEE MONITOR */}
                {activeTab === 'equipment' && (
                  <EquipmentView
                    items={scheduledTasks}
                    scheduledTasks={scheduledTasks}
                    orders={orders}
                    approvedOperators={approvedOperators}
                    currentUser={currentUser}
                    usersList={usersList}
                  />
                )}

                {/* TAB: QUALITY INSPECTION & CMM DASHBOARD */}
                {activeTab === 'quality' && (
                  <QualityInspectionView
                    orders={orders}
                    scheduledTasks={scheduledTasks}
                    currentUser={currentUser}
                    approvedOperators={approvedOperators}
                    usersList={usersList}
                  />
                )}

                {/* TAB: ARCHIVE MASTER VAULT (완료 수주 보관함) */}
                {activeTab === 'archive' && (
                  <ArchiveView
                    orders={orders}
                    productTypes={productTypes}
                    scheduledTasks={scheduledTasks}
                    processProgressMap={processProgressMap}
                    onRestoreOrder={handleRestoreOrder}
                    onCopyOrderToNew={handleCopyOrderToNew}
                    onNavigateToOrderMaster={() => handleSelectTab('order-master')}
                  />
                )}
              </>
            )}
          </ErrorBoundary>
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
        onSaveType={handleCreateNewProductTypeFromModal}
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
