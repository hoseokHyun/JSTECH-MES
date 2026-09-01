import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
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
  FileText,
  QrCode,
  Smartphone,
  ScanLine
} from 'lucide-react';
import { Order, ProductType, ProcessStep, User, ProcessProgressMap } from '../types';
import { extractSerialBase, formatSerialRange, getIndividualSerialNo, getSerialNoList } from '../utils/serialHelper';

const MIN_ROWS_PER_PAGE = 10;
const MAX_ROWS_PER_PAGE = 22;

interface ProcessTravelerModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  productTypes?: Record<string, ProductType>;
  currentUser?: User | null;
  processProgressMap?: ProcessProgressMap;
  onUpdateOrder?: (updatedOrder: Order) => void;
}

/**
 * Auto-fitting Process Name component (공정명)
 * Strict requirements:
 * 1. 원본 공정명 100% 온전 보존 (말줄임/자름/생략 절대 없음)
 * 2. 1행(Single Line) 강제 (white-space: nowrap !important;, 행 높이 증가 방지)
 * 3. 기본 폰트 크기 10.5pt~11pt (~14px) 상향 조정하여 뛰어난 가독성 확보
 * 4. 긴 글자 수 공정명 시 컨테이너 너비에 맞춰 폰트 크기 및 수평 배율 자동 축소 (Auto-fitting)
 */
