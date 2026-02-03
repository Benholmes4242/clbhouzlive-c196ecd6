import React, { PropsWithChildren, useEffect, useState } from "react";
import { warmHlsJs } from "@/hooks/useHlsUrlCache";
import { initMobileVideoDebug } from "@/media/mobileVideoDebug";
import { Capacitor } from "@capacitor/core";
import { canAccessGalleryDirectly } from "@/utils/capacitor/galleryService";
import { galleryDebugLog } from "@/hooks/useGallery";

/**
 * Wrap the entire app in <AppShell> so content respects iOS safe areas,
 * fills the screen, and avoids white bars in a webview.
 * Also handles early performance optimizations.
 * 
 * Safe Area Handling:
 * - Uses CSS class .app-shell which applies padding for notch/status bar
 * - Uses 100dvh (dynamic viewport height) for proper mobile sizing
 * - Works with Capacitor/PWA/browser environments
 */
export default function AppShell({ children }: PropsWithChildren) {
  const [debugLines, setDebugLines] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Warm hls.js chunk on app start to avoid delay on first video
  useEffect(() => {
    warmHlsJs();
    // Initialize mobile video debugging
    initMobileVideoDebug();
  }, []);

  // Poll the global gallery debug log
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof galleryDebugLog !== 'undefined') {
        setDebugLines([...galleryDebugLog]);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();
  const canAccessGallery = canAccessGalleryDirectly();

  return (
    <>
      {/* DEBUG PANEL - PERMANENT - REMOVE AFTER TESTING */}
      <div 
        className="fixed top-0 left-0 right-0 bg-red-600 text-white text-xs font-mono z-[99999] flex-shrink-0"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full px-3 py-2 flex items-center justify-between bg-red-700"
        >
          <span className="font-bold">🔧 APP DEBUG PANEL</span>
          <span>{isCollapsed ? '▼ Show' : '▲ Hide'}</span>
        </button>
        
        {!isCollapsed && (
          <div className="p-3 overflow-auto max-h-48">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
              <div>Platform: <span className="text-yellow-300">{platform}</span></div>
              <div>isNative: <span className={isNative ? 'text-green-300' : 'text-red-300'}>{String(isNative)}</span></div>
              <div>canAccessGallery: <span className={canAccessGallery ? 'text-green-300' : 'text-red-300'}>{String(canAccessGallery)}</span></div>
              <div>Logs: {debugLines.length}</div>
            </div>
            
            {!canAccessGallery && isNative && (
              <div className="bg-red-800 p-2 rounded mb-2 text-[10px]">
                ⚠️ canAccessGallery is FALSE on native - CustomGalleryPicker won't load!
              </div>
            )}
            
            <div className="border-t border-red-400 pt-2">
              <div className="text-red-200 text-[10px] mb-1">Gallery Debug Log:</div>
              {debugLines.length === 0 && <div className="text-red-300">No logs yet...</div>}
              {debugLines.slice(-10).map((line, i) => (
                <div key={i} className="text-red-100 text-[10px]">{line}</div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Add padding to content to account for debug panel */}
      <div className="app-shell" style={{ paddingTop: isCollapsed ? '44px' : '200px' }}>
        {children}
      </div>
      {/* Global A11y live region for screen reader announcements */}
      <div id="a11y-live" className="sr-live" aria-live="polite" aria-atomic="true" />
    </>
  );
}