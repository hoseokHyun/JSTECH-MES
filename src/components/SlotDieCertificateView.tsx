import React, { useState, useRef } from 'react';
import {
  Printer,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Camera,
  Layers,
  Edit3,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Download,
  Sparkles,
  Search,
  Check,
  X,
  Plus
} from 'lucide-react';
import { CertPage1 } from './SlotDieCertPages/CertPage1';
import { CertPage2 } from './SlotDieCertPages/CertPage2';
import { CertPage3 } from './SlotDieCertPages/CertPage3';
import { CertPage4 } from './SlotDieCertPages/CertPage4';
import { CertPage5 } from './SlotDieCertPages/CertPage5';
import { CertPage6 } from './SlotDieCertPages/CertPage6';
import { CertPage7 } from './SlotDieCertPages/CertPage7';
import { CertPage8 } from './SlotDieCertPages/CertPage8';
import { SlotDie3DCadModal } from './SlotDie3DCadModal';

export interface MeasurementPoint30 {
  no: number;
  lipA1: number;
  lipA2: number;
  boltB1: number;
  boltB2: number;
}

export interface StraightnessPoint30 {
  no: number;
  frontLine: number;
  rearLine: number;
}

export interface ProductSpecRecipe {
  docNo: string;
  customer: string;
  productName: string;
  specLength: number;
  material: string;
  incomingDate: string;
  outgoingDate: string;
  inspectionDate: string;
  inspector: string;
  approver: string;
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

  frontMeasurements: MeasurementPoint30[];
  rearMeasurements: MeasurementPoint30[];
  straightnessMeasurements: StraightnessPoint30[];
}

// Generate Realistic CMM 30-Point Data matching the exact numbers in the image
const generateDefaultFrontCMM = (): MeasurementPoint30[] => {
  const baseA1 = [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0, -0.1, -0.2, -0.3, -0.4, -0.5, -0.6, -0.5, -0.4, -0.3, -0.2, -0.1, 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.7];
  const baseA2 = [0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0, -0.1, -0.2, -0.3, -0.4, -0.5, -0.6, -0.5, -0.4, -0.3, -0.2, -0.1, 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.6, 0.7, 0.6];
  const baseB1 = [0.9, 0.8, 0.7, 0.6, 0.4, 0.2, 0.0, -0.2, -0.4, -0.5, -0.7, -0.6, -0.4, -0.2, 0.0, 0.2, 0.4, 0.6, 0.7, 0.8, 0.9, 0.8, 0.7, 0.5, 0.3, 0.1, 0.0, -0.1, 0.2, 0.5];
  const baseB2 = [0.8, 0.7, 0.6, 0.5, 0.3, 0.1, -0.1, -0.3, -0.5, -0.6, -0.7, -0.5, -0.3, -0.1, 0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 0.8, 0.7, 0.6, 0.4, 0.2, 0.0, -0.1, -0.2, 0.1, 0.4];

  return Array.from({ length: 30 }, (_, i) => ({
    no: i + 1,
    lipA1: baseA1[i] ?? 0.0,
    lipA2: baseA2[i] ?? 0.0,
    boltB1: baseB1[i] ?? 0.0,
    boltB2: baseB2[i] ?? 0.0
  }));
};

const generateDefaultRearCMM = (): MeasurementPoint30[] => {
  const baseA1 = [0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0, -0.1, -0.2, -0.3, -0.4, -0.5, -0.6, -0.5, -0.4, -0.3, -0.2, -0.1, 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.6, 0.5, 0.4];
  const baseA2 = [0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0, -0.1, -0.2, -0.3, -0.4, -0.5, -0.6, -0.4, -0.3, -0.2, -0.1, 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.5, 0.4, 0.3, 0.4, 0.5, 0.6];
  const baseB1 = [1.7, 1.5, 1.3, 1.0, 0.7, 0.4, 0.1, -0.2, -0.5, -0.7, -0.9, -0.8, -0.6, -0.3, 0.0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.7, 1.6, 1.4, 1.1, 0.8, 0.5, 0.2, 0.0, 0.4, 0.9];
  const baseB2 = [1.6, 1.4, 1.2, 0.9, 0.6, 0.3, 0.0, -0.3, -0.6, -0.8, -0.9, -0.7, -0.5, -0.2, 0.1, 0.4, 0.7, 1.0, 1.3, 1.6, 1.5, 1.4, 1.2, 0.9, 0.6, 0.3, 0.1, -0.1, 0.3, 0.8];

  return Array.from({ length: 30 }, (_, i) => ({
    no: i + 1,
    lipA1: baseA1[i] ?? 0.0,
    lipA2: baseA2[i] ?? 0.0,
    boltB1: baseB1[i] ?? 0.0,
    boltB2: baseB2[i] ?? 0.0
  }));
};

