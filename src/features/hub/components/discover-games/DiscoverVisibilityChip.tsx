/**
 * DiscoverVisibilityChip - Visibility filter chip for discover
 */

import React, { useState } from 'react';
import { Users } from 'lucide-react';
import type { DiscoverVisibility } from '../../hooks/useDiscoverGamesV2';

interface DiscoverVisibilityChipProps {
  value: DiscoverVisibility;
  onChange: (value: DiscoverVisibility) => void;
}

const visibilityOptions: { value: DiscoverVisibility; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'public', label: 'Public' },
  { value: 'friends', label: 'Friends' },
  { value: 'club', label: 'Club' },
];

export function DiscoverVisibilityChip({ value, onChange }: DiscoverVisibilityChipProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  
  const currentLabel = visibilityOptions.find((o) => o.value === value)?.label ?? 'All';
  const isActive = value !== 'all';

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150"
        style={{
          background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0, 0, 0, 0.04)',
          color: isActive ? 'rgb(37, 99, 235)' : 'rgba(71, 85, 105, 0.8)',
        }}
      >
        <Users className="w-3.5 h-3.5" />
        {currentLabel}
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-[10]" 
            onClick={() => setShowDropdown(false)} 
          />
          <div 
            className="absolute top-full left-0 mt-1 py-1 rounded-lg shadow-lg z-[11] min-w-[100px]"
            style={{
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            {visibilityOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left text-[13px] hover:bg-black/5 transition-colors"
                style={{
                  color: opt.value === value ? 'rgb(37, 99, 235)' : '#1e293b',
                  fontWeight: opt.value === value ? 500 : 400,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
