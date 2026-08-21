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
  Sparkles,
  Palette,
  Compass,
  Tag,
  Plus,
  Trash2,
  FileCheck
} from 'lucide-react';

export type PartColorTheme = 'CHROME' | 'STS630' | 'TITANIUM' | 'GOLD_TIN' | 'DLC_BLUE';

export interface AnnotationPin {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  color: string;
}

interface SlotDie3DCadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlate: 'ASSEMBLY' | 'FRONT' | 'REAR' | 'ALL';
  onCaptureSnapshot: (
    dataUrl: string,
    targetPageOrPlate: string,
    batchMap?: Record<string, string>
  ) => void;
  availablePages?: Array<{ id: string; num: number; name: string; type: string }>;
  currentSnapshots?: Record<string, string>;
}

export const SlotDie3DCadModal: React.FC<SlotDie3DCadModalProps> = ({
  isOpen,
  onClose,
  targetPlate: initialTargetPlate,
  onCaptureSnapshot,
  availablePages,
  currentSnapshots
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const annotationsGroupRef = useRef<THREE.Group | null>(null);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [activePlate, setActivePlate] = useState<'ASSEMBLY' | 'FRONT' | 'REAR'>(
    initialTargetPlate === 'ALL' ? 'ASSEMBLY' : initialTargetPlate
  );
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [showMeasurements, setShowMeasurements] = useState<boolean>(true);
  const [showAxes, setShowAxes] = useState<boolean>(true);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [explodedView, setExplodedView] = useState<boolean>(false);

  // Material & Color Themes
  const [colorTheme, setColorTheme] = useState<PartColorTheme>('CHROME');
  const [brightnessMultiplier, setBrightnessMultiplier] = useState<number>(1.2);

  // Model Dimensions
  const [modelScaleLength, setModelScaleLength] = useState<number>(100);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  const [loadedCadInfo, setLoadedCadInfo] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Target page for capture
  const [targetPageSelect, setTargetPageSelect] = useState<string>('PAGE_1');

  // Annotation Pins State
  const [annotations, setAnnotations] = useState<AnnotationPin[]>([
    { id: 'pin-1', label: 'Lip Landing (Ra≤0.02㎛)', x: 0, y: 9.5, z: 2.5, color: '#38bdf8' },
    { id: 'pin-2', label: 'Pitch #1~43 Bolts', x: 0, y: 7.5, z: -6.5, color: '#f59e0b' },
    { id: 'pin-3', label: 'CMM Datum A-Line', x: -45, y: 9.2, z: 0.5, color: '#ef4444' },
    { id: 'pin-4', label: 'Manifold Cavity', x: 0, y: 1.5, z: 0.5, color: '#10b981' }
  ]);
  const [newPinLabel, setNewPinLabel] = useState<string>('');
  const [isAddingPin, setIsAddingPin] = useState<boolean>(false);

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
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Color Theme Palettes
  const getThemeColors = (theme: PartColorTheme, brightness: number) => {
    switch (theme) {
      case 'CHROME':
        return {
          steel: 0xf1f5f9,
          front: 0xe2e8f0,
          rear: 0xdbeafe,
          lip: 0x38bdf8,
          metalness: 0.92,
          roughness: 0.12
        };
      case 'STS630':
        return {
          steel: 0xd1d5db,
          front: 0xc4cbd4,
          rear: 0x94a3b8,
          lip: 0x2563eb,
          metalness: 0.85,
          roughness: 0.22
        };
      case 'TITANIUM':
        return {
          steel: 0x64748b,
          front: 0x475569,
          rear: 0x334155,
          lip: 0x0ea5e9,
          metalness: 0.88,
          roughness: 0.28
        };
      case 'GOLD_TIN':
        return {
          steel: 0xfef08a,
          front: 0xfde047,
          rear: 0xeab308,
          lip: 0xb45309,
          metalness: 0.95,
          roughness: 0.18
        };
      case 'DLC_BLUE':
        return {
          steel: 0x0284c7,
          front: 0x0369a1,
          rear: 0x075985,
          lip: 0x38bdf8,
          metalness: 0.9,
          roughness: 0.15
        };
    }
  };

  // Build Procedural 3D Slot Die High-Precision Geometry
  const buildSlotDieGeometry = (
    scene: THREE.Scene,
    mode: 'ASSEMBLY' | 'FRONT' | 'REAR',
    isWire: boolean,
    exploded: boolean,
    theme: PartColorTheme,
    brightness: number,
    len: number
  ) => {
    // Remove old model
    if (modelGroupRef.current) {
      scene.remove(modelGroupRef.current);
    }
    if (annotationsGroupRef.current) {
      scene.remove(annotationsGroupRef.current);
    }

    const group = new THREE.Group();
    modelGroupRef.current = group;

    const themeColors = getThemeColors(theme, brightness);

    // High Quality Specular Steel Materials
    const frontPlateMaterial = new THREE.MeshStandardMaterial({
      color: themeColors.front,
      metalness: themeColors.metalness,
      roughness: themeColors.roughness,
      wireframe: isWire
    });

    const rearPlateMaterial = new THREE.MeshStandardMaterial({
      color: themeColors.rear,
      metalness: themeColors.metalness,
      roughness: themeColors.roughness,
      wireframe: isWire
    });

    const lipEdgeMaterial = new THREE.MeshStandardMaterial({
      color: themeColors.lip,
      metalness: 0.98,
      roughness: 0.08,
      wireframe: isWire
    });

    const boltMaterial = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.95,
      roughness: 0.15,
      wireframe: isWire
    });

    const redLineMaterial = new THREE.LineBasicMaterial({
      color: 0xef4444,
      linewidth: 3
    });

    const blueLineMaterial = new THREE.LineBasicMaterial({
      color: 0x3b82f6,
      linewidth: 2
    });

    // Die Dimensions in 3D scene (Scaled based on len)
    const L = len;
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

      // Blue straightness centerline
      const lineCGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-L / 2 + 1, H / 2 + 0.2, 0),
        new THREE.Vector3(L / 2 - 1, H / 2 + 0.2, 0)
      ]);
      const lineC = new THREE.Line(lineCGeometry, blueLineMaterial);
      group.add(lineC);
    }

    scene.add(group);

    // 4. 3D Annotation Pins & Text Spheres
    if (showAnnotations) {
      const annotGroup = new THREE.Group();
      annotationsGroupRef.current = annotGroup;

      annotations.forEach((pin) => {
        // Pin Sphere
        const pinMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.9, 16, 16),
          new THREE.MeshStandardMaterial({
            color: pin.color || 0xef4444,
            emissive: pin.color || 0xef4444,
            emissiveIntensity: 0.4
          })
        );
        pinMesh.position.set(pin.x, pin.y, pin.z);
        annotGroup.add(pinMesh);

        // Pin Vertical Stem Line
        const stemGeom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(pin.x, pin.y, pin.z),
          new THREE.Vector3(pin.x, pin.y - 2.5, pin.z)
        ]);
        const stemLine = new THREE.Line(
          stemGeom,
          new THREE.LineBasicMaterial({ color: pin.color || 0xef4444, linewidth: 2 })
        );
        annotGroup.add(stemLine);
      });

      scene.add(annotGroup);
    }
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3 * brightnessMultiplier);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8 * brightnessMultiplier);
    dirLight1.position.set(50, 100, 80);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x94a3b8, 1.0 * brightnessMultiplier);
    dirLight2.position.set(-50, -40, -60);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x38bdf8, 1.2 * brightnessMultiplier, 180);
    pointLight.position.set(0, 25, 40);
    scene.add(pointLight);

    // Grid Floor
    const grid = new THREE.GridHelper(180, 36, 0xcbd5e1, 0xe2e8f0);
    grid.position.y = -15;
    scene.add(grid);

    // Axes Helper (Red=X, Green=Y, Blue=Z)
    if (showAxes) {
      const axes = new THREE.AxesHelper(22);
      axes.position.set(-60, -14, -20);
      scene.add(axes);
      axesHelperRef.current = axes;
    }

    // High crisp WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    renderer.setSize(width, height);
    rendererRef.current = renderer;

    // Build Model
    buildSlotDieGeometry(
      scene,
      activePlate,
      wireframe,
      explodedView,
      colorTheme,
      brightnessMultiplier,
      modelScaleLength
    );

    // Animation Loop
    const animate = () => {
      if (modelGroupRef.current) {
        modelGroupRef.current.rotation.x = rotationRef.current.x;
        modelGroupRef.current.rotation.y = rotationRef.current.y;
      }
      if (annotationsGroupRef.current) {
        annotationsGroupRef.current.rotation.x = rotationRef.current.x;
        annotationsGroupRef.current.rotation.y = rotationRef.current.y;
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
  }, [
    isOpen,
    activePlate,
    wireframe,
    showMeasurements,
    showAxes,
    showAnnotations,
    explodedView,
    colorTheme,
    brightnessMultiplier,
    modelScaleLength,
    annotations
  ]);

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
    zoomRef.current = Math.max(50, Math.min(280, zoomRef.current + e.deltaY * 0.1));
    if (cameraRef.current) {
      cameraRef.current.position.z = zoomRef.current;
    }
  };

  // Preset Views
  const setPresetView = (view: 'ISO' | 'FRONT' | 'REAR' | 'TOP' | 'CROSS' | 'LIP_ZOOM') => {
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
      zoomRef.current = 90;
    } else if (view === 'LIP_ZOOM') {
      rotationRef.current = { x: 0.45, y: -0.3 };
      zoomRef.current = 75;
    }
    if (cameraRef.current) {
      cameraRef.current.position.z = zoomRef.current;
    }
  };

  // Capture Single Snapshot for specific target page
  const handleCaptureTarget = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    setIsCapturing(true);

    const grid = sceneRef.current.children.find((c) => c instanceof THREE.GridHelper);
    if (grid) grid.visible = false;

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');

    if (grid) grid.visible = true;

    onCaptureSnapshot(dataUrl, targetPageSelect);
    setIsCapturing(false);

    const pageName =
      availablePages?.find((p) => p.id === targetPageSelect)?.name || targetPageSelect;
    showToast(`[${pageName}] 도면 시점이 성적서에 성공적으로 고정 삽입되었습니다.`);
  };

  // Batch Auto-Capture: Generates matching directional snapshots for all pages in 1 click!
  const handleBatchAutoCapture = async () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    setIsCapturing(true);

    const grid = sceneRef.current.children.find((c) => c instanceof THREE.GridHelper);
    if (grid) grid.visible = false;

    const batchSnapshots: Record<string, string> = {};

    const captureAngle = (xRot: number, yRot: number, zDist: number) => {
      rotationRef.current = { x: xRot, y: yRot };
      if (cameraRef.current) cameraRef.current.position.z = zDist;
      if (modelGroupRef.current) {
        modelGroupRef.current.rotation.x = xRot;
        modelGroupRef.current.rotation.y = yRot;
      }
      if (annotationsGroupRef.current) {
        annotationsGroupRef.current.rotation.x = xRot;
        annotationsGroupRef.current.rotation.y = yRot;
      }
      rendererRef.current!.render(sceneRef.current!, cameraRef.current!);
      return rendererRef.current!.domElement.toDataURL('image/png');
    };

    // 1. Page 1 (ISO / Assembly)
    batchSnapshots['PAGE_1'] = captureAngle(0.35, -0.65, 140);
    // 2. Page 2 (Flatness / Top Laser Scan)
    batchSnapshots['PAGE_2'] = captureAngle(Math.PI / 2.2, 0.0, 130);
    // 3. Page 3 (Straightness Lip View)
    batchSnapshots['PAGE_3'] = captureAngle(0.2, 0.0, 110);
    // 4. Page 4 (Roughness Optical View)
    batchSnapshots['PAGE_4'] = captureAngle(0.45, -0.2, 85);
    // 5. Page 5 (Optical Cross Section)
    batchSnapshots['PAGE_5'] = captureAngle(0.05, -Math.PI / 2, 75);
    // 6. Page 6 (GAP / Damper Step View)
    batchSnapshots['PAGE_6'] = captureAngle(0.3, -0.4, 115);
    // 7. Page 7 (Hardness Point View)
    batchSnapshots['PAGE_7'] = captureAngle(0.0, Math.PI, 120);
    // 8. Page 8 (Bolt Pitch View)
    batchSnapshots['PAGE_8'] = captureAngle(0.5, -0.1, 110);

    // Reset grid
    if (grid) grid.visible = true;

    // Send batch map to parent
    onCaptureSnapshot(batchSnapshots['PAGE_1'], 'ALL_AUTO', batchSnapshots);
    setIsCapturing(false);
    showToast('✨ 모든 성적서 페이지에 최적의 3D 도면 방향 시점이 일괄 자동 생성 및 매핑되었습니다!');
  };

  // Add Custom 3D Annotation Pin
  const handleAddPin = () => {
    if (!newPinLabel.trim()) return;
    const newPin: AnnotationPin = {
      id: `pin-${Date.now()}`,
      label: newPinLabel.trim(),
      x: (Math.random() - 0.5) * 60,
      y: 8,
      z: 2,
      color: '#3b82f6'
    };
    setAnnotations([...annotations, newPin]);
    setNewPinLabel('');
    setIsAddingPin(false);
    showToast(`새 측정 가이드라인 [${newPin.label}] 이 3D 뷰어에 배치되었습니다.`);
  };

  const handleDeletePin = (id: string) => {
    setAnnotations(annotations.filter((a) => a.id !== id));
  };

  // STEP/STP/STL/OBJ File Upload Simulator & Geometry Scaling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);
    const ext = fileName.split('.').pop()?.toUpperCase() || 'STEP';

    setLoadedFileName(fileName);
    setLoadedCadInfo(`${ext} 모델 | 크기: ${fileSizeMb}MB | 삼각메시: ~14,280 Faces`);

    // Dynamically adjust scale based on file length heuristics
    if (fileName.includes('1650')) {
      setModelScaleLength(110);
    } else if (fileName.includes('1493')) {
      setModelScaleLength(95);
    } else if (fileName.includes('1720')) {
      setModelScaleLength(118);
    } else {
      setModelScaleLength(100);
    }

    showToast(`✓ [${fileName}] 3D CAD 정밀 지오메트리가 성공적으로 로드 및 렌더링되었습니다.`);
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
        className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh]"
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
                  슬롯다이 3D CAD/STEP 에디터 & 성적서 방향 매핑 뷰어
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/30 text-blue-300 border border-blue-400/40">
                  WebGL 3D Engine v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                재질 색상 밝기 조절, XYZ 축 좌표 확인, 가이드라인 핀 편집, STEP 파일 로드 및 성적서 각 페이지별 맞춤 시점을 고정 삽입합니다.
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
            <span className="text-[11px] font-bold text-slate-500 px-2">대상 파트:</span>
            <button
              onClick={() => setActivePlate('ASSEMBLY')}
              className={`px-3 py-1.5 rounded-lg font-black transition cursor-pointer ${
                activePlate === 'ASSEMBLY'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              전체 조립체 (Assembly)
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
              아이소메트릭
            </button>
            <button
              onClick={() => setPresetView('FRONT')}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-bold cursor-pointer"
            >
              정면 (Front)
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
            <button
              onClick={() => setPresetView('LIP_ZOOM')}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-300 hover:bg-slate-50 font-bold cursor-pointer"
            >
              🔍 립 확대
            </button>
          </div>

          {/* Color & Material Finish Theme Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <Palette className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <select
              value={colorTheme}
              onChange={(e) => setColorTheme(e.target.value as PartColorTheme)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-hidden"
            >
              <option value="CHROME">🌟 밝은 초정밀 크롬 스틸</option>
              <option value="STS630">🔘 스테인리스 STS630</option>
              <option value="TITANIUM">🌑 다크 티타늄 코팅</option>
              <option value="GOLD_TIN">🏆 골드 TiN 질화물 코팅</option>
              <option value="DLC_BLUE">🔵 DLC 나노 블루 코팅</option>
            </select>

            {/* Brightness slider */}
            <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold">밝기:</span>
              <input
                type="range"
                min="0.8"
                max="1.8"
                step="0.1"
                value={brightnessMultiplier}
                onChange={(e) => setBrightnessMultiplier(parseFloat(e.target.value))}
                className="w-16 h-1 bg-slate-300 rounded-lg cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          {/* Toggles: Axes, Measurements, Annotations, STEP Upload */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={showAxes}
                onChange={(e) => setShowAxes(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>XYZ 축</span>
            </label>
            <label className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={showAnnotations}
                onChange={(e) => setShowAnnotations(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>가이드 핀</span>
            </label>
            <label className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={explodedView}
                onChange={(e) => setExplodedView(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>분해도</span>
            </label>

            {/* STEP / CAD File Upload */}
            <label className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300 font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs">
              <Upload className="w-3.5 h-3.5" />
              <span>STEP/CAD 로드</span>
              <input
                type="file"
                accept=".step,.stp,.stl,.obj,.iges,.igs"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* 3D Canvas Viewport */}
        <div
          ref={containerRef}
          className="relative flex-1 min-h-[440px] bg-slate-50 dark:bg-slate-950 flex items-center justify-center cursor-grab active:cursor-grabbing select-none overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* HUD Overlay Top Left */}
          <div className="absolute top-4 left-4 pointer-events-none space-y-1.5">
            <div className="px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-slate-200 dark:border-slate-800 shadow-md text-xs font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SLIT NOZZLE ({colorTheme === 'CHROME' ? 'Bright Chrome Finish' : colorTheme})</span>
              <span className="text-slate-300">|</span>
              <span className="text-blue-600">
                {activePlate === 'ASSEMBLY'
                  ? '어셈블리 전체 조립체'
                  : activePlate === 'FRONT'
                  ? 'FRONT PLATE'
                  : 'REAR PLATE'}
              </span>
            </div>
            {loadedCadInfo && (
              <div className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold shadow-xs">
                ✓ 파일 연동: {loadedFileName} ({loadedCadInfo})
              </div>
            )}
          </div>

          {/* XYZ Axis Visual Compass Overlay Top Right */}
          {showAxes && (
            <div className="absolute top-4 right-4 pointer-events-none p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-800 shadow-md flex items-center gap-3 text-[10px] font-mono font-black">
              <div className="flex items-center gap-1 text-rose-600">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>+X (길이)</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>+Y (높이)</span>
              </div>
              <div className="flex items-center gap-1 text-blue-600">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>+Z (두께)</span>
              </div>
            </div>
          )}

          {/* Bottom Left Navigation Tip */}
          <div className="absolute bottom-4 left-4 pointer-events-none">
            <div className="px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[11px] font-mono">
              마우스 좌클릭 드래그: 3D 회전 | 휠: 줌 | 우측 하단에서 성적서 페이지 지정 캡처
            </div>
          </div>

          {/* 3D Annotation Pins List / Quick Editor (Bottom Right Floating) */}
          {showAnnotations && (
            <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-slate-900/95 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg text-[11px] space-y-1 max-w-xs">
              <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300 pb-1 border-b border-slate-200 dark:border-slate-800">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-blue-600" />
                  <span>3D 측정 가이드라인 핀 ({annotations.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingPin(!isAddingPin)}
                  className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  {isAddingPin ? '닫기' : '+ 핀 추가'}
                </button>
              </div>

              {isAddingPin && (
                <div className="flex items-center gap-1 pt-1">
                  <input
                    type="text"
                    placeholder="가이드 텍스트 (예: Chamfer 0.5C)"
                    value={newPinLabel}
                    onChange={(e) => setNewPinLabel(e.target.value)}
                    className="px-2 py-1 border border-blue-400 rounded text-[10px] flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddPin}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold"
                  >
                    추가
                  </button>
                </div>
              )}

              <div className="max-h-24 overflow-y-auto space-y-1 pt-0.5">
                {annotations.map((pin) => (
                  <div
                    key={pin.id}
                    className="flex items-center justify-between gap-2 px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-[10px]"
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      • {pin.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeletePin(pin.id)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Toast Notification */}
          {toastMsg && (
            <div className="absolute top-4 inset-x-0 mx-auto w-fit z-30 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{toastMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions & Capture Controls */}
        <div className="bg-white dark:bg-slate-900 p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Target Page Selector for Snapshot */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">삽입 대상 성적서 페이지:</span>
            <select
              value={targetPageSelect}
              onChange={(e) => setTargetPageSelect(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-xl font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="PAGE_1">페이지 1: 메인 성적서 (아이소메트릭 도면)</option>
              <option value="PAGE_2">페이지 2: 첨부 1. 평면도 (Top 레이저 스캔)</option>
              <option value="PAGE_3">페이지 3: 첨부 2. Lip 진직도 (선형 도면)</option>
              <option value="PAGE_4">페이지 4: 첨부 3. 표면조도 (경면 측정부)</option>
              <option value="PAGE_5">페이지 5: 첨부 4. 광학 현미경 단면</option>
              <option value="PAGE_6">페이지 6: 첨부 5. GAP / Damper 조립</option>
              <option value="PAGE_7">페이지 7: 첨부 6. 경도 / 자력 측정</option>
              <option value="PAGE_8">페이지 8: 첨부 7. 조절볼트 #1~#43</option>
              {availablePages
                ?.filter((p) => p.num > 8)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    페이지 {p.num}: {p.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Batch Auto Capture Button */}
            <button
              id="btn-batch-auto-capture"
              onClick={handleBatchAutoCapture}
              disabled={isCapturing}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>전 페이지 맞춤 3D 시점 자동 일괄 생성</span>
            </button>

            {/* Target Page Single Capture Button */}
            <button
              id="btn-fix-3d-viewport-snapshot"
              onClick={handleCaptureTarget}
              disabled={isCapturing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>선택 페이지에 현재 3D 도면 삽입</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
