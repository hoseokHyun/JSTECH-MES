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
  projectRef?: string;
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

export function calculateIqcOverallResult(lot: IqcLotItem): 'PASS' | 'FAIL' {
  if (!lot) return 'PASS';

  // 1. 화학 성분 (Chemical Composition) 체크
  if (lot.chemicalComposition && Array.isArray(lot.chemicalComposition)) {
    const hasChemFail = lot.chemicalComposition.some((c) => {
      if (c.result === 'NG') return true;
      const val = Number(c.actual);
      if (isNaN(val)) return false;
      return val < c.specMin || val > c.specMax;
    });
    if (hasChemFail) return 'FAIL';
  }

  // 2. 외형 치수 (Raw Dimensions) 체크
  if (lot.rawDimensions) {
    const { length, width, thickness, straightness } = lot.rawDimensions;
    if (
      length?.result === 'NG' ||
      width?.result === 'NG' ||
      thickness?.result === 'NG' ||
      straightness?.result === 'NG'
    ) {
      return 'FAIL';
    }
  }

  // 3. 기계적 특성 (Mechanical Properties) 체크
  if (lot.mechanicalProperties) {
    const { hardness, tensileStrength, yieldStrength, elongation } = lot.mechanicalProperties;
    if (
      hardness?.result === 'NG' ||
      tensileStrength?.result === 'NG' ||
      yieldStrength?.result === 'NG' ||
      elongation?.result === 'NG'
    ) {
      return 'FAIL';
    }
  }

  // 4. UT 비파괴 검사 (UT Inspection)
  if (lot.utInspection) {
    if (lot.utInspection.result === 'FAIL' || lot.utInspection.defectFound) {
      return 'FAIL';
    }
  }

  // 5. 표면 검사 (Surface Inspection)
  if (lot.surfaceInspection) {
    if (lot.surfaceInspection.result === 'FAIL') {
      return 'FAIL';
    }
  }

  return 'PASS';
}

