import React, { useState, useEffect, useRef } from 'react';
import {
  Order,
  ProductType,
  ProcessProgressMap,
  ProcessStep,
  User
} from '../types';
import { MCT_MACHINES, GRINDER_MACHINES, CMM_MACHINES, ALL_EQUIPMENT_LIST } from '../data/defaultData';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import {
  ShoppingCart,
  Plus,
  Calendar,
  Layers,
  Cpu,
  UserCheck,
  Zap,
  Sliders,
  Gauge,
  CheckCircle2,
  HelpCircle,
  FileText,
  AlertCircle,
  Copy,
  Archive,
  Sparkles,
  X,
  Search,
  ArrowRight,
  Check
} from 'lucide-react';

interface OrderFormProps {
  productTypes: Record<string, ProductType>;
  orders: Record<string, Order>;
  approvedOperators: string[];
  onCreateOrder: (newOrder: Order, initialProgressMap?: ProcessProgressMap) => void;
  currentUser?: User | null;
  processProgressMap?: ProcessProgressMap;
  pendingCopyOrder?: Order | null;
  onClearPendingCopyOrder?: () => void;
}

interface StepAssignment {
  machine: string;
  worker: string;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  productTypes,
  orders,
  approvedOperators,
  onCreateOrder,
  currentUser,
  processProgressMap,
  pendingCopyOrder,
  onClearPendingCopyOrder,
}) => {
  const canEditOrder =
    !currentUser ||
    currentUser.role === 'ADMIN' ||
    currentUser.permissions?.canEditOrder === true;
  const getCurrentDateTimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState<string>(
    Object.keys(productTypes)[0] || 'TYPE_SLIT_NOZZLE'
  );
  const [qty, setQty] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>(getCurrentDateTimeString);
  const [memo, setMemo] = useState<string>('');

  // Per-step machine & worker assignment state
  const [stepAssignments, setStepAssignments] = useState<Record<number, StepAssignment>>({});

  // Archive copy state
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveSearchTerm, setArchiveSearchTerm] = useState('');
  const [copiedSourceOrder, setCopiedSourceOrder] = useState<Order | null>(null);
  const skipTypeResetRef = useRef(false);

  const selectedType = productTypes[typeId];

  // List of completed / archived orders available for copying
  const completedOrArchivedOrders = (Object.values(orders) as Order[]).filter(
    (o) => o.archived || o.status === 'COMPLETED'
  );

  // Helper to copy process, machine, and worker specifications from an archived order
  const applyCopyFromOrder = (sourceOrder: Order) => {
    const targetTypeId = sourceOrder.typeId;
    if (productTypes[targetTypeId]) {
      skipTypeResetRef.current = true;
      setTypeId(targetTypeId);
    }

    const targetType = productTypes[targetTypeId] || selectedType;
    const processes =
      sourceOrder.customProcesses && sourceOrder.customProcesses.length > 0
        ? sourceOrder.customProcesses
        : targetType?.processes || [];

    const newAssignments: Record<number, StepAssignment> = {};

    processes.forEach((proc, idx) => {
      let machine = '';
      let worker = '';

      if (processProgressMap) {
        const keys = Object.keys(processProgressMap);
        const exactKey = `${sourceOrder.id}_Q1_P${idx}`;
        if (processProgressMap[exactKey]) {
          machine = processProgressMap[exactKey].machine || '';
          worker = processProgressMap[exactKey].worker || '';
        } else {
          const fuzzyKey = keys.find(
            (k) => k.startsWith(`${sourceOrder.id}_`) && k.endsWith(`_P${idx}`)
          );
          if (fuzzyKey && processProgressMap[fuzzyKey]) {
            machine = processProgressMap[fuzzyKey].machine || '';
            worker = processProgressMap[fuzzyKey].worker || '';
          }
        }
      }

      if (!machine) machine = proc.assignedMachine || '';

      newAssignments[idx] = {
        machine,
        worker,
      };
    });

    setStepAssignments(newAssignments);
    setName(`[재수주] ${sourceOrder.name}`);
    setQty(sourceOrder.qty || 1);
    setMemo(`[완료보관함 사양복사] 원본수주: ${sourceOrder.id} (${sourceOrder.name})`);
    setStartDate(getCurrentDateTimeString());
    setCopiedSourceOrder(sourceOrder);
    setIsArchiveModalOpen(false);
  };

  // Handle pendingCopyOrder passed from parent (e.g., from ArchiveView)
  useEffect(() => {
    if (pendingCopyOrder) {
      applyCopyFromOrder(pendingCopyOrder);
      if (onClearPendingCopyOrder) {
        onClearPendingCopyOrder();
      }
    }
  }, [pendingCopyOrder]);

  // Options for Equipment Searchable Select
  const equipmentOptions: SelectOption[] = [
    { value: '', label: '(미지정)' },
    ...MCT_MACHINES.map((m) => ({
      value: m,
      label: m,
      badge: 'MCT가공',
      badgeColor: 'bg-indigo-100 text-indigo-800 border border-indigo-200'
    })),
    ...GRINDER_MACHINES.map((m) => ({
      value: m,
      label: m,
      badge: '연마설비',
      badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-200'
    })),
    ...CMM_MACHINES.map((m) => ({
      value: m,
      label: m,
      badge: 'CMM측정',
      badgeColor: 'bg-purple-100 text-purple-800 border border-purple-200'
    })),
    { value: '(외주/협력사)', label: '(외주/협력사)', badge: '외주', badgeColor: 'bg-amber-100 text-amber-800' }
  ];

  // Options for Operator Searchable Select
  const operatorOptions: SelectOption[] = [
    { value: '', label: '(미지정)' },
    ...approvedOperators.map((op) => ({
      value: op,
      label: op,
      badge: '승인회원',
      badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-200'
    }))
  ];

  // Initialize or reset step assignments whenever productType changes
  useEffect(() => {
    if (skipTypeResetRef.current) {
      skipTypeResetRef.current = false;
      return;
    }
    if (!selectedType || !selectedType.processes) return;

    const initialAssignments: Record<number, StepAssignment> = {};
    selectedType.processes.forEach((proc, idx) => {
      let defaultMachine = '';
      if (proc.category === '가공') {
        defaultMachine = MCT_MACHINES[idx % MCT_MACHINES.length] || MCT_MACHINES[0];
      } else if (proc.category === '연마') {
        defaultMachine = GRINDER_MACHINES[idx % GRINDER_MACHINES.length] || GRINDER_MACHINES[0];
      } else if (proc.category === '품질') {
        defaultMachine = CMM_MACHINES[idx % CMM_MACHINES.length] || CMM_MACHINES[0];
      } else if (proc.category === '외주') {
        defaultMachine = '(외주/협력사)';
      }

      const defaultWorker = approvedOperators.length > 0 ? (approvedOperators[idx % approvedOperators.length] || '') : '';

      initialAssignments[idx] = {
        machine: defaultMachine,
        worker: defaultWorker,
      };
    });

    setStepAssignments(initialAssignments);
  }, [typeId, productTypes, approvedOperators]);

  const handleStepMachineChange = (stepIdx: number, machine: string) => {
    setStepAssignments((prev) => ({
      ...prev,
      [stepIdx]: {
        ...(prev[stepIdx] || { worker: '' }),
        machine,
      },
    }));
  };

  const handleStepWorkerChange = (stepIdx: number, worker: string) => {
    setStepAssignments((prev) => ({
      ...prev,
      [stepIdx]: {
        ...(prev[stepIdx] || { machine: '' }),
        worker,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditOrder) {
      alert('⚠️ 신규 수주 등록 권한이 없습니다.\n(현장담당자 계정은 신규 수주 등록 권한이 제한되어 있습니다. 관리자 또는 영업담당자 계정으로 로그인해주세요.)');
      return;
    }
    if (!name.trim()) {
      alert('수주번호 / 프로젝트명을 입력해주세요.');
      return;
    }

    const newId = `ORD-2026-${String(Object.keys(orders).length + 1).padStart(3, '0')}`;
    const firstMachine = stepAssignments[0]?.machine || MCT_MACHINES[0];

    const newOrder: Order = {
      id: newId,
      name: name.trim(),
      typeId,
      qty: Math.max(1, qty),
      startDate,
      status: 'IN_PROGRESS',
      archived: false,
      mctMachine: firstMachine,
      memo: memo.trim(),
    };

    // Construct initial processProgressMap for all units and all steps
    const initialProgressMap: ProcessProgressMap = {};
    const processes = selectedType?.processes || [];

    for (let q = 1; q <= Math.max(1, qty); q++) {
      processes.forEach((_, pIdx) => {
        const processKey = `${newId}_Q${q}_P${pIdx}`;
        const assign = stepAssignments[pIdx] || { machine: '', worker: '' };
        initialProgressMap[processKey] = {
          isCompleted: false,
          machine: assign.machine,
          worker: assign.worker,
        };
      });
    }

    onCreateOrder(newOrder, initialProgressMap);
    setName('');
    setMemo('');
    setStartDate(getCurrentDateTimeString());
    alert(`🎉 수주건 [${newOrder.name}] 및 각 공정별 설비/담당자 할당이 성공적으로 등록되었습니다!\n설비 가동판(OEE) 및 Gantt 타임라인에 실시간 연동되었습니다.`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 space-y-5">
      {!canEditOrder && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>⚠️ 현재 계정({currentUser?.name || '현장담당자'})은 수주 등록 권한이 없습니다. 수주 정보 등록/수주는 관리자 또는 영업담당자 계정 권한이 필요합니다.</span>
          </div>
          <span className="bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded text-[10px] font-black shrink-0">
            권한 제한됨
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>신규 수주 등록 & 공정별 설비/담당자 지정 (New Order & Routing Setup)</span>
            </h2>
            <p className="text-xs text-slate-500">
              수주 등록 시 공정별 담당 설비 및 공정 담당자를 검색/지정하면 설비 가동률(OEE) 및 타임라인에 실시간 연동됩니다.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsArchiveModalOpen(true)}
              disabled={!canEditOrder}
              className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              title="완료보관함 수주건의 공정 단계별 설비 및 담당자 정보를 복사하여 신규 수주에 적용합니다."
            >
              <Copy className="w-3.5 h-3.5 text-amber-600" />
              <span>완료보관함 공정 복사</span>
            </button>
            <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-black border border-slate-200 hidden sm:inline-block">
              총 {Object.keys(orders).length}건 수주 등록됨
            </span>
            <button
              type="submit"
              form="new-order-form"
              disabled={!canEditOrder}
              className={`px-5 py-2.5 font-black rounded-xl text-xs transition flex items-center gap-2 shadow-md shrink-0 ${
                canEditOrder
                  ? 'bg-[#00C4B4] hover:bg-[#00a89a] text-white cursor-pointer hover:shadow-lg'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60'
              }`}
              title={canEditOrder ? "신규 수주 등록" : "수주 등록 권한 없음 (관리자/영업 전용)"}
            >
              <Plus className="w-4 h-4 text-white" />
              <span>신규 수주 등록</span>
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>등록 시 모든 공정별 할당정보가 즉시 데이터베이스 및 OEE 가동판에 저장됩니다.</span>
          </div>
        </div>
      </div>

      {/* Banner if copied from archived order */}
      {copiedSourceOrder && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-xs flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 animate-bounce" />
            <div>
              <span className="font-extrabold text-emerald-950">
                [완료 보관함 사양 복사 완료]
              </span>{' '}
              <span>
                원본 수주 <strong className="underline font-bold">{copiedSourceOrder.name}</strong> ({copiedSourceOrder.id})의 공정 단계별 설비 및 담당자 설정이 불러와졌습니다.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCopiedSourceOrder(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
            title="알림 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form id="new-order-form" onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Basic Order Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          {/* Project Name */}
          <div className="lg:col-span-2">
            <label className="block font-bold text-slate-700 mb-1">
              수주번호 / 프로젝트명 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 삼성디스플레이 8.6세대 슬릿 노즐"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Product Type (BOP) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> 제품 타입 (BOP)
            </label>
            <select
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              {(Object.values(productTypes) as ProductType[]).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name.replace(/\s*\(\d+단계\)/g, '')} ({t.processes?.length || 0}개 공정)
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">생산 수량 (개)</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-black text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Start Date */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> 생산 시작일시
              </label>
              <button
                type="button"
                onClick={() => setStartDate(getCurrentDateTimeString())}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                title="현재 날짜/시간으로 초기화"
              >
                현재 일시 세팅
              </button>
            </div>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Memo */}
          <div className="lg:col-span-5">
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" /> 수주 주요 비고 / 특이사항
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="예: 클린룸 포장 필수, 와이어 EDM 외주업체 사전 알림 완료"
              className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg font-medium text-slate-800 bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Per-Process Step Assignment Section */}
        <div className="space-y-3 pt-1">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>공정 단계별 설비 및 공정 담당자 지정 (설비 가동률 자동 연동)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                선택한 BOP [{selectedType?.name}]의 각 공정별 담당 설비와 공정 담당자를 선택 또는 검색하여 할당할 수 있습니다.
              </p>
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              총 {selectedType?.processes?.length || 0}개 공정 단계
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                <tr>
                  <th className="p-3 w-12 text-center">순서</th>
                  <th className="p-3 min-w-[180px]">공정명 (Process Step)</th>
                  <th className="p-3 text-center w-24">공정 구분</th>
                  <th className="p-3 text-center w-24">소요시간</th>
                  <th className="p-3 min-w-[220px]">담당 설비 지정 (21대 중 검색/선택)</th>
                  <th className="p-3 min-w-[220px]">공정 담당자 지정 (회원가입 승인자)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-semibold">
                {selectedType?.processes?.map((proc: ProcessStep, idx: number) => {
                  const assign = stepAssignments[idx] || { machine: '', worker: '' };

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      {/* Step Number */}
                      <td className="p-3 text-center font-black text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Process Name */}
                      <td className="p-3 font-extrabold text-slate-900">
                        {proc.name}
                      </td>

                      {/* Category Badge */}
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                            proc.category === '가공'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : proc.category === '연마'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : proc.category === '외주'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}
                        >
                          {proc.category}
                        </span>
                      </td>

                      {/* Duration Hours */}
                      <td className="p-3 text-center font-mono font-bold text-slate-600">
                        {proc.durationHours}h
                      </td>

                      {/* Machine Select */}
                      <td className="p-2">
                        <SearchableSelect
                          options={equipmentOptions}
                          value={assign.machine}
                          onChange={(val) => handleStepMachineChange(idx, val)}
                          placeholder="담당 설비 검색 또는 선택"
                          icon={Cpu}
                        />
                      </td>

                      {/* Operator Select */}
                      <td className="p-2">
                        <SearchableSelect
                          options={operatorOptions}
                          value={assign.worker}
                          onChange={(val) => handleStepWorkerChange(idx, val)}
                          placeholder="공정 담당자 검색 또는 선택"
                          icon={UserCheck}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </form>

      {/* Modal: Copy Process Specifications from Archive Vault */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>완료 보관함 공정/설비/담당자 사양 복사</span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-extrabold border border-amber-200">
                      {completedOrArchivedOrders.length}건 보관 중
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    출하 완료된 이전 수주건의 공정 단계, 담당 설비 및 작업자 지정을 그대로 복사하여 신규 수주에 적용합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="수주명 또는 제품 타입 검색..."
                  value={archiveSearchTerm}
                  onChange={(e) => setArchiveSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              {/* List of Archived Orders */}
              <div className="space-y-2.5">
                {completedOrArchivedOrders.filter((ord) => {
                  if (!archiveSearchTerm.trim()) return true;
                  const term = archiveSearchTerm.toLowerCase();
                  const type = productTypes[ord.typeId];
                  return (
                    ord.name.toLowerCase().includes(term) ||
                    (type && type.name.toLowerCase().includes(term))
                  );
                }).length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-bold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Archive className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs text-slate-600">완료 보관함에 복사 가능한 수주가 없습니다.</p>
                  </div>
                ) : (
                  completedOrArchivedOrders
                    .filter((ord) => {
                      if (!archiveSearchTerm.trim()) return true;
                      const term = archiveSearchTerm.toLowerCase();
                      const type = productTypes[ord.typeId];
                      return (
                        ord.name.toLowerCase().includes(term) ||
                        (type && type.name.toLowerCase().includes(term))
                      );
                    })
                    .map((ord) => {
                      const type = productTypes[ord.typeId];
                      const processes =
                        ord.customProcesses && ord.customProcesses.length > 0
                          ? ord.customProcesses
                          : type?.processes || [];

                      return (
                        <div
                          key={ord.id}
                          className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-amber-400 hover:shadow-md transition space-y-2.5"
                        >
                          <div className="flex flex-wrap justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                  {ord.name}
                                </span>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold border border-slate-200">
                                  {ord.id}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                                <span>제품 타입: <strong className="text-slate-800">{type?.name || '커스텀'}</strong></span>
                                <span>•</span>
                                <span>수량: <strong className="text-slate-800">{ord.qty}개</strong></span>
                                <span>•</span>
                                <span>완료일시: <strong className="text-slate-700">{ord.completedAt || '-'}</strong></span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => applyCopyFromOrder(ord)}
                              className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 shrink-0"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>이 공정 사양 적용</span>
                            </button>
                          </div>

                          {/* Steps preview */}
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-500 mb-1.5">
                              📋 복사될 공정 단계별 설비 및 담당자 구성 ({processes.length}단계):
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {processes.map((proc, pIdx) => {
                                let m = proc.assignedMachine || '';
                                let w = '';
                                if (processProgressMap) {
                                  const exactKey = `${ord.id}_Q1_P${pIdx}`;
                                  if (processProgressMap[exactKey]) {
                                    m = processProgressMap[exactKey].machine || m;
                                    w = processProgressMap[exactKey].worker || '';
                                  } else {
                                    const keys = Object.keys(processProgressMap);
                                    const fuzzyKey = keys.find(
                                      (k) => k.startsWith(`${ord.id}_`) && k.endsWith(`_P${pIdx}`)
                                    );
                                    if (fuzzyKey && processProgressMap[fuzzyKey]) {
                                      m = processProgressMap[fuzzyKey].machine || m;
                                      w = processProgressMap[fuzzyKey].worker || '';
                                    }
                                  }
                                }

                                return (
                                  <div
                                    key={pIdx}
                                    className="bg-white border border-slate-200 p-1.5 rounded text-[11px] flex justify-between items-center"
                                  >
                                    <span className="font-bold text-slate-800 truncate mr-1">
                                      {pIdx + 1}. {proc.name}
                                    </span>
                                    <div className="flex items-center gap-1 text-[10px] shrink-0">
                                      <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded font-bold border border-blue-100">
                                        {m || '설비 미지정'}
                                      </span>
                                      <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold border border-emerald-100">
                                        {w || '담당자 미지정'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
