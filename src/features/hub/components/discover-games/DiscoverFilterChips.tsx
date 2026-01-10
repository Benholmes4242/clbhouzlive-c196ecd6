/**
 * DiscoverFilterChips - Filter chips for date range and visibility
 */

import React from 'react';
import { Calendar, Users } from 'lucide-react';
import type { DiscoverWhen, DiscoverVisibility } from '../../hooks/useDiscoverGames';

interface DiscoverFilterChipsProps {
  when: DiscoverWhen;
  visibility: DiscoverVisibility;
  onWhenChange: (when: DiscoverWhen) => void;
  onVisibilityChange: (visibility: DiscoverVisibility) => void;
}

const whenOptions: { value: DiscoverWhen; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];

const visibilityOptions: { value: DiscoverVisibility; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'public', label: 'Public' },
  { value: 'friends', label: 'Friends' },
  { value: 'club', label: 'Club' },
];

export function DiscoverFilterChips({
  when,
  visibility,
  onWhenChange,
  onVisibilityChange,
}: DiscoverFilterChipsProps) {
  const [showWhenDropdown, setShowWhenDropdown] = React.useState(false);
  const [showVisDropdown, setShowVisDropdown] = React.useState(false);

  const currentWhenLabel = whenOptions.find((o) => o.value === when)?.label ?? 'Any time';
  const currentVisLabel = visibilityOptions.find((o) => o.value === visibility)?.label ?? 'All';

  return (
    <div className="flex items-center gap-2">
      {/* When filter */}
      <div className="relative">
        <button
          onClick={() => {
            setShowWhenDropdown(!showWhenDropdown);
            setShowVisDropdown(false);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150"
          style={{
            background: when !== 'any' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0, 0, 0, 0.04)',
            color: when !== 'any' ? 'rgb(37, 99, 235)' : 'rgba(71, 85, 105, 0.8)',
          }}
        >
          <Calendar className="w-3.5 h-3.5" />
          {currentWhenLabel}
        </button>

        {showWhenDropdown && (
          <>
            <div 
              className="fixed inset-0 z-[10]" 
              onClick={() => setShowWhenDropdown(false)} 
            />
            <div 
              className="absolute top-full left-0 mt-1 py-1 rounded-lg shadow-lg z-[11] min-w-[120px]"
              style={{
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
              }}
            >
              {whenOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onWhenChange(opt.value);
                    setShowWhenDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-[13px] hover:bg-black/5 transition-colors"
                  style={{
                    color: opt.value === when ? 'rgb(37, 99, 235)' : '#1e293b',
                    fontWeight: opt.value === when ? 500 : 400,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Visibility filter */}
      <div className="relative">
        <button
          onClick={() => {
            setShowVisDropdown(!showVisDropdown);
            setShowWhenDropdown(false);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150"
          style={{
            background: visibility !== 'all' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0, 0, 0, 0.04)',
            color: visibility !== 'all' ? 'rgb(37, 99, 235)' : 'rgba(71, 85, 105, 0.8)',
          }}
        >
          <Users className="w-3.5 h-3.5" />
          {currentVisLabel}
        </button>

        {showVisDropdown && (
          <>
            <div 
              className="fixed inset-0 z-[10]" 
              onClick={() => setShowVisDropdown(false)} 
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
                    onVisibilityChange(opt.value);
                    setShowVisDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-[13px] hover:bg-black/5 transition-colors"
                  style={{
                    color: opt.value === visibility ? 'rgb(37, 99, 235)' : '#1e293b',
                    fontWeight: opt.value === visibility ? 500 : 400,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
