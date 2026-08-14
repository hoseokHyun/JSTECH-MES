import { Order, ProductType, ProcessProgressMap, ScheduledTaskItem, ChartDisplayMode, ChartStatusFilter } from '../types';
import { addWorkingHours, MCT_MACHINES, GRINDER_MACHINES, CMM_MACHINES } from '../data/defaultData';

export interface ScheduleCalculationResult {
  scheduledTasks: ScheduledTaskItem[];
  taskMap: Map<number, ScheduledTaskItem>;
  minStart: Date | null;
  maxEnd: Date | null;
  totalWorkingHours: number;
  completedTasksCount: number;
  totalTasksCount: number;
}

/** Helper to resolve machine name based on process category and specified settings */
function resolveMachineName(
  pInfoMachine: string | undefined,
  pStepMachine: string | undefined,
  category: string,
  ordMctMachine: string | undefined,
  pIdx: number
): string {
  if (pInfoMachine && pInfoMachine.trim() !== '') return pInfoMachine;
  if (pStepMachine && pStepMachine.trim() !== '') return pStepMachine;

  if (category === '가공') {
    return ordMctMachine && ordMctMachine.trim() !== ''
      ? ordMctMachine
      : (MCT_MACHINES[pIdx % MCT_MACHINES.length] || MCT_MACHINES[0]);
  } else if (category === '연마') {
    return GRINDER_MACHINES[pIdx % GRINDER_MACHINES.length] || GRINDER_MACHINES[0];
  } else if (category === '품질') {
    return CMM_MACHINES[pIdx % CMM_MACHINES.length] || CMM_MACHINES[0];
  } else if (category === '외주') {
    return '(외주/협력사)';
  }

  return ordMctMachine || '(미지정)';
}

