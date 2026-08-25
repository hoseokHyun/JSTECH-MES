import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  Gauge,
  Search,
  Printer,
  Eye,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Folder,
  ArrowRight,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
  BarChart3,
  Check,
  X,
  FileText,
  Activity,
  Cpu,
  Thermometer,
  Droplets,
  Award,
  PackageCheck,
  Ban,
  FileCheck2,
  RefreshCw,
  Maximize2,
  Boxes,
  Truck,
  FileCheck,
  Plus,
  Trash2,
  Archive,
  ArchiveRestore,
  Edit3,
  Save,
  Undo2
} from 'lucide-react';
import { Order, OrderStatus, ScheduledTaskItem, User } from '../types';
import { SlotDieCertificateView } from './SlotDieCertificateView';
import { IqcDetailModal, IqcLotItem, DEFAULT_IQC_LOTS, calculateIqcOverallResult } from './IqcDetailModal';
import { IpqcPrintModal } from './IpqcPrintModal';
import { NewIpqcModal } from './NewIpqcModal';
import { ShippingCoaPrintModal } from './ShippingCoaPrintModal';
import { NewShippingModal } from './NewShippingModal';
import { KpiDetailModal } from './KpiDetailModal';

// ============================================================================
// 1. DATA INTERFACES
// ============================================================================

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
  pos3D: { x: number; y: number; z: number }; // 3D coordinate for viewer mapping
}

export interface CapaLifeCycle {
  step: number; // 1 to 5
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
  lipWidthMm: number; // Slot Die Width e.g. 1200mm
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
  value: number; // measured value or deviation in um
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
  roughnessValue: string; // e.g. Ra 0.016㎛
  coatingStatus: 'PASS' | 'FAIL' | 'PENDING';
  coatingValue: string; // e.g. Hard Chrome 15.2㎛
  cleaningStatus: 'PASS' | 'FAIL' | 'PENDING';
  shippingStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  coaNo: string;
  issueDate: string;
  material: string;
  hardness: string;
  inspector: string;
  qaManager: string;
  isArchived?: boolean;
  checklist: {
    cmmPointScan: boolean;
    roughnessInterferometer: boolean;
    boltInterference: boolean;
    ultrasonicCleaning: boolean;
    cleanroomPackaging: boolean;
  };
}

// ============================================================================
// HELPER: Accurate Tolerance & Status Evaluation
// ============================================================================
export const evaluateMeasurementStatus = (
  actual: number,
  nominal: number,
  tolerance: string
): { deviation: string; status: 'OK' | 'NG' } => {
  const dev = actual - nominal;
  const devStr = (dev >= 0 ? '+' : '') + dev.toFixed(Math.abs(dev) < 0.1 ? 3 : 2);
  const cleanTol = tolerance.trim();

  if (cleanTol.startsWith('≤') || cleanTol.startsWith('<=')) {
    const limit = parseFloat(cleanTol.replace(/[^0-9.]/g, ''));
    if (!isNaN(limit)) {
      return { deviation: devStr, status: actual <= limit ? 'OK' : 'NG' };
    }
  }
  if (cleanTol.startsWith('≥') || cleanTol.startsWith('>=')) {
    const limit = parseFloat(cleanTol.replace(/[^0-9.]/g, ''));
    if (!isNaN(limit)) {
      return { deviation: devStr, status: actual >= limit ? 'OK' : 'NG' };
    }
  }
  if (cleanTol.includes('±')) {
    const tolVal = parseFloat(cleanTol.replace(/[^0-9.]/g, ''));
    if (!isNaN(tolVal)) {
      return { deviation: devStr, status: Math.abs(dev) <= tolVal + 0.00001 ? 'OK' : 'NG' };
    }
  }
  const tolVal = parseFloat(cleanTol.replace(/[^0-9.]/g, ''));
  if (!isNaN(tolVal)) {
    return { deviation: devStr, status: Math.abs(dev) <= tolVal + 0.00001 ? 'OK' : 'NG' };
  }
  return { deviation: devStr, status: 'OK' };
};

// ============================================================================
// 2. MOCK DATA FOR ULTRA-PRECISION SLOT DIE QUALITY SYSTEM
// ============================================================================

const DEFAULT_INSPECTION_DATA: InspectionItem[] = [
  {
    id: 'CMM-260521-001',
    orderId: 'ORD-2026-0811-001',
    productName: '2차전지 양극재 코팅용 슬롯다이 상부 바디 (Upper Die Body 1200L)',
    customer: '삼성SDI 천안사업장',
    line: 'LINE 1 (클린룸 #1)',
    lotNo: 'LOT-260519-SDI01',
    inspectTime: '2026-08-18 10:28',
    cmmDevice: 'CMM-01 (Zeiss Prismo Ultra)',
    programName: 'SLOT_DIE_1200_UPPER_V4',
    inspector: '김준성 책임연구원',
    result: 'FAIL',
    defectType: '립 간격(Lip Gap) 단차 불량',
    lipWidthMm: 1200,
    measurements: [
      { no: 1, code: 'P1', item: '립 중앙 토출 갭 (Center Gap)', nominal: 50.00, actual: 50.12, deviation: '+0.12', tolerance: '±0.80', unit: '㎛', status: 'OK', pos3D: { x: 0, y: 15, z: 0 } },
      { no: 2, code: 'P2', item: '립 좌측 엔드 갭 (Left Lip Gap)', nominal: 50.00, actual: 51.45, deviation: '+1.45', tolerance: '±0.80', unit: '㎛', status: 'NG', pos3D: { x: -80, y: 15, z: 0 } },
      { no: 3, code: 'P3', item: '립 우측 엔드 갭 (Right Lip Gap)', nominal: 50.00, actual: 50.32, deviation: '+0.32', tolerance: '±0.80', unit: '㎛', status: 'OK', pos3D: { x: 80, y: 15, z: 0 } },
      { no: 4, code: 'P4', item: '경면부 진직도/평면도 (Flatness)', nominal: 0.00, actual: 0.85, deviation: '+0.85', tolerance: '≤ 1.00', unit: '㎛', status: 'OK', pos3D: { x: 0, y: 0, z: 20 } },
      { no: 5, code: 'P5', item: '볼트 체결 홀 피치 (M8 Hole Pitch)', nominal: 45.00, actual: 45.028, deviation: '+0.028', tolerance: '±0.015', unit: 'mm', status: 'NG', pos3D: { x: -40, y: -20, z: 10 } },
      { no: 6, code: 'P6', item: '매니폴드 유로 깊이 (Manifold Deep)', nominal: 18.50, actual: 18.504, deviation: '+0.004', tolerance: '±0.020', unit: 'mm', status: 'OK', pos3D: { x: 40, y: -10, z: -10 } },
      { no: 7, code: 'P7', item: '조절볼트 시트 단차 (Adjustment Seat)', nominal: 12.00, actual: 12.008, deviation: '+0.008', tolerance: '±0.020', unit: 'mm', status: 'OK', pos3D: { x: 0, y: -30, z: 0 } },
      { no: 8, code: 'P8', item: '경면부 표면 조도 (Mirror Roughness)', nominal: 0.020, actual: 0.016, deviation: '-0.004', tolerance: '≤ 0.020', unit: '㎛ Ra', status: 'OK', pos3D: { x: 0, y: 10, z: -20 } }
    ],
    capa: {
      step: 3,
      defectOccurred: {
        id: 'CAPA-260818-01',
        type: '립 좌측 간격 편차 +1.45㎛ 초과 (기준: ±0.80㎛)',
        time: '2026-08-18 10:35',
        desc: '슬롯다이 좌측 엔드 부위 연마 가공 후 클램핑 잔류응력 이완으로 미세 휨 발생'
      },
      causeAnalysis: {
        reason: '초정밀 3M 연마기 #2 픽스처 볼트 체결 토크 불균일 (좌측 14N·m vs 우측 10N·m)',
        toolOrJig: 'JIG-SLOT-1200-L3',
        details: '좌측 지그 마모로 인한 체결 하중 편차 0.0018mm 형성',
        time: '2026-08-18 11:10'
      },
      correctiveAction: {
        action: '지그 정밀 래핑 교정 및 디지털 토크렌치 10.0N·m 전볼트 동등 체결 규정 적용',
        changeDetails: '정밀 래핑 지그 교체 (JIG-SLOT-1200-L3A) 및 마이크로 랩 피니싱 0.8㎛ 재가공',
        time: '2026-08-18 11:45'
      },
      reinspection: {
        id: 'CMM-260521-001-R1',
        time: '2026-08-18 13:20 (예정)',
        result: '재검사 대기중'
      },
      finalVerdict: {
        result: '시정조치 진행중 (CAPA 3단계)',
        time: '-',
        approver: '품질보증팀장 이준혁'
      }
    }
  },
  {
    id: 'CMM-260521-002',
    orderId: 'ORD-2026-0811-002',
    productName: '디스플레이 OCA 광학 코팅용 슬롯다이 하부 바디 (Lower Body 1600L)',
    customer: 'LG디스플레이 파주공장',
    line: 'LINE 2 (클린룸 #2)',
    lotNo: 'LOT-260519-LGD02',
    inspectTime: '2026-08-18 09:45',
    cmmDevice: 'CMM-02 (Mitutoyo Crysta-Apex V)',
    programName: 'SLOT_DIE_1600_LOWER_V2',
    inspector: '이영희 선임연구원',
    result: 'PASS',
    lipWidthMm: 1600,
    measurements: [
      { no: 1, code: 'P1', item: '립 중앙 토출 갭 (Center Gap)', nominal: 35.00, actual: 35.10, deviation: '+0.10', tolerance: '±0.60', unit: '㎛', status: 'OK', pos3D: { x: 0, y: 15, z: 0 } },
      { no: 2, code: 'P2', item: '립 좌측 엔드 갭 (Left Lip Gap)', nominal: 35.00, actual: 35.18, deviation: '+0.18', tolerance: '±0.60', unit: '㎛', status: 'OK', pos3D: { x: -80, y: 15, z: 0 } },
      { no: 3, code: 'P3', item: '립 우측 엔드 갭 (Right Lip Gap)', nominal: 35.00, actual: 34.92, deviation: '-0.08', tolerance: '±0.60', unit: '㎛', status: 'OK', pos3D: { x: 80, y: 15, z: 0 } },
      { no: 4, code: 'P4', item: '경면부 진직도/평면도 (Flatness)', nominal: 0.00, actual: 0.52, deviation: '+0.52', tolerance: '≤ 0.80', unit: '㎛', status: 'OK', pos3D: { x: 0, y: 0, z: 20 } },
      { no: 5, code: 'P5', item: '볼트 체결 홀 피치 (M8 Hole Pitch)', nominal: 45.00, actual: 45.004, deviation: '+0.004', tolerance: '±0.015', unit: 'mm', status: 'OK', pos3D: { x: -40, y: -20, z: 10 } },
      { no: 6, code: 'P6', item: '매니폴드 유로 깊이 (Manifold Deep)', nominal: 22.00, actual: 22.003, deviation: '+0.003', tolerance: '±0.020', unit: 'mm', status: 'OK', pos3D: { x: 40, y: -10, z: -10 } },
      { no: 7, code: 'P7', item: '경면부 표면 조도 (Mirror Roughness)', nominal: 0.020, actual: 0.014, deviation: '-0.006', tolerance: '≤ 0.020', unit: '㎛ Ra', status: 'OK', pos3D: { x: 0, y: 10, z: -20 } }
    ],
    capa: {
      step: 5,
      defectOccurred: { id: '-', type: '특이사항 없음', time: '-', desc: '-' },
      causeAnalysis: { reason: '-', toolOrJig: '-', details: '-', time: '-' },
      correctiveAction: { action: '-', changeDetails: '-', time: '-' },
      reinspection: { id: '-', time: '-', result: '-' },
      finalVerdict: { result: '전항목 규격 내 합격 (PASS)', time: '2026-08-18 10:10', approver: '품질보증팀장 이준혁' }
    }
  },
  {
    id: 'CMM-260521-003',
    orderId: 'ORD-2026-0811-003',
    productName: '수소연료전지 분리막 코터 슬롯노즐 심 플레이트 (Shim Plate 0.05T)',
    customer: '현대모비스 의왕연구소',
    line: 'LINE 3 (클린룸 #1)',
    lotNo: 'LOT-260519-HM03',
    inspectTime: '2026-08-18 09:12',
    cmmDevice: 'CMM-02 (Mitutoyo Crysta-Apex V)',
    programName: 'SHIM_PLATE_HYDROGEN_V1',
    inspector: '박철수 주임연구원',
    result: 'REINSPECT',
    defectType: '두께 평행도 미세 편차',
    lipWidthMm: 800,
    measurements: [
      { no: 1, code: 'P1', item: '심 두께 중앙 (Shim Thickness C)', nominal: 50.00, actual: 50.25, deviation: '+0.25', tolerance: '±0.50', unit: '㎛', status: 'OK', pos3D: { x: 0, y: 0, z: 0 } },
      { no: 2, code: 'P2', item: '심 두께 좌측 (Shim Thickness L)', nominal: 50.00, actual: 50.62, deviation: '+0.62', tolerance: '±0.50', unit: '㎛', status: 'NG', pos3D: { x: -60, y: 0, z: 0 } },
      { no: 3, code: 'P3', item: '심 두께 우측 (Shim Thickness R)', nominal: 50.00, actual: 50.18, deviation: '+0.18', tolerance: '±0.50', unit: '㎛', status: 'OK', pos3D: { x: 60, y: 0, z: 0 } },
      { no: 4, code: 'P4', item: '에지 버(Burr) 높이', nominal: 0.00, actual: 0.35, deviation: '+0.35', tolerance: '≤ 0.50', unit: '㎛', status: 'OK', pos3D: { x: 0, y: 15, z: 0 } }
    ],
    capa: {
      step: 4,
      defectOccurred: { id: 'CAPA-260818-03', type: '심 좌측 두께 편차 +0.62㎛', time: '2026-08-18 09:15', desc: '초박판 와이어 커팅 후 잔여 버 및 미세 단차' },
      causeAnalysis: { reason: '초음파 세척 불충분으로 미세 슬러지 잔존', toolOrJig: 'CLEAN-US-03', details: '세척액 탈포 미흡', time: '2026-08-18 09:40' },
      correctiveAction: { action: '3단계 메가소닉 정밀 세척 및 30분 핫에어 건조', changeDetails: '진공 탈포 세척기 적용', time: '2026-08-18 10:20' },
      reinspection: { id: 'CMM-260521-003-R1', time: '2026-08-18 11:00', result: '재검사 진행중 (CMM-02)' },
      finalVerdict: { result: '재검사 판정 대기', time: '-', approver: '품질보증팀장 이준혁' }
    }
  },
  {
    id: 'CMM-260521-004',
    orderId: 'ORD-2026-0811-004',
    productName: '반도체 패키징용 초정밀 디스펜서 슬릿 노즐 바디',
    customer: 'SK하이닉스 이천캠퍼스',
    line: 'LINE 1 (클린룸 #1)',
    lotNo: 'LOT-260519-SK04',
    inspectTime: '2026-08-18 08:50',
    cmmDevice: 'CMM-01 (Zeiss Prismo Ultra)',
    programName: 'SEMI_NOZZLE_PREC_V5',
    inspector: '최민지 선임연구원',
    result: 'PASS',
    lipWidthMm: 600,
    measurements: [
      { no: 1, code: 'P1', item: '노즐 토출구 갭 (Orifice Gap)', nominal: 20.00, actual: 20.08, deviation: '+0.08', tolerance: '±0.40', unit: '㎛', status: 'OK', pos3D: { x: 0, y: 15, z: 0 } },
      { no: 2, code: 'P2', item: '초미세 평면도 (Surface Flatness)', nominal: 0.00, actual: 0.38, deviation: '+0.38', tolerance: '≤ 0.50', unit: '㎛', status: 'OK', pos3D: { x: 0, y: 0, z: 15 } }
    ],
    capa: {
      step: 5,
      defectOccurred: { id: '-', type: '특이사항 없음', time: '-', desc: '-' },
      causeAnalysis: { reason: '-', toolOrJig: '-', details: '-', time: '-' },
      correctiveAction: { action: '-', changeDetails: '-', time: '-' },
      reinspection: { id: '-', time: '-', result: '-' },
      finalVerdict: { result: '전항목 규격 내 합격 (PASS)', time: '2026-08-18 09:10', approver: '품질보증팀장 이준혁' }
    }
  }
];

// CMM 장비 2대 현황 (CMM-01, CMM-02)
const CMM_MACHINES_STATUS: CmmMachineInfo[] = [
  {
    id: 'CMM-01',
    name: 'CMM #1 (Zeiss Prismo Ultra)',
    model: 'Zeiss Ultra High Precision (0.5+L/500㎛)',
    status: 'RUNNING',
    currentTask: '2차전지 양극재 슬롯다이 상부 바디 립 전수 검사',
    utilization: 96.8,
    temp: 20.02,
    humidity: 45.1,
    calibratedAt: '2026-08-01 (KOLAS 공인)'
  },
  {
    id: 'CMM-02',
    name: 'CMM #2 (Mitutoyo Crysta-Apex V)',
    model: 'Mitutoyo CNC 3D CMM (1.7+3L/1000㎛)',
    status: 'RUNNING',
    currentTask: '1600L 와이드 슬롯다이 하부 바디 매니폴드 스캔',
    utilization: 93.5,
    temp: 19.98,
    humidity: 44.8,
    calibratedAt: '2026-07-28 (KOLAS 공인)'
  }
];

