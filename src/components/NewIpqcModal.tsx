import React, { useState } from 'react';
import { X, Plus, Activity, Layers, Gauge } from 'lucide-react';
import { InspectionItem, MeasurementPoint } from './QualityInspectionView';

interface NewIpqcModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddInspection: (newItem: InspectionItem) => void;
  inspectors: string[];
  currentUser?: { name: string; role?: string } | null;
}

export const NewIpqcModal: React.FC<NewIpqcModalProps> = ({
  isOpen,
  onClose,
  onAddInspection,
  inspectors,
  currentUser
}) => {
  const currentUserName = currentUser?.name?.trim() || '';
  const currentUserTitle = currentUser ? `${currentUser.name} (${currentUser.role === 'ADMIN' ? 'QA 총괄/관리자' : '품질 검사원'})` : '';

  // Combine inspectors ensuring currentUser is prioritized at top
  const effectiveInspectors = React.useMemo(() => {
    const list = [...inspectors];
    if (currentUserTitle && !list.includes(currentUserTitle)) {
      return [currentUserTitle, currentUserName, ...list.filter(item => item !== currentUserName && item !== currentUserTitle)];
    } else if (currentUserName && !list.some(item => item.startsWith(currentUserName))) {
      return [currentUserName, ...list];
    }
    return list.length > 0 ? list : ['김준성 책임연구원 (KOLAS 공인)'];
  }, [currentUserTitle, currentUserName, inspectors]);

  const [id, setId] = useState<string>(`CMM-260521-${Math.floor(100 + Math.random() * 900)}`);
  const [orderId, setOrderId] = useState<string>(`ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [productName, setProductName] = useState<string>('2차전지 슬롯다이 상부 바디 (Upper Body 1400L)');
  const [customer, setCustomer] = useState<string>('삼성SDI 천안사업장');
  const [line, setLine] = useState<string>('LINE 1 (클린룸 #1)');
  const [lotNo, setLotNo] = useState<string>(`LOT-260520-${Math.floor(100 + Math.random() * 900)}`);
  const [cmmDevice, setCmmDevice] = useState<string>('CMM-01 (Zeiss Prismo)');
  const [programName, setProgramName] = useState<string>('SLOT_DIE_1400_UPPER_V3');
  const [lipWidthMm, setLipWidthMm] = useState<number>(1400);
  const [inspector, setInspector] = useState<string>(
    currentUserTitle || currentUserName || inspectors[0] || '김준성 책임연구원 (KOLAS 공인)'
  );
  const [result, setResult] = useState<'PASS' | 'FAIL' | 'REINSPECT'>('PASS');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const initialMeasurements: MeasurementPoint[] = [
      {
        no: 1,
        code: 'P1',
        item: '립 중앙 토출 갭 (Center Gap)',
        nominal: 50.00,
        actual: result === 'FAIL' ? 51.42 : 50.15,
        tolerance: '±0.80',
        deviation: result === 'FAIL' ? '+1.42' : '+0.15',
        unit: '㎛',
        status: result === 'FAIL' ? 'NG' : 'OK',
        pos3D: { x: 0, y: 15, z: 0 }
      },
      {
        no: 2,
        code: 'P2',
        item: '립 좌측 엔드 갭 (Left Lip Gap)',
        nominal: 50.00,
        actual: 50.22,
        tolerance: '±0.80',
        deviation: '+0.22',
        unit: '㎛',
        status: 'OK',
        pos3D: { x: -80, y: 15, z: 0 }
      },
      {
        no: 3,
        code: 'P3',
        item: '립 우측 엔드 갭 (Right Lip Gap)',
        nominal: 50.00,
        actual: 50.31,
        tolerance: '±0.80',
        deviation: '+0.31',
        unit: '㎛',
        status: 'OK',
        pos3D: { x: 80, y: 15, z: 0 }
      },
      {
        no: 4,
        code: 'P4',
        item: '경면부 진직도/평면도 (Flatness)',
        nominal: 0.00,
        actual: 0.65,
        tolerance: '≤ 1.00',
        deviation: '+0.65',
        unit: '㎛',
        status: 'OK',
        pos3D: { x: 0, y: 0, z: 20 }
      },
      {
        no: 5,
        code: 'P5',
        item: '볼트 체결 홀 피치 (M8 Hole H7)',
        nominal: 45.00,
        actual: 45.008,
        tolerance: '±0.015',
        deviation: '+0.008',
        unit: 'mm',
        status: 'OK',
        pos3D: { x: -40, y: -20, z: 10 }
      }
    ];

    const newItem: InspectionItem = {
      id,
      orderId,
      productName,
      customer,
      line,
      lotNo,
      inspectTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
      cmmDevice,
      programName,
      inspector,
      result,
      defectType: result === 'FAIL' ? '립 간격(Lip Gap) 단차 불량' : undefined,
      lipWidthMm,
      isArchived: false,
      measurements: initialMeasurements,
      capa: {
        step: result === 'PASS' ? 5 : 2,
        defectOccurred: {
          id: result === 'FAIL' ? `CAPA-${id}` : '-',
          type: result === 'FAIL' ? '립 편차 초과 감지' : '특이사항 없음',
          time: new Date().toISOString().slice(0, 16).replace('T', ' '),
          desc: result === 'FAIL' ? 'CMM 전수 검사 중 실측치 이탈' : '-'
        },
        causeAnalysis: {
          reason: result === 'FAIL' ? '가공 잔류 응력 이완' : '-',
          toolOrJig: result === 'FAIL' ? 'JIG-1400-A' : '-',
          details: '-',
          time: '-'
        },
        correctiveAction: {
          action: result === 'FAIL' ? '정밀 재래핑 및 재가공 예정' : '-',
          changeDetails: '-',
          time: '-'
        },
        reinspection: { id: '-', time: '-', result: result === 'PASS' ? '합격' : '대기' },
        finalVerdict: {
          result: result === 'PASS' ? '전항목 규격 내 합격 (PASS)' : '시정조치 진행중',
          time: new Date().toISOString().slice(0, 16).replace('T', ' '),
          approver: '품질보증팀장 이준혁'
        }
      }
    };

    onAddInspection(newItem);
    onClose();
  };

  return (
    <div
      id="new-ipqc-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="new-ipqc-modal-container"
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">신규 공정검사(IPQC) 3D CMM 검사 등록</h3>
              <p className="text-[11px] text-slate-400">슬롯다이 가공 공정 중 정밀 측정 항목 및 큐 생성</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                검사 식별 ID
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                수주 번호
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              품목명 / 슬롯다이 모델
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                납품 고객사
              </label>
              <input
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                가공 라인
              </label>
              <select
                value={line}
                onChange={(e) => setLine(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="LINE 1 (클린룸 #1)">LINE 1 (클린룸 #1)</option>
                <option value="LINE 2 (클린룸 #2)">LINE 2 (클린룸 #2)</option>
                <option value="LINE 3 (클린룸 #1)">LINE 3 (클린룸 #1)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                관리 LOT 번호
              </label>
              <input
                type="text"
                value={lotNo}
                onChange={(e) => setLotNo(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-blue-600 dark:text-blue-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                CMM 측정기
              </label>
              <select
                value={cmmDevice}
                onChange={(e) => setCmmDevice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="CMM-01 (Zeiss Prismo)">CMM-01 (Zeiss Prismo)</option>
                <option value="CMM-02 (Mitutoyo Crysta)">CMM-02 (Mitutoyo Crysta)</option>
                <option value="CMM-03 (덕인 Horizon)">CMM-03 (덕인 Horizon)</option>
                <option value="CMM-04 (Zeiss Accura)">CMM-04 (Zeiss Accura)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                측정 프로그램
              </label>
              <input
                type="text"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                슬롯 폭 (Lip Width mm)
              </label>
              <input
                type="number"
                value={lipWidthMm}
                onChange={(e) => setLipWidthMm(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                검사 담당자
              </label>
              <select
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
              >
                {effectiveInspectors.map((insp) => (
                  <option key={insp} value={insp}>
                    {insp}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                초기 검사 판정
              </label>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value as 'PASS' | 'FAIL' | 'REINSPECT')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
              >
                <option value="PASS">PASS (합격)</option>
                <option value="FAIL">FAIL (불합격/CAPA 진행)</option>
                <option value="REINSPECT">REINSPECT (재검사 대상)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold transition cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>검사 항목 등록</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
