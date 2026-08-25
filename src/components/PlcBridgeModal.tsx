import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Cpu,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Copy,
  Code2,
  RefreshCw,
  Radio,
  Wifi,
  Server
} from 'lucide-react';
import {
  PlcMachineStatus,
  DEFAULT_PLC_MACHINES,
  PYTHON_PLC_AGENT_CODE
} from '../utils/plcBridge';

interface PlcBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerPlcCycleStart?: (machineId: string, machineName: string) => void;
}

export const PlcBridgeModal: React.FC<PlcBridgeModalProps> = ({
  isOpen,
  onClose,
  onTriggerPlcCycleStart,
}) => {
  const [machines, setMachines] = useState<PlcMachineStatus[]>(DEFAULT_PLC_MACHINES);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'MONITOR' | 'PYTHON_CODE'>('MONITOR');
  const [lastEventMessage, setLastEventMessage] = useState<string | null>(null);

  // Live polling simulator (updates heartbeat every 2 seconds)
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setMachines((prev) =>
        prev.map((m) => ({
          ...m,
          lastHeartbeat: new Date().toISOString(),
          spindleRpm: m.isConnected
            ? Math.max(0, m.spindleRpm + Math.floor((Math.random() - 0.5) * 100))
            : 0,
        }))
      );
    }, 2500);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulateRisingEdge = (m: PlcMachineStatus) => {
    // Pulse M100 bit register
    setMachines((prev) =>
      prev.map((item) =>
        item.machineId === m.machineId ? { ...item, registerM100: true } : item
      )
    );

    const timeStr = new Date().toLocaleTimeString();
    setLastEventMessage(
      `[${timeStr}] ⚡ PLC Rising Edge (M100: 0 → 1) 감지! [${m.machineName}] 자동 가공 시작(IN_PROGRESS) 신호 전송 완료.`
    );

    if (onTriggerPlcCycleStart) {
      onTriggerPlcCycleStart(m.machineId, m.machineName);
    }

    setTimeout(() => {
      setMachines((prev) =>
        prev.map((item) =>
          item.machineId === m.machineId ? { ...item, registerM100: false } : item
        )
      );
    }, 1200);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PYTHON_PLC_AGENT_CODE);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs select-none">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">
                  로컬 에이전트 브리지 PLC/IoT 연동 제어기
                </h2>
                <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> LIVE ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mitsubishi FX3U (pymcprotocol M100) 및 FANUC FOCAS CNC의 실시간 가공 신호를 MES에 자동 연동합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="bg-slate-100 px-5 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('MONITOR')}
              className={`px-3 py-1.5 rounded-lg font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'MONITOR'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>실시간 설비 레지스터 모니터 ({machines.length}대)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PYTHON_CODE')}
              className={`px-3 py-1.5 rounded-lg font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'PYTHON_CODE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Python 엣지 브리지 소스코드 (pymcprotocol)</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-50 space-y-4">
          {lastEventMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600 animate-pulse" />
                <span>{lastEventMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setLastEventMessage(null)}
                className="text-blue-500 hover:text-blue-700 text-xs font-black cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {activeTab === 'MONITOR' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {machines.map((m) => (
                <div
                  key={m.machineId}
                  className={`bg-white border rounded-2xl p-4 shadow-sm space-y-3 transition ${
                    m.registerM100
                      ? 'border-blue-500 ring-4 ring-blue-400/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-900">
                          {m.machineName}
                        </h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                          {m.machineId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                        <span>IP: {m.ipAddress}:{m.port}</span>
                        <span>•</span>
                        <span className="font-bold text-blue-700">{m.protocol}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        m.isConnected
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      연결됨
                    </span>
                  </div>

                  {/* Registers & Status Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">M100 (가공신호)</span>
                      <span
                        className={`font-mono font-black text-sm ${
                          m.registerM100 ? 'text-blue-600 animate-pulse' : 'text-slate-400'
                        }`}
                      >
                        {m.registerM100 ? '1 (HIGH)' : '0 (LOW)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">스핀들 회전수</span>
                      <span className="font-mono font-black text-slate-800 text-sm">
                        {m.spindleRpm} RPM
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">이송 속도</span>
                      <span className="font-mono font-black text-slate-800 text-sm">
                        {m.feedRate} mm/min
                      </span>
                    </div>
                  </div>

                  {/* Manual Rising Edge Simulation Trigger */}
                  <button
                    type="button"
                    onClick={() => handleSimulateRisingEdge(m)}
                    className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-xs"
                  >
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Rising Edge (M100: 0 → 1) 가공 트리거 테스트</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'PYTHON_CODE' && (
            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl shadow-inner font-mono text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 text-xs font-bold">
                  📁 plc_edge_bridge.py (산업용 PC 배포 스크립트)
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isCopied ? '복사 완료!' : '스크립트 전체 복사'}</span>
                </button>
              </div>
              <pre className="overflow-x-auto text-[11px] leading-relaxed text-emerald-400 p-2 bg-black/40 rounded-xl">
                {PYTHON_PLC_AGENT_CODE}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
