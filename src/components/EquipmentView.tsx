import React from 'react';
import { ScheduledTaskItem, Order, User } from '../types';
import { MCT_MACHINES, GRINDER_MACHINES, CMM_MACHINES } from '../data/defaultData';
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
  Wifi
} from 'lucide-react';

interface EquipmentViewProps {
  items: ScheduledTaskItem[];
  orders: Record<string, Order>;
  approvedOperators?: string[];
  currentUser?: User | null;
  usersList?: User[];
}

export const EquipmentView: React.FC<EquipmentViewProps> = ({
  items,
  orders,
  approvedOperators = [],
  currentUser,
  usersList = []
}) => {
  // Map Machines to allocated tasks
  const getTasksForMachine = (mName: string) => items.filter((i) => i.machine === mName);

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md border border-slate-800 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>전체 생산 설비 & 공정 담당자 모니터링 (Equipment & Personnel OEE)</span>
            </h2>
            <p className="text-xs text-slate-400">
              준성테크 정밀 설비 총 21대 (MCT 10대, 연마기 9대, CMM 2대) 및 사이트 승인 공정 담당자의 실시간 가동 현황입니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-lg">
            ⚡ MCT 10대 / 연마기 9대 / CMM 2대
          </span>
          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-lg">
            👥 등록 공정 담당자 {approvedOperators.length}명
          </span>
        </div>
      </div>

      {/* Equipment Linkage Info Note */}
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
        <span className="bg-blue-600 text-white p-1 rounded font-black shrink-0 text-[10px]">설비 연동</span>
        <p className="leading-relaxed">
          <strong className="font-extrabold text-blue-950">외주 공정(소재절단, 열처리, 소재각가공 등)</strong>은 외부 협력사 수행 항목으로 자사 공장 설비 가동 대상에서 제외되고 <span className="underline font-bold text-amber-800">(외주/협력사)</span>로 관리됩니다. 외주 공정이 완료되면 자사 가공/연마/품질 단계부터 지정된 <strong className="font-extrabold text-indigo-900">MCT 12호기 #1, 연마기, CMM 설비</strong>에 실시간 가동 현황이 연동·표시됩니다.
        </p>
      </div>

      {/* 1. MCT Machines Grid (10대) */}
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
                      <span className="inline-flex rounded-full h-3 w-3 bg-red-500 shrink-0"></span>
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
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
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

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500">
                  <span>할당: <strong className="text-slate-900">{tasks.length}건</strong></span>
                  <span className="text-emerald-700 font-bold">완료: {completedCount}건</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Grinder Machines Grid (9대) */}
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
                      <span className="inline-flex rounded-full h-3 w-3 bg-red-500 shrink-0"></span>
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
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
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

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500">
                  <span>할당: <strong className="text-slate-900">{tasks.length}건</strong></span>
                  <span className="text-emerald-700 font-bold">완료: {completedCount}건</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. CMM Machines Grid (2대) */}
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
                      <span className="inline-flex rounded-full h-3 w-3 bg-red-500 shrink-0"></span>
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
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
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

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500">
                  <span>할당: <strong className="text-slate-900">{tasks.length}건</strong></span>
                  <span className="text-purple-700 font-bold">완료: {completedCount}건</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Workers Roster Grid */}
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
              const workerTasks = items.filter((i) => i.worker === w);
              const active = workerTasks.filter((i) => !i.isCompleted);
              const isSelf = currentUser?.name === w;
              const userRecord = usersList.find((u) => u.name === w);
              // Online status: Approved field operators registered in system are online
              const isOnline = isSelf || active.length > 0 || (userRecord ? userRecord.isApproved : true);

              return (
                <div
                  key={w}
                  className={`p-2.5 rounded-xl border transition flex flex-col justify-between gap-1.5 relative overflow-hidden ${
                    isOnline
                      ? 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-400/50 dark:border-emerald-600/60 ring-1 ring-emerald-500/30 text-slate-900 dark:text-slate-100'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 pb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isOnline ? (
                        <span className="relative flex h-2.5 w-2.5 shrink-0" title={isSelf ? '접속중 (본인)' : '접속중'}>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" title="미접속/대기"></span>
                      )}
                      <span className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm whitespace-nowrap" title={w}>
                        {w} {isSelf && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">(나)</span>}
                      </span>
                    </div>
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
    </div>
  );
};