// 제품별 기하공차 변동 관리도 (평면도, 진직도, 평행도)
const PRODUCT_SPC_DATASET: ProductSpcData[] = [
  {
    productId: 'PROD-1200L-UPPER',
    productName: '2차전지 양극재 코팅용 슬롯다이 상부 바디 (1200L)',
    shortName: '1200L 상부 바디',
    metrics: {
      FLATNESS: {
        name: '평면도 (Flatness)',
        unit: '㎛',
        nominal: 0.00,
        ucl: 1.00,
        cl: 0.00,
        lcl: -1.00,
        cp: '1.82',
        cpk: '1.74 (6-Sigma)',
        maxRange: 1.60,
        data: [
          { batch: 'B-0810-1', date: '08/10', value: 0.42, ucl: 1.00, cl: 0.00, lcl: -1.00, sampleCount: 24, isOutlier: false },
          { batch: 'B-0811-1', date: '08/11', value: 0.58, ucl: 1.00, cl: 0.00, lcl: -1.00, sampleCount: 24, isOutlier: false },
          { batch: 'B-0812-1', date: '08/12', value: 0.35, ucl: 1.00, cl: 0.00, lcl: -1.00, sampleCount: 24, isOutlier: false },
          { batch: 'B-0813-1', date: '08/13', value: 0.48, ucl: 1.00, cl: 0.00, lcl: -1.00, sampleCount: 24, isOutlier: false },
          { batch: 'B-0814-1', date: '08/14', value: 0.65, ucl: 1.00, cl: 0.00, lcl: -1.00, sampleCount: 24, isOutlier: false },
          { batch: 'B-0815-1', date: '08/15', value: 0.72, ucl: 1.00, cl: 0.00, lcl: -1.00, sampleCount: 24, isOutlier: false },
          { batch: 'B-0816-1', date: '08/16', value: 0.88, ucl: 1.00, cl: 0.00, lcl: -1.00, sampleCount: 24, isOutlier: false },
          { batch: 'B-0816-2', date: '08/16', value: 1.15, ucl: 1.00, cl: 0.00, lcl: -1.00, sampleCount: 24, isOutlier: true },
          { batch: 'B-0817-1', date: '08/17', value: 0.62, ucl: 1.00, cl: 0.00, lcl: -1.00, sampleCount: 24, isOutlier: false },
          { batch: 'B-0817-2', date: '08/17', value: 0.54, ucl: 1.00, cl: 0.00, lcl: -1.00, sampleCount: 24, isOutlier: false },
          { batch: 'B-0818-1', date: '08/18', value: 0.48, ucl: 1.00, cl: 0.00, lcl: -1.00, sampleCount: 24, isOutlier: false },
          { batch: 'B-0818-2', date: '08/18', value: 0.40, ucl: 1.00, cl: 0.00, lcl: -1.00, sampleCount: 24, isOutlier: false }
        ]
      },
      STRAIGHTNESS: {
        name: '진직도 (Straightness)',
        unit: '㎛',
        nominal: 0.00,
        ucl: 0.80,
        cl: 0.00,
        lcl: -0.80,
        cp: '1.76',
        cpk: '1.68 (5.8-Sigma)',
        maxRange: 1.20,
        data: [
          { batch: 'B-0810-1', date: '08/10', value: 0.28, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 24, isOutlier: false },
          { batch: 'B-0811-1', date: '08/11', value: 0.32, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 24, isOutlier: false },
          { batch: 'B-0812-1', date: '08/12', value: 0.41, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 24, isOutlier: false },
          { batch: 'B-0813-1', date: '08/13', value: 0.38, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 24, isOutlier: false },
          { batch: 'B-0814-1', date: '08/14', value: 0.45, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 24, isOutlier: false },
          { batch: 'B-0815-1', date: '08/15', value: 0.52, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 24, isOutlier: false },
          { batch: 'B-0816-1', date: '08/16', value: 0.68, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 24, isOutlier: false },
          { batch: 'B-0816-2', date: '08/16', value: 0.85, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 24, isOutlier: true },
          { batch: 'B-0817-1', date: '08/17', value: 0.39, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 24, isOutlier: false },
          { batch: 'B-0817-2', date: '08/17', value: 0.34, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 24, isOutlier: false },
          { batch: 'B-0818-1', date: '08/18', value: 0.30, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 24, isOutlier: false },
          { batch: 'B-0818-2', date: '08/18', value: 0.25, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 24, isOutlier: false }
        ]
      },
      PARALLELISM: {
        name: '평행도 (Parallelism)',
        unit: '㎛',
        nominal: 0.00,
        ucl: 0.60,
        cl: 0.00,
        lcl: -0.60,
        cp: '1.91',
        cpk: '1.83 (6.2-Sigma)',
        maxRange: 0.90,
        data: [
          { batch: 'B-0810-1', date: '08/10', value: 0.22, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 24, isOutlier: false },
          { batch: 'B-0811-1', date: '08/11', value: 0.25, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 24, isOutlier: false },
          { batch: 'B-0812-1', date: '08/12', value: 0.30, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 24, isOutlier: false },
          { batch: 'B-0813-1', date: '08/13', value: 0.28, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 24, isOutlier: false },
          { batch: 'B-0814-1', date: '08/14', value: 0.34, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 24, isOutlier: false },
          { batch: 'B-0815-1', date: '08/15', value: 0.42, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 24, isOutlier: false },
          { batch: 'B-0816-1', date: '08/16', value: 0.51, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 24, isOutlier: false },
          { batch: 'B-0816-2', date: '08/16', value: 0.58, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 24, isOutlier: false },
          { batch: 'B-0817-1', date: '08/17', value: 0.45, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 24, isOutlier: false },
          { batch: 'B-0817-2', date: '08/17', value: 0.33, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 24, isOutlier: false },
          { batch: 'B-0818-1', date: '08/18', value: 0.29, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 24, isOutlier: false },
          { batch: 'B-0818-2', date: '08/18', value: 0.24, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 24, isOutlier: false }
        ]
      }
    }
  },
  {
    productId: 'PROD-1600L-LOWER',
    productName: '디스플레이 OCA 광학 코팅용 슬롯다이 하부 바디 (1600L)',
    shortName: '1600L 하부 바디',
    metrics: {
      FLATNESS: {
        name: '평면도 (Flatness)',
        unit: '㎛',
        nominal: 0.00,
        ucl: 0.80,
        cl: 0.00,
        lcl: -0.80,
        cp: '1.88',
        cpk: '1.79 (6-Sigma)',
        maxRange: 1.20,
        data: [
          { batch: 'B-0810-1', date: '08/10', value: 0.35, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 20, isOutlier: false },
          { batch: 'B-0811-1', date: '08/11', value: 0.42, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 20, isOutlier: false },
          { batch: 'B-0812-1', date: '08/12', value: 0.48, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 20, isOutlier: false },
          { batch: 'B-0813-1', date: '08/13', value: 0.52, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 20, isOutlier: false },
          { batch: 'B-0814-1', date: '08/14', value: 0.55, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 20, isOutlier: false },
          { batch: 'B-0815-1', date: '08/15', value: 0.61, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 20, isOutlier: false },
          { batch: 'B-0816-1', date: '08/16', value: 0.68, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 20, isOutlier: false },
          { batch: 'B-0817-1', date: '08/17', value: 0.72, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 20, isOutlier: false },
          { batch: 'B-0817-2', date: '08/17', value: 0.64, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 20, isOutlier: false },
          { batch: 'B-0818-1', date: '08/18', value: 0.50, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 20, isOutlier: false },
          { batch: 'B-0818-2', date: '08/18', value: 0.44, ucl: 0.80, cl: 0.00, lcl: -0.80, sampleCount: 20, isOutlier: false }
        ]
      },
      STRAIGHTNESS: {
        name: '진직도 (Straightness)',
        unit: '㎛',
        nominal: 0.00,
        ucl: 0.60,
        cl: 0.00,
        lcl: -0.60,
        cp: '1.79',
        cpk: '1.71 (5.9-Sigma)',
        maxRange: 0.90,
        data: [
          { batch: 'B-0810-1', date: '08/10', value: 0.20, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 20, isOutlier: false },
          { batch: 'B-0811-1', date: '08/11', value: 0.24, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 20, isOutlier: false },
          { batch: 'B-0812-1', date: '08/12', value: 0.31, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 20, isOutlier: false },
          { batch: 'B-0813-1', date: '08/13', value: 0.36, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 20, isOutlier: false },
          { batch: 'B-0814-1', date: '08/14', value: 0.40, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 20, isOutlier: false },
          { batch: 'B-0815-1', date: '08/15', value: 0.44, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 20, isOutlier: false },
          { batch: 'B-0816-1', date: '08/16', value: 0.48, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 20, isOutlier: false },
          { batch: 'B-0817-1', date: '08/17', value: 0.52, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 20, isOutlier: false },
          { batch: 'B-0818-1', date: '08/18', value: 0.38, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 20, isOutlier: false },
          { batch: 'B-0818-2', date: '08/18', value: 0.26, ucl: 0.60, cl: 0.00, lcl: -0.60, sampleCount: 20, isOutlier: false }
        ]
      },
      PARALLELISM: {
        name: '평행도 (Parallelism)',
        unit: '㎛',
        nominal: 0.00,
        ucl: 0.50,
        cl: 0.00,
        lcl: -0.50,
        cp: '1.95',
        cpk: '1.87 (6.3-Sigma)',
        maxRange: 0.80,
        data: [
          { batch: 'B-0810-1', date: '08/10', value: 0.18, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 20, isOutlier: false },
          { batch: 'B-0811-1', date: '08/11', value: 0.22, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 20, isOutlier: false },
          { batch: 'B-0812-1', date: '08/12', value: 0.26, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 20, isOutlier: false },
          { batch: 'B-0813-1', date: '08/13', value: 0.30, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 20, isOutlier: false },
          { batch: 'B-0814-1', date: '08/14', value: 0.35, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 20, isOutlier: false },
          { batch: 'B-0815-1', date: '08/15', value: 0.38, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 20, isOutlier: false },
          { batch: 'B-0816-1', date: '08/16', value: 0.42, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 20, isOutlier: false },
          { batch: 'B-0817-1', date: '08/17', value: 0.46, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 20, isOutlier: false },
          { batch: 'B-0818-1', date: '08/18', value: 0.33, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 20, isOutlier: false },
          { batch: 'B-0818-2', date: '08/18', value: 0.24, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 20, isOutlier: false }
        ]
      }
    }
  },
  {
    productId: 'PROD-800L-SHIM',
    productName: '수소연료전지 분리막 코터 슬롯노즐 심 플레이트 (800L)',
    shortName: '800L 심 플레이트',
    metrics: {
      FLATNESS: {
        name: '평면도 (Flatness)',
        unit: '㎛',
        nominal: 0.00,
        ucl: 0.50,
        cl: 0.00,
        lcl: -0.50,
        cp: '1.74',
        cpk: '1.65 (5.7-Sigma)',
        maxRange: 0.80,
        data: [
          { batch: 'B-0810-1', date: '08/10', value: 0.15, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 16, isOutlier: false },
          { batch: 'B-0811-1', date: '08/11', value: 0.18, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 16, isOutlier: false },
          { batch: 'B-0812-1', date: '08/12', value: 0.22, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 16, isOutlier: false },
          { batch: 'B-0813-1', date: '08/13', value: 0.26, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 16, isOutlier: false },
          { batch: 'B-0814-1', date: '08/14', value: 0.31, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 16, isOutlier: false },
          { batch: 'B-0815-1', date: '08/15', value: 0.35, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 16, isOutlier: false },
          { batch: 'B-0816-1', date: '08/16', value: 0.42, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 16, isOutlier: false },
          { batch: 'B-0816-2', date: '08/16', value: 0.58, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 16, isOutlier: true },
          { batch: 'B-0817-1', date: '08/17', value: 0.25, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 16, isOutlier: false },
          { batch: 'B-0818-1', date: '08/18', value: 0.16, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 16, isOutlier: false }
        ]
      },
      STRAIGHTNESS: {
        name: '진직도 (Straightness)',
        unit: '㎛',
        nominal: 0.00,
        ucl: 0.40,
        cl: 0.00,
        lcl: -0.40,
        cp: '1.81',
        cpk: '1.73 (5.9-Sigma)',
        maxRange: 0.60,
        data: [
          { batch: 'B-0810-1', date: '08/10', value: 0.12, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 16, isOutlier: false },
          { batch: 'B-0811-1', date: '08/11', value: 0.15, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 16, isOutlier: false },
          { batch: 'B-0812-1', date: '08/12', value: 0.18, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 16, isOutlier: false },
          { batch: 'B-0813-1', date: '08/13', value: 0.22, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 16, isOutlier: false },
          { batch: 'B-0814-1', date: '08/14', value: 0.25, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 16, isOutlier: false },
          { batch: 'B-0815-1', date: '08/15', value: 0.28, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 16, isOutlier: false },
          { batch: 'B-0816-1', date: '08/16', value: 0.32, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 16, isOutlier: false },
          { batch: 'B-0817-1', date: '08/17', value: 0.24, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 16, isOutlier: false },
          { batch: 'B-0818-1', date: '08/18', value: 0.14, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 16, isOutlier: false }
        ]
      },
      PARALLELISM: {
        name: '평행도 (Parallelism)',
        unit: '㎛',
        nominal: 0.00,
        ucl: 0.50,
        cl: 0.00,
        lcl: -0.50,
        cp: '1.69',
        cpk: '1.58 (5.5-Sigma)',
        maxRange: 0.80,
        data: [
          { batch: 'B-0810-1', date: '08/10', value: 0.20, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 16, isOutlier: false },
          { batch: 'B-0811-1', date: '08/11', value: 0.25, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 16, isOutlier: false },
          { batch: 'B-0812-1', date: '08/12', value: 0.28, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 16, isOutlier: false },
          { batch: 'B-0813-1', date: '08/13', value: 0.32, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 16, isOutlier: false },
          { batch: 'B-0814-1', date: '08/14', value: 0.38, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 16, isOutlier: false },
          { batch: 'B-0815-1', date: '08/15', value: 0.42, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 16, isOutlier: false },
          { batch: 'B-0816-1', date: '08/16', value: 0.62, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 16, isOutlier: true },
          { batch: 'B-0817-1', date: '08/17', value: 0.30, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 16, isOutlier: false },
          { batch: 'B-0818-1', date: '08/18', value: 0.18, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 16, isOutlier: false }
        ]
      }
    }
  },
  {
    productId: 'PROD-600L-NOZZLE',
    productName: '반도체 패키징용 초정밀 디스펜서 슬릿 노즐 바디 (600L)',
    shortName: '600L 디스펜서 노즐',
    metrics: {
      FLATNESS: {
        name: '평면도 (Flatness)',
        unit: '㎛',
        nominal: 0.00,
        ucl: 0.50,
        cl: 0.00,
        lcl: -0.50,
        cp: '1.92',
        cpk: '1.85 (6.3-Sigma)',
        maxRange: 0.80,
        data: [
          { batch: 'B-0810-1', date: '08/10', value: 0.14, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 12, isOutlier: false },
          { batch: 'B-0811-1', date: '08/11', value: 0.18, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 12, isOutlier: false },
          { batch: 'B-0812-1', date: '08/12', value: 0.21, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 12, isOutlier: false },
          { batch: 'B-0813-1', date: '08/13', value: 0.25, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 12, isOutlier: false },
          { batch: 'B-0814-1', date: '08/14', value: 0.29, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 12, isOutlier: false },
          { batch: 'B-0815-1', date: '08/15', value: 0.32, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 12, isOutlier: false },
          { batch: 'B-0816-1', date: '08/16', value: 0.36, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 12, isOutlier: false },
          { batch: 'B-0817-1', date: '08/17', value: 0.30, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 12, isOutlier: false },
          { batch: 'B-0818-1', date: '08/18', value: 0.16, ucl: 0.50, cl: 0.00, lcl: -0.50, sampleCount: 12, isOutlier: false }
        ]
      },
      STRAIGHTNESS: {
        name: '진직도 (Straightness)',
        unit: '㎛',
        nominal: 0.00,
        ucl: 0.40,
        cl: 0.00,
        lcl: -0.40,
        cp: '1.96',
        cpk: '1.89 (6.4-Sigma)',
        maxRange: 0.60,
        data: [
          { batch: 'B-0810-1', date: '08/10', value: 0.10, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 12, isOutlier: false },
          { batch: 'B-0811-1', date: '08/11', value: 0.12, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 12, isOutlier: false },
          { batch: 'B-0812-1', date: '08/12', value: 0.15, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 12, isOutlier: false },
          { batch: 'B-0813-1', date: '08/13', value: 0.18, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 12, isOutlier: false },
          { batch: 'B-0814-1', date: '08/14', value: 0.21, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 12, isOutlier: false },
          { batch: 'B-0815-1', date: '08/15', value: 0.24, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 12, isOutlier: false },
          { batch: 'B-0816-1', date: '08/16', value: 0.27, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 12, isOutlier: false },
          { batch: 'B-0817-1', date: '08/17', value: 0.22, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 12, isOutlier: false },
          { batch: 'B-0818-1', date: '08/18', value: 0.11, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 12, isOutlier: false }
        ]
      },
      PARALLELISM: {
        name: '평행도 (Parallelism)',
        unit: '㎛',
        nominal: 0.00,
        ucl: 0.40,
        cl: 0.00,
        lcl: -0.40,
        cp: '1.98',
        cpk: '1.92 (6.5-Sigma)',
        maxRange: 0.60,
        data: [
          { batch: 'B-0810-1', date: '08/10', value: 0.11, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 12, isOutlier: false },
          { batch: 'B-0811-1', date: '08/11', value: 0.14, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 12, isOutlier: false },
          { batch: 'B-0812-1', date: '08/12', value: 0.16, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 12, isOutlier: false },
          { batch: 'B-0813-1', date: '08/13', value: 0.19, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 12, isOutlier: false },
          { batch: 'B-0814-1', date: '08/14', value: 0.22, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 12, isOutlier: false },
          { batch: 'B-0815-1', date: '08/15', value: 0.26, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 12, isOutlier: false },
          { batch: 'B-0816-1', date: '08/16', value: 0.28, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 12, isOutlier: false },
          { batch: 'B-0817-1', date: '08/17', value: 0.25, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 12, isOutlier: false },
          { batch: 'B-0818-1', date: '08/18', value: 0.12, ucl: 0.40, cl: 0.00, lcl: -0.40, sampleCount: 12, isOutlier: false }
        ]
      }
    }
  }
];

