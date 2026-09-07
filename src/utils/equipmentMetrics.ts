import { ScheduledTaskItem, ProcessProgressMap, Order } from '../types';
import { InspectionItem, ShippingProjectItem } from '../types/quality';
import { ALL_EQUIPMENT_LIST, MCT_MACHINES, GRINDER_MACHINES, CMM_MACHINES } from '../data/defaultData';

export type EquipmentMetricMode =
  | 'AVAILABILITY_ONLY'            // 1. 가동률만
  | 'AVAILABILITY_PERFORMANCE'     // 2. 가동률 + 성능률 (기본값)
  | 'FULL_OEE';                    // 3. 가동률 + 성능률 + 양품률 (통합 OEE)

export interface MachineMetricItem {
  machineName: string;
  category: 'MCT' | 'GRINDER' | 'CMM';
  status: 'RUNNING' | 'PAUSED' | 'IDLE';
  activeTaskCount: number;
  completedTaskCount: number;
  // 1. 가동률 (Availability Rate)
  availabilityRate: number; // 100% (가동) or 0% (대기/정지)
  // 2. 성능률 (Performance Rate)
  planHoursSum: number;
  actualHoursSum: number;
  performanceRate: number; // 0 ~ 100% (capped at 100%)
  // 3. 양품률 (Quality Rate)
  confirmedGood: number;
  confirmedDefect: number;
  pendingInspection: number;
  qualityRate: number | null; // null represents "검사 대기(표본 없음)"
  // 4. 통합 OEE (Overall Equipment Effectiveness)
  integratedOee: number | null;
}

export interface LineMetricsSummary {
  metricMode: EquipmentMetricMode;
  totalMachines: number;
  runningCount: number;
  pausedCount: number;
  idleCount: number;
  lineAvailabilityRate: number;       // 전체 라인 가동률 (%)
  linePerformanceRate: number;        // 전체 라인 평균 성능률 (%)
  lineQualityRate: number | null;     // 전체 라인 평균 양품률 (%) 또는 null
  lineIntegratedOee: number | null;   // 전체 라인 통합 OEE (%) 또는 null
  totalConfirmedGood: number;
  totalConfirmedDefect: number;
  totalPendingInspection: number;
  machineMetrics: Record<string, MachineMetricItem>;
}

const SETTINGS_STORAGE_KEY = 'mes_equipment_metric_mode_v1';

export function getSavedMetricMode(): EquipmentMetricMode {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved === 'AVAILABILITY_ONLY' || saved === 'AVAILABILITY_PERFORMANCE' || saved === 'FULL_OEE') {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to read metric mode from localStorage', e);
  }
  return 'AVAILABILITY_PERFORMANCE'; // default
}

export function saveMetricModeToStorage(mode: EquipmentMetricMode): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, mode);
  } catch (e) {
    console.warn('Failed to save metric mode to localStorage', e);
  }
}

/**
 * 1. Calculate Equipment Availability (가동률)
 * - Equipment with active (non-completed, non-paused) tasks is RUNNING (100%).
 * - Equipment with tasks explicitly in PAUSED state is PAUSED (0%).
 * - Equipment with no active tasks is IDLE (0%).
 */
export function calculateAvailability(
  machineName: string,
  tasks: ScheduledTaskItem[]
): { status: 'RUNNING' | 'PAUSED' | 'IDLE'; availabilityRate: number; activeCount: number; completedCount: number } {
  const machineTasks = tasks.filter(t => t.machine === machineName);
  const completedCount = machineTasks.filter(t => t.isCompleted).length;
  const activeTasks = machineTasks.filter(t => !t.isCompleted);
  const activeCount = activeTasks.length;

  if (activeCount === 0) {
    return { status: 'IDLE', availabilityRate: 0, activeCount, completedCount };
  }

  const hasPaused = activeTasks.some(t => t.status === 'PAUSED');
  if (hasPaused) {
    return { status: 'PAUSED', availabilityRate: 0, activeCount, completedCount };
  }

  return { status: 'RUNNING', availabilityRate: 100, activeCount, completedCount };
}

