/**
 * AI Chat History
 * Main orchestrator component for viewing chat and swing analysis history
 * Supports three modes: pane, page, and overlay
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useConversationSession } from '@/hooks/useConversationSession';
import { useCaddieLogs } from '@/hooks/useCaddieLogs';
import { useEchoProtection } from '@/hooks/useEchoProtection';
import { useEchoConversationsOptional } from '@/features/echo/components/EchoConversationsProvider';
import { useEchoLegacyMigration } from '@/features/echo/hooks/useEchoLegacyMigration';
import { analyticsEvents } from '@/utils/analyticsEvents';
import EchoProtection from './EchoProtection';

import {
  useConversationPagination,
  useSwingPagination,
  PaneModeView,
  PageModeView,
  OverlayModeView,
  filterBySearch,
  type AIChatHistoryProps,
  type ExpandedCard,
  type ChatConversation,
  type SwingAnalysis
} from './ai-chat-history';

// Re-export HLSVideoPlayer for backward compatibility
export { HLSVideoPlayer } from './ai-chat-history';

const AIChatHistory: React.FC<AIChatHistoryProps> = ({
  isOpen,
  onClose,
  onSelectMessage,
  onNewConversation,
  defaultCategory,
  initialTab = 'chat',
  paneMode = false,
  layout = 'overlay'
}) => {
  const navigate = useNavigate();
  
  const isPageMode = layout === 'page';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [expandedCard, setExpandedCard] = useState<ExpandedCard | null>(null);

  // Legacy migration
  const {
    hasLegacy,
    needsConsent,
    isMigrating,
    acceptAndMigrate,
    dismissMigration,
  } = useEchoLegacyMigration({ batchSize: 25, requireConsent: true });

  // Echo Protection
  const {
    isProtectionOpen,
    pendingOperation,
    handleProtectionSuccess,
    handleProtectionClose
  } = useEchoProtection();

  // Pagination hooks
  const {
    conversations,
    isLoading: loadingConversations,
    error: errorConversations,
    hasMore,
    page,
    loadPage,
    deleteConversation: removeConversation,
    setConversations
  } = useConversationPagination();

  const {
    swingAnalyses,
    isLoading: loadingSwingAnalyses,
    error: errorSwingAnalyses,
    hasMore: swingHasMore,
    page: swingPage,
    loadPage: loadSwingPage,
    deleteSwingAnalysis: removeSwingAnalysis
  } = useSwingPagination();

  // DB session for single source of truth
  const session = useConversationSession({
    storageKey: 'echo_chat',
    isModalOpen: false
  });

  // Load data when component opens
  useEffect(() => {
    if (isOpen) {
      analyticsEvents.track('hub_echo_open', { category: 'hub' });
      loadPage(0);
      loadSwingPage(0);
    }
  }, [isOpen]);

  // Track tab switches
  useEffect(() => {
    if (isOpen && activeTab) {
      analyticsEvents.track('hub_echo_tab', { category: 'hub', label: activeTab });
    }
  }, [activeTab, isOpen]);

  // Filter conversations based on search
  const filteredConversations = useMemo(() => 
    filterBySearch(conversations, searchQuery, (conv) => [
      conv.title,
      conv.customTitle || '',
      ...conv.messages.map(m => m.content)
    ]),
    [conversations, searchQuery]
  );

  // Filter swing analyses based on search
  const filteredSwingAnalyses = useMemo(() =>
    filterBySearch(swingAnalyses, searchQuery, (analysis) => [
      analysis.save_card,
      analysis.content,
      analysis.title || ''
    ]),
    [swingAnalyses, searchQuery]
  );

  // Handle card expansion with navigation in pane mode
  const handleExpansion = useCallback((
    type: 'chat' | 'caddie' | 'swing',
    id: string,
    element?: HTMLElement,
    source?: 'db' | 'legacy'
  ) => {
    if (paneMode) {
      if (type === 'chat') {
        analyticsEvents.track('hub_echo_history_open', { category: 'hub', label: 'chat', source: source ?? 'db' });
        navigate(`/hub/echo/history/chat/${id}`);
      } else if (type === 'swing') {
        analyticsEvents.track('hub_echo_history_open', { category: 'hub', label: 'swing', source: source ?? 'db' });
        navigate(`/hub/echo/history/swing/${id}`);
      }
      return;
    }

    // Regular expansion behavior for overlay mode
    const newExpanded = expandedCard?.type === type && expandedCard?.id === id ? null : { type, id };
    setExpandedCard(newExpanded);
    
    if (newExpanded && element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [paneMode, expandedCard, navigate]);

  // Delete handlers with toast notifications
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await session.deleteConversation(conversationId);
      removeConversation(conversationId);
      
      if (expandedCard?.type === 'chat' && expandedCard?.id === conversationId) {
        setExpandedCard(null);
      }
      
      toast.success("Conversation deleted");
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error("Couldn't delete conversation");
    }
  }, [session, removeConversation, expandedCard]);

  const deleteSwingAnalysis = useCallback(async (analysisId: string) => {
    try {
      removeSwingAnalysis(analysisId);
      
      if (expandedCard?.type === 'swing' && expandedCard?.id === analysisId) {
        setExpandedCard(null);
      }
      
      toast.success("Analysis deleted");
    } catch (error) {
      console.error('Error deleting swing analysis:', error);
      toast.error("Couldn't delete analysis");
    }
  }, [removeSwingAnalysis, expandedCard]);

  // Shared props for all mode views
  const modeViewProps = {
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
  };

  // Render appropriate mode view
  if (paneMode) {
    return <PaneModeView {...modeViewProps} />;
  }

  if (isPageMode) {
    return <PageModeView {...modeViewProps} />;
  }

  return (
    <>
      <OverlayModeView {...modeViewProps} isOpen={isOpen} />
      
      {/* EchoProtection Modal */}
      {isProtectionOpen && (
        <EchoProtection
          isOpen={isProtectionOpen}
          onClose={handleProtectionClose}
          onSuccess={handleProtectionSuccess}
          operation={pendingOperation}
        />
      )}
    </>
  );
};

export default AIChatHistory;
