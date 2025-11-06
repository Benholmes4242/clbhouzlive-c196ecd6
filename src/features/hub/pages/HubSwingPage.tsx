/**
 * Hub Swing Page
 * Full-screen liquid-glass page overlaying the origin page.
 */
import React, { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../home/hubTheme.css';

export function HubSwingPage() {
  const nav = useNavigate();
  const loc = useLocation();

  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const goBack = () => {
    const state = loc.state as any;
    if (state?.backgroundLocation) {
      // Navigate back to close this overlay
      nav(-1);
    } else {
      // Deep link fallback
      nav('/clubhouse', { replace: true });
    }
  };

  const chooseVideo = () => inputRef.current?.click();

  const onPick: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (f) setFileName(f.name);
    // TODO: hand off to your uploader / analysis flow
  };

  return (
    <div
      className="hub-glass-page fixed inset-0 z-[9999]"
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
      }}
    >
      {/* Simple header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 h-14 border-b"
        style={{
          borderColor: 'rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        <button
          onClick={goBack}
          className="text-white/90 hover:text-white text-[15px] font-medium transition-colors"
          aria-label="Back to Hub"
        >
          ‹ Back
        </button>
        <h1 className="text-white/90 text-[17px] font-semibold">Upload Swing</h1>
        <div className="w-16" />
      </header>

      {/* Content area */}
      <main className="overflow-y-auto h-[calc(100vh-3.5rem)] px-4 pt-6">
        <div className="max-w-md mx-auto">
          <section 
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <p className="text-[14px] text-white/70 mb-4 leading-relaxed">
              For best results: full body, good lighting, face-on or down-the-line. Mention club & typical miss.
            </p>

            <div className="space-y-3">
              <button 
                className="w-full px-4 py-3 rounded-xl font-medium text-[15px] transition-all"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: 'rgba(255,255,255,0.95)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.16)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                }}
                onClick={chooseVideo}
              >
                ⬆️ Select video
              </button>

              {fileName && (
                <div className="text-[13px] text-white/80 text-center">
                  Selected: <strong className="text-white/95">{fileName}</strong>
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={onPick}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