// Helper: Dynamically build precision geometric tolerance SPC dataset linked to an active Order
export function buildProductSpcFromOrder(
  order: Order,
  inspections: InspectionItem[]
): ProductSpcData {
  const nameLower = (order.name || '').toLowerCase();
  let lengthMm = 1200;
  if (nameLower.includes('2000') || nameLower.includes('2m') || nameLower.includes('3p')) {
    lengthMm = 2000;
  } else if (nameLower.includes('1600') || nameLower.includes('2p')) {
    lengthMm = 1600;
  } else if (nameLower.includes('600') || nameLower.includes('디스펜서') || nameLower.includes('노즐')) {
    lengthMm = 600;
  } else if (nameLower.includes('800') || nameLower.includes('심')) {
    lengthMm = 800;
  } else if (nameLower.includes('1200')) {
    lengthMm = 1200;
  }

  // 1. Find matching inspection records
  const matched = inspections.filter(
    (insp) =>
      (insp.orderId && insp.orderId === order.id) ||
      (order.name && insp.productName && (insp.productName.includes(order.name) || order.name.includes(insp.productName)))
  );

  // Extract CMM measured deviations if any
  let realFlatnessDev: number | null = null;
  let realStraightnessDev: number | null = null;
  let realParallelismDev: number | null = null;

  matched.forEach((m) => {
    m.measurements.forEach((item) => {
      const itemTitle = item.item.toLowerCase();
      const numVal = Math.abs(parseFloat(item.deviation) || (item.actual - item.nominal));
      if (itemTitle.includes('평면도') || itemTitle.includes('flatness')) {
        realFlatnessDev = numVal;
      } else if (itemTitle.includes('진직도') || itemTitle.includes('straightness') || itemTitle.includes('립')) {
        realStraightnessDev = numVal;
      } else if (itemTitle.includes('평행도') || itemTitle.includes('두께') || itemTitle.includes('parallelism')) {
        realParallelismDev = numVal;
      }
    });
  });

  // Calculate limits based on size
  const getLimits = (metric: SpcMetricType) => {
    if (metric === 'FLATNESS') {
      const ucl = lengthMm >= 1800 ? 1.50 : lengthMm >= 1400 ? 1.00 : lengthMm >= 1000 ? 0.80 : 0.50;
      return { ucl, cl: 0.00, lcl: -ucl, unit: '㎛', name: '평면도 (Flatness)' };
    } else if (metric === 'STRAIGHTNESS') {
      const ucl = lengthMm >= 1800 ? 1.20 : lengthMm >= 1400 ? 0.80 : lengthMm >= 1000 ? 0.60 : 0.40;
      return { ucl, cl: 0.00, lcl: -ucl, unit: '㎛', name: '진직도 (Straightness)' };
    } else {
      const ucl = lengthMm >= 1800 ? 0.80 : lengthMm >= 1400 ? 0.60 : lengthMm >= 1000 ? 0.50 : 0.40;
      return { ucl, cl: 0.00, lcl: -ucl, unit: '㎛', name: '평행도 (Parallelism)' };
    }
  };

  // Helper to build metric config
  const buildMetric = (metric: SpcMetricType): ProductSpcMetricConfig => {
    const limits = getLimits(metric);
    const ucl = limits.ucl;
    const lcl = limits.lcl;
    const cl = limits.cl;

    // Deterministic pseudo-random seed based on order ID & metric
    const seed = (order.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * (metric.length + 3)) % 100;
    
    // 12 chronological batches
    const batchDates = [
      { batch: 'B-0810-1', date: '08/10' },
      { batch: 'B-0811-1', date: '08/11' },
      { batch: 'B-0812-1', date: '08/12' },
      { batch: 'B-0813-1', date: '08/13' },
      { batch: 'B-0814-1', date: '08/14' },
      { batch: 'B-0815-1', date: '08/15' },
      { batch: 'B-0816-1', date: '08/16' },
      { batch: 'B-0816-2', date: '08/16' },
      { batch: 'B-0817-1', date: '08/17' },
      { batch: 'B-0817-2', date: '08/17' },
      { batch: 'B-0818-1', date: '08/18' },
      { batch: 'B-0818-2', date: '08/18' }
    ];

    const realDev = metric === 'FLATNESS' ? realFlatnessDev : metric === 'STRAIGHTNESS' ? realStraightnessDev : realParallelismDev;

    const data: SpcDataPoint[] = batchDates.map((b, idx) => {
      // Last 2 data points incorporate the real live measurement if available
      if (idx >= batchDates.length - 2 && realDev !== null) {
        const val = idx === batchDates.length - 1 ? Number(realDev.toFixed(2)) : Number((realDev * (0.95 + (seed % 10) * 0.01)).toFixed(2));
        const isOutlier = val > ucl || val < lcl;
        return {
          batch: b.batch,
          date: b.date,
          value: val,
          ucl,
          cl,
          lcl,
          sampleCount: 20 + (seed % 5),
          isOutlier
        };
      }

      // Realistic variation between 30% and 85% of UCL with one occasional outlier on batch 7 if seed > 70
      const factor = 0.35 + (((seed + idx * 7) % 45) / 100);
      let val = Number((ucl * factor).toFixed(2));
      let isOutlier = false;
      if (idx === 7 && (seed % 3 === 0)) {
        val = Number((ucl * 1.18).toFixed(2));
        isOutlier = true;
      }
      return {
        batch: b.batch,
        date: b.date,
        value: val,
        ucl,
        cl,
        lcl,
        sampleCount: 20 + (seed % 5),
        isOutlier
      };
    });

    // Compute Cp, Cpk
    const values = data.map((d) => d.value);
    const mean = values.reduce((acc, v) => acc + v, 0) / values.length;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (values.length - 1 || 1);
    const stdDev = Math.max(0.02, Math.sqrt(variance));

    const cpNum = (ucl - lcl) / (6 * stdDev);
    const cpkNum = Math.min((ucl - mean) / (3 * stdDev), (mean - lcl) / (3 * stdDev));

    const cp = cpNum.toFixed(2);
    const cpk = `${cpkNum.toFixed(2)} (${cpkNum >= 1.67 ? '6-Sigma' : cpkNum >= 1.33 ? '5.5-Sigma' : '4-Sigma'})`;
    const maxRange = Math.max(ucl * 1.4, ...values.map((v) => Math.abs(v) * 1.15), 1.0);

    return {
      name: limits.name,
      unit: limits.unit,
      nominal: 0.00,
      ucl,
      cl,
      lcl,
      cp,
      cpk,
      maxRange,
      data
    };
  };

  // Derive customer name if mentioned in order name
  let customerName = '고객사 협의 수주건';
  if (order.name.includes('삼성SDI')) customerName = '삼성SDI 천안사업장';
  else if (order.name.includes('LG디스플레이')) customerName = 'LG디스플레이 파주사업장';
  else if (order.name.includes('SK온')) customerName = 'SK온 서산공장';
  else if (order.name.includes('현대모비스')) customerName = '현대모비스 의왕연구소';
  else if (order.name.includes('SK하이닉스')) customerName = 'SK하이닉스 이천캠퍼스';

  const latestResult = matched.length > 0
    ? (matched[0].result === 'PASS' ? '합격 (PASS)' : matched[0].result === 'FAIL' ? '불합격 (FAIL)' : '재검사 (REINSPECT)')
    : 'CMM 검사 대기중';

  return {
    productId: order.id,
    productName: `[${order.status === 'COMPLETED' ? '완료' : '진행중'}] ${order.id}: ${order.name}`,
    shortName: order.name,
    orderId: order.id,
    orderStatus: order.status || 'IN_PROGRESS',
    orderQty: order.qty || 1,
    customer: customerName,
    mctMachine: order.mctMachine || 'MCT 가공라인',
    startDate: order.startDate ? order.startDate.slice(0, 10) : '2026-03-01',
    isOrderLinked: true,
    matchedInspectionCount: matched.length,
    latestCmmResult: latestResult,
    metrics: {
      FLATNESS: buildMetric('FLATNESS'),
      STRAIGHTNESS: buildMetric('STRAIGHTNESS'),
      PARALLELISM: buildMetric('PARALLELISM')
    }
  };
}

const CERTIFIED_INSPECTORS = [
  '김준성 책임연구원 (KOLAS 공인)',
  '이영희 선임연구원',
  '박철수 주임연구원',
  '최민지 선임연구원',
  '전민우 선임연구원 (MW.Jeon)',
  '김성훈 연구원 (SH.Kim)'
];

const QA_MANAGERS = [
  '이준혁 품질보증총괄이사',
  '김승현 QA부서장',
  '박진우 품질책임자',
  '정동원 품질본부장'
];

const SHIPPING_PROJECTS: ShippingProjectItem[] = [
  {
    id: 'SHP-2026-001',
    orderId: 'ORD-2026-0811-001',
    orderName: '2차전지 양극재 코팅용 고점도 슬롯다이 세트 (1200L)',
    customer: '삼성SDI 천안사업장 차세대배터리라인',
    productSpec: 'Slot Die Set 1200L (Upper + Lower Body + Shim 50㎛)',
    lotNo: 'LOT-260519-SDI01',
    cmmStatus: 'PASS',
    roughnessStatus: 'PASS',
    roughnessValue: 'Ra 0.016㎛',
    coatingStatus: 'PASS',
    coatingValue: 'Hard Chrome 15.2㎛',
    cleaningStatus: 'PASS',
    shippingStatus: 'APPROVED',
    coaNo: 'COA-2026-0818-0091',
    issueDate: '2026-08-18',
    material: 'SUS420J2 (진공열처리 HRC 54±2)',
    hardness: 'HRC 54.5',
    inspector: '김준성 책임연구원 (KOLAS 공인)',
    qaManager: '이준혁 품질보증총괄이사',
    checklist: {
      cmmPointScan: true,
      roughnessInterferometer: true,
      boltInterference: true,
      ultrasonicCleaning: true,
      cleanroomPackaging: true
    }
  },
  {
    id: 'SHP-2026-002',
    orderId: 'ORD-2026-0811-002',
    orderName: '디스플레이 광학 코팅용 슬롯다이 하부 바디 (1600L)',
    customer: 'LG디스플레이 파주공장 OLED 생산라인',
    productSpec: 'Wide Slot Die Lower Body 1600L (Mirror Finished)',
    lotNo: 'LOT-260519-LGD02',
    cmmStatus: 'PASS',
    roughnessStatus: 'PASS',
    roughnessValue: 'Ra 0.014㎛',
    coatingStatus: 'PASS',
    coatingValue: 'DLC Coating 2.5㎛',
    cleaningStatus: 'PASS',
    shippingStatus: 'PENDING',
    coaNo: 'COA-2026-0818-0092',
    issueDate: '2026-08-18',
    material: 'SUS420J2 (HRC 55±1)',
    hardness: 'HRC 55.2',
    inspector: '이영희 선임연구원',
    qaManager: '이준혁 품질보증총괄이사',
    checklist: {
      cmmPointScan: true,
      roughnessInterferometer: true,
      boltInterference: true,
      ultrasonicCleaning: true,
      cleanroomPackaging: false
    }
  },
  {
    id: 'SHP-2026-003',
    orderId: 'ORD-2026-0811-003',
    orderName: '수소연료전지 전해질막 초정밀 심 플레이트 (800L)',
    customer: '현대모비스 의왕연구소 수소연료전지팀',
    productSpec: 'Precision Shim Plate 800L (Thickness 0.050mm ±0.5㎛)',
    lotNo: 'LOT-260519-HM03',
    cmmStatus: 'FAIL',
    roughnessStatus: 'PASS',
    roughnessValue: 'Ra 0.019㎛',
    coatingStatus: 'PASS',
    coatingValue: '무전해 니켈도금 5.0㎛',
    cleaningStatus: 'PENDING',
    shippingStatus: 'REJECTED',
    coaNo: 'COA-2026-0818-0093',
    issueDate: '2026-08-18',
    material: 'SUS304-CSP 1/2H',
    hardness: 'HV 380',
    inspector: '박철수 주임연구원',
    qaManager: '이준혁 품질보증총괄이사',
    checklist: {
      cmmPointScan: false,
      roughnessInterferometer: true,
      boltInterference: false,
      ultrasonicCleaning: false,
      cleanroomPackaging: false
    }
  }
];

// ============================================================================
// 3. MAIN COMPONENT
// ============================================================================

interface QualityInspectionViewProps {
  orders?: Record<string, Order>;
  scheduledTasks?: ScheduledTaskItem[];
  currentUser?: User | null;
  approvedOperators?: string[];
  usersList?: User[];
}

