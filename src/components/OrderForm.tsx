import React, { useState, useEffect } from 'react';
import {
  Order,
  ProductType,
  ProcessProgressMap,
  ProcessStep
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
  FileText
} from 'lucide-react';

interface OrderFormProps {
  productTypes: Record<string, ProductType>;
  orders: Record<string, Order>;
  approvedOperators: string[];
  onCreateOrder: (newOrder: Order, initialProgressMap?: ProcessProgressMap) => void;
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
}) => {
  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState<string>(
    Object.keys(productTypes)[0] || 'TYPE_SLIT_NOZZLE'
  );
  const [qty, setQty] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>('2026-03-02T08:30');
  const [memo, setMemo] = useState<string>('');

  // Per-step machine & worker assignment state
  const [stepAssignments, setStepAssignments] = useState<Record<number, StepAssignment>>({});

  const selectedType = productTypes[typeId];

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
      badge: op.startsWith('담당자') ? '공정담당자' : '등록회원',
      badgeColor: op.startsWith('담당자')
        ? 'bg-blue-100 text-blue-800 border border-blue-200'
        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
    }))
  ];

  // Initialize or reset step assignments whenever productType changes
  useEffect(() => {
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

      const defaultWorker = approvedOperators[idx % approvedOperators.length] || `담당자 ${idx + 1}`;

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
    alert(`🎉 수주건 [${newOrder.name}] 및 각 공정별 설비/담당자 할당이 성공적으로 등록되었습니다!\n설비 가동판(OEE) 및 Gantt 타임라인에 실시간 연동되었습니다.`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
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

        <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-black border border-slate-200">
          총 {Object.keys(orders).length}건 수주 등록됨
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
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
                  {t.name} ({t.processes?.length || 0}개 공정)
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
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" /> 생산 시작일시
            </label>
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

        {/* Submit button bar */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 font-medium text-[11px]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>등록 시 모든 공정별 할당정보가 즉시 데이터베이스 및 OEE 가동판에 저장됩니다.</span>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-[#0B3A82] hover:bg-[#00C4B4] text-white font-black rounded-xl text-xs transition flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4 text-[#00C4B4]" />
            <span>신규 수주 저장 & 타임라인/설비 가동판 자동 연동</span>
          </button>
        </div>
      </form>
    </div>
  );
};
