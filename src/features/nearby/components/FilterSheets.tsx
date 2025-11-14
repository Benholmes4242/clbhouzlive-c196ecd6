import { addDays, format } from 'date-fns';
import { haptic } from '@/utils/haptics';
import type { TimeWindow, GameSort, WhenFilter } from '../hooks/useGameFilters';
import { openCalendarPicker } from './CalendarPicker';
import { openTimePicker } from './TimePicker';

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
  
  // Lock body scroll
  const originalOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 11000;
    display: flex;
    align-items: flex-end;
    animation: fadeIn 0.2s ease;
    backdrop-filter: saturate(120%) blur(6px);
    -webkit-backdrop-filter: saturate(120%) blur(6px);
  `;

  // Create sheet
  const sheet = document.createElement('div');
  sheet.style.cssText = `
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    background: #111214;
    border-radius: 20px 20px 0 0;
    padding: 20px;
    animation: slideUp 0.3s ease;
    box-shadow: 0 -8px 24px rgba(0,0,0,0.5);
    max-height: 75vh;
    overflow: auto;
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
    setTimeout(() => {
      overlay.remove();
      // Restore body scroll
      document.documentElement.style.overflow = originalOverflow;
    }, 200);
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
  when: WhenFilter | null;
  setWhen: (next: WhenFilter | null | Partial<WhenFilter>) => void;
  distanceKm: number | null;
  setDistanceKm: (km: number | null) => void;
  sort: GameSort | null;
  setSort: (s: GameSort | null) => void;
};

export function openWhenSheet(f: Filters) {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  
  openActionSheet({
    title: 'Select Date & Time',
    items: [
      // Quick picks
      { label: 'Any', onPress: () => f.setWhen(null) },
      { label: 'Today', onPress: () => f.setWhen({ date: today, window: 'any', exactTime: null }) },
      { label: 'Tomorrow', onPress: () => f.setWhen({ date: tomorrow, window: 'any', exactTime: null }) },
      
      // Custom date/time
      { label: 'Choose Date', onPress: () => openCalendarPicker({
        initialDate: f.when?.date ?? new Date(),
        onSelect: (d) => f.setWhen({ date: d, window: 'any', exactTime: null })
      }) },
      { label: 'Choose Time', onPress: () => openTimePicker({
        initial: f.when?.exactTime ?? '08:00',
        onSelect: (hhmm) => f.setWhen({ date: f.when?.date ?? null, window: 'any', exactTime: hhmm })
      }) },
    ],
  });
}

export function openDistanceSheet(f: Filters) {
  openActionSheet({
    title: 'Distance',
    items: [
      { label: 'Any', onPress: () => f.setDistanceKm(null) },
      ...([5, 10, 20, 50].map(km => ({
        label: `${km} km`,
        onPress: () => f.setDistanceKm(km),
      }))),
    ],
  });
}

export function openSortSheet(f: Filters) {
  openActionSheet({
    title: 'Sort By',
    items: [
      { label: 'Soonest', onPress: () => f.setSort('soonest') },
      { label: 'Nearest', onPress: () => f.setSort('distance') },
      { label: 'Most Available Slots', onPress: () => f.setSort('seats') },
    ],
  });
}

export function labelWhen(when: WhenFilter | null): string {
  if (!when || (!when.date && when.window === 'any' && !when.exactTime)) return 'Any';
  
  const today = new Date();
  const tomorrow = addDays(today, 1);
  
  // Format date if present
  const dateStr = !when.date 
    ? null
    : when.date.toDateString() === today.toDateString()
    ? 'Today'
    : when.date.toDateString() === tomorrow.toDateString()
    ? 'Tomorrow'
    : format(when.date, 'MMM d');
  
  // Exact time takes priority
  if (when.exactTime && dateStr) return `${dateStr} • ${when.exactTime}`;
  if (when.exactTime && !dateStr) return when.exactTime;
  
  // Time window
  if (when.window !== 'any' && dateStr) {
    const windowMap = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };
    return `${dateStr} • ${windowMap[when.window]}`;
  }
  
  return dateStr || 'Any';
}