export const DEFAULT_IQC_LOTS: IqcLotItem[] = [
  {
    id: 'IQC-2026-0301',
    lotNo: 'LOT-260303-STS630',
    materialType: 'STS630 (17-4PH 석출경화 스테인리스강)',
    projectRef: '세메스 1580mm 슬롯다이 바디',
    standard: 'KS D 3706 / ASTM A564 Grade 630 (H1025)',
    supplier: '세아베스틸 (POSCO 특수강 가공원)',
    incomingDate: '2026-03-03 09:30',
    inspector: '주정태',
    approver: '관리자',
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
    lotNo: 'LOT-260302-SUS420J2',
    materialType: 'SUS420J2 (고경도 마르텐사이트계 스테인리스)',
    projectRef: '삼성SDI 1200L 고점도 다이',
    standard: 'JIS G 4303 / KS D 3705 (QT 열처리)',
    supplier: '현대제철 특수강사업부',
    incomingDate: '2026-03-02 14:10',
    inspector: '주정태',
    approver: '관리자',
    inspectionResult: 'PASS',
    isArchived: false,
    millSheetNo: 'MS-HYUNDAI-2603-1108',
    heatNo: 'HT-420-7712B',
    notes: '고정밀 심 플레이트 및 슬롯 블레이드용 고경도 스테인리스강 모재.',
    rawDimensions: {
      length: { spec: '1300 ± 5 mm', actual: '1301.8 mm', result: 'OK' },
      width: { spec: '150 ± 2 mm', actual: '150.4 mm', result: 'OK' },
      thickness: { spec: '60 ± 2 mm', actual: '60.5 mm', result: 'OK' },
      straightness: { spec: '≤ 0.3 mm / m', actual: '0.06 mm / m', result: 'OK' }
    },
    chemicalComposition: [
      { element: 'C (탄소)', specMin: 0.26, specMax: 0.40, actual: 0.33, unit: '%', result: 'OK' },
      { element: 'Si (규소)', specMin: 0.0, specMax: 1.0, actual: 0.42, unit: '%', result: 'OK' },
      { element: 'Mn (망간)', specMin: 0.0, specMax: 1.0, actual: 0.58, unit: '%', result: 'OK' },
      { element: 'P (인)', specMin: 0.0, specMax: 0.04, actual: 0.021, unit: '%', result: 'OK' },
      { element: 'S (황)', specMin: 0.0, specMax: 0.03, actual: 0.003, unit: '%', result: 'OK' },
      { element: 'Cr (크롬)', specMin: 12.0, specMax: 14.0, actual: 13.15, unit: '%', result: 'OK' }
    ],
    mechanicalProperties: {
      hardness: { spec: 'HRC 50.0 ~ 54.0', actual: 'HRC 52.4', result: 'OK' },
      tensileStrength: { spec: '≥ 735 MPa', actual: '820 MPa', result: 'OK' },
      yieldStrength: { spec: '≥ 540 MPa', actual: '610 MPa', result: 'OK' },
      elongation: { spec: '≥ 15 %', actual: '18.2 %', result: 'OK' }
    },
    utInspection: {
      method: '초음파 탐상 (UT)',
      frequency: '5.0 MHz',
      standard: 'KS B 0817 Grade 1',
      defectFound: false,
      defectDetails: '무결점 판정',
      result: 'PASS'
    },
    surfaceInspection: {
      visualDefect: '표면 균일, 유해 결함 없음',
      roughnessRa: 'Ra 1.2 ㎛',
      result: 'PASS'
    }
  },
  {
    id: 'IQC-2026-0303',
    lotNo: 'LOT-260301-DLC',
    materialType: 'DLC (Diamond-Like Carbon) 초정밀 박막 코팅',
    projectRef: 'LG엔솔 1650mm 와이드 슬롯다이',
    standard: '내부 QA-DLC-STD-02 / 코팅 두께 2.0±0.3㎛',
    supplier: '(주)나노코트 테크놀로지',
    incomingDate: '2026-03-01 11:00',
    inspector: '주정태',
    approver: '관리자',
    inspectionResult: 'PASS',
    isArchived: false,
    millSheetNo: 'MS-NANO-2603-0421',
    heatNo: 'HT-DLC-5519',
    notes: '슬롯다이 립(Lip) 토출 선단부 마모 방지 및 초저마찰 슬라이딩 DLC 코팅 외주 수입검사.',
    rawDimensions: {
      length: { spec: '1650 ± 2 mm', actual: '1650.1 mm', result: 'OK' },
      width: { spec: '180 ± 1 mm', actual: '180.2 mm', result: 'OK' },
      thickness: { spec: '80 ± 1 mm', actual: '80.1 mm', result: 'OK' },
      straightness: { spec: '≤ 0.05 mm / m', actual: '0.02 mm / m', result: 'OK' }
    },
    chemicalComposition: [
      { element: 'sp3 탄소 비율', specMin: 70.0, specMax: 90.0, actual: 82.5, unit: '%', result: 'OK' },
      { element: '수소 함량', specMin: 0.0, specMax: 15.0, actual: 8.2, unit: '%', result: 'OK' }
    ],
    mechanicalProperties: {
      hardness: { spec: 'Hv 2200 ~ 2800', actual: 'Hv 2540', result: 'OK' },
      tensileStrength: { spec: 'N/A', actual: 'N/A', result: 'OK' },
      yieldStrength: { spec: 'N/A', actual: 'N/A', result: 'OK' },
      elongation: { spec: 'N/A', actual: 'N/A', result: 'OK' }
    },
    utInspection: {
      method: '계면 비파괴 레이저 음향 탐상',
      frequency: 'Laser Acoustic Surface Wave',
      standard: 'ISO 20502 (박리 평가)',
      defectFound: false,
      defectDetails: '박리 및 기포 없음 (밀착력 HF1 최우수)',
      result: 'PASS'
    },
    surfaceInspection: {
      visualDefect: '무결점, 경면 무지갯빛 간섭 줄무늬 균일',
      roughnessRa: 'Ra 0.008 ㎛ (초경면 미러 피니싱)',
      coatingThickness: '2.14 ㎛ (스펙 2.0±0.3㎛ 충족)',
      coatingAdhesion: 'HF1 등급 (박리 0%)',
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
  projects?: string[];
}

export const IqcDetailModal: React.FC<IqcDetailModalProps> = ({
  isOpen,
  onClose,
  initialLotId,
  lots: propLots,
  onUpdateLots,
  currentUser,
  inspectors = [],
  qaManagers = [],
  projects = []
}) => {
  const currentUserName = currentUser?.name?.trim() || '';
  const currentUserTitle = currentUser ? `${currentUser.name} (${currentUser.role === 'ADMIN' ? 'QA 총괄/관리자' : '품질 검사원'})` : '';

  // 1. Inspector list linked with registered field operators (ONLY role !== 'ADMIN')
  const effectiveInspectors = React.useMemo(() => {
    const list: string[] = [];

    // Add current user if field operator (not admin)
    if (currentUser && currentUser.role !== 'ADMIN' && currentUserName) {
      list.push(currentUserName);
    }

    // Add inspectors from props (which already filtered out admins and fake names)
    inspectors.forEach((insp) => {
      const name = insp.trim();
      if (name && !list.includes(name)) list.push(name);
    });

    return Array.from(new Set(list.filter(Boolean)));
  }, [currentUser, currentUserName, inspectors]);

  // 2. QA Manager list linked with registered admin users (ONLY role === 'ADMIN')
  const effectiveQaManagers = React.useMemo(() => {
    const list: string[] = [];

    // Add current user if ADMIN
    if (currentUser?.role === 'ADMIN' && currentUserName) {
      list.push(currentUserName);
    }

    // Add QA managers from props (which are registered admins)
    qaManagers.forEach((mgr) => {
      const name = mgr.trim();
      if (name && !list.includes(name)) list.push(name);
    });

    return Array.from(new Set(list.filter(Boolean)));
  }, [currentUser, currentUserName, qaManagers]);

  // 3. Registered project names for quick linking
  const effectiveProjects = React.useMemo(() => {
    const list: string[] = [];
    projects.forEach((p) => {
      if (p && !list.includes(p)) list.push(p);
    });
    const defaults = [
      '세메스 1580mm 슬롯다이 바디',
      '삼성SDI 1200L 고점도 다이',
      'LG에너지솔루션 1400mm 전극 슬롯다이',
      'SK온 1650mm 초광폭 슬롯다이',
      '포스코퓨처엠 800mm 코팅 블레이드'
    ];
    defaults.forEach((d) => {
      if (!list.includes(d)) list.push(d);
    });
    return Array.from(new Set(list.filter(Boolean)));
  }, [projects]);

  const [internalLots, setInternalLots] = useState<IqcLotItem[]>(DEFAULT_IQC_LOTS);
  const lots = propLots || internalLots;
  const updateLotsList = (newLots: IqcLotItem[]) => {
    if (onUpdateLots) {
      onUpdateLots(newLots);
    } else {
      setInternalLots(newLots);
    }
  };

  // Automatically sync existing lots if inspector/approver is missing or from outdated defaults
  React.useEffect(() => {
    if (!lots || lots.length === 0) return;
    let hasChanges = false;
    const updatedLots = lots.map((lot) => {
      let updated = { ...lot };
      if (effectiveInspectors.length > 0 && (!lot.inspector || !effectiveInspectors.includes(lot.inspector))) {
        updated.inspector = effectiveInspectors[0];
        hasChanges = true;
      }
      if (effectiveQaManagers.length > 0 && (!lot.approver || !effectiveQaManagers.includes(lot.approver))) {
        updated.approver = effectiveQaManagers[0];
        hasChanges = true;
      }
      return updated;
    });
    if (hasChanges) {
      updateLotsList(updatedLots);
    }
  }, [effectiveInspectors, effectiveQaManagers]);

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
    projectRef: effectiveProjects[0] || '세메스 1580mm 슬롯다이 바디',
    incomingDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
    inspector: effectiveInspectors[0] || (currentUser?.role !== 'ADMIN' ? currentUserName : '') || '',
    approver: effectiveQaManagers[0] || (currentUser?.role === 'ADMIN' ? currentUserName : '') || '',
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
      l.heatNo.toLowerCase().includes(term) ||
      (l.projectRef && l.projectRef.toLowerCase().includes(term))
    );
  });

  const startEditing = () => {
    if (!currentLot) return;
    setEditLot(JSON.parse(JSON.stringify(currentLot)));
    setIsEditMode(true);
  };

  const saveEdits = () => {
    if (!editLot) return;
    const finalLot: IqcLotItem = {
      ...editLot,
      inspectionResult: calculateIqcOverallResult(editLot)
    };
    const updated = lots.map((l) => (l.id === finalLot.id ? finalLot : l));
    updateLotsList(updated);
    setIsEditMode(false);
    showToast(`LOT [${finalLot.lotNo}] 검사 데이터가 저장되었습니다. (판정: ${finalLot.inspectionResult})`);
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
    let newLot: IqcLotItem = {
      id: newId,
      lotNo: newLotForm.lotNo,
      materialType: newLotForm.materialType,
      standard: newLotForm.standard,
      supplier: newLotForm.supplier,
      projectRef: newLotForm.projectRef || effectiveProjects[0] || '세메스 1580mm 슬롯다이 바디',
      incomingDate: newLotForm.incomingDate,
      inspector: newLotForm.inspector || effectiveInspectors[0] || currentUserName || '현장 담당자',
      approver: newLotForm.approver || effectiveQaManagers[0] || (currentUser?.role === 'ADMIN' ? currentUserName : '') || 'QA 관리자',
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
    newLot.inspectionResult = calculateIqcOverallResult(newLot);

    updateLotsList([newLot, ...lots]);
    setSelectedLotId(newId);
    setIsNewModalOpen(false);
    showToast(`신규 입고 LOT [${newLot.lotNo}]이(가) 등록되었습니다.`);
  };

  const handlePrintDocument = () => {
    if (!displayLot) return;
    
    // Create or reuse hidden iframe to print isolated clean A4 sheet without modal background artifacts
    let iframe = document.getElementById('iqc-print-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'iqc-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>원소재 수입 검사 성적서 - ${displayLot.lotNo}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            * { box-sizing: border-box; }
            body { font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 10px; color: #0f172a; background: #fff; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 6px; }
            th, td { border: 1px solid #1e293b; padding: 5px 7px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: 700; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-mono { font-family: monospace; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            .header-wrap { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; gap: 12px; }
            .logo-box { flex: 0 0 150px; display: flex; align-items: center; justify-content: flex-start; }
            .logo-img { height: 32px; max-height: 32px; width: auto; object-fit: contain; }
            .title-box { flex: 1 1 auto; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 8px; }
            .title-main { font-size: 16px; font-weight: 900; letter-spacing: -0.2px; line-height: 1.25; color: #0f172a; white-space: nowrap; }
            .title-sub { font-size: 11px; font-weight: 700; color: #334155; letter-spacing: 0.5px; margin-top: 1px; }
            .title-meta { font-family: monospace; font-size: 9.5px; color: #64748b; margin-top: 3px; }
            .stamp-box { flex: 0 0 150px; display: flex; justify-content: flex-end; }
            .stamp-table-grid { width: 140px; border-collapse: collapse; border: 1.5px solid #0f172a; text-align: center; font-size: 10px; margin: 0; background: #fff; }
            .stamp-table-grid th, .stamp-table-grid td { border: none; padding: 0; }
            .stamp-table-grid th { background-color: #f8fafc; font-weight: bold; padding: 4px 0; border-bottom: 1.5px solid #0f172a; font-size: 10px; color: #0f172a; }
            .stamp-table-grid .col-divider { border-right: 1.5px solid #0f172a; }
            .stamp-table-grid td { height: 44px; vertical-align: middle; font-weight: bold; font-size: 11px; color: #0f172a; position: relative; }
            .seal-stamp { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(12deg); width: 32px; height: 32px; border: 1.5px solid #e11d48; color: #e11d48; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 900; opacity: 0.85; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
            .box { border: 1px solid #1e293b; padding: 7px 9px; }
            .box-title { font-weight: bold; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 5px; }
            .footer { border-top: 1px solid #0f172a; padding-top: 6px; margin-top: 12px; font-size: 9.5px; color: #475569; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header-wrap">
            <div class="logo-box">
              <img src="https://sign.mail.worksmobile.com/signature/logo/kr1/5ZbZaxUwKAgZaxUwBqM-aAM./SqbwKAgmKAuZFxKZKqg9aAJjaAuZaxEdKo2rKA2rFob." class="logo-img" alt="준성테크" />
            </div>
            <div class="title-box">
              <div class="title-main">원소재 수입 검사 성적서</div>
              <div class="title-sub">(IQC INSPECTION REPORT)</div>
              <div class="title-meta">
                성적서 관리번호: ${displayLot.id} &nbsp;|&nbsp; 밀시트 No: ${displayLot.millSheetNo}
              </div>
            </div>
            <div class="stamp-box">
              <table class="stamp-table-grid">
                <thead>
                  <tr>
                    <th style="width: 50%;" class="col-divider">작성 / 검사</th>
                    <th style="width: 50%;">승인 / QA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="width: 50%;" class="col-divider">
                      ${((isEditMode && editLot ? editLot.inspector : displayLot.inspector) || effectiveInspectors[0] || '검사원').split(' ')[0]}
                    </td>
                    <td style="width: 50%;">
                      <span>${((isEditMode && editLot ? editLot.approver : displayLot.approver) || effectiveQaManagers[0] || '관리자').split(' ')[0]}</span>
                      <div class="seal-stamp">인</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <table>
            <tbody>
              <tr>
                <th style="width: 15%;">품명 / 재질</th>
                <td style="width: 35%; font-weight: bold;">${displayLot.materialType}</td>
                <th style="width: 15%;">입고 LOT</th>
                <td style="width: 35%; font-family: monospace; font-weight: bold;">${displayLot.lotNo}</td>
              </tr>
              <tr>
                <th>규격 (Standard)</th>
                <td class="font-mono">${displayLot.standard}</td>
                <th>연계 프로젝트</th>
                <td style="font-weight: bold; color: #1e40af;">${displayLot.projectRef || '일반 입고 모재'}</td>
              </tr>
              <tr>
                <th>공급처 / Heat No</th>
                <td>${displayLot.supplier} (${displayLot.heatNo})</td>
                <th>입고일시</th>
                <td class="font-mono">${displayLot.incomingDate}</td>
              </tr>
              <tr>
                <th>검사 판정</th>
                <td style="font-weight: 900; color: #047857;">PASS (전수 합격)</td>
                <th>검사 / 승인자</th>
                <td>${(isEditMode && editLot ? editLot.inspector : displayLot.inspector) || effectiveInspectors[0] || ''} / ${(isEditMode && editLot ? editLot.approver : displayLot.approver) || effectiveQaManagers[0] || ''}</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 8px;">
            <div style="font-weight: bold; font-size: 11px; margin-bottom: 3px;">■ 화학 성분 분석 결과 (Chemical Composition, wt%)</div>
            <table class="text-center">
              <thead>
                <tr>
                  <th style="text-align: left; width: 14%;">원소</th>
                  ${displayLot.chemicalComposition.map((c) => `<th>${c.element.split(' ')[0]}</th>`).join('')}
                </tr>
              </thead>
              <tbody class="font-mono">
                <tr style="background-color: #f8fafc;">
                  <td style="text-align: left; font-family: sans-serif; font-weight: bold;">규격 (Spec)</td>
                  ${displayLot.chemicalComposition.map((c) => `<td>${c.specMin > 0 ? `${c.specMin}~` : '≤'}${c.specMax}</td>`).join('')}
                </tr>
                <tr style="font-weight: bold; color: #1e3a8a;">
                  <td style="text-align: left; font-family: sans-serif;">실측 (Actual)</td>
                  ${displayLot.chemicalComposition.map((c) => `<td>${c.actual}</td>`).join('')}
                </tr>
              </tbody>
            </table>
          </div>

          <div class="grid-2">
            <div class="box">
              <div class="box-title">■ 기계적 특성 (Mechanical Properties)</div>
              <div class="font-mono" style="line-height: 1.6;">
                <div>• 경도: <strong>${displayLot.mechanicalProperties.hardness.actual}</strong> (${displayLot.mechanicalProperties.hardness.spec})</div>
                <div>• 인장강도: <strong>${displayLot.mechanicalProperties.tensileStrength.actual}</strong> (${displayLot.mechanicalProperties.tensileStrength.spec})</div>
                <div>• 항복강도: <strong>${displayLot.mechanicalProperties.yieldStrength.actual}</strong> (${displayLot.mechanicalProperties.yieldStrength.spec})</div>
                <div>• 연신율: <strong>${displayLot.mechanicalProperties.elongation.actual}</strong> (${displayLot.mechanicalProperties.elongation.spec})</div>
              </div>
            </div>

            <div class="box">
              <div class="box-title">■ 모재 치수 및 UT 비파괴 검사</div>
              <div class="font-mono" style="line-height: 1.6;">
                <div>• 치수: L ${displayLot.rawDimensions.length.actual} / W ${displayLot.rawDimensions.width.actual} / T ${displayLot.rawDimensions.thickness.actual}</div>
                <div>• 진직도: <strong>${displayLot.rawDimensions.straightness.actual}</strong> (${displayLot.rawDimensions.straightness.spec})</div>
                <div>• UT 탐상: <strong>${displayLot.utInspection.method}</strong> (${displayLot.utInspection.result})</div>
                <div>• 표면상태: <strong>${displayLot.surfaceInspection.roughnessRa}</strong> (${displayLot.surfaceInspection.result})</div>
              </div>
            </div>
          </div>

          <div class="box" style="margin-top: 8px;">
            <div class="box-title">■ 특이사항 및 용도 (Notes)</div>
            <div style="font-size: 11px; color: #334155;">
              ${displayLot.notes || '이상 없음. 진공 탈가스 정련 및 열처리 사양 합격품.'}
            </div>
          </div>

          <div class="footer">
            <span>(주)준성테크 품질보증팀 (JUNSUNG TECH QA TEAM) | 성적서 발행일: ${new Date().toISOString().slice(0, 10)}</span>
            <span>KOLAS 공인 시험규격 준수 / 정밀 수입검사 인증</span>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 250);
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
                      ? 'bg-[#FFF9EB] dark:bg-amber-950/60 text-[#B45309] dark:text-amber-300 border border-[#FCD34D] dark:border-amber-700/80 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-[#B45309]'
                  }`}
                >
                  <Archive className="w-3 h-3 text-[#B45309] dark:text-amber-400" />
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
                  const effectiveLot = (isEditMode && editLot && lot.id === editLot.id) ? editLot : lot;
                  const lotResult = calculateIqcOverallResult(effectiveLot);
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
                            lotResult === 'PASS'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {lotResult}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
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

                  {isEditMode && editLot ? (
                    <div className="space-y-2 pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">재질명 (직접 입력 또는 선택)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editLot.materialType}
                            onChange={(e) => setEditLot({ ...editLot, materialType: e.target.value })}
                            placeholder="예: STS630, SUS420J2, DLC 코팅 등"
                            className="flex-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900"
                          />
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                setEditLot({ ...editLot, materialType: e.target.value });
                              }
                            }}
                            className="px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600"
                          >
                            <option value="">프리셋</option>
                            <option value="STS630 (17-4PH 석출경화 스테인리스강)">STS630</option>
                            <option value="SUS420J2 (고경도 마르텐사이트계)">SUS420J2</option>
                            <option value="DLC (Diamond-Like Carbon) 초정밀 박막 코팅">DLC 코팅</option>
                            <option value="Hastelloy C-276 (초내식 합금)">Hastelloy C-276</option>
                            <option value="Inconel 625 (초내열/내식 특수합금)">Inconel 625</option>
                            <option value="SUS304-CSP 초정밀 심 플레이트">SUS304 심재</option>
                            <option value="Ti-6Al-4V (Grade 5 티타늄 합금)">Ti-6Al-4V</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">투입 프로젝트 (선택 또는 직접입력)</label>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              list="project-edit-options"
                              value={editLot.projectRef || ''}
                              onChange={(e) => setEditLot({ ...editLot, projectRef: e.target.value })}
                              placeholder="예: 세메스 1580mm 슬롯다이 바디"
                              className="flex-1 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  setEditLot({ ...editLot, projectRef: e.target.value });
                                }
                              }}
                              className="px-1.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 cursor-pointer"
                              title="등록된 프로젝트에서 선택"
                            >
                              <option value="">선택</option>
                              {effectiveProjects.map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                            <datalist id="project-edit-options">
                              {effectiveProjects.map((p) => (
                                <option key={p} value={p} />
                              ))}
                            </datalist>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">공급업체</label>
                          <input
                            type="text"
                            value={editLot.supplier}
                            onChange={(e) => setEditLot({ ...editLot, supplier: e.target.value })}
                            className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center flex-wrap gap-2">
                        <span>{displayLot.materialType}</span>
                        {displayLot.projectRef && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 inline-flex items-center">
                            <span className="font-extrabold mr-1">프로젝트:</span>
                            <span>{displayLot.projectRef}</span>
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        규격: {displayLot.standard} | 공급처: <strong>{displayLot.supplier}</strong>
                      </p>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2.5 bg-slate-50/80 dark:bg-slate-800/80 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                    <div>
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">검사원 (담당자)</div>
                      {isEditMode && editLot ? (
                        <select
                          value={editLot.inspector || effectiveInspectors[0] || ''}
                          onChange={(e) => setEditLot({ ...editLot, inspector: e.target.value })}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                        >
                          {effectiveInspectors.map((insp) => (
                            <option key={insp} value={insp}>{insp}</option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={displayLot.inspector || effectiveInspectors[0] || ''}
                          onChange={(e) => {
                            const newInsp = e.target.value;
                            const updated = lots.map((l) =>
                              l.id === displayLot.id ? { ...l, inspector: newInsp } : l
                            );
                            updateLotsList(updated);
                            showToast(`검사원이 [${newInsp}]으로 변경되었습니다.`);
                          }}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                        >
                          {effectiveInspectors.map((insp) => (
                            <option key={insp} value={insp}>{insp}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">QA 승인자 (책임자)</div>
                      {isEditMode && editLot ? (
                        <select
                          value={editLot.approver || effectiveQaManagers[0] || ''}
                          onChange={(e) => setEditLot({ ...editLot, approver: e.target.value })}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                        >
                          {effectiveQaManagers.map((mgr) => (
                            <option key={mgr} value={mgr}>{mgr}</option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={displayLot.approver || effectiveQaManagers[0] || ''}
                          onChange={(e) => {
                            const newMgr = e.target.value;
                            const updated = lots.map((l) =>
                              l.id === displayLot.id ? { ...l, approver: newMgr } : l
                            );
                            updateLotsList(updated);
                            showToast(`승인자가 [${newMgr}]으로 변경되었습니다.`);
                          }}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                        >
                          {effectiveQaManagers.map((mgr) => (
                            <option key={mgr} value={mgr}>{mgr}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {currentUser && currentUser.role !== 'ADMIN' && (
                      <button
                        type="button"
                        onClick={() => {
                          const myName = currentUserName;
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
                        className="px-2 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800 transition cursor-pointer self-end mb-0.5"
                        title="로그인 계정을 검사원으로 자동 설정"
                      >
                        내 계정 지정
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleArchive(displayLot.id)}
                      className="p-2 rounded-xl bg-[#FFF9EB] hover:bg-[#FEF3D6] dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-[#B45309] dark:text-amber-300 border border-[#FCD34D] dark:border-amber-700/80 shadow-2xs transition cursor-pointer"
                      title={displayLot.isArchived ? '보관함에서 복원' : '보관함으로 이동'}
                    >
                      {displayLot.isArchived ? (
                        <ArchiveRestore className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Archive className="w-4 h-4 text-[#B45309] dark:text-amber-400" />
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
                                    const updatedLot: IqcLotItem = { ...prev, chemicalComposition: nextChem };
                                    updatedLot.inspectionResult = calculateIqcOverallResult(updatedLot);
                                    return updatedLot;
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
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={displayLot.mechanicalProperties.hardness.actual}
                            onChange={(e) =>
                              setEditLot((prev) => {
                                if (!prev) return null;
                                const updatedLot: IqcLotItem = {
                                  ...prev,
                                  mechanicalProperties: {
                                    ...prev.mechanicalProperties,
                                    hardness: {
                                      ...prev.mechanicalProperties.hardness,
                                      actual: e.target.value
                                    }
                                  }
                                };
                                updatedLot.inspectionResult = calculateIqcOverallResult(updatedLot);
                                return updatedLot;
                              })
                            }
                            className="w-24 px-1.5 py-0.5 text-right text-xs font-bold border rounded bg-white dark:bg-slate-900"
                          />
                          <select
                            value={displayLot.mechanicalProperties.hardness.result}
                            onChange={(e) => {
                              const res = e.target.value as 'OK' | 'NG';
                              setEditLot((prev) => {
                                if (!prev) return null;
                                const updatedLot: IqcLotItem = {
                                  ...prev,
                                  mechanicalProperties: {
                                    ...prev.mechanicalProperties,
                                    hardness: {
                                      ...prev.mechanicalProperties.hardness,
                                      result: res
                                    }
                                  }
                                };
                                updatedLot.inspectionResult = calculateIqcOverallResult(updatedLot);
                                return updatedLot;
                              });
                            }}
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                              displayLot.mechanicalProperties.hardness.result === 'OK'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-rose-50 text-rose-700 border-rose-300'
                            }`}
                          >
                            <option value="OK">OK</option>
                            <option value="NG">NG</option>
                          </select>
                        </div>
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
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={displayLot.mechanicalProperties.tensileStrength.actual}
                            onChange={(e) =>
                              setEditLot((prev) => {
                                if (!prev) return null;
                                const updatedLot: IqcLotItem = {
                                  ...prev,
                                  mechanicalProperties: {
                                    ...prev.mechanicalProperties,
                                    tensileStrength: {
                                      ...prev.mechanicalProperties.tensileStrength,
                                      actual: e.target.value
                                    }
                                  }
                                };
                                updatedLot.inspectionResult = calculateIqcOverallResult(updatedLot);
                                return updatedLot;
                              })
                            }
                            className="w-24 px-1.5 py-0.5 text-right text-xs font-bold border rounded bg-white dark:bg-slate-900"
                          />
                          <select
                            value={displayLot.mechanicalProperties.tensileStrength.result}
                            onChange={(e) => {
                              const res = e.target.value as 'OK' | 'NG';
                              setEditLot((prev) => {
                                if (!prev) return null;
                                const updatedLot: IqcLotItem = {
                                  ...prev,
                                  mechanicalProperties: {
                                    ...prev.mechanicalProperties,
                                    tensileStrength: {
                                      ...prev.mechanicalProperties.tensileStrength,
                                      result: res
                                    }
                                  }
                                };
                                updatedLot.inspectionResult = calculateIqcOverallResult(updatedLot);
                                return updatedLot;
                              });
                            }}
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                              displayLot.mechanicalProperties.tensileStrength.result === 'OK'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-rose-50 text-rose-700 border-rose-300'
                            }`}
                          >
                            <option value="OK">OK</option>
                            <option value="NG">NG</option>
                          </select>
                        </div>
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
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={displayLot.mechanicalProperties.yieldStrength.actual}
                            onChange={(e) =>
                              setEditLot((prev) => {
                                if (!prev) return null;
                                const updatedLot: IqcLotItem = {
                                  ...prev,
                                  mechanicalProperties: {
                                    ...prev.mechanicalProperties,
                                    yieldStrength: {
                                      ...prev.mechanicalProperties.yieldStrength,
                                      actual: e.target.value
                                    }
                                  }
                                };
                                updatedLot.inspectionResult = calculateIqcOverallResult(updatedLot);
                                return updatedLot;
                              })
                            }
                            className="w-24 px-1.5 py-0.5 text-right text-xs font-bold border rounded bg-white dark:bg-slate-900"
                          />
                          <select
                            value={displayLot.mechanicalProperties.yieldStrength.result}
                            onChange={(e) => {
                              const res = e.target.value as 'OK' | 'NG';
                              setEditLot((prev) => {
                                if (!prev) return null;
                                const updatedLot: IqcLotItem = {
                                  ...prev,
                                  mechanicalProperties: {
                                    ...prev.mechanicalProperties,
                                    yieldStrength: {
                                      ...prev.mechanicalProperties.yieldStrength,
                                      result: res
                                    }
                                  }
                                };
                                updatedLot.inspectionResult = calculateIqcOverallResult(updatedLot);
                                return updatedLot;
                              });
                            }}
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                              displayLot.mechanicalProperties.yieldStrength.result === 'OK'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-rose-50 text-rose-700 border-rose-300'
                            }`}
                          >
                            <option value="OK">OK</option>
                            <option value="NG">NG</option>
                          </select>
                        </div>
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
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={displayLot.mechanicalProperties.elongation.actual}
                            onChange={(e) =>
                              setEditLot((prev) => {
                                if (!prev) return null;
                                const updatedLot: IqcLotItem = {
                                  ...prev,
                                  mechanicalProperties: {
                                    ...prev.mechanicalProperties,
                                    elongation: {
                                      ...prev.mechanicalProperties.elongation,
                                      actual: e.target.value
                                    }
                                  }
                                };
                                updatedLot.inspectionResult = calculateIqcOverallResult(updatedLot);
                                return updatedLot;
                              })
                            }
                            className="w-24 px-1.5 py-0.5 text-right text-xs font-bold border rounded bg-white dark:bg-slate-900"
                          />
                          <select
                            value={displayLot.mechanicalProperties.elongation.result}
                            onChange={(e) => {
                              const res = e.target.value as 'OK' | 'NG';
                              setEditLot((prev) => {
                                if (!prev) return null;
                                const updatedLot: IqcLotItem = {
                                  ...prev,
                                  mechanicalProperties: {
                                    ...prev.mechanicalProperties,
                                    elongation: {
                                      ...prev.mechanicalProperties.elongation,
                                      result: res
                                    }
                                  }
                                };
                                updatedLot.inspectionResult = calculateIqcOverallResult(updatedLot);
                                return updatedLot;
                              });
                            }}
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                              displayLot.mechanicalProperties.elongation.result === 'OK'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-rose-50 text-rose-700 border-rose-300'
                            }`}
                          >
                            <option value="OK">OK</option>
                            <option value="NG">NG</option>
                          </select>
                        </div>
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
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={displayLot.rawDimensions.length.actual}
                            onChange={(e) =>
                              setEditLot((prev) => {
                                if (!prev) return null;
                                const updatedLot: IqcLotItem = {
                                  ...prev,
                                  rawDimensions: {
                                    ...prev.rawDimensions,
                                    length: { ...prev.rawDimensions.length, actual: e.target.value }
                                  }
                                };
                                updatedLot.inspectionResult = calculateIqcOverallResult(updatedLot);
                                return updatedLot;
                              })
                            }
                            className="w-24 px-1.5 py-0.5 text-right text-xs font-bold border rounded bg-white dark:bg-slate-900"
                          />
                          <select
                            value={displayLot.rawDimensions.length.result}
                            onChange={(e) => {
                              const res = e.target.value as 'OK' | 'NG';
                              setEditLot((prev) => {
                                if (!prev) return null;
                                const updatedLot: IqcLotItem = {
                                  ...prev,
                                  rawDimensions: {
                                    ...prev.rawDimensions,
                                    length: { ...prev.rawDimensions.length, result: res }
                                  }
                                };
                                updatedLot.inspectionResult = calculateIqcOverallResult(updatedLot);
                                return updatedLot;
                              });
                            }}
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                              displayLot.rawDimensions.length.result === 'OK'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-rose-50 text-rose-700 border-rose-300'
                            }`}
                          >
                            <option value="OK">OK</option>
                            <option value="NG">NG</option>
                          </select>
                        </div>
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
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={displayLot.rawDimensions.width.actual}
                            onChange={(e) =>
                              setEditLot((prev) => {
                                if (!prev) return null;
                                const updatedLot: IqcLotItem = {
                                  ...prev,
                                  rawDimensions: {
                                    ...prev.rawDimensions,
                                    width: { ...prev.rawDimensions.width, actual: e.target.value }
                                  }
                                };
                                updatedLot.inspectionResult = calculateIqcOverallResult(updatedLot);
                                return updatedLot;
                              })
                            }
                            className="w-24 px-1.5 py-0.5 text-right text-xs font-bold border rounded bg-white dark:bg-slate-900"
                          />
                          <select
                            value={displayLot.rawDimensions.width.result}
                            onChange={(e) => {
                              const res = e.target.value as 'OK' | 'NG';
                              setEditLot((prev) => {
                                if (!prev) return null;
                                const updatedLot: IqcLotItem = {
                                  ...prev,
                                  rawDimensions: {
                                    ...prev.rawDimensions,
                                    width: { ...prev.rawDimensions.width, result: res }
                                  }
                                };
                                updatedLot.inspectionResult = calculateIqcOverallResult(updatedLot);
                                return updatedLot;
                              });
                            }}
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                              displayLot.rawDimensions.width.result === 'OK'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-rose-50 text-rose-700 border-rose-300'
                            }`}
                          >
                            <option value="OK">OK</option>
                            <option value="NG">NG</option>
                          </select>
                        </div>
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
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={displayLot.rawDimensions.thickness.actual}
                            onChange={(e) =>
                              setEditLot((prev) => {
                                if (!prev) return null;
                                const updatedLot: IqcLotItem = {
                                  ...prev,
                                  rawDimensions: {
                                    ...prev.rawDimensions,
                                    thickness: {
                                      ...prev.rawDimensions.thickness,
                                      actual: e.target.value
                                    }
                                  }
                                };
                                updatedLot.inspectionResult = calculateIqcOverallResult(updatedLot);
                                return updatedLot;
                              })
                            }
                            className="w-24 px-1.5 py-0.5 text-right text-xs font-bold border rounded bg-white dark:bg-slate-900"
                          />
                          <select
                            value={displayLot.rawDimensions.thickness.result}
                            onChange={(e) => {
                              const res = e.target.value as 'OK' | 'NG';
                              setEditLot((prev) => {
                                if (!prev) return null;
                                const updatedLot: IqcLotItem = {
                                  ...prev,
                                  rawDimensions: {
                                    ...prev.rawDimensions,
                                    thickness: { ...prev.rawDimensions.thickness, result: res }
                                  }
                                };
                                updatedLot.inspectionResult = calculateIqcOverallResult(updatedLot);
                                return updatedLot;
                              });
                            }}
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                              displayLot.rawDimensions.thickness.result === 'OK'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-rose-50 text-rose-700 border-rose-300'
                            }`}
                          >
                            <option value="OK">OK</option>
                            <option value="NG">NG</option>
                          </select>
                        </div>
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
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={displayLot.rawDimensions.straightness.actual}
                            onChange={(e) =>
                              setEditLot((prev) => {
                                if (!prev) return null;
                                const updatedLot: IqcLotItem = {
                                  ...prev,
                                  rawDimensions: {
                                    ...prev.rawDimensions,
                                    straightness: {
                                      ...prev.rawDimensions.straightness,
                                      actual: e.target.value
                                    }
                                  }
                                };
                                updatedLot.inspectionResult = calculateIqcOverallResult(updatedLot);
                                return updatedLot;
                              })
                            }
                            className="w-24 px-1.5 py-0.5 text-right text-xs font-bold border rounded bg-white dark:bg-slate-900"
                          />
                          <select
                            value={displayLot.rawDimensions.straightness.result}
                            onChange={(e) => {
                              const res = e.target.value as 'OK' | 'NG';
                              setEditLot((prev) => {
                                if (!prev) return null;
                                const updatedLot: IqcLotItem = {
                                  ...prev,
                                  rawDimensions: {
                                    ...prev.rawDimensions,
                                    straightness: { ...prev.rawDimensions.straightness, result: res }
                                  }
                                };
                                updatedLot.inspectionResult = calculateIqcOverallResult(updatedLot);
                                return updatedLot;
                              });
                            }}
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                              displayLot.rawDimensions.straightness.result === 'OK'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-rose-50 text-rose-700 border-rose-300'
                            }`}
                          >
                            <option value="OK">OK</option>
                            <option value="NG">NG</option>
                          </select>
                        </div>
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
                  {isEditMode ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-500">UT 판정:</span>
                      <select
                        value={displayLot.utInspection.result}
                        onChange={(e) => {
                          const res = e.target.value as 'PASS' | 'FAIL';
                          setEditLot((prev) => {
                            if (!prev) return null;
                            const updatedLot: IqcLotItem = {
                              ...prev,
                              utInspection: {
                                ...prev.utInspection,
                                result: res,
                                defectFound: res === 'FAIL'
                              }
                            };
                            updatedLot.inspectionResult = calculateIqcOverallResult(updatedLot);
                            return updatedLot;
                          });
                        }}
                        className={`text-[10px] font-black px-2 py-0.5 rounded border cursor-pointer ${
                          displayLot.utInspection.result === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                      >
                        <option value="PASS">PASS</option>
                        <option value="FAIL">FAIL</option>
                      </select>
                    </div>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      displayLot.utInspection.result === 'PASS'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      UT 판정: {displayLot.utInspection.result}
                    </span>
                  )}
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
                    <option value="DLC (Diamond-Like Carbon) 초정밀 박막 코팅">DLC 코팅 외주품</option>
                    <option value="Hastelloy C-276 (초내식 합금)">Hastelloy C-276</option>
                    <option value="Inconel 625 (초내열/내식 특수합금)">Inconel 625</option>
                    <option value="SUS304-CSP 초정밀 심 플레이트">SUS304 심 플레이트</option>
                    <option value="Ti-6Al-4V (Grade 5 티타늄 합금)">Ti-6Al-4V</option>
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

              <div>
                <label className="block text-slate-500 font-bold mb-1">투입 프로젝트 (선택 또는 직접입력)</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    list="new-lot-project-options"
                    value={newLotForm.projectRef}
                    onChange={(e) => setNewLotForm({ ...newLotForm, projectRef: e.target.value })}
                    placeholder="예: 세메스 1580mm 슬롯다이 바디"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-xs"
                  />
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setNewLotForm({ ...newLotForm, projectRef: e.target.value });
                      }
                    }}
                    className="px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-xs cursor-pointer text-slate-600 dark:text-slate-300"
                  >
                    <option value="">선택</option>
                    {effectiveProjects.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <datalist id="new-lot-project-options">
                    {effectiveProjects.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
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
                  onClick={handlePrintDocument}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition active:scale-95"
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
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 gap-2">
                {/* Left: Logo container */}
                <div className="w-[150px] shrink-0 flex items-center justify-start">
                  <img
                    src="https://sign.mail.worksmobile.com/signature/logo/kr1/5ZbZaxUwKAgZaxUwBqM-aAM./SqbwKAgmKAuZFxKZKqg9aAJjaAuZaxEdKo2rKA2rFob."
                    alt="JUN SUNG TECH"
                    className="h-8 w-auto object-contain select-none"
                    style={{ height: '32px', maxHeight: '32px' }}
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Center: Centered Document Title */}
                <div className="flex-1 text-center min-w-0 px-2 flex flex-col items-center justify-center">
                  <h1 className="text-base sm:text-lg font-black tracking-tight uppercase font-sans text-slate-950 leading-tight whitespace-nowrap">
                    원소재 수입 검사 성적서
                  </h1>
                  <h2 className="text-xs font-bold text-slate-700 tracking-wider">
                    (IQC INSPECTION REPORT)
                  </h2>
                  <p className="text-[10px] text-slate-600 mt-0.5 font-mono">
                    성적서 관리번호: {displayLot.id} &nbsp;|&nbsp; 밀시트 No: {displayLot.millSheetNo}
                  </p>
                </div>

                {/* Right: Approval Stamp Table */}
                <div className="w-[150px] shrink-0 flex justify-end">
                  <table className="w-[140px] border-collapse border-[1.5px] border-slate-900 text-center text-[10px] bg-white">
                    <thead>
                      <tr className="bg-slate-100 border-b-[1.5px] border-slate-900 font-bold text-slate-950">
                        <th className="w-1/2 py-1 border-r-[1.5px] border-slate-900 text-center font-bold">
                          작성 / 검사
                        </th>
                        <th className="w-1/2 py-1 text-center font-bold">
                          승인 / QA
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="h-11 text-xs font-bold text-slate-950">
                        <td className="w-1/2 border-r-[1.5px] border-slate-900 align-middle text-center">
                          {((isEditMode && editLot ? editLot.inspector : displayLot.inspector) || effectiveInspectors[0] || '검사원').split(' ')[0]}
                        </td>
                        <td className="w-1/2 align-middle text-center relative">
                          <span>{((isEditMode && editLot ? editLot.approver : displayLot.approver) || effectiveQaManagers[0] || '관리자').split(' ')[0]}</span>
                          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-rose-600 text-rose-600 font-bold text-[8px] flex items-center justify-center rotate-12 opacity-80 pointer-events-none">
                            인
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
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
                    <th className="p-2 bg-slate-100 text-left">연계 프로젝트</th>
                    <td className="p-2 font-bold text-blue-900">{displayLot.projectRef || '일반 입고 모재'}</td>
                  </tr>
                  <tr className="border-b border-slate-900 divide-x divide-slate-900">
                    <th className="p-2 bg-slate-100 text-left">공급처 / Heat No</th>
                    <td className="p-2">{displayLot.supplier} ({displayLot.heatNo})</td>
                    <th className="p-2 bg-slate-100 text-left">입고일시</th>
                    <td className="p-2 font-mono">{displayLot.incomingDate}</td>
                  </tr>
                  <tr className="divide-x divide-slate-900">
                    <th className="p-2 bg-slate-100 text-left">검사 / 승인자</th>
                    <td className="p-2">{(isEditMode && editLot ? editLot.inspector : displayLot.inspector) || effectiveInspectors[0] || ''} / ${(isEditMode && editLot ? editLot.approver : displayLot.approver) || effectiveQaManagers[0] || ''}</td>
                    <th className="p-2 bg-slate-100 text-left">종합 판정</th>
                    <td className="p-2 font-black text-emerald-700">PASS (전수 합격)</td>
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
                <span>(주)준성테크 품질보증팀 (JUNSUNG TECH QA TEAM)</span>
                <span>KOLAS 공인 시험 기준 준수</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
