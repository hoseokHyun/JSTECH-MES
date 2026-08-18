import React, { useState } from 'react';
import {
  X,
  FileCheck,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Sparkles,
  Layers,
  Search,
  Download,
  ShieldCheck,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  Activity,
  Microscope,
  Check
} from 'lucide-react';

export interface IqcLotItem {
  id: string;
  lotNo: string;
  materialType: string;
  standard: string;
  supplier: string;
  incomingDate: string;
  inspector: string;
  inspectionResult: 'PASS' | 'CONDITIONAL' | 'FAIL';
  rawDimensions: {
    length: { spec: string; actual: string; result: 'OK' | 'NG' };
    width: { spec: string; actual: string; result: 'OK' | 'NG' };
    thickness: { spec: string; actual: string; result: 'OK' | 'NG' };
    straightness: { spec: string; actual: string; result: 'OK' | 'NG' };
  };
  chemicalComposition: {
    element: string;
    specMin: number;
    specMax: number;
    actual: number;
    unit: string;
    result: 'OK' | 'NG';
  }[];
  mechanicalProperties: {
    hardness: { spec: string; actual: string; result: 'OK' | 'NG' };
    tensileStrength: { spec: string; actual: string; result: 'OK' | 'NG' };
    yieldStrength: { spec: string; actual: string; result: 'OK' | 'NG' };
    elongation: { spec: string; actual: string; result: 'OK' | 'NG' };
  };
  utInspection: {
    method: string;
    frequency: string;
    standard: string;
    defectFound: boolean;
    defectDetails: string;
    result: 'PASS' | 'FAIL';
  };
  surfaceInspection: {
    visualDefect: string;
    roughnessRa: string;
    coatingThickness?: string;
    coatingAdhesion?: string;
    result: 'PASS' | 'FAIL';
  };
  millSheetNo: string;
  heatNo: string;
  notes: string;
}

