import React, { useState } from 'react';
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
  FileSpreadsheet,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

export interface InspectionItem {
  id: string;
  productName: string;
  line: string;
  lotNo: string;
  inspectTime: string;
  cmmDevice: string;
  programName: string;
  inspector: string;
  result: 'PASS' | 'FAIL' | 'REINSPECT';
  defectType?: string;
  measurements: {
    no: number;
    item: string;
    nominal: number;
    actual: number;
    tolerance: string;
    deviation: string;
    status: 'OK' | 'NG';
  }[];
  actionHistory?: {
    defectOccurred: {
      id: string;
      type: string;
      time: string;
    };
    causeAnalysis: {
      reason: string;
      jigId: string;
      details: string;
      time: string;
    };
    correctiveAction: {
      action: string;
      jigChange: string;
      details: string;
      time: string;
    };
    reinspection: {
      id: string;
      time: string;
      result: string;
    };
    finalVerdict: {
      result: string;
      time: string;
    };
  };
}

const DEFAULT_INSPECTION_LIST: InspectionItem[] = [
  {
    id: 'INS-250521-001',
    productName: '하우징 커버',
    line: 'LINE 1',
    lotNo: 'LOT-250519-001',
    inspectTime: '2025-05-21 10:28',
    cmmDevice: 'CMM-01',
    programName: 'HOUSING_COVER_V2',
    inspector: '김준성',
    result: 'FAIL',
    defectType: '치수 불량',
    measurements: [
      { no: 1, item: 'Ø26 H7', nominal: 26.00, actual: 26.018, deviation: '+0.018', tolerance: '±0.021', status: 'OK' },
      { no: 2, item: 'Ø15 H7', nominal: 15.00, actual: 15.032, deviation: '+0.032', tolerance: '±0.018', status: 'NG' },
      { no: 3, item: '평면도', nominal: 80.00, actual: 79.972, deviation: '-0.028', tolerance: '±0.050', status: 'OK' },
      { no: 4, item: '위치도', nominal: 45.00, actual: 45.065, deviation: '+0.065', tolerance: '±0.050', status: 'NG' },
      { no: 5, item: '외경 R', nominal: 30.00, actual: 29.985, deviation: '-0.015', tolerance: '±0.050', status: 'OK' },
      { no: 6, item: '홀 깊이', nominal: 12.00, actual: 12.021, deviation: '+0.021', tolerance: '±0.020', status: 'NG' }
    ],
    actionHistory: {
      defectOccurred: { id: 'INS-250521-001', type: '치수 불량 (Ø15 H7)', time: '2025-05-21 10:28' },
      causeAnalysis: { reason: '지그 마모 확인', jigId: 'JIG-015', details: '마모량 0.03mm 초과', time: '2025-05-21 11:00' },
      correctiveAction: { action: '지그 교체', jigChange: 'JIG-015 → JIG-015A', details: '설비 보정 실행', time: '2025-05-21 11:20' },
      reinspection: { id: 'INS-250521-001-R1', time: '2025-05-21 12:10', result: '합격' },
      finalVerdict: { result: '합격 (OK)', time: '2025-05-21 12:10' }
    }
  },
  {
    id: 'INS-250521-002',
    productName: '베이스 플레이트',
    line: 'LINE 2',
    lotNo: 'LOT-250519-002',
    inspectTime: '2025-05-21 10:17',
    cmmDevice: 'CMM-02',
    programName: 'BASE_PLATE_V1',
    inspector: '이영희',
    result: 'PASS',
    measurements: [
      { no: 1, item: 'Ø26 H7', nominal: 26.00, actual: 26.005, deviation: '+0.005', tolerance: '±0.021', status: 'OK' },
      { no: 2, item: 'Ø15 H7', nominal: 15.00, actual: 15.008, deviation: '+0.008', tolerance: '±0.018', status: 'OK' },
      { no: 3, item: '평면도', nominal: 80.00, actual: 80.010, deviation: '+0.010', tolerance: '±0.050', status: 'OK' },
      { no: 4, item: '위치도', nominal: 45.00, actual: 45.012, deviation: '+0.012', tolerance: '±0.050', status: 'OK' },
      { no: 5, item: '외경 R', nominal: 30.00, actual: 30.002, deviation: '+0.002', tolerance: '±0.050', status: 'OK' },
      { no: 6, item: '홀 깊이', nominal: 12.00, actual: 12.005, deviation: '+0.005', tolerance: '±0.020', status: 'OK' }
    ]
  },
  {
    id: 'INS-250521-003',
    productName: '기어 케이스',
    line: 'LINE 1',
    lotNo: 'LOT-250519-003',
    inspectTime: '2025-05-21 10:12',
    cmmDevice: 'CMM-01',
    programName: 'GEAR_CASE_PRO',
    inspector: '박철수',
    result: 'FAIL',
    defectType: '형상 불량',
    measurements: [
      { no: 1, item: 'Ø26 H7', nominal: 26.00, actual: 26.010, deviation: '+0.010', tolerance: '±0.021', status: 'OK' },
      { no: 2, item: 'Ø15 H7', nominal: 15.00, actual: 15.012, deviation: '+0.012', tolerance: '±0.018', status: 'OK' },
      { no: 3, item: '평면도', nominal: 80.00, actual: 80.082, deviation: '+0.082', tolerance: '±0.050', status: 'NG' },
      { no: 4, item: '위치도', nominal: 45.00, actual: 45.020, deviation: '+0.020', tolerance: '±0.050', status: 'OK' },
      { no: 5, item: '외경 R', nominal: 30.00, actual: 29.920, deviation: '-0.080', tolerance: '±0.050', status: 'NG' },
      { no: 6, item: '홀 깊이', nominal: 12.00, actual: 12.010, deviation: '+0.010', tolerance: '±0.020', status: 'OK' }
    ],
    actionHistory: {
      defectOccurred: { id: 'INS-250521-003', type: '형상 불량 (평면도)', time: '2025-05-21 10:12' },
      causeAnalysis: { reason: '클램프 고정 변형', jigId: 'JIG-088', details: '가공 중 클램핑 과도한 휨', time: '2025-05-21 10:40' },
      correctiveAction: { action: '클램핑 압력 조절', jigChange: '압력 5.5bar -> 3.2bar', details: '평면 가공 재진행', time: '2025-05-21 11:15' },
      reinspection: { id: 'INS-250521-003-R1', time: '2025-05-21 11:45', result: '합격' },
      finalVerdict: { result: '합격 (OK)', time: '2025-05-21 11:45' }
    }
  },
  {
    id: 'INS-250521-004',
    productName: '샤프트',
    line: 'LINE 3',
    lotNo: 'LOT-250519-004',
    inspectTime: '2025-05-21 09:58',
    cmmDevice: 'CMM-03',
    programName: 'SHAFT_PRECISION',
    inspector: '최민지',
    result: 'PASS',
    measurements: [
      { no: 1, item: '외경 D1', nominal: 40.00, actual: 40.004, deviation: '+0.004', tolerance: '±0.015', status: 'OK' },
      { no: 2, item: '진동도', nominal: 0.00, actual: 0.005, deviation: '+0.005', tolerance: '±0.010', status: 'OK' }
    ]
  },
  {
    id: 'INS-250521-005',
    productName: '브라켓',
    line: 'LINE 2',
    lotNo: 'LOT-250519-005',
    inspectTime: '2025-05-21 09:42',
    cmmDevice: 'CMM-02',
    programName: 'BRACKET_CHECK',
    inspector: '김준성',
    result: 'FAIL',
    defectType: '치수 불량',
    measurements: [
      { no: 1, item: '홀 간격', nominal: 100.00, actual: 100.095, deviation: '+0.095', tolerance: '±0.030', status: 'NG' }
    ]
  },
  {
    id: 'INS-250521-006',
    productName: '하우징 커버',
    line: 'LINE 1',
    lotNo: 'LOT-250519-006',
    inspectTime: '2025-05-21 09:30',
    cmmDevice: 'CMM-01',
    programName: 'HOUSING_COVER_V2',
    inspector: '이영희',
    result: 'PASS',
    measurements: [
      { no: 1, item: 'Ø26 H7', nominal: 26.00, actual: 26.002, deviation: '+0.002', tolerance: '±0.021', status: 'OK' }
    ]
  },
  {
    id: 'INS-250521-007',
    productName: '베이스 플레이트',
    line: 'LINE 2',
    lotNo: 'LOT-250519-007',
    inspectTime: '2025-05-21 09:15',
    cmmDevice: 'CMM-02',
    programName: 'BASE_PLATE_V1',
    inspector: '박철수',
    result: 'PASS',
    measurements: [
      { no: 1, item: '평면도', nominal: 80.00, actual: 80.008, deviation: '+0.008', tolerance: '±0.050', status: 'OK' }
    ]
  }
];