/**
 * 2. Calculate Performance Rate (성능률)
 * 공식: 계획시간 합계 / 실제 소요시간 합계 (상한 100%)
 * 실제 소요시간이 계획보다 짧아 100%를 넘는 경우 100%로 상한 처리.
 */
export function calculatePerformance(
  machineName: string,
  tasks: ScheduledTaskItem[],
  processProgressMap: ProcessProgressMap = {}
): { planHoursSum: number; actualHoursSum: number; performanceRate: number } {
  const machineTasks = tasks.filter(t => t.machine === machineName);

  let planHoursSum = 0;
  let actualHoursSum = 0;

  for (const t of machineTasks) {
    const pInfo = processProgressMap[t.processKey] || {};
    const planned = t.duration || (t.plannedMinutes ? t.plannedMinutes / 60 : 0);

    let actual = 0;
    if (t.actualMinutes != null && t.actualMinutes > 0) {
      actual = t.actualMinutes / 60;
    } else if (t.actualStart && t.actualEnd) {
      actual = Math.max(0.1, (new Date(t.actualEnd).getTime() - new Date(t.actualStart).getTime()) / 3600000);
    } else if (t.isCompleted) {
      actual = planned; // On-schedule completion
    } else if (t.status === 'IN_PROGRESS' && t.actualStart) {
      const elapsedHours = Math.max(0.1, (Date.now() - new Date(t.actualStart).getTime()) / 3600000);
      actual = elapsedHours;
    }

    // Only aggregate tasks that have recorded actual work or are completed
    if (actual > 0) {
      planHoursSum += planned;
      actualHoursSum += actual;
    }
  }

  let performanceRate = 100.0;
  if (actualHoursSum > 0) {
    const rawRate = (planHoursSum / actualHoursSum) * 100;
    performanceRate = Math.min(100.0, Math.round(rawRate * 10) / 10);
  }

  return {
    planHoursSum: Math.round(planHoursSum * 10) / 10,
    actualHoursSum: Math.round(actualHoursSum * 10) / 10,
    performanceRate
  };
}

function isOrderMatched(orderIdA?: string, orderIdB?: string, nameA?: string, nameB?: string): boolean {
  if (!orderIdA || !orderIdB) return false;
  if (orderIdA === orderIdB) return true;
  const suffixA = orderIdA.split('-').pop();
  const suffixB = orderIdB.split('-').pop();
  if (suffixA && suffixB && suffixA === suffixB && suffixA.length >= 3) {
    return true;
  }
  if (nameA && nameB) {
    const cleanA = nameA.replace(/\s+/g, '');
    const cleanB = nameB.replace(/\s+/g, '');
    if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;
  }
  return false;
}

/**
 * 3. Calculate Quality Rate (양품률)
 * - 설비 단위로 집계.
 * - 확정 불량: IPQC 불량(FAIL) 즉시 확정, 또는 공정 진행 중 defectQty > 0, 또는 출하검사 REJECTED.
 * - 검사 대기: IPQC 통과했으나 출하검사 미완료(PENDING 또는 미등록) -> 분모/분자 제외!
 * - 확정 양품: 출하검사 APPROVED 통과.
 * 공식: 확정 양품 수 / (확정 양품 수 + 확정 불량 수)
 * 확정된 검사 결과가 없으면 null ("검사 대기(표본 없음)").
 */
