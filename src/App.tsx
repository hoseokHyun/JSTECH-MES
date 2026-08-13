import React, { useState, useEffect, useMemo } from 'react';
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
  resetFirestoreData,
  logoutUserAccount
} from './lib/firebase';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { OrderForm } from './components/OrderForm';
import { GanttChart } from './components/GanttChart';
import { ProcessDetailModal } from './components/ProcessDetailModal';
import { FloorExecutionView } from './components/FloorExecutionView';
import { ProductRoutingView } from './components/ProductRoutingView';
import { EquipmentView } from './components/EquipmentView';
import { ArchiveView } from './components/ArchiveView';
import { QualityInspectionView } from './components/QualityInspectionView';
import { LoginScreen } from './components/LoginScreen';
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
const STORAGE_KEY_USER = 'junsung_mes_user_v2';

export default function App() {
  // 1. Navigation Tab State
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

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (!saved || saved === 'null' || saved === 'undefined') return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

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

  // Compute approvedOperators list combining registered approved field operators (role === 'USER') and defaults
  const approvedOperators = useMemo(() => {
    const registeredApproved = usersList
      .filter((u) => u.isApproved && u.role !== 'ADMIN')
      .map((u) => u.name);
    const defaults = Array.from({ length: 20 }, (_, i) => `담당자 ${i + 1}`);
    return Array.from(new Set([...registeredApproved, ...defaults]));
  }, [usersList]);

  // 3. Selection & Modal States
  const [selectedTaskKey, setSelectedTaskKey] = useState<string | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUserApprovalModalOpen, setIsUserApprovalModalOpen] = useState(false);
  const [isNewTypeModalOpen, setIsNewTypeModalOpen] = useState(false);
  const [isCopyTypeModalOpen, setIsCopyTypeModalOpen] = useState(false);

  // 4. Filters State
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    category: 'ALL',
    completionStatus: 'ALL',
    searchQuery: '',
    selectedWorker: 'ALL',
  });

  // Save to LocalStorage
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

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    } catch (e) {
      console.error('Failed to save user', e);
    }
  }, [currentUser]);

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
        ...(overrideProcesses ? { customProcesses: overrideProcesses } : {}),
        ...(overrideQty ? { qty: overrideQty } : {}),
        status: forceComplete ? 'COMPLETED' : 'IN_PROGRESS',
        archived: overrideArchived !== undefined ? overrideArchived : (ord.archived || false),
      };
      saveOrderToFirestore(updatedOrder);

      return {
        ...prev,
        [orderId]: updatedOrder,
      };
    });
  };

  const handleToggleProcessComplete = (
    processKey: string,
    workerOverride?: string,
    machineOverride?: string
  ) => {
    const existing = processProgressMap[processKey] || {
      isCompleted: false,
      worker: '',
      machine: '',
    };
    const nowCompleted = !existing.isCompleted;
    const newProgress = {
      isCompleted: nowCompleted,
      completedAt: nowCompleted
        ? new Date().toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : undefined,
      worker: workerOverride !== undefined ? workerOverride : existing.worker,
      machine: machineOverride !== undefined ? machineOverride : existing.machine,
    };

    setProcessProgressMap((prev) => ({
      ...prev,
      [processKey]: newProgress,
    }));
    saveProcessProgressToFirestore(processKey, newProgress);

    // Sync order status if cancelling a completed order's process
    const matchingOrderId = Object.keys(orders).find((id) => processKey.startsWith(`${id}_`));
    if (matchingOrderId) {
      const targetOrder = orders[matchingOrderId];
      if (targetOrder) {
        if (!nowCompleted && (targetOrder.status === 'COMPLETED' || targetOrder.archived)) {
          const updatedOrder: Order = {
            ...targetOrder,
            status: 'IN_PROGRESS',
            archived: false,
          };
          setOrders((prev) => ({
            ...prev,
            [matchingOrderId]: updatedOrder,
          }));
          saveOrderToFirestore(updatedOrder);
        }
      }
    }
  };

  const handleUpdateAssignee = (
    processKey: string,
    worker: string,
    machine: string
  ) => {
    const existing = processProgressMap[processKey] || { isCompleted: false };
    const updatedProgress = {
      ...existing,
      worker,
      machine,
    };

    setProcessProgressMap((prev) => ({
      ...prev,
      [processKey]: updatedProgress,
    }));
    saveProcessProgressToFirestore(processKey, updatedProgress);
  };

  const handleSaveNewProductType = (
    typeName: string,
    processes: { name: string; category: ProcessCategory; durationHours: number }[]
  ) => {
    const newTypeId = `TYPE_CUSTOM_${Date.now()}`;
    const newType: ProductType = {
      id: newTypeId,
      name: typeName,
      isReference: false,
      processes,
    };

    setProductTypes((prev) => ({
      ...prev,
      [newTypeId]: newType,
    }));
    saveProductTypeToFirestore(newType);
  };

  const handleCopyProductType = (
    sourceTypeId: string,
    newTypeName: string,
    selectedIndexes: number[]
  ) => {
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

  const handleResetData = () => {
    if (confirm('초기 데모 수주 데이터로 전체 리셋하시겠습니까? 클라우드 및 기존 변경사항이 초기화됩니다.')) {
      setOrders(INITIAL_ORDERS);
      setProductTypes(DEFAULT_PRODUCT_TYPES);
      setProcessProgressMap(INITIAL_PROCESS_PROGRESS);
      localStorage.removeItem(STORAGE_KEY_ORDERS);
      localStorage.removeItem(STORAGE_KEY_TYPES);
      localStorage.removeItem(STORAGE_KEY_PROGRESS);
      setSelectedTaskKey(null);
      resetFirestoreData();
    }
  };

  const handleLogout = async () => {
    await logoutUserAccount();
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  // Enforce Login before accessing the Dashboard and Scheduler
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F0F6F9] text-[#0F172A] overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        inProgressCount={(Object.values(orders) as Order[]).filter((o) => !o.archived && o.status !== 'COMPLETED').length}
        completedCount={(Object.values(orders) as Order[]).filter((o) => !o.archived && o.status === 'COMPLETED').length}
        archivedCount={(Object.values(orders) as Order[]).filter((o) => o.archived).length}
        scheduledTasks={scheduledTasks}
        operatorCount={approvedOperators.length}
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
          onLogout={handleLogout}
        />

        {/* Content View Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: EXECUTIVE DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              {/* Executive Summary Metrics & Orders List */}
              <ExecutiveSummary
                orders={orders}
                productTypes={productTypes}
                scheduledTasks={scheduledTasks}
                filterOptions={filterOptions}
                setFilterOptions={setFilterOptions}
                onDeleteOrder={handleDeleteOrder}
                onArchiveOrder={handleArchiveOrder}
                onUpdateOrder={handleUpdateOrder}
                onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
                onCompleteAllOrderProcesses={handleCompleteAllOrderProcesses}
              />

              {/* MCT Machine & Worker Monitoring Status Board */}
              <EquipmentView
                items={scheduledTasks}
                orders={orders}
                approvedOperators={approvedOperators}
              />
            </>
          )}

          {/* TAB: NEW ORDER REGISTRATION */}
          {activeTab === 'order-form' && (
            <OrderForm
              productTypes={productTypes}
              orders={orders}
              approvedOperators={approvedOperators}
              onCreateOrder={handleCreateOrder}
            />
          )}

          {/* TAB: PROCESS TIMELINE GANTT CHART */}
          {activeTab === 'timeline' && (
            <>
              <GanttChart
                items={filteredScheduledTasks}
                itemsMap={taskMap}
                minStart={minStart}
                maxEnd={maxEnd}
                totalWorkingHours={totalWorkingHours}
                onSelectItem={(item) => setSelectedTaskKey(item.processKey)}
                selectedItemKey={selectedTaskKey}
                orders={orders}
              />

              {/* Sticky Process Control Modal for Selected Task */}
              {selectedTaskItem && (
                <ProcessDetailModal
                  selectedItem={selectedTaskItem}
                  currentUser={currentUser}
                  approvedOperators={approvedOperators}
                  onClose={() => setSelectedTaskKey(null)}
                  onUpdateAssignee={(worker, machine) =>
                    handleUpdateAssignee(selectedTaskItem.processKey, worker, machine)
                  }
                  onToggleComplete={() =>
                    handleToggleProcessComplete(
                      selectedTaskItem.processKey,
                      selectedTaskItem.worker,
                      selectedTaskItem.machine
                    )
                  }
                />
              )}
            </>
          )}

          {/* TAB 2: SHOP FLOOR EXECUTION TERMINAL */}
          {(activeTab === 'floor' || activeTab === 'execution') && (
            <FloorExecutionView
              items={scheduledTasks}
              processProgressMap={processProgressMap}
              currentUser={currentUser}
              approvedOperators={approvedOperators}
              onToggleComplete={handleToggleProcessComplete}
              onUpdateAssignee={handleUpdateAssignee}
            />
          )}

          {/* TAB 3: PRODUCT ROUTING & BOP MASTER */}
          {activeTab === 'routing' && (
            <ProductRoutingView
              productTypes={productTypes}
              currentUser={currentUser}
              onUpdateProductType={handleUpdateProductType}
              onOpenNewTypeModal={() => setIsNewTypeModalOpen(true)}
              onOpenCopyTypeModal={() => setIsCopyTypeModalOpen(true)}
            />
          )}

          {/* TAB 4: EQUIPMENT & PERSONNEL OEE MONITOR */}
          {activeTab === 'equipment' && (
            <EquipmentView
              items={scheduledTasks}
              orders={orders}
              approvedOperators={approvedOperators}
            />
          )}

          {/* TAB: QUALITY INSPECTION & CMM DASHBOARD */}
          {activeTab === 'quality' && <QualityInspectionView />}

          {/* TAB 5: ARCHIVE MASTER VAULT */}
          {activeTab === 'archive' && (
            <ArchiveView
              orders={orders}
              productTypes={productTypes}
              onRestoreOrder={handleRestoreOrder}
            />
          )}
        </div>
      </div>

      {/* Global Modals */}
      <ArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        orders={orders}
        productTypes={productTypes}
        onRestoreOrder={handleRestoreOrder}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
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
    </div>
  );
}
