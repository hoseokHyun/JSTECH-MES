import React from 'react';
import { CertHeader } from './CertHeader';
import { ProductSpecRecipe } from '../SlotDieCertificateView';
import { Camera } from 'lucide-react';

interface CertPage7Props {
  recipe: ProductSpecRecipe;
  capturedSnapshot?: string;
  pageNo?: number;
  totalPages?: number;
  isEditMode?: boolean;
  onOpen3DModal?: () => void;
  onUpdateRecipe?: (recipe: ProductSpecRecipe) => void;
}

export const CertPage7: React.FC<CertPage7Props> = ({
  recipe,
  capturedSnapshot,
  pageNo = 7,
  totalPages = 8,
  isEditMode = false,
  onOpen3DModal,
  onUpdateRecipe
}) => {
  return (
    <div className="a4-page bg-white text-slate-950 w-[794px] min-h-[1123px] mx-auto p-[28px] flex flex-col justify-between box-border border border-slate-300 print:border-none print:shadow-none shadow-xl print:m-0 print:p-[24px]">
      <div className="space-y-3">
        {/* Header */}
        <CertHeader
          title="검사 성적서_첨부"
          subTitle="(경도 / 자력 측정)"
          docNo={recipe.docNo}
          inspectionDate={recipe.inspectionDate}
          inspector={recipe.inspector}
          approver={recipe.approver}
          isPassed={true}
          pageNo={pageNo}
          totalPages={totalPages}
        />

        {/* 1. Hardness Measurement Section & 3D Snapshot */}
        <div className="border-[1.5px] border-slate-950">
          <div className="bg-[#D9F2E6] text-slate-950 text-[11px] font-black py-1 px-3 flex items-center justify-between border-b-[1.5px] border-slate-950">
            <span>경도 측정 데이터_Measurement Point (Material Hardness HRC)</span>
            {onOpen3DModal && (
              <button
                type="button"
                onClick={onOpen3DModal}
                className="print:hidden text-[10px] bg-white text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-300 hover:bg-blue-50 flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3 h-3" />
                <span>3D 경도/자력 시점 변경</span>
              </button>
            )}
          </div>
          <div className="p-2 bg-white flex items-center justify-around h-[120px]">
            {capturedSnapshot ? (
              <img
                src={capturedSnapshot}
                alt="3D Hardness View"
                className="h-[110px] w-auto object-contain mx-auto rounded border border-slate-200"
              />
            ) : (
              <svg viewBox="0 0 450 75" className="w-full h-full max-h-[75px] mx-auto">
                <g stroke="#334155" strokeWidth="1.2" fill="#f1f5f9">
                  <polygon points="30,15 420,35 420,60 30,40" />
                  <polygon points="30,15 420,35 410,30 20,10" fill="#e2e8f0" />
                  {/* Point 1 & Point 2 */}
                  <circle cx="120" cy="28" r="3.5" fill="#ef4444" />
                  <text x="120" y="21" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#ef4444">Point 1</text>
                  <circle cx="320" cy="38" r="3.5" fill="#ef4444" />
                  <text x="320" y="31" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#ef4444">Point 2</text>
                </g>
                <text x="225" y="70" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#0f172a">
                  REAR PLATE (Hardness Test)
                </text>
              </svg>
            )}
          </div>
        </div>

        {/* Hardness Table */}
        <table className="w-full border-collapse border-[1.5px] border-slate-950 text-[11px]">
          <thead>
            <tr className="border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950">
              <th colSpan={5} className="bg-[#D9F2E6] font-black py-1 text-center">
                REAR PLATE 경도 (Hardness - HRC)
              </th>
            </tr>
            <tr className="border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950 text-center font-bold bg-[#E8F8F0]">
              <th className="py-1 w-[20%]">규격</th>
              <th className="py-1 w-[20%]">Point 1</th>
              <th className="py-1 w-[20%]">Point 2</th>
              <th className="py-1 w-[20%]">평균 (Average)</th>
              <th className="py-1 w-[20%]">결과</th>
            </tr>
          </thead>
          <tbody className="divide-y-[1.5px] divide-slate-950 text-center font-mono text-[11px]">
            <tr className="divide-x-[1.5px] divide-slate-950">
              <td className="py-2 font-sans font-bold">HRC 40 ± 2</td>
              <td className="py-2 font-bold">40.2</td>
              <td className="py-2 font-bold">39.8</td>
              <td className="py-2 font-black text-blue-700 bg-blue-50/30">40.0</td>
              <td className="py-2 font-sans font-black text-blue-600">합격</td>
            </tr>
          </tbody>
        </table>

        {/* 2. Residual Magnetism Measurement Section */}
        <div className="border-[1.5px] border-slate-950 mt-3">
          <div className="bg-[#D9F2E6] text-slate-950 text-[11px] font-black py-1 px-3 text-center border-b-[1.5px] border-slate-950">
            자력 측정 데이터_Measurement Point
          </div>
          <div className="p-2 bg-white flex items-center justify-around h-[120px]">
            {/* FRONT Diagram */}
            <div className="text-center flex-1">
              <svg viewBox="0 0 240 75" className="w-full h-full max-h-[75px] mx-auto">
                <g stroke="#334155" strokeWidth="1.2" fill="#f1f5f9">
                  <polygon points="15,15 220,35 220,55 15,35" />
                  <polygon points="15,15 220,35 210,30 5,10" fill="#e2e8f0" />
                  <circle cx="60" cy="25" r="3" fill="#ef4444" />
                  <text x="60" y="19" fontSize="7.5" fontWeight="bold" fill="#ef4444">P1</text>
                  <circle cx="160" cy="33" r="3" fill="#ef4444" />
                  <text x="160" y="27" fontSize="7.5" fontWeight="bold" fill="#ef4444">P2</text>
                </g>
                <text x="120" y="70" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0f172a">
                  FRONT PLATE
                </text>
              </svg>
            </div>

            {/* REAR Diagram */}
            <div className="text-center flex-1">
              <svg viewBox="0 0 240 75" className="w-full h-full max-h-[75px] mx-auto">
                <g stroke="#334155" strokeWidth="1.2" fill="#f1f5f9">
                  <polygon points="15,15 220,35 220,55 15,35" />
                  <polygon points="15,15 220,35 210,30 5,10" fill="#e2e8f0" />
                  <circle cx="60" cy="25" r="3" fill="#ef4444" />
                  <text x="60" y="19" fontSize="7.5" fontWeight="bold" fill="#ef4444">P1</text>
                  <circle cx="160" cy="33" r="3" fill="#ef4444" />
                  <text x="160" y="27" fontSize="7.5" fontWeight="bold" fill="#ef4444">P2</text>
                </g>
                <text x="120" y="70" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0f172a">
                  REAR PLATE
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Magnetism Table */}
        <table className="w-full border-collapse border-[1.5px] border-slate-950 text-[11px]">
          <thead>
            <tr className="border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950">
              <th colSpan={5} className="bg-[#D9F2E6] font-black py-1 text-center w-1/2">
                FRONT PLATE 잔류 자력 (mT)
              </th>
              <th colSpan={5} className="bg-[#D9F2E6] font-black py-1 text-center w-1/2">
                REAR PLATE 잔류 자력 (mT)
              </th>
            </tr>
            <tr className="border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950 text-center font-bold bg-[#E8F8F0]">
              <th className="py-1 w-[20%]">규격</th>
              <th className="py-1 w-[20%]">Point 1</th>
              <th className="py-1 w-[20%]">Point 2</th>
              <th className="py-1 w-[20%]">평균</th>
              <th className="py-1 w-[20%]">결과</th>

              <th className="py-1 w-[20%]">규격</th>
              <th className="py-1 w-[20%]">Point 1</th>
              <th className="py-1 w-[20%]">Point 2</th>
              <th className="py-1 w-[20%]">평균</th>
              <th className="py-1 w-[20%]">결과</th>
            </tr>
          </thead>
          <tbody className="divide-y-[1.5px] divide-slate-950 text-center font-mono text-[11px]">
            <tr className="divide-x-[1.5px] divide-slate-950">
              <td className="py-2 font-sans font-bold">≤ 0.2 mT</td>
              <td className="py-2 font-bold">0.04</td>
              <td className="py-2 font-bold">0.05</td>
              <td className="py-2 font-black text-blue-700 bg-blue-50/30">0.045</td>
              <td className="py-2 font-sans font-black text-blue-600">합격</td>

              <td className="py-2 font-sans font-bold">≤ 0.2 mT</td>
              <td className="py-2 font-bold">0.03</td>
              <td className="py-2 font-bold">0.04</td>
              <td className="py-2 font-black text-blue-700 bg-blue-50/30">0.035</td>
              <td className="py-2 font-sans font-black text-blue-600">합격</td>
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
