import React, { useState } from 'react';
import {
  X,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Layers,
  Search,
  ShieldCheck,
  Activity,
  Microscope,
  Plus,
  Trash2,
  Archive,
  ArchiveRestore,
  Edit3,
  Save,
  RotateCcw
} from 'lucide-react';

export interface IqcLotItem {
  id: string;
  lotNo: string;
  materialType: string;
  standard: string;
  supplier: string;
  incomingDate: string;
  inspector: string;
  approver?: string;
  inspectionResult: 'PASS' | 'CONDITIONAL' | 'FAIL';
  isArchived?: boolean;
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
    isArchived: false,
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
    isArchived: false,
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
    isArchived: false,
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
  lots?: IqcLotItem[];
  onUpdateLots?: (lots: IqcLotItem[]) => void;
  currentUser?: { name: string; role?: string } | null;
  inspectors?: string[];
  qaManagers?: string[];
}

export const IqcDetailModal: React.FC<IqcDetailModalProps> = ({
  isOpen,
  onClose,
  initialLotId,
  lots: propLots,
  onUpdateLots,
  currentUser,
  inspectors = [],
  qaManagers = []
}) => {
  const currentUserName = currentUser?.name?.trim() || '';
  const currentUserTitle = currentUser ? `${currentUser.name} (${currentUser.role === 'ADMIN' ? 'QA 총괄/관리자' : '품질 검사원'})` : '';

  const effectiveInspectors = React.useMemo(() => {
    const list = [
      '정품질 선임 (QA-04)',
      '이영희 선임 (QA-02)',
      '박진우 수석 (QA-01)',
      '김준성 책임연구원 (KOLAS 공인)',
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

  const effectiveQaManagers = React.useMemo(() => {
    const list = [
      '이준혁 품질보증총괄이사',
      '정승원 QA그룹장',
      '강태호 품질보증센터장',
      ...qaManagers
    ];
    if (currentUser?.role === 'ADMIN' && currentUserName) {
      const adminTitle = `${currentUserName} (QA 관리자)`;
      if (!list.includes(adminTitle)) {
        return [adminTitle, currentUserName, ...list.filter(item => item !== currentUserName && item !== adminTitle)];
      }
    } else if (currentUserName && !list.some(item => item.startsWith(currentUserName))) {
      return [currentUserName, ...list];
    }
    return Array.from(new Set(list.filter(Boolean)));
  }, [currentUser, currentUserName, qaManagers]);

  const [internalLots, setInternalLots] = useState<IqcLotItem[]>(DEFAULT_IQC_LOTS);
  const lots = propLots || internalLots;
  const updateLotsList = (newLots: IqcLotItem[]) => {
    if (onUpdateLots) {
      onUpdateLots(newLots);
    } else {
      setInternalLots(newLots);
    }
  };

  const [selectedLotId, setSelectedLotId] = useState<string>(
    initialLotId || (lots.length > 0 ? lots[0].id : '')
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewFilter, setViewFilter] = useState<'ACTIVE' | 'ARCHIVE'>('ACTIVE');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const currentLot = lots.find((l) => l.id === selectedLotId) || lots[0];
  const [editLot, setEditLot] = useState<IqcLotItem | null>(null);

  const [newLotForm, setNewLotForm] = useState({
    lotNo: `LOT-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-STS630`,
    materialType: 'STS630 (17-4PH 석출경화 스테인리스강)',
    standard: 'KS D 3706 / ASTM A564 Grade 630',
    supplier: '세아베스틸 (POSCO 특수강)',
    incomingDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
    inspector: currentUserTitle || currentUserName || '정품질 선임 (QA-04)',
    approver: (currentUser?.role === 'ADMIN' && currentUserName ? `${currentUserName} (QA 관리자)` : '이준혁 품질보증총괄이사'),
    millSheetNo: `MS-POSCO-${Math.floor(Math.random() * 9000 + 1000)}`,
    heatNo: `HT-630-${Math.floor(Math.random() * 9000 + 1000)}A`,
    notes: '신규 입고 모재 전수 수입검사'
  });

  if (!isOpen) return null;

  const filteredLots = lots.filter((l) => {
    const matchesArchived = viewFilter === 'ACTIVE' ? !l.isArchived : l.isArchived;
    if (!matchesArchived) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.lotNo.toLowerCase().includes(term) ||
      l.materialType.toLowerCase().includes(term) ||
      l.supplier.toLowerCase().includes(term) ||
      l.heatNo.toLowerCase().includes(term)
    );
  });

  const startEditing = () => {
    if (!currentLot) return;
    setEditLot(JSON.parse(JSON.stringify(currentLot)));
    setIsEditMode(true);
  };

  const saveEdits = () => {
    if (!editLot) return;
    const updated = lots.map((l) => (l.id === editLot.id ? editLot : l));
    updateLotsList(updated);
    setIsEditMode(false);
    showToast(`LOT [${editLot.lotNo}] 검사 데이터가 저장되었습니다.`);
  };

  const cancelEdits = () => {
    setEditLot(null);
    setIsEditMode(false);
  };

  const toggleArchive = (lotId: string) => {
    const target = lots.find((l) => l.id === lotId);
    if (!target) return;
    const isNowArchived = !target.isArchived;
    const updated = lots.map((l) =>
      l.id === lotId ? { ...l, isArchived: isNowArchived } : l
    );
    updateLotsList(updated);
    showToast(
      isNowArchived
        ? `LOT [${target.lotNo}]이(가) 보관함으로 이동되었습니다.`
        : `LOT [${target.lotNo}]이(가) 활성 목록으로 복원되었습니다.`
    );
  };

  const deleteLot = (lotId: string) => {
    const target = lots.find((l) => l.id === lotId);
    if (!target) return;
    if (!window.confirm(`정말로 입고 LOT [${target.lotNo}] 검사 데이터를 삭제하시겠습니까?`)) {
      return;
    }
    const updated = lots.filter((l) => l.id !== lotId);
    updateLotsList(updated);
    if (selectedLotId === lotId && updated.length > 0) {
      setSelectedLotId(updated[0].id);
    }
    showToast(`LOT [${target.lotNo}]이(가) 삭제되었습니다.`);
  };

  const handleCreateLot = () => {
    const newId = `IQC-${Date.now()}`;
    const newLot: IqcLotItem = {
      id: newId,
      lotNo: newLotForm.lotNo,
      materialType: newLotForm.materialType,
      standard: newLotForm.standard,
      supplier: newLotForm.supplier,
      incomingDate: newLotForm.incomingDate,
      inspector: newLotForm.inspector,
      approver: newLotForm.approver || effectiveQaManagers[0] || '이준혁 품질보증총괄이사',
      inspectionResult: 'PASS',
      isArchived: false,
      millSheetNo: newLotForm.millSheetNo,
      heatNo: newLotForm.heatNo,
      notes: newLotForm.notes,
      rawDimensions: {
        length: { spec: '1650 ± 5 mm', actual: '1651.0 mm', result: 'OK' },
        width: { spec: '180 ± 2 mm', actual: '180.5 mm', result: 'OK' },
        thickness: { spec: '80 ± 2 mm', actual: '80.8 mm', result: 'OK' },
        straightness: { spec: '≤ 0.3 mm / m', actual: '0.10 mm / m', result: 'OK' }
      },
      chemicalComposition: [
        { element: 'C (탄소)', specMin: 0.0, specMax: 0.07, actual: 0.045, unit: '%', result: 'OK' },
        { element: 'Si (규소)', specMin: 0.0, specMax: 1.0, actual: 0.45, unit: '%', result: 'OK' },
        { element: 'Mn (망간)', specMin: 0.0, specMax: 1.0, actual: 0.60, unit: '%', result: 'OK' },
        { element: 'P (인)', specMin: 0.0, specMax: 0.04, actual: 0.015, unit: '%', result: 'OK' },
        { element: 'S (황)', specMin: 0.0, specMax: 0.03, actual: 0.003, unit: '%', result: 'OK' },
        { element: 'Cr (크롬)', specMin: 15.0, specMax: 17.5, actual: 16.50, unit: '%', result: 'OK' },
        { element: 'Ni (니켈)', specMin: 3.0, specMax: 5.0, actual: 4.20, unit: '%', result: 'OK' },
        { element: 'Cu (구리)', specMin: 3.0, specMax: 5.0, actual: 3.50, unit: '%', result: 'OK' },
        { element: 'Nb+Ta (나이오븀)', specMin: 0.15, specMax: 0.45, actual: 0.30, unit: '%', result: 'OK' }
      ],
      mechanicalProperties: {
        hardness: { spec: 'HRC 38.0 ~ 42.0', actual: 'HRC 40.0', result: 'OK' },
        tensileStrength: { spec: '≥ 1070 MPa', actual: '1130 MPa', result: 'OK' },
        yieldStrength: { spec: '≥ 1000 MPa', actual: '1050 MPa', result: 'OK' },
        elongation: { spec: '≥ 12 %', actual: '15.0 %', result: 'OK' }
      },
      utInspection: {
        method: '수직 탐상 (Direct Pulse-Echo UT)',
        frequency: '5.0 MHz',
        standard: 'KS B 0817 / ASTM A388 Level 1',
        defectFound: false,
        defectDetails: '초음파 결함 에코 0dB, 내부 기공 및 미세 크랙 무',
        result: 'PASS'
      },
      surfaceInspection: {
        visualDefect: '표면 상태 양호, 스케일 및 긁힘 무',
        roughnessRa: 'Ra 1.6 ㎛ (합격)',
        result: 'PASS'
      }
    };

    updateLotsList([newLot, ...lots]);
    setSelectedLotId(newId);
    setIsNewModalOpen(false);
    showToast(`신규 입고 LOT [${newLot.lotNo}]이(가) 등록되었습니다.`);
  };

  const displayLot = isEditMode && editLot ? editLot : currentLot;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[94vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Toast */}
        {toastMessage && (
          <div className="absolute top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-top duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  수입검사대장 (IQC - Incoming Quality Control Log)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  모재 & 외주품 전수 검증
                </span>
                {isEditMode && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white animate-pulse">
                    수정 모드 (Editing)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                밀시트 성분분석(OES), 초음파 탐상(UT), 기계적 물성, 외형 치수 및 표면 조도 정밀 검사서
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <button
                  onClick={saveEdits}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>저장 완료</span>
                </button>
                <button
                  onClick={cancelEdits}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>취소</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={startEditing}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="검사 실측치 및 사양 직접 수정"
                >
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  <span>값 입력 / 수정</span>
                </button>

                <button
                  onClick={() => setIsPrintModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>성적서 인쇄</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left LOT list (4 cols) */}
          <div className="lg:col-span-4 border-r border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col gap-3 overflow-y-auto">
            {/* Action Bar */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex p-0.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-xs font-bold">
                <button
                  onClick={() => setViewFilter('ACTIVE')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    viewFilter === 'ACTIVE'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  활성 LOT
                </button>
                <button
                  onClick={() => setViewFilter('ARCHIVE')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                    viewFilter === 'ARCHIVE'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Archive className="w-3 h-3" />
                  <span>보관함</span>
                </button>
              </div>

              <button
                onClick={() => setIsNewModalOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>신규 LOT</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="LOT 번호, 재질, 공급사 검색..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
              <span>{viewFilter === 'ACTIVE' ? '검사 대기/완료 LOT' : '보관된 LOT'} ({filteredLots.length}건)</span>
            </div>

            {/* LOT Card List */}
            <div className="space-y-2">
              {filteredLots.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  {viewFilter === 'ACTIVE' ? '등록된 활성 LOT가 없습니다.' : '보관함이 비어 있습니다.'}
                </div>
              ) : (
                filteredLots.map((lot) => {
                  const isSelected = lot.id === displayLot?.id;
                  return (
                    <div
                      key={lot.id}
                      onClick={() => {
                        setSelectedLotId(lot.id);
                        if (isEditMode) {
                          setEditLot(JSON.parse(JSON.stringify(lot)));
                        }
                      }}
                      className={`p-3 rounded-2xl border transition cursor-pointer text-left ${
                        isSelected
                          ? 'bg-white dark:bg-slate-900 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                          : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-black text-blue-600 dark:text-blue-400 font-mono">
                          {lot.lotNo}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            lot.inspectionResult === 'PASS'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : lot.inspectionResult === 'FAIL'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {lot.inspectionResult}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {lot.materialType}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
                        <span className="line-clamp-1">{lot.supplier.split(' ')[0]}</span>
                        <span>{lot.incomingDate.split(' ')[0]}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Detail Pane (8 cols) */}
          {displayLot ? (
            <div className="lg:col-span-8 p-5 overflow-y-auto space-y-5 bg-white dark:bg-slate-900">
              {/* LOT Header Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-100 dark:via-slate-800/40 to-blue-500/10 border border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={displayLot.lotNo}
                        onChange={(e) =>
                          setEditLot((prev) => (prev ? { ...prev, lotNo: e.target.value } : null))
                        }
                        className="text-xs font-black text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-amber-300 font-mono"
                      />
                    ) : (
                      <span className="text-xs font-black text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-md bg-amber-500/15 font-mono">
                        {displayLot.lotNo}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 font-mono">
                      Heat No: {displayLot.heatNo}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Mill Sheet: {displayLot.millSheetNo}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {displayLot.materialType}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    규격: {displayLot.standard} | 공급처: <strong>{displayLot.supplier}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 mb-0.5">검사원 (담당자)</div>
                      {isEditMode && editLot ? (
                        <select
                          value={editLot.inspector}
                          onChange={(e) => setEditLot({ ...editLot, inspector: e.target.value })}
                          className="px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                        >
                          {effectiveInspectors.map((insp) => (
                            <option key={insp} value={insp}>{insp}</option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={displayLot.inspector}
                          onChange={(e) => {
                            const newInsp = e.target.value;
                            const updated = lots.map((l) =>
                              l.id === displayLot.id ? { ...l, inspector: newInsp } : l
                            );
                            updateLotsList(updated);
                            showToast(`검사원이 [${newInsp}]으로 변경되었습니다.`);
                          }}
                          className="px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 cursor-pointer"
                        >
                          {effectiveInspectors.map((insp) => (
                            <option key={insp} value={insp}>{insp}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-500 mb-0.5">QA 승인자 (책임자)</div>
                      {isEditMode && editLot ? (
                        <select
                          value={editLot.approver || effectiveQaManagers[0] || '이준혁 품질보증총괄이사'}
                          onChange={(e) => setEditLot({ ...editLot, approver: e.target.value })}
                          className="px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                        >
                          {effectiveQaManagers.map((mgr) => (
                            <option key={mgr} value={mgr}>{mgr}</option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={displayLot.approver || effectiveQaManagers[0] || '이준혁 품질보증총괄이사'}
                          onChange={(e) => {
                            const newMgr = e.target.value;
                            const updated = lots.map((l) =>
                              l.id === displayLot.id ? { ...l, approver: newMgr } : l
                            );
                            updateLotsList(updated);
                            showToast(`승인자가 [${newMgr}]으로 변경되었습니다.`);
                          }}
                          className="px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 cursor-pointer"
                        >
                          {effectiveQaManagers.map((mgr) => (
                            <option key={mgr} value={mgr}>{mgr}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {currentUser && (
                      <button
                        type="button"
                        onClick={() => {
                          const myName = currentUserTitle || currentUserName;
                          if (isEditMode && editLot) {
                            setEditLot({ ...editLot, inspector: myName });
                          } else {
                            const updated = lots.map((l) =>
                              l.id === displayLot.id ? { ...l, inspector: myName } : l
                            );
                            updateLotsList(updated);
                          }
                          showToast(`로그인 계정(${currentUser.name})이 검사원으로 지정되었습니다.`);
                        }}
                        className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800 transition cursor-pointer self-end"
                        title="로그인 계정을 검사원으로 자동 설정"
                      >
                        내 계정 지정
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleArchive(displayLot.id)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                      title={displayLot.isArchived ? '보관함에서 복원' : '보관함으로 이동'}
                    >
                      {displayLot.isArchived ? (
                        <ArchiveRestore className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Archive className="w-4 h-4 text-amber-600" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteLot(displayLot.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 transition cursor-pointer"
                      title="LOT 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 1. 화학 성분 분석표 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Microscope className="w-4 h-4 text-amber-600" />
                    <span>1. 밀시트 화학 성분 분석 (Chemical Composition, wt%)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    분광분석(OES) 공인 시험치 {isEditMode && '(실측값 직접 수정 가능)'}
                  </span>
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
                      {displayLot.chemicalComposition.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="px-3 py-1.5 font-bold text-slate-800 dark:text-slate-200">
                            {item.element}
                          </td>
                          <td className="px-3 py-1.5 text-center text-slate-600 dark:text-slate-400">
                            {item.specMin > 0 ? `${item.specMin} ~ ` : '≤ '}
                            {item.specMax}
                          </td>
                          <td className="px-3 py-1.5 text-center font-bold text-blue-600 dark:text-blue-400">
                            {isEditMode ? (
                              <input
                                type="number"
                                step="0.001"
                                value={item.actual}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  const pass = val >= item.specMin && val <= item.specMax;
                                  setEditLot((prev) => {
                                    if (!prev) return null;
                                    const nextChem = [...prev.chemicalComposition];
                                    nextChem[idx] = {
                                      ...nextChem[idx],
                                      actual: val,
                                      result: pass ? 'OK' : 'NG'
                                    };
                                    return { ...prev, chemicalComposition: nextChem };
                                  });
                                }}
                                className="w-20 px-1.5 py-0.5 text-center text-xs font-mono font-black rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900"
                              />
                            ) : (
                              item.actual
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-center text-slate-500">{item.unit}</td>
                          <td className="px-3 py-1.5 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                item.result === 'OK'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
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
                      {isEditMode ? (
                        <input
                          type="text"
                          value={displayLot.mechanicalProperties.hardness.actual}
                          onChange={(e) =>
                            setEditLot((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    mechanicalProperties: {
                                      ...prev.mechanicalProperties,
                                      hardness: {
                                        ...prev.mechanicalProperties.hardness,
                                        actual: e.target.value
                                      }
                                    }
                                  }
                                : null
                            )
                          }
                          className="w-24 px-1.5 py-0.5 text-right text-xs font-bold border rounded bg-white dark:bg-slate-900"
                        />
                      ) : (
                        <span className="font-bold text-slate-900 dark:text-white">
                          {displayLot.mechanicalProperties.hardness.actual}
                          <span className="text-[10px] text-slate-400 ml-1">
                            (규격: {displayLot.mechanicalProperties.hardness.spec})
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500">인장 강도 (Tensile):</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={displayLot.mechanicalProperties.tensileStrength.actual}
                          onChange={(e) =>
                            setEditLot((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    mechanicalProperties: {
                                      ...prev.mechanicalProperties,
                                      tensileStrength: {
                                        ...prev.mechanicalProperties.tensileStrength,
                                        actual: e.target.value
                                      }
                                    }
                                  }
                                : null
                            )
                          }
                          className="w-24 px-1.5 py-0.5 text-right text-xs font-bold border rounded bg-white dark:bg-slate-900"
                        />
                      ) : (
                        <span className="font-bold text-slate-900 dark:text-white">
                          {displayLot.mechanicalProperties.tensileStrength.actual}
                          <span className="text-[10px] text-slate-400 ml-1">
                            (규격: {displayLot.mechanicalProperties.tensileStrength.spec})
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500">항복 강도 (Yield):</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={displayLot.mechanicalProperties.yieldStrength.actual}
                          onChange={(e) =>
                            setEditLot((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    mechanicalProperties: {
                                      ...prev.mechanicalProperties,
                                      yieldStrength: {
                                        ...prev.mechanicalProperties.yieldStrength,
                                        actual: e.target.value
                                      }
                                    }
                                  }
                                : null
                            )
                          }
                          className="w-24 px-1.5 py-0.5 text-right text-xs font-bold border rounded bg-white dark:bg-slate-900"
                        />
                      ) : (
                        <span className="font-bold text-slate-900 dark:text-white">
                          {displayLot.mechanicalProperties.yieldStrength.actual}
                          <span className="text-[10px] text-slate-400 ml-1">
                            (규격: {displayLot.mechanicalProperties.yieldStrength.spec})
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500">연신율 (Elongation):</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={displayLot.mechanicalProperties.elongation.actual}
                          onChange={(e) =>
                            setEditLot((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    mechanicalProperties: {
                                      ...prev.mechanicalProperties,
                                      elongation: {
                                        ...prev.mechanicalProperties.elongation,
                                        actual: e.target.value
                                      }
                                    }
                                  }
                                : null
                            )
                          }
                          className="w-24 px-1.5 py-0.5 text-right text-xs font-bold border rounded bg-white dark:bg-slate-900"
                        />
                      ) : (
                        <span className="font-bold text-slate-900 dark:text-white">
                          {displayLot.mechanicalProperties.elongation.actual}
                          <span className="text-[10px] text-slate-400 ml-1">
                            (규격: {displayLot.mechanicalProperties.elongation.spec})
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 입고 모재 형상 치수 검증 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>3. 입고 원소재 치수 검증 (Dimension Check)</span>
                  </h4>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500">길이 (Length):</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={displayLot.rawDimensions.length.actual}
                          onChange={(e) =>
                            setEditLot((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rawDimensions: {
                                      ...prev.rawDimensions,
                                      length: { ...prev.rawDimensions.length, actual: e.target.value }
                                    }
                                  }
                                : null
                            )
                          }
                          className="w-24 px-1.5 py-0.5 text-right text-xs font-bold border rounded bg-white dark:bg-slate-900"
                        />
                      ) : (
                        <span className="font-bold text-slate-900 dark:text-white">
                          {displayLot.rawDimensions.length.actual}
                          <span className="text-[10px] text-slate-400 ml-1">
                            (규격: {displayLot.rawDimensions.length.spec})
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500">폭 (Width):</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={displayLot.rawDimensions.width.actual}
                          onChange={(e) =>
                            setEditLot((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rawDimensions: {
                                      ...prev.rawDimensions,
                                      width: { ...prev.rawDimensions.width, actual: e.target.value }
                                    }
                                  }
                                : null
                            )
                          }
                          className="w-24 px-1.5 py-0.5 text-right text-xs font-bold border rounded bg-white dark:bg-slate-900"
                        />
                      ) : (
                        <span className="font-bold text-slate-900 dark:text-white">
                          {displayLot.rawDimensions.width.actual}
                          <span className="text-[10px] text-slate-400 ml-1">
                            (규격: {displayLot.rawDimensions.width.spec})
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500">두께 (Thickness):</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={displayLot.rawDimensions.thickness.actual}
                          onChange={(e) =>
                            setEditLot((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rawDimensions: {
                                      ...prev.rawDimensions,
                                      thickness: {
                                        ...prev.rawDimensions.thickness,
                                        actual: e.target.value
                                      }
                                    }
                                  }
                                : null
                            )
                          }
                          className="w-24 px-1.5 py-0.5 text-right text-xs font-bold border rounded bg-white dark:bg-slate-900"
                        />
                      ) : (
                        <span className="font-bold text-slate-900 dark:text-white">
                          {displayLot.rawDimensions.thickness.actual}
                          <span className="text-[10px] text-slate-400 ml-1">
                            (규격: {displayLot.rawDimensions.thickness.spec})
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500">진직도 (Straightness):</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={displayLot.rawDimensions.straightness.actual}
                          onChange={(e) =>
                            setEditLot((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rawDimensions: {
                                      ...prev.rawDimensions,
                                      straightness: {
                                        ...prev.rawDimensions.straightness,
                                        actual: e.target.value
                                      }
                                    }
                                  }
                                : null
                            )
                          }
                          className="w-24 px-1.5 py-0.5 text-right text-xs font-bold border rounded bg-white dark:bg-slate-900"
                        />
                      ) : (
                        <span className="font-bold text-slate-900 dark:text-white">
                          {displayLot.rawDimensions.straightness.actual}
                          <span className="text-[10px] text-slate-400 ml-1">
                            (규격: {displayLot.rawDimensions.straightness.spec})
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. 초음파 비파괴 검사(UT) 및 표면 상태 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>4. 초음파 비파괴 검사(UT) 및 외관 품질 결과</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    UT 판정: {displayLot.utInspection.result}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 font-bold block text-[11px]">초음파 탐상 사양:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 block mt-0.5">
                      {displayLot.utInspection.method} ({displayLot.utInspection.frequency})
                    </span>
                    <span className="text-slate-500 block text-[10px] mt-1">
                      결과: {displayLot.utInspection.defectDetails}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 font-bold block text-[11px]">표면 조도 & 외관:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 block mt-0.5">
                      {displayLot.surfaceInspection.roughnessRa}
                    </span>
                    <span className="text-slate-500 block text-[10px] mt-1">
                      {displayLot.surfaceInspection.visualDefect}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-8 p-12 text-center text-slate-400">
              선택된 LOT가 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* NEW LOT MODAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  신규 입고 LOT 등록 (IQC)
                </h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">입고 LOT 번호</label>
                <input
                  type="text"
                  value={newLotForm.lotNo}
                  onChange={(e) => setNewLotForm({ ...newLotForm, lotNo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">모재 재질</label>
                  <select
                    value={newLotForm.materialType}
                    onChange={(e) => setNewLotForm({ ...newLotForm, materialType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="STS630 (17-4PH 석출경화 스테인리스강)">STS630 (17-4PH)</option>
                    <option value="SUS420J2 (고경도 마르텐사이트계)">SUS420J2</option>
                    <option value="DLC 초정밀 박막 코팅 외주품">DLC 코팅 외주품</option>
                    <option value="SUS304-CSP 초정밀 심 플레이트">SUS304 심 플레이트</option>
                    <option value="커스텀 특수강 모재">커스텀 특수강</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">공급업체</label>
                  <input
                    type="text"
                    value={newLotForm.supplier}
                    onChange={(e) => setNewLotForm({ ...newLotForm, supplier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Heat No</label>
                  <input
                    type="text"
                    value={newLotForm.heatNo}
                    onChange={(e) => setNewLotForm({ ...newLotForm, heatNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Mill Sheet 번호</label>
                  <input
                    type="text"
                    value={newLotForm.millSheetNo}
                    onChange={(e) => setNewLotForm({ ...newLotForm, millSheetNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-500 font-bold">검사 담당자</label>
                    {currentUser && (
                      <button
                        type="button"
                        onClick={() => setNewLotForm({ ...newLotForm, inspector: currentUserTitle || currentUserName })}
                        className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                      >
                        내 계정
                      </button>
                    )}
                  </div>
                  <select
                    value={newLotForm.inspector}
                    onChange={(e) => setNewLotForm({ ...newLotForm, inspector: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-xs"
                  >
                    {effectiveInspectors.map((insp) => (
                      <option key={insp} value={insp}>{insp}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-500 font-bold">QA 승인자</label>
                  </div>
                  <select
                    value={newLotForm.approver || effectiveQaManagers[0]}
                    onChange={(e) => setNewLotForm({ ...newLotForm, approver: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-xs"
                  >
                    {effectiveQaManagers.map((mgr) => (
                      <option key={mgr} value={mgr}>{mgr}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">비고 및 용도</label>
                <textarea
                  rows={2}
                  value={newLotForm.notes}
                  onChange={(e) => setNewLotForm({ ...newLotForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold"
              >
                취소
              </button>
              <button
                onClick={handleCreateLot}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black"
              >
                LOT 등록 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT PREVIEW MODAL */}
      {isPrintModalOpen && displayLot && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-white text-slate-900 w-full max-w-4xl max-h-[95vh] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col overflow-y-auto space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2 text-slate-700">
                <Printer className="w-5 h-5 text-amber-600" />
                <span className="font-black text-sm">수입검사 성적서 인쇄 미리보기 (A4 공식 양식)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>지금 인쇄 (Print)</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Printable Sheet Body */}
            <div className="border-2 border-slate-900 p-6 space-y-4 bg-white text-slate-950">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div>
                  <h1 className="text-xl font-black tracking-wider uppercase">
                    원소재 수입 검사 성적서 (IQC Inspection Report)
                  </h1>
                  <p className="text-xs text-slate-600 mt-1 font-mono">
                    성적서 관리번호: {displayLot.id} | 밀시트 No: {displayLot.millSheetNo}
                  </p>
                </div>

                <div className="border border-slate-900 text-center text-[10px]">
                  <div className="grid grid-cols-2 divide-x divide-slate-900 border-b border-slate-900 font-bold bg-slate-100">
                    <span className="px-3 py-1">작성 / 검사</span>
                    <span className="px-3 py-1">승인 / QA</span>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-slate-900 h-12 items-center text-xs font-bold">
                    <span className="px-3">{displayLot.inspector.split(' ')[0]}</span>
                    <span className="px-3 relative flex items-center justify-center">
                      <span>{(displayLot.approver || effectiveQaManagers[0] || '이준혁').split(' ')[0]}</span>
                      <span className="absolute w-8 h-8 rounded-full border border-rose-600 text-rose-600 font-bold text-[8px] flex items-center justify-center rotate-12 opacity-80">
                        인
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <table className="w-full text-xs border border-slate-900 border-collapse">
                <tbody>
                  <tr className="border-b border-slate-900 divide-x divide-slate-900">
                    <th className="p-2 bg-slate-100 w-28 text-left">품명 / 재질</th>
                    <td className="p-2 font-bold">{displayLot.materialType}</td>
                    <th className="p-2 bg-slate-100 w-28 text-left">입고 LOT</th>
                    <td className="p-2 font-mono font-bold">{displayLot.lotNo}</td>
                  </tr>
                  <tr className="border-b border-slate-900 divide-x divide-slate-900">
                    <th className="p-2 bg-slate-100 text-left">규격 (Standard)</th>
                    <td className="p-2 font-mono">{displayLot.standard}</td>
                    <th className="p-2 bg-slate-100 text-left">공급처 / Heat No</th>
                    <td className="p-2">{displayLot.supplier} ({displayLot.heatNo})</td>
                  </tr>
                  <tr className="divide-x divide-slate-900">
                    <th className="p-2 bg-slate-100 text-left">입고일시</th>
                    <td className="p-2 font-mono">{displayLot.incomingDate}</td>
                    <th className="p-2 bg-slate-100 text-left">종합 판정</th>
                    <td className="p-2 font-black text-emerald-700">PASS (합격)</td>
                  </tr>
                </tbody>
              </table>

              <div className="space-y-1">
                <h4 className="text-xs font-bold">■ 화학 성분 분석 결과 (Chemical Composition, wt%)</h4>
                <table className="w-full text-xs border border-slate-900 border-collapse text-center">
                  <thead className="bg-slate-100 border-b border-slate-900 font-bold">
                    <tr className="divide-x divide-slate-900">
                      <th className="p-1.5">원소</th>
                      {displayLot.chemicalComposition.map((c) => (
                        <th key={c.element} className="p-1">{c.element.split(' ')[0]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 font-mono text-[11px]">
                    <tr className="divide-x divide-slate-900 bg-slate-50/50">
                      <td className="p-1 font-bold font-sans text-left pl-2">규격 (Spec)</td>
                      {displayLot.chemicalComposition.map((c) => (
                        <td key={c.element} className="p-1">
                          {c.specMin > 0 ? `${c.specMin}~` : '≤'}{c.specMax}
                        </td>
                      ))}
                    </tr>
                    <tr className="divide-x divide-slate-900 font-bold text-blue-900">
                      <td className="p-1 font-sans text-left pl-2">실측 (Actual)</td>
                      {displayLot.chemicalComposition.map((c) => (
                        <td key={c.element} className="p-1">{c.actual}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="border border-slate-900 p-2.5 space-y-1">
                  <h5 className="font-bold">■ 기계적 특성 (Mechanical Properties)</h5>
                  <div className="text-[11px] font-mono space-y-0.5">
                    <div>경도: {displayLot.mechanicalProperties.hardness.actual} ({displayLot.mechanicalProperties.hardness.spec})</div>
                    <div>인장강도: {displayLot.mechanicalProperties.tensileStrength.actual}</div>
                    <div>항복강도: {displayLot.mechanicalProperties.yieldStrength.actual}</div>
                    <div>연신율: {displayLot.mechanicalProperties.elongation.actual}</div>
                  </div>
                </div>

                <div className="border border-slate-900 p-2.5 space-y-1">
                  <h5 className="font-bold">■ 모재 치수 및 UT 비파괴 검사</h5>
                  <div className="text-[11px] font-mono space-y-0.5">
                    <div>길이/폭/두께: {displayLot.rawDimensions.length.actual} / {displayLot.rawDimensions.width.actual} / {displayLot.rawDimensions.thickness.actual}</div>
                    <div>진직도: {displayLot.rawDimensions.straightness.actual}</div>
                    <div>UT 탐상: {displayLot.utInspection.method} ({displayLot.utInspection.result})</div>
                    <div>표면상태: {displayLot.surfaceInspection.roughnessRa}</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-900 text-[10px] text-slate-600 flex justify-between">
                <span>(주)초정밀 슬롯다이 생산기술본부 품질보증팀</span>
                <span>KOLAS 공인 시험 기준 준수</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
