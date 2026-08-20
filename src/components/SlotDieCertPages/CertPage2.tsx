import React from 'react';
import { CertHeader } from './CertHeader';
import { ProductSpecRecipe } from '../SlotDieCertificateView';

interface CertPage2Props {
  recipe: ProductSpecRecipe;
}

export const CertPage2: React.FC<CertPage2Props> = ({ recipe }) => {
  return (
    <div className="a4-page bg-white text-slate-950 w-[794px] min-h-[1123px] mx-auto p-[28px] flex flex-col justify-between box-border border border-slate-300 print:border-none print:shadow-none shadow-xl print:m-0 print:p-[24px]">
      <div className="space-y-2">
        {/* Header */}
        <CertHeader
          title="검사 성적서_첨부"
          subTitle="(평면도)"
          docNo={recipe.docNo}
          inspectionDate={recipe.inspectionDate}
          inspector={recipe.inspector}
          approver={recipe.approver}
          isPassed={true}
        />

        {/* Measurement Point Diagram */}
        <div className="border-[1.5px] border-slate-950">
          <div className="bg-[#D9F2E6] text-slate-950 text-[11px] font-black py-1 px-3 text-center border-b-[1.5px] border-slate-950">
            평면도 데이터_Measurement Point
          </div>
          <div className="p-2 bg-white flex items-center justify-around h-[125px]">
            {/* FRONT Diagram */}
            <div className="text-center flex-1">
              <svg viewBox="0 0 280 85" className="w-full h-full max-h-[85px] mx-auto">
                <g stroke="#334155" strokeWidth="1" fill="#f1f5f9">
                  <polygon points="20,20 250,55 250,75 20,40" />
                  <polygon points="20,20 250,55 240,50 10,15" fill="#e2e8f0" />
                  <polygon points="250,55 260,58 260,78 250,75" fill="#cbd5e1" />
                  {/* Red Line A (Lip) */}
                  <line x1="20" y1="20" x2="250" y2="55" stroke="#ef4444" strokeWidth="2.5" />
                  {/* Red Line B (Bolt) */}
                  <line x1="14" y1="28" x2="244" y2="63" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,1" />
                  <text x="18" y="14" fontSize="8" fontWeight="bold" fill="#ef4444">(A)</text>
                  <text x="8" y="32" fontSize="8" fontWeight="bold" fill="#ef4444">(B)</text>
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
                  {/* Red Line A (Lip) */}
                  <line x1="20" y1="20" x2="250" y2="55" stroke="#ef4444" strokeWidth="2.5" />
                  {/* Red Line B (Bolt) */}
                  <line x1="14" y1="28" x2="244" y2="63" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,1" />
                  <text x="18" y="14" fontSize="8" fontWeight="bold" fill="#ef4444">(A)</text>
                  <text x="8" y="32" fontSize="8" fontWeight="bold" fill="#ef4444">(B)</text>
                </g>
                <text x="140" y="80" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0f172a">
                  REAR
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* 30-Point Flatness Measurement Table */}
        <table className="w-full border-collapse border-[1.5px] border-slate-950 text-[10px]">
          <thead>
            <tr className="border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950">
              <th colSpan={5} className="bg-[#D9F2E6] font-black py-0.5 text-center w-1/2">
                FRONT PLATE (㎛)
              </th>
              <th colSpan={5} className="bg-[#D9F2E6] font-black py-0.5 text-center w-1/2">
                REAR PLATE (㎛)
              </th>
            </tr>
            <tr className="border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950 text-center font-bold bg-[#E8F8F0]">
              <th className="py-0.5 w-[5%]">No</th>
              <th className="py-0.5 w-[11.25%]">Lip Line A1 Data</th>
              <th className="py-0.5 w-[11.25%]">Lip Line A2 Data</th>
              <th className="py-0.5 w-[11.25%]">Bolt Line B1 Data</th>
              <th className="py-0.5 w-[11.25%]">Bolt Line B2 Data</th>

              <th className="py-0.5 w-[5%]">No</th>
              <th className="py-0.5 w-[11.25%]">Lip Line A1 Data</th>
              <th className="py-0.5 w-[11.25%]">Lip Line A2 Data</th>
              <th className="py-0.5 w-[11.25%]">Bolt Line B1 Data</th>
              <th className="py-0.5 w-[11.25%]">Bolt Line B2 Data</th>
            </tr>
          </thead>
          <tbody className="divide-y-[1px] divide-slate-950 text-center font-mono text-[9.5px]">
            {recipe.frontMeasurements.map((fm, index) => {
              const rm = recipe.rearMeasurements[index] || fm;
              return (
                <tr key={index} className="divide-x-[1.5px] divide-slate-950 hover:bg-slate-50">
                  <td className="font-bold py-[1.2px] bg-slate-50/50">{index + 1}</td>
                  <td className="py-[1.2px]">{fm.lipA1 > 0 ? `${fm.lipA1.toFixed(2)}` : fm.lipA1.toFixed(2)}</td>
                  <td className="py-[1.2px]">{fm.lipA2 > 0 ? `${fm.lipA2.toFixed(2)}` : fm.lipA2.toFixed(2)}</td>
                  <td className="py-[1.2px]">{fm.boltB1 > 0 ? `${fm.boltB1.toFixed(2)}` : fm.boltB1.toFixed(2)}</td>
                  <td className="py-[1.2px]">{fm.boltB2 > 0 ? `${fm.boltB2.toFixed(2)}` : fm.boltB2.toFixed(2)}</td>

                  <td className="font-bold py-[1.2px] bg-slate-50/50">{index + 1}</td>
                  <td className="py-[1.2px]">{rm.lipA1 > 0 ? `${rm.lipA1.toFixed(2)}` : rm.lipA1.toFixed(2)}</td>
                  <td className="py-[1.2px]">{rm.lipA2 > 0 ? `${rm.lipA2.toFixed(2)}` : rm.lipA2.toFixed(2)}</td>
                  <td className="py-[1.2px]">{rm.boltB1 > 0 ? `${rm.boltB1.toFixed(2)}` : rm.boltB1.toFixed(2)}</td>
                  <td className="py-[1.2px]">{rm.boltB2 > 0 ? `${rm.boltB2.toFixed(2)}` : rm.boltB2.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            {/* Max */}
            <tr className="border-t-[1.5px] border-b-[1px] border-slate-950 divide-x-[1.5px] divide-slate-950 font-mono text-[10px] font-bold">
              <td className="font-sans font-bold bg-slate-100 py-0.5">Max.</td>
              <td colSpan={2} className="py-0.5">0.8</td>
              <td colSpan={2} className="py-0.5">0.9</td>

              <td className="font-sans font-bold bg-slate-100 py-0.5">Max.</td>
              <td colSpan={2} className="py-0.5">0.7</td>
              <td colSpan={2} className="py-0.5">1.7</td>
            </tr>

            {/* Min */}
            <tr className="border-b-[1px] border-slate-950 divide-x-[1.5px] divide-slate-950 font-mono text-[10px] font-bold">
              <td className="font-sans font-bold bg-slate-100 py-0.5">Min.</td>
              <td colSpan={2} className="py-0.5">-0.6</td>
              <td colSpan={2} className="py-0.5">-0.7</td>

              <td className="font-sans font-bold bg-slate-100 py-0.5">Min.</td>
              <td colSpan={2} className="py-0.5">-0.6</td>
              <td colSpan={2} className="py-0.5">-0.9</td>
            </tr>

            {/* Flatness */}
            <tr className="border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950 font-mono text-[10.5px] font-black bg-blue-50/20">
              <td className="font-sans font-black bg-[#D9F2E6] py-0.5">Flatness</td>
              <td colSpan={2} className="py-0.5 text-blue-700">1.4</td>
              <td colSpan={2} className="py-0.5 text-blue-700">1.6</td>

              <td className="font-sans font-black bg-[#D9F2E6] py-0.5">Flatness</td>
              <td colSpan={2} className="py-0.5 text-blue-700">1.2</td>
              <td colSpan={2} className="py-0.5 text-blue-700">2.7</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Fixed Bottom Footer */}
      <div className="pt-2 flex justify-between items-center text-[10.5px] font-mono text-slate-900 border-t border-transparent select-none">
        <div>JS-COA-01</div>
        <div className="font-sans font-bold">JUNSUNG TECH Co., Ltd</div>
        <div className="w-16 text-right font-bold">Page 1/8</div>
      </div>
    </div>
  );
};
