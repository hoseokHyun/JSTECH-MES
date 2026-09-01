import React, { useState } from 'react';
import {
  ShoppingCart,
  Copy,
  Layers,
  Sparkles,
  Save,
  CheckCircle2,
  Plus,
  Printer,
  ChevronDown,
  ChevronUp,
  Tag,
  Calendar,
  FileText,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  Clock,
  Filter,
  CheckSquare
} from 'lucide-react';
import { ProductType, Order } from '../../types';

interface OrderFormHeaderProps {
  customOrderId: string;
  setCustomOrderId: (val: string) => void;
  pjtNo: string;
  handlePjtNoChange: (val: string) => void;
  customer: string;
  setCustomer: (val: string) => void;
  pjtName: string;
  handlePjtNameChange: (val: string) => void;
  poNumber?: string;
  setPoNumber?: (val: string) => void;
  spec: string;
  setSpec: (val: string) => void;
  qty: number;
  handleQtyChange: (val: number) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  partName?: string;
  setPartName?: (val: string) => void;
  partType?: string;
  setPartType?: (val: string) => void;
  serialNo: string;
  setSerialNo: (val: string) => void;
  dueDate: string;
  setDueDate: (val: string) => void;
  memo: string;
  setMemo: (val: string) => void;
  specialNotes: string;
  setSpecialNotes: (val: string) => void;
  totalProcessesCount: number;
  completedStepsCount?: number;
  unassignedStepsCount?: number;
  conflictStepsCount?: number;
  assignedMachineRate: number;
  assignedWorkerRate: number;
  canEditOrder: boolean;
  onOpenArchiveModal: () => void;
  onOpenPreviewTraveler: () => void;
  onSmartAutoAllocate?: () => void;
  onOpenAiBatchModal?: () => void;
  onSubmit: (e: React.FormEvent) => void;
  productTypes: Record<string, ProductType>;
  typeId: string;
  setTypeId: (val: string) => void;
  getCurrentDateTimeString: () => string;
  onValidate: () => void;
  onSaveDraft: () => void;
  filterOnlyUnassigned?: boolean;
  setFilterOnlyUnassigned?: (val: boolean) => void;
  filterOnlyConflicts?: boolean;
  setFilterOnlyConflicts?: (val: boolean) => void;
  isOrderIdDuplicate?: boolean;
}

