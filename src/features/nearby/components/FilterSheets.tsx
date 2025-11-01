import { addDays, format } from 'date-fns';
import { haptic } from '@/utils/haptics';
import type { TimeWindow, GameSort } from '../hooks/useGameFilters';

type FilterSheetItem = {
  label: string;
  onPress: () => void;
};

type ActionSheetConfig = {
  title: string;
  items: FilterSheetItem[];
  onClose?: () => void;
};

// Simple bottom sheet implementation
let currentSheet: (() => void) | null = null;

function openActionSheet(config: ActionSheetConfig) {
  haptic('light');
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 9999;
    display: flex;
    align-items: flex-end;
    animation: fadeIn 0.2s ease;
  `;

  // Create sheet
  const sheet = document.createElement('div');
  sheet.style.cssText = `
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    background: #1a1a1a;
    border-radius: 20px 20px 0 0;
    padding: 20px;
    animation: slideUp 0.3s ease;
  `;

  // Title
  const title = document.createElement('div');
  title.textContent = config.title;
  title.style.cssText = `
    font-size: 18px;
    font-weight: 700;
    color: #eaeaea;
    margin-bottom: 16px;
    text-align: center;
  `;
  sheet.appendChild(title);

  // Items
  config.items.forEach((item, i) => {
    const button = document.createElement('button');
    button.textContent = item.label;
    button.style.cssText = `
      width: 100%;
      padding: 16px;
      background: #252525;
      color: #eaeaea;
      border: 0;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
      cursor: pointer;
      touch-action: manipulation;
    `;
    
    button.onclick = () => {
      haptic('medium');
      item.onPress();
      closeSheet();
    };
    
    sheet.appendChild(button);
  });

  overlay.appendChild(sheet);
  document.body.appendChild(overlay);

  const closeSheet = () => {
    overlay.style.animation = 'fadeOut 0.2s ease';
    sheet.style.animation = 'slideDown 0.2s ease';
    setTimeout(() => overlay.remove(), 200);
    currentSheet = null;
  };

  overlay.onclick = (e) => {
    if (e.target === overlay) closeSheet();
  };

  currentSheet = closeSheet;

  // Add animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes slideDown { from { transform: translateY(0); } to { transform: translateY(100%); } }
  `;
  document.head.appendChild(style);
}

type Filters = {
  date: Date | null;
  setDate: (d: Date | null) => void;
  timeWindow: TimeWindow;
  setTimeWindow: (t: TimeWindow) => void;
  distanceKm: number;
  setDistanceKm: (km: number) => void;
  sort: GameSort;
  setSort: (s: GameSort) => void;
};

export function openDateSheet(f: Filters) {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  
  openActionSheet({
    title: 'Select Date',
    items: [
      { label: 'Any date', onPress: () => f.setDate(null) },
      { label: 'Today', onPress: () => f.setDate(today) },
      { label: 'Tomorrow', onPress: () => f.setDate(tomorrow) },
    ],
  });
}

export function openTimeSheet(f: Filters) {
  openActionSheet({
    title: 'Select Time',
    items: [
      { label: 'Any time', onPress: () => f.setTimeWindow('any') },
      { label: 'Morning (6–11)', onPress: () => f.setTimeWindow('morning') },
      { label: 'Afternoon (11–16)', onPress: () => f.setTimeWindow('afternoon') },
      { label: 'Evening (16–21)', onPress: () => f.setTimeWindow('evening') },
    ],
  });
}

export function openDistanceSheet(f: Filters) {
  openActionSheet({
    title: 'Distance',
    items: [5, 10, 20, 50].map(km => ({
      label: `${km} km`,
      onPress: () => f.setDistanceKm(km),
    })),
  });
}

export function openSortSheet(f: Filters) {
  openActionSheet({
    title: 'Sort By',
    items: [
      { label: 'Soonest', onPress: () => f.setSort('soonest') },
      { label: 'Nearest', onPress: () => f.setSort('distance') },
      { label: 'Most seats', onPress: () => f.setSort('seats') },
    ],
  });
}

export function labelDate(date: Date | null): string {
  if (!date) return 'Any';
  const today = new Date();
  const tomorrow = addDays(today, 1);
  
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  
  return format(date, 'MMM d');
}

export function labelTime(timeWindow: TimeWindow): string {
  if (timeWindow === 'any') return 'Any';
  if (timeWindow === 'morning') return 'Morning';
  if (timeWindow === 'afternoon') return 'Afternoon';
  return 'Evening';
}
