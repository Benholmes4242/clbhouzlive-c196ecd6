import React from 'react';
import { MapPin, ChevronRight, X } from 'lucide-react';
import { GolfCourse } from './types';

interface LocationRowProps {
  selectedCourse: GolfCourse | null;
  onPress: () => void;
  onClear: () => void;
}

/**
 * LocationRow - Flat tappable row for adding location
 * Shows "Add location" with chevron when empty
 * Shows course name with X button when selected
 */
export function LocationRow({ selectedCourse, onPress, onClear }: LocationRowProps) {
  return (
    <button 
      onClick={onPress}
      className="w-full flex items-center justify-between px-4 py-4 transition-colors hover:bg-gray-50 active:bg-gray-100"
      style={{ background: 'transparent' }}
    >
      <div className="flex items-center gap-3">
        <MapPin className="h-5 w-5 text-gray-400" />
        {selectedCourse ? (
          <span className="text-gray-900 text-[15px]">{selectedCourse.name}</span>
        ) : (
          <span className="text-gray-500 text-[15px]">Add location</span>
        )}
      </div>
      {selectedCourse ? (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
          aria-label="Clear location"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      ) : (
        <ChevronRight className="h-5 w-5 text-gray-300" />
      )}
    </button>
  );
}

export default LocationRow;
