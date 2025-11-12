/**
 * Apple-style toast notifications
 * Lightweight, blurred, auto-dismissing HUD
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import './toast.css';

type Toast = { id: number; text: string };

const ToastContext = createContext<{ show: (text: string) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastHost');
  return ctx;
}

export function ToastHost({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const show = useCallback((text: string) => {
    const id = Date.now();
    setToasts(t => [...t, { id, text }]);
    setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id));
    }, 1800);
  }, []);
  
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="eh-toast-wrap" aria-live="polite" aria-atomic="true">
        {toasts.map(t => (
          <div key={t.id} className="eh-toast">
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
