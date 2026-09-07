import React, { useState, useEffect, useMemo } from 'react';
import { ScheduledTaskItem, Order, User, ProcessProgressMap, ProcessProgressItem } from '../types';
import { MCT_MACHINES, GRINDER_MACHINES, CMM_MACHINES, ALL_EQUIPMENT_LIST } from '../data/defaultData';
import { getBaseWorkerName, getDepartmentSuffix } from '../utils/operatorHelper';
import { canEditMenu } from '../utils/permissionManager';
import {
  calculateLineMetrics,
  EquipmentMetricMode,
  getSavedMetricMode,
  saveMetricModeToStorage,
  MachineMetricItem
} from '../utils/equipmentMetrics';
import {
  getStoredInspections,
  getStoredShippingProjects,
} from '../data/qualityData';
import { InspectionItem, ShippingProjectItem } from '../types/quality';
import {
  subscribeEquipmentMetricSettings,
  saveEquipmentMetricSettings
} from '../lib/firebase';
import { PlcBridgeModal } from './PlcBridgeModal';
import {
  Cpu,
  UserCheck,
  Activity,
  Zap,
  CheckCircle2,
  Clock,
  Layers,
  Wrench,
  Gauge,
  Sliders,
  Wifi,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Info,
  ShieldCheck,
  Settings2,
  Check,
  Filter
} from 'lucide-react';

interface EquipmentViewProps {
  items?: ScheduledTaskItem[];
  scheduledTasks?: ScheduledTaskItem[];
  orders?: Record<string, Order>;
  approvedOperators?: string[];
  currentUser?: User | null;
  usersList?: User[];
  processProgressMap?: ProcessProgressMap;
  onUpdateProgress?: (key: string, data: Partial<ProcessProgressItem>) => void;
}

