import { OrderStatus } from './index';

export interface MeasurementPoint {
  no: number;
  code: string;
  item: string;
  nominal: number;
  actual: number;
  tolerance: string;
  deviation: string;
  unit: string;
  status: 'OK' | 'NG';
  pos3D: { x: number; y: number; z: number };
}

export interface CapaLifeCycle {
  step: number;
  defectOccurred: { id: string; type: string; time: string; desc: string };
  causeAnalysis: { reason: string; toolOrJig: string; details: string; time: string };
  correctiveAction: { action: string; changeDetails: string; time: string };
  reinspection: { id: string; time: string; result: string };
  finalVerdict: { result: string; time: string; approver: string };
}

export interface InspectionItem {
  id: string;
  orderId?: string;
  productName: string;
  customer: string;
  line: string;
  lotNo: string;
  inspectTime: string;
  cmmDevice: string;
  programName: string;
  inspector: string;
  result: 'PASS' | 'FAIL' | 'REINSPECT';
  defectType?: string;
  lipWidthMm: number;
  isArchived?: boolean;
  measurements: MeasurementPoint[];
  capa: CapaLifeCycle;
}

export interface CmmMachineInfo {
  id: string;
  name: string;
  model: string;
  status: 'RUNNING' | 'IDLE' | 'CALIBRATING';
  currentTask: string;
  utilization: number;
  temp: number;
  humidity: number;
  calibratedAt: string;
}

export interface SpcDataPoint {
  batch: string;
  date: string;
  value: number;
  ucl: number;
  cl: number;
  lcl: number;
  sampleCount: number;
  isOutlier: boolean;
}

export type SpcMetricType = 'FLATNESS' | 'STRAIGHTNESS' | 'PARALLELISM';

export interface ProductSpcMetricConfig {
  name: string;
  unit: string;
  nominal: number;
  ucl: number;
  cl: number;
  lcl: number;
  cp: string;
  cpk: string;
  maxRange: number;
  data: SpcDataPoint[];
}

export interface ProductSpcData {
  productId: string;
  productName: string;
  shortName: string;
  orderId?: string;
  orderStatus?: OrderStatus | 'IN_PROGRESS' | 'COMPLETED';
  orderQty?: number;
  customer?: string;
  mctMachine?: string;
  startDate?: string;
  isOrderLinked?: boolean;
  matchedInspectionCount?: number;
  latestCmmResult?: string;
  metrics: {
    FLATNESS: ProductSpcMetricConfig;
    STRAIGHTNESS: ProductSpcMetricConfig;
    PARALLELISM: ProductSpcMetricConfig;
  };
}

export interface ShippingProjectItem {
  id: string;
  orderId: string;
  orderName: string;
  customer: string;
  productSpec: string;
  lotNo: string;
  cmmStatus: 'PASS' | 'FAIL' | 'IN_PROGRESS';
  roughnessStatus: 'PASS' | 'FAIL' | 'PENDING';
  roughnessValue: string;
  coatingStatus: 'PASS' | 'FAIL' | 'PENDING';
  coatingValue: string;
  cleaningStatus: 'PASS' | 'FAIL' | 'PENDING';
  shippingStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  coaNo: string;
  issueDate: string;
  material: string;
  hardness?: string;
  inspector?: string;
  qaManager?: string;
  checklist?: {
    cmmPointScan: boolean;
    roughnessInterferometer: boolean;
    boltInterference: boolean;
    ultrasonicCleaning: boolean;
    cleanroomPackaging: boolean;
  };
  isArchived?: boolean;
}