export const QualityInspectionView: React.FC = () => {
  const [selectedInspection, setSelectedInspection] = useState<InspectionItem>(DEFAULT_INSPECTION_LIST[0]);
  const [viewTab, setViewTab] = useState<'MEASURE' | 'TOLERANCE'>('MEASURE');
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [searchLine, setSearchLine] = useState<string>('ALL');
  const [searchProduct, setSearchProduct] = useState<string>('ALL');
  const [searchResult, setSearchResult] = useState<string>('ALL');
  const [searchDefect, setSearchDefect] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotationAngle, setRotationAngle] = useState<number>(0);

  // Filter Inspection List
  const filteredList = DEFAULT_INSPECTION_LIST.filter((item) => {
    if (searchLine !== 'ALL' && item.line !== searchLine) return false;
    if (searchProduct !== 'ALL' && item.productName !== searchProduct) return false;
    if (searchResult !== 'ALL' && item.result !== searchResult) return false;
    if (searchDefect !== 'ALL' && item.defectType !== searchDefect) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = item.id.toLowerCase().includes(q);
      const matchProduct = item.productName.toLowerCase().includes(q);
      const matchLot = item.lotNo.toLowerCase().includes(q);
      if (!matchId && !matchProduct && !matchLot) return false;
    }
    return true;
  });

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-10">
      {/* ==================================================================== */}
      {/* 1. TOP KPI STATS (6 Cards)                                          */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: 금일 검사 건수 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">금일 검사 건수</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 border border-teal-200">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 tracking-tight">1,256 <span className="text-xs font-bold text-slate-500">건</span></div>
            <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <span>▲ 120</span>
              <span className="text-slate-400 font-normal">(전일 대비)</span>
            </div>
          </div>
        </div>

        {/* Card 2: 합격률 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">합격률</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 tracking-tight">98.7 <span className="text-xs font-bold text-slate-500">%</span></div>
            <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <span>▲ 0.8%</span>
              <span className="text-slate-400 font-normal">(전일 대비)</span>
            </div>
          </div>
        </div>

        {/* Card 3: 불량 건수 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">불량 건수</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-rose-600 tracking-tight">16 <span className="text-xs font-bold text-slate-500">건</span></div>
            <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <span>▼ 5</span>
              <span className="text-slate-400 font-normal">(전일 대비)</span>
            </div>
          </div>
        </div>

        {/* Card 4: 재검사 건수 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">재검사 건수</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-amber-600 tracking-tight">3 <span className="text-xs font-bold text-slate-500">건</span></div>
            <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <span>▼ 2</span>
              <span className="text-slate-400 font-normal">(전일 대비)</span>
            </div>
          </div>
        </div>

        {/* Card 5: 평균 검사 시간 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">평균 검사 시간</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 tracking-tight">18 <span className="text-xs font-bold text-slate-500">분</span> 45 <span className="text-xs font-bold text-slate-500">초</span></div>
            <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <span>▼ 2분 15초</span>
              <span className="text-slate-400 font-normal">(전일 대비)</span>
            </div>
          </div>
        </div>

        {/* Card 6: CMM 가동률 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">CMM 가동률</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 tracking-tight">92.1 <span className="text-xs font-bold text-slate-500">%</span></div>
            <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <span>▲ 3.1%</span>
              <span className="text-slate-400 font-normal">(전일 대비)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2-A. QUALITY STATUS PANELS (4 Grid Dashboard)                         */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Panel 1: 불량 유형 분포 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-extrabold text-slate-900">불량 유형 분포</h3>
            <span className="text-[10px] text-slate-400 font-semibold">총 16건</span>
          </div>
          <div className="flex items-center justify-around py-1">
            {/* SVG Donut Chart */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                {/* 치수 불량 56% (blue) */}
                <path className="text-blue-600" strokeDasharray="56, 100" strokeWidth="4.2" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                {/* 형상 불량 25% (amber) */}
                <path className="text-amber-500" strokeDasharray="25, 100" strokeDashoffset="-56" strokeWidth="4.2" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                {/* 표면 불량 13% (cyan) */}
                <path className="text-cyan-500" strokeDasharray="13, 100" strokeDashoffset="-81" strokeWidth="4.2" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                {/* 조립 불량 6% (rose) */}
                <path className="text-rose-500" strokeDasharray="6, 100" strokeDashoffset="-94" strokeWidth="4.2" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute text-center">
                <span className="text-[10px] text-slate-400 block font-bold">총</span>
                <span className="text-sm font-extrabold text-slate-900">16건</span>
              </div>
            </div>
            {/* Legend */}
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                <span className="text-slate-600 font-medium">치수 불량</span>
                <span className="font-extrabold text-slate-900 ml-auto">9 (56%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span className="text-slate-600 font-medium">형상 불량</span>
                <span className="font-extrabold text-slate-900 ml-auto">4 (25%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
                <span className="text-slate-600 font-medium">표면 불량</span>
                <span className="font-extrabold text-slate-900 ml-auto">2 (13%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span className="text-slate-600 font-medium">조립 불량</span>
                <span className="font-extrabold text-slate-900 ml-auto">1 (6%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: 최근 7일 불량 추이 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-extrabold text-slate-900">불량 추이 <span className="text-[10px] text-slate-400 font-normal">(최근 7일)</span></h3>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-teal-600"><span className="w-2 h-0.5 bg-teal-600" />검사 건수</span>
              <span className="flex items-center gap-1 text-rose-500"><span className="w-2 h-0.5 bg-rose-500" />불량률(%)</span>
            </div>
          </div>
          {/* Trend Line Chart SVG */}
          <div className="w-full h-24 pt-1">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 280 80">
              {/* Background Grid Lines */}
              <line x1="0" y1="20" x2="280" y2="20" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="50" x2="280" y2="50" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="70" x2="280" y2="70" stroke="#F1F5F9" strokeWidth="1" />
              {/* Teal Line: Inspection Count */}
              <polyline fill="none" stroke="#00A396" strokeWidth="2.5" points="10,40 50,30 90,45 130,25 170,50 210,30 250,40" />
              {/* Rose Line: Defect Rate */}
              <polyline fill="none" stroke="#F43F5E" strokeWidth="2" strokeDasharray="3,3" points="10,50 50,55 90,35 130,60 170,45 210,65 250,55" />
              {/* Data Points */}
              <circle cx="10" cy="40" r="3" fill="#00A396" />
              <circle cx="50" cy="30" r="3" fill="#00A396" />
              <circle cx="90" cy="45" r="3" fill="#00A396" />
              <circle cx="130" cy="25" r="3" fill="#00A396" />
              <circle cx="170" cy="50" r="3" fill="#00A396" />
              <circle cx="210" cy="30" r="3" fill="#00A396" />
              <circle cx="250" cy="40" r="3" fill="#00A396" />

              <circle cx="130" cy="60" r="3" fill="#F43F5E" />
            </svg>
            <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1 px-1">
              <span>05/15</span>
              <span>05/16</span>
              <span>05/17</span>
              <span>05/18</span>
              <span>05/19</span>
              <span>05/20</span>
              <span>05/21</span>
            </div>
          </div>
        </div>

        {/* Panel 3: 검사 결과 현황 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-extrabold text-slate-900">검사 결과 현황</h3>
            <span className="text-[10px] text-slate-400 font-semibold">금일 기준</span>
          </div>
          <div className="flex items-center justify-around py-1">
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                {/* 합격 98.7% (teal) */}
                <path className="text-teal-500" strokeDasharray="98.7, 100" strokeWidth="4.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                {/* 불합격 1.3% (rose) */}
                <path className="text-rose-500" strokeDasharray="1.3, 100" strokeDashoffset="-98.7" strokeWidth="4.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute text-center">
                <span className="text-[10px] text-slate-400 block font-bold">총</span>
                <span className="text-xs font-black text-slate-900">1,256건</span>
              </div>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
                <span className="text-slate-600 font-medium">합격</span>
                <span className="font-extrabold text-slate-900 ml-1">1,240 (98.7%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span className="text-slate-600 font-medium">불합격</span>
                <span className="font-extrabold text-rose-600 ml-1">16 (1.3%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span className="text-slate-600 font-medium">재검사</span>
                <span className="font-extrabold text-emerald-600 ml-1">3 (0.2%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 4: 주요 불량 원인 TOP 5 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <h3 className="text-xs font-extrabold text-slate-900">주요 불량 원인 TOP 5</h3>
            <span className="text-[10px] text-slate-400 font-bold">건수</span>
          </div>
          <div className="overflow-x-auto text-[11px]">
            <table className="w-full text-left">
              <thead className="text-slate-400 font-bold border-b border-slate-100 text-[10px]">
                <tr>
                  <th className="pb-1 w-8 text-center">순위</th>
                  <th className="pb-1">불량 원인</th>
                  <th className="pb-1 w-10 text-right">건수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr>
                  <td className="py-1 text-center font-bold text-amber-600">1</td>
                  <td className="py-1 font-bold text-slate-900">치수 공차 초과</td>
                  <td className="py-1 text-right font-black text-rose-600">6</td>
                </tr>
                <tr>
                  <td className="py-1 text-center font-bold text-slate-500">2</td>
                  <td className="py-1">지그 마모</td>
                  <td className="py-1 text-right font-bold text-slate-800">4</td>
                </tr>
                <tr>
                  <td className="py-1 text-center font-bold text-slate-500">3</td>
                  <td className="py-1">고정 불량 / 변형</td>
                  <td className="py-1 text-right font-bold text-slate-800">3</td>
                </tr>
                <tr>
                  <td className="py-1 text-center font-bold text-slate-500">4</td>
                  <td className="py-1">설비 정밀도 저하</td>
                  <td className="py-1 text-right font-bold text-slate-800">2</td>
                </tr>
                <tr>
                  <td className="py-1 text-center font-bold text-slate-500">5</td>
                  <td className="py-1">측정 프로그램 오류</td>
                  <td className="py-1 text-right font-bold text-slate-800">1</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2-B. MIDDLE SPLIT: 검사 목록 vs CMM 검사 결과 상세 (핵심)             */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT 6 COLS: 검사 목록 */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3 flex flex-col justify-between">
          <div>
            {/* Title & Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">CMM 검사 이력 목록</h3>
                  <p className="text-[11px] text-slate-500">
                    행(Row)을 클릭하면 우측에 3D 포인트별 CMM 검사 상세가 표시됩니다.
                  </p>
                </div>
              </div>

              {/* Filter Selects */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <select
                  value={searchLine}
                  onChange={(e) => setSearchLine(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-bold focus:ring-1 focus:ring-teal-500"
                >
                  <option value="ALL">라인 전체</option>
                  <option value="LINE 1">LINE 1</option>
                  <option value="LINE 2">LINE 2</option>
                  <option value="LINE 3">LINE 3</option>
                </select>

                <select
                  value={searchResult}
                  onChange={(e) => setSearchResult(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-bold focus:ring-1 focus:ring-teal-500"
                >
                  <option value="ALL">결과 전체</option>
                  <option value="PASS">합격 (OK)</option>
                  <option value="FAIL">불합격 (NG)</option>
                </select>

                <select
                  value={searchDefect}
                  onChange={(e) => setSearchDefect(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-bold focus:ring-1 focus:ring-teal-500"
                >
                  <option value="ALL">불량 전체</option>
                  <option value="치수 불량">치수 불량</option>
                  <option value="형상 불량">형상 불량</option>
                </select>
              </div>
            </div>

            {/* Inspection Table */}
            <div className="overflow-x-auto mt-3 border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs min-w-[580px]">
                <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">검사 ID</th>
                    <th className="p-2.5">제품명</th>
                    <th className="p-2.5">LINE</th>
                    <th className="p-2.5">LOT No.</th>
                    <th className="p-2.5">검사 시간</th>
                    <th className="p-2.5 text-center">CMM</th>
                    <th className="p-2.5 text-center">검사 결과</th>
                    <th className="p-2.5 text-center">불량 유형</th>
                    <th className="p-2.5 text-center">상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 font-semibold">
                        검색 조건에 해당하는 검사 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((item) => {
                      const isSelected = selectedInspection.id === item.id;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedInspection(item)}
                          className={`hover:bg-teal-50/60 transition cursor-pointer ${
                            isSelected ? 'bg-teal-50/90 font-bold border-l-4 border-l-teal-600' : ''
                          }`}
                        >
                          <td className="p-2.5 font-mono text-[11px] font-extrabold text-slate-900">
                            {item.id}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900">{item.productName}</td>
                          <td className="p-2.5 text-slate-500 text-[11px]">{item.line}</td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-500">{item.lotNo}</td>
                          <td className="p-2.5 text-[11px] text-slate-500">{item.inspectTime}</td>
                          <td className="p-2.5 text-center font-extrabold text-slate-700 text-[11px]">
                            {item.cmmDevice}
                          </td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                                item.result === 'PASS'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {item.result === 'PASS' ? '합격' : '불합격'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center text-[11px] font-bold text-rose-600">
                            {item.defectType || '-'}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedInspection(item);
                              }}
                              className={`p-1 rounded-lg transition ${
                                isSelected
                                  ? 'bg-teal-600 text-white'
                                  : 'text-slate-400 hover:text-teal-600 hover:bg-slate-100'
                              }`}
                              title="3D 측정 포인트 상세 보기"
                            >
                              <Search className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
            <div>총 {filteredList.length}건 목록 표시 중</div>
            <div className="flex items-center gap-1">
              <button className="p-1 border rounded hover:bg-slate-100"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <button className="px-2 py-0.5 bg-teal-600 text-white font-bold rounded">1</button>
              <button className="px-2 py-0.5 border rounded hover:bg-slate-100">2</button>
              <button className="px-2 py-0.5 border rounded hover:bg-slate-100">3</button>
              <button className="p-1 border rounded hover:bg-slate-100"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>

        {/* RIGHT 6 COLS: CMM 검사 결과 상세 (핵심) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border-2 border-teal-500/30 shadow-md p-4 space-y-3.5 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-600 text-white shadow-2xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">CMM 검사 결과 상세</h3>
                  <p className="text-[11px] text-slate-500">
                    선택 수주 3D 포인트별 정밀 공차 및 치수 측정 데이터
                  </p>
                </div>
              </div>

              <button
                onClick={handlePrintReport}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-teal-400" />
                <span>검사 리포트 출력</span>
              </button>
            </div>

            {/* Basic Info Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-400 font-medium block text-[10px]">검사 ID</span>
                <span className="font-mono font-extrabold text-slate-900">{selectedInspection.id}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block text-[10px]">제품명 / LINE</span>
                <span className="font-extrabold text-slate-900">{selectedInspection.productName} <span className="text-slate-500 font-normal">({selectedInspection.line})</span></span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block text-[10px]">LOT No. / CMM</span>
                <span className="font-mono font-bold text-slate-800">{selectedInspection.lotNo} ({selectedInspection.cmmDevice})</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block text-[10px]">검사 일시 / 검사자</span>
                <span className="font-bold text-slate-800">{selectedInspection.inspectTime} ({selectedInspection.inspector})</span>
              </div>
            </div>

            {/* Middle Section: CAD Image & Interactive 3D Pinpoints Diagram + Measurements Table */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-3">
              {/* Left 5 cols: CMM 3D Target & Interactive Pinpoints */}
              <div className="sm:col-span-5 bg-slate-900 rounded-xl p-3 border border-slate-800 text-white flex flex-col justify-between relative min-h-[260px] overflow-hidden">
                {/* View Tabs */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-[10px]">
                    <button
                      onClick={() => setViewTab('MEASURE')}
                      className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                        viewTab === 'MEASURE' ? 'bg-teal-500 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      측정 뷰
                    </button>
                    <button
                      onClick={() => setViewTab('TOLERANCE')}
                      className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                        viewTab === 'TOLERANCE' ? 'bg-teal-500 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      공차 뷰
                    </button>
                  </div>

                  <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded font-mono">
                    {selectedInspection.programName}
                  </span>
                </div>

                {/* Simulated CMM Probe & Machined Part Interactive SVG Graphic */}
                <div className="my-auto py-2 flex items-center justify-center relative select-none">
                  <div
                    className="transition-transform duration-300 ease-out relative"
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotationAngle}deg)`,
                    }}
                  >
                    {/* CMM Probe Machine & Part Silhouette */}
                    <svg className="w-48 h-40" viewBox="0 0 200 160">
                      {/* CMM Machine Frame */}
                      <path d="M 20 140 L 180 140 L 180 20 L 150 20 L 150 120 L 50 120 L 50 20 L 20 20 Z" fill="#1E293B" stroke="#334155" strokeWidth="2" />
                      {/* CMM Probe Vertical Column */}
                      <rect x="95" y="10" width="10" height="70" fill="#00C4B4" opacity="0.9" />
                      <circle cx="100" cy="82" r="5" fill="#F43F5E" className="animate-ping" />
                      <circle cx="100" cy="82" r="4" fill="#F43F5E" />

                      {/* Machined Part Block */}
                      <rect x="55" y="90" width="90" height="45" rx="6" fill="#334155" stroke="#00C4B4" strokeWidth="2" />
                      <circle cx="75" cy="112" r="10" fill="#0F172A" stroke="#00C4B4" strokeWidth="1.5" />
                      <circle cx="125" cy="112" r="8" fill="#0F172A" stroke="#F43F5E" strokeWidth="1.5" />

                      {/* Interactive Pinpoints Linked to Table Items */}
                      {/* Pin 1: Ø26 H7 */}
                      <g
                        onClick={() => setSelectedPoint(1)}
                        className="cursor-pointer hover:scale-125 transition"
                      >
                        <circle cx="75" cy="112" r="8" fill="#00C4B4" opacity="0.8" />
                        <text x="75" y="115" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontStyle="bold">1</text>
                      </g>

                      {/* Pin 2: Ø15 H7 (Defect) */}
                      <g
                        onClick={() => setSelectedPoint(2)}
                        className="cursor-pointer hover:scale-125 transition animate-bounce"
                      >
                        <circle cx="125" cy="112" r="8" fill="#F43F5E" opacity="0.9" />
                        <text x="125" y="115" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontStyle="bold">2</text>
                      </g>

                      {/* Pin 3: 평면도 */}
                      <g
                        onClick={() => setSelectedPoint(3)}
                        className="cursor-pointer hover:scale-125 transition"
                      >
                        <circle cx="100" cy="90" r="7" fill="#00C4B4" opacity="0.8" />
                        <text x="100" y="93" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontStyle="bold">3</text>
                      </g>

                      {/* Pin 4: 위치도 (Defect) */}
                      <g
                        onClick={() => setSelectedPoint(4)}
                        className="cursor-pointer hover:scale-125 transition"
                      >
                        <circle cx="140" cy="95" r="7" fill="#F43F5E" opacity="0.9" />
                        <text x="140" y="98" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontStyle="bold">4</text>
                      </g>
                    </svg>
                  </div>
                </div>

                {/* Control Tools Bar */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800 z-10 text-[11px] text-slate-400">
                  <span className="text-[10px]">3D 회전/줌 클릭</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setRotationAngle((r) => r + 45)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-300"
                      title="회전"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
                      className="p-1 hover:bg-slate-800 rounded text-slate-300"
                      title="확대"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}
                      className="p-1 hover:bg-slate-800 rounded text-slate-300"
                      title="축소"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setZoomLevel(1);
                        setRotationAngle(0);
                        setSelectedPoint(null);
                      }}
                      className="p-1 hover:bg-slate-800 rounded text-slate-300"
                      title="초기화"
                    >
                      <Folder className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right 7 cols: 측정 결과 테이블 */}
              <div className="sm:col-span-7 overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <table className="w-full text-left text-xs min-w-[340px]">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="p-2 text-center w-8">No.</th>
                      <th className="p-2">측정 항목</th>
                      <th className="p-2 text-right">기준값</th>
                      <th className="p-2 text-right">측정값</th>
                      <th className="p-2 text-right">편차</th>
                      <th className="p-2 text-center">공차</th>
                      <th className="p-2 text-center">판정</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {selectedInspection.measurements.map((m) => {
                      const isPointSelected = selectedPoint === m.no;
                      const isNG = m.status === 'NG';
                      return (
                        <tr
                          key={m.no}
                          onClick={() => setSelectedPoint(m.no)}
                          className={`hover:bg-teal-50/50 transition cursor-pointer ${
                            isPointSelected
                              ? 'bg-amber-100/80 font-bold'
                              : isNG
                              ? 'bg-rose-50/60'
                              : ''
                          }`}
                        >
                          <td className="p-2 text-center font-bold text-slate-500">{m.no}</td>
                          <td className="p-2 font-bold text-slate-900">{m.item}</td>
                          <td className="p-2 text-right font-mono text-slate-600">{m.nominal.toFixed(3)}</td>
                          <td className={`p-2 text-right font-mono font-bold ${isNG ? 'text-rose-600' : 'text-slate-900'}`}>
                            {m.actual.toFixed(3)}
                          </td>
                          <td className={`p-2 text-right font-mono font-bold text-[11px] ${isNG ? 'text-rose-600' : 'text-teal-700'}`}>
                            {m.deviation}
                          </td>
                          <td className="p-2 text-center font-mono text-slate-500 text-[10px]">{m.tolerance}</td>
                          <td className="p-2 text-center">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                                isNG
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}
                            >
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Comprehensive Verdict Bar */}
            <div className="bg-slate-900 text-white rounded-xl p-3 mt-3 flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-bold">종합 판정:</span>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-black tracking-wide ${
                    selectedInspection.result === 'PASS'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-rose-600 text-white animate-pulse'
                  }`}
                >
                  {selectedInspection.result === 'PASS' ? '합격 (OK)' : '불합격 (NG)'}
                </span>

                {selectedInspection.defectType && (
                  <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-0.5 rounded font-bold">
                    불량 유형: {selectedInspection.defectType}
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-300 font-mono">
                최대 편차: <span className="text-amber-400 font-bold">+0.065 mm (4번 위치도)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. BOTTOM ROW: 불량 조치 이력 / CMM 현황 / 최근 이미지                 */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* COL 1 (5 cols): 불량 분석 및 조치 이력 */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              불량 분석 및 조치 이력 (CAPA)
            </h3>
            <span className="text-[10px] text-teal-600 font-bold">불량 발생 → 최종 합격</span>
          </div>

          {/* Process Steps Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5 text-xs text-center">
            {/* Step 1 */}
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-2 space-y-1">
              <span className="text-[10px] font-black text-rose-800 block">1. 불량 발생</span>
              <div className="text-[11px] font-mono font-bold text-slate-900">INS-250521-001</div>
              <div className="text-[10px] font-bold text-rose-600">치수 불량 (Ø15 H7)</div>
              <div className="text-[9px] text-slate-400 font-mono">10:28</div>
            </div>

            {/* Step 2 */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 space-y-1">
              <span className="text-[10px] font-black text-amber-900 block">2. 원인 분석</span>
              <div className="text-[11px] font-extrabold text-slate-900">지그 마모 확인</div>
              <div className="text-[10px] text-slate-600 font-mono">JIG-015 (0.03mm)</div>
              <div className="text-[9px] text-slate-400 font-mono">11:00</div>
            </div>

            {/* Step 3 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 space-y-1">
              <span className="text-[10px] font-black text-blue-900 block">3. 조치 내용</span>
              <div className="text-[11px] font-extrabold text-blue-700">지그 교체 완료</div>
              <div className="text-[10px] text-slate-600 font-mono">JIG-015A 교체</div>
              <div className="text-[9px] text-slate-400 font-mono">11:20</div>
            </div>

            {/* Step 4 */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-2 space-y-1">
              <span className="text-[10px] font-black text-purple-900 block">4. CMM 재검사</span>
              <div className="text-[11px] font-mono font-bold text-slate-900">INS-001-R1</div>
              <div className="text-[10px] font-bold text-purple-700">재측정 진행</div>
              <div className="text-[9px] text-slate-400 font-mono">12:10</div>
            </div>

            {/* Step 5 */}
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-2 space-y-1">
              <span className="text-[10px] font-black text-emerald-900 block">5. 최종 판정</span>
              <div className="text-sm font-black text-emerald-600 my-0.5">합격 (OK)</div>
              <div className="text-[9px] text-emerald-700 font-bold">출하 승인 완료</div>
              <div className="text-[9px] text-slate-400 font-mono">12:10</div>
            </div>
          </div>
        </div>

        {/* COL 2 (3 cols): CMM 장비 현황 */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-extrabold text-slate-900">CMM 장비 현황</h3>
            <span className="text-[10px] text-slate-400 font-bold">4대 가동</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold">
                <tr>
                  <th className="p-1.5">장비명</th>
                  <th className="p-1.5">상태</th>
                  <th className="p-1.5 text-right">금일 검사</th>
                  <th className="p-1.5 text-right">가동률</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                <tr>
                  <td className="p-1.5 font-black">CMM-01</td>
                  <td className="p-1.5">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">정상</span>
                  </td>
                  <td className="p-1.5 text-right font-mono">426건</td>
                  <td className="p-1.5 text-right font-bold text-teal-700">95.2%</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-black">CMM-02</td>
                  <td className="p-1.5">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">정상</span>
                  </td>
                  <td className="p-1.5 text-right font-mono">388건</td>
                  <td className="p-1.5 text-right font-bold text-teal-700">91.3%</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-black">CMM-03</td>
                  <td className="p-1.5">
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">점검중</span>
                  </td>
                  <td className="p-1.5 text-right font-mono">312건</td>
                  <td className="p-1.5 text-right font-bold text-amber-700">78.6%</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-black">CMM-04</td>
                  <td className="p-1.5">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">정상</span>
                  </td>
                  <td className="p-1.5 text-right font-mono">130건</td>
                  <td className="p-1.5 text-right font-bold text-teal-700">93.5%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* COL 3 (4 cols): 최근 검사 이미지 (불량 샘플) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-extrabold text-slate-900">최근 검사 이미지 <span className="text-[10px] text-slate-400 font-normal">(불량 샘플)</span></h3>
            <button className="text-[11px] text-teal-600 hover:underline font-bold">더보기</button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Image Card 1 */}
            <div className="bg-slate-900 rounded-xl p-2 border border-slate-800 text-center space-y-1">
              <div className="h-16 bg-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                <svg className="w-12 h-12 text-teal-400 opacity-80" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="3" />
                  <circle cx="50" cy="50" r="20" fill="none" stroke="#F43F5E" strokeWidth="4" />
                </svg>
                <span className="absolute bottom-1 right-1 bg-rose-600 text-white text-[8px] font-black px-1 rounded">NG</span>
              </div>
              <div className="text-[10px] font-extrabold text-slate-200">Ø15 H7 초과</div>
              <div className="text-[9px] text-slate-400 font-mono">INS-250521-001</div>
            </div>

            {/* Image Card 2 */}
            <div className="bg-slate-900 rounded-xl p-2 border border-slate-800 text-center space-y-1">
              <div className="h-16 bg-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                <svg className="w-12 h-12 text-teal-400 opacity-80" viewBox="0 0 100 100">
                  <rect x="20" y="30" width="60" height="40" fill="none" stroke="currentColor" strokeWidth="3" />
                  <line x1="15" y1="30" x2="85" y2="30" stroke="#F43F5E" strokeWidth="3" strokeDasharray="3,3" />
                </svg>
                <span className="absolute bottom-1 right-1 bg-rose-600 text-white text-[8px] font-black px-1 rounded">NG</span>
              </div>
              <div className="text-[10px] font-extrabold text-slate-200">평면도 초과</div>
              <div className="text-[9px] text-slate-400 font-mono">INS-250521-003</div>
            </div>

            {/* Image Card 3 */}
            <div className="bg-slate-900 rounded-xl p-2 border border-slate-800 text-center space-y-1">
              <div className="h-16 bg-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                <svg className="w-12 h-12 text-teal-400 opacity-80" viewBox="0 0 100 100">
                  <circle cx="35" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="70" cy="50" r="8" fill="none" stroke="#F43F5E" strokeWidth="3" />
                </svg>
                <span className="absolute bottom-1 right-1 bg-rose-600 text-white text-[8px] font-black px-1 rounded">NG</span>
              </div>
              <div className="text-[10px] font-extrabold text-slate-200">홀 위치 편차</div>
              <div className="text-[9px] text-slate-400 font-mono">INS-250521-005</div>
            </div>

            {/* Image Card 4 */}
            <div className="bg-slate-900 rounded-xl p-2 border border-slate-800 text-center space-y-1">
              <div className="h-16 bg-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                <svg className="w-12 h-12 text-teal-400 opacity-80" viewBox="0 0 100 100">
                  <path d="M 20 80 Q 50 10 80 80" fill="none" stroke="#F43F5E" strokeWidth="4" />
                </svg>
                <span className="absolute bottom-1 right-1 bg-rose-600 text-white text-[8px] font-black px-1 rounded">NG</span>
              </div>
              <div className="text-[10px] font-extrabold text-slate-200">R 형상 불량</div>
              <div className="text-[9px] text-slate-400 font-mono">INS-250521-008</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