export const DEFAULT_IQC_LOTS: IqcLotItem[] = [
  {
    id: 'IQC-2026-0301',
    lotNo: 'LOT-260303-STS630',
    materialType: 'STS630 (17-4PH 석출경화 스테인리스강)',
    standard: 'KS D 3706 / ASTM A564 Grade 630 (H1025)',
    supplier: '세아베스틸 (POSCO 특수강 가공원)',
    incomingDate: '2026-03-03 09:30',
    inspector: '정품질 선임 (QA-04)',
    inspectionResult: 'PASS',
    millSheetNo: 'MS-POSCO-2603-9942',
    heatNo: 'HT-630-8841A',
    notes: '세메스 1580mm 슬롯다이 바디 가공용 원소재. 진공 탈가스 정련 및 H1025 열처리 사양 완벽 충족.',
    rawDimensions: {
      length: { spec: '1650 ± 5 mm', actual: '1652.4 mm', result: 'OK' },
      width: { spec: '180 ± 2 mm', actual: '180.8 mm', result: 'OK' },
      thickness: { spec: '80 ± 2 mm', actual: '81.1 mm', result: 'OK' },
      straightness: { spec: '≤ 0.3 mm / m', actual: '0.08 mm / m', result: 'OK' }
    },
    chemicalComposition: [
      { element: 'C (탄소)', specMin: 0.0, specMax: 0.07, actual: 0.042, unit: '%', result: 'OK' },
      { element: 'Si (규소)', specMin: 0.0, specMax: 1.0, actual: 0.48, unit: '%', result: 'OK' },
      { element: 'Mn (망간)', specMin: 0.0, specMax: 1.0, actual: 0.62, unit: '%', result: 'OK' },
      { element: 'P (인)', specMin: 0.0, specMax: 0.04, actual: 0.018, unit: '%', result: 'OK' },
      { element: 'S (황)', specMin: 0.0, specMax: 0.03, actual: 0.004, unit: '%', result: 'OK' },
      { element: 'Cr (크롬)', specMin: 15.0, specMax: 17.5, actual: 16.42, unit: '%', result: 'OK' },
      { element: 'Ni (니켈)', specMin: 3.0, specMax: 5.0, actual: 4.18, unit: '%', result: 'OK' },
      { element: 'Cu (구리)', specMin: 3.0, specMax: 5.0, actual: 3.65, unit: '%', result: 'OK' },
      { element: 'Nb+Ta (나이오븀)', specMin: 0.15, specMax: 0.45, actual: 0.31, unit: '%', result: 'OK' }
    ],
    mechanicalProperties: {
      hardness: { spec: 'HRC 38.0 ~ 42.0', actual: 'HRC 40.2', result: 'OK' },
      tensileStrength: { spec: '≥ 1070 MPa', actual: '1145 MPa', result: 'OK' },
      yieldStrength: { spec: '≥ 1000 MPa', actual: '1062 MPa', result: 'OK' },
      elongation: { spec: '≥ 12 %', actual: '15.4 %', result: 'OK' }
    },
    utInspection: {
      method: '수직 탐상 (Direct Pulse-Echo UT)',
      frequency: '5.0 MHz (Ø10mm 탐촉자)',
      standard: 'KS B 0817 / ASTM A388 Level 1 (무결점 등급)',
      defectFound: false,
      defectDetails: '내부 기포(Blowhole), 비금속 개재물, 미세 크랙 검출 0건 (100% PASS)',
      result: 'PASS'
    },
    surfaceInspection: {
      visualDefect: '표면 흑피 제거 상태 양호, 밴드쏘 절단면 스케일 없음, 스크래치 무',
      roughnessRa: 'Ra 1.8 ㎛ (밀링 전 기본 가공면 합격)',
      result: 'PASS'
    }
  },
  {
    id: 'IQC-2026-0302',
    lotNo: 'LOT-260412-SUS420',
    materialType: 'SUS420J2 (고경도 마르텐사이트계 스테인리스)',
    standard: 'JIS G4303 / KS D 3705',
    supplier: '현대제철 특수강본부',
    incomingDate: '2026-03-02 14:15',
    inspector: '김검사 수석 (QA-01)',
    inspectionResult: 'PASS',
    millSheetNo: 'MS-HD-2602-4412',
    heatNo: 'HT-420-7719B',
    notes: 'LG에너지솔루션 1400mm 전극 슬롯다이 립(Lip) 바디 소재. 진공 소성 및 심냉처리 완료 블록.',
    rawDimensions: {
      length: { spec: '1450 ± 5 mm', actual: '1451.8 mm', result: 'OK' },
      width: { spec: '200 ± 2 mm', actual: '201.2 mm', result: 'OK' },
      thickness: { spec: '90 ± 2 mm', actual: '90.7 mm', result: 'OK' },
      straightness: { spec: '≤ 0.3 mm / m', actual: '0.12 mm / m', result: 'OK' }
    },
    chemicalComposition: [
      { element: 'C (탄소)', specMin: 0.26, specMax: 0.4, actual: 0.33, unit: '%', result: 'OK' },
      { element: 'Si (규소)', specMin: 0.0, specMax: 1.0, actual: 0.52, unit: '%', result: 'OK' },
      { element: 'Mn (망간)', specMin: 0.0, specMax: 1.0, actual: 0.58, unit: '%', result: 'OK' },
      { element: 'P (인)', specMin: 0.0, specMax: 0.04, actual: 0.021, unit: '%', result: 'OK' },
      { element: 'S (황)', specMin: 0.0, specMax: 0.03, actual: 0.005, unit: '%', result: 'OK' },
      { element: 'Cr (크롬)', specMin: 12.0, specMax: 14.0, actual: 13.35, unit: '%', result: 'OK' },
      { element: 'Ni (니켈)', specMin: 0.0, specMax: 0.6, actual: 0.22, unit: '%', result: 'OK' }
    ],
    mechanicalProperties: {
      hardness: { spec: 'HRC 52.0 ~ 56.0', actual: 'HRC 54.8', result: 'OK' },
      tensileStrength: { spec: '≥ 1500 MPa', actual: '1580 MPa', result: 'OK' },
      yieldStrength: { spec: '≥ 1300 MPa', actual: '1370 MPa', result: 'OK' },
      elongation: { spec: '≥ 8 %', actual: '10.2 %', result: 'OK' }
    },
    utInspection: {
      method: '초음파 침투 탐상 (Immersion UT)',
      frequency: '5.0 MHz',
      standard: 'MIL-STD-2154 Class AA',
      defectFound: false,
      defectDetails: '초음파 결함 에코 0dB, 내부 기공 및 편석 결함 무',
      result: 'PASS'
    },
    surfaceInspection: {
      visualDefect: '진공 소성 표면 균일 산화막 형성, 크랙 및 핀홀 무',
      roughnessRa: 'Ra 1.4 ㎛',
      result: 'PASS'
    }
  },
  {
    id: 'IQC-2026-0303',
    lotNo: 'LOT-260501-DLC',
    materialType: 'DLC (Diamond-Like Carbon) 초정밀 박막 코팅 외주품',
    standard: 'KOS-COAT-09 (내마모/저마찰 슬롯다이 표면처리 규격)',
    supplier: '(주)나노코팅 테크놀로지 (외주 전문업체)',
    incomingDate: '2026-03-01 16:40',
    inspector: '이품질 주임 (QA-03)',
    inspectionResult: 'PASS',
    millSheetNo: 'COA-NANO-2026-081',
    heatNo: 'COAT-BATCH-0941',
    notes: '2차전지 양극 슬러리 내식/내마모용 다이아몬드상 카본(DLC) 2.5㎛ 초정밀 증착 외주품.',
    rawDimensions: {
      length: { spec: '1580.00 ± 0.02 mm', actual: '1580.008 mm', result: 'OK' },
      width: { spec: '160.00 ± 0.02 mm', actual: '160.004 mm', result: 'OK' },
      thickness: { spec: '60.00 ± 0.02 mm', actual: '60.002 mm', result: 'OK' },
      straightness: { spec: '≤ 0.005 mm', actual: '0.0018 mm', result: 'OK' }
    },
    chemicalComposition: [
      { element: 'sp3 탄소 결합비율', specMin: 70.0, specMax: 90.0, actual: 78.5, unit: '%', result: 'OK' },
      { element: '수소(H) 함량', specMin: 0.0, specMax: 5.0, actual: 1.8, unit: '%', result: 'OK' },
      { element: '도핑(Si/Cr)', specMin: 1.0, specMax: 3.0, actual: 2.1, unit: '%', result: 'OK' }
    ],
    mechanicalProperties: {
      hardness: { spec: '≥ 2500 Hv (비커스 경도)', actual: '2840 Hv', result: 'OK' },
      tensileStrength: { spec: '마찰계수 ≤ 0.08', actual: 'µ = 0.052', result: 'OK' },
      yieldStrength: { spec: '내열온도 ≥ 400℃', actual: '450℃ 보증', result: 'OK' },
      elongation: { spec: '균일도 ≥ 98%', actual: '99.1 %', result: 'OK' }
    },
    utInspection: {
      method: '와전류 & XRF 박막 두께 측정 (X-Ray Fluorescence)',
      frequency: 'XRF 50kV 1mA',
      standard: 'ISO 2178 / ASTM B499',
      defectFound: false,
      defectDetails: '박막 핀홀 및 박리 현상 0건, 두께 편차 0.07㎛ 이내',
      result: 'PASS'
    },
    surfaceInspection: {
      visualDefect: '블랙 미러 피니시 (초경면), 입자 뭉침 없음',
      roughnessRa: 'Ra 0.012 ㎛ (초경면 합격)',
      coatingThickness: '2.48 ㎛ (규격: 2.5 ± 0.3 ㎛)',
      coatingAdhesion: 'Cross-cut 5B (100/100 무박리 합격)',
      result: 'PASS'
    }
  }
];

