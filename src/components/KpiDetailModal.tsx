import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Gauge,
  Activity,
  ArrowRight,
  TrendingUp,
  Cpu,
  Thermometer,
  Droplets,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export type KpiModalType =
  | 'DAILY_COUNT'
  | 'YIELD'
  | 'DEFECTS'
  | 'CAPA'
  | 'INSPECT_TIME'
  | 'CMM_UTILIZATION';

interface KpiDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType: KpiModalType | null;
  onNavigateToStage?: (stage: 'IQC' | 'IPQC' | 'OQC', tab?: string) => void;
}

export const KpiDetailModal: React.FC<KpiDetailModalProps> = ({
  isOpen,
  onClose,
  initialType,
  onNavigateToStage
}) => {
  const [activeTab, setActiveTab] = useState<KpiModalType>(initialType || 'DAILY_COUNT');

  // Sync active tab when initialType changes
  React.useEffect(() => {
    if (initialType) {
      setActiveTab(initialType);
    }
  }, [initialType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>품질 & 검사 종합 KPI 성과 상세 분석</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  REAL-TIME MES QA
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                (주)준성테크 슬롯다이 및 정밀가공 품질 데이터베이스 종합 집계
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Pills */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('DAILY_COUNT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'DAILY_COUNT'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>1. 금일 검사 (1,480건)</span>
          </button>

          <button
            onClick={() => setActiveTab('YIELD')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'YIELD'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>2. 종합 수율 (99.4%)</span>
          </button>

          <button
            onClick={() => setActiveTab('DEFECTS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'DEFECTS'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>3. 불량 내역 (8건)</span>
          </button>

          <button
            onClick={() => setActiveTab('CAPA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'CAPA'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>4. 재검사 & CAPA (12건)</span>
          </button>

          <button
            onClick={() => setActiveTab('INSPECT_TIME')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'INSPECT_TIME'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>5. 검사 시간 (24.5분)</span>
          </button>

          <button
            onClick={() => setActiveTab('CMM_UTILIZATION')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'CMM_UTILIZATION'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>6. CMM 가동률 (95.2%)</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200 text-xs">
          {/* TAB 1: DAILY COUNT */}
          {activeTab === 'DAILY_COUNT' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">1. 수입검사 (IQC)</span>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">120 <span className="text-xs font-normal">건</span></div>
                  <span className="text-[10px] text-slate-500">모재/원소재 입고 검사</span>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">2. 공정검사 (IPQC)</span>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">1,180 <span className="text-xs font-normal">건</span></div>
                  <span className="text-[10px] text-slate-500">3D CMM / 가공 치수 검사</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">3. 출하검사 (OQC)</span>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">180 <span className="text-xs font-normal">건</span></div>
                  <span className="text-[10px] text-slate-500">최종 COA 성적서 발행</span>
                </div>
              </div>

              {/* Hourly Inspection Distribution */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-black text-slate-900 dark:text-white text-xs flex items-center justify-between">
                  <span>금일 시간대별 검사 처리량 (08:00 ~ 18:00)</span>
                  <span className="text-blue-600 font-mono text-[11px]">피크 시간대: 14:00~15:00 (220건/h)</span>
                </h4>

                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 text-center">
                  {[
                    { time: '08시', count: 60, height: '35%' },
                    { time: '09시', count: 140, height: '70%' },
                    { time: '10시', count: 180, height: '85%' },
                    { time: '11시', count: 160, height: '75%' },
                    { time: '12시', count: 40, height: '20%' },
                    { time: '13시', count: 150, height: '72%' },
                    { time: '14시', count: 220, height: '100%' },
                    { time: '15시', count: 190, height: '90%' },
                    { time: '16시', count: 180, height: '85%' },
                    { time: '17시', count: 160, height: '75%' }
                  ].map((t) => (
                    <div key={t.time} className="flex flex-col items-center justify-end h-28 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                      <div className="w-full bg-blue-500 rounded-lg transition-all" style={{ height: t.height }} />
                      <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 mt-1">{t.count}</span>
                      <span className="text-[9px] text-slate-400 font-mono">{t.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Line Distribution */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="p-2.5">검사 구역 및 라인</th>
                      <th className="p-2.5">담당자</th>
                      <th className="p-2.5">검사 완료 건수</th>
                      <th className="p-2.5">진행 상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    <tr>
                      <td className="p-2.5 font-bold">LINE 1 (클린룸 #1 슬롯다이)</td>
                      <td className="p-2.5">이준혁 검사원</td>
                      <td className="p-2.5 font-mono font-bold text-blue-600">580건</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">정상 가동</span></td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">LINE 2 (클린룸 #2 초정밀 연마)</td>
                      <td className="p-2.5">박민수 주임</td>
                      <td className="p-2.5 font-mono font-bold text-blue-600">520건</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">정상 가동</span></td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">LINE 3 (정밀 CNC/MCT 가공)</td>
                      <td className="p-2.5">김철수 반장</td>
                      <td className="p-2.5 font-mono font-bold text-blue-600">380건</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">정상 가동</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: YIELD */}
          {activeTab === 'YIELD' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">전체 공정 종합 품질 수율</span>
                  <div className="text-3xl font-black text-slate-900 dark:text-white mt-0.5">
                    99.4% <span className="text-xs font-bold text-emerald-600">(목표 99.0% 대비 +0.4%p 초과)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">6-Sigma 품질 관리 기준 충족 (Cpk 1.84)</p>
                </div>
                <div className="text-right font-mono text-xs space-y-1">
                  <div>Cp (공정능력): <strong className="text-emerald-600">1.92</strong></div>
                  <div>Cpk (편향보정): <strong className="text-emerald-600">1.84</strong></div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 font-bold">1단계: 수입검사(IQC) 수율</span>
                  <div className="text-xl font-black text-emerald-600 mt-1">100.0%</div>
                  <span className="text-[10px] text-slate-400">3/3 LOT 전수 합격</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 font-bold">2단계: 공정검사(IPQC) 수율</span>
                  <div className="text-xl font-black text-blue-600 mt-1">99.1%</div>
                  <span className="text-[10px] text-slate-400">1,180건 중 8건 경미 편차</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 font-bold">3단계: 출하검사(OQC) 수율</span>
                  <div className="text-xl font-black text-emerald-600 mt-1">99.7%</div>
                  <span className="text-[10px] text-slate-400">최종 승인율 최상위</span>
                </div>
              </div>

              {/* 7-Day Trend */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">최근 7일간 일자별 합격률 추이</h4>
                <div className="grid grid-cols-7 gap-2 text-center">
                  {[
                    { day: '08/13', yield: '99.1%' },
                    { day: '08/14', yield: '99.2%' },
                    { day: '08/15', yield: '99.0%' },
                    { day: '08/16', yield: '98.8%' },
                    { day: '08/17', yield: '99.3%' },
                    { day: '08/18', yield: '99.5%' },
                    { day: '08/19 (금일)', yield: '99.4%' }
                  ].map((d) => (
                    <div key={d.day} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-500 font-mono">{d.day}</span>
                      <div className="text-xs font-black text-emerald-600 mt-0.5">{d.yield}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEFECTS */}
          {activeTab === 'DEFECTS' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="font-black text-rose-600 dark:text-rose-400 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>금일 발생한 품질 이상/불량 항목 (총 8건)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">모든 불량품은 즉시 공정 라인에서 격리되어 시정조치(CAPA) 티켓이 발행되었습니다.</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black">
                  격리 8건 / 개선 6건
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-rose-50/70 dark:bg-rose-950/40 text-[11px] font-bold text-rose-900 dark:text-rose-300">
                    <tr>
                      <th className="p-2.5">발생 시간</th>
                      <th className="p-2.5">부품/제품명</th>
                      <th className="p-2.5">불량 유형</th>
                      <th className="p-2.5">측정치 / 기준치</th>
                      <th className="p-2.5">시정 조치 현황</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-xs">
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">10:24</td>
                      <td className="p-2.5 font-bold">슬롯다이 상부 바디 #04</td>
                      <td className="p-2.5 text-rose-600 font-bold">립 토출구 평탄도 초과</td>
                      <td className="p-2.5 font-mono">1.82㎛ / Max 1.50㎛</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">재연마 진행중</span></td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">11:15</td>
                      <td className="p-2.5 font-bold">슬롯다이 하부 바디 #02</td>
                      <td className="p-2.5 text-rose-600 font-bold">볼트 체결 홀 H7 공차 이탈</td>
                      <td className="p-2.5 font-mono">+16.8㎛ / ±15.0㎛</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">리밍 재가공 완료</span></td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">14:02</td>
                      <td className="p-2.5 font-bold">심(Shim) 플레이트 0.05T</td>
                      <td className="p-2.5 text-rose-600 font-bold">두께 편차 (T=0.054)</td>
                      <td className="p-2.5 font-mono">+4.0㎛ / ±2.0㎛</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">신규 레이저 가공품 교체</span></td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-slate-500">15:40</td>
                      <td className="p-2.5 font-bold">엔드 피스 블록 L-03</td>
                      <td className="p-2.5 text-rose-600 font-bold">표면 조도 Ra 초과</td>
                      <td className="p-2.5 font-mono">Ra 0.038㎛ / Ra 0.025㎛</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">초음파 래핑 연마중</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CAPA */}
          {activeTab === 'CAPA' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-black text-amber-900 dark:text-amber-300 text-xs">
                    5단계 품질 시정 조치(CAPA) 추적 라이프사이클
                  </span>
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                    전체 12건 중 8건 종결 완료 (종결율 66.7%)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  불량 발생 즉시 원인 분석 ➔ 치공구 교정 ➔ CMM 정밀 재검사 ➔ 품질보증팀장 승인으로 이어집니다.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    id: 'CAPA-260303-01',
                    part: 'SEMES 1580mm 슬롯다이 상부 바디 #04',
                    issue: '립 토출구 진직도 미세 이탈 (1.82㎛)',
                    step: '3단계: 연마 지그 토크 12N·m 재조정 중',
                    status: '진행중',
                    color: 'amber'
                  },
                  {
                    id: 'CAPA-260303-02',
                    part: '세메스 1580mm STS630 하부 립',
                    issue: '매니폴드 챔버 단차 공차 이탈',
                    step: '5단계: 최종 CMM 재측정 합격 판정',
                    status: '승인완료',
                    color: 'emerald'
                  },
                  {
                    id: 'CAPA-260303-03',
                    part: 'SUS420J2 외주 열처리 블록',
                    issue: '경도 산포 HRC 51.5 (규격 HRC 52~56)',
                    step: '5단계: 템퍼링 재처리 후 HRC 54.2 합격',
                    status: '승인완료',
                    color: 'emerald'
                  }
                ].map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-blue-600 text-xs">{c.id}</span>
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{c.part}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{c.issue} ➔ <strong>{c.step}</strong></p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        c.status === '승인완료'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: INSPECTION TIME */}
          {activeTab === 'INSPECT_TIME' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 flex justify-between items-center">
                <div>
                  <span className="font-bold text-indigo-700 dark:text-indigo-400 text-xs">제품당 평균 검사 소요 시간</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">24.5분</div>
                  <p className="text-[11px] text-slate-500">전주 대비 3.5분 단축 (CMM 자동화 매크로 최적화)</p>
                </div>
                <div className="text-right text-xs font-mono">
                  <div className="text-emerald-600 font-bold">목표: 25.0분 이내 (달성)</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">세부 단계별 소요 시간 분할</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>1. 3D CMM 프로브 접촉식 연속 스캔 (16개 포인트)</span>
                      <span className="font-mono text-blue-600">18.2분 (74.3%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: '74.3%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>2. 레이저 비접촉 광학 간섭계 립 단차 프로파일</span>
                      <span className="font-mono text-teal-600">4.1분 (16.7%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: '16.7%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>3. 표면조도(Ra) 접촉 측정 및 디지털 성적서 서명</span>
                      <span className="font-mono text-emerald-600">2.2분 (9.0%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '9.0%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CMM UTILIZATION */}
          {activeTab === 'CMM_UTILIZATION' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">CMM-01 (ZEISS Prismo Ultra)</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">96.8% 가동률</div>
                  <p className="text-[11px] text-slate-500 mt-1">위치: 항온항습 클린룸 #1 (20.0℃ / 45% RH)</p>
                </div>
                <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-teal-700 dark:text-teal-400">CMM-02 (Mitutoyo Crysta-Apex V)</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">93.5% 가동률</div>
                  <p className="text-[11px] text-slate-500 mt-1">위치: 항온항습 클린룸 #2 (20.0℃ / 45% RH)</p>
                </div>
              </div>

              {/* Environmental Monitoring Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
                    <Thermometer className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">KOLAS 공인 항온항습실 환경 모니터링</span>
                    <p className="text-[11px] text-slate-500">실시간 온도 20.02℃ (기준: 20℃±0.5℃) | 습도 45.1% RH (기준: 45%±5%)</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800">
                  최적 규격 유지중
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            * (주)준성테크 스마트 품질관리시스템(MES-QA) 실시간 동기화
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 text-xs font-black transition cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
