import React from 'react';
import { CertHeader } from './CertHeader';
import { ProductSpecRecipe } from '../SlotDieCertificateView';
import { ShieldCheck, FileText, Camera, CheckCircle2 } from 'lucide-react';

export interface CustomCertPageData {
  id: string;
  type: string;
  title: string;
  subTitle: string;
  inspectionItem: string;
  method: string;
  standard: string;
  actualResult: string;
  judgement: 'PASS' | 'FAIL';
  notes: string;
  tableRows?: Array<{
    no: number;
    point: string;
    nominal: string;
    actual: string;
    dev: string;
    result: string;
  }>;
  snapshot?: string;
}

interface CertPageCustomProps {
  recipe: ProductSpecRecipe;
  pageData: CustomCertPageData;
  pageNo?: number;
  totalPages?: number;
  isEditMode?: boolean;
  onUpdatePageData?: (data: CustomCertPageData) => void;
  onOpen3DModal?: () => void;
}

export const CertPageCustom: React.FC<CertPageCustomProps> = ({
  recipe,
  pageData,
  pageNo = 9,
  totalPages = 9,
  isEditMode = false,
  onUpdatePageData,
  onOpen3DModal
}) => {
  const handleChange = (field: keyof CustomCertPageData, value: any) => {
    if (onUpdatePageData) {
      onUpdatePageData({
        ...pageData,
        [field]: value
      });
    }
  };

  const handleRowChange = (index: number, rowField: string, value: string) => {
    if (!onUpdatePageData || !pageData.tableRows) return;
    const nextRows = [...pageData.tableRows];
    nextRows[index] = { ...nextRows[index], [rowField]: value };
    onUpdatePageData({
      ...pageData,
      tableRows: nextRows
    });
  };

  return (
    <div className="a4-page bg-white text-slate-950 w-[794px] min-h-[1123px] mx-auto p-[28px] flex flex-col justify-between box-border border border-slate-300 print:border-none print:shadow-none shadow-xl print:m-0 print:p-[24px]">
      <div className="space-y-3">
        {/* Header */}
        <CertHeader
          title={pageData.title || '검사 성적서_첨부'}
          subTitle={pageData.subTitle || `(${pageData.inspectionItem})`}
          docNo={recipe.docNo}
          inspectionDate={recipe.inspectionDate}
          inspector={recipe.inspector}
          approver={recipe.approver}
          isPassed={pageData.judgement === 'PASS'}
          pageNo={pageNo}
          totalPages={totalPages}
        />

        {/* 1. Inspection Item & Specification Overview */}
        <div className="border-[1.5px] border-slate-950">
          <div className="bg-[#D9F2E6] text-slate-950 text-[11px] font-black py-1 px-3 text-center border-b-[1.5px] border-slate-950">
            {pageData.inspectionItem} — 검사 규격 및 시험 환경 (Test Specification & Scope)
          </div>
          <div className="p-3 bg-white grid grid-cols-2 gap-3 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 w-24">검사 항목:</span>
              {isEditMode ? (
                <input
                  type="text"
                  value={pageData.inspectionItem}
                  onChange={(e) => handleChange('inspectionItem', e.target.value)}
                  className="flex-1 px-2 py-0.5 border border-blue-400 rounded text-[11px] font-bold"
                />
              ) : (
                <span className="font-black text-slate-900">{pageData.inspectionItem}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 w-24">측정 방법/장비:</span>
              {isEditMode ? (
                <input
                  type="text"
                  value={pageData.method}
                  onChange={(e) => handleChange('method', e.target.value)}
                  className="flex-1 px-2 py-0.5 border border-blue-400 rounded text-[11px] font-bold"
                />
              ) : (
                <span className="font-bold text-slate-900">{pageData.method}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 w-24">요구 설계 규격:</span>
              {isEditMode ? (
                <input
                  type="text"
                  value={pageData.standard}
                  onChange={(e) => handleChange('standard', e.target.value)}
                  className="flex-1 px-2 py-0.5 border border-blue-400 rounded text-[11px] font-bold"
                />
              ) : (
                <span className="font-bold text-blue-900 font-mono">{pageData.standard}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 w-24">실측 판정 결과:</span>
              {isEditMode ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={pageData.actualResult}
                    onChange={(e) => handleChange('actualResult', e.target.value)}
                    className="flex-1 px-2 py-0.5 border border-blue-400 rounded text-[11px] font-bold text-emerald-800"
                  />
                  <select
                    value={pageData.judgement}
                    onChange={(e) => handleChange('judgement', e.target.value as any)}
                    className="px-2 py-0.5 border border-slate-400 rounded text-[11px] font-bold"
                  >
                    <option value="PASS">PASS (합격)</option>
                    <option value="FAIL">FAIL (부적합)</option>
                  </select>
                </div>
              ) : (
                <span className="font-black text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                  <span>{pageData.actualResult} ({pageData.judgement})</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Visual Drawing / 3D CAD Snapshot Area */}
        <div className="border-[1.5px] border-slate-950">
          <div className="bg-[#D9F2E6] text-slate-950 text-[11px] font-black py-0.5 px-3 flex items-center justify-between border-b-[1.5px] border-slate-950">
            <span>검사 포인트 시각적 도면 & 3D CAD 검증</span>
            {onOpen3DModal && (
              <button
                type="button"
                onClick={onOpen3DModal}
                className="print:hidden text-[10px] bg-white text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-300 hover:bg-blue-50 flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3 h-3" />
                <span>3D 도면 시점 변경</span>
              </button>
            )}
          </div>
          <div className="p-2 bg-slate-50 flex items-center justify-center min-h-[140px] max-h-[170px] overflow-hidden">
            {pageData.snapshot ? (
              <img
                src={pageData.snapshot}
                alt="Inspection Visual"
                className="max-h-[160px] w-auto object-contain mx-auto rounded shadow-2xs border border-slate-200 bg-white"
              />
            ) : (
              <div className="text-center p-4">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                <p className="text-[11px] font-bold text-slate-600">
                  3D CAD 뷰어에서 [현재 시점 고정]을 클릭하여 본 페이지에 검사 도면 이미지를 삽입할 수 있습니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Detailed Data Table (If available) */}
        {pageData.tableRows && pageData.tableRows.length > 0 && (
          <div className="border-[1.5px] border-slate-950">
            <div className="bg-[#D9F2E6] text-slate-950 text-[11px] font-black py-0.5 px-3 text-center border-b-[1.5px] border-slate-950">
              세부 포인트 실측 검사 데이터 (Measurement Point Log)
            </div>
            <table className="w-full border-collapse text-[10px] text-center">
              <thead className="bg-[#E8F8F0] font-bold border-b border-slate-950">
                <tr className="divide-x divide-slate-950">
                  <th className="py-1 w-10">No</th>
                  <th className="py-1">측정 부위 (Point)</th>
                  <th className="py-1">도면 규격 (Nominal)</th>
                  <th className="py-1">실측값 (Actual)</th>
                  <th className="py-1">편차 (Deviation)</th>
                  <th className="py-1 w-16">판정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {pageData.tableRows.map((row, idx) => (
                  <tr key={row.no || idx} className="divide-x divide-slate-300 hover:bg-slate-50">
                    <td className="py-1 font-mono font-bold">{row.no}</td>
                    <td className="py-1 font-bold text-slate-800">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={row.point}
                          onChange={(e) => handleRowChange(idx, 'point', e.target.value)}
                          className="w-full text-center px-1 border border-blue-300 rounded"
                        />
                      ) : (
                        row.point
                      )}
                    </td>
                    <td className="py-1 font-mono text-slate-600">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={row.nominal}
                          onChange={(e) => handleRowChange(idx, 'nominal', e.target.value)}
                          className="w-full text-center px-1 border border-blue-300 rounded font-mono"
                        />
                      ) : (
                        row.nominal
                      )}
                    </td>
                    <td className="py-1 font-mono font-black text-blue-900">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={row.actual}
                          onChange={(e) => handleRowChange(idx, 'actual', e.target.value)}
                          className="w-full text-center px-1 border border-blue-300 rounded font-mono font-bold"
                        />
                      ) : (
                        row.actual
                      )}
                    </td>
                    <td className="py-1 font-mono font-bold text-slate-700">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={row.dev}
                          onChange={(e) => handleRowChange(idx, 'dev', e.target.value)}
                          className="w-full text-center px-1 border border-blue-300 rounded font-mono"
                        />
                      ) : (
                        row.dev
                      )}
                    </td>
                    <td className="py-1 font-bold text-emerald-700">{row.result || 'PASS'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Notes & Engineer Remarks */}
        <div className="border-[1.5px] border-slate-950 p-2.5 bg-white text-[11px] space-y-1">
          <div className="font-black text-slate-950 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
            <span>특이사항 및 품질 보증 엔지니어 소견 (Quality Assurance Remarks)</span>
          </div>
          {isEditMode ? (
            <textarea
              value={pageData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
              className="w-full p-1.5 border border-blue-300 rounded text-[11px] font-sans"
            />
          ) : (
            <p className="text-slate-700 font-sans leading-relaxed">
              {pageData.notes || '모든 측정 항목이 고객사 요구 설계 공차 및 사내 품질 표준에 엄격히 부합하여 최종 합격 판정되었습니다.'}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t-[1.5px] border-slate-950 flex justify-between items-center text-[10px] text-slate-600 font-mono">
        <div>JUNSUNG TECH PRECISION CO., LTD. — QUALITY INSPECTION CERTIFICATE</div>
        <div className="font-bold">PAGE {pageNo} / {totalPages}</div>
      </div>
    </div>
  );
};
