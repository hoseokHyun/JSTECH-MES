import React, { useState } from 'react';
import { ProductType, ProcessCategory, User } from '../types';
import {
  GitMerge,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Clock,
  Layers,
  Save,
  Check
} from 'lucide-react';

interface ProductRoutingViewProps {
  productTypes: Record<string, ProductType>;
  currentUser?: User | null;
  onUpdateProductType: (updatedType: ProductType) => void;
  onSaveNewProductType?: (newType: ProductType) => void;
  onOpenNewTypeModal?: () => void;
  onOpenCopyTypeModal?: () => void;
}

export const ProductRoutingView: React.FC<ProductRoutingViewProps> = ({
  productTypes = {},
  currentUser,
  onUpdateProductType,
  onOpenNewTypeModal = () => {},
  onOpenCopyTypeModal = () => {},
}) => {
  const typeKeys = Object.keys(productTypes);
  const [activeTypeId, setActiveTypeId] = useState<string>(
    typeKeys[0] || 'TYPE_SLIT_NOZZLE'
  );

  const currentType = productTypes[activeTypeId];

  const handleProcessDurationChange = (index: number, newHours: number) => {
    if (!currentType) return;
    if (currentType.isReference && currentUser?.role !== 'ADMIN') {
      alert('표준 레퍼런스 공정은 관리자(ADMIN) 권한이 있어야 수정할 수 있습니다.');
      return;
    }

    const updatedProcesses = [...currentType.processes];
    updatedProcesses[index] = {
      ...updatedProcesses[index],
      durationHours: Math.max(0.01, newHours),
    };

    onUpdateProductType({
      ...currentType,
      processes: updatedProcesses,
    });
  };

  const handleProcessNameChange = (index: number, newName: string) => {
    if (!currentType) return;
    if (currentType.isReference && currentUser?.role !== 'ADMIN') {
      alert('표준 레퍼런스 공정은 관리자(ADMIN) 권한이 있어야 수정할 수 있습니다.');
      return;
    }

    const updatedProcesses = [...currentType.processes];
    updatedProcesses[index] = {
      ...updatedProcesses[index],
      name: newName,
    };

    onUpdateProductType({
      ...currentType,
      processes: updatedProcesses,
    });
  };

  const handleProcessCategoryChange = (index: number, newCategory: ProcessCategory) => {
    if (!currentType) return;
    if (currentType.isReference && currentUser?.role !== 'ADMIN') {
      alert('표준 레퍼런스 공정은 관리자(ADMIN) 권한이 있어야 수정할 수 있습니다.');
      return;
    }

    const updatedProcesses = [...currentType.processes];
    updatedProcesses[index] = {
      ...updatedProcesses[index],
      category: newCategory,
    };

    onUpdateProductType({
      ...currentType,
      processes: updatedProcesses,
    });
  };

  const handleAddStep = () => {
    if (!currentType) return;
    if (currentType.isReference && currentUser?.role !== 'ADMIN') {
      alert('표준 레퍼런스 공정은 관리자(ADMIN) 권한이 있어야 수정할 수 있습니다.');
      return;
    }

    const updatedProcesses = [
      ...currentType.processes,
      {
        name: `신규 추가 공정 ${currentType.processes.length + 1}`,
        category: '가공' as ProcessCategory,
        durationHours: 2.0,
      },
    ];

    onUpdateProductType({
      ...currentType,
      processes: updatedProcesses,
    });
  };

  const handleRemoveStep = (index: number) => {
    if (!currentType) return;
    if (currentType.isReference && currentUser?.role !== 'ADMIN') {
      alert('표준 레퍼런스 공정은 관리자(ADMIN) 권한이 있어야 수정할 수 있습니다.');
      return;
    }

    const updatedProcesses = currentType.processes.filter((_, i) => i !== index);

    onUpdateProductType({
      ...currentType,
      processes: updatedProcesses,
    });
  };

  const totalTypeHours = currentType
    ? currentType.processes.reduce((acc, p) => acc + p.durationHours, 0)
    : 0;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md border border-slate-800 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <GitMerge className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>공정 라우팅 & 표준시간 관리 (BOP Master)</span>
            </h2>
            <p className="text-xs text-slate-400">
              준성테크 4대 대표 정밀 제품 타입별 상세 공정 라우팅 단계 및 표준 작업 시간(h)을 관리합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewTypeModal}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>신규 타입 생성</span>
          </button>
          <button
            onClick={onOpenCopyTypeModal}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
          >
            <span>📋 라우팅 복사</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Tabs & Right Step Editor */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Product Type Selector Tabs */}
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-extrabold text-slate-500 block uppercase tracking-wider px-1">
            제품 라우팅 마스터 목록
          </span>

          <div className="space-y-1">
            {(Object.values(productTypes) as ProductType[]).map((t) => {
              const isActive = t.id === activeTypeId;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTypeId(t.id)}
                  className={`w-full text-left p-3 rounded-lg text-xs font-bold transition flex items-center justify-between border ${
                    isActive
                      ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="flex items-center gap-1.5">
                      {t.isReference ? (
                        <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                      ) : (
                        <Unlock className="w-3 h-3 text-emerald-600 shrink-0" />
                      )}
                      <span className="truncate">{t.name.replace(/\s*\(\d+단계\)/g, '')}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      총 {t.processes.length}개 공정
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-extrabold text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded shrink-0">
                    {t.processes.reduce((acc, p) => acc + p.durationHours, 0).toFixed(1)}h
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Process Steps Table / Editor */}
        <div className="md:col-span-3 bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
          {currentType ? (
            <>
              {/* Routing Header */}
              <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-3 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {currentType.name}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-black border ${
                        currentType.isReference
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {currentType.isReference ? '🔒 표준 레퍼런스' : '✏️ 커스텀 공정'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    전체 공정 개수: <span className="font-bold text-slate-800">{currentType.processes.length}개</span> | 총 표준 작업시간: <span className="font-bold text-indigo-600">{totalTypeHours.toFixed(1)}시간</span>
                  </p>
                </div>

                <button
                  onClick={handleAddStep}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>공정 단계 추가</span>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10 shadow-2xs">
                    <tr>
                      <th className="p-2.5 w-12 text-center">순서</th>
                      <th className="p-2.5">공정명 (Process Step)</th>
                      <th className="p-2.5 text-center">공정 카테고리</th>
                      <th className="p-2.5 text-right w-32">표준시간 (h)</th>
                      <th className="p-2.5 text-center w-16">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {currentType.processes.map((proc, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 text-center font-mono font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 font-bold">
                          <input
                            type="text"
                            value={proc.name}
                            onChange={(e) => handleProcessNameChange(idx, e.target.value)}
                            className="w-full text-xs px-2 py-1 border border-slate-200 rounded focus:border-blue-500 focus:outline-none font-bold text-slate-900 bg-transparent"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <select
                            value={proc.category}
                            onChange={(e) =>
                              handleProcessCategoryChange(idx, e.target.value as ProcessCategory)
                            }
                            className="text-xs px-2 py-1 border border-slate-200 rounded font-bold bg-white text-slate-800"
                          >
                            <option value="가공">가공</option>
                            <option value="연마">연마</option>
                            <option value="외주">외주</option>
                            <option value="품질">품질</option>
                          </select>
                        </td>
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={proc.durationHours}
                            onChange={(e) =>
                              handleProcessDurationChange(idx, parseFloat(e.target.value) || 0.1)
                            }
                            className="w-20 text-xs px-2 py-1 border border-slate-300 rounded font-mono font-bold text-right text-indigo-700 bg-slate-50 focus:bg-white"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleRemoveStep(idx)}
                            className="text-slate-400 hover:text-red-600 p-1 transition"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">선택된 제품 타입이 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
};
