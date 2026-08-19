import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Printer,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Award,
  Layers,
  Search,
  Eye,
  Sliders,
  Maximize2,
  ChevronRight,
  TrendingUp,
  Microscope,
  Compass,
  Zap,
  Hammer,
  FileSpreadsheet,
  Download,
  AlertOctagon,
  Wrench,
  Check,
  X,
  Plus,
  Settings2,
  Edit3,
  Save,
  RefreshCw,
  Box,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

// ============================================================================
// 1. DATA DEFINITIONS & CERTIFICATE RAW DATA (DYNAMIC VARIABLE RECIPES)
// ============================================================================

export interface Measurement30Point {
  point: number;
  lipA1: number;
  lipA2: number;
  boltB1: number;
  boltB2: number;
}

export interface Straightness30Point {
  point: number;
  frontLine: number;
  rearLine: number;
}

export interface ProductSpecRecipe {
  id: string;
  docNo: string;
  customer: string;
  productName: string;
  material: string;
  scope: string;
  inspector: string;
  approver: string;
  inspectionDate: string;

  // FRONT PLATE DIMENSIONS
  frontLengthNominal: number;
  frontLengthTol: number;
  frontLengthActual: number;
  frontHeightNominal: number;
  frontHeightTol: number;
  frontHeightActual: number;
  frontThicknessNominal: number;
  frontThicknessTol: number;
  frontThicknessActual: number;
  frontLipNominal: number;
  frontLipTol: number;
  frontLipActual: number;
  frontGapNominal: number;
  frontGapTol: number;
  frontGapActual: number;
  frontRoughnessLimit: number;
  frontRoughnessActual: number;

  // REAR PLATE DIMENSIONS
  rearLengthNominal: number;
  rearLengthTol: number;
  rearLengthActual: number;
  rearHeightNominal: number;
  rearHeightTol: number;
  rearHeightActual: number;
  rearThicknessNominal: number;
  rearThicknessTol: number;
  rearThicknessActual: number;
  rearLipNominal: number;
  rearLipTol: number;
  rearLipActual: number;
  rearRoughnessLimit: number;
  rearRoughnessActual: number;

  // TOLERANCES & PHYSICAL TESTS
  geometryToleranceLimitUm: number;
  hardnessTarget: string;
  hardnessMin: number;
  hardnessMax: number;
  hardnessVal1: number;
  hardnessVal2: number;
  magnetismLimit: number;
  magnetismFront1: number;
  magnetismFront2: number;
  magnetismRear1: number;
  magnetismRear2: number;

  // BOLT SPEC
  boltCount: number;
  boltTorque: number;
}

export const PRODUCT_PRESETS: ProductSpecRecipe[] = [
  {
    id: 'SEMES_1580',
    docNo: 'JS-QC260303-01N',
    customer: '세메스(SEMES)',
    productName: 'SLIT NOZZLE 1580mm',
    material: 'STS630',
    scope: 'New / All',
    inspector: 'MW.Jeon (선임연구원)',
    approver: 'SH.Kim (품질보증총괄)',
    inspectionDate: '2026.03.03',
    frontLengthNominal: 1580.0,
    frontLengthTol: 0.3,
    frontLengthActual: 1580.0,
    frontHeightNominal: 160.0,
    frontHeightTol: 0.2,
    frontHeightActual: 160.0,
    frontThicknessNominal: 60.0,
    frontThicknessTol: 0.1,
    frontThicknessActual: 60.0,
    frontLipNominal: 0.3,
    frontLipTol: 0.005,
    frontLipActual: 0.3,
    frontGapNominal: 0.08,
    frontGapTol: 0.002,
    frontGapActual: 0.08,
    frontRoughnessLimit: 0.2,
    frontRoughnessActual: 0.17,

    rearLengthNominal: 1493.0,
    rearLengthTol: 0.1,
    rearLengthActual: 1493.0,
    rearHeightNominal: 160.0,
    rearHeightTol: 0.2,
    rearHeightActual: 160.0,
    rearThicknessNominal: 70.0,
    rearThicknessTol: 0.1,
    rearThicknessActual: 70.0,
    rearLipNominal: 0.3,
    rearLipTol: 0.005,
    rearLipActual: 0.3,
    rearRoughnessLimit: 0.2,
    rearRoughnessActual: 0.169,

    geometryToleranceLimitUm: 5.0,
    hardnessTarget: 'HRC 40 ± 2',
    hardnessMin: 38.0,
    hardnessMax: 42.0,
    hardnessVal1: 40.2,
    hardnessVal2: 39.9,
    magnetismLimit: 0.2,
    magnetismFront1: 0.08,
    magnetismFront2: 0.06,
    magnetismRear1: 0.05,
    magnetismRear2: 0.07,

    boltCount: 43,
    boltTorque: 5.0
  },
  {
    id: 'SDI_1200',
    docNo: 'JS-QC260519-SDI01',
    customer: '삼성SDI',
    productName: '2차전지 양극재 코팅용 슬롯다이 (1200mm)',
    material: 'SUS420J2',
    scope: 'New / All',
    inspector: '김준성 (책임연구원)',
    approver: '이준혁 (품질이사)',
    inspectionDate: '2026.05.19',
    frontLengthNominal: 1200.0,
    frontLengthTol: 0.2,
    frontLengthActual: 1200.02,
    frontHeightNominal: 140.0,
    frontHeightTol: 0.15,
    frontHeightActual: 140.01,
    frontThicknessNominal: 55.0,
    frontThicknessTol: 0.08,
    frontThicknessActual: 55.0,
    frontLipNominal: 0.25,
    frontLipTol: 0.004,
    frontLipActual: 0.25,
    frontGapNominal: 0.06,
    frontGapTol: 0.002,
    frontGapActual: 0.06,
    frontRoughnessLimit: 0.15,
    frontRoughnessActual: 0.12,

    rearLengthNominal: 1140.0,
    rearLengthTol: 0.1,
    rearLengthActual: 1140.01,
    rearHeightNominal: 140.0,
    rearHeightTol: 0.15,
    rearHeightActual: 140.0,
    rearThicknessNominal: 65.0,
    rearThicknessTol: 0.08,
    rearThicknessActual: 65.01,
    rearLipNominal: 0.25,
    rearLipTol: 0.004,
    rearLipActual: 0.25,
    rearRoughnessLimit: 0.15,
    rearRoughnessActual: 0.118,

    geometryToleranceLimitUm: 3.0,
    hardnessTarget: 'HRC 54 ± 2',
    hardnessMin: 52.0,
    hardnessMax: 56.0,
    hardnessVal1: 54.5,
    hardnessVal2: 54.2,
    magnetismLimit: 0.15,
    magnetismFront1: 0.04,
    magnetismFront2: 0.05,
    magnetismRear1: 0.03,
    magnetismRear2: 0.04,

    boltCount: 31,
    boltTorque: 5.5
  },
  {
    id: 'LGD_1600',
    docNo: 'JS-QC260519-LGD02',
    customer: 'LG디스플레이',
    productName: 'OLED OCA 광학 코팅용 슬롯다이 (1600mm)',
    material: 'STS630',
    scope: 'New / All',
    inspector: '이영희 (선임연구원)',
    approver: '이준혁 (품질이사)',
    inspectionDate: '2026.05.19',
    frontLengthNominal: 1600.0,
    frontLengthTol: 0.3,
    frontLengthActual: 1600.0,
    frontHeightNominal: 160.0,
    frontHeightTol: 0.2,
    frontHeightActual: 160.0,
    frontThicknessNominal: 60.0,
    frontThicknessTol: 0.1,
    frontThicknessActual: 60.0,
    frontLipNominal: 0.35,
    frontLipTol: 0.005,
    frontLipActual: 0.35,
    frontGapNominal: 0.09,
    frontGapTol: 0.003,
    frontGapActual: 0.09,
    frontRoughnessLimit: 0.2,
    frontRoughnessActual: 0.165,

    rearLengthNominal: 1510.0,
    rearLengthTol: 0.15,
    rearLengthActual: 1510.0,
    rearHeightNominal: 160.0,
    rearHeightTol: 0.2,
    rearHeightActual: 160.0,
    rearThicknessNominal: 70.0,
    rearThicknessTol: 0.1,
    rearThicknessActual: 70.0,
    rearLipNominal: 0.35,
    rearLipTol: 0.005,
    rearLipActual: 0.35,
    rearRoughnessLimit: 0.2,
    rearRoughnessActual: 0.162,

    geometryToleranceLimitUm: 5.0,
    hardnessTarget: 'HRC 40 ± 2',
    hardnessMin: 38.0,
    hardnessMax: 42.0,
    hardnessVal1: 40.4,
    hardnessVal2: 40.1,
    magnetismLimit: 0.2,
    magnetismFront1: 0.06,
    magnetismFront2: 0.07,
    magnetismRear1: 0.05,
    magnetismRear2: 0.06,

    boltCount: 45,
    boltTorque: 5.0
  },
  {
    id: 'MOBIS_800',
    docNo: 'JS-QC260519-HM03',
    customer: '현대모비스',
    productName: '수소연료전지 전해질막 노즐 심 플레이트 (800mm)',
    material: 'SUS316L',
    scope: 'New / Precision',
    inspector: '박철수 (주임연구원)',
    approver: '이준혁 (품질이사)',
    inspectionDate: '2026.05.19',
    frontLengthNominal: 800.0,
    frontLengthTol: 0.15,
    frontLengthActual: 800.0,
    frontHeightNominal: 120.0,
    frontHeightTol: 0.1,
    frontHeightActual: 120.0,
    frontThicknessNominal: 45.0,
    frontThicknessTol: 0.05,
    frontThicknessActual: 45.0,
    frontLipNominal: 0.2,
    frontLipTol: 0.003,
    frontLipActual: 0.2,
    frontGapNominal: 0.04,
    frontGapTol: 0.0015,
    frontGapActual: 0.04,
    frontRoughnessLimit: 0.1,
    frontRoughnessActual: 0.085,

    rearLengthNominal: 760.0,
    rearLengthTol: 0.1,
    rearLengthActual: 760.0,
    rearHeightNominal: 120.0,
    rearHeightTol: 0.1,
    rearHeightActual: 120.0,
    rearThicknessNominal: 50.0,
    rearThicknessTol: 0.05,
    rearThicknessActual: 50.0,
    rearLipNominal: 0.2,
    rearLipTol: 0.003,
    rearLipActual: 0.2,
    rearRoughnessLimit: 0.1,
    rearRoughnessActual: 0.082,

    geometryToleranceLimitUm: 2.0,
    hardnessTarget: 'HRB 90 ± 5',
    hardnessMin: 85.0,
    hardnessMax: 95.0,
    hardnessVal1: 91.2,
    hardnessVal2: 90.8,
    magnetismLimit: 0.05,
    magnetismFront1: 0.01,
    magnetismFront2: 0.02,
    magnetismRear1: 0.01,
    magnetismRear2: 0.01,

    boltCount: 21,
    boltTorque: 4.0
  },
  {
    id: 'SKON_1400',
    docNo: 'JS-QC260520-SK01',
    customer: 'SK온',
    productName: '하이니켈 배터리 전극 코팅용 슬롯노즐 (1400mm)',
    material: 'STS630',
    scope: 'New / All',
    inspector: '최민지 (선임연구원)',
    approver: '이준혁 (품질이사)',
    inspectionDate: '2026.05.20',
    frontLengthNominal: 1400.0,
    frontLengthTol: 0.25,
    frontLengthActual: 1400.01,
    frontHeightNominal: 150.0,
    frontHeightTol: 0.2,
    frontHeightActual: 150.0,
    frontThicknessNominal: 65.0,
    frontThicknessTol: 0.1,
    frontThicknessActual: 65.0,
    frontLipNominal: 0.3,
    frontLipTol: 0.005,
    frontLipActual: 0.3,
    frontGapNominal: 0.075,
    frontGapTol: 0.002,
    frontGapActual: 0.075,
    frontRoughnessLimit: 0.2,
    frontRoughnessActual: 0.158,

    rearLengthNominal: 1330.0,
    rearLengthTol: 0.12,
    rearLengthActual: 1330.0,
    rearHeightNominal: 150.0,
    rearHeightTol: 0.2,
    rearHeightActual: 150.0,
    rearThicknessNominal: 70.0,
    rearThicknessTol: 0.1,
    rearThicknessActual: 70.0,
    rearLipNominal: 0.3,
    rearLipTol: 0.005,
    rearLipActual: 0.3,
    rearRoughnessLimit: 0.2,
    rearRoughnessActual: 0.155,

    geometryToleranceLimitUm: 4.0,
    hardnessTarget: 'HRC 40 ± 2',
    hardnessMin: 38.0,
    hardnessMax: 42.0,
    hardnessVal1: 40.1,
    hardnessVal2: 39.8,
    magnetismLimit: 0.2,
    magnetismFront1: 0.07,
    magnetismFront2: 0.05,
    magnetismRear1: 0.04,
    magnetismRear2: 0.06,

    boltCount: 37,
    boltTorque: 5.0
  }
];