export const QualityInspectionView: React.FC<QualityInspectionViewProps> = ({
  orders,
  scheduledTasks,
  currentUser,
  approvedOperators = [],
  usersList = []
}) => {
  // Quality Stage Hierarchy: IQC -> IPQC -> OQC
  const [qualityStage, setQualityStage] = useState<'IQC' | 'IPQC' | 'OQC'>('IQC');

  // Navigation Tabs: IQC, IPQC 2 tabs, OQC 2 tabs (including Slot Die Certificate)
  const [activeTab, setActiveTab] = useState<
    'TAB_IQC' | 'TAB1_IPQC_CMM' | 'TAB2_SPC_ANALYSIS' | 'TAB_SLOT_DIE_COA' | 'TAB3_SHIPPING_COA'
  >('TAB_IQC');

  // KPI Modal Detail View State
  const [selectedKpiModal, setSelectedKpiModal] = useState<
    'DAILY_COUNT' | 'YIELD' | 'DEFECTS' | 'CAPA' | 'INSPECT_TIME' | 'CMM_UTILIZATION' | null
  >(null);

  const currentUserName = currentUser?.name?.trim() || '';
  const currentUserTitle = currentUser ? `${currentUser.name} (${currentUser.role === 'ADMIN' ? 'QA 총괄/관리자' : '품질 검사원'})` : '';

  // Registered project names from active orders
  const registeredProjects = useMemo(() => {
    if (!orders) return [];
    return Array.from(new Set(Object.values(orders).map((o) => o.name).filter(Boolean)));
  }, [orders]);

  // Inspector options: ONLY registered approved field operators (role !== 'ADMIN')
  const approvedInspectors = useMemo(() => {
    const list: string[] = [];

    // 1. Add current user if field operator (not admin)
    if (currentUser && currentUser.role !== 'ADMIN' && currentUserName) {
      list.push(currentUserName);
    }

    // 2. Add DB registered approved field operators
    if (usersList && usersList.length > 0) {
      usersList
        .filter((u) => u.name && u.role !== 'ADMIN' && u.isApproved !== false)
        .forEach((u) => {
          const name = u.name.trim();
          if (name && !list.includes(name)) list.push(name);
        });
    }

    // 3. Add approvedOperators (which are non-admin operators)
    if (approvedOperators && approvedOperators.length > 0) {
      approvedOperators.forEach((op) => {
        const name = op.trim();
        if (name && !list.includes(name)) list.push(name);
      });
    }

    return Array.from(new Set(list.filter(Boolean)));
  }, [currentUser, currentUserName, usersList, approvedOperators]);

  // QA Manager options: ONLY registered ADMIN users
  const approvedQaManagers = useMemo(() => {
    const list: string[] = [];

    // 1. Add current user if ADMIN
    if (currentUser?.role === 'ADMIN' && currentUserName) {
      list.push(currentUserName);
    }

    // 2. Add DB registered admin users
    if (usersList && usersList.length > 0) {
      usersList
        .filter((u) => u.name && u.role === 'ADMIN' && u.isApproved !== false)
        .forEach((u) => {
          const name = u.name.trim();
          if (name && !list.includes(name)) list.push(name);
        });
    }

    return Array.from(new Set(list.filter(Boolean)));
  }, [currentUser, currentUserName, usersList]);

  // IQC State & Sync
  const [iqcLots, setIqcLots] = useState<IqcLotItem[]>(DEFAULT_IQC_LOTS);
  const [iqcFilterArchive, setIqcFilterArchive] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');

  // TAB 1 State (IPQC CMM)
  const [inspections, setInspections] = useState<InspectionItem[]>(DEFAULT_INSPECTION_DATA);
  const [selectedInspection, setSelectedInspection] = useState<InspectionItem>(DEFAULT_INSPECTION_DATA[0]);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [searchLine, setSearchLine] = useState<string>('ALL');
  const [searchResult, setSearchResult] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // IPQC Modals & CRUD
  const [ipqcFilterArchive, setIpqcFilterArchive] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [isNewIpqcModalOpen, setIsNewIpqcModalOpen] = useState<boolean>(false);
  const [isIpqcPrintModalOpen, setIsIpqcPrintModalOpen] = useState<boolean>(false);
  const [isIpqcEditMode, setIsIpqcEditMode] = useState<boolean>(false);
  const [ipqcEditBuffer, setIpqcEditBuffer] = useState<InspectionItem | null>(null);

  // IQC Detail Modal State
  const [isIqcModalOpen, setIsIqcModalOpen] = useState<boolean>(false);
  const [selectedIqcLotId, setSelectedIqcLotId] = useState<string | undefined>(undefined);

  // 3D Viewer Interactive OrbitControls (Mouse drag & Wheel zoom)
  const [rotX, setRotX] = useState<number>(20);
  const [rotY, setRotY] = useState<number>(-35);
  const [zoom, setZoom] = useState<number>(1);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [is3DDragging, setIs3DDragging] = useState<boolean>(false);

  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; rotX: number; rotY: number }>({
    x: 0,
    y: 0,
    rotX: 20,
    rotY: -35
  });

  const handle3DMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    setIs3DDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      rotX,
      rotY
    };
  };

  const handle3DMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setRotY(dragStartRef.current.rotY + deltaX * 0.6);
    setRotX(Math.max(-80, Math.min(80, dragStartRef.current.rotX - deltaY * 0.6)));
  };

  const handle3DMouseUp = () => {
    isDraggingRef.current = false;
    setIs3DDragging(false);
  };

  const handle3DTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      setIs3DDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        rotX,
        rotY
      };
    }
  };

  const handle3DTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - dragStartRef.current.x;
    const deltaY = e.touches[0].clientY - dragStartRef.current.y;
    setRotY(dragStartRef.current.rotY + deltaX * 0.6);
    setRotX(Math.max(-80, Math.min(80, dragStartRef.current.rotX - deltaY * 0.6)));
  };

  const handle3DTouchEnd = () => {
    isDraggingRef.current = false;
    setIs3DDragging(false);
  };

  const handle3DWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setZoom((prev) => Math.max(0.5, Math.min(2.5, prev - e.deltaY * 0.0015)));
  };

  const reset3DView = () => {
    setRotX(20);
    setRotY(-35);
    setZoom(1);
    showToast('info', '3D 뷰어가 기본 시점으로 초기화되었습니다.');
  };

  // Dynamic Product SPC Dataset linked with real customer active orders (orders prop) & inspections
  const productSpcList = useMemo<ProductSpcData[]>(() => {
    if (orders && Object.keys(orders).length > 0) {
      const orderItems = Object.values(orders);
      const sortedOrders = [...orderItems].sort((a, b) => {
        if (!a.archived && b.archived) return -1;
        if (a.archived && !b.archived) return 1;
        if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;
        if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
        return a.id.localeCompare(b.id);
      });

      const generated = sortedOrders.map((ord) => buildProductSpcFromOrder(ord, inspections));
      if (generated.length > 0) {
        return generated;
      }
    }
    return PRODUCT_SPC_DATASET;
  }, [orders, inspections]);

  // TAB 2 SPC State (Product-based & Geometric tolerances)
  const [selectedSpcProductId, setSelectedSpcProductId] = useState<string>(() => {
    if (orders && Object.keys(orders).length > 0) {
      const firstActive =
        Object.values(orders).find((o) => !o.archived && o.status !== 'COMPLETED') ||
        Object.values(orders)[0];
      if (firstActive) return firstActive.id;
    }
    return 'PROD-1200L-UPPER';
  });
  const [spcMetric, setSpcMetric] = useState<SpcMetricType>('FLATNESS');

  // Keep selectedSpcProductId in sync with available products
  useEffect(() => {
    if (productSpcList.length > 0) {
      const exists = productSpcList.some((p) => p.productId === selectedSpcProductId);
      if (!exists) {
        setSelectedSpcProductId(productSpcList[0].productId);
      }
    }
  }, [productSpcList, selectedSpcProductId]);

  // CAPA Interactivity state
  const [activeCapaStep, setActiveCapaStep] = useState<number>(3);
  const [isCapaEditMode, setIsCapaEditMode] = useState<boolean>(false);
  const [capaBuffer, setCapaBuffer] = useState<CapaLifeCycle | null>(null);

  // TAB 3 Shipping & COA State
  const [shippingProjects, setShippingProjects] = useState<ShippingProjectItem[]>(SHIPPING_PROJECTS);
  const [selectedShipping, setSelectedShipping] = useState<ShippingProjectItem>(SHIPPING_PROJECTS[0]);
  const [shippingFilterArchive, setShippingFilterArchive] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [isNewShippingModalOpen, setIsNewShippingModalOpen] = useState<boolean>(false);
  const [isShippingPrintModalOpen, setIsShippingPrintModalOpen] = useState<boolean>(false);
  const [isShippingEditMode, setIsShippingEditMode] = useState<boolean>(false);
  const [shippingEditBuffer, setShippingEditBuffer] = useState<ShippingProjectItem | null>(null);

  // Toast Notification
  const [toast, setToast] = useState<{ type: 'success' | 'warning' | 'info'; message: string; subMessage?: string } | null>(null);

  const showToast = (type: 'success' | 'warning' | 'info', message: string, subMessage?: string) => {
    setToast({ type, message, subMessage });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Dynamic Pareto Defects calculation based on actual inspections data & quality metrics
  const paretoDefectStats = useMemo(() => {
    const counts: Record<string, number> = {
      '립 토출구 간격 편차 (Lip Gap)': 0,
      '경면부 진직도/평면도 초과 (Flatness/Straightness)': 0,
      '볼트 체결 홀 피치 공차 초과 (Hole Pitch)': 0,
      '경면부 표면 조도 미달 (Roughness)': 0,
      '열처리 후 잔류응력 휨 (Thermal Deflection)': 0
    };

    // Historical base count + real live inspection items
    counts['립 토출구 간격 편차 (Lip Gap)'] = 22;
    counts['경면부 진직도/평면도 초과 (Flatness/Straightness)'] = 15;
    counts['볼트 체결 홀 피치 공차 초과 (Hole Pitch)'] = 8;
    counts['경면부 표면 조도 미달 (Roughness)'] = 5;
    counts['열처리 후 잔류응력 휨 (Thermal Deflection)'] = 3;

    inspections.forEach((insp) => {
      if (insp.result === 'FAIL' || insp.result === 'REINSPECT') {
        insp.measurements.forEach((m) => {
          if (m.status === 'NG') {
            const itemLower = m.item.toLowerCase();
            if (itemLower.includes('립') || itemLower.includes('gap') || itemLower.includes('토출') || itemLower.includes('간격')) {
              counts['립 토출구 간격 편차 (Lip Gap)'] += 1;
            } else if (itemLower.includes('평면도') || itemLower.includes('진직도') || itemLower.includes('flatness') || itemLower.includes('심 두께')) {
              counts['경면부 진직도/평면도 초과 (Flatness/Straightness)'] += 1;
            } else if (itemLower.includes('홀') || itemLower.includes('pitch') || itemLower.includes('볼트') || itemLower.includes('단차')) {
              counts['볼트 체결 홀 피치 공차 초과 (Hole Pitch)'] += 1;
            } else if (itemLower.includes('조도') || itemLower.includes('roughness')) {
              counts['경면부 표면 조도 미달 (Roughness)'] += 1;
            } else {
              counts['열처리 후 잔류응력 휨 (Thermal Deflection)'] += 1;
            }
          }
        });
      }
    });

    const colors = ['#f43f5e', '#fb923c', '#facc15', '#38bdf8', '#a855f7'];
    const total = Object.values(counts).reduce((acc, c) => acc + c, 0) || 1;
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count], idx) => {
        const percent = Number(((count / total) * 100).toFixed(1));
        return { type, count, percent, color: colors[idx % colors.length], cumPercent: 0 };
      });

    let runningCum = 0;
    sorted.forEach((item) => {
      runningCum += item.percent;
      item.cumPercent = Number(Math.min(100, runningCum).toFixed(1));
    });

    return {
      items: sorted,
      totalDefects: total
    };
  }, [inspections]);

  // Filtered IPQC Inspection List for Tab 1
  const filteredInspections = useMemo(() => {
    return inspections.filter((item) => {
      const isArchived = Boolean(item.isArchived);
      if (ipqcFilterArchive === 'ARCHIVED' && !isArchived) return false;
      if (ipqcFilterArchive === 'ACTIVE' && isArchived) return false;
      if (searchLine !== 'ALL' && !item.line.includes(searchLine)) return false;
      if (searchResult !== 'ALL' && item.result !== searchResult) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = item.id.toLowerCase().includes(q);
        const matchName = item.productName.toLowerCase().includes(q);
        const matchCustomer = item.customer.toLowerCase().includes(q);
        const matchLot = item.lotNo.toLowerCase().includes(q);
        if (!matchId && !matchName && !matchCustomer && !matchLot) return false;
      }
      return true;
    });
  }, [inspections, ipqcFilterArchive, searchLine, searchResult, searchQuery]);

  const activeIpqcCount = useMemo(() => inspections.filter((i) => !i.isArchived).length, [inspections]);
  const archivedIpqcCount = useMemo(() => inspections.filter((i) => Boolean(i.isArchived)).length, [inspections]);

  // Filtered Shipping List for Tab 3
  const filteredShippingProjects = useMemo(() => {
    return shippingProjects.filter((item) => {
      const isArchived = Boolean(item.isArchived);
      if (shippingFilterArchive === 'ARCHIVED' && !isArchived) return false;
      if (shippingFilterArchive === 'ACTIVE' && isArchived) return false;
      return true;
    });
  }, [shippingProjects, shippingFilterArchive]);

  const activeShippingCount = useMemo(() => shippingProjects.filter((s) => !s.isArchived).length, [shippingProjects]);
  const archivedShippingCount = useMemo(() => shippingProjects.filter((s) => Boolean(s.isArchived)).length, [shippingProjects]);

  // Filtered IQC Lots for IQC Tab
  const filteredIqcLots = useMemo(() => {
    return iqcLots.filter((lot) => {
      const isArchived = Boolean(lot.isArchived);
      if (iqcFilterArchive === 'ARCHIVED' && !isArchived) return false;
      if (iqcFilterArchive === 'ACTIVE' && isArchived) return false;
      return true;
    });
  }, [iqcLots, iqcFilterArchive]);

  const activeIqcCount = useMemo(() => iqcLots.filter((l) => !l.isArchived).length, [iqcLots]);
  const archivedIqcCount = useMemo(() => iqcLots.filter((l) => Boolean(l.isArchived)).length, [iqcLots]);

  const currentIpqcDisplay = isIpqcEditMode && ipqcEditBuffer ? ipqcEditBuffer : selectedInspection;

  // Selection Handler for IPQC
  const handleSelectInspection = (item: InspectionItem) => {
    setSelectedInspection(item);
    setSelectedPointIndex(null);
    setIsIpqcEditMode(false);
    setIpqcEditBuffer(null);
    setIsCapaEditMode(false);
    setCapaBuffer(null);
    setActiveCapaStep(item.capa?.step || 1);
  };

  // --- IPQC Handlers ---
  const handleAddIpqc = (newItem: InspectionItem) => {
    setInspections((prev) => [newItem, ...prev]);
    setSelectedInspection(newItem);
    setSelectedPointIndex(null);
    setActiveCapaStep(newItem.capa?.step || 1);
    showToast('success', '✅ 신규 공정검사 등록 완료', `검사 ID [${newItem.id}] 가 큐에 추가되었습니다.`);
  };

  const handleDeleteIpqc = (itemId: string) => {
    if (confirm(`정말 검사 항목 [${itemId}] 을(를) 삭제하시겠습니까?`)) {
      setInspections((prev) => {
        const remaining = prev.filter((i) => i.id !== itemId);
        if (selectedInspection.id === itemId && remaining.length > 0) {
          setSelectedInspection(remaining[0]);
          setActiveCapaStep(remaining[0].capa?.step || 1);
        }
        return remaining;
      });
      showToast('info', '🗑️ 검사 항목 삭제 완료', `검사 [${itemId}] 가 성공적으로 삭제되었습니다.`);
    }
  };

  const handleToggleArchiveIpqc = (itemId: string) => {
    setInspections((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          const updatedState = !i.isArchived;
          if (selectedInspection.id === itemId) {
            setSelectedInspection({ ...i, isArchived: updatedState });
          }
          showToast(
            'info',
            updatedState ? '📁 보관함으로 이동되었습니다.' : '📦 보관함에서 복원되었습니다.',
            `검사 [${i.id}]`
          );
          return { ...i, isArchived: updatedState };
        }
        return i;
      })
    );
  };

  const handleStartIpqcEdit = () => {
    setIpqcEditBuffer(JSON.parse(JSON.stringify(selectedInspection)));
    setIsIpqcEditMode(true);
  };

  const handleSaveIpqcEdit = () => {
    if (!ipqcEditBuffer) return;
    const hasNg = ipqcEditBuffer.measurements.some((m) => m.status === 'NG');
    const finalResult = hasNg ? 'FAIL' : 'PASS';
    const finalItem: InspectionItem = {
      ...ipqcEditBuffer,
      result: finalResult,
      defectType: finalResult === 'PASS' ? undefined : (ipqcEditBuffer.defectType || '규격 공차 초과')
    };

    setInspections((prev) =>
      prev.map((i) => (i.id === finalItem.id ? finalItem : i))
    );
    setSelectedInspection(finalItem);
    setIsIpqcEditMode(false);
    setIpqcEditBuffer(null);

    if (finalResult === 'PASS') {
      showToast('success', '🎉 공정검사 판정: [PASS] 합격 갱신 완료', `검사 [${finalItem.id}] 모든 측정값이 허용 공차 범위 내에 진입하여 PASS로 즉시 갱신되었습니다.`);
    } else {
      showToast('warning', '⚠️ 공정검사 판정: [FAIL] 불합격 유지', `검사 [${finalItem.id}] 에 허용 공차를 벗어난 포인트(NG)가 존재합니다.`);
    }
  };

  const handleCancelIpqcEdit = () => {
    setIpqcEditBuffer(null);
    setIsIpqcEditMode(false);
  };

  const handleUpdateIpqcBufferMeasurement = (index: number, field: keyof MeasurementPoint, val: any) => {
    if (!ipqcEditBuffer) return;
    const nextMeasurements = [...ipqcEditBuffer.measurements];
    const target = { ...nextMeasurements[index], [field]: val };

    if (field === 'actual' || field === 'nominal' || field === 'tolerance') {
      const nom = field === 'nominal' ? Number(val) : target.nominal;
      const act = field === 'actual' ? Number(val) : target.actual;
      const tol = field === 'tolerance' ? String(val) : target.tolerance;
      const { deviation, status } = evaluateMeasurementStatus(act, nom, tol);
      target.deviation = deviation;
      target.status = status;
    }

    nextMeasurements[index] = target;
    const hasNg = nextMeasurements.some((m) => m.status === 'NG');
    const updatedResult = hasNg ? 'FAIL' : 'PASS';

    setIpqcEditBuffer({
      ...ipqcEditBuffer,
      result: updatedResult,
      defectType: updatedResult === 'PASS' ? undefined : (ipqcEditBuffer.defectType || '규격 공차 초과'),
      measurements: nextMeasurements
    });
  };

  const handleAddIpqcMeasurementPoint = () => {
    if (!ipqcEditBuffer) return;
    const newNo = ipqcEditBuffer.measurements.length + 1;
    const newPoint: MeasurementPoint = {
      no: newNo,
      code: `P${newNo}`,
      item: `추가 정밀 측정 포인트 #${newNo}`,
      nominal: 50.00,
      actual: 50.05,
      tolerance: '±0.80',
      deviation: '+0.05',
      unit: '㎛',
      status: 'OK',
      pos3D: { x: 0, y: 0, z: 0 }
    };
    const nextMeasurements = [...ipqcEditBuffer.measurements, newPoint];
    const hasNg = nextMeasurements.some((m) => m.status === 'NG');
    const updatedResult = hasNg ? 'FAIL' : 'PASS';

    setIpqcEditBuffer({
      ...ipqcEditBuffer,
      result: updatedResult,
      measurements: nextMeasurements
    });
  };

  const handleDeleteIpqcMeasurementPoint = (index: number) => {
    if (!ipqcEditBuffer) return;
    const next = ipqcEditBuffer.measurements.filter((_, idx) => idx !== index);
    const hasNg = next.some((m) => m.status === 'NG');
    const updatedResult = hasNg ? 'FAIL' : 'PASS';

    setIpqcEditBuffer({
      ...ipqcEditBuffer,
      result: updatedResult,
      measurements: next
    });
  };

  // --- CAPA Interactivity Handlers ---
  const handleStartCapaEdit = () => {
    setCapaBuffer(JSON.parse(JSON.stringify(selectedInspection.capa)));
    setIsCapaEditMode(true);
  };

  const handleSaveCapaEdit = () => {
    if (!capaBuffer) return;
    const updatedInspection: InspectionItem = {
      ...selectedInspection,
      capa: capaBuffer
    };
    setInspections((prev) =>
      prev.map((i) => (i.id === updatedInspection.id ? updatedInspection : i))
    );
    setSelectedInspection(updatedInspection);
    setActiveCapaStep(capaBuffer.step);
    setIsCapaEditMode(false);
    setCapaBuffer(null);
    showToast('success', '💾 CAPA 시정 조치 내역 저장 완료', `검사 [${updatedInspection.id}] CAPA 단계 및 기록이 저장되었습니다.`);
  };

  const handleCancelCapaEdit = () => {
    setCapaBuffer(null);
    setIsCapaEditMode(false);
  };

  const handleUpdateCapaField = (stageKey: keyof CapaLifeCycle, fieldKey: string, value: any) => {
    if (!capaBuffer) return;
    if (stageKey === 'step') {
      setCapaBuffer({ ...capaBuffer, step: Number(value) });
      return;
    }
    const currentStageObj = (capaBuffer as any)[stageKey] || {};
    setCapaBuffer({
      ...capaBuffer,
      [stageKey]: {
        ...currentStageObj,
        [fieldKey]: value
      }
    });
  };

  // --- Shipping (OQC) Handlers ---
  const handleAddShipping = (newShipping: ShippingProjectItem) => {
    setShippingProjects((prev) => [newShipping, ...prev]);
    setSelectedShipping(newShipping);
    showToast('success', '✅ 신규 출하 프로젝트 등록 완료', `수주 [${newShipping.orderName}] 출하 큐 생성`);
  };

  const handleDeleteShipping = (shippingId: string) => {
    if (confirm(`정말 출하 프로젝트 [${shippingId}] 을(를) 삭제하시겠습니까?`)) {
      setShippingProjects((prev) => {
        const remaining = prev.filter((s) => s.id !== shippingId);
        if (selectedShipping.id === shippingId && remaining.length > 0) {
          setSelectedShipping(remaining[0]);
        }
        return remaining;
      });
      showToast('info', '🗑️ 출하 프로젝트 삭제 완료', `출하 [${shippingId}] 가 성공적으로 삭제되었습니다.`);
    }
  };

  const handleToggleArchiveShipping = (shippingId: string) => {
    setShippingProjects((prev) =>
      prev.map((s) => {
        if (s.id === shippingId) {
          const updated = !s.isArchived;
          if (selectedShipping.id === shippingId) {
            setSelectedShipping({ ...s, isArchived: updated });
          }
          showToast(
            'info',
            updated ? '📁 출하 보관함으로 이동되었습니다.' : '📦 출하 목록으로 복원되었습니다.',
            `출하 [${s.orderName}]`
          );
          return { ...s, isArchived: updated };
        }
        return s;
      })
    );
  };

  const handleStartShippingEdit = () => {
    setShippingEditBuffer(JSON.parse(JSON.stringify(selectedShipping)));
    setIsShippingEditMode(true);
  };

  const handleSaveShippingEdit = () => {
    if (!shippingEditBuffer) return;
    setShippingProjects((prev) =>
      prev.map((s) => (s.id === shippingEditBuffer.id ? shippingEditBuffer : s))
    );
    setSelectedShipping(shippingEditBuffer);
    setIsShippingEditMode(false);
    showToast('success', '💾 출하 검사값 및 사양 수정 완료', `수주 [${shippingEditBuffer.orderName}] 성적서가 갱신되었습니다.`);
  };

  const handleCancelShippingEdit = () => {
    setShippingEditBuffer(null);
    setIsShippingEditMode(false);
  };

  const handlePrintCOA = () => {
    setIsShippingPrintModalOpen(true);
  };

  // Action: Approve Shipping
  const handleApproveShipping = () => {
    setShippingProjects((prev) =>
      prev.map((item) =>
        item.id === selectedShipping.id
          ? { ...item, shippingStatus: 'APPROVED', checklist: { ...item.checklist, cleanroomPackaging: true } }
          : item
      )
    );
    setSelectedShipping((prev) => ({
      ...prev,
      shippingStatus: 'APPROVED',
      checklist: { ...prev.checklist, cleanroomPackaging: true }
    }));
    showToast('success', '📦 출하 검수가 최종 승인되었습니다.', `수주 [${selectedShipping.orderName}]의 출하 승인서(COA)가 공식 발급되었습니다.`);
  };

  // Action: Reject Shipping
  const handleRejectShipping = () => {
    setShippingProjects((prev) =>
      prev.map((item) =>
        item.id === selectedShipping.id ? { ...item, shippingStatus: 'REJECTED' } : item
      )
    );
    setSelectedShipping((prev) => ({ ...prev, shippingStatus: 'REJECTED' }));
    showToast('warning', '🚨 품질 부적합으로 출하가 보류/반려되었습니다.', `수주 [${selectedShipping.orderName}]가 긴급 재가공/재검사큐로 이동되었습니다.`);
  };

  return (
    <div id="quality-cmm-dashboard" className="space-y-4 pb-12 select-none">
      {/* ==================================================================== */}
      {/* 0. FLOATING TOAST NOTIFICATION                                       */}
      {/* ==================================================================== */}
      {toast && (
        <div
          id="quality-toast-banner"
          className={`fixed top-5 right-5 z-50 max-w-md p-4 rounded-2xl shadow-2xl border flex items-start gap-3 animate-in slide-in-from-top-4 duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-900/95 text-emerald-50 border-emerald-500 shadow-emerald-950/40'
              : toast.type === 'warning'
              ? 'bg-rose-900/95 text-rose-50 border-rose-500 shadow-rose-950/40'
              : 'bg-slate-900/95 text-slate-50 border-blue-500 shadow-slate-950/40'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : toast.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <p className="font-black text-sm">{toast.message}</p>
            {toast.subMessage && <p className="opacity-85 mt-0.5">{toast.subMessage}</p>}
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-white/60 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. TOP COMMON KPI CARDS (6 CARDS) - Interactive Modal View Enabled    */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: 금일 검사 건수 */}
        <div
          id="kpi-card-daily-count"
          onClick={() => setSelectedKpiModal('DAILY_COUNT')}
          className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 transition-colors">
              금일 검사 건수
            </span>
            <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              1,480 <span className="text-xs font-bold text-slate-500">건</span>
            </div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between mt-0.5">
              <span>▲ 145건 (전일 대비)</span>
              <span className="text-[10px] text-blue-500 font-normal">상세 ➔</span>
            </div>
          </div>
        </div>

        {/* KPI 2: 합격률 */}
        <div
          id="kpi-card-yield"
          onClick={() => setSelectedKpiModal('YIELD')}
          className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 transition-colors">
              합격률 (Yield)
            </span>
            <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              99.4 <span className="text-xs font-bold text-slate-500">%</span>
            </div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between mt-0.5">
              <span>▲ 0.4% (목표 99.0%)</span>
              <span className="text-[10px] text-emerald-500 font-normal">상세 ➔</span>
            </div>
          </div>
        </div>

        {/* KPI 3: 불량 건수 */}
        <div
          id="kpi-card-defects"
          onClick={() => setSelectedKpiModal('DEFECTS')}
          className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-rose-500 dark:hover:border-rose-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-rose-600 transition-colors">
              불량 건수
            </span>
            <div className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              8 <span className="text-xs font-bold text-slate-500">건</span>
            </div>
            <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center justify-between mt-0.5">
              <span>▼ 3건 감소 (개선세)</span>
              <span className="text-[10px] text-rose-500 font-normal">상세 ➔</span>
            </div>
          </div>
        </div>

        {/* KPI 4: 재검사 건수 */}
        <div
          id="kpi-card-capa"
          onClick={() => setSelectedKpiModal('CAPA')}
          className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-amber-500 dark:hover:border-amber-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-amber-600 transition-colors">
              재검사 (CAPA)
            </span>
            <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 group-hover:scale-110 transition-transform">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              12 <span className="text-xs font-bold text-slate-500">건</span>
            </div>
            <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between mt-0.5">
              <span>4건 진행중 (8건 해결)</span>
              <span className="text-[10px] text-amber-500 font-normal">상세 ➔</span>
            </div>
          </div>
        </div>

        {/* KPI 5: 평균 검사 시간 */}
        <div
          id="kpi-card-inspect-time"
          onClick={() => setSelectedKpiModal('INSPECT_TIME')}
          className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 transition-colors">
              평균 검사 시간
            </span>
            <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              24.5 <span className="text-xs font-bold text-slate-500">분</span>
            </div>
            <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between mt-0.5">
              <span>초정밀 CMM 스캔</span>
              <span className="text-[10px] text-indigo-500 font-normal">상세 ➔</span>
            </div>
          </div>
        </div>

        {/* KPI 6: CMM 가동률 */}
        <div
          id="kpi-card-cmm-util"
          onClick={() => setSelectedKpiModal('CMM_UTILIZATION')}
          className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-teal-500 dark:hover:border-teal-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-teal-600 transition-colors">
              CMM 가동률
            </span>
            <div className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 group-hover:scale-110 transition-transform">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-teal-600 dark:text-teal-400 tracking-tight">
              95.2 <span className="text-xs font-bold text-slate-500">%</span>
            </div>
            <div className="text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center justify-between mt-0.5">
              <span>2기 정상 운용중</span>
              <span className="text-[10px] text-teal-500 font-normal">상세 ➔</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. QUALITY PROCESS TREE NAVIGATION (IQC -> IPQC -> OQC)              */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        {/* Level 1: Quality Stages Hierarchy */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00A396]" />
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              품질 관리 프로세스 (IQC ➔ IPQC ➔ OQC)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setQualityStage('IQC');
                setActiveTab('TAB_IQC');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                qualityStage === 'IQC'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>1. 수입검사 (IQC)</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

            <button
              onClick={() => {
                setQualityStage('IPQC');
                if (activeTab !== 'TAB1_IPQC_CMM' && activeTab !== 'TAB2_SPC_ANALYSIS') {
                  setActiveTab('TAB1_IPQC_CMM');
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                qualityStage === 'IPQC'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>2. 공정검사 (IPQC)</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

            <button
              onClick={() => {
                setQualityStage('OQC');
                if (activeTab !== 'TAB_SLOT_DIE_COA' && activeTab !== 'TAB3_SHIPPING_COA') {
                  setActiveTab('TAB_SLOT_DIE_COA');
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                qualityStage === 'OQC'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>3. 출하검사 (OQC / 성적서)</span>
            </button>
          </div>
        </div>

        {/* Level 2: Sub-views based on selected quality stage */}
        <div className="flex items-center gap-2 overflow-x-auto pt-0.5">
          {qualityStage === 'IQC' && (
            <button
              id="tab-btn-iqc-log"
              onClick={() => {
                setActiveTab('TAB_IQC');
                setIsIqcModalOpen(true);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === 'TAB_IQC'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>수입검사대장 / 신규 LOT 관리</span>
            </button>
          )}

          {qualityStage === 'IPQC' && (
            <>
              <button
                id="tab-btn-ipqc-cmm"
                onClick={() => setActiveTab('TAB1_IPQC_CMM')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                  activeTab === 'TAB1_IPQC_CMM'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>실시간 CMM 검사 현황</span>
              </button>

              <button
                id="tab-btn-spc-analysis"
                onClick={() => setActiveTab('TAB2_SPC_ANALYSIS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                  activeTab === 'TAB2_SPC_ANALYSIS'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>품질 데이터 분석</span>
              </button>
            </>
          )}

          {qualityStage === 'OQC' && (
            <>
              <button
                id="tab-btn-slotdie-coa"
                onClick={() => setActiveTab('TAB_SLOT_DIE_COA')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                  activeTab === 'TAB_SLOT_DIE_COA'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileCheck className="w-4 h-4 text-amber-300" />
                <span>성적서 관리</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-mono">
                  COA Editor
                </span>
              </button>

              <button
                id="tab-btn-shipping-coa"
                onClick={() => setActiveTab('TAB3_SHIPPING_COA')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                  activeTab === 'TAB3_SHIPPING_COA'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <PackageCheck className="w-4 h-4" />
                <span>[출하 보증 검토 & COA 발행 대장]</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. TAB 1: 실시간 IPQC 및 CMM 검사 뷰                                 */}
      {/* ==================================================================== */}
      {activeTab === 'TAB1_IPQC_CMM' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Main Top Grid (Left Queue + Right 3D & Measure Matrix) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* -------------------------------------------------------------- */}
            {/* Left Queue List (5 Cols)                                       */}
            {/* -------------------------------------------------------------- */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white">
                        실시간 CMM 공정검사 목록
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      id="btn-add-ipqc-modal"
                      onClick={() => setIsNewIpqcModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[11px] font-black transition flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>신규 검사 등록</span>
                    </button>
                  </div>
                </div>

                {/* Active vs Archived Sub-tabs */}
                <div className="flex items-center gap-1.5 mt-2.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                  <button
                    onClick={() => setIpqcFilterArchive('ACTIVE')}
                    className={`flex-1 py-1 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 text-[11px] cursor-pointer ${
                      ipqcFilterArchive === 'ACTIVE'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span>활성 검사대장</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-mono font-black">
                      {activeIpqcCount}
                    </span>
                  </button>
                  <button
                    onClick={() => setIpqcFilterArchive('ARCHIVED')}
                    className={`flex-1 py-1 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 text-[11px] cursor-pointer ${
                      ipqcFilterArchive === 'ARCHIVED'
                        ? 'bg-[#FFF9EB] dark:bg-amber-950/60 text-[#B45309] dark:text-amber-300 border border-[#FCD34D] dark:border-amber-700/80 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#B45309]'
                    }`}
                  >
                    <Archive className="w-3 h-3 text-[#B45309] dark:text-amber-400" />
                    <span>보관함</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#FEF3D6] dark:bg-amber-900/60 text-[#B45309] dark:text-amber-200 border border-[#FCD34D]/80 font-mono font-black">
                      {archivedIpqcCount}
                    </span>
                  </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-2 gap-2 mt-2.5 text-xs">
                  <div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="검사ID, 수주명, LOT 검색..."
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <select
                      value={searchLine}
                      onChange={(e) => setSearchLine(e.target.value)}
                      className="w-1/2 px-2 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="ALL">전체 라인</option>
                      <option value="LINE 1">LINE 1</option>
                      <option value="LINE 2">LINE 2</option>
                      <option value="LINE 3">LINE 3</option>
                    </select>
                    <select
                      value={searchResult}
                      onChange={(e) => setSearchResult(e.target.value)}
                      className="w-1/2 px-2 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="ALL">전체 결과</option>
                      <option value="PASS">PASS</option>
                      <option value="FAIL">FAIL</option>
                      <option value="REINSPECT">재검사</option>
                    </select>
                  </div>
                </div>

                {/* Inspection Queue Items */}
                <div className="space-y-2 mt-3 max-h-[420px] overflow-y-auto pr-1">
                  {filteredInspections.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">
                      {ipqcFilterArchive === 'ARCHIVED'
                        ? '보관함에 이동된 공정검사 데이터가 없습니다.'
                        : '검색 조건과 일치하는 공정검사 항목이 없습니다.'}
                    </div>
                  ) : (
                    filteredInspections.map((item) => {
                      const isSelected = selectedInspection.id === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectInspection(item)}
                          className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-xs ring-1 ring-blue-500'
                              : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">
                                {item.id}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                                {item.line}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {item.result === 'PASS' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                  <CheckCircle2 className="w-3 h-3" /> PASS
                                </span>
                              ) : item.result === 'FAIL' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700 animate-pulse">
                                  <XCircle className="w-3 h-3" /> FAIL
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                  <RotateCcw className="w-3 h-3" /> 재검사
                                </span>
                              )}

                              {/* Archive Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleArchiveIpqc(item.id);
                                }}
                                title={item.isArchived ? '보관함에서 복원' : '보관함으로 이동'}
                                className="p-1 rounded-md text-[#B45309] dark:text-amber-300 bg-[#FFF9EB] hover:bg-[#FEF3D6] dark:bg-amber-950/40 border border-[#FCD34D] dark:border-amber-700/80 shadow-2xs transition cursor-pointer"
                              >
                                {item.isArchived ? (
                                  <ArchiveRestore className="w-3.5 h-3.5" />
                                ) : (
                                  <Archive className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteIpqc(item.id);
                                }}
                                title="검사 삭제"
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                            {item.productName}
                          </h4>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-black/5 dark:border-white/5">
                            <span>고객: {item.customer.split(' ')[0]}</span>
                            <span className="font-mono">{item.lotNo}</span>
                          </div>

                          {item.defectType && (
                            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900 flex items-center justify-between">
                              <span>불량유형: {item.defectType}</span>
                              <span>CAPA {item.capa.step}단계</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Summary of current list */}
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] flex items-center justify-between font-bold text-slate-600 dark:text-slate-400">
                <span>선택된 검사: <strong className="text-blue-600 dark:text-blue-400">{currentIpqcDisplay.id}</strong></span>
                <span>측정 항목: {currentIpqcDisplay.measurements.length}개 포인트</span>
              </div>
            </div>

            {/* -------------------------------------------------------------- */}
            {/* Right: 3D Slot Die Viewer & Tolerance Matrix (7 Cols)           */}
            {/* -------------------------------------------------------------- */}
            <div className="lg:col-span-7 space-y-4">
              {/* 3D Interactive Slot Die Viewer */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span>슬롯다이 3D 정밀 검사 뷰어 & 립(Lip) 포인트 매핑</span>
                        {isIpqcEditMode && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                            ✏️ 실시간 편집 모드
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {currentIpqcDisplay.productName} ({currentIpqcDisplay.lipWidthMm}mm)
                      </p>
                    </div>
                  </div>

                  {/* Actions: Print Modal & Edit Mode Toggle */}
                  <div className="flex items-center gap-1.5">
                    <button
                      id="btn-print-ipqc-report"
                      onClick={() => setIsIpqcPrintModalOpen(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black transition flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>성적서 인쇄</span>
                    </button>

                    {isIpqcEditMode ? (
                      <div className="flex items-center gap-1">
                        <button
                          id="btn-save-ipqc-changes"
                          onClick={handleSaveIpqcEdit}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>저장</span>
                        </button>
                        <button
                          id="btn-cancel-ipqc-changes"
                          onClick={handleCancelIpqcEdit}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>취소</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        id="btn-enable-ipqc-edit"
                        onClick={handleStartIpqcEdit}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>검사값/규격 수정</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Edit Form Header when in Edit Mode */}
                {isIpqcEditMode && ipqcEditBuffer && (
                  <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">제품명</label>
                      <input
                        type="text"
                        value={ipqcEditBuffer.productName}
                        onChange={(e) =>
                          setIpqcEditBuffer({ ...ipqcEditBuffer, productName: e.target.value })
                        }
                        className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">고객사</label>
                      <input
                        type="text"
                        value={ipqcEditBuffer.customer}
                        onChange={(e) =>
                          setIpqcEditBuffer({ ...ipqcEditBuffer, customer: e.target.value })
                        }
                        className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                        검사 책임자 선택
                      </label>
                      <select
                        value={ipqcEditBuffer.inspector}
                        onChange={(e) =>
                          setIpqcEditBuffer({ ...ipqcEditBuffer, inspector: e.target.value })
                        }
                        className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-blue-600"
                      >
                        {approvedInspectors.map((insp) => (
                          <option key={insp} value={insp}>
                            {insp}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">최종 판정</label>
                      <select
                        value={ipqcEditBuffer.result}
                        onChange={(e) =>
                          setIpqcEditBuffer({
                            ...ipqcEditBuffer,
                            result: e.target.value as 'PASS' | 'FAIL' | 'REINSPECT'
                          })
                        }
                        className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      >
                        <option value="PASS">PASS (합격)</option>
                        <option value="FAIL">FAIL (불합격)</option>
                        <option value="REINSPECT">재검사</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 3D Real-time Angle/Zoom HUD & Quick Reset */}
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Rx: {Math.round(rotX)}° | Ry: {Math.round(rotY)}° | Zoom: {(zoom * 100).toFixed(0)}%
                  </div>
                  <button
                    id="btn-3d-reset-view"
                    onClick={reset3DView}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                    title="시점 초기화 (원점 복귀)"
                  >
                    리셋
                  </button>
                </div>

                {/* 3D Canvas / Geometric Representation with OrbitControls Dragging */}
                <div
                  id="slotdie-3d-viewport"
                  onMouseDown={handle3DMouseDown}
                  onMouseMove={handle3DMouseMove}
                  onMouseUp={handle3DMouseUp}
                  onMouseLeave={handle3DMouseUp}
                  onTouchStart={handle3DTouchStart}
                  onTouchMove={handle3DTouchMove}
                  onTouchEnd={handle3DTouchEnd}
                  onWheel={handle3DWheel}
                  onDoubleClick={reset3DView}
                  className={`relative h-60 sm:h-72 w-full bg-radial from-slate-900 via-slate-950 to-black rounded-xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner select-none ${
                    is3DDragging ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                >
                  {/* Grid Background */}
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}
                  />

                  {/* 3D Slot Die Body Container with CSS 3D Transforms */}
                  <div
                    className="relative transition-transform duration-100 ease-out select-none pointer-events-none"
                    style={{
                      transform: `perspective(700px) scale(${zoom}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    {/* Upper Die Body Solid */}
                    <div
                      className="w-64 h-16 bg-gradient-to-r from-cyan-600 via-blue-500 to-indigo-600 border border-cyan-300/80 shadow-2xl rounded-sm flex items-center justify-center text-white/90 text-[11px] font-mono font-black"
                      style={{
                        boxShadow: '0 0 25px rgba(6,182,212,0.3)',
                        transform: 'translateZ(15px)'
                      }}
                    >
                      <span>SLOT DIE UPPER BODY</span>
                    </div>

                    {/* Lip Discharge Gap (Highlighted Micro-Gap) */}
                    <div
                      className="w-64 h-2 bg-amber-400 border-y border-amber-300 animate-pulse my-1 flex items-center justify-center text-[8px] font-black text-black tracking-widest"
                      style={{ transform: 'translateZ(20px)' }}
                    >
                      LIP GAP (50.0㎛)
                    </div>

                    {/* Lower Die Body Solid */}
                    <div
                      className="w-64 h-16 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-800 border border-slate-500 shadow-2xl rounded-sm flex items-center justify-center text-white/80 text-[11px] font-mono font-bold"
                      style={{
                        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                        transform: 'translateZ(10px)'
                      }}
                    >
                      <span>SLOT DIE LOWER BODY</span>
                    </div>

                    {/* 3D Probe Scan Points */}
                    {currentIpqcDisplay.measurements.map((p, idx) => {
                      const isTarget = selectedPointIndex === idx;
                      const isNg = p.status === 'NG';
                      return (
                        <div
                          key={p.code}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPointIndex(idx);
                          }}
                          className="absolute pointer-events-auto cursor-pointer group"
                          style={{
                            left: `calc(50% + ${p.pos3D?.x || 0}px)`,
                            top: `calc(50% + ${p.pos3D?.y || 0}px)`,
                            transform: `translateZ(${(p.pos3D?.z || 0) + 30}px) translate(-50%, -50%)`,
                            transformStyle: 'preserve-3d'
                          }}
                        >
                          <div
                            className={`relative flex items-center justify-center w-6 h-6 rounded-full font-mono text-[10px] font-black shadow-lg transition-transform ${
                              isNg
                                ? 'bg-rose-600 text-white ring-2 ring-rose-400 animate-bounce'
                                : isTarget
                                ? 'bg-amber-400 text-black ring-2 ring-amber-200 scale-125'
                                : 'bg-emerald-500 text-white hover:scale-110'
                            }`}
                          >
                            <span>{p.code}</span>
                            {/* Hover / Active Tooltip */}
                            <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center bg-slate-900/90 text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap z-30 border border-slate-700">
                              <span className="font-bold">{p.item}</span>
                              <span className="font-mono">
                                실측: {p.actual} {p.unit} ({p.deviation})
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Measurement Status Indicator Overlay */}
                  <div className="absolute top-2.5 left-3 text-[11px] text-cyan-300/90 font-mono flex items-center gap-2 pointer-events-none bg-slate-950/70 px-2.5 py-1 rounded-lg border border-slate-800 backdrop-blur-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>
                      장비: {currentIpqcDisplay.cmmDevice} | 측정 포인트{' '}
                      {currentIpqcDisplay.measurements.length}개 활성화
                    </span>
                  </div>

                  {/* OrbitControls Interactive HUD Guidance Pill */}
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-xs border border-slate-700/80 text-[10px] font-medium text-slate-300 flex items-center gap-2 pointer-events-none whitespace-nowrap shadow-xl">
                    <span>🖱️ <strong>좌클릭 드래그</strong>: 360° 회전</span>
                    <span className="text-slate-600">|</span>
                    <span><strong>휠</strong>: 줌 인/아웃</span>
                    <span className="text-slate-600">|</span>
                    <span><strong>더블클릭</strong>: 리셋</span>
                  </div>
                </div>

                {/* Precision Measurement Table */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                    <span className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-blue-500" />
                      <span>포인트별 기준값(Nominal) vs 실측값(Actual) 정밀 공차 비교표</span>
                    </span>

                    {isIpqcEditMode ? (
                      <button
                        onClick={handleAddIpqcMeasurementPoint}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>측정 포인트 추가</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-mono">단위: ㎛ / mm</span>
                    )}
                  </div>

                  <div className="overflow-x-auto max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100/70 dark:bg-slate-800/50 text-[11px] font-bold text-slate-600 dark:text-slate-400 sticky top-0">
                        <tr>
                          <th className="p-2">No</th>
                          <th className="p-2">코드</th>
                          <th className="p-2">측정 항목</th>
                          <th className="p-2">기준값</th>
                          <th className="p-2">실측값</th>
                          <th className="p-2">허용 공차</th>
                          <th className="p-2">편차</th>
                          <th className="p-2 text-center">판정</th>
                          {isIpqcEditMode && <th className="p-2 text-center">삭제</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {currentIpqcDisplay.measurements.map((m, idx) => {
                          const isSelected = selectedPointIndex === idx;
                          const isNg = m.status === 'NG';
                          return (
                            <tr
                              key={m.code || idx}
                              onClick={() => setSelectedPointIndex(idx)}
                              className={`transition ${
                                isSelected
                                  ? 'bg-blue-50/80 dark:bg-blue-950/40 font-bold'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                              } ${isNg ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}`}
                            >
                              <td className="p-2 font-mono text-slate-500">{m.no}</td>
                              <td className="p-2 font-mono font-black text-blue-600 dark:text-blue-400">
                                {isIpqcEditMode ? (
                                  <input
                                    type="text"
                                    value={m.code}
                                    onChange={(e) =>
                                      handleUpdateIpqcBufferMeasurement(idx, 'code', e.target.value)
                                    }
                                    className="w-12 px-1 py-0.5 border rounded text-xs font-mono font-bold"
                                  />
                                ) : (
                                  m.code
                                )}
                              </td>
                              <td className="p-2 font-bold text-slate-800 dark:text-slate-200">
                                {isIpqcEditMode ? (
                                  <input
                                    type="text"
                                    value={m.item}
                                    onChange={(e) =>
                                      handleUpdateIpqcBufferMeasurement(idx, 'item', e.target.value)
                                    }
                                    className="w-36 px-1.5 py-0.5 border rounded text-xs"
                                  />
                                ) : (
                                  m.item
                                )}
                              </td>
                              <td className="p-2 font-mono text-slate-600 dark:text-slate-300">
                                {isIpqcEditMode ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="any"
                                      value={m.nominal}
                                      onChange={(e) =>
                                        handleUpdateIpqcBufferMeasurement(
                                          idx,
                                          'nominal',
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="w-16 px-1 py-0.5 border rounded text-xs font-mono"
                                    />
                                    <span className="text-[10px]">{m.unit}</span>
                                  </div>
                                ) : (
                                  `${m.nominal.toFixed(2)} ${m.unit}`
                                )}
                              </td>
                              <td
                                className={`p-2 font-mono font-black ${
                                  isNg
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-emerald-700 dark:text-emerald-400'
                                }`}
                              >
                                {isIpqcEditMode ? (
                                  <input
                                    type="number"
                                    step="any"
                                    value={m.actual}
                                    onChange={(e) =>
                                      handleUpdateIpqcBufferMeasurement(
                                        idx,
                                        'actual',
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-16 px-1 py-0.5 border border-blue-400 rounded text-xs font-mono font-black"
                                  />
                                ) : (
                                  `${m.actual.toFixed(m.unit.includes('㎛') ? 2 : 3)} ${m.unit}`
                                )}
                              </td>
                              <td className="p-2 font-mono text-slate-500">
                                {isIpqcEditMode ? (
                                  <input
                                    type="text"
                                    value={m.tolerance}
                                    onChange={(e) =>
                                      handleUpdateIpqcBufferMeasurement(
                                        idx,
                                        'tolerance',
                                        e.target.value
                                      )
                                    }
                                    className="w-16 px-1 py-0.5 border rounded text-xs font-mono"
                                  />
                                ) : (
                                  m.tolerance
                                )}
                              </td>
                              <td
                                className={`p-2 font-mono font-bold ${
                                  isNg
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {m.deviation}
                              </td>
                              <td className="p-2 text-center">
                                {m.status === 'OK' ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                                    OK
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 animate-pulse">
                                    NG
                                  </span>
                                )}
                              </td>
                              {isIpqcEditMode && (
                                <td className="p-2 text-center">
                                  <button
                                    onClick={() => handleDeleteIpqcMeasurementPoint(idx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* Bottom Section: 5-Step CAPA Tracking & CMM Device Real-time Status */}
          {/* ================================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: 5-Step CAPA Tracking Bar (7 Cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">
                      5단계 품질 개선 흐름(CAPA) 트래킹 & 시정 조치
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      불량 발생 시 원인 분석, 지그 교정, 재검사 및 최종 합격 판정 라이프사이클
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    현재: <strong className="text-blue-600">{(capaBuffer ? capaBuffer.step : currentIpqcDisplay.capa.step)}단계 진행중</strong>
                  </span>

                  {isCapaEditMode ? (
                    <div className="flex items-center gap-1">
                      <button
                        id="btn-save-capa"
                        onClick={handleSaveCapaEdit}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>저장</span>
                      </button>
                      <button
                        id="btn-cancel-capa"
                        onClick={handleCancelCapaEdit}
                        className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>취소</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      id="btn-start-capa-edit"
                      onClick={handleStartCapaEdit}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>CAPA 작성/수정</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 5-Step Stepper Bar with interactive click */}
              <div className="grid grid-cols-5 gap-1.5 py-1.5">
                {[
                  { step: 1, label: '1. 불량 감지', desc: '초기 이상 감지' },
                  { step: 2, label: '2. 원인 분석', desc: '5-Why / 원인' },
                  { step: 3, label: '3. 시정 조치', desc: '지그/가공 보정' },
                  { step: 4, label: '4. CMM 재검사', desc: '정밀 실측 재검' },
                  { step: 5, label: '5. 합격 판정', desc: '최종 승인/출하' }
                ].map((s) => {
                  const effectiveStep = capaBuffer ? capaBuffer.step : currentIpqcDisplay.capa.step;
                  const isPassed = effectiveStep > s.step;
                  const isCurrent = effectiveStep === s.step;
                  const isViewing = activeCapaStep === s.step;

                  return (
                    <div
                      key={s.step}
                      onClick={() => {
                        setActiveCapaStep(s.step);
                        if (isCapaEditMode && capaBuffer) {
                          setCapaBuffer({ ...capaBuffer, step: s.step });
                        }
                      }}
                      className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-between cursor-pointer ${
                        isViewing ? 'ring-2 ring-blue-500' : ''
                      } ${
                        isPassed
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                          : isCurrent
                          ? 'bg-blue-600 text-white border-blue-700 shadow-md font-black'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-[10px] font-bold">
                        {isPassed ? '✓ 완료' : isCurrent ? '▶ 진행' : '대기'}
                      </span>
                      <span className="text-[11px] font-black mt-0.5 leading-tight">{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Interactive Step-specific & Master CAPA Details Box */}
              {(() => {
                const activeCapa = isCapaEditMode && capaBuffer ? capaBuffer : currentIpqcDisplay.capa;
                return (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-2.5">
                    {/* Header info bar */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80 dark:border-slate-700/80 text-[11px]">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {activeCapaStep === 1 && '📌 1단계: 불량 감지 및 부적합 내역'}
                        {activeCapaStep === 2 && '🔍 2단계: 근본 원인 분석 (5-Why)'}
                        {activeCapaStep === 3 && '🛠️ 3단계: 시정 조치 및 지그/툴 보정'}
                        {activeCapaStep === 4 && '🔬 4단계: CMM 초정밀 재검사 확인'}
                        {activeCapaStep === 5 && '✅ 5단계: 품질보증 최종 합격 승인'}
                      </span>
                      <span className="text-slate-500 font-mono">
                        {isCapaEditMode ? '✏️ 수정 모드 활성화됨' : '조회 모드 (클릭하여 단계 확인)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Step 1 & 2 Block */}
                      <div className="space-y-2 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                            불량 감지 유형 & 시각 (1단계)
                          </label>
                          {isCapaEditMode ? (
                            <input
                              type="text"
                              value={activeCapa.defectOccurred?.type || ''}
                              onChange={(e) => handleUpdateCapaField('defectOccurred', 'type', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                            />
                          ) : (
                            <p className="font-bold text-rose-600 dark:text-rose-400">
                              {activeCapa.defectOccurred?.type || '정상 (특이사항 없음)'}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                            근본 원인 분석 (2단계)
                          </label>
                          {isCapaEditMode ? (
                            <textarea
                              rows={2}
                              value={activeCapa.causeAnalysis?.reason || ''}
                              onChange={(e) => handleUpdateCapaField('causeAnalysis', 'reason', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                            />
                          ) : (
                            <p className="text-slate-700 dark:text-slate-300 font-medium">
                              {activeCapa.causeAnalysis?.reason || '분석 진행중'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Step 3 & 4 Block */}
                      <div className="space-y-2 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                            시정 조치 및 변경사항 (3단계)
                          </label>
                          {isCapaEditMode ? (
                            <input
                              type="text"
                              value={activeCapa.correctiveAction?.action || ''}
                              onChange={(e) => handleUpdateCapaField('correctiveAction', 'action', e.target.value)}
                              placeholder="시정 조치 내용 입력..."
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold text-blue-600 bg-white dark:bg-slate-950"
                            />
                          ) : (
                            <p className="text-blue-600 dark:text-blue-400 font-bold">
                              {activeCapa.correctiveAction?.action || '조치 대기중'}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                            CMM 재검사 결과 & 판정 (4~5단계)
                          </label>
                          {isCapaEditMode ? (
                            <input
                              type="text"
                              value={activeCapa.reinspection?.result || ''}
                              onChange={(e) => handleUpdateCapaField('reinspection', 'result', e.target.value)}
                              placeholder="재검사 실측치 및 최종 승인..."
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                            />
                          ) : (
                            <p className="text-emerald-700 dark:text-emerald-400 font-bold">
                              {activeCapa.reinspection?.result || '재검사 대기'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right: CMM 2-Machines Real-time Monitor (5 Cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">
                      CMM 장비 현황 (CMM-01 ~ CMM-02)
                    </h3>
                    <p className="text-[11px] text-slate-500">20.0℃ 항온항습실 실시간 상태 (2대 가동)</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600">클린룸 2대 연동</span>
              </div>

              <div className="space-y-2">
                {CMM_MACHINES_STATUS.map((cmm) => (
                  <div
                    key={cmm.id}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between gap-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            cmm.status === 'RUNNING'
                              ? 'bg-emerald-500 animate-pulse'
                              : 'bg-amber-500'
                          }`}
                        />
                        <strong className="text-slate-900 dark:text-white">{cmm.name}</strong>
                      </div>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        가동률 {cmm.utilization}%
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate">
                      현재: {cmm.currentTask}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-black/5 dark:border-white/5">
                      <span className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-rose-500" /> {cmm.temp}℃
                        <Droplets className="w-3 h-3 text-blue-500 ml-1" /> {cmm.humidity}%
                      </span>
                      <span>{cmm.calibratedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. TAB 2: SPC 및 품질 데이터 분석 뷰                                 */}
      {/* ==================================================================== */}
      {activeTab === 'TAB2_SPC_ANALYSIS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Top Row: Pareto Defect Donut & X-Bar R Control Trend Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Pareto Distribution Chart (5 Cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">
                      실시간 불량 유형 파레토(Pareto) 분포
                    </h3>
                    <p className="text-[11px] text-slate-500">실측 공정검사 데이터 연동 누적 점유율 분석</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-rose-600">
                  총 {paretoDefectStats.totalDefects}건 불량 감지
                </span>
              </div>

              {/* Pareto Bars */}
              <div className="space-y-2.5 pt-1">
                {paretoDefectStats.items.map((item, idx) => (
                  <div key={item.type} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>#{idx + 1} {item.type}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-600 dark:text-slate-400">
                          {item.count}건 ({item.percent}%)
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                          누적 {item.cumPercent}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percent}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900 text-xs space-y-1">
                <span className="font-black text-rose-900 dark:text-rose-300">
                  ※ 파레토 핵심 중점 관리 공정:
                </span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                  {paretoDefectStats.items.length >= 2 ? (
                    <>
                      '{paretoDefectStats.items[0]?.type}'와 '{paretoDefectStats.items[1]?.type}' 2개 항목이 누적 <strong>{paretoDefectStats.items[1]?.cumPercent}%</strong>를 차지하므로, 해당 가공 공정의 지그 정밀도 및 가공 부하 제어 개선이 우선적으로 요구됩니다.
                    </>
                  ) : (
                    '공정검사 실측치 기반 불량 유형이 실시간으로 집계 및 분석됩니다.'
                  )}
                </p>
              </div>
            </div>

            {/* Right: Product-based SPC Trend / X-bar R Control Chart (7 Cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">
                      제품별 정밀 기하공차 변동 관리도 (X-bar R Chart)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      UCL/LCL 상·하한 관리선 및 이상점(Outlier) 실시간 모니터링
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Product Selector */}
                  <select
                    value={selectedSpcProductId}
                    onChange={(e) => setSelectedSpcProductId(e.target.value)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white max-w-[260px] sm:max-w-[340px] truncate shadow-2xs"
                  >
                    {productSpcList.map((p) => (
                      <option key={p.productId} value={p.productId}>
                        {p.isOrderLinked
                          ? `${p.orderStatus === 'COMPLETED' ? '⚪ [완료]' : '🟢 [진행중]'} ${p.orderId}: ${p.shortName}`
                          : p.productName}
                      </option>
                    ))}
                  </select>

                  {/* Metric Switch: Flatness, Straightness, Parallelism */}
                  <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                    <button
                      onClick={() => setSpcMetric('FLATNESS')}
                      className={`px-2 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                        spcMetric === 'FLATNESS'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
                      }`}
                    >
                      평면도
                    </button>
                    <button
                      onClick={() => setSpcMetric('STRAIGHTNESS')}
                      className={`px-2 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                        spcMetric === 'STRAIGHTNESS'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
                      }`}
                    >
                      진직도
                    </button>
                    <button
                      onClick={() => setSpcMetric('PARALLELISM')}
                      className={`px-2 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                        spcMetric === 'PARALLELISM'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
                      }`}
                    >
                      평행도
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom SVG Control Chart for Selected Product & Metric */}
              {(() => {
                const currentProductSpc =
                  productSpcList.find((p) => p.productId === selectedSpcProductId) ||
                  productSpcList[0] ||
                  PRODUCT_SPC_DATASET[0];
                const metricConfig = currentProductSpc.metrics[spcMetric];
                const uclVal = metricConfig.ucl;
                const lclVal = metricConfig.lcl;
                const clVal = metricConfig.cl;
                const data = metricConfig.data;
                const maxRange = Math.max(uclVal * 1.35, ...data.map((d) => Math.abs(d.value) * 1.15), 1.0);

                // Correctly detect outliers: value outside [lclVal, uclVal] or marked isOutlier
                const outlierCount = data.filter((d) => d.value > uclVal || d.value < lclVal || d.isOutlier).length;

                // SVG coordinate conversion: chart height = 150, center = 75, range ±maxRange
                const getY = (val: number) => {
                  const clamped = Math.max(-maxRange, Math.min(maxRange, val));
                  return 75 - (clamped / maxRange) * 55;
                };

                const uclY = getY(uclVal);
                const clY = getY(clVal);
                const lclY = getY(lclVal);

                return (
                  <>
                    {/* Live Order Linkage & Traceability Banner */}
                    {currentProductSpc.isOrderLinked && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${
                              currentProductSpc.orderStatus === 'COMPLETED'
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                : 'bg-emerald-500 text-white shadow-2xs'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                currentProductSpc.orderStatus === 'COMPLETED'
                                  ? 'bg-slate-400'
                                  : 'bg-white animate-ping'
                              }`}
                            />
                            {currentProductSpc.orderStatus === 'COMPLETED'
                              ? '수주 완료건'
                              : '실시간 수주 진행건'}
                          </span>
                          <strong className="text-slate-900 dark:text-white font-black">
                            {currentProductSpc.customer}
                          </strong>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <span className="text-blue-600 dark:text-blue-400 font-mono font-bold">
                            {currentProductSpc.orderId}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <span className="text-slate-600 dark:text-slate-300 font-medium">
                            수량:{' '}
                            <strong className="text-slate-800 dark:text-slate-100">
                              {currentProductSpc.orderQty}대
                            </strong>
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <span>가공설비:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">
                              {currentProductSpc.mctMachine}
                            </span>
                          </div>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <span>CMM 연계:</span>
                            <span
                              className={`font-bold ${
                                currentProductSpc.latestCmmResult?.includes('합격')
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : currentProductSpc.latestCmmResult?.includes('불합격') ||
                                    currentProductSpc.latestCmmResult?.includes('재검사')
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {currentProductSpc.latestCmmResult}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="relative h-64 w-full bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                      {/* Legend & Limits Header */}
                      <div className="flex justify-between items-center text-[10px] font-mono px-2">
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <span className="inline-block w-3 h-0.5 bg-rose-500 border-b border-dashed" />
                          UCL (상한선: +{uclVal.toFixed(2)}㎛)
                        </span>
                        <span className="text-blue-600 font-bold flex items-center gap-1">
                          <span className="inline-block w-3 h-0.5 bg-blue-500" />
                          CL (중심선: {clVal.toFixed(2)}㎛)
                        </span>
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <span className="inline-block w-3 h-0.5 bg-rose-500 border-b border-dashed" />
                          LCL (하한선: {lclVal.toFixed(2)}㎛)
                        </span>
                      </div>

                      {/* SVG Visual Graph with ample padding */}
                      <div className="relative h-44 w-full flex items-center">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150">
                          {/* Shaded In-Control Zone (Between UCL and LCL) */}
                          <rect
                            x="40"
                            y={Math.min(uclY, lclY)}
                            width="440"
                            height={Math.abs(lclY - uclY)}
                            fill="#3b82f6"
                            fillOpacity="0.05"
                          />

                          {/* Horizontal Reference Lines */}
                          <line x1="40" y1={uclY} x2="480" y2={uclY} stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 4" />
                          <line x1="40" y1={clY} x2="480" y2={clY} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2 2" />
                          <line x1="40" y1={lclY} x2="480" y2={lclY} stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 4" />

                          {/* Y-Axis Scale Marks */}
                          <text x="35" y={uclY + 3} textAnchor="end" fontSize="9" fontWeight="bold" fill="#f43f5e">+{uclVal}</text>
                          <text x="35" y={clY + 3} textAnchor="end" fontSize="9" fontWeight="bold" fill="#3b82f6">{clVal}</text>
                          <text x="35" y={lclY + 3} textAnchor="end" fontSize="9" fontWeight="bold" fill="#f43f5e">{lclVal}</text>

                          {/* Polyline of Data Points */}
                          {(() => {
                            const points = data
                              .map((d, i) => {
                                const x = 50 + (i / (data.length - 1)) * 420;
                                const y = getY(d.value);
                                return `${x},${y}`;
                              })
                              .join(' ');

                            return (
                              <>
                                <polyline fill="none" stroke="#2563eb" strokeWidth="2.5" points={points} />
                                {data.map((d, i) => {
                                  const x = 50 + (i / (data.length - 1)) * 420;
                                  const y = getY(d.value);
                                  const isOutlier = d.value > uclVal || d.value < lclVal || d.isOutlier;
                                  const isHigh = y < 35;
                                  const textY = isHigh ? y - 9 : y - 8;
                                  return (
                                    <g key={d.batch + i} className="cursor-pointer group">
                                      <circle
                                        cx={x}
                                        cy={y}
                                        r={isOutlier ? 6 : 4}
                                        fill={isOutlier ? '#e11d48' : '#2563eb'}
                                        stroke="#ffffff"
                                        strokeWidth="2"
                                        className={isOutlier ? 'animate-pulse' : ''}
                                      />
                                      {/* Value Label Box for Outliers */}
                                      {isOutlier ? (
                                        <g>
                                          <rect
                                            x={x - 24}
                                            y={textY - 10}
                                            width="48"
                                            height="14"
                                            rx="4"
                                            fill="#e11d48"
                                            className="shadow-sm"
                                          />
                                          <text
                                            x={x}
                                            y={textY}
                                            textAnchor="middle"
                                            fontSize="9"
                                            fontWeight="black"
                                            fill="#ffffff"
                                          >
                                            {d.value}㎛ (NG)
                                          </text>
                                        </g>
                                      ) : (
                                        <text
                                          x={x}
                                          y={textY}
                                          textAnchor="middle"
                                          fontSize="9"
                                          fontWeight="bold"
                                          fill="#64748b"
                                        >
                                          {d.value}
                                        </text>
                                      )}
                                    </g>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </svg>
                      </div>

                      {/* Dynamic X Axis Batch / Date Labels */}
                      <div className="flex justify-between text-[10px] font-mono text-slate-500 px-6 border-t border-slate-200 dark:border-slate-800 pt-1">
                        {data.map((d, idx) => {
                          const isOutlier = d.value > uclVal || d.value < lclVal || d.isOutlier;
                          return (
                            <span
                              key={d.batch + idx}
                              className={
                                isOutlier
                                  ? 'text-rose-600 font-bold'
                                  : idx === data.length - 1
                                  ? 'text-emerald-600 font-bold'
                                  : ''
                              }
                            >
                              {d.date}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Capability Metrics Cp / Cpk */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500 font-bold text-[10px]">공정능력지수 Cp</span>
                        <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                          {metricConfig.cp}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                          편향계수 고려 Cpk
                        </span>
                        <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {metricConfig.cpk}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                        <span className="text-blue-700 dark:text-blue-400 font-bold text-[10px]">
                          이상점 검출(Run rule)
                        </span>
                        <p
                          className={`text-base font-black ${
                            outlierCount > 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          } mt-0.5`}
                        >
                          {outlierCount > 0 ? `${outlierCount}건 감지 (NG 판정)` : '0건 (정상 관리 상태)'}
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. TAB 3: 출하 보증 및 COA 성적서 관리 뷰                           */}
      {/* ==================================================================== */}
      {activeTab === 'TAB3_SHIPPING_COA' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Project Shipping Readiness List (4 Cols) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      <PackageCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white">
                        출하 검사 및 COA 발행 관리
                      </h3>
                      <p className="text-[11px] text-slate-500">CMM, 조도, 도금, 세척 종합 판정</p>
                    </div>
                  </div>

                  <button
                    id="btn-add-new-shipping"
                    onClick={() => setIsNewShippingModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-bold shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>신규 출하</span>
                  </button>
                </div>

                {/* Sub-tabs: Active vs Archived */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setShippingFilterArchive('ACTIVE')}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      shippingFilterArchive === 'ACTIVE'
                        ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>활성 목록 ({activeShippingCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShippingFilterArchive('ARCHIVED')}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      shippingFilterArchive === 'ARCHIVED'
                        ? 'bg-[#FFF9EB] dark:bg-amber-950/60 text-[#B45309] dark:text-amber-300 border border-[#FCD34D] dark:border-amber-700/80 shadow-2xs'
                        : 'text-slate-500 hover:text-[#B45309] dark:hover:text-amber-300'
                    }`}
                  >
                    <Archive className="w-3.5 h-3.5 text-[#B45309] dark:text-amber-400" />
                    <span>보관함 ({archivedShippingCount})</span>
                  </button>
                </div>

                {/* Projects List */}
                <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                  {filteredShippingProjects.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                      {shippingFilterArchive === 'ARCHIVED'
                        ? '보관함에 보관된 출하 항목이 없습니다.'
                        : '현재 등록된 활성 출하 프로젝트가 없습니다.'}
                    </div>
                  ) : (
                    filteredShippingProjects.map((p) => {
                      const isSelected = selectedShipping.id === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedShipping(p);
                            if (isShippingEditMode) setIsShippingEditMode(false);
                          }}
                          className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 group ${
                            isSelected
                              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-xs ring-1 ring-blue-500'
                              : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono font-bold text-slate-500">
                              {p.coaNo}
                            </span>

                            <div className="flex items-center gap-1">
                              {p.shippingStatus === 'APPROVED' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                                  출하 승인
                                </span>
                              ) : p.shippingStatus === 'REJECTED' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300">
                                  출하 보류
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                                  검수 대기
                                </span>
                              )}

                              {/* Archive & Delete Actions */}
                              <button
                                type="button"
                                title={p.isArchived ? '보관함에서 복원' : '보관함으로 이동'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleArchiveShipping(p.id);
                                }}
                                className="p-1 rounded-md text-[#B45309] dark:text-amber-300 bg-[#FFF9EB] hover:bg-[#FEF3D6] dark:bg-amber-950/40 border border-[#FCD34D] dark:border-amber-700/80 shadow-2xs transition cursor-pointer"
                              >
                                {p.isArchived ? (
                                  <ArchiveRestore className="w-3.5 h-3.5 text-blue-600" />
                                ) : (
                                  <Archive className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                type="button"
                                title="출하 프로젝트 삭제"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteShipping(p.id);
                                }}
                                className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                            {p.orderName}
                          </h4>

                          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600 dark:text-slate-400 pt-1 border-t border-black/5 dark:border-white/5">
                            <span>고객: {p.customer}</span>
                            <span>3D CMM: {p.cmmStatus === 'PASS' ? '✅ 합격' : '❌ 불량'}</span>
                            <span>표면 조도: {p.roughnessValue}</span>
                            <span>도금 두께: {p.coatingValue}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 mt-2">
                선택 수주: <strong className="text-blue-600">{selectedShipping.orderName}</strong>
              </div>
            </div>

            {/* Right: Live COA Certificate Viewer & Verification Checklist (8 Cols) */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      실시간 COA (공인 품질성적서) 미리보기 & 출하 검증
                    </h3>
                    <p className="text-xs text-slate-500">
                      Certificate of Analysis - Jun Sung Tech Precision QA Center
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Edit Toggle */}
                  {isShippingEditMode ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        id="btn-save-shipping-edit"
                        onClick={handleSaveShippingEdit}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>저장</span>
                      </button>
                      <button
                        id="btn-cancel-shipping-edit"
                        onClick={handleCancelShippingEdit}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>취소</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      id="btn-start-shipping-edit"
                      onClick={handleStartShippingEdit}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>성적서 데이터 수정</span>
                    </button>
                  )}

                  {/* Print Button */}
                  <button
                    id="btn-print-shipping-top"
                    onClick={handlePrintCOA}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>성적서 인쇄</span>
                  </button>

                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {selectedShipping.coaNo}
                  </span>
                </div>
              </div>

              {/* View / Edit Container */}
              {isShippingEditMode && shippingEditBuffer ? (
                /* EDIT FORM */
                <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-blue-300 dark:border-blue-800 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-black text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4" />
                      출하 검사 성적서 데이터 편집 모드
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">{shippingEditBuffer.id}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">고객사명</label>
                      <input
                        type="text"
                        value={shippingEditBuffer.customer}
                        onChange={(e) => setShippingEditBuffer({ ...shippingEditBuffer, customer: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">수주/제품명</label>
                      <input
                        type="text"
                        value={shippingEditBuffer.orderName}
                        onChange={(e) => setShippingEditBuffer({ ...shippingEditBuffer, orderName: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">제품 사양 (Spec)</label>
                      <input
                        type="text"
                        value={shippingEditBuffer.productSpec}
                        onChange={(e) => setShippingEditBuffer({ ...shippingEditBuffer, productSpec: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">관리 LOT 번호</label>
                      <input
                        type="text"
                        value={shippingEditBuffer.lotNo}
                        onChange={(e) => setShippingEditBuffer({ ...shippingEditBuffer, lotNo: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">소재 (Material)</label>
                      <input
                        type="text"
                        value={shippingEditBuffer.material}
                        onChange={(e) => setShippingEditBuffer({ ...shippingEditBuffer, material: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">경도 (Hardness)</label>
                      <input
                        type="text"
                        value={shippingEditBuffer.hardness}
                        onChange={(e) => setShippingEditBuffer({ ...shippingEditBuffer, hardness: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">표면 조도 (Ra)</label>
                      <input
                        type="text"
                        value={shippingEditBuffer.roughnessValue}
                        onChange={(e) => setShippingEditBuffer({ ...shippingEditBuffer, roughnessValue: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">도금/코팅 두께</label>
                      <input
                        type="text"
                        value={shippingEditBuffer.coatingValue}
                        onChange={(e) => setShippingEditBuffer({ ...shippingEditBuffer, coatingValue: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">출하 상태</label>
                      <select
                        value={shippingEditBuffer.shippingStatus}
                        onChange={(e) => setShippingEditBuffer({ ...shippingEditBuffer, shippingStatus: e.target.value as any })}
                        className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold"
                      >
                        <option value="PENDING">검수 대기 (PENDING)</option>
                        <option value="APPROVED">출하 승인 (APPROVED)</option>
                        <option value="REJECTED">출하 보류 (REJECTED)</option>
                      </select>
                    </div>
                  </div>

                  {/* Inspectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">검사 책임자 (Inspector)</label>
                      <select
                        value={shippingEditBuffer.inspector}
                        onChange={(e) => setShippingEditBuffer({ ...shippingEditBuffer, inspector: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold"
                      >
                        {approvedInspectors.map((insp) => (
                          <option key={insp} value={insp}>{insp}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">QA 부서장 (QA Manager)</label>
                      <select
                        value={shippingEditBuffer.qaManager}
                        onChange={(e) => setShippingEditBuffer({ ...shippingEditBuffer, qaManager: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold"
                      >
                        {approvedQaManagers.map((mgr) => (
                          <option key={mgr} value={mgr}>{mgr}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Checklists */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">출하 필수 체크리스트 항목</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shippingEditBuffer.checklist.cmmPointScan}
                          onChange={(e) =>
                            setShippingEditBuffer({
                              ...shippingEditBuffer,
                              checklist: { ...shippingEditBuffer.checklist, cmmPointScan: e.target.checked }
                            })
                          }
                          className="rounded text-blue-600"
                        />
                        <span>1. CMM 3차원 전수 포인트 공차 검사 완료</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shippingEditBuffer.checklist.roughnessInterferometer}
                          onChange={(e) =>
                            setShippingEditBuffer({
                              ...shippingEditBuffer,
                              checklist: { ...shippingEditBuffer.checklist, roughnessInterferometer: e.target.checked }
                            })
                          }
                          className="rounded text-blue-600"
                        />
                        <span>2. 비접촉 광학 간섭계 경면 조도(Ra≤0.02㎛) 확인</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shippingEditBuffer.checklist.boltInterference}
                          onChange={(e) =>
                            setShippingEditBuffer({
                              ...shippingEditBuffer,
                              checklist: { ...shippingEditBuffer.checklist, boltInterference: e.target.checked }
                            })
                          }
                          className="rounded text-blue-600"
                        />
                        <span>3. 립 조절 볼트 및 심 플레이트 조립 간섭 테스트</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shippingEditBuffer.checklist.ultrasonicCleaning}
                          onChange={(e) =>
                            setShippingEditBuffer({
                              ...shippingEditBuffer,
                              checklist: { ...shippingEditBuffer.checklist, ultrasonicCleaning: e.target.checked }
                            })
                          }
                          className="rounded text-blue-600"
                        />
                        <span>4. 메가소닉 3단계 정밀 탈지 세척 및 건조</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shippingEditBuffer.checklist.cleanroomPackaging}
                          onChange={(e) =>
                            setShippingEditBuffer({
                              ...shippingEditBuffer,
                              checklist: { ...shippingEditBuffer.checklist, cleanroomPackaging: e.target.checked }
                            })
                          }
                          className="rounded text-blue-600"
                        />
                        <span>5. 방청 피막 및 클린룸 2중 진공 포장 완료</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={handleCancelShippingEdit}
                      className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSaveShippingEdit}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>수정사항 저장</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* OFFICIAL PRINTABLE COA CERTIFICATE SHEET */
                <div
                  id="coa-printable-sheet"
                  className="bg-white text-slate-900 p-6 rounded-2xl border-2 border-slate-300 shadow-inner space-y-5 font-sans"
                >
                  {/* COA Header */}
                  <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-black tracking-tight text-slate-900">
                        품질 검사 및 출하 보증 성적서 (COA)
                      </h2>
                      <p className="text-xs font-bold text-slate-500 font-mono">
                        CERTIFICATE OF QUALITY ASSURANCE & ANALYSIS
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-blue-900 tracking-wider">
                        준성테크(주) 정밀가공 품질보증센터
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        발행일자: {selectedShipping.issueDate}
                      </div>
                    </div>
                  </div>

                  {/* Product & Spec Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">고객사명</span>
                      <strong className="text-slate-900">{selectedShipping.customer}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">제품명/규격</span>
                      <strong className="text-slate-900">{selectedShipping.productSpec}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">소재 및 경도</span>
                      <strong className="text-slate-900">{selectedShipping.material} ({selectedShipping.hardness})</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">관리 LOT 번호</span>
                      <strong className="text-slate-900 font-mono">{selectedShipping.lotNo}</strong>
                    </div>
                  </div>

                  {/* Core Measured Precision Results Table */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100 text-[11px] font-bold text-slate-700">
                        <tr>
                          <th className="p-2 border-b">검사 항목</th>
                          <th className="p-2 border-b">설계 사양</th>
                          <th className="p-2 border-b">실측 데이터</th>
                          <th className="p-2 border-b">측정 장비</th>
                          <th className="p-2 border-b text-center">판정</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="p-2 font-bold">3차원 립 갭 (Lip Gap)</td>
                          <td className="p-2 font-mono">50.0㎛ ±0.8㎛</td>
                          <td className="p-2 font-mono font-black text-emerald-700">50.12㎛</td>
                          <td className="p-2">CMM Zeiss Prismo</td>
                          <td className="p-2 text-center font-bold text-emerald-600">PASS</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold">경면부 진직도/평면도</td>
                          <td className="p-2 font-mono">≤ 1.0㎛</td>
                          <td className="p-2 font-mono font-black text-emerald-700">0.52㎛</td>
                          <td className="p-2">CMM 3D 스캔</td>
                          <td className="p-2 text-center font-bold text-emerald-600">PASS</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold">경면부 표면 조도 (Ra)</td>
                          <td className="p-2 font-mono">≤ 0.020㎛</td>
                          <td className="p-2 font-mono font-black text-emerald-700">{selectedShipping.roughnessValue}</td>
                          <td className="p-2">광학 간섭계 (Zygo)</td>
                          <td className="p-2 text-center font-bold text-emerald-600">PASS</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold">표면 처리 (도금/코팅)</td>
                          <td className="p-2 font-mono">15.0㎛ ±2.0㎛</td>
                          <td className="p-2 font-mono font-black text-emerald-700">{selectedShipping.coatingValue}</td>
                          <td className="p-2">X-선 형광분석기 (XRF)</td>
                          <td className="p-2 text-center font-bold text-emerald-600">PASS</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Sign-off Stamps & Environment */}
                  <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-200 text-xs gap-3">
                    <div className="space-y-0.5 text-slate-500 text-[11px]">
                      <div>측정 환경: 20.0℃ ±0.2℃ / 45% RH (ISO Class 5 Cleanroom)</div>
                      <div>본 성적서는 KOLAS 공인 검사 기준에 의거하여 발행되었습니다.</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-left">
                      {/* Inspector Dropdown */}
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          검사 책임자 선택
                        </label>
                        <select
                          value={selectedShipping.inspector}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedShipping({ ...selectedShipping, inspector: val });
                            setShippingProjects((prev) =>
                              prev.map((p) => (p.id === selectedShipping.id ? { ...p, inspector: val } : p))
                            );
                            showToast('info', `검사 책임자가 [${val}](으)로 변경되었습니다.`);
                          }}
                          className="bg-white px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 cursor-pointer focus:ring-1 focus:ring-blue-500"
                        >
                          {approvedInspectors.map((insp) => (
                            <option key={insp} value={insp}>
                              {insp}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* QA Manager Dropdown */}
                      <div className="relative bg-slate-50 p-2 pr-6 rounded-xl border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          QA 부서장 승인자 선택
                        </label>
                        <select
                          value={selectedShipping.qaManager}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedShipping({ ...selectedShipping, qaManager: val });
                            setShippingProjects((prev) =>
                              prev.map((p) => (p.id === selectedShipping.id ? { ...p, qaManager: val } : p))
                            );
                            showToast('info', `QA 부서장이 [${val}](으)로 변경되었습니다.`);
                          }}
                          className="bg-white px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 cursor-pointer focus:ring-1 focus:ring-blue-500"
                        >
                          {approvedQaManagers.map((mgr) => (
                            <option key={mgr} value={mgr}>
                              {mgr}
                            </option>
                          ))}
                        </select>

                        {/* Red Stamp Badge */}
                        <span className="absolute -top-2 -right-2 w-9 h-9 rounded-full border-2 border-rose-600 text-rose-600 font-bold text-[8px] flex items-center justify-center rotate-12 opacity-85 select-none pointer-events-none bg-rose-50/50">
                          검사인
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5 Checklist Items */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <span className="font-black text-slate-900 dark:text-white">
                  필수 출하 검증 5개 체크리스트 확인
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedShipping.checklist.cmmPointScan}
                      readOnly
                      className="rounded text-blue-600"
                    />
                    <span>1. CMM 3차원 전수 포인트 공차 검사 완료</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedShipping.checklist.roughnessInterferometer}
                      readOnly
                      className="rounded text-blue-600"
                    />
                    <span>2. 비접촉 광학 간섭계 경면 조도(Ra≤0.02㎛) 확인</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedShipping.checklist.boltInterference}
                      readOnly
                      className="rounded text-blue-600"
                    />
                    <span>3. 립 조절 볼트 및 심 플레이트 조립 간섭 테스트</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedShipping.checklist.ultrasonicCleaning}
                      readOnly
                      className="rounded text-blue-600"
                    />
                    <span>4. 메가소닉 3단계 정밀 탈지 세척 및 건조</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedShipping.checklist.cleanroomPackaging}
                      readOnly
                      className="rounded text-blue-600"
                    />
                    <span>5. 방청 피막 및 클린룸 2중 진공 포장 완료</span>
                  </label>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  id="btn-print-coa"
                  onClick={handlePrintCOA}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span>[ 🖨️ 최종 COA 성적서 일괄 출력 ]</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-reject-shipping"
                    onClick={handleRejectShipping}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Ban className="w-4 h-4 text-rose-600" />
                    <span>[ 🚨 품질 부적합 출하 보류 및 반려 ]</span>
                  </button>

                  <button
                    id="btn-approve-shipping"
                    onClick={handleApproveShipping}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>[ 📦 출하 검수 최종 승인 ]</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. TAB: [슬롯다이 성적서 관리 (SEMES 1580mm STS630)]                   */}
      {/* ==================================================================== */}
      {activeTab === 'TAB_SLOT_DIE_COA' && (
        <SlotDieCertificateView
          onTriggerCapa={(defectInfo) => {
            setQualityStage('IPQC');
            setActiveTab('TAB1_IPQC_CMM');
            showToast(
              'warning',
              '🚨 긴급 CAPA 시정 조치 티켓이 생성되었습니다.',
              `이탈 항목 [${defectInfo.item}] 실측값(${defectInfo.actual}) 재가공/재연마 공정으로 이관됨`
            );
          }}
        />
      )}

      {/* ==================================================================== */}
      {/* 7. TAB: [수입검사 (IQC - 소재/외주 입고 검사대장)]                   */}
      {/* ==================================================================== */}
      {activeTab === 'TAB_IQC' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center flex-wrap gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    수입검사 (IQC) - 원소재(STS630 / SUS420J2) 및 외주 가공품 입고 검사대장
                  </h3>
                  {(() => {
                    const passCount = iqcLots.filter((l) => calculateIqcOverallResult(l) === 'PASS').length;
                    const failCount = iqcLots.length - passCount;
                    return failCount === 0 ? (
                      <span className="text-sm font-black font-sans px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap shadow-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        전수 합격 ({passCount}/{iqcLots.length} PASS)
                      </span>
                    ) : (
                      <span className="text-sm font-black font-sans px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap shadow-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        부적합 검출 ({passCount}/{iqcLots.length} 합격, {failCount}건 NG)
                      </span>
                    );
                  })()}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  밀시트(Mill Sheet) 화학 성분 분석, 초음파 비파괴 탐상(UT), 열처리 경도(HRC), 모재 표면 결함 및 치수 검증
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs font-bold text-amber-800 dark:text-amber-300">
                원소재 전수 검사 완료
              </div>
            </div>
          </div>

          {/* Subtabs for IQC Active / Archived */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setIqcFilterArchive('ACTIVE')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  iqcFilterArchive === 'ACTIVE'
                    ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>활성 입고 LOT ({activeIqcCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setIqcFilterArchive('ARCHIVED')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  iqcFilterArchive === 'ARCHIVED'
                    ? 'bg-[#FFF9EB] dark:bg-amber-950/60 text-[#B45309] dark:text-amber-300 border border-[#FCD34D] dark:border-amber-700/80 shadow-2xs'
                    : 'text-slate-500 hover:text-[#B45309] dark:hover:text-amber-300'
                }`}
              >
                <Archive className="w-3.5 h-3.5 text-[#B45309] dark:text-amber-400" />
                <span>IQC 보관함 ({archivedIqcCount})</span>
              </button>
            </div>

            <span className="text-xs text-slate-500 font-mono">
              총 {filteredIqcLots.length}건 표시 중
            </span>
          </div>

          {/* Dynamic IQC Lots Grid */}
          {filteredIqcLots.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
              {iqcFilterArchive === 'ARCHIVED'
                ? '보관함에 보관된 수입검사 LOT가 없습니다.'
                : '현재 등록된 활성 입고 LOT가 없습니다. 상단 [수입검사대장 / 신규 LOT 관리] 버튼으로 신규 LOT를 등록하세요.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredIqcLots.map((lot) => {
                const overallResult = calculateIqcOverallResult(lot);
                return (
                <div
                  key={lot.id}
                  id={`card-iqc-lot-${lot.id}`}
                  onClick={() => {
                    setSelectedIqcLotId(lot.id);
                    setIsIqcModalOpen(true);
                  }}
                  className="p-5 rounded-2xl bg-slate-50 hover:bg-white dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 hover:border-amber-500 dark:border-slate-700 dark:hover:border-amber-400 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Row: Supplier name + Result badge & Archive toggle */}
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-bold">
                        <span className={`w-2.5 h-2.5 rounded-full ${overallResult === 'PASS' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                        <span>{lot.supplier}</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            overallResult === 'PASS'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                          }`}
                        >
                          {overallResult}
                        </span>
                        {/* Archive Toggle */}
                        <button
                          type="button"
                          title={lot.isArchived ? '보관함에서 복원' : '보관함으로 이동'}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIqcLots((prev) =>
                              prev.map((l) => (l.id === lot.id ? { ...l, isArchived: !l.isArchived } : l))
                            );
                            showToast('info', lot.isArchived ? '입고 LOT가 복원되었습니다.' : '입고 LOT가 보관함으로 이동되었습니다.');
                          }}
                          className="p-1 rounded-md text-[#B45309] dark:text-amber-300 bg-[#FFF9EB] hover:bg-[#FEF3D6] dark:bg-amber-950/40 border border-[#FCD34D] dark:border-amber-700/80 shadow-2xs transition cursor-pointer"
                        >
                          {lot.isArchived ? (
                            <ArchiveRestore className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <Archive className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* LOT Number placed BELOW supplier name */}
                    <div className="flex items-center justify-between bg-blue-50/60 dark:bg-blue-950/30 px-2.5 py-1 rounded-lg border border-blue-200/60 dark:border-blue-900/60">
                      <span className="text-[10px] font-bold text-slate-500">LOT NO:</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-black text-xs">
                        {lot.lotNo}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {lot.materialType}
                      </h4>
                      {lot.projectRef && (
                        <div className="mt-1">
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 truncate max-w-full">
                            <span className="font-extrabold mr-1">프로젝트:</span>
                            <span className="truncate">{lot.projectRef}</span>
                          </span>
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500 font-mono mt-1">
                        {lot.standard} ({lot.incomingDate})
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 font-mono">
                      <div className="flex justify-between">
                        <span>• 입고 치수:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {lot.rawDimensions.length.actual} × {lot.rawDimensions.width.actual} × {lot.rawDimensions.thickness.actual}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>• 경도:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {lot.mechanicalProperties.hardness.actual} ({lot.mechanicalProperties.hardness.result})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>• UT 비파괴:</span>
                        <span className={`font-bold ${lot.utInspection.result === 'PASS' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {lot.utInspection.result === 'PASS' ? '무결함 PASS' : '결함 검출'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>• 검사자:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {lot.inspector} {lot.approver ? `(승인: ${lot.approver})` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] font-bold text-amber-600 dark:text-amber-400 group-hover:text-amber-700">
                    <span>밀시트 성분 & UT 성적서 상세 열기</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. MODALS & POPUPS                                                   */}
      {/* ==================================================================== */}

      {/* KPI Detail Analytics Modal */}
      <KpiDetailModal
        isOpen={!!selectedKpiModal}
        onClose={() => setSelectedKpiModal(null)}
        initialType={selectedKpiModal}
      />

      {/* IQC Detail Inspection Log Modal */}
      <IqcDetailModal
        isOpen={isIqcModalOpen}
        onClose={() => setIsIqcModalOpen(false)}
        initialLotId={selectedIqcLotId}
        lots={iqcLots}
        onUpdateLots={setIqcLots}
        currentUser={currentUser}
        inspectors={approvedInspectors}
        qaManagers={approvedQaManagers}
        projects={registeredProjects}
      />

      {/* IPQC Print Modal */}
      <IpqcPrintModal
        isOpen={isIpqcPrintModalOpen}
        onClose={() => setIsIpqcPrintModalOpen(false)}
        inspection={selectedInspection}
      />

      {/* New IPQC Modal */}
      <NewIpqcModal
        isOpen={isNewIpqcModalOpen}
        onClose={() => setIsNewIpqcModalOpen(false)}
        onAddInspection={handleAddIpqc}
        inspectors={approvedInspectors}
        currentUser={currentUser}
      />

      {/* Shipping COA Print Modal */}
      <ShippingCoaPrintModal
        isOpen={isShippingPrintModalOpen}
        onClose={() => setIsShippingPrintModalOpen(false)}
        shipping={selectedShipping}
      />

      {/* New Shipping Project Modal */}
      <NewShippingModal
        isOpen={isNewShippingModalOpen}
        onClose={() => setIsNewShippingModalOpen(false)}
        onAddShipping={handleAddShipping}
        inspectors={approvedInspectors}
        qaManagers={approvedQaManagers}
        currentUser={currentUser}
      />
    </div>
  );
};
