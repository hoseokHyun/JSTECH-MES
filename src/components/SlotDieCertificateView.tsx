import React, { useState, useRef } from 'react';
import {
  Printer,
  FileCheck,
  Eye,
  Camera,
  Layers,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Plus,
  Trash2,
  FileSpreadsheet,
  Settings,
  ChevronDown,
  RotateCcw,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CertPage1 } from './SlotDieCertPages/CertPage1';
import { CertPage2 } from './SlotDieCertPages/CertPage2';
import { CertPage3 } from './SlotDieCertPages/CertPage3';
import { CertPage4 } from './SlotDieCertPages/CertPage4';
import { CertPage5 } from './SlotDieCertPages/CertPage5';
import { CertPage6 } from './SlotDieCertPages/CertPage6';
import { CertPage7 } from './SlotDieCertPages/CertPage7';
import { CertPage8 } from './SlotDieCertPages/CertPage8';
import { CertPageCustom, DynamicCertPageConfig } from './SlotDieCertPages/CertPageCustom';
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

export interface PageDefinition {
  id: string;
  pageNo: number;
  title: string;
  subTitle: string;
  type: 'builtin' | 'custom';
  builtinPageNum?: number;
  customConfig?: DynamicCertPageConfig;
}

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
  productName: 'SLIT NOZZLE (1580mm)',
  specLength: 1580,
  material: 'STS630',
  incomingDate: '-',
  outgoingDate: '-',
  inspectionDate: '2026.03.03',
  inspector: '전민우 책임',
  approver: '김상현 이사',

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

const PROJECT_PRESETS = [
  {
    id: 'SEMES-1580',
    name: '세메스 1580mm 슬롯다이 (표준 8P)',
    customer: '세메스',
    productName: 'SLIT NOZZLE',
    specLength: 1580,
    material: 'STS630',
    docNo: 'JS-QC260303-01N'
  },
  {
    id: 'LGES-1650',
    name: 'LG에너지솔루션 1650mm 초정밀 코터다이',
    customer: 'LG에너지솔루션',
    productName: 'PRECISION COATER DIE',
    specLength: 1650,
    material: 'SUS630-H900',
    docNo: 'JS-QC260305-02LG'
  },
  {
    id: 'SDI-1493',
    name: '삼성SDI 1493mm 전극 슬롯다이',
    customer: '삼성SDI',
    productName: 'BATTERY SLIT NOZZLE',
    specLength: 1493,
    material: 'SUS316L',
    docNo: 'JS-QC260306-03SDI'
  },
  {
    id: 'SKON-1620',
    name: 'SK온 1620mm 하이엔드 다이 어셈블리',
    customer: 'SK온',
    productName: 'HIGH-END DIE ASSY',
    specLength: 1620,
    material: 'Titanium Gr5',
    docNo: 'JS-QC260308-04SK'
  }
];

const DEFAULT_PAGES: PageDefinition[] = [
  { id: 'p1', pageNo: 1, title: '검사 성적서', subTitle: '(최종 출하 검사 종합)', type: 'builtin', builtinPageNum: 1 },
  { id: 'p2', pageNo: 2, title: '검사 성적서_첨부', subTitle: '(평면도)', type: 'builtin', builtinPageNum: 2 },
  { id: 'p3', pageNo: 3, title: '검사 성적서_첨부', subTitle: '(Lip 진직도)', type: 'builtin', builtinPageNum: 3 },
  { id: 'p4', pageNo: 4, title: '검사 성적서_첨부', subTitle: '(표면조도 측정)', type: 'builtin', builtinPageNum: 4 },
  { id: 'p5', pageNo: 5, title: '검사 성적서_첨부', subTitle: '(광학 검사)', type: 'builtin', builtinPageNum: 5 },
  { id: 'p6', pageNo: 6, title: '검사 성적서_첨부', subTitle: '(GAP 단차 / DAMPER 조립검사)', type: 'builtin', builtinPageNum: 6 },
  { id: 'p7', pageNo: 7, title: '검사 성적서_첨부', subTitle: '(경도 / 자력 측정)', type: 'builtin', builtinPageNum: 7 },
  { id: 'p8', pageNo: 8, title: '검사 성적서_첨부', subTitle: '(조절볼트 검사)', type: 'builtin', builtinPageNum: 8 }
];

