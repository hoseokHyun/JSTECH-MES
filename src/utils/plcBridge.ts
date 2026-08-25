/**
 * PLC IoT Bridge Service & MC Protocol / FANUC FOCAS Simulator
 * Connects floor CNC/MCT/Grinding machines with Smart MES via REST / Webhook
 */

export interface PlcMachineStatus {
  machineId: string;
  machineName: string;
  protocol: 'MC_PROTOCOL_FX3U' | 'FANUC_FOCAS' | 'MODBUS_TCP';
  ipAddress: string;
  port: number;
  registerM100: boolean; // Rising edge trigger for cycle start
  spindleRpm: number;
  feedRate: number;
  cycleTimeSeconds: number;
  alarmCode: number;
  isConnected: boolean;
  lastHeartbeat: string;
}

export const DEFAULT_PLC_MACHINES: PlcMachineStatus[] = [
  {
    machineId: 'MCT-01',
    machineName: 'MCT 1호기 (남선)',
    protocol: 'FANUC_FOCAS',
    ipAddress: '192.168.1.101',
    port: 8193,
    registerM100: false,
    spindleRpm: 8500,
    feedRate: 1200,
    cycleTimeSeconds: 450,
    alarmCode: 0,
    isConnected: true,
    lastHeartbeat: new Date().toISOString(),
  },
  {
    machineId: 'GRINDER-01',
    machineName: '평면 연마 1호기 (기흥)',
    protocol: 'MC_PROTOCOL_FX3U',
    ipAddress: '192.168.1.121',
    port: 5000,
    registerM100: false,
    spindleRpm: 3200,
    feedRate: 400,
    cycleTimeSeconds: 1200,
    alarmCode: 0,
    isConnected: true,
    lastHeartbeat: new Date().toISOString(),
  },
  {
    machineId: 'GRINDER-02',
    machineName: '원통 연마 2호기 (오카모토)',
    protocol: 'MC_PROTOCOL_FX3U',
    ipAddress: '192.168.1.122',
    port: 5000,
    registerM100: false,
    spindleRpm: 2800,
    feedRate: 350,
    cycleTimeSeconds: 900,
    alarmCode: 0,
    isConnected: true,
    lastHeartbeat: new Date().toISOString(),
  },
  {
    machineId: 'MCT-02',
    machineName: 'MCT 2호기 (두산)',
    protocol: 'FANUC_FOCAS',
    ipAddress: '192.168.1.102',
    port: 8193,
    registerM100: false,
    spindleRpm: 0,
    feedRate: 0,
    cycleTimeSeconds: 0,
    alarmCode: 0,
    isConnected: true,
    lastHeartbeat: new Date().toISOString(),
  },
];

/**
 * Python Edge Agent Deployment Script Snippet
 */
export const PYTHON_PLC_AGENT_CODE = `"""
JST Smart MES - Python Edge PLC Agent
Supports Mitsubishi FX3U (pymcprotocol) & FANUC FOCAS CNC
"""
import time
import requests
import pymcprotocol

MES_API_ENDPOINT = "https://your-mes-domain.com/api/plc/heartbeat"
PLC_IP = "192.168.1.121"
PLC_PORT = 5000

def run_plc_bridge():
    pymc = pymcprotocol.Type3E()
    pymc.connect(PLC_IP, PLC_PORT)
    print(f"[*] Connected to Mitsubishi FX3U PLC at {PLC_IP}:{PLC_PORT}")
    
    last_m100 = 0
    while True:
        try:
            # Read Bit Register M100 (Cycle Start Trigger)
            m100_val = pymc.batchread_bitunits(headdevice="M100", readsize=1)[0]
            
            # Rising Edge Detection (0 -> 1)
            if m100_val == 1 and last_m100 == 0:
                print("[!] Cycle Start Rising Edge Detected on M100! Dispatching MES API...")
                requests.post(MES_API_ENDPOINT, json={
                    "machine_id": "GRINDER-01",
                    "event": "CYCLE_START",
                    "timestamp": time.time()
                }, timeout=3)
            
            last_m100 = m100_val
            time.sleep(0.5)
        except Exception as e:
            print(f"[x] PLC Polling Error: {e}")
            time.sleep(2)

if __name__ == "__main__":
    run_plc_bridge()
`;
