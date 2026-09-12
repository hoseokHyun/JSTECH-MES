import React, { useMemo } from 'react';
import { ProductType, ProcessStep, ProcessCategory } from '../../types';
import {
  GitMerge,
  Clock,
  Layers,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tag,
  Split,
  Workflow,
  Zap,
  TrendingUp
} from 'lucide-react';
import {
  parseComponentTag,
  getTrackColor,
  getComponentParts,
  isAssemblyTag
} from '../../utils/trackDependencyHelper';

interface RoutingSwimlaneViewProps {
  productType: ProductType;
  onSelectStep?: (index: number) => void;
}

interface TrackStepInfo {
  step: ProcessStep;
  originalIndex: number;
}

interface ComponentTrack {
  tag: string;
  steps: TrackStepInfo[];
  totalHours: number;
  isBottleneck: boolean;
}

export const RoutingSwimlaneView: React.FC<RoutingSwimlaneViewProps> = ({
  productType,
  onSelectStep
}) => {
  const {
    singleTracks,
    assemblySteps,
    finalSteps,
    maxTrackHours,
    bottleneckTrackName,
    totalSequentialHours,
    estimatedCriticalPathHours
  } = useMemo(() => {
    const processes = productType.processes;
    const totalSeq = processes.reduce((sum, p) => sum + (p.durationHours || 0), 0);

    const trackMap = new Map<string, TrackStepInfo[]>();
    const assemblies: TrackStepInfo[] = [];
    const finals: TrackStepInfo[] = [];

    // Track state to identify post-assembly
    let reachedAssembly = false;

    processes.forEach((step, idx) => {
      const tag = step.componentTag || parseComponentTag(step.name, '', '');
      const item: TrackStepInfo = { step, originalIndex: idx };

      if (isAssemblyTag(tag) || step.name.includes('용접') || step.name.includes('조립')) {
        reachedAssembly = true;
        assemblies.push(item);
      } else if (reachedAssembly && (!tag || tag === '공통' || tag === 'Default')) {
        finals.push(item);
      } else if (tag && !tag.includes('+')) {
        const existing = trackMap.get(tag) || [];
        existing.push(item);
        trackMap.set(tag, existing);
      } else if (reachedAssembly) {
        assemblies.push(item);
      } else {
        // Untagged pre-assembly step -> Put in General / Common track
        const commonTag = '공통';
        const existing = trackMap.get(commonTag) || [];
        existing.push(item);
        trackMap.set(commonTag, existing);
      }
    });

    const tracksList: ComponentTrack[] = [];
    let maxHours = 0;
    let bTrack = '';

    trackMap.forEach((steps, tag) => {
      const totalH = steps.reduce((sum, s) => sum + (s.step.durationHours || 0), 0);
      if (totalH > maxHours) {
        maxHours = totalH;
        bTrack = tag;
      }
      tracksList.push({
        tag,
        steps,
        totalHours: totalH,
        isBottleneck: false
      });
    });

    tracksList.forEach((t) => {
      if (t.tag === bTrack && maxHours > 0) {
        t.isBottleneck = true;
      }
    });

    // Sort tracks alphabetically or by known order (Base, Head, Block, Pipe)
    const priorityOrder = ['Base', 'Head', 'Block', 'Pipe', '공통'];
    tracksList.sort((a, b) => {
      const aIdx = priorityOrder.indexOf(a.tag);
      const bIdx = priorityOrder.indexOf(b.tag);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.tag.localeCompare(b.tag);
    });

    const assemblyTotal = assemblies.reduce((sum, s) => sum + (s.step.durationHours || 0), 0);
    const finalTotal = finals.reduce((sum, s) => sum + (s.step.durationHours || 0), 0);
    const critPathHours = maxHours + assemblyTotal + finalTotal;

    return {
      singleTracks: tracksList,
      assemblySteps: assemblies,
      finalSteps: finals,
      maxTrackHours: maxHours,
      bottleneckTrackName: bTrack,
      totalSequentialHours: totalSeq,
      estimatedCriticalPathHours: critPathHours
    };
  }, [productType]);

  const hasTracks = singleTracks.length > 0;
  const timeSaved = Math.max(0, totalSequentialHours - estimatedCriticalPathHours);

  const getCategoryBadgeClass = (category: ProcessCategory) => {
    switch (category) {
      case '가공':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case '연마':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case '외주':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case '품질':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Critical Path & Parallel Track Metric Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  부품별 병렬 공정 & 조립 합류 흐름도
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                  DAG Directed Graph
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                단품 부품(Base, Head, Block, Pipe)들이 독립적으로 동시 가공되며, 조립(용접) 시점에 하나로 합류합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block text-[10px] font-bold">병렬 가공 트랙 수</span>
              <span className="text-base font-black text-white font-mono">{singleTracks.length}개 부품 트랙</span>
            </div>
            <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block text-[10px] font-bold">조립 전 임계경로(Critical Path)</span>
              <span className="text-base font-black text-amber-300 font-mono">
                {bottleneckTrackName ? `${bottleneckTrackName} (${maxTrackHours.toFixed(1)}h)` : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Lead time comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/40">
            <span className="text-[11px] text-slate-400 block font-medium">기존 단일 순차 계산 (Flat Sum)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-slate-300 font-mono">{totalSequentialHours.toFixed(1)}</span>
              <span className="text-xs text-slate-400 font-bold">시간</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">모든 공정을 1열 직렬로 작업할 때 소요시간</p>
          </div>

          <div className="bg-indigo-950/60 rounded-xl p-3 border border-indigo-700/50">
            <span className="text-[11px] text-indigo-300 block font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              병렬 스케줄링 임계경로 시간 (Critical Path)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-amber-300 font-mono">
                {estimatedCriticalPathHours.toFixed(1)}
              </span>
              <span className="text-xs text-amber-200/80 font-bold">시간</span>
            </div>
            <p className="text-[10px] text-indigo-300/80 mt-1">
              가장 긴 부품 트랙({bottleneckTrackName}) + 조립/후공정 누적 소요시간
            </p>
          </div>

          <div className="bg-emerald-950/50 rounded-xl p-3 border border-emerald-700/40">
            <span className="text-[11px] text-emerald-300 block font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              병렬 동시 가공으로 단축되는 리드타임
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-emerald-400 font-mono">
                약 {timeSaved.toFixed(1)}
              </span>
              <span className="text-xs text-emerald-300/80 font-bold">시간 단축</span>
            </div>
            <p className="text-[10px] text-emerald-400/70 mt-1">
              독립 부품들을 병렬 설비에서 동시 가공함에 따른 납기 단축 효과
            </p>
          </div>
        </div>
      </div>

      {/* 2. Process Flow Diagram Columns (Independent Parallel Component Tracks) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Split className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-extrabold text-slate-900">
              1단계: 단품 부품별 독립 병렬 가공 트랙 (Parallel Tracks)
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            수주 시작 시점부터 각 트랙이 서로 간섭 없이 독립적으로 동시 가공됩니다.
          </span>
        </div>

        {hasTracks ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {singleTracks.map((track) => {
              const color = getTrackColor(track.tag);

              return (
                <div
                  key={track.tag}
                  className={`bg-white rounded-2xl border ${
                    track.isBottleneck ? 'border-amber-400 shadow-md ring-2 ring-amber-300/30' : 'border-slate-200 shadow-2xs'
                  } overflow-hidden flex flex-col`}
                >
                  {/* Track Header */}
                  <div className={`p-3.5 border-b ${track.isBottleneck ? 'bg-amber-50/80 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`whitespace-nowrap inline-flex items-center shrink-0 text-xs font-black px-2.5 py-1 rounded-lg border ${color.badge}`}>
                          [{track.tag}] 트랙
                        </span>
                        {track.isBottleneck && (
                          <span className="whitespace-nowrap inline-flex items-center text-[10px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded shadow-2xs animate-pulse">
                            🔥 Critical Path
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs font-black text-slate-700 whitespace-nowrap">
                        {track.totalHours.toFixed(1)}h
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>총 {track.steps.length}개 공정</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        병렬 시작 가능
                      </span>
                    </div>
                  </div>

                  {/* Track Steps List */}
                  <div className="p-3 space-y-2 bg-slate-50/40">
                    {track.steps.map((item, sIdx) => {
                      const isLast = sIdx === track.steps.length - 1;

                      return (
                        <React.Fragment key={item.originalIndex}>
                          <div
                            onClick={() => onSelectStep?.(item.originalIndex)}
                            className="bg-white p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition cursor-pointer group"
                          >
                            <div className="flex items-center justify-between gap-1.5 mb-1">
                              <span className="font-mono text-[10px] font-bold text-slate-400">
                                #{item.originalIndex + 1}
                              </span>
                              <span
                                className={`whitespace-nowrap text-[9px] font-black px-1.5 py-0.2 rounded border ${getCategoryBadgeClass(
                                  item.step.category
                                )}`}
                              >
                                {item.step.category === '품질' ? 'CMM' : item.step.category}
                              </span>
                            </div>

                            <p className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-600 transition truncate">
                              {item.step.name}
                            </p>

                            <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                              <span className="font-medium">표준 소요</span>
                              <span className="font-mono font-bold text-indigo-700">
                                {item.step.durationHours}시간
                              </span>
                            </div>
                          </div>

                          {!isLast && (
                            <div className="flex justify-center py-0.5">
                              <ArrowDown className="w-3.5 h-3.5 text-slate-300" />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}

                    {/* Track Completion Milestone Marker */}
                    <div className="mt-3 pt-2 border-t-2 border-dashed border-slate-300 text-center">
                      <div className="whitespace-nowrap inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>[{track.tag}] 가공 완료 시 조립 대기</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500 space-y-2">
            <Tag className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              아직 공정에 부품 트랙 태그(Base, Head, Block, Pipe 등)가 설정되지 않았습니다.
            </p>
            <p className="text-[11px] text-slate-500">
              상단의 "공정명에서 부품 트랙 자동 감지" 버튼을 누르거나, 테이블에서 각 공정의 부품 트랙을 지정하세요.
            </p>
          </div>
        )}
      </div>

      {/* 3. Assembly & Merge Convergence Section */}
      {assemblySteps.length > 0 && (
        <div className="space-y-3">
          {/* Visual Convergence Arrow Banner */}
          <div className="flex flex-col items-center justify-center py-2 text-center">
            <div className="w-full border-t border-indigo-200 relative mb-4">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-black px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                <GitMerge className="w-3.5 h-3.5 text-indigo-600" />
                <span>독립 부품 트랙 완료 후 조립 합류 지점 (Convergence Junction)</span>
              </span>
            </div>
            <ArrowDown className="w-6 h-6 text-indigo-500 animate-bounce" />
          </div>

          <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitMerge className="w-4 h-4 text-indigo-700" />
                <h4 className="text-sm font-extrabold text-indigo-950">
                  2단계: 조립 및 합류 공정 (Assembly & Downstream Phase)
                </h4>
              </div>
              <span className="text-xs text-indigo-700 font-bold">
                선행 지정 부품들의 가공이 모두 완료되어야 현장에서 작업 시작이 활성화됩니다.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {assemblySteps.map((item, aIdx) => {
                const tag = item.step.componentTag || parseComponentTag(item.step.name, '', '');
                const parts = getComponentParts(tag);
                const color = getTrackColor(tag);

                return (
                  <div
                    key={item.originalIndex}
                    onClick={() => onSelectStep?.(item.originalIndex)}
                    className="bg-white rounded-xl p-3.5 border border-indigo-200 hover:border-indigo-400 hover:shadow-xs transition cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        #{item.originalIndex + 1}
                      </span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${getCategoryBadgeClass(
                          item.step.category
                        )}`}
                      >
                        {item.step.category}
                      </span>
                    </div>

                    <p className="text-xs font-black text-slate-900 truncate">
                      {item.step.name}
                    </p>

                    {/* Pre-requisite Components Tag Highlight */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 space-y-1">
                      <span className="text-[10px] font-bold text-amber-800 block">
                        🔗 필수 선행 부품 (합류 조건):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {parts.length > 0 ? (
                          parts.map((p) => (
                            <span
                              key={p}
                              className="text-[10px] font-black bg-white text-slate-800 border border-amber-300 px-1.5 py-0.5 rounded shadow-2xs"
                            >
                              ✓ [{p}] 완료 필수
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700">
                            모든 선행 부품 트랙 완료 필요
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>소요시간</span>
                      <span className="font-mono font-bold text-indigo-700">
                        {item.step.durationHours}시간
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Final Common Phase (Inspection, Cleaning, Packing, Shipping) */}
      {finalSteps.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-extrabold text-slate-900">
              3단계: 최종 품질 검사 및 출하 (Final Quality & Outgoing)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {finalSteps.map((item) => (
              <div
                key={item.originalIndex}
                onClick={() => onSelectStep?.(item.originalIndex)}
                className="bg-white rounded-xl p-3 border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-slate-400">
                    #{item.originalIndex + 1}
                  </span>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${getCategoryBadgeClass(
                      item.step.category
                    )}`}
                  >
                    {item.step.category}
                  </span>
                </div>
                <p className="text-xs font-extrabold text-slate-900 truncate">{item.step.name}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>소요시간</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {item.step.durationHours}시간
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
