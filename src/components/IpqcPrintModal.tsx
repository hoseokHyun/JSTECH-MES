import React from 'react';
import { X, Printer, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { InspectionItem } from './QualityInspectionView';

interface IpqcPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: InspectionItem;
}

export const IpqcPrintModal: React.FC<IpqcPrintModalProps> = ({
  isOpen,
  onClose,
  inspection
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const okCount = inspection.measurements.filter((m) => m.status === 'OK').length;
  const ngCount = inspection.measurements.filter((m) => m.status === 'NG').length;

  return (
    <div
      id="ipqc-print-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="ipqc-print-modal-container"
        className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="print:hidden bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">공정검사(IPQC) 3D CMM 정밀측정 성적서 인쇄 미리보기</h3>
              <p className="text-[11px] text-slate-400 font-mono">관리번호: {inspection.id} | LOT: {inspection.lotNo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>성적서 인쇄 (Ctrl+P)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-5 bg-white text-slate-900 print:p-0 print:m-0 print:overflow-visible">
          {/* Certificate Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div>
              <div className="inline-block px-2 py-0.5 rounded bg-blue-900 text-white text-[10px] font-mono font-black mb-1">
                IPQC PRECISION CMM CERTIFICATE
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 font-serif">
                공정 품질 검사 및 3D 정밀측정 성적서
              </h1>
              <p className="text-xs text-slate-600 font-mono mt-0.5">
                IN-PROCESS QUALITY CONTROL & 3D CMM INSPECTION REPORT
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-blue-950">준성테크(주) 정밀측정센터</div>
              <div className="text-[11px] text-slate-500 font-mono">KOLAS 공인 교정규격 인증기관</div>
              <div className="text-[11px] text-slate-600 font-mono mt-1 font-bold">검사일시: {inspection.inspectTime}</div>
            </div>
          </div>

          {/* Product & Process Master Info Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-300 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block font-bold">수주 / 검사 ID</span>
              <strong className="text-slate-900 font-mono">{inspection.id}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-bold">고객사</span>
              <strong className="text-slate-900">{inspection.customer}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-bold">공정 라인</span>
              <strong className="text-slate-900">{inspection.line}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-bold">관리 LOT 번호</span>
              <strong className="text-slate-900 font-mono">{inspection.lotNo}</strong>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[10px] text-slate-500 block font-bold">품목명 / 규격</span>
              <strong className="text-slate-900">{inspection.productName} ({inspection.lipWidthMm}mm)</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-bold">측정 장비</span>
              <strong className="text-slate-900">{inspection.cmmDevice}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-bold">측정 프로그램</span>
              <strong className="text-slate-900 font-mono text-[11px]">{inspection.programName}</strong>
            </div>
          </div>

          {/* Environmental Condition & Inspection Summary Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs">
            <div className="flex items-center gap-4 text-slate-700">
              <span><strong>측정 환경:</strong> 20.0℃ ± 0.2℃ / 45.0% RH (클린룸 #1)</span>
              <span><strong>전수 포인트:</strong> {inspection.measurements.length}개소</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs border border-emerald-300">
                OK: {okCount}개
              </span>
              {ngCount > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-xs border border-rose-300">
                  NG: {ngCount}개
                </span>
              ) : null}
              <span
                className={`px-3 py-0.5 rounded-full font-black text-xs border ${
                  inspection.result === 'PASS'
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : inspection.result === 'FAIL'
                    ? 'bg-rose-600 text-white border-rose-700'
                    : 'bg-amber-500 text-white border-amber-600'
                }`}
              >
                최종판정: {inspection.result}
              </span>
            </div>
          </div>

          {/* Detailed Measurement Points Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 border-b border-slate-300">
                <tr>
                  <th className="p-2.5 text-center w-10">No</th>
                  <th className="p-2.5 w-14">코드</th>
                  <th className="p-2.5">검사 항목 및 측정 위치</th>
                  <th className="p-2.5 text-right">기준값(Nominal)</th>
                  <th className="p-2.5 text-right">실측값(Actual)</th>
                  <th className="p-2.5 text-center">허용 공차</th>
                  <th className="p-2.5 text-right">편차(Dev)</th>
                  <th className="p-2.5 text-center w-16">판정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {inspection.measurements.map((m) => {
                  const isNg = m.status === 'NG';
                  return (
                    <tr key={m.code} className={isNg ? 'bg-rose-50/60' : 'hover:bg-slate-50'}>
                      <td className="p-2.5 text-center font-mono text-slate-500">{m.no}</td>
                      <td className="p-2.5 font-mono font-black text-blue-900">{m.code}</td>
                      <td className="p-2.5 font-bold text-slate-900">{m.item}</td>
                      <td className="p-2.5 text-right font-mono text-slate-700">
                        {m.nominal.toFixed(2)} {m.unit}
                      </td>
                      <td
                        className={`p-2.5 text-right font-mono font-black ${
                          isNg ? 'text-rose-700' : 'text-emerald-800'
                        }`}
                      >
                        {m.actual.toFixed(m.unit.includes('㎛') ? 2 : 3)} {m.unit}
                      </td>
                      <td className="p-2.5 text-center font-mono text-slate-600">{m.tolerance}</td>
                      <td
                        className={`p-2.5 text-right font-mono font-bold ${
                          isNg ? 'text-rose-700' : 'text-slate-800'
                        }`}
                      >
                        {m.deviation}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                            isNg
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* CAPA & Corrective Actions (If Fail or in Progress) */}
          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 space-y-2 text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
              <span className="font-black text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                <span>품질 이상 발생 및 시정조치(CAPA) 추적 내역</span>
              </span>
              <span className="font-bold text-slate-600">진행 상태: CAPA {inspection.capa.step}단계</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
              <div>
                <span className="text-slate-500 font-bold block">이상 내용:</span>
                <span className="text-slate-900">{inspection.capa.defectOccurred.type || '특이사항 없음'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">원인 분석:</span>
                <span className="text-slate-900">{inspection.capa.causeAnalysis.reason || '규격 만족'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">시정 조치:</span>
                <span className="text-slate-900 font-bold text-blue-900">{inspection.capa.correctiveAction.action || '조치 불필요'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">재검사 결과 및 최종 결재:</span>
                <span className="text-slate-900">{inspection.capa.finalVerdict.result || '정상 완료'}</span>
              </div>
            </div>
          </div>

          {/* Official Signatures and Seals */}
          <div className="pt-4 border-t-2 border-slate-900 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="text-slate-500 text-[11px] space-y-0.5">
              <div>• 본 성적서는 정밀 삼차원 측정기(Zeiss/Mitutoyo) 자동 프로그래밍으로 실측되었습니다.</div>
              <div>• 무단 전재 및 변조를 금하며, 위조 시 법적 책임을 집니다.</div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block">검사 담당자</span>
                <strong className="text-slate-900 font-bold underline decoration-blue-500 underline-offset-4">
                  {inspection.inspector}
                </strong>
              </div>
              <div className="relative text-center pr-6">
                <span className="text-[10px] text-slate-500 block">품질보증책임자</span>
                <strong className="text-slate-900 font-bold underline decoration-rose-500 underline-offset-4">
                  {inspection.capa.finalVerdict.approver || '품질보증팀장 이준혁'}
                </strong>
                <span className="absolute -top-1 -right-2 w-8 h-8 rounded-full border-2 border-rose-600 text-rose-600 font-bold text-[8px] flex items-center justify-center rotate-12 bg-rose-50/40">
                  승인
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
