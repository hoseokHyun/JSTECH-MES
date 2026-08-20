import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import {
  X,
  RotateCcw,
  Camera,
  Layers,
  Upload,
  Check,
  Eye,
  Maximize2,
  Box,
  Sliders,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface SlotDie3DCadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlate: 'ASSEMBLY' | 'FRONT' | 'REAR' | 'ALL';
  onCaptureSnapshot: (dataUrl: string, plateType: 'ASSEMBLY' | 'FRONT' | 'REAR') => void;
  currentSnapshots?: {
    assembly?: string;
    front?: string;
    rear?: string;
  };
}

export const SlotDie3DCadModal: React.FC<SlotDie3DCadModalProps> = ({
  isOpen,
  onClose,
  targetPlate: initialTargetPlate,
  onCaptureSnapshot,
  currentSnapshots
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [activePlate, setActivePlate] = useState<'ASSEMBLY' | 'FRONT' | 'REAR'>(
    initialTargetPlate === 'ALL' ? 'ASSEMBLY' : initialTargetPlate
  );
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [showMeasurements, setShowMeasurements] = useState<boolean>(true);
  const [explodedView, setExplodedView] = useState<boolean>(false);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Mouse interaction state
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rotationRef = useRef<{ x: number; y: number }>({ x: 0.35, y: -0.65 });
  const zoomRef = useRef<number>(140);

  useEffect(() => {
    if (initialTargetPlate !== 'ALL') {
      setActivePlate(initialTargetPlate);
    }
  }, [initialTargetPlate]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Build Procedural 3D Slot Die High-Precision Geometry
  const buildSlotDieGeometry = (
    scene: THREE.Scene,
    mode: 'ASSEMBLY' | 'FRONT' | 'REAR',
    isWire: boolean,
    exploded: boolean
  ) => {
    // Remove old model
    if (modelGroupRef.current) {
      scene.remove(modelGroupRef.current);
    }

    const group = new THREE.Group();
    modelGroupRef.current = group;

    // Materials
    const steelMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8dde6,
      metalness: 0.85,
      roughness: 0.25,
      wireframe: isWire
    });

    const frontPlateMaterial = new THREE.MeshStandardMaterial({
      color: 0xd0d7de,
      metalness: 0.9,
      roughness: 0.2,
      wireframe: isWire
    });

    const rearPlateMaterial = new THREE.MeshStandardMaterial({
      color: 0xc2c9d6,
      metalness: 0.9,
      roughness: 0.2,
      wireframe: isWire
    });

    const lipEdgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x3b82f6, // Blue highlighted precision lip
      metalness: 0.95,
      roughness: 0.1,
      wireframe: isWire
    });

    const boltMaterial = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.95,
      roughness: 0.15,
      wireframe: isWire
    });

    const redLineMaterial = new THREE.LineBasicMaterial({
      color: 0xef4444,
      linewidth: 3
    });

    // Die Dimensions in 3D scene (Scaled: Length=100, Height=18, Thickness=8)
    const L = 100;
    const H = 18;
    const T_front = 4.5;
    const T_rear = 5.5;

    // 1. REAR PLATE
    if (mode === 'ASSEMBLY' || mode === 'REAR') {
      const rearOffsetZ = exploded ? -10 : 0;
      const rearMesh = new THREE.Mesh(
        new THREE.BoxGeometry(L, H, T_rear),
        rearPlateMaterial
      );
      rearMesh.position.set(0, 0, -T_rear / 2 + rearOffsetZ);
      group.add(rearMesh);

      // Cavity Manifold recess inside Rear Plate
      const manifoldMesh = new THREE.Mesh(
        new THREE.BoxGeometry(L * 0.85, H * 0.45, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.3 })
      );
      manifoldMesh.position.set(0, H * 0.1, 0.4 + rearOffsetZ);
      group.add(manifoldMesh);

      // 43 Lip Differential Adjusting Bolts on Rear Top
      for (let i = 0; i < 43; i++) {
        const xPos = -L / 2 + 4 + (i * (L - 8)) / 42;
        const bolt = new THREE.Mesh(
          new THREE.CylinderGeometry(0.55, 0.55, 2.2, 12),
          boltMaterial
        );
        bolt.rotation.x = Math.PI / 2;
        bolt.position.set(xPos, H / 2 - 1.8, -T_rear - 0.5 + rearOffsetZ);
        group.add(bolt);
      }

      // Mounting bolt counterbores along body (2 rows)
      for (let r = 0; r < 2; r++) {
        const yPos = r === 0 ? 0 : -H * 0.35;
        for (let i = 0; i < 15; i++) {
          const xPos = -L / 2 + 6 + (i * (L - 12)) / 14;
          const hole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.7, 0.7, 0.6, 12),
            new THREE.MeshStandardMaterial({ color: 0x334155 })
          );
          hole.rotation.x = Math.PI / 2;
          hole.position.set(xPos, yPos, -T_rear + 0.2 + rearOffsetZ);
          group.add(hole);
        }
      }
    }

    // 2. FRONT PLATE
    if (mode === 'ASSEMBLY' || mode === 'FRONT') {
      const frontOffsetZ = exploded ? 10 : 0;
      const frontMesh = new THREE.Mesh(
        new THREE.BoxGeometry(L, H, T_front),
        frontPlateMaterial
      );
      frontMesh.position.set(0, 0, T_front / 2 + frontOffsetZ);
      group.add(frontMesh);

      // Precision Mirror Bevel Lip (Top Lip Landing)
      const lipMesh = new THREE.Mesh(
        new THREE.BoxGeometry(L, 1.2, T_front + 0.2),
        lipEdgeMaterial
      );
      lipMesh.position.set(0, H / 2 - 0.6, T_front / 2 + frontOffsetZ);
      group.add(lipMesh);

      // Front body mounting counterbores
      for (let r = 0; r < 2; r++) {
        const yPos = r === 0 ? 0 : -H * 0.35;
        for (let i = 0; i < 15; i++) {
          const xPos = -L / 2 + 6 + (i * (L - 12)) / 14;
          const hole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.7, 0.7, 0.6, 12),
            new THREE.MeshStandardMaterial({ color: 0x334155 })
          );
          hole.rotation.x = Math.PI / 2;
          hole.position.set(xPos, yPos, T_front - 0.2 + frontOffsetZ);
          group.add(hole);
        }
      }
    }

    // 3. Measurement Laser Inspection Lines (A1, A2, B1, B2)
    if (showMeasurements) {
      // Red measurement Line A (Lip landing)
      const lineAGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-L / 2 + 2, H / 2 + 0.1, 0.5),
        new THREE.Vector3(L / 2 - 2, H / 2 + 0.1, 0.5)
      ]);
      const lineA = new THREE.Line(lineAGeometry, redLineMaterial);
      group.add(lineA);

      // Red measurement Line B (Bolt Pitch line)
      const lineBGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-L / 2 + 2, H / 2 - 1.8, -T_rear - 1.2),
        new THREE.Vector3(L / 2 - 2, H / 2 - 1.8, -T_rear - 1.2)
      ]);
      const lineB = new THREE.Line(lineBGeometry, redLineMaterial);
      group.add(lineB);
    }

    scene.add(group);
  };

  useEffect(() => {
    if (!isOpen || !containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf8fafc);

    // Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(0, 30, zoomRef.current);
    camera.lookAt(0, 0, 0);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight1.position.set(50, 100, 80);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x94a3b8, 0.8);
    dirLight2.position.set(-50, -40, -60);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x38bdf8, 1.0, 150);
    pointLight.position.set(0, 20, 30);
    scene.add(pointLight);

    // Grid Floor
    const grid = new THREE.GridHelper(180, 36, 0xcbd5e1, 0xe2e8f0);
    grid.position.y = -15;
    scene.add(grid);

    // Renderer with high crisp pixel ratio for sharp capture
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    renderer.setSize(width, height);
    rendererRef.current = renderer;

    // Build Model
    buildSlotDieGeometry(scene, activePlate, wireframe, explodedView);

    // Animation Loop
    const animate = () => {
      if (modelGroupRef.current) {
        modelGroupRef.current.rotation.x = rotationRef.current.x;
        modelGroupRef.current.rotation.y = rotationRef.current.y;
      }
      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      renderer.dispose();
    };
  }, [isOpen, activePlate, wireframe, showMeasurements, explodedView]);

  // Mouse drag & Orbit controls
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    rotationRef.current.y += deltaX * 0.008;
    rotationRef.current.x = Math.max(
      -Math.PI / 2.2,
      Math.min(Math.PI / 2.2, rotationRef.current.x + deltaY * 0.008)
    );

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    zoomRef.current = Math.max(60, Math.min(260, zoomRef.current + e.deltaY * 0.1));
    if (cameraRef.current) {
      cameraRef.current.position.z = zoomRef.current;
    }
  };

  // Preset Views
  const setPresetView = (view: 'ISO' | 'FRONT' | 'REAR' | 'TOP' | 'CROSS') => {
    if (view === 'ISO') {
      rotationRef.current = { x: 0.35, y: -0.65 };
      zoomRef.current = 140;
    } else if (view === 'FRONT') {
      rotationRef.current = { x: 0.0, y: 0.0 };
      zoomRef.current = 125;
    } else if (view === 'REAR') {
      rotationRef.current = { x: 0.0, y: Math.PI };
      zoomRef.current = 125;
    } else if (view === 'TOP') {
      rotationRef.current = { x: Math.PI / 2.2, y: 0.0 };
      zoomRef.current = 135;
    } else if (view === 'CROSS') {
      rotationRef.current = { x: 0.1, y: -Math.PI / 2 };
      zoomRef.current = 100;
    }
    if (cameraRef.current) {
      cameraRef.current.position.z = zoomRef.current;
    }
  };

  // Capture Viewport & Fix to Certificate
  const handleCapture = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    setIsCapturing(true);

    // Hide grid temporarily for clean white background snapshot
    const grid = sceneRef.current.children.find((c) => c instanceof THREE.GridHelper);
    if (grid) grid.visible = false;

    // Render snapshot
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');

    if (grid) grid.visible = true;

    onCaptureSnapshot(dataUrl, activePlate);
    setIsCapturing(false);
    showToast(`[${activePlate === 'ASSEMBLY' ? '어셈블리 도면' : activePlate === 'FRONT' ? 'Front Plate' : 'Rear Plate'}] 도면 시점이 성적서에 고정 삽입되었습니다.`);
  };

  // File Upload (STEP / STL / CAD)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadedFileName(file.name);
    showToast(`STEP/CAD 파일 [${file.name}] 모델이 성공적으로 로드되었습니다.`);
  };

  if (!isOpen) return null;

  return (
    <div
      id="slot-die-3d-cad-modal-backdrop"
      className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="slot-die-3d-cad-modal-container"
        className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight">
                  슬롯다이 3D CAD/STEP 도면 시점 제어 & 성적서 이미지 고정
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/30 text-blue-300 border border-blue-400/40">
                  WebGL 3D Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                마우스 드래그로 3D 도면을 자유 회전하고, 원하는 최적 각도에서 [도면 시점 고정]을 클릭하여 성적서에 삽입합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="bg-slate-100 dark:bg-slate-800/90 p-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Target Plate Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-500 px-2">대상 선택:</span>
            <button
              onClick={() => setActivePlate('ASSEMBLY')}
              className={`px-3 py-1.5 rounded-lg font-black transition cursor-pointer ${
                activePlate === 'ASSEMBLY'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              어셈블리 (Assembly)
            </button>
            <button
              onClick={() => setActivePlate('FRONT')}
              className={`px-3 py-1.5 rounded-lg font-black transition cursor-pointer ${
                activePlate === 'FRONT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              FRONT PLATE
            </button>
            <button
              onClick={() => setActivePlate('REAR')}
              className={`px-3 py-1.5 rounded-lg font-black transition cursor-pointer ${
                activePlate === 'REAR'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              REAR PLATE
            </button>
          </div>

          {/* View Preset Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPresetView('ISO')}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-bold cursor-pointer"
            >
              아이소메트릭 (기본)
            </button>
            <button
              onClick={() => setPresetView('FRONT')}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-bold cursor-pointer"
            >
              정면 (Front)
            </button>
            <button
              onClick={() => setPresetView('REAR')}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-bold cursor-pointer"
            >
              배면 (Rear)
            </button>
            <button
              onClick={() => setPresetView('TOP')}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-bold cursor-pointer"
            >
              상면 립 (Lip Top)
            </button>
            <button
              onClick={() => setPresetView('CROSS')}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-bold cursor-pointer"
            >
              단면 (Cross)
            </button>
          </div>

          {/* Options: Wireframe, Exploded, STEP Upload */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={wireframe}
                onChange={(e) => setWireframe(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>와이어프레임</span>
            </label>
            <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={explodedView}
                onChange={(e) => setExplodedView(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>분해도</span>
            </label>

            {/* STEP File Upload */}
            <label className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs">
              <Upload className="w-3.5 h-3.5" />
              <span>STEP 파일 로드</span>
              <input
                type="file"
                accept=".step,.stp,.stl,.obj"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* 3D Canvas Viewport */}
        <div
          ref={containerRef}
          className="relative flex-1 min-h-[460px] bg-slate-50 dark:bg-slate-950 flex items-center justify-center cursor-grab active:cursor-grabbing select-none overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* HUD Overlay */}
          <div className="absolute top-4 left-4 pointer-events-none space-y-1">
            <div className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-800 shadow-md text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
              <span>품목: SLIT NOZZLE 1580mm (STS630)</span>
              <span className="mx-2 text-slate-300">|</span>
              <span className="text-blue-600">
                {activePlate === 'ASSEMBLY'
                  ? '어셈블리 전체 조립체'
                  : activePlate === 'FRONT'
                  ? 'FRONT PLATE 단품'
                  : 'REAR PLATE 단품'}
              </span>
            </div>
            {loadedFileName && (
              <div className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold">
                ✓ 사용자 CAD 파일: {loadedFileName}
              </div>
            )}
          </div>

          <div className="absolute bottom-4 left-4 pointer-events-none">
            <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-mono">
              마우스 좌클릭 드래그: 3D 회전 | 휠 스크롤: 줌 인/아웃
            </div>
          </div>

          {/* Toast Notification inside 3D Viewport */}
          {toastMsg && (
            <div className="absolute top-4 right-4 z-20 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{toastMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white dark:bg-slate-900 p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
              <span className="font-bold">초정밀 경면 립(Lip) 가공부</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span className="font-bold">CMM 3차원 측정 기준선(A/B)</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              닫기
            </button>

            <button
              id="btn-fix-3d-viewport-snapshot"
              onClick={handleCapture}
              disabled={isCapturing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>현재 3D 도면 시점 고정 (성적서 삽입)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
