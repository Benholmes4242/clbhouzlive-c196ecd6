/**
 * AI Chat History Types
 * Shared type definitions for the AI Chat History feature
 */

export interface SavedInsight {
  id: string;
  content: string;
  summary: string;
  tags: string[];
  category: string;
  timestamp: Date;
}

export interface SwingAnalysis {
  id: string;
  save_card: string;
  tags: string[];
  category: string;
  content: string;
  videoThumbnail?: string;
  videoSrc?: string;
  videoPoster?: string;
  videoUrl?: string;
  videoId?: string;
  timestamp: Date;
  voiceNote?: string;
  conversation?: Array<{ role: 'user' | 'coach'; content: string; timestamp?: string }>;
  title?: string;
}

export interface CaddieLog {
  id: string;
  content: string;
  transcription: string | null;
  location_name: string | null;
  course_name: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface HistoryMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface ChatConversation {
  id: string;
  title: string;
  customTitle?: string;
  messages: HistoryMessage[];
  timestamp: Date;
  createdAt: Date;
  lastActivityAt: Date;
  messageCount?: number;
  source?: 'db' | 'legacy';
}

export interface AIChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMessage: (message: string) => void;
  onNewConversation?: () => void;
  defaultCategory?: string;
  initialTab?: 'chat' | 'swing';
  paneMode?: boolean;
  layout?: 'overlay' | 'page';
}

export interface LoadingStates {
  conversations: boolean;
  caddieLogs: boolean;
  swingAnalyses: boolean;
}

export interface ErrorStates {
  conversations: string | null;
  caddieLogs: string | null;
  swingAnalyses: string | null;
}

export interface ExpandedCard {
  type: 'chat' | 'caddie' | 'swing';
  id: string;
}

export interface ModeViewProps {
  // Search and filter
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // Conversations
  filteredConversations: ChatConversation[];
  loadingConversations: boolean;
  errorConversations: string | null;
  hasMore: boolean;
  loadPage: (page: number) => void;
  page: number;
  deleteConversation: (id: string) => void;
  
  // Swing analyses
  filteredSwingAnalyses: SwingAnalysis[];
  loadingSwingAnalyses: boolean;
  errorSwingAnalyses: string | null;
  swingHasMore: boolean;
  loadSwingPage: (page: number) => void;
  swingPage: number;
  deleteSwingAnalysis: (id: string) => void;
  
  // Expansion state
  expandedCard: ExpandedCard | null;
  handleExpansion: (type: 'chat' | 'caddie' | 'swing', id: string, element?: HTMLElement, source?: 'db' | 'legacy') => void;
  
  // Callbacks
  onSelectMessage: (message: string) => void;
  onClose: () => void;
  
  // Navigation
  navigate: (path: string) => void;
  isPageMode: boolean;
  
  // Legacy migration
  needsConsent?: boolean;
  isMigrating?: boolean;
  acceptAndMigrate?: () => void;
  dismissMigration?: () => void;
}
