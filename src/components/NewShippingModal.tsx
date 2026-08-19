import React, { useState } from 'react';
import { X, Plus, PackageCheck } from 'lucide-react';
import { ShippingProjectItem } from './QualityInspectionView';

interface NewShippingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddShipping: (newShipping: ShippingProjectItem) => void;
  inspectors: string[];
  qaManagers: string[];
  currentUser?: { name: string; role?: string } | null;
}

export const NewShippingModal: React.FC<NewShippingModalProps> = ({
  isOpen,
  onClose,
  onAddShipping,
  inspectors,
  qaManagers,
  currentUser
}) => {
  const currentUserName = currentUser?.name?.trim() || '';
  const currentUserTitle = currentUser ? `${currentUser.name} (${currentUser.role === 'ADMIN' ? 'QA 총괄/관리자' : '품질 검사원'})` : '';

  const effectiveInspectors = React.useMemo(() => {
    const list = [...inspectors];
    if (currentUserTitle && !list.includes(currentUserTitle)) {
      return [currentUserTitle, currentUserName, ...list.filter(item => item !== currentUserName && item !== currentUserTitle)];
    } else if (currentUserName && !list.some(item => item.startsWith(currentUserName))) {
      return [currentUserName, ...list];
    }
    return list.length > 0 ? list : ['김준성 책임연구원 (KOLAS 공인)'];
  }, [currentUserTitle, currentUserName, inspectors]);

  const effectiveQaManagers = React.useMemo(() => {
    const list = [...qaManagers];
    if (currentUser?.role === 'ADMIN' && currentUserName) {
      const adminTitle = `${currentUserName} (QA 관리자)`;
      if (!list.includes(adminTitle)) {
        return [adminTitle, currentUserName, ...list.filter(item => item !== currentUserName && item !== adminTitle)];
      }
    } else if (currentUserName && !list.some(item => item.startsWith(currentUserName))) {
      return [currentUserName, ...list];
    }
    return list.length > 0 ? list : ['이준혁 품질보증총괄이사'];
  }, [currentUser, currentUserName, qaManagers]);

  const [orderId, setOrderId] = useState<string>(`ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [orderName, setOrderName] = useState<string>('2차전지 전극 코팅용 슬롯다이 완제품 세트 (1500L)');
  const [customer, setCustomer] = useState<string>('SK온 서산공장 E-Mobility 라인');
  const [productSpec, setProductSpec] = useState<string>('Precision Slot Die Set 1500L (Upper+Lower+Shim 40㎛)');
  const [lotNo, setLotNo] = useState<string>(`LOT-260520-SK${Math.floor(10 + Math.random() * 90)}`);
  const [coaNo, setCoaNo] = useState<string>(`COA-2026-0818-${Math.floor(1000 + Math.random() * 9000)}`);
  const [material, setMaterial] = useState<string>('STS630 (H1025 열처리)');
  const [hardness, setHardness] = useState<string>('HRC 39.5');
  const [roughnessValue, setRoughnessValue] = useState<string>('Ra 0.015㎛');
  const [coatingValue, setCoatingValue] = useState<string>('Hard Chrome 15.0㎛');
  const [inspector, setInspector] = useState<string>(
    currentUserTitle || currentUserName || inspectors[0] || '김준성 책임연구원 (KOLAS 공인)'
  );
  const [qaManager, setQaManager] = useState<string>(
    (currentUser?.role === 'ADMIN' && currentUserName ? `${currentUserName} (QA 관리자)` : qaManagers[0]) || '이준혁 품질보증총괄이사'
  );
  const [shippingStatus, setShippingStatus] = useState<'APPROVED' | 'PENDING' | 'REJECTED'>('PENDING');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newItem: ShippingProjectItem = {
      id: `SHP-2026-${Math.floor(100 + Math.random() * 900)}`,
      orderId,
      orderName,
      customer,
      productSpec,
      lotNo,
      cmmStatus: 'PASS',
      roughnessStatus: 'PASS',
      roughnessValue,
      coatingStatus: 'PASS',
      coatingValue,
      cleaningStatus: 'PASS',
      shippingStatus,
      coaNo,
      issueDate: new Date().toISOString().slice(0, 10),
      material,
      hardness,
      inspector,
      qaManager,
      isArchived: false,
      checklist: {
        cmmPointScan: true,
        roughnessInterferometer: true,
        boltInterference: true,
        ultrasonicCleaning: true,
        cleanroomPackaging: shippingStatus === 'APPROVED'
      }
    };

    onAddShipping(newItem);
    onClose();
  };

  return (
    <div
      id="new-shipping-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="new-shipping-modal-container"
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">신규 출하 검수 & COA 프로젝트 등록</h3>
              <p className="text-[11px] text-slate-400">출하 보증 검사 대장 및 공식 성적서 발급 큐 생성</p>
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
                수주 관리 번호
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                COA 성적서 번호
              </label>
              <input
                type="text"
                value={coaNo}
                onChange={(e) => setCoaNo(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-emerald-600 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              수주 프로젝트명
            </label>
            <input
              type="text"
              value={orderName}
              onChange={(e) => setOrderName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                고객사명
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
                관리 LOT No.
              </label>
              <input
                type="text"
                value={lotNo}
                onChange={(e) => setLotNo(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              제품 사양 및 상세 모델
            </label>
            <input
              type="text"
              value={productSpec}
              onChange={(e) => setProductSpec(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                소재 및 열처리 사양
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                경도 (Hardness)
              </label>
              <input
                type="text"
                value={hardness}
                onChange={(e) => setHardness(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                표면 조도 (Ra)
              </label>
              <input
                type="text"
                value={roughnessValue}
                onChange={(e) => setRoughnessValue(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                도금/코팅 두께
              </label>
              <input
                type="text"
                value={coatingValue}
                onChange={(e) => setCoatingValue(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                검사 책임자
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
                QA 부서장 승인자
              </label>
              <select
                value={qaManager}
                onChange={(e) => setQaManager(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
              >
                {effectiveQaManagers.map((mgr) => (
                  <option key={mgr} value={mgr}>
                    {mgr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                출하 판정 상태
              </label>
              <select
                value={shippingStatus}
                onChange={(e) => setShippingStatus(e.target.value as 'APPROVED' | 'PENDING' | 'REJECTED')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
              >
                <option value="PENDING">출하 검수 대기 (PENDING)</option>
                <option value="APPROVED">출하 승인 완료 (APPROVED)</option>
                <option value="REJECTED">출하 보류/반려 (REJECTED)</option>
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>출하 프로젝트 등록</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
