import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  Wrench,
  User,
  Clock,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Order, ScheduledTaskItem, ProcessProgressItem } from '../types';

interface EasyTravelerModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  taskItem?: ScheduledTaskItem | null;
  processKey?: string;
  processName?: string;
  processIndex?: number;
  assignedMachine?: string;
  assignedWorker?: string;
  plannedMinutes?: number;
  category?: string;
}

export const EasyTravelerModal: React.FC<EasyTravelerModalProps> = ({
  isOpen,
  onClose,
  order,
  taskItem,
  processKey,
  processName,
  processIndex = 1,
  assignedMachine,
  assignedWorker,
  plannedMinutes,
  category = '가공',
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [deepLinkUrl, setDeepLinkUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const effectiveOrder = order;
  const effectiveProcessName =
    processName || taskItem?.content || taskItem?.title || '공정명 미지정';
  const effectiveMachine =
    assignedMachine || taskItem?.machine || effectiveOrder?.mctMachine || '설비 미배정';
  const effectiveWorker =
    assignedWorker || taskItem?.worker || '담당자 미배정';
  const effectiveKey =
    processKey || taskItem?.processKey || (effectiveOrder ? `${effectiveOrder.id}_Q1_P${processIndex - 1}` : 'TASK_KEY');
  const effectiveDuration =
    plannedMinutes || taskItem?.plannedMinutes || (taskItem?.duration ? taskItem.duration * 60 : 60);

  useEffect(() => {
    if (!isOpen) return;

    // Construct high-precision deep link URL
    const host = window.location.host || 'localhost:3000';
    const protocol = window.location.protocol || 'http:';
    const orderParam = effectiveOrder?.id || '';
    const link = `${protocol}//${host}/?orderId=${encodeURIComponent(orderParam)}&processId=${encodeURIComponent(effectiveKey)}&view=execution`;
    setDeepLinkUrl(link);

    // Generate real QR code data URL (High error correction level 'M', crisp SVG/PNG)
    QRCode.toDataURL(
      link,
      {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 256,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      },
      (err, url) => {
        if (err) {
          console.error('QR code generation error:', err);
        } else {
          setQrCodeDataUrl(url);
        }
      }
    );
  }, [isOpen, effectiveOrder, effectiveKey]);

  if (!isOpen || !effectiveOrder) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(deepLinkUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs select-none print:p-0 print:bg-white print:static"
      id="easy-traveler-backdrop"
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #easy-traveler-printable-sheet,
          #easy-traveler-printable-sheet * {
            visibility: visible !important;
          }
          #easy-traveler-printable-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100mm !important;
            height: 150mm !important;
            max-width: 100mm !important;
            margin: 0 !important;
            padding: 8mm !important;
            border: 2px solid #000 !important;
            box-shadow: none !important;
            background: #fff !important;
            page-break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Outer Modal Container */}
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:w-auto print:shadow-none print:border-none">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                이지 트래블러 (Easy Traveler) & QR 라벨
              </h2>
              <p className="text-xs text-slate-400">
                현장 작업자가 모바일/태블릿 카메라로 스캔 시 원클릭 실행 터미널로 즉시 연결됩니다.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md transition cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>라벨 인쇄 (Print)</span>
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

        {/* Printable Label Area */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center bg-slate-100 print:bg-white print:p-0">
          <div
            id="easy-traveler-printable-sheet"
            className="w-full max-w-[420px] bg-white border-2 border-black p-5 rounded-xl shadow-lg print:shadow-none print:rounded-none flex flex-col space-y-3 font-sans text-black"
          >
            {/* Header / Brand */}
            <div className="border-b-2 border-black pb-2 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-black text-white px-2 py-0.5 font-black uppercase rounded-xs">
                    SMART MES
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    공정 공정표 / 작업 지시서
                  </span>
                </div>
                <h3 className="text-xl font-black text-black tracking-tight mt-0.5">
                  EASY TRAVELER
                </h3>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-slate-800">
                  {effectiveOrder.poNumber || effectiveOrder.id}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {new Date().toLocaleDateString('ko-KR')}
                </div>
              </div>
            </div>

            {/* Project & Spec Overview Grid */}
            <div className="border border-black bg-slate-50 p-2.5 rounded-lg space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-600 text-[11px]">프로젝트/수주명:</span>
                <span className="font-black text-sm text-black truncate max-w-[220px]">
                  {effectiveOrder.name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-bold">고객사:</span>
                  <span className="font-black text-slate-900">{effectiveOrder.customer || '고객사 지정'}</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-slate-500 font-bold">규격:</span>
                  <span className="font-black text-slate-900 font-mono">{effectiveOrder.spec || '650L'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-bold">소재/공차:</span>
                  <span className="font-black text-slate-900">{effectiveOrder.material || 'SUS316L'} ({effectiveOrder.tolerance || '±5µm'})</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-slate-500 font-bold">수량:</span>
                  <span className="font-black text-slate-900">{effectiveOrder.qty} EA</span>
                </div>
              </div>
            </div>

            {/* Current Process Highlight Box */}
            <div className="border-2 border-black bg-yellow-50/80 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-yellow-400 border border-black rounded text-black">
                  TARGET PROCESS #{processIndex} ({category})
                </span>
                <span className="text-xs font-black font-mono text-blue-900">
                  계획시간: {effectiveDuration}분 ({Math.round(effectiveDuration / 60 * 10) / 10}h)
                </span>
              </div>
              <div className="text-base font-black text-black leading-snug">
                {effectiveProcessName}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-yellow-300 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block font-bold">배정 설비</span>
                  <span className="font-black text-slate-900">{effectiveMachine}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-bold">담당 작업자</span>
                  <span className="font-black text-slate-900">{effectiveWorker}</span>
                </div>
              </div>
            </div>

            {/* QR Code & Deep Link Section */}
            <div className="border border-black p-3 rounded-lg flex items-center justify-between gap-4 bg-white">
              <div className="flex flex-col justify-center space-y-1">
                <span className="text-xs font-black text-black flex items-center gap-1">
                  <QrCode className="w-4 h-4 text-blue-700" />
                  <span>현장 원클릭 스캔</span>
                </span>
                <p className="text-[10px] text-slate-600 leading-tight">
                  모바일 카메라로 스캔 시 본 공정의 <strong>[작업 시작/완료]</strong> 터미널로 즉시 진입합니다.
                </p>
                <div className="no-print pt-1">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="text-[10px] font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isCopied ? '✅ 링크 복사 완료!' : '딥링크 URL 복사하기'}</span>
                  </button>
                </div>
              </div>
              <div className="shrink-0 bg-white p-1 border border-black rounded flex items-center justify-center">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Process Deep Link QR"
                    className="w-24 h-24 object-contain"
                  />
                ) : (
                  <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-xs text-slate-400 font-bold">
                    생성 중...
                  </div>
                )}
              </div>
            </div>

            {/* Quality & Physical Stamp Boxes */}
            <div className="border border-black grid grid-cols-3 text-center text-xs">
              <div className="p-1.5 border-r border-black">
                <span className="text-[10px] text-slate-500 block font-bold">작업자 서명</span>
                <div className="h-9 flex items-center justify-center font-bold text-slate-800 text-xs">
                  {effectiveWorker.split(' ')[0] || '(인)'}
                </div>
              </div>
              <div className="p-1.5 border-r border-black">
                <span className="text-[10px] text-slate-500 block font-bold">자주검사 확인</span>
                <div className="h-9 flex items-center justify-center font-bold text-emerald-700 text-xs">
                  [ 합 격 ]
                </div>
              </div>
              <div className="p-1.5">
                <span className="text-[10px] text-slate-500 block font-bold">품질 인계</span>
                <div className="h-9 flex items-center justify-center text-[10px] text-slate-400">
                  확인(인)
                </div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="text-[9px] text-slate-500 font-mono text-center pt-1 border-t border-slate-300">
              (주)준성테크 스마트 MES 공정관리시스템 | JST-ET-2026-QR
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
