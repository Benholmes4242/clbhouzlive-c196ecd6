import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Camera, Grid3x3, X, Eye, Code } from 'lucide-react';
import { useDesignReview } from './DesignReviewContext';

/**
 * Step Runner Component
 * Floating panel for navigating through design review states
 */
export const StepRunner: React.FC = () => {
  const {
    isReviewMode,
    currentStateIndex,
    currentState,
    allStates,
    nextState,
    prevState,
    jumpToState,
    captureScreenshot,
    showSpacingGuides,
    toggleSpacingGuides,
    disableReviewMode,
  } = useDesignReview();

  const [isExpanded, setIsExpanded] = useState(true);
  const [showStateList, setShowStateList] = useState(false);
  const [showTokens, setShowTokens] = useState(false);

  if (!isReviewMode) return null;

  const isFirstState = currentStateIndex === 0;
  const isLastState = currentStateIndex === allStates.length - 1;

  return (
    <>
      {/* Main Step Runner Panel */}
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[99999] animate-in slide-in-from-bottom-2 duration-300"
        style={{
          background: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 255, 255, 0.1) inset',
          minWidth: '400px',
          maxWidth: '600px',
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-white text-sm font-semibold">Design Review Mode</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-white/60 hover:text-white/90 transition-colors rounded"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={disableReviewMode}
              className="p-1.5 text-white/60 hover:text-red-400 transition-colors rounded"
              title="Exit Review Mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <>
            {/* Current State Info */}
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-white/50 uppercase tracking-wider">
                  State {currentStateIndex + 1} of {allStates.length}
                </div>
                <div className="text-xs text-white/50">
                  {currentState?.flow === 'nearby' ? '🎯 Nearby' : '🎮 Create Game'}
                </div>
              </div>
              <div className="text-white font-medium mb-1">{currentState?.name}</div>
              <div className="text-xs text-white/60">{currentState?.description}</div>
              {currentState?.component && (
                <div className="text-xs text-white/40 mt-1 font-mono">
                  Component: {currentState.component}
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={prevState}
                  disabled={isFirstState}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white/10 hover:bg-white/15 disabled:bg-white/5 disabled:opacity-50 text-white rounded-lg transition-all active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Prev</span>
                </button>

                <button
                  onClick={() => setShowStateList(!showStateList)}
                  className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/15 text-white rounded-lg transition-all active:scale-95"
                >
                  <span className="text-sm font-medium">Jump to...</span>
                </button>

                <button
                  onClick={nextState}
                  disabled={isLastState}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white/10 hover:bg-white/15 disabled:bg-white/5 disabled:opacity-50 text-white rounded-lg transition-all active:scale-95"
                >
                  <span className="text-sm font-medium">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 py-3 flex items-center gap-2">
              <button
                onClick={() => captureScreenshot(currentState?.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span className="text-sm font-medium">Screenshot</span>
              </button>

              <button
                onClick={toggleSpacingGuides}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all active:scale-95 ${
                  showSpacingGuides
                    ? 'bg-purple-500/30 text-purple-300'
                    : 'bg-white/10 hover:bg-white/15 text-white'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
                <span className="text-sm font-medium">Grid</span>
              </button>

              <button
                onClick={() => setShowTokens(!showTokens)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all active:scale-95 ${
                  showTokens
                    ? 'bg-green-500/30 text-green-300'
                    : 'bg-white/10 hover:bg-white/15 text-white'
                }`}
              >
                <Code className="w-4 h-4" />
                <span className="text-sm font-medium">Tokens</span>
              </button>
            </div>

            {/* Token Display */}
            {showTokens && currentState?.tokens && (
              <div className="px-4 py-3 border-t border-white/10 bg-black/20">
                <div className="text-xs text-white/50 uppercase tracking-wider mb-2">
                  Design Tokens
                </div>
                <div className="space-y-2">
                  {Object.entries(currentState.tokens).map(([category, tokens]) => (
                    <div key={category}>
                      <div className="text-xs text-white/70 font-semibold mb-1 capitalize">
                        {category}:
                      </div>
                      <div className="space-y-1">
                        {Object.entries(tokens as Record<string, string>).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between text-xs font-mono">
                            <span className="text-white/50">{key}:</span>
                            <span className="text-green-400">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* State List Dropdown */}
      {showStateList && (
        <div
          className="fixed inset-0 z-[99998] flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setShowStateList(false)}
        >
          <div
            className="relative max-w-md w-full mx-4"
            style={{
              background: 'rgba(10, 10, 10, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
              maxHeight: '70vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-white/10">
              <div className="text-white font-semibold">All States</div>
              <div className="text-xs text-white/50">Click to jump to state</div>
            </div>
            <div className="p-2">
              {allStates.map((state, index) => (
                <button
                  key={state.id}
                  onClick={() => {
                    jumpToState(index);
                    setShowStateList(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-all ${
                    index === currentStateIndex
                      ? 'bg-blue-500/30 text-blue-300'
                      : 'bg-white/5 hover:bg-white/10 text-white/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{state.name}</div>
                      <div className="text-xs text-white/50">{state.description}</div>
                    </div>
                    <div className="text-xs text-white/40">
                      {state.flow === 'nearby' ? '🎯' : '🎮'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spacing Guides Overlay */}
      {showSpacingGuides && (
        <div
          className="fixed inset-0 pointer-events-none z-[99997]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                rgba(255, 0, 255, 0.1) 0px,
                transparent 1px,
                transparent 8px,
                rgba(255, 0, 255, 0.1) 9px
              ),
              repeating-linear-gradient(
                90deg,
                rgba(255, 0, 255, 0.1) 0px,
                transparent 1px,
                transparent 8px,
                rgba(255, 0, 255, 0.1) 9px
              )
            `,
            backgroundSize: '8px 8px',
          }}
        >
          <div className="absolute top-4 left-4 bg-purple-500/80 text-white text-xs px-2 py-1 rounded">
            8px Grid
          </div>
        </div>
      )}
    </>
  );
};
