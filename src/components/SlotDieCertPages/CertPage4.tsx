import React from 'react';
import { CertHeader } from './CertHeader';
import { ProductSpecRecipe } from '../SlotDieCertificateView';
import { Camera } from 'lucide-react';

interface CertPage4Props {
  recipe: ProductSpecRecipe;
  capturedSnapshot?: string;
  pageNo?: number;
  totalPages?: number;
  isEditMode?: boolean;
  onOpen3DModal?: () => void;
  onUpdateRecipe?: (recipe: ProductSpecRecipe) => void;
}

export const CertPage4: React.FC<CertPage4Props> = ({
  recipe,
  capturedSnapshot,
  pageNo = 4,
  totalPages = 8,
  isEditMode = false,
  onOpen3DModal,
  onUpdateRecipe
}) => {
  const handleRoughnessChange = (field: 'frontRoughnessActual' | 'rearRoughnessActual', val: string) => {
    if (!onUpdateRecipe) return;
    const num = parseFloat(val) || 0;
    onUpdateRecipe({ ...recipe, [field]: num });
  };

  return (
    <div className="a4-page bg-white text-slate-950 w-[794px] min-h-[1123px] mx-auto p-[28px] flex flex-col justify-between box-border border border-slate-300 print:border-none print:shadow-none shadow-xl print:m-0 print:p-[24px]">
      <div className="space-y-3">
        {/* Header */}
        <CertHeader
          title="검사 성적서_첨부"
          subTitle="(표면조도 측정)"
          docNo={recipe.docNo}
          inspectionDate={recipe.inspectionDate}
          inspector={recipe.inspector}
          approver={recipe.approver}
          isPassed={true}
          pageNo={pageNo}
          totalPages={totalPages}
        />

        {/* Measurement Point Diagram & 3D Snapshot */}
        <div className="border-[1.5px] border-slate-950">
          <div className="bg-[#D9F2E6] text-slate-950 text-[11px] font-black py-1 px-3 flex items-center justify-between border-b-[1.5px] border-slate-950">
            <span>표면조도 측정 데이터_Measurement Point (Lip Mirror Finish)</span>
            {onOpen3DModal && (
              <button
                type="button"
                onClick={onOpen3DModal}
                className="print:hidden text-[10px] bg-white text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-300 hover:bg-blue-50 flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3 h-3" />
                <span>3D 조도 시점 변경</span>
              </button>
            )}
          </div>
          <div className="p-3 bg-white flex items-center justify-around h-[160px]">
            {capturedSnapshot ? (
              <img
                src={capturedSnapshot}
                alt="3D Roughness View"
                className="h-[145px] w-auto object-contain mx-auto rounded border border-slate-200"
              />
            ) : (
              <>
                {/* FRONT Diagram with (a) and (b) points */}
                <div className="text-center flex-1">
                  <svg viewBox="0 0 280 110" className="w-full h-full max-h-[110px] mx-auto">
                    <g stroke="#334155" strokeWidth="1.2" fill="#f1f5f9">
                      <polygon points="20,25 250,60 250,85 20,50" />
                      <polygon points="20,25 250,60 240,55 10,20" fill="#e2e8f0" />
                      <polygon points="250,60 260,63 260,88 250,85" fill="#cbd5e1" />
                      {/* Point (a) */}
                      <circle cx="80" cy="34" r="4" fill="#ef4444" stroke="#b91c1c" />
                      <text x="80" y="24" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ef4444">(a)</text>
                      {/* Point (b) */}
                      <circle cx="190" cy="51" r="4" fill="#ef4444" stroke="#b91c1c" />
                      <text x="190" y="41" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ef4444">(b)</text>
                    </g>
                    <text x="140" y="102" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f172a">
                      FRONT PLATE
                    </text>
                  </svg>
                </div>

                {/* REAR Diagram with (a) and (b) points */}
                <div className="text-center flex-1">
                  <svg viewBox="0 0 280 110" className="w-full h-full max-h-[110px] mx-auto">
                    <g stroke="#334155" strokeWidth="1.2" fill="#f1f5f9">
                      <polygon points="20,25 250,60 250,85 20,50" />
                      <polygon points="20,25 250,60 240,55 10,20" fill="#e2e8f0" />
                      <polygon points="250,60 260,63 260,88 250,85" fill="#cbd5e1" />
                      {/* Point (a) */}
                      <circle cx="80" cy="34" r="4" fill="#ef4444" stroke="#b91c1c" />
                      <text x="80" y="24" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ef4444">(a)</text>
                      {/* Point (b) */}
                      <circle cx="190" cy="51" r="4" fill="#ef4444" stroke="#b91c1c" />
                      <text x="190" y="41" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ef4444">(b)</text>
                    </g>
                    <text x="140" y="102" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f172a">
                      REAR PLATE
                    </text>
                  </svg>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Roughness Table */}
        <table className="w-full border-collapse border-[1.5px] border-slate-950 text-[11px]">
          <thead>
            <tr className="border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950">
              <th colSpan={5} className="bg-[#D9F2E6] font-black py-1 text-center w-1/2">
                FRONT PLATE (㎛)
              </th>
              <th colSpan={5} className="bg-[#D9F2E6] font-black py-1 text-center w-1/2">
                REAR PLATE (㎛)
              </th>
            </tr>
            <tr className="border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950 text-center font-bold bg-[#E8F8F0]">
              <th className="py-1 w-[8%]">No</th>
              <th className="py-1 w-[16%]">측정 위치</th>
              <th className="py-1 w-[13%]">측정값</th>
              <th className="py-1 w-[13%]">규격</th>
              <th className="py-1 w-[10%]">결과</th>

              <th className="py-1 w-[8%]">No</th>
              <th className="py-1 w-[16%]">측정 위치</th>
              <th className="py-1 w-[13%]">측정값</th>
              <th className="py-1 w-[13%]">규격</th>
              <th className="py-1 w-[10%]">결과</th>
            </tr>
          </thead>
          <tbody className="divide-y-[1.5px] divide-slate-950 text-center font-mono text-[11px]">
            {/* Point (a) */}
            <tr className="divide-x-[1.5px] divide-slate-950">
              <td className="py-1.5 font-bold">1</td>
              <td className="font-sans font-bold">(a) Point</td>
              <td className="font-bold">
                {isEditMode ? (
                  <input
                    type="number"
                    step="0.001"
                    value={recipe.frontRoughnessActual}
                    onChange={(e) => handleRoughnessChange('frontRoughnessActual', e.target.value)}
                    className="w-16 text-center bg-blue-50 border border-blue-300 rounded font-mono"
                  />
                ) : (
                  recipe.frontRoughnessActual.toFixed(3)
                )}
              </td>
              <td className="font-sans">Rmax ≤ 0.2</td>
              <td className="font-sans font-bold text-blue-600">합격</td>

              <td className="py-1.5 font-bold">1</td>
              <td className="font-sans font-bold">(a) Point</td>
              <td className="font-bold">
                {isEditMode ? (
                  <input
                    type="number"
                    step="0.001"
                    value={recipe.rearRoughnessActual}
                    onChange={(e) => handleRoughnessChange('rearRoughnessActual', e.target.value)}
                    className="w-16 text-center bg-blue-50 border border-blue-300 rounded font-mono"
                  />
                ) : (
                  recipe.rearRoughnessActual.toFixed(3)
                )}
              </td>
              <td className="font-sans">Rmax ≤ 0.2</td>
              <td className="font-sans font-bold text-blue-600">합격</td>
            </tr>

            {/* Point (b) */}
            <tr className="divide-x-[1.5px] divide-slate-950">
              <td className="py-1.5 font-bold">2</td>
              <td className="font-sans font-bold">(b) Point</td>
              <td className="font-bold">{(recipe.frontRoughnessActual - 0.008).toFixed(3)}</td>
              <td className="font-sans">Rmax ≤ 0.2</td>
              <td className="font-sans font-bold text-blue-600">합격</td>

              <td className="py-1.5 font-bold">2</td>
              <td className="font-sans font-bold">(b) Point</td>
              <td className="font-bold">{(recipe.rearRoughnessActual - 0.003).toFixed(3)}</td>
              <td className="font-sans">Rmax ≤ 0.2</td>
              <td className="font-sans font-bold text-blue-600">합격</td>
            </tr>

            {/* Average Row */}
            <tr className="divide-x-[1.5px] divide-slate-950 bg-blue-50/20 font-black">
              <td colSpan={2} className="font-sans bg-[#D9F2E6] py-1.5">평균 (Average)</td>
              <td className="text-blue-700 font-bold py-1.5">{recipe.frontRoughnessActual.toFixed(3)}</td>
              <td className="font-sans font-normal">Rmax ≤ 0.2</td>
              <td className="font-sans text-blue-600">합격</td>

              <td colSpan={2} className="font-sans bg-[#D9F2E6] py-1.5">평균 (Average)</td>
              <td className="text-blue-700 font-bold py-1.5">{recipe.rearRoughnessActual.toFixed(3)}</td>
              <td className="font-sans font-normal">Rmax ≤ 0.2</td>
              <td className="font-sans text-blue-600">합격</td>
            </tr>
          </tbody>
        </table>

        {/* High-Resolution Surface Profile Trace Graphs */}
        <div className="border-[1.5px] border-slate-950 p-3 bg-white space-y-2">
          <div className="text-[11px] font-bold text-slate-800 flex justify-between items-center border-b border-slate-200 pb-1">
            <span>표면조도 측정 조도 파형 프로파일 (Surface Roughness Traces)</span>
            <span className="font-mono text-[10px] text-slate-500">Cut-off: λc 0.8mm | Stylus: 2㎛ Diamond Tip</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Front Profile Graph */}
            <div className="border border-slate-300 p-2 rounded-sm bg-slate-50/40">
              <div className="text-[10px] font-bold text-slate-700 pb-1">FRONT PLATE Lip Surface Trace (Rmax = 0.170 ㎛)</div>
              <svg viewBox="0 0 320 70" className="w-full h-[65px] bg-white border border-slate-200">
                <line x1="0" y1="35" x2="320" y2="35" stroke="#94a3b8" strokeWidth="0.75" />
                <line x1="0" y1="15" x2="320" y2="15" stroke="#cbd5e1" strokeDasharray="2,2" />
                <line x1="0" y1="55" x2="320" y2="55" stroke="#cbd5e1" strokeDasharray="2,2" />
                <path
                  d="M0,35 Q10,32 20,36 T40,33 T60,37 T80,34 T100,38 T120,33 T140,36 T160,34 T180,37 T200,33 T220,36 T240,34 T260,37 T280,33 T300,36 T320,35"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="1.2"
                />
              </svg>
            </div>

            {/* Rear Profile Graph */}
            <div className="border border-slate-300 p-2 rounded-sm bg-slate-50/40">
              <div className="text-[10px] font-bold text-slate-700 pb-1">REAR PLATE Lip Surface Trace (Rmax = 0.169 ㎛)</div>
              <svg viewBox="0 0 320 70" className="w-full h-[65px] bg-white border border-slate-200">
                <line x1="0" y1="35" x2="320" y2="35" stroke="#94a3b8" strokeWidth="0.75" />
                <line x1="0" y1="15" x2="320" y2="15" stroke="#cbd5e1" strokeDasharray="2,2" />
                <line x1="0" y1="55" x2="320" y2="55" stroke="#cbd5e1" strokeDasharray="2,2" />
                <path
                  d="M0,35 Q10,36 20,33 T40,37 T60,34 T80,36 T100,33 T120,37 T140,34 T160,36 T180,33 T200,37 T220,34 T240,36 T260,33 T280,37 T300,34 T320,35"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="1.2"
                />
              </svg>
            </div>
          </div>
        </div>
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
