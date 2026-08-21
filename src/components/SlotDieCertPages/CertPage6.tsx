import React from 'react';
import { CertHeader } from './CertHeader';
import { ProductSpecRecipe } from '../SlotDieCertificateView';
import { Camera } from 'lucide-react';

interface CertPage6Props {
  recipe: ProductSpecRecipe;
  capturedSnapshot?: string;
  pageNo?: number;
  totalPages?: number;
  isEditMode?: boolean;
  onOpen3DModal?: () => void;
  onUpdateRecipe?: (recipe: ProductSpecRecipe) => void;
}

export const CertPage6: React.FC<CertPage6Props> = ({
  recipe,
  capturedSnapshot,
  pageNo = 6,
  totalPages = 8,
  isEditMode = false,
  onOpen3DModal,
  onUpdateRecipe
}) => {
  const damperData = [
    { no: 1, front: 0.081, damper: 0.080, diff: 0.001 },
    { no: 2, front: 0.080, damper: 0.080, diff: 0.000 },
    { no: 3, front: 0.079, damper: 0.080, diff: -0.001 },
    { no: 4, front: 0.080, damper: 0.081, diff: -0.001 },
    { no: 5, front: 0.081, damper: 0.081, diff: 0.000 },
    { no: 6, front: 0.080, damper: 0.080, diff: 0.000 },
    { no: 7, front: 0.080, damper: 0.079, diff: 0.001 },
    { no: 8, front: 0.079, damper: 0.080, diff: -0.001 },
    { no: 9, front: 0.081, damper: 0.080, diff: 0.001 },
    { no: 10, front: 0.080, damper: 0.080, diff: 0.000 }
  ];

  return (
    <div className="a4-page bg-white text-slate-950 w-[794px] min-h-[1123px] mx-auto p-[28px] flex flex-col justify-between box-border border border-slate-300 print:border-none print:shadow-none shadow-xl print:m-0 print:p-[24px]">
      <div className="space-y-3">
        {/* Header */}
        <CertHeader
          title="검사 성적서_첨부"
          subTitle="(GAP 단차 / DAMPER 조립검사)"
          docNo={recipe.docNo}
          inspectionDate={recipe.inspectionDate}
          inspector={recipe.inspector}
          approver={recipe.approver}
          isPassed={true}
          pageNo={pageNo}
          totalPages={totalPages}
        />

        {/* 1. GAP Step Measurement Section & 3D Snapshot */}
        <div className="border-[1.5px] border-slate-950">
          <div className="bg-[#D9F2E6] text-slate-950 text-[11px] font-black py-1 px-3 flex items-center justify-between border-b-[1.5px] border-slate-950">
            <span>GAP 단차 측정 데이터_Measurement Point (Slot Lip Gap Step)</span>
            {onOpen3DModal && (
              <button
                type="button"
                onClick={onOpen3DModal}
                className="print:hidden text-[10px] bg-white text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-300 hover:bg-blue-50 flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3 h-3" />
                <span>3D 단차/댐퍼 시점 변경</span>
              </button>
            )}
          </div>
          <div className="p-2 bg-white flex items-center justify-between h-[100px] px-4">
            {capturedSnapshot ? (
              <img
                src={capturedSnapshot}
                alt="3D Gap View"
                className="h-[90px] w-auto object-contain mx-auto rounded border border-slate-200"
              />
            ) : (
              <>
                <div className="w-[300px]">
                  <svg viewBox="0 0 300 70" className="w-full h-full">
                    <g stroke="#334155" strokeWidth="1.2" fill="#f1f5f9">
                      <polygon points="10,15 280,35 280,55 10,35" />
                      <polygon points="10,15 280,35 270,30 5,10" fill="#e2e8f0" />
                      {/* Point 1, 2, 3 */}
                      <circle cx="50" cy="20" r="3" fill="#ef4444" />
                      <text x="50" y="14" fontSize="8" fontWeight="bold" fill="#ef4444">①</text>
                      <circle cx="150" cy="27" r="3" fill="#ef4444" />
                      <text x="150" y="21" fontSize="8" fontWeight="bold" fill="#ef4444">②</text>
                      <circle cx="250" cy="34" r="3" fill="#ef4444" />
                      <text x="250" y="28" fontSize="8" fontWeight="bold" fill="#ef4444">③</text>
                    </g>
                  </svg>
                </div>
                <div className="text-[11px] font-mono font-bold text-slate-800 bg-slate-100 p-2 rounded border border-slate-300">
                  * GAP 단차 = ① - ② (Step Deviation)
                </div>
              </>
            )}
          </div>
        </div>

        {/* GAP Step Table */}
        <table className="w-full border-collapse border-[1.5px] border-slate-950 text-[11px]">
          <thead>
            <tr className="border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950">
              <th colSpan={6} className="bg-[#D9F2E6] font-black py-1 text-center">
                FRONT PLATE GAP 단차 (mm)
              </th>
            </tr>
            <tr className="border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950 text-center font-bold bg-[#E8F8F0]">
              <th className="py-1 w-[16%]">규격</th>
              <th className="py-1 w-[16%]">Point 1</th>
              <th className="py-1 w-[16%]">Point 2</th>
              <th className="py-1 w-[16%]">Point 3</th>
              <th className="py-1 w-[18%]">평균 (Average)</th>
              <th className="py-1 w-[18%]">결과</th>
            </tr>
          </thead>
          <tbody className="divide-y-[1.5px] divide-slate-950 text-center font-mono text-[11px]">
            <tr className="divide-x-[1.5px] divide-slate-950">
              <td className="py-1.5 font-sans font-bold">0.08 ± 0.002</td>
              <td className="py-1.5 font-bold">0.080</td>
              <td className="py-1.5 font-bold">0.081</td>
              <td className="py-1.5 font-bold">0.079</td>
              <td className="py-1.5 font-black text-blue-700 bg-blue-50/30">0.080</td>
              <td className="py-1.5 font-sans font-black text-blue-600">합격</td>
            </tr>
          </tbody>
        </table>

        {/* 2. DAMPER Step Measurement Section */}
        <div className="border-[1.5px] border-slate-950 mt-2">
          <div className="bg-[#D9F2E6] text-slate-950 text-[11px] font-black py-1 px-3 text-center border-b-[1.5px] border-slate-950">
            DAMPER 단차 측정 데이터_Measurement Point
          </div>
          <div className="p-2 bg-white flex items-center justify-between h-[95px] px-6">
            <div className="w-[300px]">
              <svg viewBox="0 0 300 65" className="w-full h-full">
                <g stroke="#334155" strokeWidth="1.2" fill="#f1f5f9">
                  <polygon points="10,12 280,32 280,52 10,32" />
                  <rect x="70" y="10" width="140" height="20" fill="#38bdf8" opacity="0.3" stroke="#0284c7" strokeWidth="1" />
                  <circle cx="100" cy="20" r="3" fill="#ef4444" />
                  <text x="100" y="14" fontSize="8" fontWeight="bold" fill="#ef4444">③</text>
                  <circle cx="180" cy="25" r="3" fill="#ef4444" />
                  <text x="180" y="19" fontSize="8" fontWeight="bold" fill="#ef4444">④</text>
                </g>
              </svg>
            </div>
            <div className="text-[11px] font-mono font-bold text-slate-800 bg-slate-100 p-2 rounded border border-slate-300">
              * DAMPER 단차 = ③ - ④ (Step)
            </div>
          </div>
        </div>

        {/* DAMPER Table */}
        <table className="w-full border-collapse border-[1.5px] border-slate-950 text-[10.5px]">
          <thead>
            <tr className="border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950 bg-[#D9F2E6] font-black text-center">
              <th className="py-1 w-[8%]">No</th>
              <th className="py-1 w-[20%]">FRONT (mm)</th>
              <th className="py-1 w-[20%]">DAMPER (mm)</th>
              <th className="py-1 w-[18%]">편차 (Diff)</th>
              <th className="py-1 w-[18%]">규격</th>
              <th className="py-1 w-[16%]">결과</th>
            </tr>
          </thead>
          <tbody className="divide-y-[1px] divide-slate-950 text-center font-mono text-[10px]">
            {damperData.map((d) => (
              <tr key={d.no} className="divide-x-[1.5px] divide-slate-950">
                <td className="py-1 font-bold bg-slate-50">{d.no}</td>
                <td className="py-1">{d.front.toFixed(3)}</td>
                <td className="py-1">{d.damper.toFixed(3)}</td>
                <td className="py-1 font-bold">{d.diff >= 0 ? `+${d.diff.toFixed(3)}` : d.diff.toFixed(3)}</td>
                <td className="py-1 font-sans">±0.005 mm</td>
                <td className="py-1 font-sans font-bold text-blue-600">합격</td>
              </tr>
            ))}
            {/* Avg Row */}
            <tr className="border-t-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950 bg-blue-50/20 font-black">
              <td className="py-1 font-sans bg-[#D9F2E6]">평균</td>
              <td className="py-1">0.080</td>
              <td className="py-1">0.080</td>
              <td className="py-1 text-blue-700">0.000</td>
              <td className="py-1 font-sans font-normal">±0.005 mm</td>
              <td className="py-1 font-sans text-blue-600">합격</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Fixed Bottom Footer */}
      <div className="pt-2 flex justify-between items-center text-[10.5px] font-mono text-slate-900 border-t border-transparent select-none">
        <div>JS-COA-01</div>
        <div className="font-sans font-bold">JUNSUNG TECH Co., Ltd</div>
        <div className="w-24 text-right font-bold">Page {pageNo}/{totalPages}</div>
      </div>
    </div>
  );
};