// Page 2 Flatness 30 Points
export const RAW_FLATNESS_30_FRONT: Measurement30Point[] = [
  { point: 1, lipA1: 0.65, lipA2: 0.83, boltB1: 0.48, boltB2: 0.26 },
  { point: 2, lipA1: 0.58, lipA2: 0.66, boltB1: 0.72, boltB2: 0.89 },
  { point: 3, lipA1: 0.51, lipA2: 0.58, boltB1: 0.87, boltB2: 0.73 },
  { point: 4, lipA1: 0.34, lipA2: 0.40, boltB1: 0.50, boltB2: 0.46 },
  { point: 5, lipA1: 0.16, lipA2: 0.22, boltB1: 0.12, boltB2: 0.28 },
  { point: 6, lipA1: 0.09, lipA2: 0.04, boltB1: -0.25, boltB2: 0.01 },
  { point: 7, lipA1: 0.01, lipA2: -0.03, boltB1: 0.17, boltB2: -0.07 },
  { point: 8, lipA1: -0.07, lipA2: -0.11, boltB1: -0.10, boltB2: -0.25 },
  { point: 9, lipA1: -0.31, lipA2: -0.34, boltB1: -0.18, boltB2: -0.23 },
  { point: 10, lipA1: -0.33, lipA2: -0.38, boltB1: -0.60, boltB2: -0.46 },
  { point: 11, lipA1: -0.26, lipA2: -0.41, boltB1: -0.33, boltB2: -0.28 },
  { point: 12, lipA1: -0.39, lipA2: -0.44, boltB1: -0.34, boltB2: -0.41 },
  { point: 13, lipA1: -0.41, lipA2: -0.57, boltB1: -0.47, boltB2: -0.52 },
  { point: 14, lipA1: -0.54, lipA2: -0.59, boltB1: -0.59, boltB2: -0.55 },
  { point: 15, lipA1: -0.54, lipA2: -0.58, boltB1: -0.57, boltB2: -0.63 },
  { point: 16, lipA1: -0.54, lipA2: -0.49, boltB1: -0.46, boltB2: -0.51 },
  { point: 17, lipA1: -0.44, lipA2: -0.39, boltB1: -0.73, boltB2: -0.49 },
  { point: 18, lipA1: -0.34, lipA2: -0.40, boltB1: -0.21, boltB2: -0.27 },
  { point: 19, lipA1: -0.25, lipA2: -0.20, boltB1: -0.28, boltB2: -0.15 },
  { point: 20, lipA1: -0.05, lipA2: -0.10, boltB1: 0.03, boltB2: -0.02 },
  { point: 21, lipA1: 0.04, lipA2: -0.01, boltB1: -0.36, boltB2: -0.13 },
  { point: 22, lipA1: -0.09, lipA2: 0.07, boltB1: 0.22, boltB2: 0.16 },
  { point: 23, lipA1: 0.09, lipA2: 0.13, boltB1: 0.10, boltB2: 0.24 },
  { point: 24, lipA1: 0.05, lipA2: 0.20, boltB1: 0.29, boltB2: 0.34 },
  { point: 25, lipA1: 0.32, lipA2: 0.26, boltB1: -0.12, boltB2: 0.32 },
  { point: 26, lipA1: 0.28, lipA2: 0.32, boltB1: 0.36, boltB2: 0.40 },
  { point: 27, lipA1: 0.34, lipA2: 0.40, boltB1: 0.54, boltB2: 0.38 },
  { point: 28, lipA1: 0.49, lipA2: 0.44, boltB1: 0.52, boltB2: 0.35 },
  { point: 29, lipA1: 0.26, lipA2: 0.21, boltB1: 0.60, boltB2: 0.43 },
  { point: 30, lipA1: 0.34, lipA2: 0.28, boltB1: 0.08, boltB2: -0.29 }
];

export const RAW_FLATNESS_30_REAR: Measurement30Point[] = [
  { point: 1, lipA1: 0.53, lipA2: 0.39, boltB1: 1.57, boltB2: 1.13 },
  { point: 2, lipA1: 0.65, lipA2: 0.62, boltB1: 1.70, boltB2: 0.74 },
  { point: 3, lipA1: 0.55, lipA2: 0.61, boltB1: 0.63, boltB2: 0.56 },
  { point: 4, lipA1: 0.44, lipA2: 0.49, boltB1: 0.44, boltB2: -0.12 },
  { point: 5, lipA1: 0.24, lipA2: 0.39, boltB1: 0.24, boltB2: 0.18 },
  { point: 6, lipA1: 0.23, lipA2: 0.18, boltB1: -0.56, boltB2: 0.18 },
  { point: 7, lipA1: 0.03, lipA2: -0.03, boltB1: -0.06, boltB2: 0.18 },
  { point: 8, lipA1: -0.18, lipA2: -0.04, boltB1: -0.36, boltB2: -0.63 },
  { point: 9, lipA1: -0.29, lipA2: -0.23, boltB1: -0.26, boltB2: -0.13 },
  { point: 10, lipA1: -0.25, lipA2: -0.21, boltB1: -0.94, boltB2: -0.11 },
  { point: 11, lipA1: -0.33, lipA2: -0.38, boltB1: -0.39, boltB2: -0.17 },
  { point: 12, lipA1: -0.50, lipA2: -0.36, boltB1: -0.55, boltB2: -0.62 },
  { point: 13, lipA1: -0.47, lipA2: -0.44, boltB1: -0.50, boltB2: -0.38 },
  { point: 14, lipA1: -0.44, lipA2: -0.50, boltB1: -0.86, boltB2: -0.44 },
  { point: 15, lipA1: -0.52, lipA2: -0.58, boltB1: -0.82, boltB2: -0.60 },
  { point: 16, lipA1: -0.51, lipA2: -0.57, boltB1: -0.67, boltB2: -0.46 },
  { point: 17, lipA1: -0.48, lipA2: -0.54, boltB1: -0.61, boltB2: -0.48 },
  { point: 18, lipA1: -0.44, lipA2: -0.50, boltB1: -0.53, boltB2: -0.31 },
  { point: 19, lipA1: -0.30, lipA2: -0.46, boltB1: -0.35, boltB2: -0.43 },
  { point: 20, lipA1: -0.16, lipA2: -0.22, boltB1: -0.28, boltB2: -0.05 },
  { point: 21, lipA1: -0.12, lipA2: -0.08, boltB1: -0.50, boltB2: 0.02 },
  { point: 22, lipA1: 0.01, lipA2: 0.05, boltB1: -0.16, boltB2: 0.07 },
  { point: 23, lipA1: 0.02, lipA2: 0.16, boltB1: -0.02, boltB2: -0.49 },
  { point: 24, lipA1: 0.13, lipA2: 0.06, boltB1: 0.12, boltB2: 0.25 },
  { point: 25, lipA1: 0.24, lipA2: 0.18, boltB1: -0.34, boltB2: 0.39 },
  { point: 26, lipA1: 0.25, lipA2: 0.18, boltB1: 0.20, boltB2: 0.23 },
  { point: 27, lipA1: 0.25, lipA2: 0.39, boltB1: 0.40, boltB2: -0.06 },
  { point: 28, lipA1: 0.46, lipA2: 0.50, boltB1: 0.55, boltB2: 0.47 },
  { point: 29, lipA1: 0.42, lipA2: 0.46, boltB1: 1.19, boltB2: 0.51 },
  { point: 30, lipA1: 0.55, lipA2: 0.49, boltB1: 1.73, boltB2: 0.56 }
];

// Page 3 Straightness 30 Points
export const RAW_STRAIGHTNESS_30: Straightness30Point[] = [
  { point: 1, frontLine: 0.98, rearLine: 0.92 },
  { point: 2, frontLine: 0.86, rearLine: 0.69 },
  { point: 3, frontLine: 0.73, rearLine: 0.57 },
  { point: 4, frontLine: 0.41, rearLine: 0.44 },
  { point: 5, frontLine: 0.22, rearLine: 0.24 },
  { point: 6, frontLine: -0.07, rearLine: 0.04 },
  { point: 7, frontLine: -0.06, rearLine: -0.17 },
  { point: 8, frontLine: -0.15, rearLine: -0.26 },
  { point: 9, frontLine: -0.24, rearLine: -0.46 },
  { point: 10, frontLine: -0.63, rearLine: -0.56 },
  { point: 11, frontLine: -0.68, rearLine: -0.62 },
  { point: 12, frontLine: -0.46, rearLine: -0.52 },
  { point: 13, frontLine: -0.75, rearLine: -0.61 },
  { point: 14, frontLine: -0.44, rearLine: -0.40 },
  { point: 15, frontLine: -0.62, rearLine: -0.49 },
  { point: 16, frontLine: -0.51, rearLine: -0.39 },
  { point: 17, frontLine: 0.01, rearLine: -0.28 },
  { point: 18, frontLine: -0.40, rearLine: -0.11 },
  { point: 19, frontLine: -0.42, rearLine: -0.03 },
  { point: 20, frontLine: -0.24, rearLine: -0.05 },
  { point: 21, frontLine: -0.25, rearLine: 0.02 },
  { point: 22, frontLine: -0.07, rearLine: 0.10 },
  { point: 23, frontLine: -0.09, rearLine: 0.27 },
  { point: 24, frontLine: -0.03, rearLine: 0.22 },
  { point: 25, frontLine: 0.38, rearLine: 0.23 },
  { point: 26, frontLine: 0.59, rearLine: 0.12 },
  { point: 27, frontLine: 0.40, rearLine: 0.22 },
  { point: 28, frontLine: 0.71, rearLine: 0.22 },
  { point: 29, frontLine: 0.42, rearLine: 0.22 },
  { point: 30, frontLine: 0.33, rearLine: 0.42 }
];

