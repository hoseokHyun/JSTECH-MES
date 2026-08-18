import React, { useState, useMemo } from 'react';
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
  X
} from 'lucide-react';

// ============================================================================
// 1. DATA DEFINITIONS & CERTIFICATE RAW DATA (JS-QC260303-01N)
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

export const RAW_ADJUSTMENT_BOLTS_43 = Array.from({ length: 43 }, (_, i) => ({
  id: i + 1,
  torque: 5.0,
  pitch: 'M6 x 0.5 Micro',
  travelMm: 0.50,
  backlashUm: 1.2,
  status: 'OK' as const
}));

// ============================================================================
// 2. MAIN COMPONENT: SlotDieCertificateView
// ============================================================================

interface SlotDieCertificateViewProps {
  onTriggerCapa?: (defectInfo: { item: string; tolerance: string; actual: string }) => void;
}

export const SlotDieCertificateView: React.FC<SlotDieCertificateViewProps> = ({ onTriggerCapa }) => {
  const [activeCertTab, setActiveCertTab] = useState<'TAB1_MAIN' | 'TAB2_FLATNESS_30' | 'TAB3_ROUGHNESS_OPTICAL' | 'TAB4_HARDNESS_BOLT' | 'TAB_PRINT_ALL'>('TAB1_MAIN');

  // Interactive Editable States for Real-time Testing & Tolerance Verification
  const [frontData30, setFrontData30] = useState<Measurement30Point[]>(RAW_FLATNESS_30_FRONT);
  const [rearData30, setRearData30] = useState<Measurement30Point[]>(RAW_FLATNESS_30_REAR);
  const [straightness30, setStraightness30] = useState<Straightness30Point[]>(RAW_STRAIGHTNESS_30);
  const [opticalData, setOpticalData] = useState(RAW_OPTICAL_MEASUREMENTS);
  const [damperData, setDamperData] = useState(RAW_DAMPER_STEP);
  const [bolts43, setBolts43] = useState(RAW_ADJUSTMENT_BOLTS_43);

  // Hardness & Magnetism States
  const [hardnessP1, setHardnessP1] = useState<number>(40.2);
  const [hardnessP2, setHardnessP2] = useState<number>(39.9);
  const [magFrontP1, setMagFrontP1] = useState<number>(0.08);
  const [magFrontP2, setMagFrontP2] = useState<number>(0.06);
  const [magRearP1, setMagRearP1] = useState<number>(0.05);
  const [magRearP2, setMagRearP2] = useState<number>(0.07);

  // Gap step
  const [gapStepP1, setGapStepP1] = useState<number>(0.080);
  const [gapStepP2, setGapStepP2] = useState<number>(0.080);
  const [gapStepP3, setGapStepP3] = useState<number>(0.080);

  // Toast / Alert Notification
  const [alertModal, setAlertModal] = useState<{ item: string; tolerance: string; actual: string } | null>(null);

  // Calculated Stats Helper
  const calcStats = (vals: number[]) => {
    if (!vals || vals.length === 0) return { max: 0, min: 0, flatness: 0 };
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    const flatness = Math.round((max - min) * 10) / 10;
    return { max: Math.round(max * 10) / 10, min: Math.round(min * 10) / 10, flatness };
  };

  // Front Lip A1 Stats
  const frontLipA1Stats = useMemo(() => calcStats(frontData30.map((d) => d.lipA1)), [frontData30]);
  const frontBoltB1Stats = useMemo(() => calcStats(frontData30.map((d) => d.boltB1)), [frontData30]);
  const frontStraightStats = useMemo(() => calcStats(straightness30.map((d) => d.frontLine)), [straightness30]);

  // Rear Lip A1 Stats
  const rearLipA1Stats = useMemo(() => calcStats(rearData30.map((d) => d.lipA1)), [rearData30]);
  const rearBoltB1Stats = useMemo(() => calcStats(rearData30.map((d) => d.boltB1)), [rearData30]);
  const rearStraightStats = useMemo(() => calcStats(straightness30.map((d) => d.rearLine)), [straightness30]);

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
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-mono font-bold">
              Doc No: JS-QC260303-01N
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
              세메스(SEMES) 공식 납품용
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
              New / All
            </span>
          </div>

          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <span>SLIT NOZZLE 1580mm (STS630) 검사 성적서</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300 font-medium pt-1">
            <div>고객사: <strong className="text-white">세메스</strong></div>
            <div>규격/재질: <strong className="text-white">1580mm / STS630</strong></div>
            <div>검사일자: <strong className="text-white font-mono">2026.03.03</strong></div>
            <div>검사/승인: <strong className="text-white">MW.Jeon / SH.Kim</strong></div>
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

          <button
            onClick={handlePrintDocument}
            className="px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg flex items-center gap-2 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>8페이지 통합 성적서 출력</span>
          </button>
        </div>
      </div>

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
                    FRONT PLATE 형상 및 치수 검증
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
                      <th className="p-2.5">규격</th>
                      <th className="p-2.5">측정값</th>
                      <th className="p-2.5 text-center">결과</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">1</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Length</td>
                      <td className="p-2.5 font-mono text-slate-500">1580 ± 0.3 mm</td>
                      <td className="p-2.5 font-mono font-black text-slate-900 dark:text-white">1580.00 mm</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">합격</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">2</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Height</td>
                      <td className="p-2.5 font-mono text-slate-500">160 ± 0.2 mm</td>
                      <td className="p-2.5 font-mono font-black text-slate-900 dark:text-white">160.00 mm</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">합격</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">3</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Thickness</td>
                      <td className="p-2.5 font-mono text-slate-500">60 ± 0.1 mm</td>
                      <td className="p-2.5 font-mono font-black text-slate-900 dark:text-white">60.00 mm</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">합격</td>
                    </tr>
                    <tr className="bg-blue-50/40 dark:bg-blue-950/20">
                      <td className="p-2.5 font-mono text-slate-500">4</td>
                      <td className="p-2.5 font-bold text-blue-700 dark:text-blue-400">Lip Thickness</td>
                      <td className="p-2.5 font-mono text-slate-500">0.3 ± 0.005 mm</td>
                      <td className="p-2.5 font-mono font-black text-blue-700 dark:text-blue-300">0.300 mm</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">합격</td>
                    </tr>
                    <tr className="bg-amber-50/40 dark:bg-amber-950/20">
                      <td className="p-2.5 font-mono text-slate-500">*5</td>
                      <td className="p-2.5 font-bold text-amber-800 dark:text-amber-400">Gap (Step)</td>
                      <td className="p-2.5 font-mono text-slate-500">0.080 ± 0.002 mm</td>
                      <td className="p-2.5 font-mono font-black text-amber-700 dark:text-amber-300">0.080 mm</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">합격</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">*6</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Roughness</td>
                      <td className="p-2.5 font-mono text-slate-500">Rmax ≤ 0.2 ㎛</td>
                      <td className="p-2.5 font-mono font-black text-slate-900 dark:text-white">0.170 ㎛</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">합격</td>
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
                    REAR PLATE 형상 및 치수 검증
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
                      <th className="p-2.5">규격</th>
                      <th className="p-2.5">측정값</th>
                      <th className="p-2.5 text-center">결과</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">1</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Length</td>
                      <td className="p-2.5 font-mono text-slate-500">1493 ± 0.1 mm</td>
                      <td className="p-2.5 font-mono font-black text-slate-900 dark:text-white">1493.00 mm</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">합격</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">2</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Height</td>
                      <td className="p-2.5 font-mono text-slate-500">160 ± 0.2 mm</td>
                      <td className="p-2.5 font-mono font-black text-slate-900 dark:text-white">160.00 mm</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">합격</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">3</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Thickness</td>
                      <td className="p-2.5 font-mono text-slate-500">70 ± 0.1 mm</td>
                      <td className="p-2.5 font-mono font-black text-slate-900 dark:text-white">70.00 mm</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">합격</td>
                    </tr>
                    <tr className="bg-blue-50/40 dark:bg-blue-950/20">
                      <td className="p-2.5 font-mono text-slate-500">4</td>
                      <td className="p-2.5 font-bold text-blue-700 dark:text-blue-400">Lip Thickness</td>
                      <td className="p-2.5 font-mono text-slate-500">0.3 ± 0.005 mm</td>
                      <td className="p-2.5 font-mono font-black text-blue-700 dark:text-blue-300">0.300 mm</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">합격</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">*5</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Gap (Step)</td>
                      <td className="p-2.5 font-mono text-slate-500">-</td>
                      <td className="p-2.5 font-mono text-slate-500">-</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">합격</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">*6</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Roughness</td>
                      <td className="p-2.5 font-mono text-slate-500">Rmax ≤ 0.2 ㎛</td>
                      <td className="p-2.5 font-mono font-black text-slate-900 dark:text-white">0.169 ㎛</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">합격</td>
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
                    <td className="p-2 text-blue-700 dark:text-blue-400">{frontLipA1Stats.max}</td>
                    <td className="p-2 text-blue-700 dark:text-blue-400">0.8</td>
                    <td className="p-2 text-blue-700 dark:text-blue-400">0.9</td>
                    <td className="p-2 border-r border-slate-300 dark:border-slate-700 text-blue-700 dark:text-blue-400">0.9</td>

                    <td className="p-2 text-center">Max</td>
                    <td className="p-2 text-indigo-700 dark:text-indigo-400">{rearLipA1Stats.max}</td>
                    <td className="p-2 text-indigo-700 dark:text-indigo-400">0.6</td>
                    <td className="p-2 text-indigo-700 dark:text-indigo-400">1.7</td>
                    <td className="p-2 text-indigo-700 dark:text-indigo-400">1.1</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-center">Min</td>
                    <td className="p-2 text-rose-700 dark:text-rose-400">{frontLipA1Stats.min}</td>
                    <td className="p-2 text-rose-700 dark:text-rose-400">-0.6</td>
                    <td className="p-2 text-rose-700 dark:text-rose-400">-0.7</td>
                    <td className="p-2 border-r border-slate-300 dark:border-slate-700 text-rose-700 dark:text-rose-400">-0.6</td>

                    <td className="p-2 text-center">Min</td>
                    <td className="p-2 text-rose-700 dark:text-rose-400">{rearLipA1Stats.min}</td>
                    <td className="p-2 text-rose-700 dark:text-rose-400">-0.6</td>
                    <td className="p-2 text-rose-700 dark:text-rose-400">-0.9</td>
                    <td className="p-2 text-rose-700 dark:text-rose-400">-0.6</td>
                  </tr>
                  <tr className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    <td className="p-2 text-center font-black">Flatness</td>
                    <td className="p-2 font-black">{frontLipA1Stats.flatness}</td>
                    <td className="p-2 font-black">1.4</td>
                    <td className="p-2 font-black">1.6</td>
                    <td className="p-2 border-r border-slate-300 dark:border-slate-700 font-black">1.5</td>

                    <td className="p-2 text-center font-black">Flatness</td>
                    <td className="p-2 font-black">{rearLipA1Stats.flatness}</td>
                    <td className="p-2 font-black">1.2</td>
                    <td className="p-2 font-black">2.7</td>
                    <td className="p-2 font-black">1.7</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Lip Straightness 30 Points Section */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Lip 진직도 (Straightness) 30포인트 측정값</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
                  <span>FRONT PLATE 진직도 (Max: 1.0, Min: -0.7)</span>
                  <strong className="text-emerald-600 font-mono text-sm">Flatness 1.7 ㎛ (합격)</strong>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
                  <span>REAR PLATE 진직도 (Max: 0.9, Min: -0.6)</span>
                  <strong className="text-emerald-600 font-mono text-sm">Flatness 1.5 ㎛ (합격)</strong>
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
                  <p className="text-xs text-slate-500">허용 규격: Rmax ≤ 0.2 ㎛ (Front/Rear Plate)</p>
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
                    <strong>0.177 ㎛</strong>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border">
                    <span className="text-[10px] text-slate-500 block font-sans">위치 (b)</span>
                    <strong>0.163 ㎛</strong>
                  </div>
                  <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                    <span className="text-[10px] block font-sans font-bold">평균값 (Avg)</span>
                    <strong>0.170 ㎛ (합격)</strong>
                  </div>
                </div>
              </div>

              {/* Rear Plate Roughness */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="text-xs font-black text-indigo-700 dark:text-indigo-400">REAR PLATE (㎛)</h4>
                <div className="grid grid-cols-3 gap-2 text-xs text-center font-mono">
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border">
                    <span className="text-[10px] text-slate-500 block font-sans">위치 (a)</span>
                    <strong>0.170 ㎛</strong>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border">
                    <span className="text-[10px] text-slate-500 block font-sans">위치 (b)</span>
                    <strong>0.167 ㎛</strong>
                  </div>
                  <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                    <span className="text-[10px] block font-sans font-bold">평균값 (Avg)</span>
                    <strong>0.169 ㎛ (합격)</strong>
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
                  <p className="text-xs text-slate-500">규격: 0.3 ± 0.005 mm (평균 측정값: 0.300 mm)</p>
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
                <strong className="text-base font-black text-slate-900 dark:text-white font-mono">0.080 mm</strong>
                <span className="text-[10px] text-emerald-600 block">규격: 0.080 ± 0.002 (합격)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-center">
                <span className="text-xs text-slate-500 block font-bold">GAP 단차 (Point 2)</span>
                <strong className="text-base font-black text-slate-900 dark:text-white font-mono">0.080 mm</strong>
                <span className="text-[10px] text-emerald-600 block">규격: 0.080 ± 0.002 (합격)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-center">
                <span className="text-xs text-slate-500 block font-bold">GAP 단차 (Point 3)</span>
                <strong className="text-base font-black text-slate-900 dark:text-white font-mono">0.080 mm</strong>
                <span className="text-[10px] text-emerald-600 block">규격: 0.080 ± 0.002 (합격)</span>
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
                    <td className="p-2 text-center font-bold text-blue-600">0.050</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold font-sans">DAMPER</td>
                    {damperData.map((d) => (
                      <td key={d.no} className="p-2 text-center">{d.damper.toFixed(3)}</td>
                    ))}
                    <td className="p-2 text-center font-bold text-blue-600">0.050</td>
                  </tr>
                  <tr className="bg-emerald-50/50 dark:bg-emerald-950/30 font-bold">
                    <td className="p-2 font-sans text-emerald-800 dark:text-emerald-300">편차</td>
                    {damperData.map((d) => (
                      <td key={d.no} className="p-2 text-center text-emerald-700 dark:text-emerald-400">
                        {d.dev >= 0 ? `+${d.dev.toFixed(3)}` : d.dev.toFixed(3)}
                      </td>
                    ))}
                    <td className="p-2 text-center text-emerald-700 dark:text-emerald-400">0.000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. [탭 4] 경도, 자력 및 조절볼트(43개) 검사 뷰                        */}
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
                    경도 측정 데이터 (REAR PLATE)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">규격: HRC 40 ± 2</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-center">
                  <span className="text-slate-500 block font-bold">Point 1</span>
                  <strong className="text-lg font-black text-emerald-600 font-mono">{hardnessP1} HRC</strong>
                  <span className="text-[10px] text-slate-400 block font-bold">판정: 합격 (OK)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-center">
                  <span className="text-slate-500 block font-bold">Point 2</span>
                  <strong className="text-lg font-black text-emerald-600 font-mono">{hardnessP2} HRC</strong>
                  <span className="text-[10px] text-slate-400 block font-bold">판정: 합격 (OK)</span>
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
                <span className="text-xs font-mono font-bold text-slate-500">규격: 0.2 mT 이하</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-center">
                  <span className="text-slate-500 block font-bold">FRONT (Point 1 / 2)</span>
                  <strong className="text-base font-black text-emerald-600 font-mono">
                    {magFrontP1} / {magFrontP2} mT
                  </strong>
                  <span className="text-[10px] text-slate-400 block font-bold">기준치 0.2 이하 만족</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-center">
                  <span className="text-slate-500 block font-bold">REAR (Point 1 / 2)</span>
                  <strong className="text-base font-black text-emerald-600 font-mono">
                    {magRearP1} / {magRearP2} mT
                  </strong>
                  <span className="text-[10px] text-slate-400 block font-bold">기준치 0.2 이하 만족</span>
                </div>
              </div>
            </div>
          </div>

          {/* 43 Adjustment Bolts Inspection Matrix (Page 8) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    조절볼트 전수 검사 매트릭스 (@1번 ~ @43번 총 43개)
                  </h3>
                  <p className="text-xs text-slate-500">
                    마이크로 피치 나사산 체결 토크, 회전 유격(Backlash), 립 조절 원활성 전수 검사
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-300">
                43개 조절볼트 전수 정상 (100% PASS)
              </span>
            </div>

            {/* 43 Bolts Interactive Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11 gap-2">
              {bolts43.map((bolt) => (
                <div
                  key={bolt.id}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center flex flex-col items-center justify-between hover:border-blue-500 transition cursor-pointer"
                >
                  <span className="text-[10px] font-mono font-bold text-slate-500">#{bolt.id}</span>
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 my-1 shadow-xs" />
                  <span className="text-[9px] font-mono text-slate-700 dark:text-slate-300 font-bold">5.0N·m</span>
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
                  세메스 납품 사양에 완벽히 부합하는 8페이지 구성의 정밀 측정 성적서입니다.
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
                  Document number : <strong className="text-black">JS-QC260303-01N</strong>
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
                    <td className="p-2 font-mono border-r border-slate-900">2026.03.03</td>
                    <td className="p-2 border-r border-slate-900">MW.Jeon</td>
                    <td className="p-2 border-r border-slate-900">SH.Kim</td>
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
                  <td className="p-2 border-r border-slate-900">세메스</td>
                  <td className="p-2 border-r border-slate-900">SLIT NOZZLE</td>
                  <td className="p-2 border-r border-slate-900 font-mono">1580mm</td>
                  <td className="p-2 font-mono">STS630</td>
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
                      <td className="p-1 border-r border-slate-300">1580±0.3</td>
                      <td className="p-1 border-r border-slate-300 font-bold">1580.00</td>
                      <td className="p-1 font-bold text-emerald-700">합격</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r border-slate-300">2</td>
                      <td className="p-1 border-r border-slate-300 font-sans">Height</td>
                      <td className="p-1 border-r border-slate-300">160±0.2</td>
                      <td className="p-1 border-r border-slate-300 font-bold">160.00</td>
                      <td className="p-1 font-bold text-emerald-700">합격</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r border-slate-300">3</td>
                      <td className="p-1 border-r border-slate-300 font-sans">Thickness</td>
                      <td className="p-1 border-r border-slate-300">60±0.1</td>
                      <td className="p-1 border-r border-slate-300 font-bold">60.00</td>
                      <td className="p-1 font-bold text-emerald-700">합격</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r border-slate-300">4</td>
                      <td className="p-1 border-r border-slate-300 font-sans font-bold">Lip Thk</td>
                      <td className="p-1 border-r border-slate-300">0.3±0.005</td>
                      <td className="p-1 border-r border-slate-300 font-bold">0.300</td>
                      <td className="p-1 font-bold text-emerald-700">합격</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r border-slate-300">*5</td>
                      <td className="p-1 border-r border-slate-300 font-sans font-bold">Gap(Step)</td>
                      <td className="p-1 border-r border-slate-300">0.080±0.002</td>
                      <td className="p-1 border-r border-slate-300 font-bold">0.080</td>
                      <td className="p-1 font-bold text-emerald-700">합격</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r border-slate-300">*6</td>
                      <td className="p-1 border-r border-slate-300 font-sans">Roughness</td>
                      <td className="p-1 border-r border-slate-300">Rmax≤0.2</td>
                      <td className="p-1 border-r border-slate-300 font-bold">0.170</td>
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
                      <td className="p-1 border-r border-slate-300">1493±0.1</td>
                      <td className="p-1 border-r border-slate-300 font-bold">1493.00</td>
                      <td className="p-1 font-bold text-emerald-700">합격</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r border-slate-300">2</td>
                      <td className="p-1 border-r border-slate-300 font-sans">Height</td>
                      <td className="p-1 border-r border-slate-300">160±0.2</td>
                      <td className="p-1 border-r border-slate-300 font-bold">160.00</td>
                      <td className="p-1 font-bold text-emerald-700">합격</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r border-slate-300">3</td>
                      <td className="p-1 border-r border-slate-300 font-sans">Thickness</td>
                      <td className="p-1 border-r border-slate-300">70±0.1</td>
                      <td className="p-1 border-r border-slate-300 font-bold">70.00</td>
                      <td className="p-1 font-bold text-emerald-700">합격</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r border-slate-300">4</td>
                      <td className="p-1 border-r border-slate-300 font-sans font-bold">Lip Thk</td>
                      <td className="p-1 border-r border-slate-300">0.3±0.005</td>
                      <td className="p-1 border-r border-slate-300 font-bold">0.300</td>
                      <td className="p-1 font-bold text-emerald-700">합격</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r border-slate-300">*5</td>
                      <td className="p-1 border-r border-slate-300 font-sans">Gap(Step)</td>
                      <td className="p-1 border-r border-slate-300">-</td>
                      <td className="p-1 border-r border-slate-300 font-bold">-</td>
                      <td className="p-1 font-bold text-emerald-700">합격</td>
                    </tr>
                    <tr>
                      <td className="p-1 border-r border-slate-300">*6</td>
                      <td className="p-1 border-r border-slate-300 font-sans">Roughness</td>
                      <td className="p-1 border-r border-slate-300">Rmax≤0.2</td>
                      <td className="p-1 border-r border-slate-300 font-bold">0.169</td>
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
