import { Order, ProductType, ProcessProgressMap, ScheduledTaskItem, ChartDisplayMode, ChartStatusFilter } from '../types';
import { addWorkingHours, getNextWorkingTime, MCT_MACHINES, GRINDER_MACHINES, CMM_MACHINES } from '../data/defaultData';
import { getStepDependencies } from './trackDependencyHelper';

export interface ResourceConflictWarning {
  task1: string;
  task2: string;
  resource: string;
  resourceType: 'MACHINE' | 'WORKER';
  startTime: Date;
  endTime: Date;
  orderName: string;
}

export interface ScheduleCalculationResult {
  scheduledTasks: ScheduledTaskItem[];
  taskMap: Map<number, ScheduledTaskItem>;
  minStart: Date | null;
  maxEnd: Date | null;
  totalWorkingHours: number;
  completedTasksCount: number;
  totalTasksCount: number;
  resourceConflicts?: ResourceConflictWarning[];
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
  const resourceConflicts: ResourceConflictWarning[] = [];

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

    // Compute step dependency graph (supports multi-track parallel & assembly merge)
    const depMap = getStepDependencies(baseProcesses);

    if (strategy === 'SERIAL') {
      let currentUnitStart = getNextWorkingTime(ordStart);

      for (let q = 1; q <= qty; q++) {
        // Track the end times of each step within this unit
        const unitStepEndTimes: Date[] = new Array(baseProcesses.length);

        baseProcesses.forEach((p, pIdx) => {
          const depIndices = depMap.get(pIdx) || [];
          let pStart: Date;

          if (depIndices.length === 0) {
            // Independent root step of a track (e.g. Base, Head, Block, Pipe)
            // Starts in parallel immediately when unit starts!
            pStart = getNextWorkingTime(currentUnitStart);
          } else {
            // Must wait for all required predecessor steps in this unit to finish
            const maxDepEnd = Math.max(...depIndices.map((dIdx) => unitStepEndTimes[dIdx].getTime()));
            pStart = getNextWorkingTime(new Date(maxDepEnd));
          }

          const pEnd = addWorkingHours(pStart, p.durationHours);
          unitStepEndTimes[pIdx] = pEnd;

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
          const resolvedWorker = (pInfo.worker && pInfo.worker.trim())
            ? pInfo.worker.trim()
            : ((p.assignedWorker || p.worker || '').trim());
          const resolvedMachine = resolveMachineName(pInfo.machine, p.assignedMachine, p.category, ord.mctMachine, pIdx);

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
            worker: resolvedWorker,
            machine: resolvedMachine,
            processIndex: pIdx,
            totalProcessesInOrder: baseProcesses.length,
            componentTag: p.componentTag || '',
            pauseHistory: pInfo.pauseHistory || [],
            pauseReason: pInfo.pauseReason,
            delayMinutes: pInfo.delayMinutes,
            delayReason: pInfo.delayReason,
            memo: pInfo.memo,
            andonStatus: pInfo.andonStatus || 'NORMAL',
            andonIssueType: pInfo.andonIssueType,
            andonIssueNote: pInfo.andonIssueNote,
            andonReportedAt: pInfo.andonReportedAt,
            andonReportedBy: pInfo.andonReportedBy,
            andonHistory: pInfo.andonHistory || [],
          };

          items.push(itemData);
          itemsMap.set(itemId, itemData);

          totalWorkingHours += p.durationHours;

          if (!minStart || pStart < minStart) minStart = pStart;
          if (!maxEnd || pEnd > maxEnd) maxEnd = pEnd;
        });

        // The next serial unit starts after ALL steps of this unit are completed (critical path finish)
        const unitMaxEnd = Math.max(...unitStepEndTimes.map((d) => d.getTime()));
        currentUnitStart = new Date(unitMaxEnd);
      }
    } else {
      // CONTINUOUS production strategy
      let prevUnitStepEndTimes: Date[] = new Array(baseProcesses.length).fill(null);

      for (let q = 1; q <= qty; q++) {
        const currentUnitStepEndTimes: Date[] = new Array(baseProcesses.length);

        baseProcesses.forEach((p, pIdx) => {
          const depIndices = depMap.get(pIdx) || [];
          let pStart: Date;

          if (q === 1) {
            if (depIndices.length === 0) {
              pStart = getNextWorkingTime(ordStart);
            } else {
              const maxDepEnd = Math.max(...depIndices.map((dIdx) => currentUnitStepEndTimes[dIdx].getTime()));
              pStart = getNextWorkingTime(new Date(maxDepEnd));
            }
          } else {
            // Unit q > 1: Must wait for current unit's predecessors AND the previous unit's step to release the station
            let earliestTime = prevUnitStepEndTimes[pIdx] ? prevUnitStepEndTimes[pIdx].getTime() : ordStart.getTime();

            if (depIndices.length > 0) {
              const maxDepEnd = Math.max(...depIndices.map((dIdx) => currentUnitStepEndTimes[dIdx].getTime()));
              earliestTime = Math.max(earliestTime, maxDepEnd);
            }

            pStart = getNextWorkingTime(new Date(earliestTime));
          }

          const pEnd = addWorkingHours(pStart, p.durationHours);
          currentUnitStepEndTimes[pIdx] = pEnd;

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
          const resolvedWorker = (pInfo.worker && pInfo.worker.trim())
            ? pInfo.worker.trim()
            : ((p.assignedWorker || p.worker || '').trim());
          const resolvedMachine = resolveMachineName(pInfo.machine, p.assignedMachine, p.category, ord.mctMachine, pIdx);

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
            worker: resolvedWorker,
            machine: resolvedMachine,
            processIndex: pIdx,
            totalProcessesInOrder: baseProcesses.length,
            componentTag: p.componentTag || '',
            pauseHistory: pInfo.pauseHistory || [],
            pauseReason: pInfo.pauseReason,
            delayMinutes: pInfo.delayMinutes,
            delayReason: pInfo.delayReason,
            memo: pInfo.memo,
            andonStatus: pInfo.andonStatus || 'NORMAL',
            andonIssueType: pInfo.andonIssueType,
            andonIssueNote: pInfo.andonIssueNote,
            andonReportedAt: pInfo.andonReportedAt,
            andonReportedBy: pInfo.andonReportedBy,
            andonHistory: pInfo.andonHistory || [],
          };

          items.push(itemData);
          itemsMap.set(itemId, itemData);

          totalWorkingHours += p.durationHours;

          if (!minStart || pStart < minStart) minStart = pStart;
          if (!maxEnd || pEnd > maxEnd) maxEnd = pEnd;
        });

        prevUnitStepEndTimes = currentUnitStepEndTimes;
      }
    }
  });

  // Check for resource overlaps in parallel operations within active tasks
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const t1 = items[i];
      const t2 = items[j];

      if (t1.orderId !== t2.orderId) continue; // check within the order
      if (t1.isCompleted || t2.isCompleted) continue;

      const overlap = t1.start < t2.end && t2.start < t1.end;
      if (!overlap) continue;

      // Check machine conflict
      if (
        t1.machine &&
        t2.machine &&
        t1.machine === t2.machine &&
        !t1.machine.includes('외주') &&
        !t1.machine.includes('미지정')
      ) {
        resourceConflicts.push({
          task1: t1.title,
          task2: t2.title,
          resource: t1.machine,
          resourceType: 'MACHINE',
          startTime: new Date(Math.max(t1.start.getTime(), t2.start.getTime())),
          endTime: new Date(Math.min(t1.end.getTime(), t2.end.getTime())),
          orderName: t1.orderName
        });
      }

      // Check worker conflict
      if (
        t1.worker &&
        t2.worker &&
        t1.worker === t2.worker &&
        !t1.worker.includes('미지정')
      ) {
        resourceConflicts.push({
          task1: t1.title,
          task2: t2.title,
          resource: t1.worker,
          resourceType: 'WORKER',
          startTime: new Date(Math.max(t1.start.getTime(), t2.start.getTime())),
          endTime: new Date(Math.min(t1.end.getTime(), t2.end.getTime())),
          orderName: t1.orderName
        });
      }
    }
  }

  return {
    scheduledTasks: items,
    taskMap: itemsMap,
    minStart,
    maxEnd,
    totalWorkingHours,
    completedTasksCount,
    totalTasksCount,
    resourceConflicts,
  };
}
