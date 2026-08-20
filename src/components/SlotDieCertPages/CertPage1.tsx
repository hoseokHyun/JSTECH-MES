import React from 'react';
import { CertHeader } from './CertHeader';
import { ProductSpecRecipe } from '../SlotDieCertificateView';

interface CertPage1Props {
  recipe: ProductSpecRecipe;
  captured3DSnapshot?: string;
  onOpen3DModal: () => void;
}

export const CertPage1: React.FC<CertPage1Props> = ({
  recipe,
  captured3DSnapshot,
  onOpen3DModal
}) => {
  // 30-Point Trend Line Chart SVG Generator
  const renderTrendChart = (data: number[], color: string = '#0284c7', color2?: string, data2?: number[]) => {
    const width = 210;
    const height = 90;
    const paddingX = 38;
    const paddingY = 12;
    const chartW = width - paddingX - 10;
    const chartH = height - paddingY * 2;

    const minVal = -0.005;
    const maxVal = 0.005;

    const getY = (val: number) => {
      // In millimeters (val is in mm, e.g. 0.001 mm = 1.0 ㎛)
      const clamped = Math.max(minVal, Math.min(maxVal, val));
      const ratio = (clamped - minVal) / (maxVal - minVal);
      return paddingY + chartH * (1 - ratio);
    };

    const getX = (index: number) => {
      return paddingX + (index * chartW) / (data.length - 1 || 1);
    };

    // Points for line 1
    const points1 = data.map((d, i) => `${getX(i)},${getY(d)}`).join(' ');
    // Points for line 2 (if present)
    const points2 = data2 ? data2.map((d, i) => `${getX(i)},${getY(d)}`).join(' ') : null;

    const yLevels = [0.005, 0.003, 0.001, -0.001, -0.003, -0.005];

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full block bg-white">
        {/* Y Axis Grid Lines & Labels */}
        {yLevels.map((val) => {
          const y = getY(val);
          return (
            <g key={val}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - 8}
                y2={y}
                stroke={val === 0 ? '#94a3b8' : '#e2e8f0'}
                strokeWidth={val === 0 ? 1 : 0.75}
                strokeDasharray={val === 0 ? 'none' : '2,2'}
              />
              <text
                x={paddingX - 4}
                y={y + 3}
                textAnchor="end"
                fontSize="6.5"
                fontFamily="monospace"
                fill="#64748b"
              >
                {val > 0 ? `0.00${Math.round(val * 1000)}` : `-0.00${Math.abs(Math.round(val * 1000))}`}
              </text>
            </g>
          );
        })}

        {/* Data Line 1 */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.2"
          points={points1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data Line 2 (Orange/Amber) */}
        {points2 && (
          <polyline
            fill="none"
            stroke={color2 || '#f59e0b'}
            strokeWidth="1.2"
            points={points2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2,1"
          />
        )}
      </svg>
    );
  };

  // Sample or actual data normalized to mm (e.g. 0.0008 mm = 0.8 ㎛)
  const frontLipFlatnessData = recipe.frontMeasurements.map((m) => m.lipA1 * 0.001);
  const frontLipFlatnessData2 = recipe.frontMeasurements.map((m) => m.lipA2 * 0.001);
  const frontBoltFlatnessData = recipe.frontMeasurements.map((m) => m.boltB1 * 0.001);
  const frontBoltFlatnessData2 = recipe.frontMeasurements.map((m) => m.boltB2 * 0.001);
  const frontStraightnessData = recipe.straightnessMeasurements.map((s) => s.frontLine * 0.001);

  const rearLipFlatnessData = recipe.rearMeasurements.map((m) => m.lipA1 * 0.001);
  const rearLipFlatnessData2 = recipe.rearMeasurements.map((m) => m.lipA2 * 0.001);
  const rearBoltFlatnessData = recipe.rearMeasurements.map((m) => m.boltB1 * 0.001);
  const rearBoltFlatnessData2 = recipe.rearMeasurements.map((m) => m.boltB2 * 0.001);
  const rearStraightnessData = recipe.straightnessMeasurements.map((s) => s.rearLine * 0.001);

  return (
    <div className="a4-page bg-white text-slate-950 w-[794px] min-h-[1123px] mx-auto p-[28px] flex flex-col justify-between box-border border border-slate-300 print:border-none print:shadow-none shadow-xl print:m-0 print:p-[24px]">
      <div className="space-y-2">
        {/* Header */}
        <CertHeader
          title="검사 성적서"
          docNo={recipe.docNo}
          inspectionDate={recipe.inspectionDate}
          inspector={recipe.inspector}
          approver={recipe.approver}
          isPassed={true}
        />

        {/* 1. Item Metadata Info Table */}
        <table className="w-full border-collapse border-[1.5px] border-slate-950 text-[11px]">
          <tbody>
            <tr className="border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950">
              <th className="bg-[#D9F2E6] font-black py-1 px-2 w-[14%] text-center">고객사</th>
              <td className="py-1 px-3 w-[26%] text-center font-bold">{recipe.customer}</td>
              <th className="bg-[#D9F2E6] font-black py-1 px-2 w-[14%] text-center">품목명</th>
              <td className="py-1 px-3 w-[26%] text-center font-bold">{recipe.productName}</td>
              <th className="bg-[#D9F2E6] font-black py-1 px-2 w-[10%] text-center">규격</th>
              <td className="py-1 px-3 w-[10%] text-center font-bold font-mono">{recipe.specLength}mm</td>
              <th className="bg-[#D9F2E6] font-black py-1 px-2 w-[10%] text-center">재질</th>
              <td className="py-1 px-3 w-[10%] text-center font-bold">{recipe.material}</td>
            </tr>
            <tr className="divide-x-[1.5px] divide-slate-950">
              <th className="bg-[#D9F2E6] font-black py-1 px-2 text-center">입고일</th>
              <td className="py-1 px-3 text-center font-mono">{recipe.incomingDate || '-'}</td>
              <th className="bg-[#D9F2E6] font-black py-1 px-2 text-center">출고일</th>
              <td className="py-1 px-3 text-center font-mono">{recipe.outgoingDate || '-'}</td>
              <th className="bg-[#D9F2E6] font-black py-1 px-2 text-center">제작 구분</th>
              <td className="py-1 px-2 text-center">
                <div className="flex items-center justify-center gap-3 text-[10px] font-bold">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-slate-900 flex items-center justify-center text-[9px] font-black">
                      ✓
                    </span>
                    New
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="w-3 h-3 border border-slate-400" />
                    Repair
                  </span>
                </div>
              </td>
              <th className="bg-[#D9F2E6] font-black py-1 px-2 text-center">제작 범위</th>
              <td className="py-1 px-2 text-center">
                <div className="flex items-center justify-center gap-3 text-[10px] font-bold">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-slate-900 flex items-center justify-center text-[9px] font-black">
                      ✓
                    </span>
                    All
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="w-3 h-3 border border-slate-400" />
                    Lip
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 2. Shape & Dimensions Section with 3D CAD Snapshot */}
        <div className="border-[1.5px] border-slate-950">
          <div className="bg-[#D9F2E6] text-slate-950 text-[11px] font-black py-1 px-3 text-center border-b-[1.5px] border-slate-950">
            형상 및 치수
          </div>
          <div className="p-2 relative bg-white flex items-center justify-center min-h-[175px] max-h-[195px] overflow-hidden group">
            {captured3DSnapshot ? (
              <img
                src={captured3DSnapshot}
                alt="Slot Die 3D Captured Model"
                className="max-h-[175px] object-contain mx-auto"
              />
            ) : (
              /* High-Fidelity Slot Die Technical Drawing SVG */
              <svg viewBox="0 0 720 180" className="w-full max-h-[175px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* 3D Isometric Slot Die Body */}
                <g stroke="#334155" strokeWidth="1.4" fill="#f8fafc">
                  {/* Front Plate Body */}
                  <polygon points="120,40 520,110 520,155 120,85" fill="#f1f5f9" />
                  {/* Rear Plate Body Top */}
                  <polygon points="120,40 520,110 500,104 100,34" fill="#e2e8f0" />
                  {/* Right End Face */}
                  <polygon points="520,110 540,115 540,160 520,155" fill="#cbd5e1" />
                  {/* Mirror Lip Landing Bevel */}
                  <polygon points="120,40 520,110 521,114 121,44" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.2" />

                  {/* Bolt Array along body */}
                  {[...Array(24)].map((_, i) => (
                    <circle
                      key={i}
                      cx={140 + i * 16}
                      cy={62 + i * 2.9}
                      r="2.5"
                      fill="#e2e8f0"
                      stroke="#475569"
                      strokeWidth="0.8"
                    />
                  ))}
                  {[...Array(24)].map((_, i) => (
                    <circle
                      key={`b-${i}`}
                      cx={140 + i * 16}
                      cy={76 + i * 2.9}
                      r="2.5"
                      fill="#e2e8f0"
                      stroke="#475569"
                      strokeWidth="0.8"
                    />
                  ))}

                  {/* Top Adjusting Bolts Array (43 bolts) */}
                  {[...Array(38)].map((_, i) => (
                    <circle
                      key={`adj-${i}`}
                      cx={112 + i * 10.6}
                      cy={37 + i * 1.9}
                      r="1.5"
                      fill="#94a3b8"
                      stroke="#334155"
                      strokeWidth="0.6"
                    />
                  ))}
                </g>

                {/* Callout Labels & Dimension Arrows */}
                <g fontSize="10" fontFamily="sans-serif" fontWeight="bold" fill="#0f172a">
                  {/* Callout (1) FRONT */}
                  <text x="350" y="32" textAnchor="middle">
                    (1)
                  </text>
                  <text x="350" y="44" textAnchor="middle" fontSize="8" fill="#64748b">
                    FRONT
                  </text>

                  {/* Callout (1) REAR */}
                  <text x="290" y="125" textAnchor="middle">
                    (1)
                  </text>
                  <text x="290" y="137" textAnchor="middle" fontSize="8" fill="#64748b">
                    REAR
                  </text>

                  {/* Callout (2) Height */}
                  <line x1="550" y1="115" x2="550" y2="160" stroke="#0f172a" strokeWidth="1" markerEnd="url(#arrow)" />
                  <text x="558" y="140" fontSize="9">
                    (2)
                  </text>

                  {/* Callout (3) Thickness */}
                  <line x1="520" y1="168" x2="540" y2="168" stroke="#0f172a" strokeWidth="1" />
                  <text x="530" y="178" textAnchor="middle" fontSize="9">
                    (3)
                  </text>

                  {/* Lip Cross-section Inset Callout (4) */}
                  <rect x="560" y="25" width="70" height="75" fill="#f8fafc" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" />
                  <polygon points="575,85 615,85 605,35 585,35" fill="#e2e8f0" stroke="#334155" strokeWidth="1.2" />
                  <line x1="585" y1="32" x2="605" y2="32" stroke="#0284c7" strokeWidth="1.5" />
                  <text x="595" y="20" textAnchor="middle" fontSize="9">
                    (4)
                  </text>
                </g>
              </svg>
            )}

            {/* Quick 3D CAD Live Rotate / Capture Button */}
            <button
              onClick={onOpen3DModal}
              className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-white/90 hover:bg-white text-blue-700 border border-blue-300 text-[10px] font-bold shadow-xs transition cursor-pointer print:hidden flex items-center gap-1"
            >
              <span>3D CAD 시점 조작 및 고정</span>
            </button>
          </div>
        </div>

        {/* 3. Measurement Data Table (FRONT PLATE & REAR PLATE) */}
        <table className="w-full border-collapse border-[1.5px] border-slate-950 text-[11px]">
          <thead>
            <tr className="border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950">
              <th colSpan={5} className="bg-[#D9F2E6] font-black py-1 text-center w-1/2">
                FRONT PLATE
              </th>
              <th colSpan={5} className="bg-[#D9F2E6] font-black py-1 text-center w-1/2">
                REAR PLATE
              </th>
            </tr>
            <tr className="border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950 text-center font-bold text-[10.5px]">
              <th className="py-0.5 w-[5%]">No</th>
              <th className="py-0.5 w-[14%]">항목</th>
              <th className="py-0.5 w-[15%]">규격</th>
              <th className="py-0.5 w-[11%]">측정값</th>
              <th className="py-0.5 w-[5%]">결과</th>

              <th className="py-0.5 w-[5%]">No</th>
              <th className="py-0.5 w-[14%]">항목</th>
              <th className="py-0.5 w-[15%]">규격</th>
              <th className="py-0.5 w-[11%]">측정값</th>
              <th className="py-0.5 w-[5%]">결과</th>
            </tr>
          </thead>
          <tbody className="divide-y-[1.5px] divide-slate-950 text-center font-mono text-[10.5px]">
            {/* Row 1: Length */}
            <tr className="divide-x-[1.5px] divide-slate-950">
              <td className="py-0.5">1</td>
              <td className="font-sans font-medium">Length</td>
              <td>1580±0.3</td>
              <td className="font-bold">{recipe.frontLengthActual.toFixed(2)} <span className="font-normal text-[9px]">mm</span></td>
              <td className="font-sans font-bold text-blue-600">합격</td>

              <td className="py-0.5">1</td>
              <td className="font-sans font-medium">Length</td>
              <td>1493±0.1</td>
              <td className="font-bold">{recipe.rearLengthActual.toFixed(2)} <span className="font-normal text-[9px]">mm</span></td>
              <td className="font-sans font-bold text-blue-600">합격</td>
            </tr>

            {/* Row 2: Height */}
            <tr className="divide-x-[1.5px] divide-slate-950">
              <td className="py-0.5">2</td>
              <td className="font-sans font-medium">Height</td>
              <td>160±0.2</td>
              <td className="font-bold">{recipe.frontHeightActual.toFixed(2)} <span className="font-normal text-[9px]">mm</span></td>
              <td className="font-sans font-bold text-blue-600">합격</td>

              <td className="py-0.5">2</td>
              <td className="font-sans font-medium">Height</td>
              <td>160±0.2</td>
              <td className="font-bold">{recipe.rearHeightActual.toFixed(2)} <span className="font-normal text-[9px]">mm</span></td>
              <td className="font-sans font-bold text-blue-600">합격</td>
            </tr>

            {/* Row 3: Thickness */}
            <tr className="divide-x-[1.5px] divide-slate-950">
              <td className="py-0.5">3</td>
              <td className="font-sans font-medium">Thickness</td>
              <td>60±0.1</td>
              <td className="font-bold">{recipe.frontThicknessActual.toFixed(2)} <span className="font-normal text-[9px]">mm</span></td>
              <td className="font-sans font-bold text-blue-600">합격</td>

              <td className="py-0.5">3</td>
              <td className="font-sans font-medium">Thickness</td>
              <td>70±0.1</td>
              <td className="font-bold">{recipe.rearThicknessActual.toFixed(2)} <span className="font-normal text-[9px]">mm</span></td>
              <td className="font-sans font-bold text-blue-600">합격</td>
            </tr>

            {/* Row 4: Lip Thickness */}
            <tr className="divide-x-[1.5px] divide-slate-950">
              <td className="py-0.5">4</td>
              <td className="font-sans font-medium">Lip Thickness</td>
              <td>0.3±0.005</td>
              <td className="font-bold">{recipe.frontLipActual.toFixed(3)} <span className="font-normal text-[9px]">mm</span></td>
              <td className="font-sans font-bold text-blue-600">합격</td>

              <td className="py-0.5">4</td>
              <td className="font-sans font-medium">Lip Thickness</td>
              <td>0.3±0.005</td>
              <td className="font-bold">{recipe.rearLipActual.toFixed(3)} <span className="font-normal text-[9px]">mm</span></td>
              <td className="font-sans font-bold text-blue-600">합격</td>
            </tr>

            {/* Row 5: Gap(Step) */}
            <tr className="divide-x-[1.5px] divide-slate-950">
              <td className="py-0.5">*5</td>
              <td className="font-sans font-medium">Gap(Step)</td>
              <td>0.080±0.002</td>
              <td className="font-bold">{recipe.frontGapActual.toFixed(3)} <span className="font-normal text-[9px]">mm</span></td>
              <td className="font-sans font-bold text-blue-600">합격</td>

              <td className="py-0.5">*5</td>
              <td className="font-sans font-medium">Gap(Step)</td>
              <td>-</td>
              <td className="font-bold">- <span className="font-normal text-[9px]">mm</span></td>
              <td className="font-sans font-bold text-blue-600">합격</td>
            </tr>

            {/* Row 6: Roughness */}
            <tr className="divide-x-[1.5px] divide-slate-950">
              <td className="py-0.5">*6</td>
              <td className="font-sans font-medium">Roughness</td>
              <td>Rmax≤ 0.2</td>
              <td className="font-bold">{recipe.frontRoughnessActual.toFixed(3)} <span className="font-normal text-[9px]">㎛</span></td>
              <td className="font-sans font-bold text-blue-600">합격</td>

              <td className="py-0.5">*6</td>
              <td className="font-sans font-medium">Roughness</td>
              <td>Rmax≤ 0.2</td>
              <td className="font-bold">{recipe.rearRoughnessActual.toFixed(3)} <span className="font-normal text-[9px]">㎛</span></td>
              <td className="font-sans font-bold text-blue-600">합격</td>
            </tr>
          </tbody>
        </table>

        {/* 4. 6 Dynamic SPC Charts Section */}
        <div className="border-[1.5px] border-slate-950">
          {/* Top Criteria Header */}
          <div className="grid grid-cols-12 border-b-[1.5px] border-slate-950 text-[11px] font-black text-center divide-x-[1.5px] divide-slate-950 bg-[#D9F2E6]">
            <div className="col-span-1 py-1">항목</div>
            <div className="col-span-7 py-1">평면도 규격 ≤ 5㎛</div>
            <div className="col-span-4 py-1">진직도 규격 ≤ 5㎛</div>
          </div>

          {/* FRONT PLATE ROW */}
          <div className="grid grid-cols-12 border-b-[1.5px] border-slate-950 divide-x-[1.5px] divide-slate-950 items-stretch">
            {/* Left Vertical Label */}
            <div className="col-span-1 flex items-center justify-center font-bold text-[10px] tracking-widest text-center px-1 [writing-mode:vertical-rl] rotate-180 py-2">
              FRONT PLATE
            </div>

            {/* Chart 1: Lip Flatness Data (1.4) */}
            <div className="col-span-4 flex flex-col justify-between p-1 border-r-[1.5px] border-slate-950">
              <div className="flex justify-between items-center text-[10px] font-bold pb-0.5 px-1 border-b border-slate-200">
                <span>Lip Flatness Data</span>
                <span className="font-mono font-black text-[11px]">1.4</span>
              </div>
              <div className="h-[75px] w-full pt-1">
                {renderTrendChart(frontLipFlatnessData, '#0284c7', '#f59e0b', frontLipFlatnessData2)}
              </div>
            </div>

            {/* Chart 2: Bolt Flatness Data (1.6) */}
            <div className="col-span-3 flex flex-col justify-between p-1 border-r-[1.5px] border-slate-950">
              <div className="flex justify-between items-center text-[10px] font-bold pb-0.5 px-1 border-b border-slate-200">
                <span>Bolt Flatness Data</span>
                <span className="font-mono font-black text-[11px]">1.6</span>
              </div>
              <div className="h-[75px] w-full pt-1">
                {renderTrendChart(frontBoltFlatnessData, '#0284c7', '#f59e0b', frontBoltFlatnessData2)}
              </div>
            </div>

            {/* Chart 3: Lip Straightness Data (1.7) */}
            <div className="col-span-4 flex flex-col justify-between p-1">
              <div className="flex justify-between items-center text-[10px] font-bold pb-0.5 px-1 border-b border-slate-200">
                <span>Lip Straightness Data</span>
                <span className="font-mono font-black text-[11px]">1.7</span>
              </div>
              <div className="h-[75px] w-full pt-1">
                {renderTrendChart(frontStraightnessData, '#f59e0b')}
              </div>
            </div>
          </div>

          {/* REAR PLATE ROW */}
          <div className="grid grid-cols-12 divide-x-[1.5px] divide-slate-950 items-stretch">
            {/* Left Vertical Label */}
            <div className="col-span-1 flex items-center justify-center font-bold text-[10px] tracking-widest text-center px-1 [writing-mode:vertical-rl] rotate-180 py-2">
              REAR PLATE
            </div>

            {/* Chart 4: Lip Flatness Data (1.2) */}
            <div className="col-span-4 flex flex-col justify-between p-1 border-r-[1.5px] border-slate-950">
              <div className="flex justify-between items-center text-[10px] font-bold pb-0.5 px-1 border-b border-slate-200">
                <span>Lip Flatness Data</span>
                <span className="font-mono font-black text-[11px]">1.2</span>
              </div>
              <div className="h-[75px] w-full pt-1">
                {renderTrendChart(rearLipFlatnessData, '#0284c7', '#f59e0b', rearLipFlatnessData2)}
              </div>
            </div>

            {/* Chart 5: Bolt Flatness Data (2.7) */}
            <div className="col-span-3 flex flex-col justify-between p-1 border-r-[1.5px] border-slate-950">
              <div className="flex justify-between items-center text-[10px] font-bold pb-0.5 px-1 border-b border-slate-200">
                <span>Bolt Flatness Data</span>
                <span className="font-mono font-black text-[11px]">2.7</span>
              </div>
              <div className="h-[75px] w-full pt-1">
                {renderTrendChart(rearBoltFlatnessData, '#0284c7', '#f59e0b', rearBoltFlatnessData2)}
              </div>
            </div>

            {/* Chart 6: Lip Straightness Data (1.5) */}
            <div className="col-span-4 flex flex-col justify-between p-1">
              <div className="flex justify-between items-center text-[10px] font-bold pb-0.5 px-1 border-b border-slate-200">
                <span>Lip Straightness Data</span>
                <span className="font-mono font-black text-[11px]">1.5</span>
              </div>
              <div className="h-[75px] w-full pt-1">
                {renderTrendChart(rearStraightnessData, '#f59e0b')}
              </div>
            </div>
          </div>
        </div>
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
