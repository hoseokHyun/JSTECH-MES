import React from 'react';
import { CertHeader } from './CertHeader';
import { ProductSpecRecipe } from '../SlotDieCertificateView';
import { Camera } from 'lucide-react';

interface CertPage3Props {
  recipe: ProductSpecRecipe;
  capturedSnapshot?: string;
  pageNo?: number;
  totalPages?: number;
  isEditMode?: boolean;
  onOpen3DModal?: () => void;
  onUpdateRecipe?: (recipe: ProductSpecRecipe) => void;
}

export const CertPage3: React.FC<CertPage3Props> = ({
  recipe,
  capturedSnapshot,
  pageNo = 3,
  totalPages = 8,
  isEditMode = false,
  onOpen3DModal,
  onUpdateRecipe
}) => {
  const handleStraightnessChange = (
    index: number,
    field: 'frontLine' | 'rearLine',
    val: string
  ) => {
    if (!onUpdateRecipe) return;
    const numVal = parseFloat(val) || 0;
    const nextList = [...recipe.straightnessMeasurements];
    nextList[index] = { ...nextList[index], [field]: numVal };
    onUpdateRecipe({ ...recipe, straightnessMeasurements: nextList });
  };

  const frontValues = recipe.straightnessMeasurements.map((s) => s.frontLine);
  const rearValues = recipe.straightnessMeasurements.map((s) => s.rearLine);

  const frontMax = frontValues.length ? Math.max(...frontValues) : 0;
  const frontMin = frontValues.length ? Math.min(...frontValues) : 0;
  const frontStraightness = frontMax - frontMin;

  const rearMax = rearValues.length ? Math.max(...rearValues) : 0;
  const rearMin = rearValues.length ? Math.min(...rearValues) : 0;
  const rearStraightness = rearMax - rearMin;

  return (
    <div className="a4-page bg-white text-slate-950 w-[794px] min-h-[1123px] mx-auto p-[28px] flex flex-col justify-between box-border border border-slate-300 print:border-none print:shadow-none shadow-xl print:m-0 print:p-[24px]">
      <div className="space-y-2">
        {/* Header */}
        <CertHeader
          title="검사 성적서_첨부"
          subTitle="(Lip 진직도)"
          docNo={recipe.docNo}
          inspectionDate={recipe.inspectionDate}
          inspector={recipe.inspector}
          approver={recipe.approver}
          isPassed={true}
          pageNo={pageNo}
          totalPages={totalPages}
        />

        {/* Measurement Point Diagram */}
        <div className="border-[1.5px] border-slate-950">
          <div className="bg-[#D9F2E6] text-slate-950 text-[11px] font-black py-1 px-3 flex items-center justify-between border-b-[1.5px] border-slate-950">
            <span>진직도 데이터_Measurement Point (Lip Edge Straightness)</span>
            {onOpen3DModal && (
              <button
                type="button"
                onClick={onOpen3DModal}
                className="print:hidden text-[10px] bg-white text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-300 hover:bg-blue-50 flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3 h-3" />
                <span>3D 진직도 시점 변경</span>
              </button>
            )}
          </div>
          <div className="p-2 bg-white flex items-center justify-around h-[125px]">
            {capturedSnapshot ? (
              <img
                src={capturedSnapshot}
                alt="3D Straightness View"
                className="h-[115px] w-auto object-contain mx-auto rounded border border-slate-200"
              />
            ) : (
              <>
                {/* FRONT Diagram */}
                <div className="text-center flex-1">
                  <svg viewBox="0 0 280 85" className="w-full h-full max-h-[85px] mx-auto">
                    <g stroke="#334155" strokeWidth="1" fill="#f1f5f9">
                      <polygon points="20,20 250,55 250,75 20,40" />
                      <polygon points="20,20 250,55 240,50 10,15" fill="#e2e8f0" />
                      <polygon points="250,55 260,58 260,78 250,75" fill="#cbd5e1" />
                      {/* Red Centerline (Straightness) */}
                      <line x1="20" y1="20" x2="250" y2="55" stroke="#ef4444" strokeWidth="2.5" />
                      <text x="135" y="32" fontSize="8" fontWeight="bold" fill="#ef4444">Straightness Line</text>
                    </g>
                    <text x="140" y="80" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0f172a">
                      FRONT
                    </text>
                  </svg>
                </div>

                {/* REAR Diagram */}
                <div className="text-center flex-1">
                  <svg viewBox="0 0 280 85" className="w-full h-full max-h-[85px] mx-auto">
                    <g stroke="#334155" strokeWidth="1" fill="#f1f5f9">
                      <polygon points="20,20 250,55 250,75 20,40" />
                      <polygon points="20,20 250,55 240,50 10,15" fill="#e2e8f0" />
                      <polygon points="250,55 260,58 260,78 250,75" fill="#cbd5e1" />
                      {/* Red Centerline (Straightness) */}
                      <line x1="20" y1="20" x2="250" y2="55" stroke="#ef4444" strokeWidth="2.5" />
                      <text x="135" y="32" fontSize="8" fontWeight="bold" fill="#ef4444">Straightness Line</text>
                    </g>
                    <text x="140" y="80" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0f172a">
                      REAR
                    </text>
                  </svg>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 30-Point Straightness Measurement Table */}
        <table className="w-full border-collapse border-[1.5px] border-slate-950 text-[10px]">
          <thead>
            <tr className="border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950">
              <th colSpan={2} className="bg-[#D9F2E6] font-black py-0.5 text-center w-1/2">
                FRONT PLATE (㎛)
              </th>
              <th colSpan={2} className="bg-[#D9F2E6] font-black py-0.5 text-center w-1/2">
                REAR PLATE (㎛)
              </th>
            </tr>
            <tr className="border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950 text-center font-bold bg-[#E8F8F0]">
              <th className="py-0.5 w-[15%]">No</th>
              <th className="py-0.5 w-[35%]">Line Data</th>
              <th className="py-0.5 w-[15%]">No</th>
              <th className="py-0.5 w-[35%]">Line Data</th>
            </tr>
          </thead>
          <tbody className="divide-y-[1px] divide-slate-950 text-center font-mono text-[9.5px]">
            {recipe.straightnessMeasurements.map((sm, index) => {
              return (
                <tr key={index} className="divide-x-[1.5px] divide-slate-950 hover:bg-slate-50">
                  <td className="font-bold py-[1.2px] bg-slate-50/50">{index + 1}</td>
                  <td className="py-[1.2px]">
                    {isEditMode ? (
                      <input
                        type="number"
                        step="0.1"
                        value={sm.frontLine}
                        onChange={(e) => handleStraightnessChange(index, 'frontLine', e.target.value)}
                        className="w-full text-center bg-blue-50 border border-blue-300 rounded font-mono"
                      />
                    ) : (
                      sm.frontLine.toFixed(2)
                    )}
                  </td>

                  <td className="font-bold py-[1.2px] bg-slate-50/50">{index + 1}</td>
                  <td className="py-[1.2px]">
                    {isEditMode ? (
                      <input
                        type="number"
                        step="0.1"
                        value={sm.rearLine}
                        onChange={(e) => handleStraightnessChange(index, 'rearLine', e.target.value)}
                        className="w-full text-center bg-blue-50 border border-blue-300 rounded font-mono"
                      />
                    ) : (
                      sm.rearLine.toFixed(2)
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            {/* Max */}
            <tr className="border-t-[1.5px] border-b-[1px] border-slate-950 divide-x-[1.5px] divide-slate-950 font-mono text-[10px] font-bold">
              <td className="font-sans font-bold bg-slate-100 py-0.5">Max.</td>
              <td className="py-0.5">{frontMax.toFixed(1)}</td>

              <td className="font-sans font-bold bg-slate-100 py-0.5">Max.</td>
              <td className="py-0.5">{rearMax.toFixed(1)}</td>
            </tr>

            {/* Min */}
            <tr className="border-b-[1px] border-slate-950 divide-x-[1.5px] divide-slate-950 font-mono text-[10px] font-bold">
              <td className="font-sans font-bold bg-slate-100 py-0.5">Min.</td>
              <td className="py-0.5">{frontMin.toFixed(1)}</td>

              <td className="font-sans font-bold bg-slate-100 py-0.5">Min.</td>
              <td className="py-0.5">{rearMin.toFixed(1)}</td>
            </tr>

            {/* Straightness (진직도) */}
            <tr className="border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950 font-mono text-[10.5px] font-black bg-blue-50/20">
              <td className="font-sans font-black bg-[#D9F2E6] py-0.5">Straightness</td>
              <td className="py-0.5 text-blue-700">{frontStraightness.toFixed(1)}</td>

              <td className="font-sans font-black bg-[#D9F2E6] py-0.5">Straightness</td>
              <td className="py-0.5 text-blue-700">{rearStraightness.toFixed(1)}</td>
            </tr>
          </tfoot>
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

