import { InspectionItem, ShippingProjectItem, CmmMachineInfo } from '../types/quality';

export const DEFAULT_INSPECTION_DATA: InspectionItem[] = [
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
    inspector: '품질 검사원 (KOLAS)',
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

export const SHIPPING_PROJECTS: ShippingProjectItem[] = [
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
    inspector: '품질 검사원 (KOLAS)',
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

const INSPECTIONS_STORAGE_KEY = 'mes_inspections_data_v1';
const SHIPPING_STORAGE_KEY = 'mes_shipping_projects_v1';

export function getStoredInspections(): InspectionItem[] {
  try {
    const raw = localStorage.getItem(INSPECTIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse inspections from localStorage', e);
  }
  return DEFAULT_INSPECTION_DATA;
}

export function saveStoredInspections(items: InspectionItem[]): void {
  try {
    localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('mes_inspections_updated', { detail: items }));
  } catch (e) {
    console.warn('Failed to save inspections to localStorage', e);
  }
}

export function getStoredShippingProjects(): ShippingProjectItem[] {
  try {
    const raw = localStorage.getItem(SHIPPING_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse shipping projects from localStorage', e);
  }
  return SHIPPING_PROJECTS;
}

export function saveStoredShippingProjects(items: ShippingProjectItem[]): void {
  try {
    localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('mes_shipping_updated', { detail: items }));
  } catch (e) {
    console.warn('Failed to save shipping projects to localStorage', e);
  }
}