export function calculateQuality(
  machineName: string,
  tasks: ScheduledTaskItem[],
  inspections: InspectionItem[],
  shippingProjects: ShippingProjectItem[],
  processProgressMap: ProcessProgressMap = {}
): { confirmedGood: number; confirmedDefect: number; pendingInspection: number; qualityRate: number | null } {
  let confirmedGood = 0;
  let confirmedDefect = 0;
  let pendingInspection = 0;

  const machineTasks = tasks.filter(t => t.machine === machineName);
  const relatedOrderIds = new Set<string>();
  const relatedOrderNames = new Set<string>();
  machineTasks.forEach(t => {
    if (t.orderId) relatedOrderIds.add(t.orderId);
    if (t.orderName) relatedOrderNames.add(t.orderName);
  });

  // 1. Direct defectQty from floor process executions on this machine
  for (const t of machineTasks) {
    const pInfo = processProgressMap[t.processKey] || {};
    if (pInfo.defectQty && pInfo.defectQty > 0) {
      confirmedDefect += pInfo.defectQty;
    }
  }

  // 2. Track processed orders quality for this machine
  const isCmmMachine = machineName.includes('CMM');

  // Set of evaluated orders for this machine to prevent double-counting between IPQC & Shipping
  const evaluatedOrderIds = new Set<string>();

  // A. Check IPQC Inspections
  inspections.forEach(insp => {
    let matchesMachine = false;
    if (isCmmMachine) {
      if (machineName.includes('덕인') && (insp.cmmDevice.includes('01') || insp.cmmDevice.includes('Zeiss') || insp.cmmDevice.includes('덕인'))) {
        matchesMachine = true;
      } else if (machineName.includes('Mitutoyo') && (insp.cmmDevice.includes('02') || insp.cmmDevice.includes('Mitutoyo'))) {
        matchesMachine = true;
      } else if (insp.cmmDevice.includes(machineName)) {
        matchesMachine = true;
      }
    } else {
      for (const ordId of relatedOrderIds) {
        if (isOrderMatched(ordId, insp.orderId, undefined, insp.productName)) {
          matchesMachine = true;
          break;
        }
      }
    }

    if (!matchesMachine) return;

    const orderKey = insp.orderId || insp.id;
    evaluatedOrderIds.add(orderKey);

    if (insp.result === 'FAIL') {
      // 1. 확정 불량: IPQC 불량 판정 시 즉시 확정 (출하검사를 기다리지 않음)
      confirmedDefect += 1;
    } else if (insp.result === 'PASS') {
      // Find shipping inspection status for this order
      const shp = insp.orderId ? shippingProjects.find(s => isOrderMatched(s.orderId, insp.orderId)) : null;
      if (!shp || shp.shippingStatus === 'PENDING') {
        // 2. 검사 대기: IPQC 통과했으나 출하검사가 아직 안 됨 -> 제외!
        pendingInspection += 1;
      } else if (shp.shippingStatus === 'APPROVED') {
        // 3. 확정 양품: 출하검사까지 통과
        confirmedGood += 1;
      } else if (shp.shippingStatus === 'REJECTED') {
        // 출하검사 불량 -> 확정 불량으로 전환
        confirmedDefect += 1;
      }
    } else {
      // REINSPECT 등
      pendingInspection += 1;
    }
  });

  // B. Also check Shipping projects for orders on this machine that didn't have explicit IPQC record
  shippingProjects.forEach(shp => {
    if (evaluatedOrderIds.has(shp.orderId)) return; // already evaluated via IPQC

    let matchesMachine = false;
    if (isCmmMachine) {
      if (shp.cmmStatus === 'FAIL') {
        matchesMachine = true;
      }
    } else {
      for (const ordId of relatedOrderIds) {
        if (isOrderMatched(ordId, shp.orderId, undefined, shp.orderName)) {
          matchesMachine = true;
          break;
        }
      }
    }

    if (!matchesMachine) return;
    evaluatedOrderIds.add(shp.orderId);

    if (shp.shippingStatus === 'APPROVED') {
      confirmedGood += 1;
    } else if (shp.shippingStatus === 'REJECTED' || shp.cmmStatus === 'FAIL') {
      confirmedDefect += 1;
    } else {
      pendingInspection += 1;
    }
  });

  const totalConfirmed = confirmedGood + confirmedDefect;
  let qualityRate: number | null = null;

  if (totalConfirmed > 0) {
    qualityRate = Math.round((confirmedGood / totalConfirmed) * 1000) / 10;
  }

  return {
    confirmedGood,
    confirmedDefect,
    pendingInspection,
    qualityRate
  };
}

/**
 * Main function to calculate all metrics for all equipment and the whole line.
 */
