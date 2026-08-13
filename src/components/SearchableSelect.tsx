import React, { useState, useRef, useEffect } from 'react';
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
  emptyMessage = '검색 결과가 없습니다.'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to SelectOption objects
  const normalizedOptions: SelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  // Selected Option object
  const selectedOption: SelectOption = normalizedOptions.find((o) => o.value === value) || {
    value,
    label: value || placeholder
  };

  // Filtered options based on search query
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesLabel = opt.label.toLowerCase().includes(q);
    const matchesValue = opt.value.toLowerCase().includes(q);
    const matchesSub = opt.sublabel ? opt.sublabel.toLowerCase().includes(q) : false;
    const matchesBadge = opt.badge ? opt.badge.toLowerCase().includes(q) : false;
    return matchesLabel || matchesValue || matchesSub || matchesBadge;
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

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
        className={`w-full text-xs px-3 py-2 border rounded-xl bg-white text-left flex items-center justify-between gap-2 shadow-2xs hover:border-slate-400 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
      >
        <span className="truncate font-bold text-slate-800 flex items-center gap-1.5 min-w-0">
          {!value ? (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          ) : (
            <>
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-black shrink-0 ${
                    selectedOption.badgeColor || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {selectedOption.badge}
                </span>
              )}
            </>
          )}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-xs max-h-60 flex flex-col min-w-[180px]">
          {/* Search Box */}
          <div className="p-1.5 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색어 입력..."
              className="w-full bg-transparent border-none p-1 text-xs font-bold focus:outline-none text-slate-800"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="overflow-y-auto divide-y divide-slate-50 p-1 flex-1">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-slate-400 font-semibold text-[11px]">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left p-2 rounded-lg flex items-center justify-between gap-2 transition ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-extrabold'
                        : 'hover:bg-slate-100 text-slate-700 font-bold'
                    }`}
                  >
                    <div className="truncate flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{opt.label}</span>
                        {opt.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-black shrink-0 ${
                              opt.badgeColor || 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.sublabel && (
                        <span className="text-[10px] text-slate-400 font-normal block truncate">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
