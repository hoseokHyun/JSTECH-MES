import React from 'react';
import { CertHeader } from './CertHeader';
import { ProductSpecRecipe } from '../SlotDieCertificateView';
import { Camera } from 'lucide-react';

interface CertPage5Props {
  recipe: ProductSpecRecipe;
  capturedSnapshot?: string;
  pageNo?: number;
  totalPages?: number;
  isEditMode?: boolean;
  onOpen3DModal?: () => void;
  onUpdateRecipe?: (recipe: ProductSpecRecipe) => void;
}

export const CertPage5: React.FC<CertPage5Props> = ({
  recipe,
  capturedSnapshot,
  pageNo = 5,
  totalPages = 8,
  isEditMode = false,
  onOpen3DModal,
  onUpdateRecipe
}) => {
  const frontOpticals = [
    { id: '①', val: 0.298 },
    { id: '②', val: 0.297 },
    { id: '③', val: 0.299 },
    { id: '④', val: 0.298 },
    { id: '⑤', val: 0.297 },
    { id: '⑥', val: 0.299 }
  ];

  const rearOpticals = [
    { id: '①', val: 0.299 },
    { id: '②', val: 0.298 },
    { id: '③', val: 0.300 },
    { id: '④', val: 0.299 },
    { id: '⑤', val: 0.298 },
    { id: '⑥', val: 0.299 }
  ];

  const renderMicroscopeView = (label: string, value: number, isRear: boolean) => {
    return (
      <div className="border border-slate-900 flex flex-col bg-slate-950 overflow-hidden">
        {/* Label Bar */}
        <div className="bg-slate-100 text-slate-950 text-[9.5px] font-black px-2 py-0.5 flex justify-between border-b border-slate-900">
          <span>{label}</span>
          <span className="font-mono font-bold text-blue-700">{value.toFixed(3)} mm</span>
        </div>
        {/* Optical Cross-Section Canvas */}
        <div className="h-[74px] relative bg-slate-900 flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 160 80" className="w-full h-full" fill="none">
            {/* Dark microscope steel background */}
            <rect width="160" height="80" fill="#0f172a" />

            {/* Steel Top Plate Bevel (Front or Rear) */}
            <polygon
              points="0,0 160,0 160,28 110,28 0,38"
              fill="#334155"
              stroke="#64748b"
              strokeWidth="0.8"
            />
            {/* Mirror Finish Lip Tip */}
            <line x1="0" y1="38" x2="160" y2="38" stroke="#38bdf8" strokeWidth="1.5" />

            {/* Lower Plate / Reference Datum */}
            <polygon
              points="0,52 160,52 160,80 0,80"
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="0.8"
            />

            {/* Blue Optical Laser Measurement Reticle */}
            <line x1="80" y1="0" x2="80" y2="80" stroke="#0284c7" strokeWidth="0.6" strokeDasharray="2,2" opacity="0.6" />
            <line x1="0" y1="45" x2="160" y2="45" stroke="#0284c7" strokeWidth="0.6" strokeDasharray="2,2" opacity="0.6" />

            {/* Dimension Gauge Overlay */}
            <line x1="75" y1="38" x2="75" y2="52" stroke="#22c55e" strokeWidth="1.2" />
            <line x1="71" y1="38" x2="79" y2="38" stroke="#22c55e" strokeWidth="1.2" />
            <line x1="71" y1="52" x2="79" y2="52" stroke="#22c55e" strokeWidth="1.2" />
            <text x="86" y="47" fill="#4ade80" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
              {value.toFixed(3)}
            </text>
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="a4-page bg-white text-slate-950 w-[794px] min-h-[1123px] mx-auto p-[28px] flex flex-col justify-between box-border border border-slate-300 print:border-none print:shadow-none shadow-xl print:m-0 print:p-[24px]">
      <div className="space-y-2">
        {/* Header */}
        <CertHeader
          title="검사 성적서_첨부"
          subTitle="(광학 검사)"
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
          <div className="bg-[#D9F2E6] text-slate-950 text-[11px] font-black py-0.5 px-3 flex items-center justify-between border-b-[1.5px] border-slate-950">
            <span>광학검사 데이터_Measurement Point (Lip Section Inspection)</span>
            {onOpen3DModal && (
              <button
                type="button"
                onClick={onOpen3DModal}
                className="print:hidden text-[10px] bg-white text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-300 hover:bg-blue-50 flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3 h-3" />
                <span>3D 광학 단면 시점 변경</span>
              </button>
            )}
          </div>
          <div className="p-2 bg-white flex items-center justify-around h-[85px]">
            {capturedSnapshot ? (
              <img
                src={capturedSnapshot}
                alt="3D Optical View"
                className="h-[75px] w-auto object-contain mx-auto rounded border border-slate-200"
              />
            ) : (
              <svg viewBox="0 0 540 65" className="w-full h-full max-h-[65px] mx-auto">
                <g stroke="#334155" strokeWidth="1" fill="#f1f5f9">
                  <polygon points="40,15 480,35 480,50 40,30" />
                  <polygon points="40,15 480,35 470,32 30,12" fill="#e2e8f0" />
                  {/* 6 Inspection Points with red dots */}
                  {[...Array(6)].map((_, i) => (
                    <g key={i}>
                      <circle cx={70 + i * 78} cy={17 + i * 3.4} r="3" fill="#ef4444" />
                      <text x={70 + i * 78} y={11 + i * 3.4} textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#ef4444">
                        {['①', '②', '③', '④', '⑤', '⑥'][i]}
                      </text>
                    </g>
                  ))}
                </g>
              </svg>
            )}
          </div>
        </div>

        {/* Criteria Summary Table */}
        <table className="w-full border-collapse border-[1.5px] border-slate-950 text-[11px]">
          <thead>
            <tr className="border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950">
              <th colSpan={4} className="bg-[#D9F2E6] font-black py-0.5 text-center w-1/2">
                FRONT PLATE (Lip Thickness)
              </th>
              <th colSpan={4} className="bg-[#D9F2E6] font-black py-0.5 text-center w-1/2">
                REAR PLATE (Lip Thickness)
              </th>
            </tr>
            <tr className="divide-x-[1.5px] divide-slate-950 text-center font-bold text-[10px]">
              <th className="py-0.5 w-[14%] bg-slate-50">규격</th>
              <th className="py-0.5 w-[16%]">0.3 ± 0.005 mm</th>
              <th className="py-0.5 w-[10%] bg-slate-50">측정값 (평균)</th>
              <th className="py-0.5 w-[10%] font-mono text-blue-700">0.298 mm</th>

              <th className="py-0.5 w-[14%] bg-slate-50">규격</th>
              <th className="py-0.5 w-[16%]">0.3 ± 0.005 mm</th>
              <th className="py-0.5 w-[10%] bg-slate-50">측정값 (평균)</th>
              <th className="py-0.5 w-[10%] font-mono text-blue-700">0.299 mm</th>
            </tr>
          </thead>
        </table>

        {/* 12 Optical Microscope Photos Grid (6 Front + 6 Rear) */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          {/* Column 1: FRONT PLATE 1 ~ 6 */}
          <div className="space-y-1.5">
            <div className="bg-[#D9F2E6] text-slate-950 text-[10.5px] font-black py-0.5 text-center border-[1.5px] border-slate-950">
              FRONT PLATE (6 Points)
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {frontOpticals.map((item) => (
                <div key={item.id}>
                  {renderMicroscopeView(`FRONT ${item.id}`, item.val, false)}
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: REAR PLATE 1 ~ 6 */}
          <div className="space-y-1.5">
            <div className="bg-[#D9F2E6] text-slate-950 text-[10.5px] font-black py-0.5 text-center border-[1.5px] border-slate-950">
              REAR PLATE (6 Points)
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {rearOpticals.map((item) => (
                <div key={item.id}>
                  {renderMicroscopeView(`REAR ${item.id}`, item.val, true)}
                </div>
              ))}
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