export const EquipmentView: React.FC<EquipmentViewProps> = ({
  items,
  scheduledTasks,
  orders = {},
  approvedOperators = [],
  currentUser,
  usersList = [],
  processProgressMap = {},
  onUpdateProgress
}) => {
  const taskList = useMemo(() => items || scheduledTasks || [], [items, scheduledTasks]);

  // 1. Metric Mode Selection state (persisted to Firestore & localStorage)
  const [metricMode, setMetricMode] = useState<EquipmentMetricMode>(() => getSavedMetricMode());
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [isPlcBridgeOpen, setIsPlcBridgeOpen] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'warning' | 'info'; message: string } | null>(null);

  // 2. Inspection and Shipping records (synced from local storage / events)
  const [inspections, setInspections] = useState<InspectionItem[]>(() => getStoredInspections());
  const [shippingProjects, setShippingProjects] = useState<ShippingProjectItem[]>(() => getStoredShippingProjects());

  // Listen to cross-component updates from Quality Inspection module
  useEffect(() => {
    const handleInspectionsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<InspectionItem[]>;
      if (customEvent.detail) setInspections(customEvent.detail);
      else setInspections(getStoredInspections());
    };

    const handleShippingUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ShippingProjectItem[]>;
      if (customEvent.detail) setShippingProjects(customEvent.detail);
      else setShippingProjects(getStoredShippingProjects());
    };

    window.addEventListener('mes_inspections_updated', handleInspectionsUpdate);
    window.addEventListener('mes_shipping_updated', handleShippingUpdate);

    return () => {
      window.removeEventListener('mes_inspections_updated', handleInspectionsUpdate);
      window.removeEventListener('mes_shipping_updated', handleShippingUpdate);
    };
  }, []);

  // Sync metricMode with Firestore
  useEffect(() => {
    const unsub = subscribeEquipmentMetricSettings(
      (savedMode) => {
        if (savedMode && (savedMode === 'AVAILABILITY_ONLY' || savedMode === 'AVAILABILITY_PERFORMANCE' || savedMode === 'FULL_OEE')) {
          setMetricMode(savedMode);
          saveMetricModeToStorage(savedMode);
        }
      },
      (err) => {
        console.warn('Firestore equipment metric settings sync error:', err);
      }
    );
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Mode change handler
  const handleSelectMode = async (mode: EquipmentMetricMode) => {
    setMetricMode(mode);
    saveMetricModeToStorage(mode);
    setIsModeDropdownOpen(false);
    try {
      await saveEquipmentMetricSettings(mode);
    } catch (e) {
      console.warn('Failed to sync metric mode to Firestore', e);
    }

    const modeLabels: Record<EquipmentMetricMode, string> = {
      AVAILABILITY_ONLY: '가동률만 (Availability Only)',
      AVAILABILITY_PERFORMANCE: '가동률 + 성능률 (기본값)',
      FULL_OEE: '가동률 + 성능률 + 양품률 (통합 OEE)'
    };
    setFeedbackToast({
      type: 'info',
      message: `설비 지표 산출 모드가 [${modeLabels[mode]}]로 변경되었습니다.`
    });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // 3. Calculate all line metrics using centralized engine
  const lineSummary = useMemo(() => {
    return calculateLineMetrics(
      taskList,
      processProgressMap,
      inspections,
      shippingProjects,
      metricMode
    );
  }, [taskList, processProgressMap, inspections, shippingProjects, metricMode]);

  // Tasks mapped per machine
  const getTasksForMachine = (mName: string) => taskList.filter((i) => i.machine === mName);

  // Permission check for PLC cycle start trigger
  const canControlPLC = useMemo(() => {
    if (!currentUser) return true; // dev fallback
    if (currentUser.role === 'ADMIN') return true;
    return canEditMenu(currentUser, 'equipment') || canEditMenu(currentUser, 'execution');
  }, [currentUser]);

  // Handle PLC cycle start trigger
  const handleTriggerPlcCycleStart = (machineId: string, machineName: string) => {
    if (!canControlPLC) {
      setFeedbackToast({
        type: 'warning',
        message: '⚠️ 설비 가공 시작(M100) 트리거 권한이 없습니다. 관리자(ADMIN) 또는 현장 공정 권한이 필요합니다.'
      });
      setTimeout(() => setFeedbackToast(null), 4000);
      return;
    }

    const targetTask = taskList.find(
      (t) => (t.machine?.includes(machineId) || t.machine?.includes(machineName)) && !t.isCompleted
    );

    if (targetTask && onUpdateProgress) {
      onUpdateProgress(targetTask.processKey, {
        status: 'IN_PROGRESS',
        actualStart: new Date().toISOString()
      });
      setFeedbackToast({
        type: 'success',
        message: `⚡ [${machineName}] PLC M100 신호 수신: [${targetTask.orderName}] 가공 공정이 즉시 시작되었습니다.`
      });
      setTimeout(() => setFeedbackToast(null), 4000);
    } else {
      setFeedbackToast({
        type: 'info',
        message: `ℹ️ [${machineName}] 대기 중인 작업이 없거나 이미 완료되었습니다.`
      });
      setTimeout(() => setFeedbackToast(null), 3500);
    }
  };

  // Render individual machine metric strip based on current mode
  const renderMachineMetricBox = (machineName: string) => {
    const metric: MachineMetricItem | undefined = lineSummary.machineMetrics[machineName];
    if (!metric) return null;

    if (metricMode === 'AVAILABILITY_ONLY') {
      return (
        <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
          <span className="text-slate-500 font-medium">가동률</span>
          <span className={`font-mono font-black px-1.5 py-0.5 rounded text-[11px] ${
            metric.availabilityRate > 0
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}>
            {metric.availabilityRate}%
          </span>
        </div>
      );
    }

    if (metricMode === 'AVAILABILITY_PERFORMANCE') {
      return (
        <div className="pt-2 border-t border-slate-100 space-y-1 text-[10px]">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              가동률
            </span>
            <span className={`font-mono font-black ${metric.availabilityRate > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
              {metric.availabilityRate}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
              성능률
            </span>
            <div className="flex items-center gap-1">
              {metric.actualHoursSum > 0 ? (
                <span className="font-mono text-slate-400 text-[9px]">
                  ({metric.planHoursSum}h/{metric.actualHoursSum}h)
                </span>
              ) : null}
              <span className={`font-mono font-black px-1.5 py-0.5 rounded text-[11px] ${
                metric.performanceRate >= 90
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : metric.performanceRate >= 70
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {metric.performanceRate}%
              </span>
            </div>
          </div>
        </div>
      );
    }

    // FULL_OEE Mode
    return (
      <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[10px]">
        {/* 1. 가동률 & 성능률 */}
        <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
          <div className="flex flex-col">
            <span className="text-slate-400 text-[9px] font-semibold">가동률</span>
            <span className={`font-mono font-bold text-[11px] ${metric.availabilityRate > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
              {metric.availabilityRate}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-[9px] font-semibold">성능률</span>
            <span className="font-mono font-bold text-[11px] text-blue-600">
              {metric.performanceRate}%
            </span>
          </div>
        </div>

        {/* 2. 양품률 */}
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block"></span>
            양품률
          </span>
          {metric.qualityRate !== null ? (
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-slate-400">
                ({metric.confirmedGood}양/{metric.confirmedDefect}불)
              </span>
              <span className={`font-mono font-black px-1.5 py-0.5 rounded text-[10px] ${
                metric.qualityRate >= 95
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {metric.qualityRate}%
              </span>
            </div>
          ) : (
            <span className="text-[9px] text-slate-400 italic bg-slate-100 px-1.5 py-0.5 rounded">
              검사 대기(표본 없음)
            </span>
          )}
        </div>

        {/* 3. 통합 OEE */}
        <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-200">
          <span className="text-slate-700 font-extrabold flex items-center gap-1">
            <Activity className="w-3 h-3 text-amber-500" />
            통합 OEE
          </span>
          <span className="font-mono font-black text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shadow-2xs">
            {metric.integratedOee !== null ? `${metric.integratedOee}%` : '-'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* 1. MAIN HEADER & CONTROL TOOLBAR (메뉴명 일치: 설비 현황)                */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md border border-slate-800 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white">설비 현황</h1>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-2 py-0.5 rounded-full">
                실시간 21대 OEE 모니터링
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-300">
              전체 생산 설비 & 공정 담당자 모니터링 (Equipment & Personnel OEE)
            </p>
            <p className="text-[11px] text-slate-400">
              준성테크 정밀 가공·연마·검사 설비 총 21대 (MCT 10대, 연마기 9대, CMM 2대) 및 등록 공정 담당자의 실시간 종합 가동 현황입니다.
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Metric Mode Selection Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 border border-slate-700 transition cursor-pointer shadow-xs"
              title="지표 계산 방식 설정"
            >
              <Settings2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline text-slate-300">지표 모드:</span>
              <span className="text-amber-300 font-extrabold">
                {metricMode === 'AVAILABILITY_ONLY' && '1. 가동률만'}
                {metricMode === 'AVAILABILITY_PERFORMANCE' && '2. 가동률+성능률 (기본)'}
                {metricMode === 'FULL_OEE' && '3. 통합 OEE (양품률 포함)'}
              </span>
              <Filter className="w-3 h-3 text-slate-400" />
            </button>

            {isModeDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 z-50 p-2 space-y-1 animate-fadeIn">
                <div className="px-2 py-1 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  설비 지표 산출 방식 설정
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectMode('AVAILABILITY_ONLY')}
                  className={`w-full text-left p-2 rounded-lg text-xs transition flex items-start gap-2 cursor-pointer ${
                    metricMode === 'AVAILABILITY_ONLY'
                      ? 'bg-amber-50 text-amber-900 font-black border border-amber-200'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="pt-0.5">
                    {metricMode === 'AVAILABILITY_ONLY' ? <Check className="w-3.5 h-3.5 text-amber-600" /> : <div className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">1. 가동률만 (Availability Only)</div>
                    <div className="text-[10px] text-slate-500 font-normal">설비의 물리적 가동/대기 여부만 집계 (100% or 0%)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectMode('AVAILABILITY_PERFORMANCE')}
                  className={`w-full text-left p-2 rounded-lg text-xs transition flex items-start gap-2 cursor-pointer ${
                    metricMode === 'AVAILABILITY_PERFORMANCE'
                      ? 'bg-blue-50 text-blue-900 font-black border border-blue-200'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="pt-0.5">
                    {metricMode === 'AVAILABILITY_PERFORMANCE' ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <div className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1">
                      <span>2. 가동률 + 성능률</span>
                      <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-extrabold">기본값</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">계획시간 대비 실제소요시간 분석율(상한 100%) 반영</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectMode('FULL_OEE')}
                  className={`w-full text-left p-2 rounded-lg text-xs transition flex items-start gap-2 cursor-pointer ${
                    metricMode === 'FULL_OEE'
                      ? 'bg-purple-50 text-purple-900 font-black border border-purple-200'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="pt-0.5">
                    {metricMode === 'FULL_OEE' ? <Check className="w-3.5 h-3.5 text-purple-600" /> : <div className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1">
                      <span>3. 통합 OEE (양품률 포함)</span>
                      <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded font-extrabold">Full OEE</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">가동률 × 성능률 × 양품률(출하확정/IPQC결과) 통합 산출</div>
                  </div>
                </button>

                <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-400 px-2 leading-relaxed">
                  * 선택한 지표 방식은 클라우드 DB 및 브라우저에 저장되어 재접속 시에도 유지됩니다.
                </div>
              </div>
            )}
          </div>

          {/* PLC IoT Bridge Button (Moved from Floor Execution as requested in Step 4) */}
          <button
            type="button"
            onClick={() => setIsPlcBridgeOpen(true)}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-xs"
            title="미쓰비시 FX3U / 화낙 FOCAS PLC 엣지 브리지 제어기 열기"
          >
            <Wifi className="w-3.5 h-3.5 text-white" />
            <span>PLC IoT 연동 제어기 (M100)</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast Notification */}
      {feedbackToast && (
        <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition animate-fadeIn ${
          feedbackToast.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : feedbackToast.type === 'warning'
            ? 'bg-amber-50 text-amber-900 border-amber-200'
            : 'bg-blue-50 text-blue-900 border-blue-200'
        }`}>
          {feedbackToast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
          {feedbackToast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
          {feedbackToast.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. OVERALL LINE SUMMARY METRICS RIBBON                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Metric 1: 전체 설비 현황 */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-[11px] font-bold">
            <span>총 설비 (MCT+연마+CMM)</span>
            <Cpu className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">{lineSummary.totalMachines}대</span>
            <span className="text-[10px] text-emerald-600 font-bold">({lineSummary.runningCount}대 가동)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span>대기 {lineSummary.idleCount}대</span>
            <span>·</span>
            <span>정지 {lineSummary.pausedCount}대</span>
          </div>
        </div>

        {/* Metric 2: 전체 라인 가동률 */}
        <div className="bg-white rounded-xl p-3.5 border border-emerald-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-[11px] font-bold">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              라인 가동률 (Availability)
            </span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-700">{lineSummary.lineAvailabilityRate}%</span>
          </div>
          <div className="w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, lineSummary.lineAvailabilityRate)}%` }}
            />
          </div>
        </div>

        {/* Metric 3: 전체 라인 성능률 (Mode 2 & Mode 3) */}
        {(metricMode === 'AVAILABILITY_PERFORMANCE' || metricMode === 'FULL_OEE') && (
          <div className="bg-white rounded-xl p-3.5 border border-blue-200 shadow-2xs space-y-1">
            <div className="flex justify-between items-center text-slate-500 text-[11px] font-bold">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                평균 성능률 (Performance)
              </span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-blue-700">{lineSummary.linePerformanceRate}%</span>
              <span className="text-[9px] text-slate-400">(상한 100%)</span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, lineSummary.linePerformanceRate)}%` }}
              />
            </div>
          </div>
        )}

        {/* Metric 4: 전체 라인 양품률 (Mode 3 ONLY) */}
        {metricMode === 'FULL_OEE' && (
          <div className="bg-white rounded-xl p-3.5 border border-purple-200 shadow-2xs space-y-1">
            <div className="flex justify-between items-center text-slate-500 text-[11px] font-bold">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                평균 양품률 (Quality)
              </span>
              <ShieldCheck className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex items-baseline gap-1">
              {lineSummary.lineQualityRate !== null ? (
                <span className="text-2xl font-black text-purple-700">{lineSummary.lineQualityRate}%</span>
              ) : (
                <span className="text-xs font-bold text-slate-400 italic py-1">검사 대기(표본 없음)</span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 flex justify-between">
              <span>확정 양품 {lineSummary.totalConfirmedGood}건</span>
              <span className="text-red-600">불량 {lineSummary.totalConfirmedDefect}건</span>
            </div>
          </div>
        )}

        {/* Metric 5: 통합 OEE (Mode 3 ONLY) */}
        {metricMode === 'FULL_OEE' && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3.5 border-2 border-amber-300 shadow-2xs space-y-1">
            <div className="flex justify-between items-center text-amber-900 text-[11px] font-black">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                라인 통합 OEE
              </span>
              <span className="text-[9px] bg-amber-200 text-amber-900 px-1 rounded font-bold">A × P × Q</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-800">
                {lineSummary.lineIntegratedOee !== null ? `${lineSummary.lineIntegratedOee}%` : '-'}
              </span>
            </div>
            <div className="text-[9px] text-amber-800/80 font-medium truncate">
              가동률 × 성능률 × 양품률 종합
            </div>
          </div>
        )}

        {/* Metric 6: 등록 작업자 현황 */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-[11px] font-bold">
            <span>승인 공정 담당자</span>
            <UserCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">{approvedOperators.length}명</span>
            <span className="text-[10px] text-blue-600 font-bold">(온라인 실시간)</span>
          </div>
          <div className="text-[10px] text-slate-400">
            가공 / 연마 / 품질 부서
          </div>
        </div>
      </div>

      {/* Equipment Linkage Info Note */}
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
        <span className="bg-blue-600 text-white p-1 rounded font-black shrink-0 text-[10px]">설비 연동</span>
        <p className="leading-relaxed">
          <strong className="font-extrabold text-blue-950">외주 공정(소재절단, 열처리, 소재각가공 등)</strong>은 외부 협력사 수행 항목으로 자사 공장 설비 가동 대상에서 제외되고 <span className="underline font-bold text-amber-800">(외주/협력사)</span>로 관리됩니다. 외주 공정이 완료되면 자사 가공/연마/품질 단계부터 지정된 <strong className="font-extrabold text-indigo-900">MCT 12호기 #1, 연마기, CMM 설비</strong>에 실시간 가동 현황이 연동·표시됩니다.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 3. MCT MACHINES GRID (10대)                                               */}
      {/* ========================================================================= */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-indigo-600" />
            <span>MCT 정밀 가공 설비 (총 10대 : 5호기-3대, 6.5호기-4대, 7.5호기-1대, 12호기-2대)</span>
          </h3>
          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
            가공 전용
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {MCT_MACHINES.map((mct, idx) => {
            const tasks = getTasksForMachine(mct);
            const completedCount = tasks.filter((t) => t.isCompleted).length;
            const activeTask = tasks.find((t) => !t.isCompleted);

            const taskWorkers = Array.from(new Set(tasks.map((t) => t.worker).filter(Boolean)));
            const defaultWorker = approvedOperators.length > 0 ? approvedOperators[idx % approvedOperators.length] : '미지정';
            const displayWorker = activeTask?.worker || (taskWorkers.length > 0 ? taskWorkers.join(', ') : defaultWorker);

            return (
              <div
                key={mct}
                className={`p-3 rounded-xl border transition shadow-2xs space-y-2 ${
                  activeTask
                    ? 'bg-white border-emerald-300 ring-2 ring-emerald-500/10'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {activeTask ? (
                      <span className="relative flex h-3 w-3 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full h-3 w-3 bg-slate-300 shrink-0"></span>
                    )}
                    <span className="font-black text-xs text-slate-900 truncate">{mct}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {activeTask ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        가동중
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        대기중
                      </span>
                    )}
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                      <UserCheck className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                      <span className="truncate max-w-[60px]">{displayWorker}</span>
                    </span>
                  </div>
                </div>

                {/* Active Job Info */}
                {activeTask ? (
                  <div className="space-y-1">
                    <span className="text-[10px] text-blue-600 font-bold block truncate">
                      [{activeTask.orderName}]
                    </span>
                    <span className="text-xs font-black text-slate-900 block truncate">
                      {activeTask.content}
                    </span>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                      <span className="text-slate-500">진행소요</span>
                      <span className="font-mono text-emerald-600 font-bold shrink-0">{activeTask.duration}h</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-center">
                    <span className="text-slate-400 text-[11px] font-bold block">
                      현재 대기중
                    </span>
                  </div>
                )}

                {/* Dynamic Metric Box */}
                {renderMachineMetricBox(mct)}

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500">
                  <span>할당: <strong className="text-slate-900">{tasks.length}건</strong></span>
                  <span className="text-emerald-700 font-bold">완료: {completedCount}건</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. GRINDER MACHINES GRID (9대)                                            */}
      {/* ========================================================================= */}
      <div className="space-y-2 pt-2">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <span>연마 설비 (총 9대 : 2M-4대, 3M-4대, 프로파일-1대)</span>
          </h3>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            연마/래핑 전용
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {GRINDER_MACHINES.map((mName, idx) => {
            const tasks = getTasksForMachine(mName);
            const completedCount = tasks.filter((t) => t.isCompleted).length;
            const activeTask = tasks.find((t) => !t.isCompleted);

            const taskWorkers = Array.from(new Set(tasks.map((t) => t.worker).filter(Boolean)));
            const defaultWorker = approvedOperators.length > 0 ? approvedOperators[(idx + MCT_MACHINES.length) % approvedOperators.length] : '미지정';
            const displayWorker = activeTask?.worker || (taskWorkers.length > 0 ? taskWorkers.join(', ') : defaultWorker);

            return (
              <div
                key={mName}
                className={`p-3 rounded-xl border transition shadow-2xs space-y-2 ${
                  activeTask
                    ? 'bg-white border-emerald-300 ring-2 ring-emerald-500/10'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {activeTask ? (
                      <span className="relative flex h-3 w-3 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full h-3 w-3 bg-slate-300 shrink-0"></span>
                    )}
                    <span className="font-black text-xs text-slate-900 truncate">{mName}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {activeTask ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        가동중
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        대기중
                      </span>
                    )}
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                      <UserCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-[60px]">{displayWorker}</span>
                    </span>
                  </div>
                </div>

                {activeTask ? (
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-700 font-bold block truncate">
                      [{activeTask.orderName}]
                    </span>
                    <span className="text-xs font-black text-slate-900 block truncate">
                      {activeTask.content}
                    </span>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                      <span className="text-slate-500">진행소요</span>
                      <span className="font-mono text-emerald-600 font-bold shrink-0">{activeTask.duration}h</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-center">
                    <span className="text-slate-400 text-[11px] font-bold block">
                      현재 대기중
                    </span>
                  </div>
                )}

                {/* Dynamic Metric Box */}
                {renderMachineMetricBox(mName)}

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500">
                  <span>할당: <strong className="text-slate-900">{tasks.length}건</strong></span>
                  <span className="text-emerald-700 font-bold">완료: {completedCount}건</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. CMM MACHINES GRID (2대)                                                */}
      {/* ========================================================================= */}
      <div className="space-y-2 pt-2">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-purple-600" />
            <span>3차원 측정기 / CMM 설비 (총 2대 : CMM 덕인-1대, Mitutoyo-1대)</span>
          </h3>
          <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
            품질/검사 전용
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CMM_MACHINES.map((cmm, idx) => {
            const tasks = getTasksForMachine(cmm);
            const completedCount = tasks.filter((t) => t.isCompleted).length;
            const activeTask = tasks.find((t) => !t.isCompleted);

            const taskWorkers = Array.from(new Set(tasks.map((t) => t.worker).filter(Boolean)));
            const defaultWorker = approvedOperators.length > 0 ? approvedOperators[(idx + MCT_MACHINES.length + GRINDER_MACHINES.length) % approvedOperators.length] : '미지정';
            const displayWorker = activeTask?.worker || (taskWorkers.length > 0 ? taskWorkers.join(', ') : defaultWorker);

            return (
              <div
                key={cmm}
                className={`p-3 rounded-xl border transition shadow-2xs space-y-2 ${
                  activeTask
                    ? 'bg-white border-purple-300 ring-2 ring-purple-500/10'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {activeTask ? (
                      <span className="relative flex h-3 w-3 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full h-3 w-3 bg-slate-300 shrink-0"></span>
                    )}
                    <span className="font-black text-xs text-slate-900 truncate">{cmm}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {activeTask ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        가동중
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        대기중
                      </span>
                    )}
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-purple-900 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200/60">
                      <UserCheck className="w-2.5 h-2.5 text-purple-600 shrink-0" />
                      <span className="truncate max-w-[60px]">{displayWorker}</span>
                    </span>
                  </div>
                </div>

                {activeTask ? (
                  <div className="space-y-1">
                    <span className="text-[10px] text-purple-700 font-bold block truncate">
                      [{activeTask.orderName}]
                    </span>
                    <span className="text-xs font-black text-slate-900 block truncate">
                      {activeTask.content}
                    </span>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                      <span className="text-slate-500">진행소요</span>
                      <span className="font-mono text-purple-600 font-bold shrink-0">{activeTask.duration}h</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-center">
                    <span className="text-slate-400 text-[11px] font-bold block">
                      현재 대기중
                    </span>
                  </div>
                )}

                {/* Dynamic Metric Box */}
                {renderMachineMetricBox(cmm)}

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500">
                  <span>할당: <strong className="text-slate-900">{tasks.length}건</strong></span>
                  <span className="text-purple-700 font-bold">완료: {completedCount}건</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. REGISTERED OPERATORS ROSTER GRID                                       */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 pt-3">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>등록 승인 공정 담당자 실시간 접속 & 작업 현황 ({approvedOperators.length}명)</span>
          </h3>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              접속중 (Online)
            </span>
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
              미접속/대기
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2">
          {approvedOperators.length === 0 ? (
            <div className="col-span-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400 font-bold">
              가입 승인된 현장담당자가 없습니다. (회원가입 후 관리자 승인이 필요합니다)
            </div>
          ) : (
            approvedOperators.map((w) => {
              const baseName = getBaseWorkerName(w);
              const userRecord = usersList.find(
                (u) => getBaseWorkerName(u.name) === baseName
              );

              const currentDept = userRecord?.department;
              const deptSuffix = getDepartmentSuffix(currentDept, userRecord);
              const displayName = deptSuffix ? `${baseName} ${deptSuffix}` : (w || baseName);

              const allTasks = items && items.length > 0 ? items : (scheduledTasks || []);
              const workerTasks = allTasks.filter((i) => {
                const itemWorkerBase = getBaseWorkerName(i.worker);
                return Boolean(itemWorkerBase && itemWorkerBase === baseName);
              });
              const active = workerTasks.filter((i) => !i.isCompleted);

              const isSelf = getBaseWorkerName(currentUser?.name) === baseName ||
                Boolean(userRecord && currentUser?.email && userRecord.email?.toLowerCase() === currentUser.email.toLowerCase());

              const PRESENCE_TIMEOUT_MS = 5 * 60 * 1000;
              const now = Date.now();
              const lastActivityIso = userRecord?.lastSeenAt || userRecord?.loginAt;
              const lastActivityTime = lastActivityIso ? new Date(lastActivityIso).getTime() : 0;
              const isRecent = lastActivityTime > 0 && (now - lastActivityTime) < PRESENCE_TIMEOUT_MS;
              const isLoggedOut = Boolean(
                userRecord?.logoutAt &&
                new Date(userRecord.logoutAt).getTime() >= lastActivityTime
              );

              const isOnline = Boolean(
                isSelf ||
                (userRecord?.isOnline === true && isRecent && !isLoggedOut)
              );

              return (
                <div
                  key={w}
                  className={`p-2.5 rounded-xl border transition flex flex-col justify-between gap-1.5 relative overflow-hidden ${
                    isOnline
                      ? 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-400/50 dark:border-emerald-600/60 ring-1 ring-emerald-500/30 text-slate-900 dark:text-slate-100'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="relative flex items-center justify-center pb-1 text-center w-full min-w-0 min-h-[22px]">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center pl-0.5">
                      {isOnline ? (
                        <span className="relative flex h-2.5 w-2.5 shrink-0" title={isSelf ? '접속중 (본인)' : '접속중'}>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" title="미접속/대기"></span>
                      )}
                    </div>
                    <span className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm whitespace-nowrap truncate text-center px-3" title={displayName}>
                      {displayName} {isSelf && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">(나)</span>}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">진행공정</span>
                    <strong className={active.length > 0 ? 'text-blue-600 dark:text-blue-400 font-black' : 'text-slate-600 dark:text-slate-400 font-bold'}>
                      {active.length}건
                    </strong>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. PLC IOT BRIDGE CONTROLLER MODAL (Step 4)                               */}
      {/* ========================================================================= */}
      {isPlcBridgeOpen && (
        <PlcBridgeModal
          isOpen={isPlcBridgeOpen}
          onClose={() => setIsPlcBridgeOpen(false)}
          onTriggerPlcCycleStart={handleTriggerPlcCycleStart}
        />
      )}
    </div>
  );
};