export const OrderFormHeader: React.FC<OrderFormHeaderProps> = ({
  customOrderId,
  setCustomOrderId,
  pjtNo,
  handlePjtNoChange,
  customer,
  setCustomer,
  pjtName,
  handlePjtNameChange,
  spec,
  setSpec,
  qty,
  handleQtyChange,
  startDate,
  setStartDate,
  serialNo,
  setSerialNo,
  dueDate,
  setDueDate,
  memo,
  setMemo,
  specialNotes,
  setSpecialNotes,
  totalProcessesCount,
  completedStepsCount = 0,
  unassignedStepsCount = 0,
  conflictStepsCount = 0,
  assignedMachineRate,
  assignedWorkerRate,
  canEditOrder,
  onOpenArchiveModal,
  onOpenPreviewTraveler,
  onSubmit,
  productTypes,
  typeId,
  setTypeId,
  onValidate,
  onSaveDraft,
  filterOnlyUnassigned = false,
  setFilterOnlyUnassigned,
  filterOnlyConflicts = false,
  setFilterOnlyConflicts,
  isOrderIdDuplicate = false,
}) => {
  const [isProcessTypeDropdownOpen, setIsProcessTypeDropdownOpen] = useState(false);

  const handleNotesChange = (val: string) => {
    setMemo(val);
    setSpecialNotes(val);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-3 space-y-2.5">
      {/* 1. Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
        {/* Left: 수주번호 & Title */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500">수주번호:</span>
            <span className="text-sm font-black font-mono text-slate-900">{customOrderId || 'ORD-2026-001'}</span>
            <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">작성중</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-bold border-l border-slate-200 pl-3">
            <span className="text-slate-400">MES 공정 스케줄러</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-extrabold">수주 등록 및 공정·설비·담당자 지정</span>
          </div>
        </div>

        {/* Right: Functional Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* 이전 수주 복사 */}
          <button
            type="button"
            onClick={onOpenArchiveModal}
            disabled={!canEditOrder}
            className="px-2.5 py-1.5 text-xs font-black rounded-lg transition flex items-center gap-1.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
            title="완료보관함/이전 수주건의 사양과 공정 구성을 복사합니다"
          >
            <Copy className="w-3.5 h-3.5 text-amber-600" />
            <span>이전 수주 복사</span>
          </button>

          {/* 표준 공정 마스터 드롭다운 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProcessTypeDropdownOpen(!isProcessTypeDropdownOpen)}
              className="px-2.5 py-1.5 text-xs font-black rounded-lg transition flex items-center gap-1.5 bg-white hover:bg-indigo-50 text-indigo-900 border border-indigo-300 shadow-2xs cursor-pointer active:scale-95"
              title="표준 공정 템플릿 선택 및 적용"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span className="truncate max-w-[130px]">
                {typeId === 'TYPE_CUSTOM' ? '✨ 커스텀 직접설계' : (productTypes[typeId]?.name?.replace(/\s*\(\d+단계\)/g, '') || '표준 공정')}
              </span>
              <ChevronDown className="w-3 h-3 text-indigo-400" />
            </button>

            {isProcessTypeDropdownOpen && (
              <div className="absolute left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                  표준 공정 마스터 템플릿
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  {Object.values(productTypes)
                    .filter((t) => t.id !== 'TYPE_CUSTOM')
                    .map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTypeId(t.id);
                          setIsProcessTypeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-bold transition flex items-center justify-between hover:bg-indigo-50 ${
                          typeId === t.id ? 'text-indigo-900 bg-indigo-50/70 font-black' : 'text-slate-700'
                        }`}
                      >
                        <span className="truncate">{t.name}</span>
                        {typeId === t.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                    ))}
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setTypeId('TYPE_CUSTOM');
                      setIsProcessTypeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-bold transition flex items-center justify-between hover:bg-blue-50 ${
                      typeId === 'TYPE_CUSTOM' ? 'text-blue-900 bg-blue-50 font-black' : 'text-blue-700'
                    }`}
                  >
                    <span>✨ 커스텀 직접 설계</span>
                    {typeId === 'TYPE_CUSTOM' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 임시저장 */}
          <button
            type="button"
            onClick={onSaveDraft}
            className="px-2.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs cursor-pointer active:scale-95"
            title="현재 수주 입력 정보 및 공정 구성을 브라우저에 임시 저장합니다"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>임시저장</span>
          </button>

          {/* 검증 버튼 + 인라인 검증 배지 */}
          <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-300">
            <button
              type="button"
              onClick={onValidate}
              className="px-2.5 py-1 text-xs font-black rounded-md transition flex items-center gap-1.5 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-2xs cursor-pointer active:scale-95"
              title="필수 입력 항목, 미지정 및 중복 충돌 실시간 검증"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>검증</span>
            </button>

            {/* Live Inline Feedback Badge */}
            <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold">
              {conflictStepsCount > 0 ? (
                <span className="text-rose-700 font-extrabold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  충돌 {conflictStepsCount}건
                </span>
              ) : unassignedStepsCount > 0 ? (
                <span className="text-amber-800 font-black">
                  미지정 {unassignedStepsCount}건
                </span>
              ) : (
                <span className="text-emerald-700 font-black flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  정상
                </span>
              )}
            </div>
          </div>

          {/* 공정이동표 미리보기/인쇄 */}
          <button
            type="button"
            onClick={onOpenPreviewTraveler}
            className="px-2.5 py-1.5 text-xs font-black rounded-lg transition flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs cursor-pointer active:scale-95"
            title="공정 이동표(Process Traveler) 미리보기 및 A4 인쇄"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-700" />
            <span>공정이동표</span>
          </button>

          {/* 수주 최종 등록 (Primary) */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canEditOrder}
            className="px-3.5 py-1.5 text-xs font-black rounded-lg transition flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
            title="수주를 최종 등록합니다 (Ctrl+Enter)"
          >
            <Plus className="w-4 h-4" />
            <span>수주 등록</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Meta Rows Section */}
      <div className="space-y-2">
        {/* Row 1: 수주 기본정보 (고객사, 프로젝트 번호, 프로젝트명/품명, 규격, 수량, 생산 시작일, 납기일) */}
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5 text-xs bg-slate-50/90 p-2.5 rounded-lg border border-slate-200">
          {/* 고객사 */}
          <div className="flex-[1.4] min-w-[130px]">
            <label className="text-[10px] font-black text-slate-500 block mb-0.5">고객사 *</label>
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="예: (주)테스트코리아"
              className="w-full font-extrabold text-slate-900 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-2.5 py-1.5 rounded-md text-xs truncate"
            />
          </div>

          {/* 프로젝트 번호 */}
          <div className="flex-[1.5] min-w-[135px]">
            <label className="text-[10px] font-black text-slate-500 block mb-0.5">프로젝트 번호 *</label>
            <input
              type="text"
              value={pjtNo}
              onChange={(e) => handlePjtNoChange(e.target.value)}
              placeholder="예: PRJ-2026-001"
              className="w-full font-mono font-black text-blue-900 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-2.5 py-1.5 rounded-md text-xs truncate"
            />
          </div>

          {/* 프로젝트명 / 품명 */}
          <div className="flex-[2.2] min-w-[180px]">
            <label className="text-[10px] font-black text-slate-500 block mb-0.5">프로젝트명 / 품명 *</label>
            <input
              type="text"
              value={pjtName}
              onChange={(e) => handlePjtNameChange(e.target.value)}
              placeholder="예: PNT Flex Bolt 2P SLOT DIE"
              className="w-full font-black text-slate-900 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-2.5 py-1.5 rounded-md text-xs truncate"
            />
          </div>

          {/* 규격 */}
          <div className="flex-[1.2] min-w-[100px]">
            <label className="text-[10px] font-black text-slate-500 block mb-0.5">규격</label>
            <input
              type="text"
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              placeholder="예: Φ650L"
              className="w-full font-bold text-slate-800 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-2.5 py-1.5 rounded-md text-xs truncate"
            />
          </div>

          {/* 수량 */}
          <div className="w-20 shrink-0">
            <label className="text-[10px] font-black text-slate-500 block mb-0.5 text-center">수량</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => handleQtyChange(parseInt(e.target.value) || 1)}
              className="w-full font-mono font-black text-blue-900 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-2 py-1.5 rounded-md text-xs text-center"
            />
          </div>

          {/* 생산 시작일 */}
          <div className="flex-[1.3] min-w-[135px]">
            <label className="text-[10px] font-black text-slate-500 block mb-0.5">생산 시작일</label>
            <input
              type="date"
              value={startDate ? startDate.split('T')[0] : ''}
              onChange={(e) => setStartDate(`${e.target.value}T${startDate.split('T')[1] || '08:00'}`)}
              className="w-full font-mono font-extrabold text-slate-800 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-2 py-1.5 rounded-md text-xs"
            />
          </div>

          {/* 납기일 */}
          <div className="flex-[1.3] min-w-[135px]">
            <label className="text-[10px] font-black text-slate-500 block mb-0.5">납기일</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full font-mono font-extrabold text-slate-800 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-2 py-1.5 rounded-md text-xs"
            />
          </div>
        </div>

        {/* Row 2: 수주번호 직접 수정, 각인번호, 수주 비고 및 특이사항 */}
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5 text-xs bg-slate-50/70 p-2.5 rounded-lg border border-slate-200">
          {/* 수주번호 직접 수정 */}
          <div className="flex-[1.4] min-w-[160px]">
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-[10px] font-black text-slate-500">수주번호 직접 수정</label>
              {isOrderIdDuplicate && (
                <span className="text-[9.5px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                  중복 번호
                </span>
              )}
            </div>
            <input
              type="text"
              value={customOrderId}
              onChange={(e) => setCustomOrderId(e.target.value)}
              placeholder="예: ORD-2026-001"
              className={`w-full font-mono font-black bg-white border px-2.5 py-1.5 rounded-md text-xs truncate transition ${
                isOrderIdDuplicate
                  ? 'border-rose-400 text-rose-700 focus:ring-1 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/30'
                  : 'border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              }`}
            />
          </div>

          {/* 각인번호 (Serial No.) */}
          <div className="flex-[2] min-w-[180px]">
            <label className="text-[10px] font-black text-slate-500 block mb-0.5">각인번호 (Serial No.)</label>
            <input
              type="text"
              value={serialNo}
              onChange={(e) => setSerialNo(e.target.value)}
              placeholder="예: PRJ-2026-001-001~003"
              className="w-full font-mono font-bold text-slate-900 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-2.5 py-1.5 rounded-md text-xs truncate"
            />
          </div>

          {/* 수주 비고 및 특이사항 */}
          <div className="flex-[4] min-w-[240px]">
            <label className="text-[10px] font-black text-slate-500 block mb-0.5">수주 비고 및 특이사항</label>
            <input
              type="text"
              value={memo || specialNotes || ''}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="예: 공정 간 인수인계 철저히 할 것!"
              className="w-full font-bold text-slate-900 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-2.5 py-1.5 rounded-md text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