const ProcessNameAutoFit: React.FC<{
  name: string;
  rowsPerPage: number;
}> = ({ name, rowsPerPage }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState<number>(1);

  // Dynamic baseline sizing & letter-spacing based on row density and length
  const { baseFontSize, letterSpacing, initialScale } = useMemo(() => {
    const len = name.length;
    const isHighDensity = rowsPerPage >= 21;

    if (len <= 8) {
      return {
        baseFontSize: isHighDensity ? '10pt' : '11pt',
        letterSpacing: '-0.01em',
        initialScale: 1,
      };
    }
    if (len <= 13) {
      return {
        baseFontSize: isHighDensity ? '9.5pt' : '10.5pt',
        letterSpacing: '-0.02em',
        initialScale: 1,
      };
    }
    if (len <= 18) {
      return {
        baseFontSize: isHighDensity ? '9pt' : '9.5pt',
        letterSpacing: '-0.03em',
        initialScale: 1,
      };
    }
    if (len <= 24) {
      return {
        baseFontSize: isHighDensity ? '8pt' : '8.5pt',
        letterSpacing: '-0.04em',
        initialScale: 1,
      };
    }
    // Very long process name (25+ characters)
    return {
      baseFontSize: isHighDensity ? '7.5pt' : '8pt',
      letterSpacing: '-0.05em',
      initialScale: Math.max(0.6, 24 / len),
    };
  }, [name, rowsPerPage]);

  useLayoutEffect(() => {
    const updateScale = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const textWidth = textRef.current.scrollWidth;
        if (containerWidth > 0 && textWidth > containerWidth) {
          const calculatedRatio = Math.max(0.55, containerWidth / textWidth);
          setScale(calculatedRatio);
        } else {
          setScale(initialScale);
        }
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [name, rowsPerPage, initialScale]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden flex items-center"
      title={name}
      style={{ minWidth: 0 }}
    >
      <span
        ref={textRef}
        className="font-bold text-black select-text whitespace-nowrap"
        style={{
          fontSize: baseFontSize,
          letterSpacing,
          display: 'inline-block',
          transform: scale < 1 ? `scaleX(${scale.toFixed(3)})` : undefined,
          transformOrigin: 'left center',
          lineHeight: 1.15,
        }}
      >
        {name}
      </span>
    </div>
  );
};

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
  const defaultOrderId = useMemo(() => {
    return order.id || 'ORD-2026-001';
  }, [order]);

  const defaultCustomer = useMemo(() => {
    if (order.customer) return order.customer;
    if (order.name.includes('삼성')) return '삼성디스플레이';
    if (order.name.includes('LG')) return 'LG디스플레이';
    if (order.name.includes('SK')) return 'SK온';
    if (order.name.includes('PNT')) return 'PNT';
    return '고객사 지정';
  }, [order]);

  const defaultPjtName = useMemo(() => {
    return order.pjtName || order.name || '신규 프로젝트';
  }, [order]);

  const defaultSpec = useMemo(() => {
    if (order.spec) return order.spec;
    const match = (order.pjtName || order.name).match(/(\d+mm|\d+L|\d+세대)/i);
    return match ? match[0] : '650L';
  }, [order]);

  const defaultSerialNo = useMemo(() => {
    if (order.serialNo) return formatSerialRange(order.serialNo, order.qty || 1, order.pjtNo || order.poNumber);
    return formatSerialRange(order.pjtNo || defaultOrderId, order.qty || 1, order.pjtNo);
  }, [order, defaultOrderId]);

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
    if (order.memo) return order.memo;
    return '공정 간 인수인계 철저히 할 것!';
  }, [order]);

  // Form states for traveler metadata
  const [customer, setCustomer] = useState(defaultCustomer);
  const [orderId, setOrderId] = useState(defaultOrderId);
  const [pjtName, setPjtName] = useState(defaultPjtName);
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
  const [selectedPiece, setSelectedPiece] = useState<'ALL' | number>('ALL');
  const [rowsPerPage, setRowsPerPage] = useState<number>(18);
  const [showBlankRows, setShowBlankRows] = useState<boolean>(true);
  const [selectedPageView, setSelectedPageView] = useState<'ALL' | number>('ALL');
  const [savedNotice, setSavedNotice] = useState<string>('');
  const [isPreparingPrint, setIsPreparingPrint] = useState<boolean>(false);

  // Synchronize serial range when quantity is modified in editing mode
  const handleQtyChange = (newQty: number) => {
    const validQty = Math.max(1, newQty);
    setQty(validQty);
    const pjt = order.pjtNo || order.poNumber || defaultOrderId;
    const base = extractSerialBase(serialNo, pjt) || pjt || 'NN-NNNNN-2608-01';
    setSerialNo(formatSerialRange(base, validQty, pjt));
  };

  const handleSerialBlur = () => {
    if (serialNo.trim()) {
      const pjt = order.pjtNo || order.poNumber || defaultOrderId;
      const base = extractSerialBase(serialNo, pjt);
      setSerialNo(formatSerialRange(base || pjt || 'NN-NNNNN-2608-01', qty, pjt));
    }
  };

  // Attach body class for print isolation
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('process-traveler-modal-open');
      return () => {
        document.body.classList.remove('process-traveler-modal-open');
      };
    }
  }, [isOpen]);

  // Sync state when order changes
  useEffect(() => {
    setCustomer(defaultCustomer);
    setOrderId(defaultOrderId);
    setPjtName(defaultPjtName);
    setSpec(defaultSpec);
    setSerialNo(defaultSerialNo);
    setDueDate(defaultDueDate);
    setQty(order.qty || 1);
    setSpecialNotes(defaultSpecialNotes);
    setWriterName(order.writerName || currentUser?.name || '작성자');
    setReviewerName(order.reviewerName || '검토자');
    setApproverName(order.approverName || '승인자');
  }, [order, defaultCustomer, defaultOrderId, defaultPjtName, defaultSpec, defaultSerialNo, defaultDueDate, defaultSpecialNotes, currentUser]);

  // Per-Process Auto QR Code generation
  const [qrCodeMap, setQrCodeMap] = useState<Record<string, string>>({});
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [activeQrStep, setActiveQrStep] = useState<{
    name: string;
    key: string;
    qrUrl: string;
    link: string;
    machine?: string;
    worker?: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen || !order) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://jstech-mes.vercel.app';
    const newMap: Record<string, string> = {};

    baseProcesses.forEach((proc, idx) => {
      const processKey = `${order.id}_Q1_P${idx}`;
      const directUrl = `${origin}/floor?orderId=${encodeURIComponent(order.id)}&processId=${encodeURIComponent(processKey)}`;

      QRCode.toDataURL(
        directUrl,
        {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 140,
          color: { dark: '#000000', light: '#FFFFFF' },
        },
        (err, url) => {
          if (!err && url) {
            newMap[processKey] = url;
            setQrCodeMap((prev) => ({ ...prev, [processKey]: url }));
          }
        }
      );
    });
  }, [isOpen, order, baseProcesses]);

  // Dynamic continuous row sizing & font density based on rowsPerPage (10 ~ 22)
  const tableDensity = useMemo(() => {
    if (rowsPerPage <= 11) {
      return {
        rowPadding: 'py-2.5 px-2',
        fontSize: 'text-xs font-medium',
        headerPadding: 'py-2.5',
        stampDateSize: 'text-[11px]',
        metaPadding: 'py-2.5',
        blankHeight: 'h-9',
      };
    }
    if (rowsPerPage <= 13) {
      return {
        rowPadding: 'py-2 px-2',
        fontSize: 'text-xs',
        headerPadding: 'py-2',
        stampDateSize: 'text-[11px]',
        metaPadding: 'py-2',
        blankHeight: 'h-8',
      };
    }
    if (rowsPerPage <= 15) {
      return {
        rowPadding: 'py-1.5 px-2',
        fontSize: 'text-xs',
        headerPadding: 'py-2',
        stampDateSize: 'text-[10.5px]',
        metaPadding: 'py-1.5',
        blankHeight: 'h-7.5',
      };
    }
    if (rowsPerPage <= 17) {
      return {
        rowPadding: 'py-1.5 px-2',
        fontSize: 'text-xs',
        headerPadding: 'py-1.5',
        stampDateSize: 'text-[10px]',
        metaPadding: 'py-1.5',
        blankHeight: 'h-7',
      };
    }
    if (rowsPerPage <= 19) {
      return {
        rowPadding: 'py-1 px-1.5',
        fontSize: 'text-[11px]',
        headerPadding: 'py-1.5',
        stampDateSize: 'text-[9.5px]',
        metaPadding: 'py-1.5',
        blankHeight: 'h-6.5',
      };
    }
    if (rowsPerPage <= 21) {
      return {
        rowPadding: 'py-0.5 px-1.5',
        fontSize: 'text-[10.5px]',
        headerPadding: 'py-1',
        stampDateSize: 'text-[9px]',
        metaPadding: 'py-1',
        blankHeight: 'h-6',
      };
    }
    // 22 rows (Maximum density allowed)
    return {
      rowPadding: 'py-0.5 px-1 leading-tight',
      fontSize: 'text-[10px]',
      headerPadding: 'py-0.5',
      stampDateSize: 'text-[9px]',
      metaPadding: 'py-0.5',
      blankHeight: 'h-5.5',
    };
  }, [rowsPerPage]);

  // Robust Async Print Trigger with Forced DOM Reflow
  const handlePrint = () => {
    setIsPreparingPrint(true);
    // Force layout recalculation across document
    requestAnimationFrame(() => {
      void document.body.offsetHeight;
      const modalEl = document.getElementById('process-traveler-modal-container');
      if (modalEl) void modalEl.offsetHeight;

      setTimeout(() => {
        setIsPreparingPrint(false);
        window.print();
      }, 120);
    });
  };

  const handleSaveMetadata = () => {
    if (!onUpdateOrder) return;
    const updated: Order = {
      ...order,
      id: orderId,
      name: pjtName,
      pjtName,
      customer,
      spec,
      serialNo,
      dueDate,
      qty,
      specialNotes,
      memo: specialNotes,
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

    const calculatedTotalPages = Math.ceil(baseProcesses.length / rowsPerPage);
    const chunks = [];

    for (let p = 0; p < calculatedTotalPages; p++) {
      const start = p * rowsPerPage;
      const end = Math.min(start + rowsPerPage, baseProcesses.length);
      const pageProcesses = baseProcesses.slice(start, end).map((proc, idx) => ({
        proc,
        globalIndex: start + idx + 1,
        originalIndex: start + idx,
      }));

      const isLastPage = p === calculatedTotalPages - 1;
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

  // Auto-adjust selected page if rowsPerPage change reduced page count
  useEffect(() => {
    if (selectedPageView !== 'ALL' && typeof selectedPageView === 'number') {
      if (selectedPageView > totalPages) {
        setSelectedPageView('ALL');
      }
    }
  }, [totalPages, selectedPageView]);

  return createPortal(
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
                수주번호: {orderId} | 프로젝트명: {pjtName} | 총 공정수: {baseProcesses.length}개 ({totalPages}페이지 구성)
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
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-black shadow-md transition cursor-pointer border border-amber-400/30"
              title="각 공정별 스마트폰 스캔용 대형 QR 코드를 조회합니다."
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>모바일 QR 일괄 보기</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={isPreparingPrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-black shadow-md transition cursor-pointer active:scale-95"
              title="A4 다중 페이지로 자동 분할되어 일괄 인쇄됩니다."
            >
              <Printer className={`w-4 h-4 ${isPreparingPrint ? 'animate-spin' : ''}`} />
              <span>
                {isPreparingPrint
                  ? '인쇄 준비 중...'
                  : `공정 이동표 인쇄 (${totalPages}장 출력)`}
              </span>
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

            {/* Individual Piece Serial No Selector (When Qty > 1) */}
            {qty > 1 && (
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 px-1">호기별 각인:</span>
                <button
                  type="button"
                  onClick={() => setSelectedPiece('ALL')}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition cursor-pointer ${
                    selectedPiece === 'ALL'
                      ? 'bg-emerald-600 text-white shadow-2xs font-black'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  전체 로트 ({formatSerialRange(serialNo, qty)})
                </button>
                {Array.from({ length: qty }, (_, i) => i + 1).map((pieceNum) => (
                  <button
                    key={`piece-btn-${pieceNum}`}
                    type="button"
                    onClick={() => setSelectedPiece(pieceNum)}
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition cursor-pointer ${
                      selectedPiece === pieceNum
                        ? 'bg-blue-600 text-white shadow-2xs font-black'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    #{pieceNum} ({getIndividualSerialNo(serialNo, pieceNum, qty).split('-').slice(-1)[0]})
                  </button>
                ))}
              </div>
            )}

            {/* Rows Per Page Selector & Direct Custom Number Input (10 ~ 22) */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-300 flex-wrap">
              <span className="text-slate-500 font-semibold shrink-0">페이지당 공정수:</span>
              
              {/* Quick Presets */}
              <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-2xs">
                {[12, 15, 18, 20, 22].map((preset) => (
                  <button
                    key={`preset-${preset}`}
                    type="button"
                    onClick={() => setRowsPerPage(preset)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                      rowsPerPage === preset
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    title={`${preset}줄/장 ${preset === 18 ? '(권장)' : preset === 22 ? '(최대)' : ''}`}
                  >
                    {preset}줄{preset === 18 ? '★' : ''}
                  </button>
                ))}
              </div>

              {/* Direct Custom Number Input & Stepper (10 ~ 22) */}
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setRowsPerPage((prev) => Math.max(MIN_ROWS_PER_PAGE, prev - 1))}
                  disabled={rowsPerPage <= MIN_ROWS_PER_PAGE}
                  className="w-5 h-5 flex items-center justify-center rounded text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed font-black text-xs cursor-pointer"
                  title="1줄 줄이기 (최소 10줄)"
                >
                  -
                </button>
                <div className="flex items-center">
                  <input
                    type="number"
                    min={MIN_ROWS_PER_PAGE}
                    max={MAX_ROWS_PER_PAGE}
                    value={rowsPerPage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) {
                        setRowsPerPage(Math.min(MAX_ROWS_PER_PAGE, Math.max(MIN_ROWS_PER_PAGE, val)));
                      }
                    }}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value);
                      if (isNaN(val) || val < MIN_ROWS_PER_PAGE) {
                        setRowsPerPage(MIN_ROWS_PER_PAGE);
                      } else if (val > MAX_ROWS_PER_PAGE) {
                        setRowsPerPage(MAX_ROWS_PER_PAGE);
                      }
                    }}
                    className="w-7 text-center font-mono font-black text-xs bg-transparent border-0 focus:ring-0 p-0 text-blue-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    title="10~22줄 직접 입력"
                  />
                  <span className="text-[11px] text-slate-500 font-bold ml-0.5">줄</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRowsPerPage((prev) => Math.min(MAX_ROWS_PER_PAGE, prev + 1))}
                  disabled={rowsPerPage >= MAX_ROWS_PER_PAGE}
                  className="w-5 h-5 flex items-center justify-center rounded text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed font-black text-xs cursor-pointer"
                  title="1줄 늘리기 (최대 22줄)"
                >
                  +
                </button>
              </div>

              <span className="text-[10px] text-slate-400 font-mono hidden xl:inline">
                (10~22줄 허용)
              </span>
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
                  isHiddenInScreen ? 'traveler-page-screen-hidden' : ''
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
                        {/* Row 1: 고객사 & 수주번호 */}
                        <tr>
                          <td className={`border border-black bg-slate-100 font-bold text-center ${tableDensity.metaPadding} w-24 text-xs`}>
                            고 객 사
                          </td>
                          <td className={`border border-black text-center ${tableDensity.metaPadding} px-3 font-extrabold text-sm w-1/3`}>
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
                          <td className={`border border-black bg-slate-100 font-bold text-center ${tableDensity.metaPadding} w-24 text-xs`}>
                            수주번호
                          </td>
                          <td className={`border border-black text-center ${tableDensity.metaPadding} px-3 font-mono font-black text-sm`}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                placeholder="예: ORD-2026-001"
                                className="w-full text-center border border-blue-400 rounded px-1 py-0.5 text-xs font-mono font-bold"
                              />
                            ) : (
                              <span className="tracking-wider">{orderId}</span>
                            )}
                          </td>
                        </tr>

                        {/* Row 2: 프로젝트명 & 규격 */}
                        <tr>
                          <td className={`border border-black bg-slate-100 font-bold text-center ${tableDensity.metaPadding} text-xs`}>
                            프로젝트명
                          </td>
                          <td className={`border border-black text-center ${tableDensity.metaPadding} px-3 font-extrabold text-sm`}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={pjtName}
                                onChange={(e) => setPjtName(e.target.value)}
                                placeholder="예: PNT Flex Bolt 2P SLOT DIE"
                                className="w-full text-center border border-blue-400 rounded px-1 py-0.5 text-xs font-bold"
                              />
                            ) : (
                              <span>{pjtName}</span>
                            )}
                          </td>
                          <td className={`border border-black bg-slate-100 font-bold text-center ${tableDensity.metaPadding} text-xs`}>
                            규 격
                          </td>
                          <td className={`border border-black text-center ${tableDensity.metaPadding} px-3 font-semibold text-xs`}>
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
                        </tr>

                        {/* Row 3: 각인번호 & 납기 */}
                        <tr>
                          <td className={`border border-black bg-slate-100 font-bold text-center ${tableDensity.metaPadding} text-xs`}>
                            각인번호
                          </td>
                          <td className={`border border-black text-center ${tableDensity.metaPadding} px-2 font-mono font-bold text-xs`}>
                            {isEditing ? (
                              <div className="space-y-0.5">
                                <input
                                  type="text"
                                  value={serialNo}
                                  onChange={(e) => setSerialNo(e.target.value)}
                                  onBlur={handleSerialBlur}
                                  className="w-full text-center border border-blue-400 rounded px-1 py-0.5 text-xs font-bold font-mono"
                                />
                                <div className="text-[9px] text-slate-500 font-sans">
                                  {formatSerialRange(serialNo || orderId, qty)}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center">
                                <span className="font-bold text-xs tracking-tight">
                                  {selectedPiece === 'ALL'
                                    ? (formatSerialRange(serialNo, qty) || serialNo)
                                    : getIndividualSerialNo(serialNo || orderId, selectedPiece, qty)}
                                </span>
                                {qty > 1 && selectedPiece !== 'ALL' && (
                                  <span className="text-[9.5px] text-blue-700 font-bold font-sans">
                                    (#{selectedPiece}호기 / 총 {qty}EA)
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className={`border border-black bg-slate-100 font-bold text-center ${tableDensity.metaPadding} text-xs`}>
                            납 기
                          </td>
                          <td className={`border border-black text-center ${tableDensity.metaPadding} px-3 font-mono font-bold text-xs`}>
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
                        </tr>

                        {/* Row 4: 수량 & 상태 */}
                        <tr>
                          <td className={`border border-black bg-slate-100 font-bold text-center ${tableDensity.metaPadding} text-xs`}>
                            수 량
                          </td>
                          <td className={`border border-black text-center ${tableDensity.metaPadding} px-3 font-black text-xs`}>
                            {isEditing ? (
                              <input
                                type="number"
                                min={1}
                                value={qty}
                                onChange={(e) => handleQtyChange(parseInt(e.target.value) || 1)}
                                className="w-full text-center border border-blue-400 rounded px-1 py-0.5 text-xs font-black"
                              />
                            ) : (
                              <span className="text-sm font-black">{qty} EA</span>
                            )}
                          </td>
                          <td className={`border border-black bg-slate-100 font-bold text-center ${tableDensity.metaPadding} text-xs`}>
                            상 태
                          </td>
                          <td className={`border border-black text-center ${tableDensity.metaPadding} px-3 font-bold text-xs text-slate-700`}>
                            양산 / 발행
                          </td>
                        </tr>

                        {/* Row 5: 특이사항 */}
                        <tr>
                          <td className={`border border-black bg-slate-100 font-bold text-center ${tableDensity.metaPadding} text-xs`}>
                            특이사항
                          </td>
                          <td colSpan={3} className={`border border-black ${tableDensity.metaPadding} px-3 text-left font-bold text-xs text-black`}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={specialNotes}
                                onChange={(e) => setSpecialNotes(e.target.value)}
                                placeholder="공정 간 인수인계 철저히 할 것!"
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
                  {/* 3. PROCESS ROUTING TABLE (구분, 공정명, QR, 작업자, 설비명, 시작, 종료, 소요시간) */}
                  {/* ------------------------------------------------------------- */}
                  <div className="mb-2">
                    <table className="traveler-table w-full border-collapse border-2 border-black text-xs table-fixed">
                      <thead>
                        <tr className="bg-slate-100 font-bold text-center text-xs">
                          <th className={`border border-black ${tableDensity.headerPadding} w-[6%] text-center`}>구분</th>
                          <th className={`border border-black ${tableDensity.headerPadding} w-[28%] text-center`}>공정명</th>
                          <th className={`border border-black ${tableDensity.headerPadding} w-[7%] text-center`}>QR</th>
                          <th className={`border border-black ${tableDensity.headerPadding} w-[11%] text-center`}>작업자</th>
                          <th className={`border border-black ${tableDensity.headerPadding} w-[15%] text-center`}>설비명</th>
                          <th className={`border border-black ${tableDensity.headerPadding} w-[13.5%] text-center leading-tight`}>
                            <div>작업시작</div>
                            <div className={tableDensity.stampDateSize}>시간 (a)</div>
                          </th>
                          <th className={`border border-black ${tableDensity.headerPadding} w-[13.5%] text-center leading-tight`}>
                            <div>작업종료</div>
                            <div className={tableDensity.stampDateSize}>시간 (b)</div>
                          </th>
                          <th className={`border border-black ${tableDensity.headerPadding} w-[6%] text-center leading-tight`}>
                            <div>작업시간</div>
                            <div className={tableDensity.stampDateSize}>(b-a)</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Processes for this specific page slice */}
                        {pageInfo.processes.map(({ proc, globalIndex, originalIndex }) => {
                          const processKey = `${order.id}_Q1_P${originalIndex}`;
                          const progressItem = processProgressMap[processKey];
                          const origin = typeof window !== 'undefined' ? window.location.origin : 'https://jstech-mes.vercel.app';
                          const stepQrUrl = qrCodeMap[processKey];
                          const directUrl = `${origin}/floor?orderId=${encodeURIComponent(order.id)}&processId=${encodeURIComponent(processKey)}`;

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
                              <td className={`border border-black ${tableDensity.rowPadding} font-bold text-center ${tableDensity.fontSize} whitespace-nowrap overflow-hidden`}>
                                {globalIndex}
                              </td>

                              {/* 공정명 - 원본 100% 보존, 1행(Single Line) 강제, 폰트 자동 축소(Auto-fitting) */}
                              <td className={`border border-black process-name-cell ${tableDensity.rowPadding} text-left font-bold text-black whitespace-nowrap overflow-hidden`}>
                                <ProcessNameAutoFit name={proc.name} rowsPerPage={rowsPerPage} />
                              </td>

                              {/* QR Code Column (자동 생성된 개별 공정 QR 코드) */}
                              <td className="border border-black p-0.5 text-center align-middle">
                                {stepQrUrl ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveQrStep({
                                        name: proc.name,
                                        key: processKey,
                                        qrUrl: stepQrUrl,
                                        link: directUrl,
                                        machine: boundMachine,
                                        worker: boundWorker,
                                      })
                                    }
                                    className="cursor-pointer hover:opacity-80 transition inline-block"
                                    title="스마트폰 카메라로 스캔 시 현장 공정 자동 진입 (클릭 시 확대)"
                                  >
                                    <img
                                      src={stepQrUrl}
                                      alt={`QR ${proc.name}`}
                                      className="w-6 h-6 sm:w-7 sm:h-7 mx-auto block object-contain"
                                    />
                                  </button>
                                ) : (
                                  <span className="text-[9px] text-slate-400 font-mono">QR</span>
                                )}
                              </td>

                              {/* 작업자 */}
                              <td className={`border border-black ${tableDensity.rowPadding} text-center ${tableDensity.fontSize} font-semibold text-slate-900 whitespace-nowrap overflow-hidden`}>
                                {boundWorker}
                              </td>

                              {/* 설비명 (담당 설비 매핑) */}
                              <td className={`border border-black ${tableDensity.rowPadding} text-center ${tableDensity.fontSize} font-bold text-slate-900 whitespace-nowrap overflow-hidden`}>
                                {boundMachine}
                              </td>

                              {/* 작업시작 시간 (a) */}
                              <td className={`border border-black py-1 px-1 text-center ${tableDensity.stampDateSize} text-slate-700 leading-tight whitespace-nowrap overflow-hidden`}>
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
                              <td className={`border border-black py-1 px-1 text-center ${tableDensity.stampDateSize} text-slate-700 leading-tight whitespace-nowrap overflow-hidden`}>
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
                              <td className={`border border-black ${tableDensity.rowPadding} text-center ${tableDensity.fontSize} font-mono font-bold whitespace-nowrap overflow-hidden`}>
                                {durationDisplay}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Blank rows for on-site logging on the last page */}
                        {Array.from({ length: pageInfo.blankCount }).map((_, bIdx) => {
                          const rowNum = baseProcesses.length + bIdx + 1;
                          return (
                            <tr key={`blank-${pageInfo.pageNumber}-${bIdx}`} className={`text-center ${tableDensity.blankHeight}`}>
                              {/* 구분 */}
                              <td className={`border border-black ${tableDensity.rowPadding} font-bold text-center ${tableDensity.fontSize} text-slate-400 whitespace-nowrap overflow-hidden`}>
                                {rowNum}
                              </td>
                              {/* 공정명 */}
                              <td className={`border border-black process-name-cell ${tableDensity.rowPadding} text-left ${tableDensity.fontSize} whitespace-nowrap overflow-hidden`}></td>
                              {/* QR */}
                              <td className="border border-black"></td>
                              {/* 작업자 */}
                              <td className={`border border-black ${tableDensity.rowPadding} ${tableDensity.fontSize} whitespace-nowrap overflow-hidden`}></td>
                              {/* 설비명 */}
                              <td className={`border border-black ${tableDensity.rowPadding} ${tableDensity.fontSize} whitespace-nowrap overflow-hidden`}></td>
                              {/* 작업시작 */}
                              <td className={`border border-black py-1 px-1 text-center ${tableDensity.stampDateSize} text-slate-400 leading-tight whitespace-nowrap overflow-hidden`}>
                                <div className="flex justify-between px-1">
                                  <span>월</span>
                                  <span>일</span>
                                </div>
                                <div className="text-right pr-2 mt-0.5">:</div>
                              </td>
                              {/* 작업종료 */}
                              <td className={`border border-black py-1 px-1 text-center ${tableDensity.stampDateSize} text-slate-400 leading-tight whitespace-nowrap overflow-hidden`}>
                                <div className="flex justify-between px-1">
                                  <span>월</span>
                                  <span>일</span>
                                </div>
                                <div className="text-right pr-2 mt-0.5">:</div>
                              </td>
                              {/* 작업시간 */}
                              <td className={`border border-black ${tableDensity.rowPadding} ${tableDensity.fontSize} whitespace-nowrap overflow-hidden`}></td>
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
                    <span>준성테크(주) 생산관리시스템 (MES) | 문서양식: JST-FM-PR-01</span>
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

      {/* ========================================================================= */}
      {/* 4. MODAL: SINGLE PROCESS LARGE QR VIEWER                                  */}
      {/* ========================================================================= */}
      {activeQrStep && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                모바일 현장 진입 QR
              </span>
              <button
                type="button"
                onClick={() => setActiveQrStep(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <span className="text-xs font-mono font-bold text-slate-500">[{order?.id}]</span>
              <h3 className="text-base font-black text-slate-900 leading-snug mt-1">
                {activeQrStep.name}
              </h3>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                설비: {activeQrStep.machine || '미배정'} • 작업자: {activeQrStep.worker || '미지정'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-center shadow-inner">
              <img
                src={activeQrStep.qrUrl}
                alt="QR Code"
                className="w-48 h-48 object-contain rounded-xl"
              />
            </div>

            <p className="text-xs text-slate-500 font-medium">
              현장 작업자가 스마트폰 카메라로 스캔하면 이 공정의 모바일 실행 화면으로 즉시 연결됩니다.
            </p>

            <button
              type="button"
              onClick={() => setActiveQrStep(null)}
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs cursor-pointer hover:bg-slate-800"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: ALL PROCESSES QR GALLERY                                       */}
      {/* ========================================================================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-[100] bg-black/75 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    전 공정 모바일 QR 스캔 라벨 일괄 보기
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    수주 [{order?.id}] {order?.name} — 각 공정별 고유 QR 코드
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pr-1">
              {baseProcesses.map((proc, idx) => {
                const processKey = `${order?.id}_Q1_P${idx}`;
                const qrUrl = qrCodeMap[processKey];
                const boundMachine = proc.assignedMachine || (proc.category === '외주' ? '(외주)' : '미배정');
                const boundWorker = proc.worker || proc.assignedWorker || '미지정';

                return (
                  <div
                    key={`all-qr-${idx}`}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center text-center justify-between space-y-2 shadow-xs"
                  >
                    <div className="w-full text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-md">
                          STEP {idx + 1}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">{proc.category}</span>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 truncate mt-1" title={proc.name}>
                        {proc.name}
                      </h4>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                      {qrUrl ? (
                        <img src={qrUrl} alt={proc.name} className="w-32 h-32 object-contain" />
                      ) : (
                        <div className="w-32 h-32 flex items-center justify-center text-slate-400 text-xs">
                          QR 생성중...
                        </div>
                      )}
                    </div>

                    <div className="w-full text-[11px] text-slate-600 font-semibold">
                      <div>설비: <strong className="text-slate-900">{boundMachine}</strong></div>
                      <div>작업자: <strong className="text-slate-900">{boundWorker}</strong></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md"
              >
                확인 및 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
