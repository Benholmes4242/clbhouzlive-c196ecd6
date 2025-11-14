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
    background: rgba(0,0,0,0.7);
    z-index: 11000;
    display: flex;
    align-items: flex-end;
    animation: fadeIn 0.2s ease;
    backdrop-filter: saturate(120%) blur(20px);
    -webkit-backdrop-filter: saturate(120%) blur(20px);
  `;

  const sheet = document.createElement('div');
  sheet.style.cssText = `
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    background: rgba(22, 24, 27, 0.95);
    border: 0.5px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px 20px 0 0;
    padding: 20px;
    padding-bottom: max(20px, env(safe-area-inset-bottom));
    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 -8px 32px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255, 255, 255, 0.08);
    max-height: 75vh;
    overflow: auto;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  `;

  const title = document.createElement('div');
  title.textContent = 'Select Time';
  title.style.cssText = `
    font-size: 17px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.92);
    margin-bottom: 20px;
    text-align: center;
    letter-spacing: 0.2px;
  `;
  sheet.appendChild(title);

  const inputRow = document.createElement('div');
  inputRow.style.cssText = `
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    display: flex;
    align-items: center;
    padding: 12px 16px;
    margin-bottom: 16px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.05);
  `;

  const input = document.createElement('input');
  input.type = 'time';
  input.value = normalize(opts.initial);
  input.style.cssText = `
    width: 100%;
    background: transparent;
    border: 0;
    color: rgba(255, 255, 255, 0.9);
    outline: none;
    font-size: 16px;
    height: 32px;
  `;
  inputRow.appendChild(input);
  sheet.appendChild(inputRow);

  const helper = document.createElement('div');
  helper.textContent = '24-hour format; we will match games within ~±45 minutes.';
  helper.style.cssText = `
    color: rgba(255, 255, 255, 0.5);
    font-size: 13px;
    margin-bottom: 20px;
    text-align: center;
  `;
  sheet.appendChild(helper);

  const actions = document.createElement('div');
  actions.style.cssText = `
    display: flex;
    gap: 12px;
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
  cancelBtn.style.cssText = `
    height: 48px;
    border-radius: 14px;
    padding: 0 16px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.9);
    font-weight: 600;
    font-size: 15px;
    flex: 1;
    cursor: pointer;
    transition: all 150ms;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  `;
  cancelBtn.onpointerdown = () => {
    try { haptic('light'); } catch {}
    cancelBtn.style.transform = 'scale(0.97)';
  };
  cancelBtn.onpointerup = () => {
    cancelBtn.style.transform = 'scale(1)';
  };
  cancelBtn.onclick = closeSheet;

  const doneBtn = document.createElement('button');
  doneBtn.textContent = 'Done';
  doneBtn.style.cssText = `
    height: 48px;
    border-radius: 14px;
    padding: 0 16px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.92);
    font-weight: 600;
    font-size: 15px;
    flex: 1;
    cursor: pointer;
    transition: all 150ms;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.1);
  `;
  doneBtn.onpointerdown = () => {
    try { haptic('medium'); } catch {}
    doneBtn.style.transform = 'scale(0.97)';
  };
  doneBtn.onpointerup = () => {
    doneBtn.style.transform = 'scale(1)';
  };
  doneBtn.onclick = () => {
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