export function calculateSchedule(
  orders: Record<string, Order>,
  productTypes: Record<string, ProductType>,
  processProgressMap: ProcessProgressMap,
  activeOrderId: string | null = null,
  displayMode: ChartDisplayMode = 'ALL',
  statusFilter: ChartStatusFilter = 'ALL'
): ScheduleCalculationResult {
  let targetOrders = Object.values(orders).filter(o => !o.archived);

  if (displayMode === 'SELECTED' && activeOrderId && orders[activeOrderId]) {
    targetOrders = targetOrders.filter(o => o.id === activeOrderId);
  }

  if (statusFilter === 'IN_PROGRESS_ONLY') {
    targetOrders = targetOrders.filter(o => o.status !== 'COMPLETED');
  } else if (statusFilter === 'COMPLETED_ONLY') {
    targetOrders = targetOrders.filter(o => o.status === 'COMPLETED');
  }

  const items: ScheduledTaskItem[] = [];
  const itemsMap = new Map<number, ScheduledTaskItem>();

  let minStart: Date | null = null;
  let maxEnd: Date | null = null;
  let totalWorkingHours = 0;
  let completedTasksCount = 0;
  let totalTasksCount = 0;
  let itemGlobalCounter = 1;

  targetOrders.forEach((ord) => {
    const type = productTypes[ord.typeId];
    const baseProcesses = (ord.customProcesses && ord.customProcesses.length > 0)
      ? ord.customProcesses
      : (type ? type.processes : []);

    if (!baseProcesses || baseProcesses.length === 0) return;

    const qty = Math.max(1, parseInt(String(ord.qty)) || 1);
    const strategy = ord.strategy || 'SERIAL';
    const ordStart = new Date(ord.startDate || Date.now());

    if (strategy === 'SERIAL') {
      let currentProductStart = new Date(ordStart);

      for (let q = 1; q <= qty; q++) {
        let currentPointer = new Date(currentProductStart);

        baseProcesses.forEach((p, pIdx) => {
          let pStart = new Date(currentPointer);
          let pEnd = addWorkingHours(pStart, p.durationHours);

          const processKey = `${ord.id}_Q${q}_P${pIdx}`;
          const pInfo = processProgressMap[processKey] || {};
          const isExplicit = pInfo.isCompleted !== undefined || pInfo.completed !== undefined;
          const isDone = isExplicit
            ? Boolean(pInfo.isCompleted || pInfo.completed)
            : Boolean(ord.status === 'COMPLETED' || ord.archived);

          if (isDone) completedTasksCount++;
          totalTasksCount++;

          // Resolve Execution Status
          let taskStatus: import('../types').TaskExecutionStatus = 'READY';
          if (isDone) {
            taskStatus = 'COMPLETED';
          } else if (pInfo.status === 'PAUSED') {
            taskStatus = 'PAUSED';
          } else if (pInfo.status === 'IN_PROGRESS' || (pInfo.actualStart && !pInfo.actualEnd)) {
            taskStatus = 'IN_PROGRESS';
          } else if (Date.now() > pEnd.getTime()) {
            taskStatus = 'DELAYED';
          } else if (Date.now() >= pStart.getTime()) {
            taskStatus = 'PLANNED';
          } else {
            taskStatus = 'READY';
          }

          const plannedMins = Math.round(p.durationHours * 60);

          const itemId = itemGlobalCounter++;
          const itemData: ScheduledTaskItem = {
            id: itemId,
            processKey,
            orderId: ord.id,
            groupKey: `G_${ord.id}_P${pIdx}`,
            groupName: `${pIdx + 1}. ${p.name}`,
            content: `${isDone ? '✓ ' : ''}#${q} ${p.name}`,
            title: `#${q} ${p.name} (${p.durationHours}시간)`,
            start: pStart,
            end: pEnd,
            category: p.category,
            duration: p.durationHours,
            plannedMinutes: plannedMins,
            productNo: q,
            orderName: ord.name,
            plannedStart: pStart,
            plannedEnd: pEnd,
            actualStart: pInfo.actualStart || null,
            actualEnd: pInfo.actualEnd || (isDone ? pInfo.completedAt || null : null),
            actualMinutes: pInfo.actualMinutes !== undefined ? pInfo.actualMinutes : null,
            status: taskStatus,
            isCompleted: isDone,
            completedAt: pInfo.completedAt || null,
            worker: pInfo.worker || '',
            machine: resolveMachineName(pInfo.machine, p.assignedMachine, p.category, ord.mctMachine, pIdx),
            processIndex: pIdx,
            totalProcessesInOrder: baseProcesses.length,
            pauseHistory: pInfo.pauseHistory || [],
            pauseReason: pInfo.pauseReason,
            delayMinutes: pInfo.delayMinutes,
            delayReason: pInfo.delayReason,
            memo: pInfo.memo,
          };

          items.push(itemData);
          itemsMap.set(itemId, itemData);

          currentPointer = pEnd;
          totalWorkingHours += p.durationHours;

          if (!minStart || pStart < minStart) minStart = pStart;
          if (!maxEnd || pEnd > maxEnd) maxEnd = pEnd;
        });

        currentProductStart = new Date(currentPointer);
      }
    } else {
      // CONTINUOUS production strategy
      let lastProcEndTimes = new Array(baseProcesses.length).fill(null);

      for (let q = 1; q <= qty; q++) {
        baseProcesses.forEach((p, pIdx) => {
          let pStart: Date;

          if (q === 1) {
            pStart = (pIdx === 0) ? new Date(ordStart) : new Date(lastProcEndTimes[pIdx - 1]);
          } else {
            let prevProcessEnd = (pIdx === 0) ? ordStart : lastProcEndTimes[pIdx - 1];
            let sameProcessPrevItemEnd = lastProcEndTimes[pIdx];

            pStart = new Date(Math.max(prevProcessEnd.getTime(), sameProcessPrevItemEnd.getTime()));
          }

          let pEnd = addWorkingHours(pStart, p.durationHours);
          lastProcEndTimes[pIdx] = pEnd;

          const processKey = `${ord.id}_Q${q}_P${pIdx}`;
          const pInfo = processProgressMap[processKey] || {};
          const isExplicit = pInfo.isCompleted !== undefined || pInfo.completed !== undefined;
          const isDone = isExplicit
            ? Boolean(pInfo.isCompleted || pInfo.completed)
            : Boolean(ord.status === 'COMPLETED' || ord.archived);

          if (isDone) completedTasksCount++;
          totalTasksCount++;

          // Resolve Execution Status
          let taskStatus: import('../types').TaskExecutionStatus = 'READY';
          if (isDone) {
            taskStatus = 'COMPLETED';
          } else if (pInfo.status === 'PAUSED') {
            taskStatus = 'PAUSED';
          } else if (pInfo.status === 'IN_PROGRESS' || (pInfo.actualStart && !pInfo.actualEnd)) {
            taskStatus = 'IN_PROGRESS';
          } else if (Date.now() > pEnd.getTime()) {
            taskStatus = 'DELAYED';
          } else if (Date.now() >= pStart.getTime()) {
            taskStatus = 'PLANNED';
          } else {
            taskStatus = 'READY';
          }

          const plannedMins = Math.round(p.durationHours * 60);

          const itemId = itemGlobalCounter++;
          const itemData: ScheduledTaskItem = {
            id: itemId,
            processKey,
            orderId: ord.id,
            groupKey: `G_${ord.id}_P${pIdx}`,
            groupName: `${pIdx + 1}. ${p.name}`,
            content: `${isDone ? '✓ ' : ''}#${q} ${p.name}`,
            title: `#${q} ${p.name} (${p.durationHours}시간)`,
            start: pStart,
            end: pEnd,
            category: p.category,
            duration: p.durationHours,
            plannedMinutes: plannedMins,
            productNo: q,
            orderName: ord.name,
            plannedStart: pStart,
            plannedEnd: pEnd,
            actualStart: pInfo.actualStart || null,
            actualEnd: pInfo.actualEnd || (isDone ? pInfo.completedAt || null : null),
            actualMinutes: pInfo.actualMinutes !== undefined ? pInfo.actualMinutes : null,
            status: taskStatus,
            isCompleted: isDone,
            completedAt: pInfo.completedAt || null,
            worker: pInfo.worker || '',
            machine: resolveMachineName(pInfo.machine, p.assignedMachine, p.category, ord.mctMachine, pIdx),
            processIndex: pIdx,
            totalProcessesInOrder: baseProcesses.length,
            pauseHistory: pInfo.pauseHistory || [],
            pauseReason: pInfo.pauseReason,
            delayMinutes: pInfo.delayMinutes,
            delayReason: pInfo.delayReason,
            memo: pInfo.memo,
          };

          items.push(itemData);
          itemsMap.set(itemId, itemData);

          totalWorkingHours += p.durationHours;

          if (!minStart || pStart < minStart) minStart = pStart;
          if (!maxEnd || pEnd > maxEnd) maxEnd = pEnd;
        });
      }
    }
  });

  return {
    scheduledTasks: items,
    taskMap: itemsMap,
    minStart,
    maxEnd,
    totalWorkingHours,
    completedTasksCount,
    totalTasksCount,
  };
}
