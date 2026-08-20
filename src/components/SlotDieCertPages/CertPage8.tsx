import React from 'react';
import { CertHeader } from './CertHeader';
import { ProductSpecRecipe } from '../SlotDieCertificateView';

interface CertPage8Props {
  recipe: ProductSpecRecipe;
}

export const CertPage8: React.FC<CertPage8Props> = ({ recipe }) => {
  // Generate 43 bolts data (split into 2 columns for clean dense table)
  const bolts = Array.from({ length: 43 }, (_, i) => ({
    no: i + 1,
    torque: 3.5 + (Math.sin(i * 0.7) * 0.15),
    pitchDev: (Math.sin(i * 0.9) * 0.8),
    status: '양호'
  }));

  const col1Bolts = bolts.slice(0, 22);
  const col2Bolts = bolts.slice(22, 43);

  return (
    <div className="a4-page bg-white text-slate-950 w-[794px] min-h-[1123px] mx-auto p-[28px] flex flex-col justify-between box-border border border-slate-300 print:border-none print:shadow-none shadow-xl print:m-0 print:p-[24px]">
      <div className="space-y-2">
        {/* Header */}
        <CertHeader
          title="검사 성적서_첨부"
          subTitle="(조절볼트 검사)"
          docNo={recipe.docNo}
          inspectionDate={recipe.inspectionDate}
          inspector={recipe.inspector}
          approver={recipe.approver}
          isPassed={true}
        />

        {/* Measurement Point Diagram */}
        <div className="border-[1.5px] border-slate-950">
          <div className="bg-[#D9F2E6] text-slate-950 text-[11px] font-black py-0.5 px-3 text-center border-b-[1.5px] border-slate-950">
            조절볼트 검사 데이터_Measurement Point (Lip Differential Adjusting Bolts No. 1 ~ 43)
          </div>
          <div className="p-2 bg-white flex items-center justify-around h-[85px]">
            <svg viewBox="0 0 680 70" className="w-full h-full max-h-[70px] mx-auto">
              <g stroke="#334155" strokeWidth="1" fill="#f1f5f9">
                <rect x="20" y="20" width="640" height="30" rx="3" fill="#e2e8f0" />
                {/* 43 bolt circles with numbers */}
                {[...Array(43)].map((_, i) => (
                  <g key={i}>
                    <circle cx={32 + i * 14.6} cy={35} r="4" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.8" />
                    {i % 4 === 0 && (
                      <text x={32 + i * 14.6} y={15} textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#0f172a">
                        #{i + 1}
                      </text>
                    )}
                  </g>
                ))}
              </g>
            </svg>
          </div>
        </div>

        {/* 43 Bolts Dual-Column Table */}
        <div className="grid grid-cols-2 gap-2">
          {/* Column 1 (No 1 ~ 22) */}
          <table className="w-full border-collapse border-[1.5px] border-slate-950 text-[9.5px]">
            <thead>
              <tr className="border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950 bg-[#D9F2E6] font-black text-center">
                <th className="py-0.5 w-[12%]">볼트 No</th>
                <th className="py-0.5 w-[28%]">체결 토크 (N·m)</th>
                <th className="py-0.5 w-[32%]">피치 편차 (㎛)</th>
                <th className="py-0.5 w-[28%]">상태 판정</th>
              </tr>
            </thead>
            <tbody className="divide-y-[1px] divide-slate-950 text-center font-mono">
              {col1Bolts.map((b) => (
                <tr key={b.no} className="divide-x-[1.5px] divide-slate-950">
                  <td className="font-bold py-[1.2px] bg-slate-50">#{b.no}</td>
                  <td className="py-[1.2px]">{b.torque.toFixed(2)}</td>
                  <td className="py-[1.2px]">{b.pitchDev > 0 ? `+${b.pitchDev.toFixed(2)}` : b.pitchDev.toFixed(2)}</td>
                  <td className="font-sans font-bold text-blue-600 py-[1.2px]">{b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Column 2 (No 23 ~ 43) */}
          <table className="w-full border-collapse border-[1.5px] border-slate-950 text-[9.5px]">
            <thead>
              <tr className="border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950 bg-[#D9F2E6] font-black text-center">
                <th className="py-0.5 w-[12%]">볼트 No</th>
                <th className="py-0.5 w-[28%]">체결 토크 (N·m)</th>
                <th className="py-0.5 w-[32%]">피치 편차 (㎛)</th>
                <th className="py-0.5 w-[28%]">상태 판정</th>
              </tr>
            </thead>
            <tbody className="divide-y-[1px] divide-slate-950 text-center font-mono">
              {col2Bolts.map((b) => (
                <tr key={b.no} className="divide-x-[1.5px] divide-slate-950">
                  <td className="font-bold py-[1.2px] bg-slate-50">#{b.no}</td>
                  <td className="py-[1.2px]">{b.torque.toFixed(2)}</td>
                  <td className="py-[1.2px]">{b.pitchDev > 0 ? `+${b.pitchDev.toFixed(2)}` : b.pitchDev.toFixed(2)}</td>
                  <td className="font-sans font-bold text-blue-600 py-[1.2px]">{b.status}</td>
                </tr>
              ))}
              {/* Summary Row */}
              <tr className="divide-x-[1.5px] divide-slate-950 bg-blue-50/20 font-black">
                <td className="font-sans bg-[#D9F2E6] py-[1.2px]">평균</td>
                <td className="py-[1.2px]">3.51</td>
                <td className="py-[1.2px] text-blue-700">0.05</td>
                <td className="font-sans text-blue-600 py-[1.2px]">전수 합격</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Fixed Bottom Footer */}
      <div className="pt-2 flex justify-between items-center text-[10.5px] font-mono text-slate-900 border-t border-transparent select-none">
        <div>JS-COA-01</div>
        <div className="font-sans font-bold">JUNSUNG TECH Co., Ltd</div>
        <div className="w-16 text-right font-bold">Page 6/8</div>
      </div>
    </div>
  );
};
