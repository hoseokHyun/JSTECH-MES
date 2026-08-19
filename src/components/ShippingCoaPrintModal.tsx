import React from 'react';
import { X, Printer, Award, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ShippingProjectItem } from './QualityInspectionView';

interface ShippingCoaPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipping: ShippingProjectItem;
}

export const ShippingCoaPrintModal: React.FC<ShippingCoaPrintModalProps> = ({
  isOpen,
  onClose,
  shipping
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="shipping-coa-print-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="shipping-coa-print-modal-container"
        className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="print:hidden bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">출하 보증 검사 성적서 (COA) 인쇄 미리보기</h3>
              <p className="text-[11px] text-slate-400 font-mono">성적서 번호: {shipping.coaNo} | 수주: {shipping.orderName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>COA 성적서 인쇄 (Ctrl+P)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-5 bg-white text-slate-900 print:p-0 print:m-0 print:overflow-visible">
          {/* Header */}
          <div className="border-b-2 border-slate-950 pb-4 flex items-start justify-between">
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded bg-emerald-900 text-white text-[10px] font-mono font-black mb-1">
                OFFICIAL CERTIFICATE OF ANALYSIS (COA)
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 font-serif">
                품질 검사 및 최종 출하 보증 성적서
              </h1>
              <p className="text-xs text-slate-600 font-mono mt-0.5">
                JUN SUNG TECH PRECISION QUALITY ASSURANCE & SHIPPING RELEASE
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-blue-950">준성테크(주) 품질보증본부</div>
              <div className="text-[11px] text-slate-500 font-mono">ISO 9001 / Class 5 Cleanroom</div>
              <div className="text-[11px] text-slate-600 font-mono mt-1 font-bold">발행일자: {shipping.issueDate}</div>
              <div className="text-[11px] text-blue-800 font-mono font-bold">No. {shipping.coaNo}</div>
            </div>
          </div>

          {/* Master Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-300 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block font-bold">수주 번호</span>
              <strong className="text-slate-900 font-mono">{shipping.orderId}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-bold">납품 고객사</span>
              <strong className="text-slate-900">{shipping.customer}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-bold">관리 LOT No.</span>
              <strong className="text-slate-900 font-mono">{shipping.lotNo}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-bold">소재 및 경도</span>
              <strong className="text-slate-900">{shipping.material} ({shipping.hardness})</strong>
            </div>
            <div className="sm:col-span-4">
              <span className="text-[10px] text-slate-500 block font-bold">품목 규격 및 제품명</span>
              <strong className="text-slate-900 text-sm">{shipping.orderName} — {shipping.productSpec}</strong>
            </div>
          </div>

          {/* Comprehensive QA Analysis Results */}
          <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 border-b border-slate-300">
                <tr>
                  <th className="p-2.5">검사 항목</th>
                  <th className="p-2.5">설계 규격 사양</th>
                  <th className="p-2.5">실측 검사 결과</th>
                  <th className="p-2.5">측정 장비 및 분석법</th>
                  <th className="p-2.5 text-center">판정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5 font-bold">3차원 립 갭 (Lip Gap) 토출구</td>
                  <td className="p-2.5 font-mono">50.0㎛ ±0.8㎛</td>
                  <td className="p-2.5 font-mono font-black text-emerald-800">50.12㎛</td>
                  <td className="p-2.5">CMM Zeiss Prismo (초정밀 3차원)</td>
                  <td className="p-2.5 text-center font-bold text-emerald-700">PASS</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">경면부 진직도/평면도 (Flatness)</td>
                  <td className="p-2.5 font-mono">≤ 1.0㎛ / 1500mm</td>
                  <td className="p-2.5 font-mono font-black text-emerald-800">0.52㎛</td>
                  <td className="p-2.5">CMM 멀티포인트 스캔</td>
                  <td className="p-2.5 text-center font-bold text-emerald-700">PASS</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">경면부 표면 조도 (Mirror Roughness)</td>
                  <td className="p-2.5 font-mono">≤ 0.020㎛ Ra</td>
                  <td className="p-2.5 font-mono font-black text-emerald-800">{shipping.roughnessValue}</td>
                  <td className="p-2.5">Zygo 광학 간섭계 표면 조도계</td>
                  <td className="p-2.5 text-center font-bold text-emerald-700">
                    {shipping.roughnessStatus}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">표면 처리 도금 및 코팅 두께</td>
                  <td className="p-2.5 font-mono">설계 두께 기준 충족</td>
                  <td className="p-2.5 font-mono font-black text-emerald-800">{shipping.coatingValue}</td>
                  <td className="p-2.5">XRF 형광분석 / 막후계</td>
                  <td className="p-2.5 text-center font-bold text-emerald-700">
                    {shipping.coatingStatus}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">초음파 탈지 세척 및 파티클 관리</td>
                  <td className="p-2.5 font-mono">ISO Class 5 규격 충족</td>
                  <td className="p-2.5 font-mono font-black text-emerald-800">3단계 메가소닉 세척 완료</td>
                  <td className="p-2.5">파티클 카운터 (0.1㎛ 이하)</td>
                  <td className="p-2.5 text-center font-bold text-emerald-700">
                    {shipping.cleaningStatus}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 5-Step QA Verification Checklist Summary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 text-xs space-y-2">
            <span className="font-black text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>출하 전 필수 검증 5대 체크리스트 서명 완료</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${shipping.checklist.cmmPointScan ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                  {shipping.checklist.cmmPointScan ? '✓' : '-'}
                </span>
                <span>1. CMM 3차원 전수 포인트 공차 전수 검사 완료</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${shipping.checklist.roughnessInterferometer ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                  {shipping.checklist.roughnessInterferometer ? '✓' : '-'}
                </span>
                <span>2. 비접촉 광학 간섭계 경면 조도(Ra≤0.02㎛) 확인</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${shipping.checklist.boltInterference ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                  {shipping.checklist.boltInterference ? '✓' : '-'}
                </span>
                <span>3. 립 조절 볼트 및 심 플레이트 조립 간섭 테스트</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${shipping.checklist.ultrasonicCleaning ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                  {shipping.checklist.ultrasonicCleaning ? '✓' : '-'}
                </span>
                <span>4. 메가소닉 3단계 정밀 탈지 세척 및 건조</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${shipping.checklist.cleanroomPackaging ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                  {shipping.checklist.cleanroomPackaging ? '✓' : '-'}
                </span>
                <span>5. 방청 피막 및 클린룸 2중 진공 포장 완료</span>
              </div>
            </div>
          </div>

          {/* Signatures & Certification Verdict */}
          <div className="pt-4 border-t-2 border-slate-950 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="text-slate-500 text-[11px] space-y-0.5">
              <div>상기 제품은 계약 사양 및 당사 품질보증 기준에 의거하여 엄격히 검사되었으며 최종 합격하였음을 증명합니다.</div>
              <div>본 COA 성적서는 고객사 입고 검사 면제 협약 기준을 충족합니다.</div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block">검사 책임자</span>
                <strong className="text-slate-900 font-bold underline decoration-blue-500 underline-offset-4">
                  {shipping.inspector}
                </strong>
              </div>
              <div className="relative text-center pr-6">
                <span className="text-[10px] text-slate-500 block">QA 부서장 승인</span>
                <strong className="text-slate-900 font-bold underline decoration-rose-500 underline-offset-4">
                  {shipping.qaManager}
                </strong>
                <span className="absolute -top-1 -right-2 w-9 h-9 rounded-full border-2 border-rose-600 text-rose-600 font-bold text-[9px] flex items-center justify-center rotate-12 bg-rose-50/40">
                  출하인
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