const generateDefaultStraightness = (): StraightnessPoint30[] => {
  const front = [1.0, 0.9, 0.8, 0.6, 0.4, 0.2, 0.0, -0.2, -0.4, -0.6, -0.7, -0.5, -0.3, -0.1, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0, 0.8, 0.6, 0.4, 0.2, 0.0, -0.2, -0.4, -0.5, -0.2, 0.3];
  const rear = [0.9, 0.8, 0.7, 0.5, 0.3, 0.1, -0.1, -0.3, -0.5, -0.6, -0.5, -0.3, -0.1, 0.1, 0.3, 0.5, 0.7, 0.9, 0.8, 0.7, 0.5, 0.3, 0.1, -0.1, -0.3, -0.4, -0.2, 0.1, 0.4, 0.7];

  return Array.from({ length: 30 }, (_, i) => ({
    no: i + 1,
    frontLine: front[i] ?? 0.0,
    rearLine: rear[i] ?? 0.0
  }));
};

const DEFAULT_SEMES_RECIPE: ProductSpecRecipe = {
  docNo: 'JS-QC260303-01N',
  customer: '세메스',
  productName: 'SLIT NOZZLE',
  specLength: 1580,
  material: 'STS630',
  incomingDate: '-',
  outgoingDate: '-',
  inspectionDate: '2026.03.03',
  inspector: 'MW.Jeon',
  approver: 'SH.Kim',

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

  frontMeasurements: generateDefaultFrontCMM(),
  rearMeasurements: generateDefaultRearCMM(),
  straightnessMeasurements: generateDefaultStraightness()
};

interface SlotDieCertificateViewProps {
  onTriggerCapa?: (defectInfo: { item: string; actual: number }) => void;
}

