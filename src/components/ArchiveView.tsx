import React, { useState } from 'react';
import { Order, ProductType } from '../types';
import { Archive, RotateCcw, Search, CheckCircle2, PackageCheck } from 'lucide-react';

interface ArchiveViewProps {
  orders: Record<string, Order>;
  productTypes: Record<string, ProductType>;
  onRestoreOrder: (orderId: string) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  orders,
  productTypes,
  onRestoreOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const archivedList = (Object.values(orders) as Order[])
    .filter((o) => o.archived)
    .filter((o) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const type = productTypes[o.typeId];
      return (
        o.name.toLowerCase().includes(term) ||
        (type && type.name.toLowerCase().includes(term))
      );
    });

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl shadow-2xs">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>완료 수주 보관함 (Archive Master)</span>
              <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-extrabold border border-amber-200">
                총 {archivedList.length}건 보관 중
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              전 공정이 완료되어 아카이브 보관함으로 이동한 수주 이력을 확인하고 필요시 활성 수주 목록으로 복원할 수 있습니다.
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="보관함 수주명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black text-slate-800">
              아카이브 수주 목록
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">수주번호 / 프로젝트명</th>
                <th className="p-3.5">제품 타입 및 공정 스펙</th>
                <th className="p-3.5 text-center">수량</th>
                <th className="p-3.5 text-center">투입 방식</th>
                <th className="p-3.5 text-center">완료일시</th>
                <th className="p-3.5 text-center">상태</th>
                <th className="p-3.5 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {archivedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Archive className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-bold text-slate-500">
                        보관함에 보관된 수주건이 없습니다.
                      </p>
                      <p className="text-xs text-slate-400">
                        메인 대시보드에서 수주의 [보관함] 버튼을 누르면 이곳으로 이동합니다.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                archivedList.map((ord) => {
                  const type = productTypes[ord.typeId];
                  const processCount =
                    ord.customProcesses && ord.customProcesses.length > 0
                      ? ord.customProcesses.length
                      : type
                      ? type.processes.length
                      : 0;

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-extrabold text-slate-900">
                        {ord.name}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <span className="font-bold text-slate-800">
                          {type ? type.name : '커스텀 라우팅'}
                        </span>
                        <span className="ml-1.5 text-[11px] text-slate-400 font-normal">
                          ({processCount}단계 공정)
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-extrabold text-slate-800">
                        {ord.qty}개
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {ord.strategy === 'SERIAL' ? '직렬 투입' : '연속 투입'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center text-slate-500 font-mono text-[11px]">
                        {ord.completedAt || '-'}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          완료 아카이브
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => {
                            onRestoreOrder(ord.id);
                          }}
                          className="bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100 px-3 py-1 rounded-lg font-bold transition inline-flex items-center gap-1.5 text-xs shadow-2xs cursor-pointer active:scale-95"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                          <span>목록으로 복원</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
