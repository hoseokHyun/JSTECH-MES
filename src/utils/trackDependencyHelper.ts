import { ProcessStep, ScheduledTaskItem, ProcessProgressMap } from '../types';

export const PRESET_COMPONENT_TAGS = [
  'Base',
  'Head',
  'Block',
  'Pipe',
  'Block+Pipe',
  'Block+Pipe+Head',
  'Block+Pipe+Head+Base'
] as const;

export interface TrackColorConfig {
  bg: string;
  text: string;
  border: string;
  badge: string;
  lightBg: string;
  accent: string;
}

export const TRACK_COLOR_MAP: Record<string, TrackColorConfig> = {
  Base: {
    bg: 'bg-blue-600',
    text: 'text-blue-900',
    border: 'border-blue-400',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    lightBg: 'bg-blue-50/70',
    accent: '#2563eb'
  },
  Head: {
    bg: 'bg-purple-600',
    text: 'text-purple-900',
    border: 'border-purple-400',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
    lightBg: 'bg-purple-50/70',
    accent: '#9333ea'
  },
  Block: {
    bg: 'bg-teal-600',
    text: 'text-teal-900',
    border: 'border-teal-400',
    badge: 'bg-teal-100 text-teal-800 border-teal-300',
    lightBg: 'bg-teal-50/70',
    accent: '#0d9488'
  },
  Pipe: {
    bg: 'bg-amber-600',
    text: 'text-amber-900',
    border: 'border-amber-400',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    lightBg: 'bg-amber-50/70',
    accent: '#d97706'
  },
  'Block+Pipe': {
    bg: 'bg-rose-600',
    text: 'text-rose-900',
    border: 'border-rose-400',
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    lightBg: 'bg-rose-50/70',
    accent: '#e11d48'
  },
  'Block+Pipe+Head': {
    bg: 'bg-fuchsia-600',
    text: 'text-fuchsia-900',
    border: 'border-fuchsia-400',
    badge: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300',
    lightBg: 'bg-fuchsia-50/70',
    accent: '#c026d3'
  },
  'Block+Pipe+Head+Base': {
    bg: 'bg-emerald-600',
    text: 'text-emerald-900',
    border: 'border-emerald-400',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    lightBg: 'bg-emerald-50/70',
    accent: '#059669'
  },
  DEFAULT: {
    bg: 'bg-slate-600',
    text: 'text-slate-900',
    border: 'border-slate-300',
    badge: 'bg-slate-100 text-slate-800 border-slate-300',
    lightBg: 'bg-slate-50',
    accent: '#475569'
  }
};

export function getTrackColor(tag?: string): TrackColorConfig {
  if (!tag) return TRACK_COLOR_MAP.DEFAULT;
  const clean = tag.trim();
  return TRACK_COLOR_MAP[clean] || TRACK_COLOR_MAP.DEFAULT;
}

/**
 * Parses individual sub-components from a tag.
 * e.g., "Block+Pipe" -> ["Block", "Pipe"]
 */