interface IqcDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLotId?: string;
}

export const IqcDetailModal: React.FC<IqcDetailModalProps> = ({
  isOpen,
  onClose,
  initialLotId
}) => {
  const [selectedLotId, setSelectedLotId] = useState<string>(
    initialLotId || DEFAULT_IQC_LOTS[0].id
  );
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (!isOpen) return null;

  const currentLot =
    DEFAULT_IQC_LOTS.find((l) => l.id === selectedLotId) || DEFAULT_IQC_LOTS[0];

  const filteredLots = DEFAULT_IQC_LOTS.filter((l) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.lotNo.toLowerCase().includes(term) ||
      l.materialType.toLowerCase().includes(term) ||
      l.supplier.toLowerCase().includes(term) ||
      l.heatNo.toLowerCase().includes(term)
    );
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  수입검사대장 (IQC - Incoming Quality Control Log)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  모재 & 외주품 전수 검증
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                밀시트(Mill Sheet) 성분표, 초음파 탐상(UT), 경도/인장 및 표면 조도 정밀 검사서
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>성적서 인쇄</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left LOT Selector + Right Detailed Inspection View */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left LOT list (4 cols) */}
          <div className="lg:col-span-4 border-r border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col gap-3 overflow-y-auto">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="LOT 번호, 재질, 공급사 검색..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
              입고 LOT 목록 ({filteredLots.length}건)
            </div>

            <div className="space-y-2">
              {filteredLots.map((lot) => {
                const isSelected = lot.id === currentLot.id;
                return (
                  <div
                    key={lot.id}
                    onClick={() => setSelectedLotId(lot.id)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                        : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400 font-mono">
                        {lot.lotNo}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        {lot.inspectionResult}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {lot.materialType}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
                      <span>{lot.supplier}</span>
                      <span>{lot.incomingDate.split(' ')[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Detail Pane (8 cols) */}
          <div className="lg:col-span-8 p-5 overflow-y-auto space-y-5 bg-white dark:bg-slate-900">
            {/* LOT Header Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-100 dark:via-slate-800/40 to-blue-500/10 border border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-md bg-amber-500/15 font-mono">
                    {currentLot.lotNo}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Heat No: {currentLot.heatNo}</span>
                  <span className="text-xs text-slate-500 font-mono">Mill Sheet: {currentLot.millSheetNo}</span>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                  {currentLot.materialType}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  규격: {currentLot.standard} | 공급처: <strong>{currentLot.supplier}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[11px] text-slate-500">검사일시 / 검사원</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {currentLot.incomingDate} ({currentLot.inspector})
                  </div>
                </div>
                <div className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>수입검사 합격 (PASS)</span>
                </div>
              </div>
            </div>

            {/* 1. 화학 성분 분석표 (Chemical Composition) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Microscope className="w-4 h-4 text-amber-600" />
                  <span>1. 밀시트 화학 성분 분석 (Chemical Composition, wt%)</span>
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">분광분석(OES) 공인 시험치</span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-black text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="px-3 py-2">원소 (Element)</th>
                      <th className="px-3 py-2 text-center">규격 기준 (Spec Range)</th>
                      <th className="px-3 py-2 text-center">밀시트 실측치 (Actual)</th>
                      <th className="px-3 py-2 text-center">단위</th>
                      <th className="px-3 py-2 text-center">판정</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {currentLot.chemicalComposition.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-1.5 font-bold text-slate-800 dark:text-slate-200">
                          {item.element}
                        </td>
                        <td className="px-3 py-1.5 text-center text-slate-600 dark:text-slate-400">
                          {item.specMin > 0 ? `${item.specMin} ~ ` : '≤ '}{item.specMax}
                        </td>
                        <td className="px-3 py-1.5 text-center font-bold text-blue-600 dark:text-blue-400">
                          {item.actual}
                        </td>
                        <td className="px-3 py-1.5 text-center text-slate-500">{item.unit}</td>
                        <td className="px-3 py-1.5 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            {item.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. 기계적 성질 및 치수 검증 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 기계적 특성 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>2. 기계적 특성 & 경도 (Mechanical Specs)</span>
                </h4>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">로크웰 경도 (Hardness):</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {currentLot.mechanicalProperties.hardness.actual}
                      <span className="text-[10px] text-slate-400 ml-1">
                        (규격: {currentLot.mechanicalProperties.hardness.spec})
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">인장강도 (Tensile):</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {currentLot.mechanicalProperties.tensileStrength.actual}
                      <span className="text-[10px] text-slate-400 ml-1">
                        (규격: {currentLot.mechanicalProperties.tensileStrength.spec})
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">항복강도 (Yield):</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {currentLot.mechanicalProperties.yieldStrength.actual}
                      <span className="text-[10px] text-slate-400 ml-1">
                        (규격: {currentLot.mechanicalProperties.yieldStrength.spec})
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">연신율 (Elongation):</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {currentLot.mechanicalProperties.elongation.actual}
                      <span className="text-[10px] text-slate-400 ml-1">
                        (규격: {currentLot.mechanicalProperties.elongation.spec})
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 입고 치수 검증 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                  <span>3. 입고 모재 형상 및 치수 검증</span>
                </h4>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">길이 (Length):</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {currentLot.rawDimensions.length.actual}
                      <span className="text-[10px] text-slate-400 ml-1">
                        (규격: {currentLot.rawDimensions.length.spec})
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">폭 (Width):</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {currentLot.rawDimensions.width.actual}
                      <span className="text-[10px] text-slate-400 ml-1">
                        (규격: {currentLot.rawDimensions.width.spec})
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">두께 (Thickness):</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {currentLot.rawDimensions.thickness.actual}
                      <span className="text-[10px] text-slate-400 ml-1">
                        (규격: {currentLot.rawDimensions.thickness.spec})
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">진직도 (Straightness):</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {currentLot.rawDimensions.straightness.actual}
                      <span className="text-[10px] text-slate-400 ml-1">
                        (규격: {currentLot.rawDimensions.straightness.spec})
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. 초음파 비파괴 검사(UT) & 외관 표면 검사 */}
            <div className="p-4 rounded-2xl bg-slate-950 text-white space-y-3 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-xs font-black text-white">
                    4. 초음파 비파괴 검사(UT) & 표면 무결함 판정서
                  </h4>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  UT 결함 ZERO (100% PASS)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="text-slate-400">탐상 방식 / 주파수</div>
                  <div className="text-white font-bold">{currentLot.utInspection.method} ({currentLot.utInspection.frequency})</div>
                  <div className="text-slate-400 pt-1">적용 규격</div>
                  <div className="text-cyan-300">{currentLot.utInspection.standard}</div>
                  <div className="text-slate-400 pt-1">결함 판정</div>
                  <div className="text-emerald-400 font-bold">{currentLot.utInspection.defectDetails}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="text-slate-400">외관 및 표면 결함</div>
                  <div className="text-white font-bold">{currentLot.surfaceInspection.visualDefect}</div>
                  <div className="text-slate-400 pt-1">입고 표면 조도</div>
                  <div className="text-cyan-300 font-bold">{currentLot.surfaceInspection.roughnessRa}</div>
                  {currentLot.surfaceInspection.coatingThickness && (
                    <>
                      <div className="text-slate-400 pt-1">코팅 두께 & 밀착력</div>
                      <div className="text-emerald-400 font-bold">
                        {currentLot.surfaceInspection.coatingThickness} | {currentLot.surfaceInspection.coatingAdhesion}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 검사관 종합 의견 & 승인 서명 */}
            <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 dark:text-white">품질보증부 종합 의견:</div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">{currentLot.notes}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold">
                  검사자: {currentLot.inspector} [서명 날인 완료]
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
