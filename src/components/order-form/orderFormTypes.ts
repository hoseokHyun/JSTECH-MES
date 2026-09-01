import { ProcessStep, ProcessCategory, Order, ScheduledTaskItem, User, ProductType } from '../../types';

export interface StepAssignment {
  machine: string;
  worker: string;
}

export interface ResourceBusyInfo {
  orderName: string;
  orderId: string;
  productNo: number;
  processName: string;
  status: string;
  worker?: string;
  machine?: string;
}

export interface ConflictItem {
  stepIndex: number;
  stepName: string;
  type: 'MACHINE' | 'WORKER';
  resourceName: string;
  busyInfo: ResourceBusyInfo;
}

export interface PhaseDefinition {
  id: string;
  name: string;
  titleSuffix: string;
  defaultDesc: string;
  icon: string;
  badgeColor: string;
}

export interface PhaseGroup {
  id: string;
  phaseNumber: number;
  title: string;
  titleSuffix: string;
  description: string;
  icon: string;
  badgeColor: string;
  steps: { proc: ProcessStep; originalIndex: number }[];
  totalHours: number;
  assignedMachineCount: number;
  assignedWorkerCount: number;
  unassignedMachineCount: number;
  unassignedWorkerCount: number;
  startStep: number;
  endStep: number;
  startStepFormatted: string;
  endStepFormatted: string;
  rangeText: string;
  matchingCount: number;
}