export const SlotDieCertificateView: React.FC<SlotDieCertificateViewProps> = ({
  onTriggerCapa
}) => {
  const [recipe, setRecipe] = useState<ProductSpecRecipe>(DEFAULT_SEMES_RECIPE);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'SINGLE' | 'ALL_PAGES'>('ALL_PAGES');
  const [is3DModalOpen, setIs3DModalOpen] = useState<boolean>(false);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | undefined>(undefined);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editBuffer, setEditBuffer] = useState<ProductSpecRecipe>(DEFAULT_SEMES_RECIPE);

  const pageNames = [
    { num: 1, name: '메인 성적서', sub: '종합 요약 및 6대 SPC 차트' },
    { num: 2, name: '첨부 1. 평면도', sub: '30포인트 CMM 데이터' },
    { num: 3, name: '첨부 2. Lip 진직도', sub: '30포인트 CMM 데이터' },
    { num: 4, name: '첨부 3. 표면조도', sub: '초정밀 경면 측정 (a/b)' },
    { num: 5, name: '첨부 4. 광학 검사', sub: '12-포인트 현미경 단면' },
    { num: 6, name: '첨부 5. GAP/DAMPER', sub: '단차 및 조립 검사' },
    { num: 7, name: '첨부 6. 경도/자력', sub: 'HRC 및 잔류 자력 측정' },
    { num: 8, name: '첨부 7. 조절볼트', sub: '43개 디퍼런셜 볼트 검사' }
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleOpenEdit = () => {
    setEditBuffer({ ...recipe });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    setRecipe({ ...editBuffer });
    setIsEditModalOpen(false);
  };

  const handleApplyPreset = (preset: 'SEMES' | 'LG' | 'SDI') => {
    if (preset === 'SEMES') {
      setRecipe(DEFAULT_SEMES_RECIPE);
    } else if (preset === 'LG') {
      setRecipe({
        ...DEFAULT_SEMES_RECIPE,
        docNo: 'JS-QC260305-02LG',
        customer: 'LG에너지솔루션',
        productName: 'SLIT NOZZLE ASSEMBLY',
        specLength: 1650,
        frontLengthNominal: 1650,
        frontLengthActual: 1650.02
      });
    } else if (preset === 'SDI') {
      setRecipe({
        ...DEFAULT_SEMES_RECIPE,
        docNo: 'JS-QC260306-03SDI',
        customer: '삼성SDI',
        productName: 'PRECISION COATER DIE',
        specLength: 1493,
        frontLengthNominal: 1493,
        frontLengthActual: 1493.01
      });
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* ------------------------------------------------------------------ */}
      {/* 1. TOP TOOLBAR & CONTROLS (Hidden during printing)                */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        {/* Left: Certificate Metadata & Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                슬롯다이 검사 성적서 고정 규격 뷰어 (A4 인쇄 일치)
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200">
                문서번호: {recipe.docNo}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              웹 브라우저 인쇄(Ctrl+P) 시 원본 PDF와 100% 동일한 A4 고정 너비 및 폰트/표/도면 레이아웃으로 출력됩니다.
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Preset Buttons */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <span className="text-[10px] font-bold text-slate-400 px-1">프리셋:</span>
            <button
              onClick={() => handleApplyPreset('SEMES')}
              className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-2xs hover:bg-slate-50 cursor-pointer"
            >
              세메스 1580mm
            </button>
            <button
              onClick={() => handleApplyPreset('LG')}
              className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 cursor-pointer"
            >
              LG엔솔 1650mm
            </button>
            <button
              onClick={() => handleApplyPreset('SDI')}
              className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 cursor-pointer"
            >
              삼성SDI 1493mm
            </button>
          </div>

          {/* 3D CAD/STEP Viewer Trigger */}
          <button
            id="btn-open-3d-cad-modal"
            onClick={() => setIs3DModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>3D CAD 시점 조작</span>
          </button>

          {/* Edit Data Modal Trigger */}
          <button
            id="btn-open-cert-edit"
            onClick={handleOpenEdit}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Edit3 className="w-4 h-4 text-amber-600" />
            <span>성적서 데이터 편집</span>
          </button>

          {/* Print Button */}
          <button
            id="btn-print-official-certificate"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg"
          >
            <Printer className="w-4 h-4" />
            <span>성적서 인쇄 (Ctrl + P)</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. PAGE NAVIGATION TABS (Hidden during printing)                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setViewMode('ALL_PAGES')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'ALL_PAGES'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>전체 8페이지 연속 보기</span>
          </button>
          <button
            onClick={() => setViewMode('SINGLE')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'SINGLE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>단일 페이지 포커스</span>
          </button>
        </div>

        {/* 8-Page Selector Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          {pageNames.map((p) => (
            <button
              key={p.num}
              onClick={() => {
                setCurrentPage(p.num);
                if (viewMode === 'ALL_PAGES') {
                  const el = document.getElementById(`cert-page-${p.num}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                currentPage === p.num
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {p.num}
              </span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. A4 CERTIFICATE DOCUMENT CONTAINER                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col items-center justify-center space-y-6 pb-12 print:p-0 print:m-0 print:space-y-0">
        {viewMode === 'ALL_PAGES' ? (
          /* Render All 8 Pages sequentially with exact page breaks */
          <>
            <div id="cert-page-1" className="print-page-break">
              <CertPage1
                recipe={recipe}
                captured3DSnapshot={capturedSnapshot}
                onOpen3DModal={() => setIs3DModalOpen(true)}
              />
            </div>
            <div id="cert-page-2" className="print-page-break">
              <CertPage2 recipe={recipe} />
            </div>
            <div id="cert-page-3" className="print-page-break">
              <CertPage3 recipe={recipe} />
            </div>
            <div id="cert-page-4" className="print-page-break">
              <CertPage4 recipe={recipe} />
            </div>
            <div id="cert-page-5" className="print-page-break">
              <CertPage5 recipe={recipe} />
            </div>
            <div id="cert-page-6" className="print-page-break">
              <CertPage6 recipe={recipe} />
            </div>
            <div id="cert-page-7" className="print-page-break">
              <CertPage7 recipe={recipe} />
            </div>
            <div id="cert-page-8" className="print-page-break">
              <CertPage8 recipe={recipe} />
            </div>
          </>
        ) : (
          /* Render Single Page */
          <div className="print-page-break">
            {currentPage === 1 && (
              <CertPage1
                recipe={recipe}
                captured3DSnapshot={capturedSnapshot}
                onOpen3DModal={() => setIs3DModalOpen(true)}
              />
            )}
            {currentPage === 2 && <CertPage2 recipe={recipe} />}
            {currentPage === 3 && <CertPage3 recipe={recipe} />}
            {currentPage === 4 && <CertPage4 recipe={recipe} />}
            {currentPage === 5 && <CertPage5 recipe={recipe} />}
            {currentPage === 6 && <CertPage6 recipe={recipe} />}
            {currentPage === 7 && <CertPage7 recipe={recipe} />}
            {currentPage === 8 && <CertPage8 recipe={recipe} />}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. 3D CAD/STEP MODAL                                               */}
      {/* ------------------------------------------------------------------ */}
      <SlotDie3DCadModal
        isOpen={is3DModalOpen}
        onClose={() => setIs3DModalOpen(false)}
        targetPlate="ASSEMBLY"
        onCaptureSnapshot={(dataUrl) => {
          setCapturedSnapshot(dataUrl);
          setIs3DModalOpen(false);
        }}
      />

      {/* ------------------------------------------------------------------ */}
      {/* 5. DATA EDIT MODAL                                                 */}
      {/* ------------------------------------------------------------------ */}
      {isEditModalOpen && (
        <div
          id="cert-edit-modal"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 print:hidden"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  성적서 기본 사양 & 측정 데이터 실시간 수정
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400">문서 번호</label>
                <input
                  type="text"
                  value={editBuffer.docNo}
                  onChange={(e) => setEditBuffer({ ...editBuffer, docNo: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400">고객사</label>
                <input
                  type="text"
                  value={editBuffer.customer}
                  onChange={(e) => setEditBuffer({ ...editBuffer, customer: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400">품목명</label>
                <input
                  type="text"
                  value={editBuffer.productName}
                  onChange={(e) => setEditBuffer({ ...editBuffer, productName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400">규격 길이 (mm)</label>
                <input
                  type="number"
                  value={editBuffer.specLength}
                  onChange={(e) => setEditBuffer({ ...editBuffer, specLength: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400">검사자</label>
                <input
                  type="text"
                  value={editBuffer.inspector}
                  onChange={(e) => setEditBuffer({ ...editBuffer, inspector: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400">승인자 (QA책임자)</label>
                <input
                  type="text"
                  value={editBuffer.approver}
                  onChange={(e) => setEditBuffer({ ...editBuffer, approver: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400">FRONT 실측 길이 (mm)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editBuffer.frontLengthActual}
                  onChange={(e) => setEditBuffer({ ...editBuffer, frontLengthActual: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400">REAR 실측 길이 (mm)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editBuffer.rearLengthActual}
                  onChange={(e) => setEditBuffer({ ...editBuffer, rearLengthActual: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>성적서 반영</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 6. GLOBAL CSS FOR EXACT PIXEL-PERFECT A4 PRINTING                  */}
      {/* ------------------------------------------------------------------ */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          nav, aside, header, .print\\:hidden, #slot-die-3d-cad-modal-backdrop, #cert-edit-modal {
            display: none !important;
          }
          .a4-page {
            width: 210mm !important;
            min-height: 297mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 auto !important;
            padding: 12mm 14mm !important;
            border: none !important;
            box-shadow: none !important;
            page-break-after: always !important;
            break-after: page !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }
          .print-page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `}</style>
    </div>
  );
};
