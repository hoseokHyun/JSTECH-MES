import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Edit3,
  Save,
  RotateCcw,
  Eye,
  Settings2,
  FileCheck2,
  ChevronDown,
  Layers,
  FileText
} from 'lucide-react';
import { Order, ProductType, ProcessStep, User, ProcessProgressMap } from '../types';

interface ProcessTravelerModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  productTypes?: Record<string, ProductType>;
  currentUser?: User | null;
  processProgressMap?: ProcessProgressMap;
  onUpdateOrder?: (updatedOrder: Order) => void;
}

export const ProcessTravelerModal: React.FC<ProcessTravelerModalProps> = ({
  isOpen,
  onClose,
  order,
  productTypes = {},
  currentUser,
  processProgressMap = {},
  onUpdateOrder,
}) => {
  if (!isOpen || !order) return null;

  // 1. Derive processes from order or productType template
  const productType = productTypes[order.typeId];
  const baseProcesses: ProcessStep[] = useMemo(() => {
    if (order.customProcesses && order.customProcesses.length > 0) {
      return order.customProcesses;
    }
    if (productType?.processes && productType.processes.length > 0) {
      return productType.processes;
    }
    return [];
  }, [order, productType]);

  // 2. Derive smart default metadata
  const defaultCustomer = useMemo(() => {
    if (order.customer) return order.customer;
    if (order.name.includes('삼성')) return '삼성디스플레이';
    if (order.name.includes('LG')) return 'LG디스플레이';
    if (order.name.includes('SK')) return 'SK온';
    if (order.name.includes('PNT')) return 'PNT';
    return '고객사 지정';
  }, [order]);

  const defaultPoNumber = useMemo(() => {
    if (order.poNumber) return order.poNumber;
    return order.id || 'PO-2026-001';
  }, [order]);

  const defaultPartName = useMemo(() => {
    if (order.partName) return order.partName;
    return order.name.replace(/(삼성디스플레이|LG디스플레이|SK온|PNT)/g, '').trim() || productType?.name || 'SLOT DIE';
  }, [order, productType]);

  const defaultPartType = useMemo(() => {
    if (order.partType) return order.partType;
    if (order.name.toLowerCase().includes('upper') || order.name.includes('상판')) return 'UPPER (상판)';
    if (order.name.toLowerCase().includes('lower') || order.name.includes('하판')) return 'LOWER (하판)';
    if (order.name.toLowerCase().includes('body') || order.name.includes('몸체')) return 'BODY (몸체)';
    return 'UPPER (상판)';
  }, [order]);

  const defaultSpec = useMemo(() => {
    if (order.spec) return order.spec;
    const match = order.name.match(/(\d+mm|\d+L|\d+세대)/i);
    return match ? match[0] : '650L';
  }, [order]);

  const defaultSerialNo = useMemo(() => {
    if (order.serialNo) return order.serialNo;
    return `${defaultPoNumber.replace(/[^a-zA-Z0-9-]/g, '')}-01`;
  }, [order, defaultPoNumber]);

  const defaultDueDate = useMemo(() => {
    if (order.dueDate) return order.dueDate;
    if (order.startDate) {
      try {
        const d = new Date(order.startDate);
        d.setDate(d.getDate() + 45); // standard manufacturing cycle
        return d.toISOString().split('T')[0];
      } catch {
        return '2026-06-30';
      }
    }
    return '2026-06-30';
  }, [order]);

  const defaultSpecialNotes = useMemo(() => {
    if (order.specialNotes) return order.specialNotes;
    if (order.memo) return `※ ${order.memo}`;
    return '※ 공정 간 인수인계 철저히 할 것!';
  }, [order]);

  // Form states for traveler metadata
  const [customer, setCustomer] = useState(defaultCustomer);
  const [poNumber, setPoNumber] = useState(defaultPoNumber);
  const [partName, setPartName] = useState(defaultPartName);
  const [partType, setPartType] = useState(defaultPartType);
  const [spec, setSpec] = useState(defaultSpec);
  const [serialNo, setSerialNo] = useState(defaultSerialNo);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [qty, setQty] = useState(order.qty || 1);
  const [specialNotes, setSpecialNotes] = useState(defaultSpecialNotes);

  const [writerName, setWriterName] = useState(order.writerName || currentUser?.name || '작성자');
  const [reviewerName, setReviewerName] = useState(order.reviewerName || '검토자');
  const [approverName, setApproverName] = useState(order.approverName || '승인자');

  // Preview & print settings
  const [isEditing, setIsEditing] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState<number>(20); // 20 rows per page fits A4 portrait perfectly
  const [showBlankRows, setShowBlankRows] = useState<boolean>(true);
  const [selectedPageView, setSelectedPageView] = useState<'ALL' | number>('ALL');
  const [savedNotice, setSavedNotice] = useState<string>('');

  // Sync state when order changes
  useEffect(() => {
    setCustomer(defaultCustomer);
    setPoNumber(defaultPoNumber);
    setPartName(defaultPartName);
    setPartType(defaultPartType);
    setSpec(defaultSpec);
    setSerialNo(defaultSerialNo);
    setDueDate(defaultDueDate);
    setQty(order.qty || 1);
    setSpecialNotes(defaultSpecialNotes);
    setWriterName(order.writerName || currentUser?.name || '작성자');
    setReviewerName(order.reviewerName || '검토자');
    setApproverName(order.approverName || '승인자');
  }, [order, defaultCustomer, defaultPoNumber, defaultPartName, defaultPartType, defaultSpec, defaultSerialNo, defaultDueDate, defaultSpecialNotes, currentUser]);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveMetadata = () => {
    if (!onUpdateOrder) return;
    const updated: Order = {
      ...order,
      customer,
      poNumber,
      partName,
      partType,
      spec,
      serialNo,
      dueDate,
      qty,
      specialNotes,
      writerName,
      reviewerName,
      approverName,
    };
    onUpdateOrder(updated);
    setIsEditing(false);
    setSavedNotice('공정 이동표 메타데이터가 수주 정보에 저장되었습니다.');
    setTimeout(() => setSavedNotice(''), 3500);
  };

  // Helper for formatting actual start/end timestamps
  const formatDateTime = (dateStr?: string | null): { date: string; time: string } | null => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return {
        date: `${month}월 ${day}일`,
        time: `${hours}:${minutes}`,
      };
    } catch {
      return null;
    }
  };

  // Calculate Paginated Chunks (e.g. 1/3, 2/3, 3/3)
  const pagesData = useMemo(() => {
    if (baseProcesses.length === 0) {
      return [
        {
          pageIndex: 0,
          pageNumber: 1,
          processes: [] as { proc: ProcessStep; globalIndex: number; originalIndex: number }[],
          blankCount: showBlankRows ? rowsPerPage : 0,
        },
      ];
    }

    const totalPages = Math.ceil(baseProcesses.length / rowsPerPage);
    const chunks = [];

    for (let p = 0; p < totalPages; p++) {
      const start = p * rowsPerPage;
      const end = Math.min(start + rowsPerPage, baseProcesses.length);
      const pageProcesses = baseProcesses.slice(start, end).map((proc, idx) => ({
        proc,
        globalIndex: start + idx + 1,
        originalIndex: start + idx,
      }));

      const isLastPage = p === totalPages - 1;
      const remainingSlots = rowsPerPage - pageProcesses.length;
      const blankCount = isLastPage && showBlankRows && remainingSlots > 0 ? remainingSlots : 0;

      chunks.push({
        pageIndex: p,
        pageNumber: p + 1,
        processes: pageProcesses,
        blankCount,
      });
    }

    return chunks;
  }, [baseProcesses, rowsPerPage, showBlankRows]);

  const totalPages = pagesData.length;

  return (
    <div
      id="process-traveler-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="process-traveler-modal-container"
        className="bg-white text-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden during window.print()) */}
        <div className="print:hidden bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">
                  공정 이동표 (Process Traveler) 인쇄 및 페이지 관리
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-md">
                  A4 자동 다중분할 ({totalPages}장)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                수주: {order.name} | PO: {poNumber} | 총 공정수: {baseProcesses.length}개 ({totalPages}페이지 구성)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedNotice && (
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {savedNotice}
              </span>
            )}

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                isEditing
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? '미리보기 모드' : '정보 수정'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md transition cursor-pointer active:scale-95"
              title="A4 다중 페이지로 자동 분할되어 일괄 인쇄됩니다."
            >
              <Printer className="w-4 h-4" />
              <span>공정 이동표 인쇄 ({totalPages}장 출력)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive Settings & Pagination Toolbar (Hidden in Print) */}
        <div className="print:hidden bg-slate-100 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-700 gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Page View Filter */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300">
              <button
                type="button"
                onClick={() => setSelectedPageView('ALL')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                  selectedPageView === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                전체 연속 보기 ({totalPages}장)
              </button>
              {pagesData.map((p) => (
                <button
                  key={`page-btn-${p.pageNumber}`}
                  type="button"
                  onClick={() => setSelectedPageView(p.pageNumber)}
                  className={`px-2 py-1 rounded text-xs font-bold transition cursor-pointer ${
                    selectedPageView === p.pageNumber
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {p.pageNumber}/{totalPages}
                </button>
              ))}
            </div>

            {/* Rows Per Page Selector */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300">
              <span className="text-slate-500 font-semibold">페이지당 공정수:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(parseInt(e.target.value))}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
              >
                <option value={15}>15줄/장 (여유)</option>
                <option value={18}>18줄/장 (권장)</option>
                <option value={20}>20줄/장 (표준)</option>
                <option value={22}>22줄/장 (고밀도)</option>
                <option value={25}>25줄/장 (최대)</option>
              </select>
            </div>

            {/* Blank filler rows toggle */}
            <label className="flex items-center gap-1.5 font-bold cursor-pointer select-none pl-2 border-l border-slate-300">
              <input
                type="checkbox"
                checked={showBlankRows}
                onChange={(e) => setShowBlankRows(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span>마지막 페이지 빈 줄(격자) 채우기</span>
            </label>
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={handleSaveMetadata}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>수정사항 DB 저장</span>
            </button>
          )}
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="process-traveler-print-area overflow-y-auto p-4 sm:p-8 bg-slate-200/70 print:bg-white print:p-0 print:m-0 print:overflow-visible flex flex-col items-center">
          {pagesData.map((pageInfo) => {
            const isHiddenInScreen =
              selectedPageView !== 'ALL' && selectedPageView !== pageInfo.pageNumber;

            return (
              <div
                key={`page-container-${pageInfo.pageNumber}`}
                className={`traveler-page-sheet w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-6 sm:p-8 shadow-xl print:shadow-none print:p-0 print:m-0 border border-slate-300 print:border-none flex flex-col justify-between mb-8 print:mb-0 ${
                  isHiddenInScreen ? 'hidden print:flex' : 'flex'
                }`}
                style={{
                  fontFamily: "'Malgun Gothic', 'Noto Sans KR', 'Segoe UI', sans-serif",
                }}
              >
                <div>
                  {/* ------------------------------------------------------------- */}
                  {/* 1. DOCUMENT HEADER & APPROVAL GRID                            */}
                  {/* ------------------------------------------------------------- */}
                  <div className="flex items-stretch justify-between mb-3.5 border-b-2 border-black pb-2">
                    {/* Title & Page Badge */}
                    <div className="flex-1 flex flex-col items-center justify-center pl-16">
                      <div className="flex items-center gap-3">
                        <h1 className="text-3xl sm:text-4xl font-black tracking-widest text-black font-serif text-center">
                          공 정 이 동 표
                        </h1>
                        <span className="text-sm sm:text-base font-black px-2.5 py-0.5 border-2 border-black rounded-lg bg-slate-100 font-mono">
                          {pageInfo.pageNumber} / {totalPages}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 font-mono tracking-wider mt-0.5">
                        PROCESS ROUTING & MES TRAVELER SHEET (PAGE {pageInfo.pageNumber} OF {totalPages})
                      </span>
                    </div>

                    {/* Approval Block (결재란: 작성 / 검토 / 승인) */}
                    <div className="shrink-0">
                      <table className="border-collapse border border-black text-center text-xs font-semibold">
                        <tbody>
                          <tr>
                            <td
                              rowSpan={2}
                              className="border border-black bg-slate-100 font-bold px-2 py-1 align-middle w-8 text-xs leading-relaxed"
                              style={{
                                writingMode: 'vertical-rl',
                                textOrientation: 'upright',
                                letterSpacing: '3px',
                              }}
                            >
                              결재
                            </td>
                            <td className="border border-black bg-slate-100 font-bold px-3 py-1 w-16 text-center text-xs">
                              작 성
                            </td>
                            <td className="border border-black bg-slate-100 font-bold px-3 py-1 w-16 text-center text-xs">
                              검 토
                            </td>
                            <td className="border border-black bg-slate-100 font-bold px-3 py-1 w-16 text-center text-xs">
                              승 인
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-black h-12 align-middle text-center px-1 text-xs">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={writerName}
                                  onChange={(e) => setWriterName(e.target.value)}
                                  className="w-full text-center border border-blue-400 rounded px-1 py-0.5 text-xs font-bold"
                                />
                              ) : (
                                <span className="font-bold">{writerName}</span>
                              )}
                            </td>
                            <td className="border border-black h-12 align-middle text-center px-1 text-xs">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={reviewerName}
                                  onChange={(e) => setReviewerName(e.target.value)}
                                  className="w-full text-center border border-blue-400 rounded px-1 py-0.5 text-xs font-bold"
                                />
                              ) : (
                                <span className="font-bold">{reviewerName}</span>
                              )}
                            </td>
                            <td className="border border-black h-12 align-middle text-center px-1 text-xs">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={approverName}
                                  onChange={(e) => setApproverName(e.target.value)}
                                  className="w-full text-center border border-blue-400 rounded px-1 py-0.5 text-xs font-bold"
                                />
                              ) : (
                                <span className="font-bold">{approverName}</span>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* 2. PROJECT OFFICIAL METADATA TABLE                            */}
                  {/* ------------------------------------------------------------- */}
                  <div className="mb-3">
                    <table className="w-full border-collapse border-2 border-black text-xs">
                      <tbody>
                        {/* Row 1: 고객사 & PO. (PJT) */}
                        <tr>
                          <td className="border border-black bg-slate-100 font-bold text-center py-2 w-24 text-xs">
                            고 객 사
                          </td>
                          <td className="border border-black text-center py-2 px-3 font-extrabold text-sm w-1/3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={customer}
                                onChange={(e) => setCustomer(e.target.value)}
                                placeholder="예: PNT"
                                className="w-full text-center border border-blue-400 rounded px-1 py-0.5 text-xs font-bold"
                              />
                            ) : (
                              <span>{customer}</span>
                            )}
                          </td>
                          <td className="border border-black bg-slate-100 font-bold text-center py-2 w-24 text-xs">
                            PO. (PJT)
                          </td>
                          <td className="border border-black text-center py-2 px-3 font-mono font-black text-sm">
                            {isEditing ? (
                              <input
                                type="text"
                                value={poNumber}
                                onChange={(e) => setPoNumber(e.target.value)}
                                placeholder="예: PNT-BNSH650L-26-02"
                                className="w-full text-center border border-blue-400 rounded px-1 py-0.5 text-xs font-mono font-bold"
                              />
                            ) : (
                              <span className="tracking-wider">{poNumber}</span>
                            )}
                          </td>
                        </tr>

                        {/* Row 2: 품 명 & 품 목 */}
                        <tr>
                          <td className="border border-black bg-slate-100 font-bold text-center py-2 text-xs">
                            품 명
                          </td>
                          <td className="border border-black text-center py-2 px-3 font-extrabold text-sm">
                            {isEditing ? (
                              <input
                                type="text"
                                value={partName}
                                onChange={(e) => setPartName(e.target.value)}
                                placeholder="예: SLOT DIE"
                                className="w-full text-center border border-blue-400 rounded px-1 py-0.5 text-xs font-bold"
                              />
                            ) : (
                              <span>{partName}</span>
                            )}
                          </td>
                          <td className="border border-black bg-slate-100 font-bold text-center py-2 text-xs">
                            품 목
                          </td>
                          <td className="border border-black text-center py-2 px-3 font-black text-sm">
                            {isEditing ? (
                              <input
                                type="text"
                                value={partType}
                                onChange={(e) => setPartType(e.target.value)}
                                placeholder="예: UPPER (상판)"
                                className="w-full text-center border border-blue-400 rounded px-1 py-0.5 text-xs font-black"
                              />
                            ) : (
                              <span className="tracking-wide">{partType}</span>
                            )}
                          </td>
                        </tr>

                        {/* Row 3: 규 격 & 각인번호 */}
                        <tr>
                          <td className="border border-black bg-slate-100 font-bold text-center py-2 text-xs">
                            규 격
                          </td>
                          <td className="border border-black text-center py-2 px-3 font-semibold text-xs">
                            {isEditing ? (
                              <input
                                type="text"
                                value={spec}
                                onChange={(e) => setSpec(e.target.value)}
                                className="w-full text-center border border-blue-400 rounded px-1 py-0.5 text-xs font-bold"
                              />
                            ) : (
                              <span className="font-bold">{spec}</span>
                            )}
                          </td>
                          <td className="border border-black bg-slate-100 font-bold text-center py-2 text-xs">
                            각인번호
                          </td>
                          <td className="border border-black text-center py-2 px-3 font-mono font-bold text-xs">
                            {isEditing ? (
                              <input
                                type="text"
                                value={serialNo}
                                onChange={(e) => setSerialNo(e.target.value)}
                                className="w-full text-center border border-blue-400 rounded px-1 py-0.5 text-xs font-bold"
                              />
                            ) : (
                              <span>{serialNo}</span>
                            )}
                          </td>
                        </tr>

                        {/* Row 4: 납 기 & 수 량 */}
                        <tr>
                          <td className="border border-black bg-slate-100 font-bold text-center py-2 text-xs">
                            납 기
                          </td>
                          <td className="border border-black text-center py-2 px-3 font-mono font-bold text-xs">
                            {isEditing ? (
                              <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full text-center border border-blue-400 rounded px-1 py-0.5 text-xs font-bold"
                              />
                            ) : (
                              <span>{dueDate}</span>
                            )}
                          </td>
                          <td className="border border-black bg-slate-100 font-bold text-center py-2 text-xs">
                            수 량
                          </td>
                          <td className="border border-black text-center py-2 px-3 font-black text-xs">
                            {isEditing ? (
                              <input
                                type="number"
                                min={1}
                                value={qty}
                                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full text-center border border-blue-400 rounded px-1 py-0.5 text-xs font-black"
                              />
                            ) : (
                              <span className="text-sm font-black">{qty}</span>
                            )}
                          </td>
                        </tr>

                        {/* Row 5: 특이사항 */}
                        <tr>
                          <td className="border border-black bg-slate-100 font-bold text-center py-2.5 text-xs">
                            특이사항
                          </td>
                          <td colSpan={3} className="border border-black py-2 px-3 text-left font-bold text-xs text-black">
                            {isEditing ? (
                              <input
                                type="text"
                                value={specialNotes}
                                onChange={(e) => setSpecialNotes(e.target.value)}
                                placeholder="※ 공정 간 인수인계 철저히 할 것!"
                                className="w-full border border-blue-400 rounded px-2 py-1 text-xs font-bold"
                              />
                            ) : (
                              <span>{specialNotes}</span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* 3. PROCESS ROUTING TABLE (구분, 공정명, 작업자, 설비명, 시작, 종료, 소요시간) */}
                  {/* ------------------------------------------------------------- */}
                  <div className="mb-2">
                    <table className="w-full border-collapse border-2 border-black text-xs">
                      <thead>
                        <tr className="bg-slate-100 font-bold text-center text-xs">
                          <th className="border border-black py-2.5 w-12 text-center">구분</th>
                          <th className="border border-black py-2.5 w-44 text-center">공정명</th>
                          <th className="border border-black py-2.5 w-24 text-center">작업자</th>
                          <th className="border border-black py-2.5 w-36 text-center">설비명</th>
                          <th className="border border-black py-2.5 w-28 text-center leading-tight">
                            <div>작업시작</div>
                            <div className="text-[11px]">시간 (a)</div>
                          </th>
                          <th className="border border-black py-2.5 w-28 text-center leading-tight">
                            <div>작업종료</div>
                            <div className="text-[11px]">시간 (b)</div>
                          </th>
                          <th className="border border-black py-2.5 w-24 text-center leading-tight">
                            <div>작업시간</div>
                            <div className="text-[11px]">(b-a)</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Processes for this specific page slice */}
                        {pageInfo.processes.map(({ proc, globalIndex, originalIndex }) => {
                          const processKey = `${order.id}_Q1_P${originalIndex}`;
                          const progressItem = processProgressMap[processKey];

                          // 1. Worker Resolution
                          const boundWorker =
                            progressItem?.worker || proc.worker || proc.assignedWorker || '';

                          // 2. Machine Resolution ('설비명' column binding)
                          const boundMachine =
                            proc.assignedMachine ||
                            progressItem?.machine ||
                            (proc.category === '외주' ? '(외주/협력사)' : '');

                          // 3. Timestamps Resolution
                          const formattedStart = formatDateTime(progressItem?.actualStart);
                          const formattedEnd = formatDateTime(progressItem?.actualEnd);

                          // 4. Actual Time (b-a) Resolution
                          let durationDisplay = '';
                          if (progressItem?.actualMinutes) {
                            durationDisplay = `${progressItem.actualMinutes}분`;
                          } else if (progressItem?.actualStart && progressItem?.actualEnd) {
                            try {
                              const diffMs =
                                new Date(progressItem.actualEnd).getTime() -
                                new Date(progressItem.actualStart).getTime();
                              const diffMin = Math.round(diffMs / 60000);
                              if (diffMin > 0) durationDisplay = `${diffMin}분`;
                            } catch {
                              // ignore
                            }
                          } else if (proc.durationHours) {
                            durationDisplay = `(${proc.durationHours}h)`;
                          }

                          return (
                            <tr key={`proc-${globalIndex}`} className="text-center">
                              {/* 구분 (#) */}
                              <td className="border border-black py-2 font-bold text-center text-xs">
                                {globalIndex}
                              </td>

                              {/* 공정명 */}
                              <td className="border border-black py-2 px-2 text-left font-bold text-xs text-black">
                                {proc.name}
                              </td>

                              {/* 작업자 */}
                              <td className="border border-black py-2 px-1 text-center text-xs font-semibold text-slate-900">
                                {boundWorker}
                              </td>

                              {/* 설비명 (담당 설비 매핑) */}
                              <td className="border border-black py-2 px-2 text-center text-xs font-bold text-slate-900">
                                {boundMachine}
                              </td>

                              {/* 작업시작 시간 (a) */}
                              <td className="border border-black py-1 px-2 text-center text-[10px] text-slate-700 leading-tight">
                                {formattedStart ? (
                                  <div className="font-mono font-bold">
                                    <div>{formattedStart.date}</div>
                                    <div className="text-blue-700">{formattedStart.time}</div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex justify-between px-1 text-slate-500">
                                      <span>월</span>
                                      <span>일</span>
                                    </div>
                                    <div className="text-right pr-2 mt-0.5 text-slate-500 font-mono">:</div>
                                  </>
                                )}
                              </td>

                              {/* 작업종료 시간 (b) */}
                              <td className="border border-black py-1 px-2 text-center text-[10px] text-slate-700 leading-tight">
                                {formattedEnd ? (
                                  <div className="font-mono font-bold">
                                    <div>{formattedEnd.date}</div>
                                    <div className="text-blue-700">{formattedEnd.time}</div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex justify-between px-1 text-slate-500">
                                      <span>월</span>
                                      <span>일</span>
                                    </div>
                                    <div className="text-right pr-2 mt-0.5 text-slate-500 font-mono">:</div>
                                  </>
                                )}
                              </td>

                              {/* 작업시간 (b-a) */}
                              <td className="border border-black py-2 text-center text-xs font-mono font-bold">
                                {durationDisplay}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Blank rows for on-site logging on the last page */}
                        {Array.from({ length: pageInfo.blankCount }).map((_, bIdx) => {
                          const rowNum = baseProcesses.length + bIdx + 1;
                          return (
                            <tr key={`blank-${pageInfo.pageNumber}-${bIdx}`} className="text-center h-8">
                              {/* 구분 */}
                              <td className="border border-black py-2 font-bold text-center text-xs text-slate-400">
                                {rowNum}
                              </td>
                              {/* 공정명 */}
                              <td className="border border-black py-2 px-2 text-left text-xs"></td>
                              {/* 작업자 */}
                              <td className="border border-black py-2 text-xs"></td>
                              {/* 설비명 */}
                              <td className="border border-black py-2 text-xs"></td>
                              {/* 작업시작 */}
                              <td className="border border-black py-1 px-2 text-center text-[10px] text-slate-400 leading-tight">
                                <div className="flex justify-between px-1">
                                  <span>월</span>
                                  <span>일</span>
                                </div>
                                <div className="text-right pr-2 mt-0.5">:</div>
                              </td>
                              {/* 작업종료 */}
                              <td className="border border-black py-1 px-2 text-center text-[10px] text-slate-400 leading-tight">
                                <div className="flex justify-between px-1">
                                  <span>월</span>
                                  <span>일</span>
                                </div>
                                <div className="text-right pr-2 mt-0.5">:</div>
                              </td>
                              {/* 작업시간 */}
                              <td className="border border-black py-2 text-xs"></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer Notice & Page Info for this specific page */}
                <div className="pt-2 flex justify-between items-center text-[10px] text-slate-600 font-mono border-t border-black">
                  <div>
                    <span>준성테크(주) 생산관리시스템 (MES/BOP) | 문서양식: JST-FM-PR-01</span>
                  </div>
                  <div>
                    <span className="font-bold text-black">
                      발행일자: {new Date().toLocaleDateString('ko-KR')} | Page {pageInfo.pageNumber} / {totalPages}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