export function getComponentParts(tag?: string): string[] {
  if (!tag) return [];
  return tag
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Checks if the tag indicates an assembly/merge step.
 */
export function isAssemblyTag(tag?: string): boolean {
  if (!tag) return false;
  return tag.includes('+') || tag.includes('조립') || tag.includes('합류');
}

/**
 * Smart automatic parser for componentTag from process name.
 * Handles:
 * - "공정명_부품명" (e.g. "MCT 형상 가공_Base" -> "Base")
 * - "[부품명] 공정명" (e.g. "[Head] CNC 가공" -> "Head")
 * - "공정명(Block+Pipe)" -> "Block+Pipe"
 * - "공정명(+Head)" -> Appends Head to previous assembly tag
 * - "공정명(+Base)" -> Appends Base to previous assembly tag
 */
export function parseComponentTag(
  processName: string,
  existingTag?: string,
  prevTag?: string
): string {
  if (existingTag && existingTag.trim()) {
    return existingTag.trim();
  }

  const raw = (processName || '').trim();
  if (!raw) return '';

  // 1. Check for suffix `_부품명` (e.g., MCT 형상 가공_Base)
  const underscoreMatch = raw.match(/_([A-Za-z0-9가-힣+]+)$/);
  if (underscoreMatch && underscoreMatch[1]) {
    return underscoreMatch[1].trim();
  }

  // 2. Check for prefix `[부품명]`
  const bracketMatch = raw.match(/^\[([A-Za-z0-9가-힣+]+)\]/);
  if (bracketMatch && bracketMatch[1]) {
    return bracketMatch[1].trim();
  }

  // 3. Check for specific compound patterns in parentheses
  if (raw.includes('Block+Pipe')) {
    return 'Block+Pipe';
  }
  if (raw.includes('+Head') || raw.includes('(+Head)')) {
    if (prevTag && prevTag.includes('Block') && prevTag.includes('Pipe')) {
      return 'Block+Pipe+Head';
    }
    return 'Head';
  }
  if (raw.includes('+Base') || raw.includes('(+Base)')) {
    if (prevTag && prevTag.includes('Head')) {
      return 'Block+Pipe+Head+Base';
    }
    return 'Base';
  }

  // 4. Standalone component keyword matches
  const lower = raw.toLowerCase();
  if (lower.includes('base') || raw.includes('베이스')) return 'Base';
  if (lower.includes('head') || raw.includes('헤드')) return 'Head';
  if (lower.includes('block') || raw.includes('블록') || raw.includes('블럭')) return 'Block';
  if (lower.includes('pipe') || raw.includes('파이프')) return 'Pipe';

  // 5. Final assembly check
  if (prevTag && prevTag.includes('Base') && prevTag.includes('Head')) {
    // If we are in the final assembly phase
    return prevTag;
  }

  return '';
}

/**
 * Calculates step dependencies for a list of ProcessSteps.
 * Returns a Map where key is process index, and value is an array of process indices
 * that must be completed before the key process can start.
 */
export function getStepDependencies(processes: ProcessStep[]): Map<number, number[]> {
  const depMap = new Map<number, number[]>();
  const total = processes.length;

  const hasAnyComponentTag = processes.some(
    (p) => p.componentTag && p.componentTag.trim() !== ''
  );

  // If no component tags exist in the entire process list, fallback to standard serial chain
  if (!hasAnyComponentTag) {
    for (let i = 0; i < total; i++) {
      depMap.set(i, i > 0 ? [i - 1] : []);
    }
    return depMap;
  }

  for (let i = 0; i < total; i++) {
    const currentTag = (processes[i].componentTag || '').trim();

    if (!currentTag) {
      // Step without tag depends on previous step
      depMap.set(i, i > 0 ? [i - 1] : []);
      continue;
    }

    // 1. Check for immediate predecessor in the SAME track
    let sameTrackPredecessorIndex = -1;
    for (let j = i - 1; j >= 0; j--) {
      const prevTag = (processes[j].componentTag || '').trim();
      if (prevTag === currentTag) {
        sameTrackPredecessorIndex = j;
        break;
      }
    }

    if (sameTrackPredecessorIndex !== -1) {
      // Within the same track, it strictly depends on the previous step of this track
      depMap.set(i, [sameTrackPredecessorIndex]);
      continue;
    }

    // 2. This is the FIRST step with this currentTag
    const currentParts = getComponentParts(currentTag);

    if (currentParts.length <= 1) {
      // Single independent component root track (e.g. Base, Head, Block, Pipe)
      // Has no predecessors; can start in parallel at order start!
      depMap.set(i, []);
    } else {
      // This is an assembly/merge step (e.g. "Block+Pipe", "Block+Pipe+Head", "Block+Pipe+Head+Base")
      // It must wait for the completion of the latest step of each constituent component!
      const neededStepIndices = new Set<number>();

      for (const part of currentParts) {
        // Find the latest step `k < i` whose tag includes `part`
        let latestPartStep = -1;
        for (let k = i - 1; k >= 0; k--) {
          const stepTag = (processes[k].componentTag || '').trim();
          const stepParts = getComponentParts(stepTag);
          if (stepParts.includes(part)) {
            latestPartStep = k;
            break;
          }
        }
        if (latestPartStep !== -1) {
          neededStepIndices.add(latestPartStep);
        }
      }

      depMap.set(i, Array.from(neededStepIndices).sort((a, b) => a - b));
    }
  }

  return depMap;
}

export interface TaskPrerequisiteCheckResult {
  isReady: boolean;
  canStart: boolean;
  unmetIndices: number[];
  unmetSteps: { processIndex: number; name: string; tag: string }[];
  missingTasks: { processIndex: number; name: string; tag: string; groupName?: string; content?: string; title?: string }[];
  missingDependencies: string[];
  waitingTrackNames: string[];
  completedTrackNames: string[];
  summaryText: string;
}

/**
 * Checks whether a scheduled task's predecessors are completed.
 * Flexible: supports passing ScheduledTaskItem or processKey string,
 * and optional baseProcesses array or orders Record.
 */
export function checkTaskPrerequisites(
  taskOrKey: ScheduledTaskItem | string,
  allOrderTasks: ScheduledTaskItem[],
  processProgressMap: ProcessProgressMap,
  baseProcessesOrOrders?: ProcessStep[] | Record<string, any>
): TaskPrerequisiteCheckResult {
  const task: ScheduledTaskItem | undefined =
    typeof taskOrKey === 'string'
      ? allOrderTasks.find((t) => t.processKey === taskOrKey)
      : taskOrKey;

  const defaultResult: TaskPrerequisiteCheckResult = {
    isReady: true,
    canStart: true,
    unmetIndices: [],
    unmetSteps: [],
    missingTasks: [],
    missingDependencies: [],
    waitingTrackNames: [],
    completedTrackNames: [],
    summaryText: '선행 공정 없음 (즉시 작업 가능)'
  };

  if (!task) {
    return defaultResult;
  }

  // Resolve baseProcesses
  let baseProcesses: ProcessStep[] = [];
  if (Array.isArray(baseProcessesOrOrders)) {
    baseProcesses = baseProcessesOrOrders;
  } else if (baseProcessesOrOrders && typeof baseProcessesOrOrders === 'object' && task.orderId) {
    const matchedOrder = baseProcessesOrOrders[task.orderId];
    if (matchedOrder?.processes) {
      baseProcesses = matchedOrder.processes;
    }
  }

  // If baseProcesses is empty, synthesize minimal steps from all tasks of this order
  if (baseProcesses.length === 0) {
    const orderTasks = allOrderTasks
      .filter((t) => t.orderId === task.orderId && (t.productNo === task.productNo || t.productNo === 1))
      .sort((a, b) => a.processIndex - b.processIndex);

    baseProcesses = orderTasks.map((t) => ({
      name: t.content || t.groupName || t.title || `공정 #${t.processIndex + 1}`,
      category: (t.category as any) || '가공',
      durationHours: t.duration || 2,
      componentTag: t.componentTag || parseComponentTag(t.content || t.groupName || t.title || '', '', '')
    }));
  }

  const depMap = getStepDependencies(baseProcesses);
  const myIndex = task.processIndex;
  const depIndices = depMap.get(myIndex) || [];

  if (depIndices.length === 0) {
    return defaultResult;
  }

  const unmetIndices: number[] = [];
  const unmetSteps: { processIndex: number; name: string; tag: string }[] = [];
  const waitingTracksSet = new Set<string>();
  const completedTracksSet = new Set<string>();

  // Helper to check if a specific step index in the order is completed
  const isStepCompleted = (stepIdx: number): boolean => {
    const matchedTask = allOrderTasks.find(
      (t) =>
        t.orderId === task.orderId &&
        (t.productNo === task.productNo || t.productNo === 1) &&
        t.processIndex === stepIdx
    );
    if (!matchedTask) return false;

    const pKey = matchedTask.processKey;
    const progress = processProgressMap[pKey];
    return Boolean(
      matchedTask.isCompleted ||
      matchedTask.status === 'COMPLETED' ||
      progress?.isCompleted ||
      progress?.completed ||
      progress?.status === 'COMPLETED'
    );
  };

  depIndices.forEach((depIdx) => {
    const depStep = baseProcesses[depIdx];
    const depTag = depStep?.componentTag || `공정 #${depIdx + 1}`;
    const done = isStepCompleted(depIdx);

    if (!done) {
      unmetIndices.push(depIdx);
      unmetSteps.push({
        processIndex: depIdx,
        name: depStep?.name || `공정 #${depIdx + 1}`,
        tag: depTag
      });
      waitingTracksSet.add(depTag);
    } else {
      completedTracksSet.add(depTag);
    }
  });

  const isReady = unmetIndices.length === 0;

  let summaryText = '';
  if (isReady) {
    summaryText = '선행 공정 완료! 작업 시작 가능';
  } else {
    const waitingList = Array.from(waitingTracksSet).map((t) => `${t}: 대기 중 ⏳`);
    const completedList = Array.from(completedTracksSet).map((t) => `${t}: 완료 ✓`);
    summaryText = [...completedList, ...waitingList].join(' | ');
  }

  const missingTasks = unmetSteps.map((s) => ({
    ...s,
    groupName: s.name,
    content: s.name,
    title: s.name
  }));

  const waitingTrackNames = Array.from(waitingTracksSet);
  const completedTrackNames = Array.from(completedTracksSet);

  return {
    isReady,
    canStart: isReady,
    unmetIndices,
    unmetSteps,
    missingTasks,
    missingDependencies: waitingTrackNames,
    waitingTrackNames,
    completedTrackNames,
    summaryText
  };
}

export interface ReorderValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Validates whether moving a process step from fromIndex to toIndex violates
 * assembly convergence dependencies or pre-requisite component tracks.
 */
export function validateProcessReorder(
  processes: ProcessStep[],
  fromIndex: number,
  toIndex: number
): ReorderValidationResult {
  if (fromIndex === toIndex) return { isValid: true };
  if (fromIndex < 0 || fromIndex >= processes.length) {
    return { isValid: false, reason: '유효하지 않은 공정 위치입니다.' };
  }
  if (toIndex < 0 || toIndex >= processes.length) {
    return { isValid: false, reason: '유효하지 않은 목표 위치입니다.' };
  }

  const testArr = [...processes];
  const [moved] = testArr.splice(fromIndex, 1);
  testArr.splice(toIndex, 0, moved);

  // Check every step in testArr
  for (let i = 0; i < testArr.length; i++) {
    const step = testArr[i];
    const tag = (step.componentTag || parseComponentTag(step.name, '', '')).trim();
    const parts = getComponentParts(tag);

    // If step is an assembly step (has multiple parts like Block+Pipe or name has 용접/조립)
    if (isAssemblyTag(tag) || parts.length > 1) {
      // Every required constituent part must have all its preceding track steps completed before index i
      for (const part of parts) {
        // Find if there is any step AFTER index i that belongs to `part`
        for (let j = i + 1; j < testArr.length; j++) {
          const subsequentStep = testArr[j];
          const subsequentTag = (
            subsequentStep.componentTag || parseComponentTag(subsequentStep.name, '', '')
          ).trim();
          const subsequentParts = getComponentParts(subsequentTag);

          // If a subsequent step is a single component step for this part (e.g. "Head" or "Block" or "Pipe")
          if (subsequentParts.length === 1 && subsequentParts[0] === part) {
            return {
              isValid: false,
              reason: `'${part}' 트랙 완료 전에는 이 조립 공정('${step.name}')을 앞으로 이동할 수 없습니다.`
            };
          }
        }
      }
    }
  }

  return { isValid: true };
}
