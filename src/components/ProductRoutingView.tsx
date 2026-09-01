import React, { useState, useEffect } from 'react';
import { ProductType, ProcessCategory, ProcessStep, User, Order } from '../types';
import {
  GitMerge,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Clock,
  Layers,
  Save,
  Check,
  Edit2,
  Copy,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  X,
  MoreVertical,
  FileText,
  CheckCircle2,
  ShieldAlert,
  ShieldX,
  Search,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';

interface ProductRoutingViewProps {
  productTypes: Record<string, ProductType>;
  orders?: Record<string, Order>;
  currentUser?: User | null;
  onUpdateProductType: (updatedType: ProductType) => void;
  onSaveNewProductType?: (newType: ProductType) => void;
  onDeleteProductType?: (typeId: string) => void;
  onOpenNewTypeModal?: () => void;
  onOpenCopyTypeModal?: () => void;
}

export const ProductRoutingView: React.FC<ProductRoutingViewProps> = ({
  productTypes = {},
  orders = {},
  currentUser,
  onUpdateProductType,
  onSaveNewProductType,
  onDeleteProductType,
}) => {
  const typeKeys = Object.keys(productTypes);
  const [activeTypeId, setActiveTypeId] = useState<string>(
    typeKeys[0] || 'TYPE_SLIT_NOZZLE'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // RBAC check: Only System Admin can delete
  const isSystemAdmin = (user?: User | null) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (user.department && (user.department.includes('시스템 관리자') || user.department === '시스템 관리자')) return true;
    return false;
  };

  // Feedback & Alert states
  const [permissionAlertMessage, setPermissionAlertMessage] = useState<string | null>(null);
  const [successToastMessage, setSuccessToastMessage] = useState<string>('');

  // Modals state
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [targetTypeToRename, setTargetTypeToRename] = useState<ProductType | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [renameError, setRenameError] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetTypeToDelete, setTargetTypeToDelete] = useState<ProductType | null>(null);
  const [targetMigrateTypeId, setTargetMigrateTypeId] = useState<string>('');
  const [deleteWarningInfo, setDeleteWarningInfo] = useState<{ isInUse: boolean; orderNames: string[]; isRef: boolean } | null>(null);

  // Safety confirmation modal for deleting individual process step
  const [stepToDeleteIndex, setStepToDeleteIndex] = useState<number | null>(null);

  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [targetTypeToCopy, setTargetTypeToCopy] = useState<ProductType | null>(null);
  const [copyNameInput, setCopyNameInput] = useState('');
  const [copyError, setCopyError] = useState('');
  const [selectedCopyStepIndices, setSelectedCopyStepIndices] = useState<number[]>([]);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTypeNameInput, setNewTypeNameInput] = useState('');
  const [newTypeError, setNewTypeError] = useState('');
  const [newTypeSteps, setNewTypeSteps] = useState<
    { id: string; name: string; category: ProcessCategory; durationHours: number }[]
  >([
    { id: '1', name: '가공 공정 1', category: '가공', durationHours: 4.0 },
  ]);

  // Ensure activeTypeId stays valid
  useEffect(() => {
    if (typeKeys.length > 0 && (!activeTypeId || !productTypes[activeTypeId])) {
      setActiveTypeId(typeKeys[0]);
    }
  }, [productTypes, activeTypeId, typeKeys]);

  const currentType = productTypes[activeTypeId] || (typeKeys.length > 0 ? productTypes[typeKeys[0]] : null);

  // Helper: check if a name is duplicated (excluding current ID if editing)
  const isDuplicateName = (name: string, excludeId?: string) => {
    const trimmed = name.trim().toLowerCase();
    return Object.values(productTypes).some(
      (t) => t.id !== excludeId && t.name.trim().toLowerCase() === trimmed
    );
  };

  // Helper: get orders currently using a product type
  const getOrdersUsingType = (typeId: string): Order[] => {
    return Object.values(orders).filter((ord) => ord.typeId === typeId);
  };

  /* ==================================================================== */
  /* Process Step Modifications                                           */
  /* ==================================================================== */
  const handleProcessDurationChange = (index: number, newHours: number) => {
    if (!currentType) return;
    if (currentType.isReference && currentUser?.role !== 'ADMIN') {
      alert('표준 레퍼런스 공정은 관리자(ADMIN) 권한이 있어야 수정할 수 있습니다.');
      return;
    }

    const updatedProcesses = [...currentType.processes];
    updatedProcesses[index] = {
      ...updatedProcesses[index],
      durationHours: Math.max(0.01, newHours),
    };

    onUpdateProductType({
      ...currentType,
      processes: updatedProcesses,
    });
  };

  const handleProcessNameChange = (index: number, newName: string) => {
    if (!currentType) return;
    if (currentType.isReference && currentUser?.role !== 'ADMIN') {
      alert('표준 레퍼런스 공정은 관리자(ADMIN) 권한이 있어야 수정할 수 있습니다.');
      return;
    }

    const updatedProcesses = [...currentType.processes];
    updatedProcesses[index] = {
      ...updatedProcesses[index],
      name: newName,
    };

    onUpdateProductType({
      ...currentType,
      processes: updatedProcesses,
    });
  };

  const handleProcessCategoryChange = (index: number, newCategory: ProcessCategory) => {
    if (!currentType) return;
    if (currentType.isReference && currentUser?.role !== 'ADMIN') {
      alert('표준 레퍼런스 공정은 관리자(ADMIN) 권한이 있어야 수정할 수 있습니다.');
      return;
    }

    const updatedProcesses = [...currentType.processes];
    updatedProcesses[index] = {
      ...updatedProcesses[index],
      category: newCategory,
    };

    onUpdateProductType({
      ...currentType,
      processes: updatedProcesses,
    });
  };

  const handleMoveStep = (index: number, direction: 'UP' | 'DOWN') => {
    if (!currentType) return;
    if (currentType.isReference && currentUser?.role !== 'ADMIN') {
      alert('표준 레퍼런스 공정은 관리자(ADMIN) 권한이 있어야 수정할 수 있습니다.');
      return;
    }

    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentType.processes.length) return;

    const newProcesses = [...currentType.processes];
    const [moved] = newProcesses.splice(index, 1);
    newProcesses.splice(targetIndex, 0, moved);

    onUpdateProductType({
      ...currentType,
      processes: newProcesses,
    });
  };

  const handleAddStep = () => {
    if (!currentType) return;
    if (currentType.isReference && currentUser?.role !== 'ADMIN') {
      alert('표준 레퍼런스 공정은 관리자(ADMIN) 권한이 있어야 수정할 수 있습니다.');
      return;
    }

    const updatedProcesses: ProcessStep[] = [
      ...currentType.processes,
      {
        name: `신규 추가 공정 ${currentType.processes.length + 1}`,
        category: '가공' as ProcessCategory,
        durationHours: 2.0,
      },
    ];

    onUpdateProductType({
      ...currentType,
      processes: updatedProcesses,
    });
  };

  const handleDuplicateStep = (index: number) => {
    if (!currentType) return;
    if (currentType.isReference && currentUser?.role !== 'ADMIN') {
      alert('표준 레퍼런스 공정은 관리자(ADMIN) 권한이 있어야 수정할 수 있습니다.');
      return;
    }

    const source = currentType.processes[index];
    const copyStep: ProcessStep = {
      ...source,
      name: `${source.name} (추가)`,
    };

    const newProcesses = [...currentType.processes];
    newProcesses.splice(index + 1, 0, copyStep);

    onUpdateProductType({
      ...currentType,
      processes: newProcesses,
    });
  };

  const handleRequestRemoveStep = (index: number) => {
    if (!currentType) return;
    if (currentType.isReference && currentUser?.role !== 'ADMIN') {
      alert('표준 레퍼런스 공정은 관리자(ADMIN) 권한이 있어야 수정할 수 있습니다.');
      return;
    }

    if (currentType.processes.length <= 1) {
      alert('마스터에는 최소 1개 이상의 공정이 등록되어 있어야 합니다.');
      return;
    }

    setStepToDeleteIndex(index);
  };

  const handleConfirmRemoveStep = () => {
    if (!currentType || stepToDeleteIndex === null) return;

    const updatedProcesses = currentType.processes.filter((_, i) => i !== stepToDeleteIndex);

    onUpdateProductType({
      ...currentType,
      processes: updatedProcesses,
    });

    setStepToDeleteIndex(null);
  };

  /* ==================================================================== */
  /* 1. Rename Master                                                     */
  /* ==================================================================== */
  const handleOpenRenameModal = (type: ProductType) => {
    setTargetTypeToRename(type);
    setRenameInput(type.name);
    setRenameError('');
    setIsRenameModalOpen(true);
  };

  const handleSaveRename = () => {
    if (!targetTypeToRename) return;
    const trimmed = renameInput.trim();
    if (!trimmed) {
      setRenameError('마스터 이름을 입력해주세요.');
      return;
    }

    if (isDuplicateName(trimmed, targetTypeToRename.id)) {
      setRenameError('이미 존재하는 마스터 이름입니다. 다른 이름을 입력해주세요.');
      return;
    }

    // Preserve master id, isReference, and all processes intact
    const updated: ProductType = {
      ...targetTypeToRename,
      name: trimmed,
    };

    onUpdateProductType(updated);
    setIsRenameModalOpen(false);
    setTargetTypeToRename(null);
  };

  /* ==================================================================== */
  /* 2. Copy Master                                                       */
  /* ==================================================================== */
  const handleOpenCopyModal = (type: ProductType) => {
    setTargetTypeToCopy(type);
    setCopyNameInput(`${type.name} 복사본`);
    setCopyError('');
    setSelectedCopyStepIndices(type.processes.map((_, i) => i));
    setIsCopyModalOpen(true);
  };

  const handleSaveCopy = () => {
    if (!targetTypeToCopy) return;
    const trimmed = copyNameInput.trim();
    if (!trimmed) {
      setCopyError('새 마스터 이름을 입력해주세요.');
      return;
    }

    if (isDuplicateName(trimmed)) {
      setCopyError('이미 존재하는 마스터 이름입니다. 다른 이름을 입력해주세요.');
      return;
    }

    if (selectedCopyStepIndices.length === 0) {
      setCopyError('최소 1개 이상의 공정 단계를 선택해주세요.');
      return;
    }

    const filteredProcesses = targetTypeToCopy.processes
      .filter((_, i) => selectedCopyStepIndices.includes(i))
      .map((p) => ({ ...p }));

    const newTypeId = `TYPE_BOP_${Date.now()}`;
    const newType: ProductType = {
      id: newTypeId,
      name: trimmed,
      isReference: false,
      processes: filteredProcesses,
    };

    if (onSaveNewProductType) {
      onSaveNewProductType(newType);
    } else {
      onUpdateProductType(newType);
    }

    setActiveTypeId(newTypeId);
    setIsCopyModalOpen(false);
    setTargetTypeToCopy(null);
  };

  /* ==================================================================== */
  /* 3. Delete Master                                                     */
  /* ==================================================================== */
  const handleOpenDeleteModal = (type: ProductType) => {
    setTargetTypeToDelete(type);
    const linked = getOrdersUsingType(type.id);
    const isInUse = linked.length > 0;
    const isRef = type.isReference;

    setDeleteWarningInfo({
      isInUse,
      orderNames: linked.map((o) => o.name),
      isRef,
    });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!targetTypeToDelete) return;

    // Check if in use
    const linked = getOrdersUsingType(targetTypeToDelete.id);
    if (linked.length > 0) {
      alert(`현재 ${linked.length}건의 수주에서 사용 중인 마스터입니다. 삭제할 수 없습니다.`);
      return;
    }

    const typeIdToDelete = targetTypeToDelete.id;

    if (onDeleteProductType) {
      onDeleteProductType(typeIdToDelete);
    }

    // Auto select another master
    const remainingKeys = typeKeys.filter((k) => k !== typeIdToDelete);
    if (remainingKeys.length > 0) {
      setActiveTypeId(remainingKeys[0]);
    }

    setIsDeleteModalOpen(false);
    setTargetTypeToDelete(null);
  };

  /* ==================================================================== */
  /* 4. Create New Master                                                 */
  /* ==================================================================== */
  const handleOpenNewModal = () => {
    setNewTypeNameInput('');
    setNewTypeError('');
    setNewTypeSteps([
      { id: '1', name: '가공 공정 1', category: '가공', durationHours: 4.0 },
    ]);
    setIsNewModalOpen(true);
  };

  const handleAddNewTypeStep = () => {
    setNewTypeSteps([
      ...newTypeSteps,
      {
        id: String(Date.now()),
        name: `신규 공정 ${newTypeSteps.length + 1}`,
        category: '가공',
        durationHours: 2.0,
      },
    ]);
  };

  const handleRemoveNewTypeStep = (id: string) => {
    if (newTypeSteps.length <= 1) {
      alert('최소 1개 이상의 공정이 필요합니다.');
      return;
    }
    setNewTypeSteps(newTypeSteps.filter((s) => s.id !== id));
  };

  const handleSaveNewMaster = () => {
    const trimmed = newTypeNameInput.trim();
    if (!trimmed) {
      setNewTypeError('마스터 이름을 입력해주세요.');
      return;
    }

    if (isDuplicateName(trimmed)) {
      setNewTypeError('이미 존재하는 마스터 이름입니다. 다른 이름을 입력해주세요.');
      return;
    }

    if (newTypeSteps.length === 0) {
      setNewTypeError('최소 1개 이상의 공정 단계를 추가해주세요.');
      return;
    }

    const processes: ProcessStep[] = newTypeSteps.map((s) => ({
      name: s.name.trim() || '공정',
      category: s.category,
      durationHours: Math.max(0.01, parseFloat(String(s.durationHours)) || 1.0),
    }));

    const newTypeId = `TYPE_BOP_${Date.now()}`;
    const newType: ProductType = {
      id: newTypeId,
      name: trimmed,
      isReference: false,
      processes,
    };

    if (onSaveNewProductType) {
      onSaveNewProductType(newType);
    } else {
      onUpdateProductType(newType);
    }

    setActiveTypeId(newTypeId);
    setIsNewModalOpen(false);
  };

  const totalTypeHours = currentType
    ? currentType.processes.reduce((acc, p) => acc + p.durationHours, 0)
    : 0;

  const filteredMasterList = Object.values(productTypes).filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
            <GitMerge className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>공정 구성 & 표준시간 관리 (Master)</span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                총 {Object.keys(productTypes).length}개 마스터
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              제품 타입별 표준 공정 단계, 순서, 작업 카테고리 및 표준 작업 시간(h)을 통합 관리합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenNewModal}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>신규 마스터 생성</span>
          </button>
          {currentType && (
            <button
              onClick={() => handleOpenCopyModal(currentType)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>현재 마스터 복사</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Master List & Right Step Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Product Type Selector Tabs (4 cols on lg) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>제품 공정 구성 마스터 목록 ({filteredMasterList.length})</span>
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="마스터 이름 검색..."
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Master List Cards */}
          <div className="space-y-2 overflow-y-auto max-h-[620px] pr-1">
            {filteredMasterList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                검색된 제품 마스터가 없습니다.
              </div>
            ) : (
              filteredMasterList.map((t) => {
                const isActive = t.id === activeTypeId;
                const hours = t.processes.reduce((acc, p) => acc + p.durationHours, 0);
                const linkedOrders = getOrdersUsingType(t.id);

                return (
                  <div
                    key={t.id}
                    onClick={() => setActiveTypeId(t.id)}
                    className={`group relative p-3.5 rounded-xl text-xs transition border cursor-pointer ${
                      isActive
                        ? 'bg-blue-50/80 border-blue-300 shadow-sm text-slate-900 ring-1 ring-blue-400/50'
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Title & Badge */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {t.isReference ? (
                            <span title="표준 레퍼런스 마스터 (수정 제한)">
                              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            </span>
                          ) : (
                            <span title="커스텀 마스터 (자유로운 수정 가능)">
                              <Unlock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            </span>
                          )}
                          <span className="font-extrabold text-sm truncate text-slate-900">
                            {t.name}
                          </span>
                        </div>

                        {/* Metadata row */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 font-medium flex-wrap">
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                            {t.processes.length}개 공정
                          </span>
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {hours.toFixed(1)}h
                          </span>
                          {linkedOrders.length > 0 && (
                            <span className="bg-amber-100/70 text-amber-800 px-1.5 py-0.5 rounded font-bold text-[10px]">
                              수주 {linkedOrders.length}건 연결
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Action Icons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Rename Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRenameModal(t);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-100/60 transition cursor-pointer"
                          title="마스터 이름 수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCopyModal(t);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-100/60 transition cursor-pointer"
                          title="마스터 복사"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeleteModal(t);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-100/60 transition cursor-pointer"
                          title="마스터 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Process Steps Table / Editor (8 cols on lg) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4 flex flex-col">
          {currentType ? (
            <>
              {/* Header Info of Current Master */}
              <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-100 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <span>{currentType.name}</span>
                    </h3>

                    {/* Master Actions inside Editor Header */}
                    <button
                      onClick={() => handleOpenRenameModal(currentType)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-slate-200"
                      title="이름 수정"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>이름 수정</span>
                    </button>

                    <button
                      onClick={() => handleOpenCopyModal(currentType)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-slate-200"
                      title="복사 생성"
                    >
                      <Copy className="w-3 h-3" />
                      <span>복사</span>
                    </button>

                    <button
                      onClick={() => handleOpenDeleteModal(currentType)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-slate-200"
                      title="마스터 삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>삭제</span>
                    </button>

                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-extrabold border ${
                        currentType.isReference
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {currentType.isReference ? '🔒 표준 레퍼런스' : '✏️ 커스텀 공정 마스터'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-3 font-medium">
                    <span>
                      전체 공정: <strong className="text-slate-900 font-bold">{currentType.processes.length}단계</strong>
                    </span>
                    <span>•</span>
                    <span>
                      총 표준 작업시간: <strong className="text-indigo-600 font-bold font-mono">{totalTypeHours.toFixed(1)}시간</strong>
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-slate-400">
                      ID: {currentType.id}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddStep}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>공정 단계 추가</span>
                  </button>
                </div>
              </div>

              {/* Steps Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-16 text-center">순서</th>
                      <th className="p-3 w-20 text-center">순서 이동</th>
                      <th className="p-3">공정명 (Process Step)</th>
                      <th className="p-3 text-center w-28">공정 카테고리</th>
                      <th className="p-3 text-right w-36">표준시간 (h)</th>
                      <th className="p-3 text-center w-24">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {currentType.processes.map((proc, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === currentType.processes.length - 1;

                      return (
                        <tr key={idx} className="hover:bg-blue-50/30 transition">
                          {/* Step Index */}
                          <td className="p-3 text-center font-mono font-bold text-slate-500">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black">
                              {idx + 1}
                            </span>
                          </td>

                          {/* Reorder Up/Down */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                disabled={isFirst}
                                onClick={() => handleMoveStep(idx, 'UP')}
                                className={`p-1 rounded transition ${
                                  isFirst
                                    ? 'text-slate-200 cursor-not-allowed'
                                    : 'text-slate-500 hover:text-blue-600 hover:bg-blue-100 cursor-pointer'
                                }`}
                                title="위로 이동"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={isLast}
                                onClick={() => handleMoveStep(idx, 'DOWN')}
                                className={`p-1 rounded transition ${
                                  isLast
                                    ? 'text-slate-200 cursor-not-allowed'
                                    : 'text-slate-500 hover:text-blue-600 hover:bg-blue-100 cursor-pointer'
                                }`}
                                title="아래로 이동"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* Process Name Input */}
                          <td className="p-3 font-bold">
                            <input
                              type="text"
                              value={proc.name}
                              onChange={(e) => handleProcessNameChange(idx, e.target.value)}
                              placeholder="공정명을 입력하세요"
                              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:bg-white focus:outline-none font-bold text-slate-900 bg-slate-50/50"
                            />
                          </td>

                          {/* Category Select */}
                          <td className="p-3 text-center">
                            <select
                              value={proc.category}
                              onChange={(e) =>
                                handleProcessCategoryChange(idx, e.target.value as ProcessCategory)
                              }
                              className={`text-xs px-2.5 py-1.5 border rounded-lg font-bold bg-white text-slate-800 ${
                                proc.category === '가공'
                                  ? 'border-blue-300 text-blue-800'
                                  : proc.category === '연마'
                                  ? 'border-amber-300 text-amber-800'
                                  : proc.category === '외주'
                                  ? 'border-purple-300 text-purple-800'
                                  : 'border-emerald-300 text-emerald-800'
                              }`}
                            >
                              <option value="가공">가공 (MCT)</option>
                              <option value="연마">연마 (Grind)</option>
                              <option value="외주">외주 (Outsource)</option>
                              <option value="품질">품질 (CMM)</option>
                            </select>
                          </td>

                          {/* Standard Duration Input */}
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={proc.durationHours}
                                onChange={(e) =>
                                  handleProcessDurationChange(idx, parseFloat(e.target.value) || 0.1)
                                }
                                className="w-20 text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-right text-indigo-700 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-none"
                              />
                              <span className="text-slate-400 font-bold">h</span>
                            </div>
                          </td>

                          {/* Actions: Duplicate & Delete */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDuplicateStep(idx)}
                                className="text-slate-400 hover:text-emerald-600 p-1.5 rounded hover:bg-emerald-50 transition cursor-pointer"
                                title="이 공정 복제"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRequestRemoveStep(idx)}
                                className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition cursor-pointer"
                                title="이 공정 삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Helper */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">💡 팁:</span>
                  <span>공정명과 표준시간은 수정 즉시 자동 저장됩니다. 순서 이동(↑, ↓)으로 작업 절차를 쉽게 조정할 수 있습니다.</span>
                </div>
                <div className="font-extrabold text-indigo-900">
                  합계: {currentType.processes.length}단계 / {totalTypeHours.toFixed(1)}시간
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-slate-400 space-y-3">
              <Layers className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold">선택된 제품 공정 구성 마스터가 없습니다.</p>
              <button
                onClick={handleOpenNewModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition cursor-pointer shadow-sm"
              >
                새 마스터 만들기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: Rename Master Modal                                         */}
      {/* ==================================================================== */}
      {isRenameModalOpen && targetTypeToRename && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">마스터 이름 수정</h3>
                  <p className="text-[11px] text-slate-500">제품 공정 구성 마스터의 명칭을 변경합니다.</p>
                </div>
              </div>
              <button
                onClick={() => setIsRenameModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1">현재 이름</label>
                <div className="px-3 py-2 bg-slate-100 rounded-xl font-bold text-slate-700 border border-slate-200">
                  {targetTypeToRename.name}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  새 마스터 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={renameInput}
                  onChange={(e) => {
                    setRenameInput(e.target.value);
                    if (renameError) setRenameError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename();
                  }}
                  placeholder="예: 임가공 제품 A, 임가공 1차"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                />
                {renameError && (
                  <p className="text-red-500 font-bold mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{renameError}</span>
                  </p>
                )}
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>데이터 안전 보장</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  마스터 이름을 변경해도 고유 ID(<code className="font-mono text-blue-700">{targetTypeToRename.id}</code>) 및 등록된 {targetTypeToRename.processes.length}개 공정 정보(순서, 표준시간)는 완전히 안전하게 유지됩니다.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsRenameModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveRename}
                className="px-5 py-2 text-xs bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: Copy Master Modal                                           */}
      {/* ==================================================================== */}
      {isCopyModalOpen && targetTypeToCopy && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Copy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">마스터 공정 구성 복사</h3>
                  <p className="text-[11px] text-slate-500">기존 마스터의 공정 구성을 기반으로 새 마스터를 복제합니다.</p>
                </div>
              </div>
              <button
                onClick={() => setIsCopyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-500 mb-1">원본 마스터</label>
                <div className="px-3 py-2 bg-slate-100 rounded-xl font-bold text-slate-800 border border-slate-200 flex justify-between items-center">
                  <span>{targetTypeToCopy.name}</span>
                  <span className="text-[11px] text-indigo-600 font-mono font-bold">
                    {targetTypeToCopy.processes.length}개 공정 / {targetTypeToCopy.processes.reduce((a, b) => a + b.durationHours, 0).toFixed(1)}h
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  새 마스터 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={copyNameInput}
                  onChange={(e) => {
                    setCopyNameInput(e.target.value);
                    if (copyError) setCopyError('');
                  }}
                  placeholder="예: 임가공 복사본"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
                />
                {copyError && (
                  <p className="text-red-500 font-bold mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{copyError}</span>
                  </p>
                )}
              </div>

              {/* Step Selection List */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-bold text-slate-800">복사할 공정 단계 선택</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedCopyStepIndices.length === targetTypeToCopy.processes.length) {
                        setSelectedCopyStepIndices([]);
                      } else {
                        setSelectedCopyStepIndices(targetTypeToCopy.processes.map((_, i) => i));
                      }
                    }}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    {selectedCopyStepIndices.length === targetTypeToCopy.processes.length ? '전체 해제' : '전체 선택'}
                  </button>
                </div>

                <div className="space-y-1.5 border border-slate-200 p-2.5 rounded-xl bg-slate-50 max-h-48 overflow-y-auto">
                  {targetTypeToCopy.processes.map((proc, idx) => {
                    const isChecked = selectedCopyStepIndices.includes(idx);
                    return (
                      <label
                        key={idx}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border transition cursor-pointer ${
                          isChecked
                            ? 'bg-white border-emerald-300 shadow-2xs text-slate-900'
                            : 'bg-slate-100/60 border-slate-200 text-slate-400 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedCopyStepIndices(selectedCopyStepIndices.filter((i) => i !== idx));
                            } else {
                              setSelectedCopyStepIndices([...selectedCopyStepIndices, idx].sort((a, b) => a - b));
                            }
                          }}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <span className="w-5 text-center font-mono font-bold text-slate-400 text-[11px]">
                          {idx + 1}
                        </span>
                        <span className="flex-1 font-bold truncate">{proc.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {proc.category}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-indigo-600">
                          {proc.durationHours}h
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveCopy}
                className="px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer"
              >
                복사본 생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: Delete Master Modal (with In-Use Block)                     */}
      {/* ==================================================================== */}
      {isDeleteModalOpen && targetTypeToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* If In-Use or Reference blocked */}
            {deleteWarningInfo?.isInUse ? (
              <>
                <div className="p-5 border-b border-amber-100 bg-amber-50/80 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 border border-amber-300">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-amber-900">사용 중인 마스터 삭제 불가</h3>
                    <p className="text-[11px] text-amber-700">수주(생산계획)에서 사용 중인 마스터는 삭제할 수 없습니다.</p>
                  </div>
                </div>

                <div className="p-5 space-y-3 text-xs">
                  <p className="text-slate-700 leading-relaxed font-medium">
                    <strong className="font-black text-slate-900">「{targetTypeToDelete.name}」</strong> 마스터는 현재{' '}
                    <span className="font-extrabold text-red-600 font-mono">{deleteWarningInfo.orderNames.length}건</span>의 수주에서 사용되고 있습니다.
                  </p>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-32 overflow-y-auto space-y-1">
                    <span className="font-bold text-slate-500 text-[11px] block">연결된 수주 목록:</span>
                    {deleteWarningInfo.orderNames.map((name, i) => (
                      <div key={i} className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>{name}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-500">
                    해당 수주의 제품 타입을 다른 마스터로 변경하거나 수주를 삭제/완료한 후 다시 시도해 주세요.
                  </p>
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-5 py-2 text-xs bg-slate-900 text-white font-extrabold rounded-xl hover:bg-slate-800 transition cursor-pointer"
                  >
                    확인
                  </button>
                </div>
              </>
            ) : deleteWarningInfo?.isRef && currentUser?.role !== 'ADMIN' ? (
              <>
                <div className="p-5 border-b border-amber-100 bg-amber-50/80 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 border border-amber-300">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-amber-900">관리자 권한 필요</h3>
                    <p className="text-[11px] text-amber-700">표준 레퍼런스 공정은 관리자만 삭제할 수 있습니다.</p>
                  </div>
                </div>

                <div className="p-5 text-xs text-slate-700 leading-relaxed">
                  <strong className="font-bold text-slate-900">「{targetTypeToDelete.name}」</strong>은 시스템 표준 레퍼런스 공정입니다. 관리자(ADMIN) 계정으로 로그인 후 삭제해 주세요.
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-5 py-2 text-xs bg-slate-900 text-white font-extrabold rounded-xl hover:bg-slate-800 transition cursor-pointer"
                  >
                    확인
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-5 border-b border-red-100 bg-red-50/80 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-500/20 text-red-600 border border-red-300">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-red-900">마스터 삭제 확인</h3>
                    <p className="text-[11px] text-red-700">제품 공정 구성 마스터를 영구히 삭제합니다.</p>
                  </div>
                </div>

                <div className="p-5 space-y-3 text-xs">
                  <p className="text-slate-700 leading-relaxed">
                    <strong className="font-black text-slate-900">「{targetTypeToDelete.name}」</strong> 마스터를 삭제하시겠습니까?
                  </p>
                  <div className="p-3 bg-red-50/60 rounded-xl border border-red-200 text-red-800 text-[11px] space-y-1">
                    <div className="font-bold">⚠️ 삭제 시 주의사항:</div>
                    <p>
                      해당 마스터에 등록되어 있는 {targetTypeToDelete.processes.length}개 공정 구성 정보가 모두 삭제됩니다.
                    </p>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-5 py-2 text-xs bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer"
                  >
                    삭제하기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3-B: Delete Process Step Safety Modal                          */}
      {/* ==================================================================== */}
      {stepToDeleteIndex !== null && currentType && currentType.processes[stepToDeleteIndex] && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-rose-100 bg-rose-50/80 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-600 border border-rose-300">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-rose-900">공정 단계 삭제 확인</h3>
                <p className="text-[11px] text-rose-700">마스터 공정 구성에서 해당 공정을 삭제합니다.</p>
              </div>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">삭제 대상 공정 ({stepToDeleteIndex + 1}단계):</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    {currentType.processes[stepToDeleteIndex].category}
                  </span>
                </div>
                <div className="font-extrabold text-slate-900 text-sm">
                  {currentType.processes[stepToDeleteIndex].name}
                </div>
                <div className="text-[11px] text-indigo-700 font-mono font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>표준 작업시간: {currentType.processes[stepToDeleteIndex].durationHours}시간</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>삭제 시 주의사항</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  삭제 후 마스터 공정 순서가 재정렬되며, 총 {currentType.processes.length - 1}개 공정으로 변경됩니다. 이 작업은 즉시 반영됩니다.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setStepToDeleteIndex(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveStep}
                className="px-5 py-2 text-xs bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer"
              >
                공정 삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: Create New Master Modal                                     */}
      {/* ==================================================================== */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">신규 제품 공정 구성 마스터 생성</h3>
                  <p className="text-[11px] text-slate-500">새 제품 타입과 기본 공정 단계를 설정합니다.</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  마스터 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newTypeNameInput}
                  onChange={(e) => {
                    setNewTypeNameInput(e.target.value);
                    if (newTypeError) setNewTypeError('');
                  }}
                  placeholder="예: 임가공, 스핀들 바디, 챔버 커버"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                />
                {newTypeError && (
                  <p className="text-red-500 font-bold mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{newTypeError}</span>
                  </p>
                )}
              </div>

              {/* Initial Steps Setup */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-bold text-slate-800">초기 공정 단계 설정</label>
                  <button
                    type="button"
                    onClick={handleAddNewTypeStep}
                    className="text-[11px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg font-bold hover:bg-blue-100 border border-blue-200 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>공정 추가</span>
                  </button>
                </div>

                <div className="space-y-2 border border-slate-200 p-2.5 rounded-xl bg-slate-50 max-h-56 overflow-y-auto">
                  {newTypeSteps.map((step, idx) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs"
                    >
                      <span className="text-[11px] font-mono font-bold text-slate-400 w-5 text-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={step.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewTypeSteps(
                            newTypeSteps.map((s) => (s.id === step.id ? { ...s, name: val } : s))
                          );
                        }}
                        placeholder="공정명 입력"
                        className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg font-semibold"
                      />
                      <select
                        value={step.category}
                        onChange={(e) => {
                          const val = e.target.value as ProcessCategory;
                          setNewTypeSteps(
                            newTypeSteps.map((s) => (s.id === step.id ? { ...s, category: val } : s))
                          );
                        }}
                        className="text-xs px-2 py-1.5 border border-slate-300 rounded-lg font-bold"
                      >
                        <option value="가공">가공</option>
                        <option value="연마">연마</option>
                        <option value="외주">외주</option>
                        <option value="품질">품질</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={step.durationHours}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0.1;
                          setNewTypeSteps(
                            newTypeSteps.map((s) => (s.id === step.id ? { ...s, durationHours: val } : s))
                          );
                        }}
                        className="w-16 text-xs px-2 py-1.5 border border-slate-300 rounded-lg text-right font-mono font-bold"
                      />
                      <span className="text-slate-400 font-bold">h</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewTypeStep(step.id)}
                        className="text-slate-400 hover:text-red-600 p-1 transition cursor-pointer"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveNewMaster}
                className="px-5 py-2 text-xs bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer"
              >
                마스터 생성
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
