/**
 * Swing Analysis Card Component
 * Displays a swing analysis with video playback and expandable content
 */

import React, { useState, useRef, memo } from 'react';
import { Trash2, FileText, Minimize2 } from 'lucide-react';
import { PiWaveform } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import HLSVideoPlayer from '../components/HLSVideoPlayer';
import type { SwingAnalysis } from '../types';

interface SwingAnalysisCardProps {
  analysis: SwingAnalysis;
  onDelete: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  navigate?: (path: string) => void;
  isPageMode?: boolean;
}

const SwingAnalysisCard: React.FC<SwingAnalysisCardProps> = memo(({
  analysis,
  onDelete,
  isExpanded,
  onToggleExpand,
  navigate: navigateFn,
  isPageMode
}) => {
  const [thumbnailError, setThumbnailError] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleThumbnailError = () => {
    setThumbnailError(true);
    setThumbnailLoading(false);
  };

  const handleThumbnailLoad = () => {
    setThumbnailLoading(false);
  };

  const handleCardClick = () => {
    if (isExpanded) return;
    
    if (isPageMode && navigateFn) {
      navigateFn(`/hub/echo/history/swing/${analysis.id}`);
    } else {
      onToggleExpand();
    }
  };

  return (
    <article 
      ref={cardRef}
      className={cn(
        "group relative block overflow-hidden rounded-2xl bg-white/06 backdrop-blur border border-white/08 hover:border-white/12",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] active:translate-y-0 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.3)]",
        "focus-visible:outline-none focus-within:ring-2 focus-within:ring-white/20",
        isExpanded && "shadow-lg"
      )}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={`Swing analysis from ${analysis.timestamp.toLocaleDateString()}`}
    >
      {!isExpanded ? (
        <>
          <div className="px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex items-start gap-2">
              <span className="shrink-0 mt-0.5 px-2 h-6 inline-flex items-center gap-1 rounded-md text-meta font-medium bg-white/08 backdrop-blur border border-white/12 text-white/80">
                <PiWaveform className="h-3.5 w-3.5" />
                Swing
              </span>
              
              <div className="min-w-0 flex-1">
                <div className="truncate text-body-md font-semibold text-white">
                  Swing Analysis
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-meta text-white/60">
                  <span className="truncate">
                    {analysis.tags && analysis.tags.length > 0 ? analysis.tags.slice(0, 2).join(' • ') : analysis.content?.substring(0, 60) || 'Golf swing'}
                  </span>
                  <span className="mx-1 h-1 w-1 rounded-full bg-white/20 shrink-0"></span>
                  <time className="shrink-0 text-white/40">{analysis.timestamp.toLocaleDateString()}</time>
                  {analysis.conversation && (
                    <span className="hidden sm:inline text-white/40 shrink-0">• {analysis.conversation.length} msgs</span>
                  )}
                </div>
              </div>
              
              {analysis.videoThumbnail && (
                <div className="shrink-0 h-10 w-10 rounded-xl overflow-hidden bg-white/06 backdrop-blur border border-white/08">
                  {!thumbnailError ? (
                    <img 
                      src={analysis.videoThumbnail} 
                      alt="Swing preview"
                      className="h-full w-full object-cover"
                      onError={handleThumbnailError}
                      onLoad={handleThumbnailLoad}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <FileText className="h-3 w-3 text-white/60" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Hover affordance stripe */}
          <div className="pointer-events-none absolute inset-x-0 -bottom-px h-8 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/06 to-transparent"></div>
          </div>
        </>
      ) : (
        <div className="px-4 sm:px-5 py-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-heading-md font-semibold leading-snug text-white">
              Swing Analysis
            </h3>
            <div className="flex items-center gap-1">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
                aria-label="Collapse"
                className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/08 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 text-white/80"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this swing analysis? This action cannot be undone.')) {
                    onDelete();
                  }
                }}
                aria-label="Delete"
                className="h-8 w-8 grid place-items-center rounded-full hover:bg-red-900/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </button>
            </div>
          </div>

          {/* Expanded Content - Video & Analysis */}
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {/* Video Section */}
            {(analysis.videoUrl || analysis.videoSrc) && !(analysis.videoSrc && analysis.videoSrc.startsWith('blob:')) ? (
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                {isVideoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-muted-foreground/30"></div>
                  </div>
                )}
                <HLSVideoPlayer
                  src={analysis.videoUrl || analysis.videoSrc!}
                  className="w-full h-full"
                />
              </div>
            ) : analysis.videoThumbnail ? (
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img 
                  src={analysis.videoThumbnail} 
                  alt="Swing analysis"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="text-white text-center p-4">
                    <FileText className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm font-medium mb-1">Swing Analysis</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No video available</p>
                </div>
              </div>
            )}
            
            {/* Analysis Content */}
            <div className="space-y-3">
              <h5 className="text-sm font-semibold">Analysis Content</h5>
              {analysis.conversation && analysis.conversation.length > 0 ? (
                <div className="space-y-2">
                  {analysis.conversation.map((message, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-[#3da0a9]/5 border-l-4 border-[#3da0a9]' 
                          : 'bg-muted border-l-4 border-muted-foreground'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className={`text-meta px-2 py-1 rounded-full ${
                          message.role === 'user' ? 'bg-[#3da0a9]/10 text-[#3da0a9]' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {message.role === 'user' ? 'You' : 'Echo Coach'}
                        </div>
                        {message.timestamp && (
                          <span className="text-meta text-muted-foreground">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="text-body-md leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {analysis.content}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
});

SwingAnalysisCard.displayName = 'SwingAnalysisCard';

export default SwingAnalysisCard;
