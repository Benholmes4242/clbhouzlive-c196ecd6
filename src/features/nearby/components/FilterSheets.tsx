import { addDays, format } from 'date-fns';
import { haptic } from '@/utils/haptics';
import type { TimeWindow, GameSort, WhenFilter } from '../hooks/useGameFilters';

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
  when: WhenFilter;
  setWhen: (next: Partial<WhenFilter>) => void;
  distanceKm: number;
  setDistanceKm: (km: number) => void;
  sort: GameSort;
  setSort: (s: GameSort) => void;
};

export function openWhenSheet(f: Filters) {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  
  openActionSheet({
    title: 'Select Date & Time',
    items: [
      // Quick picks
      { label: 'Any', onPress: () => f.setWhen({ date: null, window: 'any', exactTime: null }) },
      { label: 'Today', onPress: () => f.setWhen({ date: today, window: 'any', exactTime: null }) },
      { label: 'Tomorrow', onPress: () => f.setWhen({ date: tomorrow, window: 'any', exactTime: null }) },
      
      // Time windows
      { label: 'Any time', onPress: () => f.setWhen({ window: 'any', exactTime: null }) },
      { label: 'Morning (6–11)', onPress: () => f.setWhen({ window: 'morning', exactTime: null }) },
      { label: 'Afternoon (11–16)', onPress: () => f.setWhen({ window: 'afternoon', exactTime: null }) },
      { label: 'Evening (16–21)', onPress: () => f.setWhen({ window: 'evening', exactTime: null }) },
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

export function labelWhen(when: WhenFilter): string {
  if (!when.date && when.window === 'any' && !when.exactTime) return 'Any';
  
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const dateStr = !when.date 
    ? 'Today'
    : when.date.toDateString() === today.toDateString()
    ? 'Today'
    : when.date.toDateString() === tomorrow.toDateString()
    ? 'Tomorrow'
    : format(when.date, 'MMM d');
  
  if (when.exactTime) return `${dateStr} • ${when.exactTime}`;
  
  if (when.window !== 'any') {
    const windowMap = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };
    return `${dateStr} • ${windowMap[when.window]}`;
  }
  
  return dateStr;
}
