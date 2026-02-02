/**
 * Page Mode View
 * Renders the AI Chat History in full-page mode (no chrome)
 */

import React, { memo } from 'react';
import { Search, X, Filter, MessageCircle, BarChart3, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { LegacyImportBanner } from '@/features/echo/components/LegacyImportBanner';
import { LocalTag } from '@/features/echo/components/LocalTag';
import { SkeletonCard, EmptyState, ErrorState } from '../components/HistoryStates';
import type { ModeViewProps } from '../types';

const PageModeView: React.FC<ModeViewProps> = memo(({
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  filteredConversations,
  loadingConversations,
  errorConversations,
  hasMore,
  loadPage,
  page,
  deleteConversation,
  filteredSwingAnalyses,
  loadingSwingAnalyses,
  errorSwingAnalyses,
  swingHasMore,
  loadSwingPage,
  swingPage,
  onSelectMessage,
  navigate,
  needsConsent,
  isMigrating,
  acceptAndMigrate,
  dismissMigration
}) => {
  return (
    <div className="w-full h-full bg-transparent flex flex-col">
      {/* Search & Tabs */}
      <div className="sticky top-0 z-[1] bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="w-full px-4 md:px-5 py-3">
          {/* Search bar */}
          <div className="flex items-center gap-2 mb-3">
            <label className="flex-1 h-11 rounded-lg bg-muted/50 border border-border px-3 flex items-center gap-2 focus-within:bg-muted focus-within:border-border">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search history…"
                className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                onChange={(e) => setSearchQuery(e.target.value)}
                value={searchQuery}
              />
              {searchQuery && (
                <button
                  className="p-1 hover:bg-muted rounded-full transition"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </label>
            <Button variant="secondary" className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="hidden sm:inline text-sm">Filter</span>
            </Button>
          </div>

          {/* Category tabs */}
          <div className="h-11 w-full rounded-full bg-muted/50 border border-border/50 grid grid-cols-2 gap-1 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={cn(
                "rounded-full px-4 text-sm font-medium transition-all",
                activeTab === 'chat'
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              Chat {filteredConversations.length > 0 && <span className="ml-1 opacity-70">({filteredConversations.length})</span>}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('swing')}
              className={cn(
                "rounded-full px-4 text-sm font-medium transition-all",
                activeTab === 'swing'
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              Swing {filteredSwingAnalyses.length > 0 && <span className="ml-1 opacity-70">({filteredSwingAnalyses.length})</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsContent value="chat" className="m-0 flex-1 overflow-y-auto px-4 md:px-5">
            <div className="w-full max-w-3xl mx-auto py-6 space-y-4">
              {/* Legacy import banner */}
              {needsConsent && acceptAndMigrate && dismissMigration && (
                <LegacyImportBanner
                  isMigrating={isMigrating || false}
                  onAccept={acceptAndMigrate}
                  onDismiss={dismissMigration}
                />
              )}
              
              {loadingConversations ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : errorConversations ? (
                <ErrorState message={errorConversations} onRetry={() => loadPage(0)} />
              ) : filteredConversations.length === 0 ? (
                <EmptyState
                  icon={<MessageCircle className="h-10 w-10" />}
                  title="No conversations yet"
                  subtitle="Your chats will appear here once you've started."
                />
              ) : (
                <>
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => onSelectMessage?.(conv.id)}
                      className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate flex items-center">
                            <span className="line-clamp-1">{conv.title}</span>
                            {conv.source === 'legacy' && <LocalTag />}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {conv.messageCount || conv.messages.length} messages · {new Date(conv.lastActivityAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          className="p-2 hover:bg-muted rounded-md transition"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {hasMore && (
                    <div className="flex justify-center py-4">
                      <button
                        className="px-6 py-3 rounded-full bg-muted hover:bg-muted/80 border border-border text-sm font-medium transition"
                        onClick={() => loadPage(page + 1)}
                        disabled={loadingConversations}
                      >
                        {loadingConversations ? 'Loading…' : 'Load more'}
                      </button>
                    </div>
                  )}
                  {!hasMore && filteredConversations.length > 0 && (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      You're all caught up
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="swing" className="m-0 flex-1 overflow-y-auto px-4 md:px-5">
            <div className="w-full max-w-3xl mx-auto py-6 space-y-4">
              {loadingSwingAnalyses ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : errorSwingAnalyses ? (
                <ErrorState message={errorSwingAnalyses} onRetry={() => loadSwingPage(0)} />
              ) : filteredSwingAnalyses.length === 0 ? (
                <EmptyState
                  icon={<BarChart3 className="h-10 w-10" />}
                  title="No swing analyses found"
                  subtitle="Upload a swing video to see analyses here"
                />
              ) : (
                <>
                  {filteredSwingAnalyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      onClick={() => navigate(`/hub/echo/history/swing/${analysis.id}`)}
                      className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {analysis.videoThumbnail && (
                          <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            <img src={analysis.videoThumbnail} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{analysis.title || analysis.save_card}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(analysis.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {swingHasMore && (
                    <div className="flex justify-center py-4">
                      <button
                        className="px-6 py-3 rounded-full bg-muted hover:bg-muted/80 border border-border text-sm font-medium transition"
                        onClick={() => loadSwingPage(swingPage + 1)}
                        disabled={loadingSwingAnalyses}
                      >
                        {loadingSwingAnalyses ? 'Loading…' : 'Load more'}
                      </button>
                    </div>
                  )}
                  {!swingHasMore && filteredSwingAnalyses.length > 0 && (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      You're all caught up
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
});

PageModeView.displayName = 'PageModeView';

export default PageModeView;
