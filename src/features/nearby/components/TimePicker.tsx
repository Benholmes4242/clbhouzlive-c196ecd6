import { useState } from 'react';
import { haptic } from '@/utils/haptics';

type TimePickerOpts = {
  initial?: string; // 'HH:mm'
  onSelect: (hhmm: string) => void;
};

function normalize(v?: string) {
  if (!v) return '08:00';
  const m = v.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return '08:00';
  const h = String(Math.min(23, Math.max(0, parseInt(m[1], 10)))).padStart(2, '0');
  const mm = String(Math.min(59, Math.max(0, parseInt(m[2], 10)))).padStart(2, '0');
  return `${h}:${mm}`;
}

export function openTimePicker(opts: TimePickerOpts) {
  haptic('light');
  
  // Lock body scroll
  const originalOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  
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

  const title = document.createElement('div');
  title.textContent = 'Select Time';
  title.style.cssText = `
    font-size: 18px;
    font-weight: 700;
    color: #eaeaea;
    margin-bottom: 16px;
    text-align: center;
  `;
  sheet.appendChild(title);

  const inputRow = document.createElement('div');
  inputRow.style.cssText = `
    background: #141414;
    border: 1px solid #2a2a2a;
    border-radius: 12px;
    display: flex;
    align-items: center;
    padding: 8px 12px;
    margin-bottom: 12px;
  `;

  const input = document.createElement('input');
  input.type = 'time';
  input.value = normalize(opts.initial);
  input.style.cssText = `
    width: 100%;
    background: transparent;
    border: 0;
    color: #e9e9e9;
    outline: none;
    font-size: 16px;
    height: 28px;
  `;
  inputRow.appendChild(input);
  sheet.appendChild(inputRow);

  const helper = document.createElement('div');
  helper.textContent = '24-hour format; we will match games within ~±45 minutes.';
  helper.style.cssText = `
    color: #9aa4a8;
    font-size: 12px;
    margin-bottom: 16px;
  `;
  sheet.appendChild(helper);

  const actions = document.createElement('div');
  actions.style.cssText = `
    display: flex;
    gap: 10px;
  `;

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
  };

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'frosted-btn cancel pressable';
  cancelBtn.style.cssText = `
    height: 44px;
    padding: 0 14px;
    font-weight: 600;
    flex: 1;
    cursor: pointer;
  `;
  cancelBtn.onpointerdown = () => {
    try { haptic('light'); } catch {}
    cancelBtn.classList.add('is-tapping');
    setTimeout(() => cancelBtn.classList.remove('is-tapping'), 200);
  };
  cancelBtn.onclick = closeSheet;

  const doneBtn = document.createElement('button');
  doneBtn.textContent = 'Done';
  doneBtn.className = 'frosted-btn pressable';
  doneBtn.style.cssText = `
    height: 44px;
    padding: 0 14px;
    font-weight: 600;
    flex: 1;
    cursor: pointer;
  `;
  doneBtn.onpointerdown = () => {
    try { haptic('light'); } catch {}
    doneBtn.classList.add('is-tapping');
    setTimeout(() => doneBtn.classList.remove('is-tapping'), 200);
  };
  doneBtn.onclick = () => {
    haptic('medium');
    opts.onSelect(input.value);
    closeSheet();
  };

  actions.appendChild(cancelBtn);
  actions.appendChild(doneBtn);
  sheet.appendChild(actions);

  overlay.onclick = (e) => {
    if (e.target === overlay) closeSheet();
  };

  // Inject frosted button styles if not already present
  if (!document.querySelector('#frosted-styles')) {
    const link = document.createElement('link');
    link.id = 'frosted-styles';
    link.rel = 'stylesheet';
    link.href = '/src/styles/frosted-buttons.css';
    document.head.appendChild(link);
  }

  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes slideDown { from { transform: translateY(0); } to { transform: translateY(100%); } }
  `;
  document.head.appendChild(style);
}