export const RAW_OPTICAL_MEASUREMENTS = {
  front: [
    { point: 1, val: 0.301, name: 'FRONT 1' },
    { point: 2, val: 0.299, name: 'FRONT 2' },
    { point: 3, val: 0.300, name: 'FRONT 3' },
    { point: 4, val: 0.302, name: 'FRONT 4' },
    { point: 5, val: 0.298, name: 'FRONT 5' },
    { point: 6, val: 0.300, name: 'FRONT 6' }
  ],
  rear: [
    { point: 1, val: 0.300, name: 'REAR 1' },
    { point: 2, val: 0.301, name: 'REAR 2' },
    { point: 3, val: 0.299, name: 'REAR 3' },
    { point: 4, val: 0.300, name: 'REAR 4' },
    { point: 5, val: 0.301, name: 'REAR 5' },
    { point: 6, val: 0.299, name: 'REAR 6' }
  ]
};

export const RAW_DAMPER_STEP = [
  { no: 1, front: 0.050, damper: 0.050, dev: 0.000 },
  { no: 2, front: 0.051, damper: 0.050, dev: 0.001 },
  { no: 3, front: 0.050, damper: 0.050, dev: 0.000 },
  { no: 4, front: 0.049, damper: 0.050, dev: -0.001 },
  { no: 5, front: 0.050, damper: 0.050, dev: 0.000 },
  { no: 6, front: 0.050, damper: 0.050, dev: 0.000 },
  { no: 7, front: 0.051, damper: 0.050, dev: 0.001 },
  { no: 8, front: 0.050, damper: 0.050, dev: 0.000 },
  { no: 9, front: 0.049, damper: 0.050, dev: -0.001 },
  { no: 10, front: 0.050, damper: 0.050, dev: 0.000 }
];

export const generateAdjustmentBolts = (count: number, torque: number = 5.0) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    torque: torque,
    pitch: 'M6 x 0.5 Micro',
    travelMm: 0.50,
    backlashUm: 1.2,
    status: 'OK' as const
  }));
};

// ============================================================================
// 2. MAIN COMPONENT: SlotDieCertificateView
// ============================================================================

interface SlotDieCertificateViewProps {
  initialRecipeId?: string;
  onTriggerCapa?: (defectInfo: { item: string; tolerance: string; actual: string }) => void;
  currentUser?: { name: string; role?: string } | null;
  inspectors?: string[];
  qaManagers?: string[];
}