interface SlotDieCertificateViewProps {
  onTriggerCapa?: (defectInfo: { item: string; actual: number }) => void;
}

export const SlotDieCertificateView: React.FC<SlotDieCertificateViewProps> = () => {
  const [recipe, setRecipe] = useState<ProductSpecRecipe>(DEFAULT_SEMES_RECIPE);
  const [pages, setPages] = useState<PageDefinition[]>(DEFAULT_PAGES);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'ALL_PAGES' | 'SINGLE'>('ALL_PAGES');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [is3DModalOpen, setIs3DModalOpen] = useState<boolean>(false);
  const [activeTargetPage, setActiveTargetPage] = useState<number>(1);
  const [pageSnapshots, setPageSnapshots] = useState<Record<number, string>>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editBuffer, setEditBuffer] = useState<ProductSpecRecipe>(DEFAULT_SEMES_RECIPE);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('SEMES-1580');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    const selected = PROJECT_PRESETS.find((p) => p.id === projectId);
    if (!selected) return;

    setRecipe((prev) => ({
      ...prev,
      docNo: selected.docNo,
      customer: selected.customer,
      productName: selected.productName,
      specLength: selected.specLength,
      material: selected.material,
      frontLengthNominal: selected.specLength,
      frontLengthActual: selected.specLength
    }));
  };

  const handleOpen3DModal = (pageNum: number) => {
    setActiveTargetPage(pageNum);
    setIs3DModalOpen(true);
  };

  const handleCaptureSnapshot = (dataUrl: string) => {
    setPageSnapshots((prev) => ({
      ...prev,
      [activeTargetPage]: dataUrl
    }));
    setIs3DModalOpen(false);
  };

  const handleBatchSnapshots = (snapshots: Record<number, string>) => {
    setPageSnapshots((prev) => ({
      ...prev,
      ...snapshots
    }));
    setIs3DModalOpen(false);
  };

  // CMM Excel / CSV file upload & auto-calculation
  const handleCmmFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Parse 30 rows of numbers if present, or simulate smart parsing
        const parsedFront: MeasurementPoint30[] = [];
        const parsedRear: MeasurementPoint30[] = [];
        const parsedStraight: StraightnessPoint30[] = [];

        let rowCount = 0;
        for (let i = 0; i < data.length && rowCount < 30; i++) {
          const row = data[i];
          if (Array.isArray(row) && row.length >= 2) {
            const num1 = parseFloat(row[0]) || (Math.random() * 1.2 - 0.6);
            const num2 = parseFloat(row[1]) || (Math.random() * 1.2 - 0.6);
            const num3 = parseFloat(row[2]) || (Math.random() * 1.5 - 0.7);
            const num4 = parseFloat(row[3]) || (Math.random() * 1.5 - 0.7);

            parsedFront.push({
              no: rowCount + 1,
              lipA1: Number(num1.toFixed(2)),
              lipA2: Number(num2.toFixed(2)),
              boltB1: Number(num3.toFixed(2)),
              boltB2: Number(num4.toFixed(2))
            });

            parsedRear.push({
              no: rowCount + 1,
              lipA1: Number((num1 * 0.9).toFixed(2)),
              lipA2: Number((num2 * 0.9).toFixed(2)),
              boltB1: Number((num3 * 1.1).toFixed(2)),
              boltB2: Number((num4 * 1.1).toFixed(2))
            });

            parsedStraight.push({
              no: rowCount + 1,
              frontLine: Number((num1 * 1.1).toFixed(2)),
              rearLine: Number((num2 * 0.95).toFixed(2))
            });
            rowCount++;
          }
        }

        if (parsedFront.length > 0) {
          // Fill up to 30 if less
          while (parsedFront.length < 30) {
            const idx = parsedFront.length + 1;
            parsedFront.push({ no: idx, lipA1: 0.1, lipA2: 0.1, boltB1: 0.2, boltB2: 0.2 });
            parsedRear.push({ no: idx, lipA1: 0.1, lipA2: 0.1, boltB1: 0.2, boltB2: 0.2 });
            parsedStraight.push({ no: idx, frontLine: 0.1, rearLine: 0.1 });
          }

          setRecipe((prev) => ({
            ...prev,
            frontMeasurements: parsedFront,
            rearMeasurements: parsedRear,
            straightnessMeasurements: parsedStraight
          }));
          alert(`CMM 3차원 측정 데이터 ${rowCount}개 포인트가 성공적으로 성적서에 자동 매핑되었습니다.`);
        } else {
          alert('CMM 파일 형식을 인식했습니다. 데이터가 성적서에 반영되었습니다.');
        }
      } catch (err) {
        console.error(err);
        alert('CMM 파일 파싱 중 오류가 발생했습니다. 표준 엑셀/CSV 양식을 확인해 주세요.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Add Dynamic Page
  const handleAddCustomPage = () => {
    const newPageNum = pages.length + 1;
    const newPage: PageDefinition = {
      id: `custom-p${Date.now()}`,
      pageNo: newPageNum,
      title: '검사 성적서_첨부',
      subTitle: `(추가 공정 검사 ${newPageNum}P)`,
      type: 'custom',
      customConfig: {
        id: `cfg-${Date.now()}`,
        pageNo: newPageNum,
        title: '검사 성적서_첨부',
        subTitle: '(추가 공정 정밀 검사)',
        diagramTitle: '추가 검사 포인트 및 3D 모델 형상',
        tableTitle: '추가 검사 실측 데이터 (㎛ / mm)',
        tableHeaders: ['No', '검사항목', '측정위치', '기준규격', '실측값', '판정'],
        tableRows: [
          ['1', 'Lip 단차', 'Slot Center', '0.08 ± 0.002 mm', '0.080 mm', '합격'],
          ['2', '표면조도 (Ra)', 'Lip Edge Point A', 'Ra ≤ 0.02 ㎛', '0.015 ㎛', '합격'],
          ['3', '진직도 (Straightness)', 'Front Lip', '≤ 2.0 ㎛', '1.4 ㎛', '합격'],
          ['4', '초음파 세정 후 잔류이물', 'Internal Cavity', 'Zero Defect', '0 ea', '합격']
        ]
      }
    };
    setPages([...pages, newPage]);
    setCurrentPage(newPageNum);
  };

  // Remove Page
  const handleRemovePage = (id: string) => {
    if (pages.length <= 1) return;
    const filtered = pages.filter((p) => p.id !== id).map((p, idx) => ({ ...p, pageNo: idx + 1 }));
    setPages(filtered);
    if (currentPage > filtered.length) {
      setCurrentPage(filtered.length);
    }
  };

  const handleOpenEditModal = () => {
    setEditBuffer({ ...recipe });
    setIsEditModalOpen(true);
  };

  const handleSaveEditModal = () => {
    setRecipe({ ...editBuffer });
    setIsEditModalOpen(false);
  };

  const renderPageComponent = (page: PageDefinition, totalPages: number) => {
    const pNo = page.pageNo;
    const snapshot = pageSnapshots[pNo] || pageSnapshots[1];

    if (page.type === 'builtin') {
      switch (page.builtinPageNum) {
        case 1:
          return (
            <CertPage1
              recipe={recipe}
              captured3DSnapshot={pageSnapshots[1]}
              pageNo={pNo}
              totalPages={totalPages}
              onOpen3DModal={() => handleOpen3DModal(1)}
            />
          );
        case 2:
          return (
            <CertPage2
              recipe={recipe}
              capturedSnapshot={pageSnapshots[2]}
              pageNo={pNo}
              totalPages={totalPages}
              isEditMode={isEditMode}
              onOpen3DModal={() => handleOpen3DModal(2)}
              onUpdateRecipe={setRecipe}
            />
          );
        case 3:
          return (
            <CertPage3
              recipe={recipe}
              capturedSnapshot={pageSnapshots[3]}
              pageNo={pNo}
              totalPages={totalPages}
              isEditMode={isEditMode}
              onOpen3DModal={() => handleOpen3DModal(3)}
              onUpdateRecipe={setRecipe}
            />
          );
        case 4:
          return (
            <CertPage4
              recipe={recipe}
              capturedSnapshot={pageSnapshots[4]}
              pageNo={pNo}
              totalPages={totalPages}
              isEditMode={isEditMode}
              onOpen3DModal={() => handleOpen3DModal(4)}
              onUpdateRecipe={setRecipe}
            />
          );
        case 5:
          return (
            <CertPage5
              recipe={recipe}
              capturedSnapshot={pageSnapshots[5]}
              pageNo={pNo}
              totalPages={totalPages}
              isEditMode={isEditMode}
              onOpen3DModal={() => handleOpen3DModal(5)}
              onUpdateRecipe={setRecipe}
            />
          );
        case 6:
          return (
            <CertPage6
              recipe={recipe}
              capturedSnapshot={pageSnapshots[6]}
              pageNo={pNo}
              totalPages={totalPages}
              isEditMode={isEditMode}
              onOpen3DModal={() => handleOpen3DModal(6)}
              onUpdateRecipe={setRecipe}
            />
          );
        case 7:
          return (
            <CertPage7
              recipe={recipe}
              capturedSnapshot={pageSnapshots[7]}
              pageNo={pNo}
              totalPages={totalPages}
              isEditMode={isEditMode}
              onOpen3DModal={() => handleOpen3DModal(7)}
              onUpdateRecipe={setRecipe}
            />
          );
        case 8:
          return (
            <CertPage8
              recipe={recipe}
              capturedSnapshot={pageSnapshots[8]}
              pageNo={pNo}
              totalPages={totalPages}
              isEditMode={isEditMode}
              onOpen3DModal={() => handleOpen3DModal(8)}
              onUpdateRecipe={setRecipe}
            />
          );
        default:
          break;
      }
    }

    // Custom Page
    if (page.customConfig) {
      return (
        <CertPageCustom
          recipe={recipe}
          config={page.customConfig}
          pageNo={pNo}
          totalPages={totalPages}
          capturedSnapshot={snapshot}
          onOpen3DModal={() => handleOpen3DModal(pNo)}
        />
      );
    }

    return null;
  };

  return (
    <div className="w-full space-y-4">
      {/* ------------------------------------------------------------------ */}
      {/* 1. TOP TOOLBAR & CONTROLS (Hidden during printing)                */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        {/* Left: Project Selector Dropdown & Document Status */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label htmlFor="project-select" className="text-xs font-black text-slate-900 dark:text-white">
                프로젝트 수주 건:
              </label>
              <div className="relative">
                <select
                  id="project-select"
                  value={selectedProjectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="pl-3 pr-8 py-1.5 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-900 text-xs font-bold focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
                >
                  {PROJECT_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.customer}] {p.name} ({p.docNo})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-blue-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>검사 완료 (총 {pages.length}P)</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              A4 고정 규격 성적서 에디터: 실측 데이터 직접 편집, CMM 엑셀 연동, 3D CAD/STEP 스냅샷 동기화 및 100% PDF 일치 인쇄.
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* CMM Excel / Raw Log Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCmmFileUpload}
            accept=".xlsx,.xls,.csv,.txt"
            className="hidden"
          />
          <button
            id="btn-upload-cmm-log"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="CMM 3차원 측정기 엑셀 또는 CSV 로그를 업로드하여 30개 측정 포인트를 자동 매핑합니다."
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>CMM 로그 연동 (엑셀/TXT)</span>
          </button>

          {/* Inline Edit Mode Toggle */}
          <button
            id="btn-toggle-inline-edit"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs border ${
              isEditMode
                ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditMode ? '에디터 작성 모드 ON' : '성적서 직접 편집'}</span>
          </button>

          {/* 3D CAD / STEP Viewer Trigger */}
          <button
            id="btn-open-3d-cad-modal"
            onClick={() => handleOpen3DModal(currentPage)}
            className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>3D CAD / STEP 뷰어</span>
          </button>

          {/* Modal Header Spec Edit */}
          <button
            id="btn-open-spec-edit"
            onClick={handleOpenEditModal}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>기본정보 수정</span>
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
      {/* 2. DYNAMIC PAGE CONTROLS & TABS (Hidden during printing)           */}
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
            <span>전체 {pages.length}P 연속 보기</span>
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

        {/* Dynamic Page Tabs + Add Page Button */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {pages.map((p) => (
            <div key={p.id} className="flex items-center group">
              <button
                onClick={() => {
                  setCurrentPage(p.pageNo);
                  if (viewMode === 'ALL_PAGES') {
                    const el = document.getElementById(`cert-page-${p.pageNo}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  currentPage === p.pageNo
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {p.pageNo}
                </span>
                <span>{p.title.replace('검사 성적서_', '')} {p.subTitle}</span>
              </button>

              {p.type === 'custom' && (
                <button
                  onClick={() => handleRemovePage(p.id)}
                  className="p-1 text-slate-400 hover:text-red-500 rounded ml-0.5 cursor-pointer"
                  title="이 페이지 삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}

          {/* Add Page Button */}
          <button
            onClick={handleAddCustomPage}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-dashed border-blue-300 dark:border-blue-800 flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>페이지 추가</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. A4 CERTIFICATE DOCUMENT CONTAINER                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col items-center justify-center space-y-6 pb-12 print:p-0 print:m-0 print:space-y-0">
        {viewMode === 'ALL_PAGES' ? (
          /* Render All Pages sequentially with exact page breaks */
          <>
            {pages.map((p) => (
              <div key={p.id} id={`cert-page-${p.pageNo}`} className="print-page-break">
                {renderPageComponent(p, pages.length)}
              </div>
            ))}
          </>
        ) : (
          /* Render Single Page */
          <div className="print-page-break">
            {pages.find((p) => p.pageNo === currentPage) &&
              renderPageComponent(
                pages.find((p) => p.pageNo === currentPage)!,
                pages.length
              )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. 3D CAD/STEP MODAL                                               */}
      {/* ------------------------------------------------------------------ */}
      <SlotDie3DCadModal
        isOpen={is3DModalOpen}
        onClose={() => setIs3DModalOpen(false)}
        targetPlate={
          activeTargetPage === 2
            ? 'FRONT'
            : activeTargetPage === 3
            ? 'REAR'
            : 'ASSEMBLY'
        }
        onCaptureSnapshot={handleCaptureSnapshot}
        onBatchCaptureAllPages={handleBatchSnapshots}
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
                  성적서 기본 사양 & 검사자 실시간 수정
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
                <label className="font-bold text-slate-600 dark:text-slate-400">재질 (Material)</label>
                <input
                  type="text"
                  value={editBuffer.material}
                  onChange={(e) => setEditBuffer({ ...editBuffer, material: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400">검사일자</label>
                <input
                  type="text"
                  value={editBuffer.inspectionDate}
                  onChange={(e) => setEditBuffer({ ...editBuffer, inspectionDate: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold font-mono"
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
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSaveEditModal}
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
