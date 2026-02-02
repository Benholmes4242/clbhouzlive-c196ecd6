/**
 * Pane Mode View
 * Renders the AI Chat History in pane/embedded mode
 */

import React, { memo } from 'react';
import { Search, X, MessageCircle, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LegacyImportBanner } from '@/features/echo/components/LegacyImportBanner';
import { LocalTag } from '@/features/echo/components/LocalTag';
import { SkeletonCard, EmptyState } from '../components/HistoryStates';
import SwingAnalysisCard from '../cards/SwingAnalysisCard';
import type { ModeViewProps } from '../types';

const PaneModeView: React.FC<ModeViewProps> = memo(({
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  filteredConversations,
  loadingConversations,
  hasMore,
  loadPage,
  page,
  filteredSwingAnalyses,
  loadingSwingAnalyses,
  swingHasMore,
  loadSwingPage,
  swingPage,
  deleteSwingAnalysis,
  expandedCard,
  handleExpansion,
  navigate,
  isPageMode,
  needsConsent,
  isMigrating,
  acceptAndMigrate,
  dismissMigration
}) => {
  return (
    <div className={cn(
      "h-full w-full flex flex-col overflow-hidden",
      !isPageMode && "bg-gradient-to-b from-black via-[#0A0A0A] to-black"
    )}>
      {/* Search & Tabs */}
      <div className={cn(
        "border-b border-white/08",
        !isPageMode && "bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm"
      )}>
        <div className={cn(isPageMode ? "px-0 py-3" : "px-4 py-2")}>
          {/* Search bar */}
          <div className="flex items-center gap-2 mb-2">
            <label className="flex-1 h-11 rounded-xl bg-white/06 backdrop-blur border border-white/12 px-3 flex items-center gap-2 transition focus-within:bg-white/08 focus-within:border-white/20">
              <Search className="h-4 w-4 text-white/60" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search Echo…"
                className="w-full bg-transparent outline-none text-body-md text-white placeholder:text-white/40"
                onChange={(e) => setSearchQuery(e.target.value)}
                value={searchQuery}
                aria-label="Search Echo history"
              />
              {searchQuery && (
                <button
                  className="h-7 w-7 grid place-items-center rounded-full hover:bg-white/08 active:scale-[0.98] transition"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-white/60" />
                </button>
              )}
            </label>
          </div>

          {/* Tabs */}
          <div className="h-11 w-full rounded-full bg-white/06 backdrop-blur border border-white/12 grid grid-cols-2 gap-1 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={cn(
                "rounded-full px-4 text-body-md font-medium transition-all",
                activeTab === 'chat'
                  ? "bg-white/05 text-white shadow-[0_0_16px_rgba(255,255,255,0.18)] ring-1 ring-inset ring-white/20" 
                  : "text-white/60 hover:bg-white/05"
              )}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('swing')}
              className={cn(
                "rounded-full px-4 text-body-md font-medium transition-all",
                activeTab === 'swing'
                  ? "bg-white/05 text-white shadow-[0_0_16px_rgba(255,255,255,0.18)] ring-1 ring-inset ring-white/20" 
                  : "text-white/60 hover:bg-white/05"
              )}
            >
              Swing
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className={cn(
        "flex-1 overflow-y-auto",
        isPageMode ? "px-0 pt-4 pb-4" : "px-4 pt-3 pb-4"
      )}>
        {activeTab === 'chat' ? (
          loadingConversations ? (
            <div className="space-y-4">
              <div className="h-24 rounded-xl bg-white/05 animate-pulse" />
              <div className="h-24 rounded-xl bg-white/05 animate-pulse" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-20 text-white/60">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <div className="text-lg font-medium">No conversations yet</div>
              <div className="text-sm mt-1">Your chats will appear here</div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Legacy import banner */}
              {needsConsent && acceptAndMigrate && dismissMigration && (
                <LegacyImportBanner
                  isMigrating={isMigrating || false}
                  onAccept={acceptAndMigrate}
                  onDismiss={dismissMigration}
                />
              )}
              
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleExpansion('chat', conv.id, undefined, conv.source)}
                  className="w-full text-left p-4 rounded-xl bg-white/06 hover:bg-white/10 border border-white/08 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white truncate">{conv.title}</span>
                    {conv.source === 'legacy' && <LocalTag />}
                  </div>
                  <div className="text-sm text-white/60">
                    {conv.messageCount || conv.messages.length} messages • {conv.timestamp.toLocaleDateString()}
                  </div>
                </button>
              ))}
              
              {/* Load more */}
              {hasMore && !loadingConversations && (
                <div className="flex justify-center py-4">
                  <button
                    className="px-6 py-3 rounded-full bg-white/08 hover:bg-white/12 border border-white/12 hover:border-white/20 text-white font-medium transition-all duration-200"
                    onClick={() => loadPage(page + 1)}
                  >
                    Load more
                  </button>
                </div>
              )}
              
              {!hasMore && filteredConversations.length > 0 && (
                <div className="py-4 text-center text-meta text-white/40 select-none">
                  You're all caught up
                </div>
              )}
            </div>
          )
        ) : (
          loadingSwingAnalyses ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : filteredSwingAnalyses.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="h-8 w-8" />}
              title="No swing analyses"
              subtitle="Upload a swing video to get started"
            />
          ) : (
            <div className="space-y-3">
              {filteredSwingAnalyses.map((analysis) => (
                <button
                  key={analysis.id}
                  onClick={() => handleExpansion('swing', analysis.id)}
                  className="w-full text-left p-4 rounded-xl bg-white/06 hover:bg-white/10 border border-white/08 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {analysis.videoThumbnail && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/08 flex-shrink-0">
                        <img src={analysis.videoThumbnail} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{analysis.title || analysis.save_card}</div>
                      <div className="text-sm text-white/60">{analysis.timestamp.toLocaleDateString()}</div>
                    </div>
                  </div>
                </button>
              ))}
              
              {swingHasMore && !loadingSwingAnalyses && (
                <div className="flex justify-center py-4">
                  <button
                    className="px-6 py-3 rounded-full bg-white/08 hover:bg-white/12 border border-white/12 hover:border-white/20 text-white font-medium transition-all duration-200"
                    onClick={() => loadSwingPage(swingPage + 1)}
                  >
                    Load more
                  </button>
                </div>
              )}
              
              {!swingHasMore && filteredSwingAnalyses.length > 0 && (
                <div className="py-4 text-center text-meta text-white/40 select-none">
                  You're all caught up
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
});

PaneModeView.displayName = 'PaneModeView';

export default PaneModeView;