export function calculateLineMetrics(
  tasks: ScheduledTaskItem[],
  processProgressMap: ProcessProgressMap,
  inspections: InspectionItem[],
  shippingProjects: ShippingProjectItem[],
  metricMode: EquipmentMetricMode = 'AVAILABILITY_PERFORMANCE'
): LineMetricsSummary {
  const machineMetrics: Record<string, MachineMetricItem> = {};

  let runningCount = 0;
  let pausedCount = 0;
  let idleCount = 0;

  let totalPlanHours = 0;
  let totalActualHours = 0;
  let totalConfirmedGood = 0;
  let totalConfirmedDefect = 0;
  let totalPendingInspection = 0;

  ALL_EQUIPMENT_LIST.forEach(machineName => {
    let category: 'MCT' | 'GRINDER' | 'CMM' = 'MCT';
    if (machineName.startsWith('연마') || machineName.includes('프로파일')) category = 'GRINDER';
    else if (machineName.startsWith('CMM')) category = 'CMM';

    // 1. Availability
    const avail = calculateAvailability(machineName, tasks);
    if (avail.status === 'RUNNING') runningCount++;
    else if (avail.status === 'PAUSED') pausedCount++;
    else idleCount++;

    // 2. Performance
    const perf = calculatePerformance(machineName, tasks, processProgressMap);
    totalPlanHours += perf.planHoursSum;
    totalActualHours += perf.actualHoursSum;

    // 3. Quality
    const qual = calculateQuality(machineName, tasks, inspections, shippingProjects, processProgressMap);
    totalConfirmedGood += qual.confirmedGood;
    totalConfirmedDefect += qual.confirmedDefect;
    totalPendingInspection += qual.pendingInspection;

    // 4. Integrated OEE: 가동률 x 성능률 x 양품률
    let integratedOee: number | null = null;
    if (metricMode === 'FULL_OEE') {
      const a = avail.availabilityRate / 100;
      const p = perf.performanceRate / 100;
      if (qual.qualityRate !== null) {
        const q = qual.qualityRate / 100;
        integratedOee = Math.round(a * p * q * 1000) / 10;
      } else {
        // When quality has no sample, reflect Availability x Performance
        integratedOee = Math.round(a * p * 1000) / 10;
      }
    }

    machineMetrics[machineName] = {
      machineName,
      category,
      status: avail.status,
      activeTaskCount: avail.activeCount,
      completedTaskCount: avail.completedCount,
      availabilityRate: avail.availabilityRate,
      planHoursSum: perf.planHoursSum,
      actualHoursSum: perf.actualHoursSum,
      performanceRate: perf.performanceRate,
      confirmedGood: qual.confirmedGood,
      confirmedDefect: qual.confirmedDefect,
      pendingInspection: qual.pendingInspection,
      qualityRate: qual.qualityRate,
      integratedOee
    };
  });

  const totalMachines = ALL_EQUIPMENT_LIST.length; // 21
  const lineAvailabilityRate = Math.round((runningCount / totalMachines) * 1000) / 10;

  // Line average performance
  let linePerformanceRate = 100.0;
  if (totalActualHours > 0) {
    linePerformanceRate = Math.min(100.0, Math.round((totalPlanHours / totalActualHours) * 1000) / 10);
  }

  // Line average quality
  const lineTotalConfirmed = totalConfirmedGood + totalConfirmedDefect;
  let lineQualityRate: number | null = null;
  if (lineTotalConfirmed > 0) {
    lineQualityRate = Math.round((totalConfirmedGood / lineTotalConfirmed) * 1000) / 10;
  }

  // Line Integrated OEE
  let lineIntegratedOee: number | null = null;
  if (metricMode === 'FULL_OEE') {
    const a = lineAvailabilityRate / 100;
    const p = linePerformanceRate / 100;
    if (lineQualityRate !== null) {
      const q = lineQualityRate / 100;
      lineIntegratedOee = Math.round(a * p * q * 1000) / 10;
    } else {
      lineIntegratedOee = Math.round(a * p * 1000) / 10;
    }
  }

  return {
    metricMode,
    totalMachines,
    runningCount,
    pausedCount,
    idleCount,
    lineAvailabilityRate,
    linePerformanceRate,
    lineQualityRate,
    lineIntegratedOee,
    totalConfirmedGood,
    totalConfirmedDefect,
    totalPendingInspection,
    machineMetrics
  };
}
