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

  // Create sheet with new styling
  const sheet = document.createElement('div');
  sheet.style.cssText = `
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    background: rgba(10, 10, 10, 0.96);
    border-radius: 24px 24px 0 0;
    border-top: 1px solid rgba(255,255,255,0.06);
    animation: slideUp 0.3s ease;
    box-shadow: 0 -22px 50px rgba(0,0,0,0.85);
    max-height: 75vh;
    overflow: auto;
  `;
  
  // Add handle
  const handle = document.createElement('div');
  handle.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 12px;
    padding-bottom: 8px;
  `;
  const handleBar = document.createElement('div');
  handleBar.style.cssText = `
    height: 4px;
    width: 40px;
    border-radius: 999px;
    background: rgba(255,255,255,0.2);
  `;
  handle.appendChild(handleBar);
  sheet.appendChild(handle);

  // Title
  const title = document.createElement('div');
  title.textContent = config.title;
  title.style.cssText = `
    font-size: 15px;
    font-weight: 600;
    color: rgba(255,255,255,0.96);
    padding: 0 16px 8px;
    text-align: center;
  `;
  sheet.appendChild(title);
  
  // Divider
  const divider = document.createElement('div');
  divider.style.cssText = `
    height: 1px;
    width: 100%;
    background: rgba(255,255,255,0.06);
    margin-bottom: 8px;
  `;
  sheet.appendChild(divider);
  
  // Container for buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    padding: 8px 16px 16px;
  `;
  sheet.appendChild(buttonContainer);

  // Items
  config.items.forEach((item, i) => {
    const button = document.createElement('button');
    button.textContent = item.label;
    button.style.cssText = `
      width: 100%;
      padding: 10px 12px;
      background: rgba(255,255,255,0.04);
      color: rgba(255,255,255,0.46);
      border: 1px solid transparent;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
      cursor: pointer;
      touch-action: manipulation;
      text-align: left;
      transition: all 0.15s ease;
    `;
    
    button.onmouseover = () => {
      button.style.background = 'rgba(255,255,255,0.12)';
      button.style.color = 'rgba(255,255,255,0.96)';
      button.style.borderColor = 'rgba(142, 255, 169, 0.4)';
    };
    
    button.onmouseout = () => {
      button.style.background = 'rgba(255,255,255,0.04)';
      button.style.color = 'rgba(255,255,255,0.46)';
      button.style.borderColor = 'transparent';
    };
    
    button.onclick = () => {
      haptic('medium');
      item.onPress();
      closeSheet();
    };
    
    buttonContainer.appendChild(button);
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
