import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, X, LucideIcon } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
}

interface SearchableSelectProps {
  options: (SelectOption | string)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  icon?: LucideIcon;
  className?: string;
  disabled?: boolean;
  emptyMessage?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = '선택해주세요',
  label,
  icon: Icon,
  className = '',
  disabled = false,
  emptyMessage = '검색 결과가 없습니다.',
  triggerClassName = '',
  dropdownClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const [dropdownCoords, setDropdownCoords] = useState<React.CSSProperties>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to SelectOption objects
  const normalizedOptions: SelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  // Selected Option object with smart fuzzy/base matching
  const cleanVal = (value || '').trim();
  const baseVal = cleanVal.replace(/\s*\([^)]*\)/g, '').trim();

  const selectedOption: SelectOption =
    normalizedOptions.find((o) => o.value === cleanVal) ||
    normalizedOptions.find((o) => o.value.replace(/\s*\([^)]*\)/g, '').trim() === baseVal && baseVal !== '') ||
    normalizedOptions.find((o) => o.label.replace(/\s*\([^)]*\)/g, '').trim() === baseVal && baseVal !== '') || {
      value: cleanVal,
      label: cleanVal || placeholder,
    };

  // Filtered options based on search query
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchesLabel = opt.label.toLowerCase().includes(q);
    const matchesValue = opt.value.toLowerCase().includes(q);
    const matchesSub = opt.sublabel ? opt.sublabel.toLowerCase().includes(q) : false;
    const matchesBadge = opt.badge ? opt.badge.toLowerCase().includes(q) : false;
    return matchesLabel || matchesValue || matchesSub || matchesBadge;
  });

  // Dynamic Viewport & Collision Detection Calculation
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    const collisionPadding = 8;
    const sideOffset = 4;
    const targetWidth = Math.max(rect.width, 240);

    const spaceBelow = viewportHeight - rect.bottom - collisionPadding;
    const spaceAbove = rect.top - collisionPadding;

    const isTop = spaceBelow < 240 && spaceAbove > spaceBelow;
    const maxHeight = isTop
      ? Math.min(360, Math.max(140, spaceAbove - sideOffset))
      : Math.min(360, Math.max(140, spaceBelow - sideOffset));

    // Clamp horizontal position
    let left = rect.left;
    if (left + targetWidth > viewportWidth - collisionPadding) {
      left = Math.max(collisionPadding, viewportWidth - targetWidth - collisionPadding);
    }
    if (left < collisionPadding) {
      left = collisionPadding;
    }

    const style: React.CSSProperties = {
      position: 'fixed',
      left: `${left}px`,
      width: `${Math.min(targetWidth, viewportWidth - collisionPadding * 2)}px`,
      maxHeight: `${maxHeight}px`,
      zIndex: 99999,
    };

    if (isTop) {
      style.bottom = `${viewportHeight - rect.top + sideOffset}px`;
    } else {
      style.top = `${rect.bottom + sideOffset}px`;
    }

    setDropdownCoords(style);
    setPlacement(isTop ? 'top' : 'bottom');
  }, []);

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  // Global listeners for scroll (capture phase for modals/containers), resize, and outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true });
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  const dropdownContent = isOpen && (
    <div
      ref={dropdownRef}
      style={dropdownCoords}
      className={`bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden text-xs flex flex-col animate-in fade-in zoom-in-95 duration-150 ${
        placement === 'top'
          ? 'origin-bottom shadow-blue-950/20'
          : 'origin-top shadow-slate-950/25'
      } ${dropdownClassName}`}
    >
      {/* Search Box */}
      <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2 shrink-0">
        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="검색어 입력 (이름, 팀, 설비...)"
          className="w-full bg-transparent border-none p-0.5 text-xs font-bold focus:outline-none text-slate-800 placeholder:text-slate-400"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 cursor-pointer transition"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Options List */}
      <div className="overflow-y-auto divide-y divide-slate-50 p-1 flex-1">
        {filteredOptions.length === 0 ? (
          <div className="p-4 text-center text-slate-400 font-semibold text-[11px]">
            {emptyMessage}
          </div>
        ) : (
          filteredOptions.map((opt) => {
            const optClean = (opt.value || '').trim();
            const isSelected =
              optClean === cleanVal ||
              (cleanVal !== '' && optClean !== '' && optClean.replace(/\s*\([^)]*\)/g, '').trim() === baseVal);

            return (
              <button
                key={opt.value || opt.label}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-2 transition cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 text-blue-900 font-extrabold shadow-2xs'
                    : 'hover:bg-slate-100/90 text-slate-700 font-bold'
                }`}
              >
                <div className="truncate flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate">{opt.label}</span>
                    {opt.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-black shrink-0 ${
                          opt.badgeColor || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  {opt.sublabel && (
                    <span className="text-[10px] text-slate-400 font-normal block truncate mt-0.5">
                      {opt.sublabel}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-500" />}
          <span>{label}</span>
        </label>
      )}

      {/* Select Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-xs px-2.5 py-1.5 border rounded-xl bg-white text-left flex items-center justify-between gap-1.5 shadow-2xs hover:border-slate-400 transition focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''} ${triggerClassName}`}
      >
        <span className="truncate font-bold text-slate-800 flex items-center gap-1.5 min-w-0">
          {!cleanVal ? (
            <span className="text-slate-400 font-medium">{placeholder}</span>
          ) : (
            <>
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-black shrink-0 ${
                    selectedOption.badgeColor || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {selectedOption.badge}
                </span>
              )}
            </>
          )}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* Render via Portal directly to body to avoid ANY parent container/overflow clipping */}
      {typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
    </div>
  );
};


