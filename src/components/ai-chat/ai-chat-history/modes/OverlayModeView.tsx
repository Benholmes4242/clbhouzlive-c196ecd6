/**
 * Overlay Mode View
 * Renders the AI Chat History in slide-over overlay mode
 */

import React, { memo, useMemo } from 'react';
import { X, Search, Filter, MessageCircle, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SlideOver } from '@/components/ui/slide-over';
import { LegacyImportBanner } from '@/features/echo/components/LegacyImportBanner';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { SkeletonCard, EmptyState, ErrorState, NoSearchResults } from '../components/HistoryStates';
import ConversationCardGroup from '../components/ConversationCardGroup';
import SwingAnalysisCard from '../cards/SwingAnalysisCard';
import { groupByTimePeriod } from '../utils/conversationMappers';
import type { ModeViewProps, ChatConversation, SwingAnalysis } from '../types';

interface OverlayModeViewProps extends ModeViewProps {
  isOpen: boolean;
}

const OverlayModeView: React.FC<OverlayModeViewProps> = memo(({
  isOpen,
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
  filteredSwingAnalyses,
  loadingSwingAnalyses,
  errorSwingAnalyses,
  swingHasMore,
  loadSwingPage,
  swingPage,
  deleteSwingAnalysis,
  expandedCard,
  handleExpansion,
  onSelectMessage,
  onClose,
  navigate,
  isPageMode,
  needsConsent,
  isMigrating,
  acceptAndMigrate,
  dismissMigration
}) => {
  // Auto-scroll hooks
  const chatAutoScroll = useAutoScroll({
    dependencies: [filteredConversations, expandedCard],
    enabled: activeTab === 'chat',
    direction: 'top'
  });
  
  const swingAutoScroll = useAutoScroll({
    dependencies: [filteredSwingAnalyses],
    enabled: activeTab === 'swing',
    direction: 'top'
  });

  // Group conversations by time period
  const groupedConversations = useMemo(() => {
    return groupByTimePeriod(filteredConversations);
  }, [filteredConversations]);

  // Group swing analyses by time period  
  const groupedSwingAnalyses = useMemo(() => {
    return {
      last7Days: filteredSwingAnalyses.filter(a => {
        const days = Math.floor((Date.now() - a.timestamp.getTime()) / (1000 * 60 * 60 * 24));
        return days <= 7;
      }),
      thisMonth: filteredSwingAnalyses.filter(a => {
        const days = Math.floor((Date.now() - a.timestamp.getTime()) / (1000 * 60 * 60 * 24));
        return days > 7 && days <= 30;
      }),
      older: filteredSwingAnalyses.filter(a => {
        const days = Math.floor((Date.now() - a.timestamp.getTime()) / (1000 * 60 * 60 * 24));
        return days > 30;
      })
    };
  }, [filteredSwingAnalyses]);

  const handleCollapseCard = () => {
    // This would need to be passed from parent - for now we use handleExpansion with null
  };

  return (
    <SlideOver
      open={isOpen}
      onClose={onClose}
      width="w-full"
      zIndex="z-[1100]"
      ariaLabel="Echo History"
      backdrop="blurred"
    >
      <div className="relative h-full bg-gradient-to-b from-black via-[#0A0A0A] to-black backdrop-blur-xl flex flex-col">
        {/* Header */}
        <header
          className="sticky top-0 z-[2] border-b border-white/08 bg-gradient-to-b from-black/95 to-black/60 backdrop-blur"
          data-echo-topbar
        >
          <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 pt-[max(env(safe-area-inset-top),0px)]">
            <div className="h-14 sm:h-16 grid grid-cols-[auto,1fr,auto] items-center gap-2">
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="h-9 w-9 grid place-items-center rounded-full hover:bg-white/08 active:bg-white/12 transition text-white/80"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="min-w-0 text-center">
                <div className="truncate text-heading-md font-semibold leading-snug text-white">
                  Echo History
                </div>
                <div className="truncate text-body-sm text-white/60 leading-tight">
                  All chats & swing analyses
                </div>
              </div>

              <div className="flex items-center gap-1.5" />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/08" />
        </header>

        {/* Search & Tabs */}
        <div className="sticky top-[56px] sm:top-[64px] z-[1] bg-gradient-to-b from-black/90 to-transparent backdrop-blur-sm border-b border-white/06">
          <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 py-2">
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

              <Button variant="secondary" className="flex items-center gap-1.5" aria-label="Open filters">
                <Filter className="h-4 w-4 text-white/60" />
                <span className="hidden sm:inline">Filter</span>
              </Button>
            </div>

            {/* Tabs */}
            <div className="h-11 w-full rounded-full bg-white/06 backdrop-blur border border-white/12 grid grid-cols-2 gap-1 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={cn(
                  "rounded-full px-4 text-body-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                  activeTab === 'chat'
                    ? "bg-white/05 text-white shadow-[0_0_16px_rgba(255,255,255,0.18)] ring-1 ring-inset ring-white/20" 
                    : "text-white/60 hover:bg-white/05 hover:ring-1 hover:ring-inset hover:ring-white/10"
                )}
              >
                Chat {filteredConversations.length > 0 && <span className="ml-1 opacity-70">({filteredConversations.length})</span>}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('swing')}
                className={cn(
                  "rounded-full px-4 text-body-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                  activeTab === 'swing'
                    ? "bg-white/05 text-white shadow-[0_0_16px_rgba(255,255,255,0.18)] ring-1 ring-inset ring-white/20" 
                    : "text-white/60 hover:bg-white/05 hover:ring-1 hover:ring-inset hover:ring-white/10"
                )}
              >
                Swing {filteredSwingAnalyses.length > 0 && <span className="ml-1 opacity-70">({filteredSwingAnalyses.length})</span>}
              </button>
            </div>

            {/* Results header */}
            {(searchQuery || filteredConversations.length > 0 || filteredSwingAnalyses.length > 0) && (
              <div className="mt-2 text-meta text-white/60">
                {searchQuery ? (
                  <>
                    Results for <span className="font-medium text-white">&ldquo;{searchQuery}&rdquo;</span> · {' '}
                    {activeTab === 'chat' ? filteredConversations.length : filteredSwingAnalyses.length}
                  </>
                ) : (
                  <>
                    {activeTab === 'chat' ? 'Recent conversations' : 'Recent analyses'} · {' '}
                    {activeTab === 'chat' ? filteredConversations.length : filteredSwingAnalyses.length}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            {/* Chat Tab */}
            <TabsContent value="chat" className="m-0 flex-1" style={{ minHeight: 0 }}>
              <div 
                className="h-full overflow-y-auto overscroll-contain scroll-smooth pb-[max(env(safe-area-inset-bottom),0px)]"
                style={{ WebkitOverflowScrolling: "touch" }}
                ref={chatAutoScroll.scrollAreaRef}
              >
                <div className="pointer-events-none absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-black/90 to-transparent z-10" />
                <div className="pointer-events-none absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black/90 to-transparent z-10" />
                
                <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 py-5 space-y-6">
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
                    searchQuery ? (
                      <NoSearchResults onClear={() => setSearchQuery('')} />
                    ) : (
                      <EmptyState
                        icon={<MessageCircle className="h-8 w-8" />}
                        title="No conversations yet"
                        subtitle="Your chats will appear here"
                      />
                    )
                  ) : (
                    <>
                      <ConversationCardGroup
                        title="Today"
                        conversations={groupedConversations.today}
                        expandedCard={expandedCard}
                        onExpand={(id, source) => handleExpansion('chat', id, undefined, source)}
                        onCollapse={() => handleExpansion('chat', '', undefined)}
                        onSelectMessage={onSelectMessage}
                        onClose={onClose}
                      />
                      
                      <ConversationCardGroup
                        title="This Week"
                        conversations={groupedConversations.thisWeek}
                        expandedCard={expandedCard}
                        onExpand={(id, source) => handleExpansion('chat', id, undefined, source)}
                        onCollapse={() => handleExpansion('chat', '', undefined)}
                        onSelectMessage={onSelectMessage}
                        onClose={onClose}
                      />
                      
                      <ConversationCardGroup
                        title="This Month"
                        conversations={groupedConversations.thisMonth}
                        expandedCard={expandedCard}
                        onExpand={(id, source) => handleExpansion('chat', id, undefined, source)}
                        onCollapse={() => handleExpansion('chat', '', undefined)}
                        onSelectMessage={onSelectMessage}
                        onClose={onClose}
                      />
                      
                      <ConversationCardGroup
                        title="Older"
                        conversations={groupedConversations.older}
                        expandedCard={expandedCard}
                        onExpand={(id, source) => handleExpansion('chat', id, undefined, source)}
                        onCollapse={() => handleExpansion('chat', '', undefined)}
                        onSelectMessage={onSelectMessage}
                        onClose={onClose}
                      />
                      
                      {hasMore && !loadingConversations && (
                        <div className="flex justify-center py-6">
                          <button
                            className="px-6 py-3 rounded-full bg-white/08 hover:bg-white/12 border border-white/12 hover:border-white/20 text-white font-medium transition-all duration-200"
                            onClick={() => loadPage(page + 1)}
                          >
                            Load more
                          </button>
                        </div>
                      )}
                      
                      {!hasMore && filteredConversations.length > 0 && (
                        <div className="py-6 text-center text-meta text-white/40 select-none">
                          You're all caught up
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Swing Tab */}
            <TabsContent value="swing" className="m-0 flex-1" style={{ minHeight: 0 }}>
              <div 
                className="h-full overflow-y-auto overscroll-contain scroll-smooth pb-[max(env(safe-area-inset-bottom),0px)]"
                style={{ WebkitOverflowScrolling: "touch" }}
                ref={swingAutoScroll.scrollAreaRef}
              >
                <div className="pointer-events-none absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-black/90 to-transparent z-10" />
                <div className="pointer-events-none absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black/90 to-transparent z-10" />
                
                <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 py-5 space-y-4 sm:space-y-5">
                  {loadingSwingAnalyses ? (
                    <>
                      <SkeletonCard />
                      <SkeletonCard />
                      <SkeletonCard />
                    </>
                  ) : errorSwingAnalyses ? (
                    <ErrorState message={errorSwingAnalyses} onRetry={() => loadSwingPage(0)} />
                  ) : filteredSwingAnalyses.length === 0 ? (
                    searchQuery ? (
                      <NoSearchResults onClear={() => setSearchQuery('')} />
                    ) : (
                      <EmptyState
                        icon={<BarChart3 className="h-8 w-8" />}
                        title="No swing analyses found"
                        subtitle="Upload a swing video to see analyses here"
                      />
                    )
                  ) : (
                    <>
                      {/* Last 7 Days */}
                      {groupedSwingAnalyses.last7Days.length > 0 && (
                        <div>
                          <h3 className="text-body-sm font-medium text-white/80 mb-3">Last 7 Days</h3>
                          <div className="space-y-4 sm:space-y-5">
                            {groupedSwingAnalyses.last7Days.map((analysis) => (
                              <SwingAnalysisCard
                                key={analysis.id}
                                analysis={analysis}
                                onDelete={() => deleteSwingAnalysis(analysis.id)}
                                isExpanded={expandedCard?.type === 'swing' && expandedCard?.id === analysis.id}
                                onToggleExpand={() => handleExpansion('swing', analysis.id)}
                                navigate={navigate}
                                isPageMode={isPageMode}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* This Month */}
                      {groupedSwingAnalyses.thisMonth.length > 0 && (
                        <div>
                          <h3 className="text-body-sm font-medium text-white/80 mb-3">This Month</h3>
                          <div className="space-y-4 sm:space-y-5">
                            {groupedSwingAnalyses.thisMonth.map((analysis) => (
                              <SwingAnalysisCard
                                key={analysis.id}
                                analysis={analysis}
                                onDelete={() => deleteSwingAnalysis(analysis.id)}
                                isExpanded={expandedCard?.type === 'swing' && expandedCard?.id === analysis.id}
                                onToggleExpand={() => handleExpansion('swing', analysis.id)}
                                navigate={navigate}
                                isPageMode={isPageMode}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Older */}
                      {groupedSwingAnalyses.older.length > 0 && (
                        <div>
                          <h3 className="text-body-sm font-medium text-white/80 mb-3">Older</h3>
                          <div className="space-y-4 sm:space-y-5">
                            {groupedSwingAnalyses.older.map((analysis) => (
                              <SwingAnalysisCard
                                key={analysis.id}
                                analysis={analysis}
                                onDelete={() => deleteSwingAnalysis(analysis.id)}
                                isExpanded={expandedCard?.type === 'swing' && expandedCard?.id === analysis.id}
                                onToggleExpand={() => handleExpansion('swing', analysis.id)}
                                navigate={navigate}
                                isPageMode={isPageMode}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {swingHasMore && !loadingSwingAnalyses && (
                        <div className="flex justify-center py-6">
                          <button
                            className="px-6 py-3 rounded-full bg-white/08 hover:bg-white/12 border border-white/12 hover:border-white/20 text-white font-medium transition-all duration-200"
                            onClick={() => loadSwingPage(swingPage + 1)}
                          >
                            Load more
                          </button>
                        </div>
                      )}
                      
                      {!swingHasMore && filteredSwingAnalyses.length > 0 && (
                        <div className="py-6 text-center text-meta text-white/40 select-none">
                          You're all caught up
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SlideOver>
  );
});

OverlayModeView.displayName = 'OverlayModeView';

export default OverlayModeView;