export const SlotDieCertificateView: React.FC<SlotDieCertificateViewProps> = ({
  initialRecipeId = 'SEMES_1580',
  onTriggerCapa,
  currentUser,
  inspectors = [],
  qaManagers = []
}) => {
  const [activeCertTab, setActiveCertTab] = useState<'TAB1_MAIN' | 'TAB2_FLATNESS_30' | 'TAB3_ROUGHNESS_OPTICAL' | 'TAB4_HARDNESS_BOLT' | 'TAB_PRINT_ALL'>('TAB1_MAIN');

  // Dynamic Inspector & QA list with currentUser prioritized
  const currentUserName = currentUser?.name?.trim() || '';
  const currentUserTitle = currentUser ? `${currentUser.name} (${currentUser.role === 'ADMIN' ? 'QA 총괄/관리자' : '품질 검사원'})` : '';

  const availableInspectors = useMemo(() => {
    const list = [
      '김준성 책임연구원 (KOLAS 공인)',
      '이영희 (선임연구원)',
      '박민우 (책임연구원)',
      '이동훈 수석검사관 (CMM 1급)',
      '박진우 정밀측정 엔지니어',
      '최현우 품질검사원',
      ...inspectors
    ];
    if (currentUserTitle && !list.includes(currentUserTitle)) {
      return [currentUserTitle, currentUserName, ...list.filter(item => item !== currentUserName && item !== currentUserTitle)];
    } else if (currentUserName && !list.some(item => item.startsWith(currentUserName))) {
      return [currentUserName, ...list];
    }
    return Array.from(new Set(list.filter(Boolean)));
  }, [currentUserTitle, currentUserName, inspectors]);

  const availableApprovers = useMemo(() => {
    const list = [
      '이준혁 (품질이사)',
      '이준혁 품질보증총괄이사',
      '정승원 QA그룹장',
      '강태호 품질보증센터장',
      '오민석 공장장 / 기술이사',
      ...qaManagers
    ];
    if (currentUser?.role === 'ADMIN' && currentUserName) {
      const adminFormatted = `${currentUserName} (QA 관리자)`;
      if (!list.includes(adminFormatted)) {
        return [adminFormatted, currentUserName, ...list];
      }
    } else if (currentUserName && !list.some(item => item.startsWith(currentUserName))) {
      return [currentUserName, ...list];
    }
    return Array.from(new Set(list.filter(Boolean)));
  }, [currentUser, currentUserName, qaManagers]);

  // Multi-Product Variable Recipe State
  const [recipes, setRecipes] = useState<ProductSpecRecipe[]>(() => {
    // If logged in, initialize preset with current user if appropriate
    return PRODUCT_PRESETS.map((p, idx) => {
      if (idx === 0 && currentUser?.name) {
        return {
          ...p,
          inspector: currentUserTitle || currentUser.name
        };
      }
      return p;
    });
  });
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(initialRecipeId);
  const [isSpecEditorOpen, setIsSpecEditorOpen] = useState<boolean>(false);

  // Active Recipe Lookup
  const activeRecipe = useMemo(() => {
    return recipes.find((r) => r.id === selectedRecipeId) || recipes[0];
  }, [recipes, selectedRecipeId]);

  // Form edit buffer for Active Recipe
  const [editForm, setEditForm] = useState<ProductSpecRecipe>(activeRecipe);

  useEffect(() => {
    setEditForm(activeRecipe);
  }, [activeRecipe]);

  const handleQuickChangeInspector = (newInspector: string) => {
    setRecipes((prev) =>
      prev.map((r) => (r.id === activeRecipe.id ? { ...r, inspector: newInspector } : r))
    );
  };

  const handleQuickChangeApprover = (newApprover: string) => {
    setRecipes((prev) =>
      prev.map((r) => (r.id === activeRecipe.id ? { ...r, approver: newApprover } : r))
    );
  };

  // Interactive Editable States for Real-time Testing & Tolerance Verification
  const [frontData30, setFrontData30] = useState<Measurement30Point[]>(RAW_FLATNESS_30_FRONT);
  const [rearData30, setRearData30] = useState<Measurement30Point[]>(RAW_FLATNESS_30_REAR);
  const [straightness30, setStraightness30] = useState<Straightness30Point[]>(RAW_STRAIGHTNESS_30);
  const [opticalData, setOpticalData] = useState(RAW_OPTICAL_MEASUREMENTS);
  const [damperData, setDamperData] = useState(RAW_DAMPER_STEP);
  
  // Dynamic Bolts generated per recipe count
  const dynamicBolts = useMemo(() => {
    return generateAdjustmentBolts(activeRecipe.boltCount, activeRecipe.boltTorque);
  }, [activeRecipe.boltCount, activeRecipe.boltTorque]);

  // Hardness & Magnetism States derived/synced with activeRecipe
  const [hardnessP1, setHardnessP1] = useState<number>(activeRecipe.hardnessVal1);
  const [hardnessP2, setHardnessP2] = useState<number>(activeRecipe.hardnessVal2);
  const [magFrontP1, setMagFrontP1] = useState<number>(activeRecipe.magnetismFront1);
  const [magFrontP2, setMagFrontP2] = useState<number>(activeRecipe.magnetismFront2);
  const [magRearP1, setMagRearP1] = useState<number>(activeRecipe.magnetismRear1);
  const [magRearP2, setMagRearP2] = useState<number>(activeRecipe.magnetismRear2);

  // Gap step synced with activeRecipe
  const [gapStepP1, setGapStepP1] = useState<number>(activeRecipe.frontGapActual);
  const [gapStepP2, setGapStepP2] = useState<number>(activeRecipe.frontGapActual);
  const [gapStepP3, setGapStepP3] = useState<number>(activeRecipe.frontGapActual);

  // Update physical states when selected recipe changes
  useEffect(() => {
    setHardnessP1(activeRecipe.hardnessVal1);
    setHardnessP2(activeRecipe.hardnessVal2);
    setMagFrontP1(activeRecipe.magnetismFront1);
    setMagFrontP2(activeRecipe.magnetismFront2);
    setMagRearP1(activeRecipe.magnetismRear1);
    setMagRearP2(activeRecipe.magnetismRear2);
    setGapStepP1(activeRecipe.frontGapActual);
    setGapStepP2(activeRecipe.frontGapActual);
    setGapStepP3(activeRecipe.frontGapActual);
  }, [activeRecipe]);

  // Toast / Alert Notification
  const [alertModal, setAlertModal] = useState<{ item: string; tolerance: string; actual: string } | null>(null);

  // Helper to test if numeric tolerance passes
  const checkPass = (actual: number, nominal: number, tol: number) => {
    return Math.abs(actual - nominal) <= tol;
  };

  // Calculated Stats Helper
  const calcStats = (vals: number[]) => {
    if (!vals || vals.length === 0) return { max: 0, min: 0, flatness: 0 };
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    const flatness = Math.round((max - min) * 10) / 10;
    return { max: Math.round(max * 10) / 10, min: Math.round(min * 10) / 10, flatness };
  };

  // Front Lip A1/A2 and Bolt B1/B2 Stats
  const frontLipA1Stats = useMemo(() => calcStats(frontData30.map((d) => d.lipA1)), [frontData30]);
  const frontLipA2Stats = useMemo(() => calcStats(frontData30.map((d) => d.lipA2)), [frontData30]);
  const frontBoltB1Stats = useMemo(() => calcStats(frontData30.map((d) => d.boltB1)), [frontData30]);
  const frontBoltB2Stats = useMemo(() => calcStats(frontData30.map((d) => d.boltB2)), [frontData30]);
  const frontStraightStats = useMemo(() => calcStats(straightness30.map((d) => d.frontLine)), [straightness30]);

  // Rear Lip A1/A2 and Bolt B1/B2 Stats
  const rearLipA1Stats = useMemo(() => calcStats(rearData30.map((d) => d.lipA1)), [rearData30]);
  const rearLipA2Stats = useMemo(() => calcStats(rearData30.map((d) => d.lipA2)), [rearData30]);
  const rearBoltB1Stats = useMemo(() => calcStats(rearData30.map((d) => d.boltB1)), [rearData30]);
  const rearBoltB2Stats = useMemo(() => calcStats(rearData30.map((d) => d.boltB2)), [rearData30]);
  const rearStraightStats = useMemo(() => calcStats(straightness30.map((d) => d.rearLine)), [straightness30]);

  // Save recipe spec modifications
  const handleSaveRecipeEdit = () => {
    setRecipes((prev) => prev.map((r) => (r.id === editForm.id ? editForm : r)));
    setIsSpecEditorOpen(false);
  };

  // Add new custom product recipe
  const handleCreateNewRecipe = () => {
    const newId = `CUSTOM_${Date.now()}`;
    const newRecipe: ProductSpecRecipe = {
      id: newId,
      docNo: `JS-QC260520-CUST${Math.floor(Math.random() * 900 + 100)}`,
      customer: '신규 고객사 (Custom)',
      productName: '신규 가변형 초정밀 슬롯다이',
      material: 'STS630',
      scope: 'New / Custom',
      inspector: '검사 담당자',
      approver: '품질 부서장',
      inspectionDate: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      frontLengthNominal: 1500.0,
      frontLengthTol: 0.3,
      frontLengthActual: 1500.0,
      frontHeightNominal: 160.0,
      frontHeightTol: 0.2,
      frontHeightActual: 160.0,
      frontThicknessNominal: 60.0,
      frontThicknessTol: 0.1,
      frontThicknessActual: 60.0,
      frontLipNominal: 0.3,
      frontLipTol: 0.005,
      frontLipActual: 0.3,
      frontGapNominal: 0.08,
      frontGapTol: 0.002,
      frontGapActual: 0.08,
      frontRoughnessLimit: 0.2,
      frontRoughnessActual: 0.165,

      rearLengthNominal: 1420.0,
      rearLengthTol: 0.15,
      rearLengthActual: 1420.0,
      rearHeightNominal: 160.0,
      rearHeightTol: 0.2,
      rearHeightActual: 160.0,
      rearThicknessNominal: 70.0,
      rearThicknessTol: 0.1,
      rearThicknessActual: 70.0,
      rearLipNominal: 0.3,
      rearLipTol: 0.005,
      rearLipActual: 0.3,
      rearRoughnessLimit: 0.2,
      rearRoughnessActual: 0.16,

      geometryToleranceLimitUm: 5.0,
      hardnessTarget: 'HRC 40 ± 2',
      hardnessMin: 38.0,
      hardnessMax: 42.0,
      hardnessVal1: 40.0,
      hardnessVal2: 40.1,
      magnetismLimit: 0.2,
      magnetismFront1: 0.05,
      magnetismFront2: 0.06,
      magnetismRear1: 0.04,
      magnetismRear2: 0.05,

      boltCount: 40,
      boltTorque: 5.0
    };
    setRecipes((prev) => [newRecipe, ...prev]);
    setSelectedRecipeId(newId);
    setEditForm(newRecipe);
    setIsSpecEditorOpen(true);
  };

  // Print Document Trigger
  const handlePrintDocument = () => {
    window.print();
  };

  return (
    <div id="slot-die-certificate-system" className="space-y-4 select-none">
      {/* ==================================================================== */}
      {/* 0. NG WARNING / CAPA ESCALATION MODAL                                */}
      {/* ==================================================================== */}
      {alertModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border-2 border-rose-500 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 border border-rose-300">
                <AlertOctagon className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-600 dark:text-rose-400">
                  공차 이탈(NG) 감지 경보
                </h3>
                <p className="text-xs text-slate-500 font-bold">
                  세메스 납품용 1580mm STS630 슬롯다이 성적서 규격 초과
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans font-bold">이탈 검사 항목:</span>
                <strong className="text-slate-900 dark:text-white">{alertModal.item}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans font-bold">공인 허용 규격:</span>
                <span className="text-blue-600 font-bold">{alertModal.tolerance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans font-bold">현재 입력 측정값:</span>
                <span className="text-rose-600 font-black text-sm">{alertModal.actual} (NG)</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              해당 공차가 허용 기준치를 초과하여 <strong>품질 부적합(FAIL)</strong>으로 판정되었습니다. 시정 조치(CAPA) 티켓을 생성하고 재가공 또는 재연마 공정으로 이관하시겠습니까?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setAlertModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  if (onTriggerCapa) {
                    onTriggerCapa(alertModal);
                  }
                  setAlertModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition"
              >
                <Wrench className="w-4 h-4" />
                <span>CAPA 시정조치 티켓 즉시 발행</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. METADATA HEADER & OFFICIAL COA BADGE                              */}
      {/* ==================================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 rounded-3xl border border-blue-900/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-mono font-bold">
              Doc No: {activeRecipe.docNo}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
              {activeRecipe.customer} 공식 납품 규격
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
              {activeRecipe.scope}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-mono font-bold">
              조절볼트 {activeRecipe.boltCount}EA
            </span>
          </div>

          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <span>{activeRecipe.productName} ({activeRecipe.material}) 검사 성적서</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-300 font-medium pt-1">
            <div>고객사: <strong className="text-white">{activeRecipe.customer}</strong></div>
            <div>규격/재질: <strong className="text-white">{activeRecipe.frontLengthNominal}mm / {activeRecipe.material}</strong></div>
            
            {/* Interactive Inspector Selector */}
            <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-xl border border-white/10">
              <span className="text-slate-400 shrink-0 font-bold">검사자:</span>
              <select
                value={activeRecipe.inspector}
                onChange={(e) => handleQuickChangeInspector(e.target.value)}
                className="bg-transparent text-emerald-400 font-bold text-xs cursor-pointer focus:outline-none w-full truncate"
                title="클릭하여 검사 책임자 변경"
              >
                {availableInspectors.map((insp) => (
                  <option key={insp} value={insp} className="bg-slate-900 text-white">
                    {insp}
                  </option>
                ))}
              </select>
            </div>

            {/* Interactive Approver Selector */}
            <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-xl border border-white/10">
              <span className="text-slate-400 shrink-0 font-bold">승인자:</span>
              <select
                value={activeRecipe.approver}
                onChange={(e) => handleQuickChangeApprover(e.target.value)}
                className="bg-transparent text-blue-400 font-bold text-xs cursor-pointer focus:outline-none w-full truncate"
                title="클릭하여 승인자 / QA 부서장 변경"
              >
                {availableApprovers.map((appr) => (
                  <option key={appr} value={appr} className="bg-slate-900 text-white">
                    {appr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Official QC PASS Stamp & Action */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-20 h-20 rounded-2xl border-2 border-blue-400/80 bg-blue-900/40 p-2 flex flex-col items-center justify-center text-center shadow-inner relative">
            <span className="text-[9px] font-mono text-blue-300 font-bold">Q.C</span>
            <span className="text-base font-black text-emerald-400 tracking-wider">PASS</span>
            <span className="text-[8px] font-bold text-slate-300">JSTECH</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setIsSpecEditorOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5 text-blue-400" />
              <span>규격/공차 상세 편집</span>
            </button>
            <button
              onClick={handlePrintDocument}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>8P 통합 성적서 출력</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 1.1 DYNAMIC PRODUCT RECIPE SELECTOR & SPEC SWITCHER                  */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>동적 제품 규격 레시피 (Product Spec Recipe) 선택</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-mono font-bold">
                {recipes.length}개 등록됨
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              길이·두께·공차·볼트수량 등 제품별 가변 치수 규격이 검사표 및 판정 로직에 실시간 연동됩니다.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {recipes.map((rec) => {
            const isSelected = rec.id === selectedRecipeId;
            return (
              <button
                key={rec.id}
                onClick={() => setSelectedRecipeId(rec.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>{rec.customer} ({rec.frontLengthNominal}mm / {rec.boltCount}EA)</span>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}

          <button
            onClick={handleCreateNewRecipe}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 hover:bg-emerald-100 text-xs font-black flex items-center gap-1 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>신규 제품 규격 등록</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 1.2 DYNAMIC PRODUCT SPEC RECIPE EDITOR MODAL                         */}
      {/* ==================================================================== */}
      {isSpecEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 border border-blue-200">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    제품 파라미터 및 공차 규격(Recipe) 편집
                  </h3>
                  <p className="text-xs text-slate-500">
                    현재 선택된 [{editForm.productName}]의 기준값(Nominal), 공차(Tolerance), 볼트수량 등을 수정합니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSpecEditorOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">문서 번호 (Doc No)</label>
                <input
                  type="text"
                  value={editForm.docNo}
                  onChange={(e) => setEditForm({ ...editForm, docNo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">고객사 명</label>
                <input
                  type="text"
                  value={editForm.customer}
                  onChange={(e) => setEditForm({ ...editForm, customer: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">품목명 (Product Name)</label>
                <input
                  type="text"
                  value={editForm.productName}
                  onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                />
              </div>
            </div>

            {/* Inspector & Approver Assignment */}
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>검사 책임자 및 QA 승인자 지정</span>
                </span>
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => {
                      const myName = currentUserTitle || currentUser.name;
                      setEditForm({
                        ...editForm,
                        inspector: myName,
                        approver: currentUser.role === 'ADMIN' ? myName : editForm.approver
                      });
                    }}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold hover:bg-blue-200 transition cursor-pointer"
                  >
                    현재 로그인 계정({currentUser.name})으로 자동 설정
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">검사 책임자 (Inspector)</label>
                  <div className="space-y-1.5">
                    <select
                      value={editForm.inspector}
                      onChange={(e) => setEditForm({ ...editForm, inspector: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-emerald-600"
                    >
                      {availableInspectors.map((insp) => (
                        <option key={insp} value={insp}>
                          {insp}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="또는 직접 이름/직급 입력"
                      value={editForm.inspector}
                      onChange={(e) => setEditForm({ ...editForm, inspector: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">QA 부서장 / 승인자 (Approver)</label>
                  <div className="space-y-1.5">
                    <select
                      value={editForm.approver}
                      onChange={(e) => setEditForm({ ...editForm, approver: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-blue-600"
                    >
                      {availableApprovers.map((appr) => (
                        <option key={appr} value={appr}>
                          {appr}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="또는 직접 이름/직급 입력"
                      value={editForm.approver}
                      onChange={(e) => setEditForm({ ...editForm, approver: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">재질 (Material)</label>
                <input
                  type="text"
                  value={editForm.material}
                  onChange={(e) => setEditForm({ ...editForm, material: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">조절볼트 수량 (Bolt Count EA)</label>
                <input
                  type="number"
                  value={editForm.boltCount}
                  onChange={(e) => setEditForm({ ...editForm, boltCount: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">기하공차 허용한계 (㎛)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.geometryToleranceLimitUm}
                  onChange={(e) => setEditForm({ ...editForm, geometryToleranceLimitUm: parseFloat(e.target.value) || 5.0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-blue-600"
                />
              </div>
            </div>

            {/* Front Plate Dimensions */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-3">
              <h4 className="text-xs font-black text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <Box className="w-4 h-4" />
                <span>FRONT PLATE 기준값 & 허용 공차 설정</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">길이 (Length mm ± 공차)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      value={editForm.frontLengthNominal}
                      onChange={(e) => setEditForm({ ...editForm, frontLengthNominal: parseFloat(e.target.value) || 0 })}
                      className="w-2/3 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono font-bold"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.frontLengthTol}
                      onChange={(e) => setEditForm({ ...editForm, frontLengthTol: parseFloat(e.target.value) || 0 })}
                      className="w-1/3 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">높이 (Height mm ± 공차)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      value={editForm.frontHeightNominal}
                      onChange={(e) => setEditForm({ ...editForm, frontHeightNominal: parseFloat(e.target.value) || 0 })}
                      className="w-2/3 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono font-bold"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.frontHeightTol}
                      onChange={(e) => setEditForm({ ...editForm, frontHeightTol: parseFloat(e.target.value) || 0 })}
                      className="w-1/3 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">두께 (Thickness mm ± 공차)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      value={editForm.frontThicknessNominal}
                      onChange={(e) => setEditForm({ ...editForm, frontThicknessNominal: parseFloat(e.target.value) || 0 })}
                      className="w-2/3 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono font-bold"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.frontThicknessTol}
                      onChange={(e) => setEditForm({ ...editForm, frontThicknessTol: parseFloat(e.target.value) || 0 })}
                      className="w-1/3 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono text-slate-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Lip Thk (mm ± 공차)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.frontLipNominal}
                      onChange={(e) => setEditForm({ ...editForm, frontLipNominal: parseFloat(e.target.value) || 0 })}
                      className="w-2/3 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono font-bold"
                    />
                    <input
                      type="number"
                      step="0.001"
                      value={editForm.frontLipTol}
                      onChange={(e) => setEditForm({ ...editForm, frontLipTol: parseFloat(e.target.value) || 0 })}
                      className="w-1/3 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono text-slate-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Gap Step (mm ± 공차)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      step="0.001"
                      value={editForm.frontGapNominal}
                      onChange={(e) => setEditForm({ ...editForm, frontGapNominal: parseFloat(e.target.value) || 0 })}
                      className="w-2/3 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono font-bold"
                    />
                    <input
                      type="number"
                      step="0.001"
                      value={editForm.frontGapTol}
                      onChange={(e) => setEditForm({ ...editForm, frontGapTol: parseFloat(e.target.value) || 0 })}
                      className="w-1/3 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono text-slate-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">조도 한계 Rmax (㎛)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.frontRoughnessLimit}
                    onChange={(e) => setEditForm({ ...editForm, frontRoughnessLimit: parseFloat(e.target.value) || 0.2 })}
                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Rear Plate Dimensions */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 space-y-3">
              <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <Box className="w-4 h-4" />
                <span>REAR PLATE 기준값 & 허용 공차 설정</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">길이 (Length mm ± 공차)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      value={editForm.rearLengthNominal}
                      onChange={(e) => setEditForm({ ...editForm, rearLengthNominal: parseFloat(e.target.value) || 0 })}
                      className="w-2/3 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono font-bold"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.rearLengthTol}
                      onChange={(e) => setEditForm({ ...editForm, rearLengthTol: parseFloat(e.target.value) || 0 })}
                      className="w-1/3 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">높이 (Height mm ± 공차)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      value={editForm.rearHeightNominal}
                      onChange={(e) => setEditForm({ ...editForm, rearHeightNominal: parseFloat(e.target.value) || 0 })}
                      className="w-2/3 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono font-bold"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.rearHeightTol}
                      onChange={(e) => setEditForm({ ...editForm, rearHeightTol: parseFloat(e.target.value) || 0 })}
                      className="w-1/3 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">두께 (Thickness mm ± 공차)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      value={editForm.rearThicknessNominal}
                      onChange={(e) => setEditForm({ ...editForm, rearThicknessNominal: parseFloat(e.target.value) || 0 })}
                      className="w-2/3 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono font-bold"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.rearThicknessTol}
                      onChange={(e) => setEditForm({ ...editForm, rearThicknessTol: parseFloat(e.target.value) || 0 })}
                      className="w-1/3 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono text-slate-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsSpecEditorOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSaveRecipeEdit}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>레시피 규격 저장 및 적용</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. TAB NAVIGATION (4 TABS + PRINT VIEW)                              */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveCertTab('TAB1_MAIN')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeCertTab === 'TAB1_MAIN'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>[탭 1] 메인 규격 및 요약 뷰</span>
        </button>

        <button
          onClick={() => setActiveCertTab('TAB2_FLATNESS_30')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeCertTab === 'TAB2_FLATNESS_30'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>[탭 2] 평면도 및 진직도 30포인트 상세 뷰</span>
        </button>

        <button
          onClick={() => setActiveCertTab('TAB3_ROUGHNESS_OPTICAL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeCertTab === 'TAB3_ROUGHNESS_OPTICAL'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Microscope className="w-4 h-4" />
          <span>[탭 3] 표면조도, 광학 및 조립 단차 검사 뷰</span>
        </button>

        <button
          onClick={() => setActiveCertTab('TAB4_HARDNESS_BOLT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeCertTab === 'TAB4_HARDNESS_BOLT'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>[탭 4] 경도, 자력 및 조절볼트(43개) 검사 뷰</span>
        </button>

        <button
          onClick={() => setActiveCertTab('TAB_PRINT_ALL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeCertTab === 'TAB_PRINT_ALL'
              ? 'bg-indigo-700 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>[공인성적서 원본 미리보기 & 출력]</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 3. [탭 1] 메인 규격 및 요약 뷰                                       */}
      {/* ==================================================================== */}
      {activeCertTab === 'TAB1_MAIN' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Main Specification Matrix: Front vs Rear Plate */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* FRONT PLATE */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    FRONT PLATE 형상 및 치수 검증 ({activeRecipe.customer})
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200">
                  전항목 합격 (PASS)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/70 dark:bg-slate-800/50 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="p-2.5">No</th>
                      <th className="p-2.5">항목</th>
                      <th className="p-2.5">규격 (Nominal ± Tol)</th>
                      <th className="p-2.5">측정값 (Actual)</th>
                      <th className="p-2.5 text-center">결과</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">1</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Length</td>
                      <td className="p-2.5 font-mono text-slate-500">{activeRecipe.frontLengthNominal} ± {activeRecipe.frontLengthTol} mm</td>
                      <td className="p-2.5 font-mono font-black text-slate-900 dark:text-white">{activeRecipe.frontLengthActual.toFixed(2)} mm</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">
                        {checkPass(activeRecipe.frontLengthActual, activeRecipe.frontLengthNominal, activeRecipe.frontLengthTol) ? '합격' : '불합격'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">2</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Height</td>
                      <td className="p-2.5 font-mono text-slate-500">{activeRecipe.frontHeightNominal} ± {activeRecipe.frontHeightTol} mm</td>
                      <td className="p-2.5 font-mono font-black text-slate-900 dark:text-white">{activeRecipe.frontHeightActual.toFixed(2)} mm</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">
                        {checkPass(activeRecipe.frontHeightActual, activeRecipe.frontHeightNominal, activeRecipe.frontHeightTol) ? '합격' : '불합격'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">3</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Thickness</td>
                      <td className="p-2.5 font-mono text-slate-500">{activeRecipe.frontThicknessNominal} ± {activeRecipe.frontThicknessTol} mm</td>
                      <td className="p-2.5 font-mono font-black text-slate-900 dark:text-white">{activeRecipe.frontThicknessActual.toFixed(2)} mm</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">
                        {checkPass(activeRecipe.frontThicknessActual, activeRecipe.frontThicknessNominal, activeRecipe.frontThicknessTol) ? '합격' : '불합격'}
                      </td>
                    </tr>
                    <tr className="bg-blue-50/40 dark:bg-blue-950/20">
                      <td className="p-2.5 font-mono text-slate-500">4</td>
                      <td className="p-2.5 font-bold text-blue-700 dark:text-blue-400">Lip Thickness</td>
                      <td className="p-2.5 font-mono text-slate-500">{activeRecipe.frontLipNominal} ± {activeRecipe.frontLipTol} mm</td>
                      <td className="p-2.5 font-mono font-black text-blue-700 dark:text-blue-300">{activeRecipe.frontLipActual.toFixed(3)} mm</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">
                        {checkPass(activeRecipe.frontLipActual, activeRecipe.frontLipNominal, activeRecipe.frontLipTol) ? '합격' : '불합격'}
                      </td>
                    </tr>
                    <tr className="bg-amber-50/40 dark:bg-amber-950/20">
                      <td className="p-2.5 font-mono text-slate-500">*5</td>
                      <td className="p-2.5 font-bold text-amber-800 dark:text-amber-400">Gap (Step)</td>
                      <td className="p-2.5 font-mono text-slate-500">{activeRecipe.frontGapNominal} ± {activeRecipe.frontGapTol} mm</td>
                      <td className="p-2.5 font-mono font-black text-amber-700 dark:text-amber-300">{activeRecipe.frontGapActual.toFixed(3)} mm</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">
                        {checkPass(activeRecipe.frontGapActual, activeRecipe.frontGapNominal, activeRecipe.frontGapTol) ? '합격' : '불합격'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">*6</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Roughness</td>
                      <td className="p-2.5 font-mono text-slate-500">Rmax ≤ {activeRecipe.frontRoughnessLimit} ㎛</td>
                      <td className="p-2.5 font-mono font-black text-slate-900 dark:text-white">{activeRecipe.frontRoughnessActual.toFixed(3)} ㎛</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">
                        {activeRecipe.frontRoughnessActual <= activeRecipe.frontRoughnessLimit ? '합격' : '불합격'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* REAR PLATE */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    REAR PLATE 형상 및 치수 검증 ({activeRecipe.customer})
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200">
                  전항목 합격 (PASS)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/70 dark:bg-slate-800/50 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="p-2.5">No</th>
                      <th className="p-2.5">항목</th>
                      <th className="p-2.5">규격 (Nominal ± Tol)</th>
                      <th className="p-2.5">측정값 (Actual)</th>
                      <th className="p-2.5 text-center">결과</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">1</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Length</td>
                      <td className="p-2.5 font-mono text-slate-500">{activeRecipe.rearLengthNominal} ± {activeRecipe.rearLengthTol} mm</td>
                      <td className="p-2.5 font-mono font-black text-slate-900 dark:text-white">{activeRecipe.rearLengthActual.toFixed(2)} mm</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">
                        {checkPass(activeRecipe.rearLengthActual, activeRecipe.rearLengthNominal, activeRecipe.rearLengthTol) ? '합격' : '불합격'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">2</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Height</td>
                      <td className="p-2.5 font-mono text-slate-500">{activeRecipe.rearHeightNominal} ± {activeRecipe.rearHeightTol} mm</td>
                      <td className="p-2.5 font-mono font-black text-slate-900 dark:text-white">{activeRecipe.rearHeightActual.toFixed(2)} mm</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">
                        {checkPass(activeRecipe.rearHeightActual, activeRecipe.rearHeightNominal, activeRecipe.rearHeightTol) ? '합격' : '불합격'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">3</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Thickness</td>
                      <td className="p-2.5 font-mono text-slate-500">{activeRecipe.rearThicknessNominal} ± {activeRecipe.rearThicknessTol} mm</td>
                      <td className="p-2.5 font-mono font-black text-slate-900 dark:text-white">{activeRecipe.rearThicknessActual.toFixed(2)} mm</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">
                        {checkPass(activeRecipe.rearThicknessActual, activeRecipe.rearThicknessNominal, activeRecipe.rearThicknessTol) ? '합격' : '불합격'}
                      </td>
                    </tr>
                    <tr className="bg-blue-50/40 dark:bg-blue-950/20">
                      <td className="p-2.5 font-mono text-slate-500">4</td>
                      <td className="p-2.5 font-bold text-blue-700 dark:text-blue-400">Lip Thickness</td>
                      <td className="p-2.5 font-mono text-slate-500">{activeRecipe.rearLipNominal} ± {activeRecipe.rearLipTol} mm</td>
                      <td className="p-2.5 font-mono font-black text-blue-700 dark:text-blue-300">{activeRecipe.rearLipActual.toFixed(3)} mm</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">
                        {checkPass(activeRecipe.rearLipActual, activeRecipe.rearLipNominal, activeRecipe.rearLipTol) ? '합격' : '불합격'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">*5</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Gap (Step)</td>
                      <td className="p-2.5 font-mono text-slate-500">-</td>
                      <td className="p-2.5 font-mono text-slate-500">-</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">적용제외</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">*6</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Roughness</td>
                      <td className="p-2.5 font-mono text-slate-500">Rmax ≤ {activeRecipe.rearRoughnessLimit} ㎛</td>
                      <td className="p-2.5 font-mono font-black text-slate-900 dark:text-white">{activeRecipe.rearRoughnessActual.toFixed(3)} ㎛</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">
                        {activeRecipe.rearRoughnessActual <= activeRecipe.rearRoughnessLimit ? '합격' : '불합격'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Flatness & Straightness Summary Matrix (≤ 5um) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    평면도 및 진직도 규격 종합 요약 (허용 규격: ≤ 5.0 ㎛)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Front / Rear Plate 각각의 Lip Flatness, Bolt Flatness, Lip Straightness
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-blue-600">30개 측정 포인트 기반</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FRONT PLATE SUMMARY */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-black text-blue-700 dark:text-blue-400">
                  FRONT PLATE 평면/진직도 데이터
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-bold">Lip Flatness</span>
                    <strong className="text-base font-black text-emerald-600">{frontLipA1Stats.flatness} ㎛</strong>
                    <span className="text-[9px] text-slate-400 block font-mono">규격: ≤ 5.0㎛</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-bold">Bolt Flatness</span>
                    <strong className="text-base font-black text-emerald-600">{frontBoltB1Stats.flatness} ㎛</strong>
                    <span className="text-[9px] text-slate-400 block font-mono">규격: ≤ 5.0㎛</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-bold">Lip Straightness</span>
                    <strong className="text-base font-black text-emerald-600">{frontStraightStats.flatness} ㎛</strong>
                    <span className="text-[9px] text-slate-400 block font-mono">규격: ≤ 5.0㎛</span>
                  </div>
                </div>
              </div>

              {/* REAR PLATE SUMMARY */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-black text-indigo-700 dark:text-indigo-400">
                  REAR PLATE 평면/진직도 데이터
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-bold">Lip Flatness</span>
                    <strong className="text-base font-black text-emerald-600">{rearLipA1Stats.flatness} ㎛</strong>
                    <span className="text-[9px] text-slate-400 block font-mono">규격: ≤ 5.0㎛</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-bold">Bolt Flatness</span>
                    <strong className="text-base font-black text-emerald-600">{rearBoltB1Stats.flatness} ㎛</strong>
                    <span className="text-[9px] text-slate-400 block font-mono">규격: ≤ 5.0㎛</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-bold">Lip Straightness</span>
                    <strong className="text-base font-black text-emerald-600">{rearStraightStats.flatness} ㎛</strong>
                    <span className="text-[9px] text-slate-400 block font-mono">규격: ≤ 5.0㎛</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. [탭 2] 평면도 및 진직도 30포인트 상세 뷰                         */}
      {/* ==================================================================== */}
      {activeCertTab === 'TAB2_FLATNESS_30' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>평면도 데이터 (Measurement Point 1 ~ 30)</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                    단위: ㎛
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Front/Rear Lip Line A1/A2, Bolt Line B1/B2 각 30개 포인트 측정값 및 Max, Min, Flatness 자동 산출
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                  Flatness = Max - Min (규격 ≤ 5.0㎛)
                </span>
              </div>
            </div>

            {/* 30 Points Flatness Grid Table */}
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 sticky top-0 z-10 shadow-2xs">
                  <tr>
                    <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-center bg-slate-200/80 dark:bg-slate-700" colSpan={5}>
                      FRONT PLATE (㎛)
                    </th>
                    <th className="p-2 text-center bg-indigo-100 dark:bg-indigo-950/60" colSpan={5}>
                      REAR PLATE (㎛)
                    </th>
                  </tr>
                  <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700">
                    <th className="p-2 text-center">No</th>
                    <th className="p-2">Lip A1</th>
                    <th className="p-2">Lip A2</th>
                    <th className="p-2">Bolt B1</th>
                    <th className="p-2 border-r border-slate-200 dark:border-slate-700">Bolt B2</th>

                    <th className="p-2 text-center">No</th>
                    <th className="p-2">Lip A1</th>
                    <th className="p-2">Lip A2</th>
                    <th className="p-2">Bolt B1</th>
                    <th className="p-2">Bolt B2</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {frontData30.map((fRow, idx) => {
                    const rRow = rearData30[idx];
                    return (
                      <tr key={fRow.point} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2 text-center font-bold text-slate-500 bg-slate-50/50 dark:bg-slate-800/30">
                          {fRow.point}
                        </td>
                        <td className="p-2 text-slate-800 dark:text-slate-200">{fRow.lipA1.toFixed(2)}</td>
                        <td className="p-2 text-slate-800 dark:text-slate-200">{fRow.lipA2.toFixed(2)}</td>
                        <td className="p-2 text-slate-800 dark:text-slate-200">{fRow.boltB1.toFixed(2)}</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                          {fRow.boltB2.toFixed(2)}
                        </td>

                        <td className="p-2 text-center font-bold text-slate-500 bg-indigo-50/30 dark:bg-indigo-950/20">
                          {rRow.point}
                        </td>
                        <td className="p-2 text-slate-800 dark:text-slate-200">{rRow.lipA1.toFixed(2)}</td>
                        <td className="p-2 text-slate-800 dark:text-slate-200">{rRow.lipA2.toFixed(2)}</td>
                        <td className="p-2 text-slate-800 dark:text-slate-200">{rRow.boltB1.toFixed(2)}</td>
                        <td className="p-2 text-slate-800 dark:text-slate-200">{rRow.boltB2.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-200/90 dark:bg-slate-800 font-black text-xs sticky bottom-0 border-t-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <td className="p-2 text-center">Max</td>
                    <td className="p-2 text-blue-700 dark:text-blue-400">{frontLipA1Stats.max.toFixed(1)}</td>
                    <td className="p-2 text-blue-700 dark:text-blue-400">{frontLipA2Stats.max.toFixed(1)}</td>
                    <td className="p-2 text-blue-700 dark:text-blue-400">{frontBoltB1Stats.max.toFixed(1)}</td>
                    <td className="p-2 border-r border-slate-300 dark:border-slate-700 text-blue-700 dark:text-blue-400">{frontBoltB2Stats.max.toFixed(1)}</td>

                    <td className="p-2 text-center">Max</td>
                    <td className="p-2 text-indigo-700 dark:text-indigo-400">{rearLipA1Stats.max.toFixed(1)}</td>
                    <td className="p-2 text-indigo-700 dark:text-indigo-400">{rearLipA2Stats.max.toFixed(1)}</td>
                    <td className="p-2 text-indigo-700 dark:text-indigo-400">{rearBoltB1Stats.max.toFixed(1)}</td>
                    <td className="p-2 text-indigo-700 dark:text-indigo-400">{rearBoltB2Stats.max.toFixed(1)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-center">Min</td>
                    <td className="p-2 text-rose-700 dark:text-rose-400">{frontLipA1Stats.min.toFixed(1)}</td>
                    <td className="p-2 text-rose-700 dark:text-rose-400">{frontLipA2Stats.min.toFixed(1)}</td>
                    <td className="p-2 text-rose-700 dark:text-rose-400">{frontBoltB1Stats.min.toFixed(1)}</td>
                    <td className="p-2 border-r border-slate-300 dark:border-slate-700 text-rose-700 dark:text-rose-400">{frontBoltB2Stats.min.toFixed(1)}</td>

                    <td className="p-2 text-center">Min</td>
                    <td className="p-2 text-rose-700 dark:text-rose-400">{rearLipA1Stats.min.toFixed(1)}</td>
                    <td className="p-2 text-rose-700 dark:text-rose-400">{rearLipA2Stats.min.toFixed(1)}</td>
                    <td className="p-2 text-rose-700 dark:text-rose-400">{rearBoltB1Stats.min.toFixed(1)}</td>
                    <td className="p-2 text-rose-700 dark:text-rose-400">{rearBoltB2Stats.min.toFixed(1)}</td>
                  </tr>
                  <tr className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    <td className="p-2 text-center font-black">Flatness</td>
                    <td className="p-2 font-black">{frontLipA1Stats.flatness.toFixed(1)}</td>
                    <td className="p-2 font-black">{frontLipA2Stats.flatness.toFixed(1)}</td>
                    <td className="p-2 font-black">{frontBoltB1Stats.flatness.toFixed(1)}</td>
                    <td className="p-2 border-r border-slate-300 dark:border-slate-700 font-black">{frontBoltB2Stats.flatness.toFixed(1)}</td>

                    <td className="p-2 text-center font-black">Flatness</td>
                    <td className="p-2 font-black">{rearLipA1Stats.flatness.toFixed(1)}</td>
                    <td className="p-2 font-black">{rearLipA2Stats.flatness.toFixed(1)}</td>
                    <td className="p-2 font-black">{rearBoltB1Stats.flatness.toFixed(1)}</td>
                    <td className="p-2 font-black">{rearBoltB2Stats.flatness.toFixed(1)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Lip Straightness 30 Points Section */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <span>Lip 진직도 (Straightness) 30포인트 측정값</span>
                </h4>
                <span className="text-[11px] font-mono text-slate-500 font-bold">
                  허용 공차: ≤ {activeRecipe.geometryToleranceLimitUm} ㎛
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
                  <span>
                    FRONT PLATE 진직도 (Max: {frontStraightStats.max.toFixed(1)}, Min: {frontStraightStats.min.toFixed(1)})
                  </span>
                  <strong className={`font-mono text-sm ${frontStraightStats.flatness <= activeRecipe.geometryToleranceLimitUm ? 'text-emerald-600' : 'text-rose-600'}`}>
                    Flatness {frontStraightStats.flatness.toFixed(1)} ㎛ ({frontStraightStats.flatness <= activeRecipe.geometryToleranceLimitUm ? '합격' : '불합격'})
                  </strong>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
                  <span>
                    REAR PLATE 진직도 (Max: {rearStraightStats.max.toFixed(1)}, Min: {rearStraightStats.min.toFixed(1)})
                  </span>
                  <strong className={`font-mono text-sm ${rearStraightStats.flatness <= activeRecipe.geometryToleranceLimitUm ? 'text-emerald-600' : 'text-rose-600'}`}>
                    Flatness {rearStraightStats.flatness.toFixed(1)} ㎛ ({rearStraightStats.flatness <= activeRecipe.geometryToleranceLimitUm ? '합격' : '불합격'})
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. [탭 3] 표면조도, 광학 및 조립 단차 검사 뷰                         */}
      {/* ==================================================================== */}
      {activeCertTab === 'TAB3_ROUGHNESS_OPTICAL' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Surface Roughness Table (Page 4) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Microscope className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    표면조도 측정 데이터 (Measurement Point a, b)
                  </h3>
                  <p className="text-xs text-slate-500">
                    허용 규격: Rmax ≤ {activeRecipe.frontRoughnessLimit} ㎛ (Front/Rear Plate)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Front Plate Roughness */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="text-xs font-black text-blue-700 dark:text-blue-400">FRONT PLATE (㎛)</h4>
                <div className="grid grid-cols-3 gap-2 text-xs text-center font-mono">
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border">
                    <span className="text-[10px] text-slate-500 block font-sans">위치 (a)</span>
                    <strong>{(activeRecipe.frontRoughnessActual + 0.012).toFixed(3)} ㎛</strong>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border">
                    <span className="text-[10px] text-slate-500 block font-sans">위치 (b)</span>
                    <strong>{(activeRecipe.frontRoughnessActual - 0.002).toFixed(3)} ㎛</strong>
                  </div>
                  <div className={`p-2 rounded border ${activeRecipe.frontRoughnessActual <= activeRecipe.frontRoughnessLimit ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'}`}>
                    <span className="text-[10px] block font-sans font-bold">실측 평균값</span>
                    <strong>{activeRecipe.frontRoughnessActual.toFixed(3)} ㎛ ({activeRecipe.frontRoughnessActual <= activeRecipe.frontRoughnessLimit ? '합격' : '불합격'})</strong>
                  </div>
                </div>
              </div>

              {/* Rear Plate Roughness */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="text-xs font-black text-indigo-700 dark:text-indigo-400">REAR PLATE (㎛)</h4>
                <div className="grid grid-cols-3 gap-2 text-xs text-center font-mono">
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border">
                    <span className="text-[10px] text-slate-500 block font-sans">위치 (a)</span>
                    <strong>{(activeRecipe.rearRoughnessActual + 0.010).toFixed(3)} ㎛</strong>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border">
                    <span className="text-[10px] text-slate-500 block font-sans">위치 (b)</span>
                    <strong>{(activeRecipe.rearRoughnessActual + 0.007).toFixed(3)} ㎛</strong>
                  </div>
                  <div className={`p-2 rounded border ${activeRecipe.rearRoughnessActual <= activeRecipe.rearRoughnessLimit ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'}`}>
                    <span className="text-[10px] block font-sans font-bold">실측 평균값</span>
                    <strong>{activeRecipe.rearRoughnessActual.toFixed(3)} ㎛ ({activeRecipe.rearRoughnessActual <= activeRecipe.rearRoughnessLimit ? '합격' : '불합격'})</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Optical Inspection (Page 5) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    광학 현미경 검사 (Front/Rear 6포인트 립 간격 매핑)
                  </h3>
                  <p className="text-xs text-slate-500">
                    규격: {activeRecipe.frontLipNominal.toFixed(3)} ± {activeRecipe.frontLipTol.toFixed(3)} mm (실측 평균: {activeRecipe.frontLipActual.toFixed(3)} mm)
                  </p>
                </div>
              </div>
            </div>

            {/* Front 1~6 Thumbnails */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-blue-700 dark:text-blue-400">FRONT PLATE (1 ~ 6)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {opticalData.front.map((pt) => (
                  <div key={pt.name} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 text-center">
                    {/* Simulated Optical Crosshair Image Canvas */}
                    <div className="h-16 w-full bg-gradient-to-b from-emerald-900 via-slate-950 to-emerald-950 rounded-lg flex items-center justify-center relative overflow-hidden border border-emerald-700/50 shadow-inner">
                      <div className="w-full h-0.5 bg-emerald-400/80 absolute" />
                      <div className="w-0.5 h-full bg-emerald-400/80 absolute" />
                      <span className="text-[9px] font-mono text-emerald-300 font-bold z-10 bg-black/60 px-1 rounded">
                        {pt.val.toFixed(3)} mm
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">{pt.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rear 1~6 Thumbnails */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-black text-indigo-700 dark:text-indigo-400">REAR PLATE (1 ~ 6)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {opticalData.rear.map((pt) => (
                  <div key={pt.name} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 text-center">
                    <div className="h-16 w-full bg-gradient-to-b from-teal-900 via-slate-950 to-teal-950 rounded-lg flex items-center justify-center relative overflow-hidden border border-teal-700/50 shadow-inner">
                      <div className="w-full h-0.5 bg-teal-400/80 absolute" />
                      <div className="w-0.5 h-full bg-teal-400/80 absolute" />
                      <span className="text-[9px] font-mono text-teal-300 font-bold z-10 bg-black/60 px-1 rounded">
                        {pt.val.toFixed(3)} mm
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">{pt.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* GAP 단차 & DAMPER 단차 조립 검사 (Page 6) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                GAP 단차 / DAMPER 조립 검사 데이터
              </h3>
              <span className="text-xs font-mono font-bold text-slate-500">
                *GAP 단차 = ① - ② | *DAMPER 단차 = ③ - ④
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-center">
                <span className="text-xs text-slate-500 block font-bold">GAP 단차 (Point 1)</span>
                <input
                  type="number"
                  step="0.001"
                  value={gapStepP1}
                  onChange={(e) => setGapStepP1(parseFloat(e.target.value) || 0)}
                  className="w-24 text-center text-base font-black text-slate-900 dark:text-white font-mono bg-white dark:bg-slate-900 border rounded py-0.5 my-1"
                />
                <span className={`text-[10px] block font-bold ${Math.abs(gapStepP1 - activeRecipe.frontGapNominal) <= activeRecipe.frontGapTol ? 'text-emerald-600' : 'text-rose-600'}`}>
                  규격: {activeRecipe.frontGapNominal.toFixed(3)} ± {activeRecipe.frontGapTol.toFixed(3)} ({Math.abs(gapStepP1 - activeRecipe.frontGapNominal) <= activeRecipe.frontGapTol ? '합격' : '불합격'})
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-center">
                <span className="text-xs text-slate-500 block font-bold">GAP 단차 (Point 2)</span>
                <input
                  type="number"
                  step="0.001"
                  value={gapStepP2}
                  onChange={(e) => setGapStepP2(parseFloat(e.target.value) || 0)}
                  className="w-24 text-center text-base font-black text-slate-900 dark:text-white font-mono bg-white dark:bg-slate-900 border rounded py-0.5 my-1"
                />
                <span className={`text-[10px] block font-bold ${Math.abs(gapStepP2 - activeRecipe.frontGapNominal) <= activeRecipe.frontGapTol ? 'text-emerald-600' : 'text-rose-600'}`}>
                  규격: {activeRecipe.frontGapNominal.toFixed(3)} ± {activeRecipe.frontGapTol.toFixed(3)} ({Math.abs(gapStepP2 - activeRecipe.frontGapNominal) <= activeRecipe.frontGapTol ? '합격' : '불합격'})
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-center">
                <span className="text-xs text-slate-500 block font-bold">GAP 단차 (Point 3)</span>
                <input
                  type="number"
                  step="0.001"
                  value={gapStepP3}
                  onChange={(e) => setGapStepP3(parseFloat(e.target.value) || 0)}
                  className="w-24 text-center text-base font-black text-slate-900 dark:text-white font-mono bg-white dark:bg-slate-900 border rounded py-0.5 my-1"
                />
                <span className={`text-[10px] block font-bold ${Math.abs(gapStepP3 - activeRecipe.frontGapNominal) <= activeRecipe.frontGapTol ? 'text-emerald-600' : 'text-rose-600'}`}>
                  규격: {activeRecipe.frontGapNominal.toFixed(3)} ± {activeRecipe.frontGapTol.toFixed(3)} ({Math.abs(gapStepP3 - activeRecipe.frontGapNominal) <= activeRecipe.frontGapTol ? '합격' : '불합격'})
                </span>
              </div>
            </div>

            {/* DAMPER 10 Points Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-2 font-sans">No</th>
                    {damperData.map((d) => (
                      <th key={d.no} className="p-2 text-center">{d.no}</th>
                    ))}
                    <th className="p-2 text-center font-sans">Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-2 font-bold font-sans">FRONT</td>
                    {damperData.map((d) => (
                      <td key={d.no} className="p-2 text-center">{d.front.toFixed(3)}</td>
                    ))}
                    <td className="p-2 text-center font-bold text-blue-600">
                      {(damperData.reduce((acc, c) => acc + c.front, 0) / damperData.length).toFixed(3)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold font-sans">DAMPER</td>
                    {damperData.map((d) => (
                      <td key={d.no} className="p-2 text-center">{d.damper.toFixed(3)}</td>
                    ))}
                    <td className="p-2 text-center font-bold text-blue-600">
                      {(damperData.reduce((acc, c) => acc + c.damper, 0) / damperData.length).toFixed(3)}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/50 dark:bg-emerald-950/30 font-bold">
                    <td className="p-2 font-sans text-emerald-800 dark:text-emerald-300">편차</td>
                    {damperData.map((d) => (
                      <td key={d.no} className="p-2 text-center text-emerald-700 dark:text-emerald-400">
                        {d.dev >= 0 ? `+${d.dev.toFixed(3)}` : d.dev.toFixed(3)}
                      </td>
                    ))}
                    <td className="p-2 text-center text-emerald-700 dark:text-emerald-400">
                      {(damperData.reduce((acc, c) => acc + c.dev, 0) / damperData.length).toFixed(3)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. [탭 4] 경도, 자력 및 조절볼트 검사 뷰                             */}
      {/* ==================================================================== */}
      {activeCertTab === 'TAB4_HARDNESS_BOLT' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Hardness & Magnetism (Page 7) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hardness */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Hammer className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    경도 측정 데이터 (REAR PLATE - {activeRecipe.material})
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">규격: {activeRecipe.hardnessTarget}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-center">
                  <span className="text-slate-500 block font-bold">Point 1</span>
                  <strong className="text-lg font-black text-emerald-600 font-mono">{hardnessP1} HRC</strong>
                  <span className="text-[10px] text-slate-400 block font-bold">
                    판정: {hardnessP1 >= activeRecipe.hardnessMin && hardnessP1 <= activeRecipe.hardnessMax ? '합격 (OK)' : '불합격 (NG)'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-center">
                  <span className="text-slate-500 block font-bold">Point 2</span>
                  <strong className="text-lg font-black text-emerald-600 font-mono">{hardnessP2} HRC</strong>
                  <span className="text-[10px] text-slate-400 block font-bold">
                    판정: {hardnessP2 >= activeRecipe.hardnessMin && hardnessP2 <= activeRecipe.hardnessMax ? '합격 (OK)' : '불합격 (NG)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Magnetism */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    자력 측정 데이터 (Front / Rear)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">규격: {activeRecipe.magnetismLimit} mT 이하</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-center">
                  <span className="text-slate-500 block font-bold">FRONT (Point 1 / 2)</span>
                  <strong className="text-base font-black text-emerald-600 font-mono">
                    {magFrontP1} / {magFrontP2} mT
                  </strong>
                  <span className="text-[10px] text-slate-400 block font-bold">
                    {magFrontP1 <= activeRecipe.magnetismLimit && magFrontP2 <= activeRecipe.magnetismLimit ? '기준치 만족 (합격)' : '규격 초과'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-center">
                  <span className="text-slate-500 block font-bold">REAR (Point 1 / 2)</span>
                  <strong className="text-base font-black text-emerald-600 font-mono">
                    {magRearP1} / {magRearP2} mT
                  </strong>
                  <span className="text-[10px] text-slate-400 block font-bold">
                    {magRearP1 <= activeRecipe.magnetismLimit && magRearP2 <= activeRecipe.magnetismLimit ? '기준치 만족 (합격)' : '규격 초과'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Adjustment Bolts Inspection Matrix (Page 8) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    조절볼트 전수 검사 매트릭스 (@1번 ~ @{activeRecipe.boltCount}번 총 {activeRecipe.boltCount}개)
                  </h3>
                  <p className="text-xs text-slate-500">
                    마이크로 피치 나사산 체결 토크({activeRecipe.boltTorque} N·m), 회전 유격(Backlash), 립 조절 원활성 전수 검사
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-300">
                {activeRecipe.boltCount}개 조절볼트 전수 정상 (100% PASS)
              </span>
            </div>

            {/* Dynamic Bolts Interactive Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11 gap-2">
              {dynamicBolts.map((bolt) => (
                <div
                  key={bolt.id}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center flex flex-col items-center justify-between hover:border-blue-500 transition cursor-pointer"
                >
                  <span className="text-[10px] font-mono font-bold text-slate-500">#{bolt.id}</span>
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 my-1 shadow-xs" />
                  <span className="text-[9px] font-mono text-slate-700 dark:text-slate-300 font-bold">{bolt.torque}N·m</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. [공인성적서 원본 미리보기 & 출력]                                 */}
      {/* ==================================================================== */}
      {activeCertTab === 'TAB_PRINT_ALL' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <div>
                <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-200">
                  공식 공인 검사 성적서 (Official 8-Page COA Document)
                </h4>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-400">
                  {activeRecipe.customer} 납품 사양에 완벽히 부합하는 8페이지 구성의 정밀 측정 성적서입니다.
                </p>
              </div>
            </div>

            <button
              onClick={handlePrintDocument}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>성적서 인쇄 (PDF 저장)</span>
            </button>
          </div>

          {/* Printable Official Document Layout */}
          <div
            id="print-area-semes-coa"
            className="bg-white text-slate-900 p-8 rounded-3xl border-2 border-slate-300 shadow-2xl space-y-6 max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <div className="text-xs font-bold text-slate-500 font-mono">JUNSUNG TECH Co., Ltd</div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                  검 사 성 적 서
                </h1>
                <div className="text-xs font-mono text-slate-600 mt-0.5">
                  Document number : <strong className="text-black">{activeRecipe.docNo}</strong>
                </div>
              </div>

              {/* Signatures Table */}
              <table className="border border-slate-900 text-xs text-center border-collapse">
                <tbody>
                  <tr className="bg-slate-100 font-bold border-b border-slate-900">
                    <td className="p-1.5 border-r border-slate-900">검사일</td>
                    <td className="p-1.5 border-r border-slate-900">검사자</td>
                    <td className="p-1.5 border-r border-slate-900">승인</td>
                    <td className="p-1.5">검사결과</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono border-r border-slate-900">{activeRecipe.inspectionDate}</td>
                    <td className="p-2 border-r border-slate-900">{activeRecipe.inspector}</td>
                    <td className="p-2 border-r border-slate-900">{activeRecipe.approver}</td>
                    <td className="p-2 font-black text-blue-700">Q.C PASS</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Spec Table */}
            <table className="w-full text-xs border border-slate-900 border-collapse text-center">
              <tbody>
                <tr className="bg-slate-100 font-bold border-b border-slate-900">
                  <td className="p-2 border-r border-slate-900 w-1/4">고객사</td>
                  <td className="p-2 border-r border-slate-900 w-1/4">품목명</td>
                  <td className="p-2 border-r border-slate-900 w-1/4">규격</td>
                  <td className="p-2 w-1/4">재질</td>
                </tr>
                <tr className="border-b border-slate-900 font-bold">
                  <td className="p-2 border-r border-slate-900">{activeRecipe.customer}</td>
                  <td className="p-2 border-r border-slate-900">{activeRecipe.productName}</td>
                  <td className="p-2 border-r border-slate-900 font-mono">{activeRecipe.frontLengthNominal}mm</td>
                  <td className="p-2 font-mono">{activeRecipe.material}</td>
                </tr>
                <tr className="bg-slate-100 font-bold border-b border-slate-900">
                  <td className="p-2 border-r border-slate-900">입고일</td>
                  <td className="p-2 border-r border-slate-900">출고일</td>
                  <td className="p-2 border-r border-slate-900">제작 구분</td>
                  <td className="p-2">제작 범위</td>
                </tr>
                <tr className="font-medium">
                  <td className="p-2 border-r border-slate-900">-</td>
                  <td className="p-2 border-r border-slate-900">-</td>
                  <td className="p-2 border-r border-slate-900 font-bold">☑ New ☐ Repair</td>
                  <td className="p-2 font-bold">☑ All ☐ Lip</td>
                </tr>
              </tbody>
            </table>

            {/* Main Dimensions Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-900 uppercase">형상 및 치수 성적</h4>
              <div className="grid grid-cols-2 gap-4">
                {/* Front Plate */}
                <table className="w-full text-xs border border-slate-900 border-collapse">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="p-1.5 border-b border-r border-slate-900 text-center" colSpan={5}>
                        FRONT PLATE
                      </th>
                    </tr>
                    <tr className="border-b border-slate-900 text-[10px]">
                      <th className="p-1 border-r border-slate-900">No</th>
                      <th className="p-1 border-r border-slate-900">항목</th>
                      <th className="p-1 border-r border-slate-900">규격</th>
                      <th className="p-1 border-r border-slate-900">측정값</th>
                      <th className="p-1">결과</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-center font-mono text-[11px]">
                    <tr>
                      <td className="p-1 border-r border-slate-300">1</td>
                      <td className="p-1 border-r border-slate-300 font-sans">Length</td>
                      <td className="p-1 border-r border-slate-300">{activeRecipe.frontLengthNominal}±{activeRecipe.frontLengthTol}</td>
                      <td className="p-1 border-r border-slate-300 font-bold">{activeRecipe.frontLengthActual.toFixed(2)}</td>
                      <td className="p-1 font-bold text-emerald-700">합격</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r border-slate-300">2</td>
                      <td className="p-1 border-r border-slate-300 font-sans">Height</td>
                      <td className="p-1 border-r border-slate-300">{activeRecipe.frontHeightNominal}±{activeRecipe.frontHeightTol}</td>
                      <td className="p-1 border-r border-slate-300 font-bold">{activeRecipe.frontHeightActual.toFixed(2)}</td>
                      <td className="p-1 font-bold text-emerald-700">합격</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r border-slate-300">3</td>
                      <td className="p-1 border-r border-slate-300 font-sans">Thickness</td>
                      <td className="p-1 border-r border-slate-300">{activeRecipe.frontThicknessNominal}±{activeRecipe.frontThicknessTol}</td>
                      <td className="p-1 border-r border-slate-300 font-bold">{activeRecipe.frontThicknessActual.toFixed(2)}</td>
                      <td className="p-1 font-bold text-emerald-700">합격</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r border-slate-300">4</td>
                      <td className="p-1 border-r border-slate-300 font-sans font-bold">Lip Thk</td>
                      <td className="p-1 border-r border-slate-300">{activeRecipe.frontLipNominal}±{activeRecipe.frontLipTol}</td>
                      <td className="p-1 border-r border-slate-300 font-bold">{activeRecipe.frontLipActual.toFixed(3)}</td>
                      <td className="p-1 font-bold text-emerald-700">합격</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r border-slate-300">*5</td>
                      <td className="p-1 border-r border-slate-300 font-sans font-bold">Gap(Step)</td>
                      <td className="p-1 border-r border-slate-300">{activeRecipe.frontGapNominal}±{activeRecipe.frontGapTol}</td>
                      <td className="p-1 border-r border-slate-300 font-bold">{activeRecipe.frontGapActual.toFixed(3)}</td>
                      <td className="p-1 font-bold text-emerald-700">합격</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r border-slate-300">*6</td>
                      <td className="p-1 border-r border-slate-300 font-sans">Roughness</td>
                      <td className="p-1 border-r border-slate-300">Rmax≤{activeRecipe.frontRoughnessLimit}</td>
                      <td className="p-1 border-r border-slate-300 font-bold">{activeRecipe.frontRoughnessActual.toFixed(3)}</td>
                      <td className="p-1 font-bold text-emerald-700">합격</td>
                    </tr>
                  </tbody>
                </table>

                {/* Rear Plate */}
                <table className="w-full text-xs border border-slate-900 border-collapse">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="p-1.5 border-b border-r border-slate-900 text-center" colSpan={5}>
                        REAR PLATE
                      </th>
                    </tr>
                    <tr className="border-b border-slate-900 text-[10px]">
                      <th className="p-1 border-r border-slate-900">No</th>
                      <th className="p-1 border-r border-slate-900">항목</th>
                      <th className="p-1 border-r border-slate-900">규격</th>
                      <th className="p-1 border-r border-slate-900">측정값</th>
                      <th className="p-1">결과</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-center font-mono text-[11px]">
                    <tr>
                      <td className="p-1 border-r border-slate-300">1</td>
                      <td className="p-1 border-r border-slate-300 font-sans">Length</td>
                      <td className="p-1 border-r border-slate-300">{activeRecipe.rearLengthNominal}±{activeRecipe.rearLengthTol}</td>
                      <td className="p-1 border-r border-slate-300 font-bold">{activeRecipe.rearLengthActual.toFixed(2)}</td>
                      <td className="p-1 font-bold text-emerald-700">합격</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r border-slate-300">2</td>
                      <td className="p-1 border-r border-slate-300 font-sans">Height</td>
                      <td className="p-1 border-r border-slate-300">{activeRecipe.rearHeightNominal}±{activeRecipe.rearHeightTol}</td>
                      <td className="p-1 border-r border-slate-300 font-bold">{activeRecipe.rearHeightActual.toFixed(2)}</td>
                      <td className="p-1 font-bold text-emerald-700">합격</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r border-slate-300">3</td>
                      <td className="p-1 border-r border-slate-300 font-sans">Thickness</td>
                      <td className="p-1 border-r border-slate-300">{activeRecipe.rearThicknessNominal}±{activeRecipe.rearThicknessTol}</td>
                      <td className="p-1 border-r border-slate-300 font-bold">{activeRecipe.rearThicknessActual.toFixed(2)}</td>
                      <td className="p-1 font-bold text-emerald-700">합격</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r border-slate-300">4</td>
                      <td className="p-1 border-r border-slate-300 font-sans font-bold">Lip Thk</td>
                      <td className="p-1 border-r border-slate-300">{activeRecipe.rearLipNominal}±{activeRecipe.rearLipTol}</td>
                      <td className="p-1 border-r border-slate-300 font-bold">{activeRecipe.rearLipActual.toFixed(3)}</td>
                      <td className="p-1 font-bold text-emerald-700">합격</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r border-slate-300">*5</td>
                      <td className="p-1 border-r border-slate-300 font-sans">Gap(Step)</td>
                      <td className="p-1 border-r border-slate-300">-</td>
                      <td className="p-1 border-r border-slate-300 font-bold">-</td>
                      <td className="p-1 font-bold text-emerald-700">적용제외</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r border-slate-300">*6</td>
                      <td className="p-1 border-r border-slate-300 font-sans">Roughness</td>
                      <td className="p-1 border-r border-slate-300">Rmax≤{activeRecipe.rearRoughnessLimit}</td>
                      <td className="p-1 border-r border-slate-300 font-bold">{activeRecipe.rearRoughnessActual.toFixed(3)}</td>
                      <td className="p-1 font-bold text-emerald-700">합격</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer stamp and note */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-400 text-xs">
              <span className="text-slate-500 font-mono">JS-COA-01 | Page 1/8</span>
              <span className="font-bold text-slate-800">JUNSUNG TECH Co., Ltd Quality Assurance</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
