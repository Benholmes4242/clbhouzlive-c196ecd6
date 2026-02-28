import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, History, Bookmark, MapPin, Mic, MicOff, BookOpen, Paperclip, ArrowUpRight, Settings, Camera, ChevronDown } from 'lucide-react';
import { PiWaveform } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SlideOver } from '@/components/ui/slide-over';
import ChatMessageComponent from './ChatMessage';
import AIChatHistory from './AIChatHistory';
import CaddieLogs from './CaddieLogs';

import EchoAvatar from './EchoAvatar';
import { OverlayFooter } from './OverlayFooter';
import ThreadDivider from '@/features/echo/components/ThreadDivider';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { MarkdownMessage } from './MarkdownMessage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useConversationSession } from '@/hooks/useConversationSession';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import EchoProtection from './EchoProtection';
import { useEchoProtection } from '@/hooks/useEchoProtection';
import { AnimatePresence, motion } from 'framer-motion';
import { subscribeAIOverlay, type AITab } from '@/controllers/aiOverlayController';
import { Z } from '@/config/zIndex';
import { useAutoSendFromQuery } from './hooks/useAutoSendFromQuery';
import { ensureThreadId, persistUserMessage, persistAssistantMessage } from '@/features/echo/services/echoPersistence';
import { FrostedPill } from '@/components/shared/FrostedPill';
import { EchoTypingBar } from './EchoTypingBar';
import { useUserProfile } from '@/hooks/useUserProfile';

interface ChatMessageData {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface AIChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onHistoryStateChange?: (isHistoryOpen: boolean) => void;
  initialTab?: AITab;
  paneMode?: boolean; // NEW - render as inline pane without modal chrome
  layout?: 'overlay' | 'page'; // NEW - page mode strips all chrome for Hub integration
}

const suggestedPrompts = [
  { text: "when is the next major?", emoji: "🏆" },
  { text: "Where should my ball position be?", emoji: "💭" },
  { text: "Best golf clubs near me", emoji: "📍" },
  { text: "Which driver loft should I use at 95 mph swing speed?", emoji: "🏌️" },
  { text: "Plan me a 5 course USA golf trip", emoji: "🚩" }
];

const AIChatOverlay: React.FC<AIChatOverlayProps> = ({ isOpen, onClose, onHistoryStateChange, initialTab, paneMode = false, layout = 'overlay' }) => {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyInitialTab, setHistoryInitialTab] = useState<'chat'>('chat');
  const [userLocation, setUserLocation] = useState<string>('');
  const [activeTab, setActiveTab] = useState('chat');
  const [analysisText, setAnalysisText] = useState('');
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  

  // Get current user ID for profile
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  // Fetch user profile
  const { data: userProfile } = useUserProfile(currentUserId);

  // Echo Protection System
  const {
    isProtectionOpen,
    pendingOperation,
    requestEchoAccess,
    handleProtectionSuccess,
    handleProtectionClose
  } = useEchoProtection();

  // Conversation session management - for history only, don't restore messages in modal
  const conversationSession = useConversationSession({
    storageKey: 'clbhouz_ai_chat',
    isModalOpen: isOpen // Use actual modal state to properly save conversations
  });

  // Auto-scroll for chat messages
  const chatAutoScroll = useAutoScroll({
    dependencies: [messages],
    enabled: true,
    direction: 'bottom' // Chat messages are added at the bottom
  });

  // Auto-scroll for caddie logs (shared with CaddieLogs component)
  const logsAutoScroll = useAutoScroll({
    dependencies: [], // CaddieLogs will manage its own dependencies
    enabled: true,
    direction: 'top' // Latest logs are at the top
  });

  async function handleVoiceNote(transcribedText: string) {
    try {
      // Get current location for the note
      let locationData: { lat?: number; lng?: number; name?: string } = {};
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          
          locationData.lat = position.coords.latitude;
          locationData.lng = position.coords.longitude;
          
          // Get location name
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
          );
          const data = await response.json();
          locationData.name = `${data.city || data.locality || ''}, ${data.principalSubdivision || ''}`.trim().replace(/^,\s*/, '');
        } catch (error) {
          console.log('Location access denied or failed');
        }
      }

      // Auto-tag golf terms
      const autoTagGolfTerms = (content: string): string[] => {
        const golfTerms = [
          'tree', 'bunker', 'green', 'slope', 'yardage', 'carry', 'pin', 'flag',
          'fairway', 'rough', 'water', 'hazard', 'dogleg', 'elevation', 'wind',
          'left', 'right', 'center', 'front', 'back', 'avoid', 'target'
        ];
        
        const foundTerms = golfTerms.filter(term => 
          content.toLowerCase().includes(term)
        );
        
        return [...new Set(foundTerms)]; // Remove duplicates
      };

      const tags = autoTagGolfTerms(transcribedText);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Save to caddie logs
      const { error } = await supabase
        .from('caddie_logs')
        .insert({
          user_id: user.id,
          content: transcribedText,
          transcription: transcribedText,
          location_lat: locationData.lat,
          location_lng: locationData.lng,
          location_name: locationData.name,
          tags: tags.length > 0 ? tags : null
        });

      if (error) throw error;

      toast.success("Caddie note saved", { description: "Your voice note has been added to your caddie logs" });


    } catch (error) {
      console.error('Error saving voice note:', error);
      toast.error("Error saving note", { description: "Failed to save your caddie note. Please try again." });
    }
  }

  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceRecording({
    onTranscriptionComplete: handleVoiceNote
  });

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        setShowScrollToBottom(false);
        setNewMessageCount(0);
      }
    }, 100);
  };

  // Track scroll position for "back to latest" FAB
  const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowScrollToBottom(!isNearBottom && messages.length > 3);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Notify parent about history state changes
  useEffect(() => {
    if (onHistoryStateChange) {
      onHistoryStateChange(showHistory);
    }
  }, [showHistory, onHistoryStateChange]);

  // Listen to controller for tab changes
  useEffect(() => {
    return subscribeAIOverlay((shouldOpen, tab) => {
      if (shouldOpen && tab) {
        setActiveTab(tab);
      }
    });
  }, []);

  // Ensure fresh start when modal opens
  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setInputValue('');
      // Set initial tab from props or default to chat
      setActiveTab(initialTab || 'chat');
    }
  }, [isOpen, initialTab]);

  // Auto-send message from URL query param (pane mode only, chat tab)
  useAutoSendFromQuery((msg) => {
    if (paneMode && activeTab === 'chat' && isOpen) {
      sendMessage(msg);
    }
  }, { param: 'msg', maxLen: 800, stripOn: 'always' });

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
            );
            const data = await response.json();
            const location = `${data.city || data.locality || ''}, ${data.principalSubdivision || ''}`.trim().replace(/^,\s*/, '');
            setUserLocation(location);
            toast.success("Location detected", { description: `Using ${location} for location-based queries` });
          } catch (error) {
            console.error('Error getting location name:', error);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error("Location access denied", { description: "Please enable location access or specify your city manually" });
        }
      );
    }
  };

  const handleClose = () => {
    // The conversation session hook will automatically save when modal closes
    // due to isModalOpen changing from true to false
    
    // Always reset chat for fresh session - don't restore previous messages
    setMessages([]);
    setInputValue('');
    setActiveTab('chat');
    
    // Close modal
    onClose();
  };

  const sendMessage = async (messageText: string, detailMode = false) => {
    if (!messageText.trim()) return;

    const userMessage: ChatMessageData = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    };


    setMessages(prev => [...prev, userMessage]);
    
    // Add user message to conversation session for history tracking
    conversationSession.addMessage(userMessage);
    setInputValue('');
    setIsLoading(true);

    try {
      // Persist user message to database
      const threadId = await ensureThreadId();
      await persistUserMessage(threadId, messageText);
      // Prepare conversation context (last 6 messages for context)
      const conversation = messages.slice(-6).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Add location context if available and message contains "near me"
      let finalMessage = messageText;
      if (messageText.toLowerCase().includes('near me') && userLocation) {
        finalMessage = messageText.replace(/near me/gi, `near ${userLocation}`);
      } else if (messageText.toLowerCase().includes('near me') && !userLocation) {
        // Ask for location if not available
        const aiMessage: ChatMessageData = {
          id: Date.now().toString() + '_ai',
          type: 'ai',
          content: "I'd love to help you find golf options nearby! Could you please share your city or postcode?",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('clbhouz-pro-ai', {
        body: {
          message: finalMessage,
          conversation,
          detailMode,
          isEcho: true // Enable Echo mode for chat
        }
      });

      if (error) throw error;

      const aiMessage: ChatMessageData = {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        metadata: {
          ...data.metadata,
          modeUsed: data.modeUsed,
          sources: data.sources,
          provider: data.meta?.provider,
          asOf: data.meta?.now,
          latencyMs: data.meta?.latencyMs
        }
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Add AI response to conversation session for history tracking
      conversationSession.addMessage(aiMessage);

      // Persist assistant message to database (reuse threadId from above)
      await persistAssistantMessage(threadId, data.response);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Couldn't get response", { description: "Please try again" });

      const errorMessage: ChatMessageData = {
        id: Date.now().toString() + '_error',
        type: 'ai',
        content: "Sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const saveToInsights = (message: ChatMessageData) => {
    if (!message.metadata) return;
    
    const savedInsights = JSON.parse(localStorage.getItem('clbhouz_ai_saved') || '[]');
    const insight = {
      id: message.id,
      content: message.content,
      summary: message.metadata.save_card,
      tags: message.metadata.tags || [],
      category: message.metadata.category || 'General',
      timestamp: message.timestamp
    };
    
    savedInsights.push(insight);
    localStorage.setItem('clbhouz_ai_saved', JSON.stringify(savedInsights));
    
    toast.success("Saved to Insights", { description: "This tip has been saved to your AI insights" });
  };

  const requestMoreDetail = (originalMessage: string) => {
    sendMessage(originalMessage, true);
  };

  // Helper to open history
  const openHistory = () => {
    setHistoryInitialTab('chat');
    setShowHistory(true);
  };

  // Handle exit animation cleanup
  const handleExitComplete = useCallback(() => {
    // Cleanup that previously depended on immediate unmount
    console.log('Echo exit animation completed');
  }, []);


  // Determine avatar state based on recording/processing state
  const getAvatarState = () => {
    if (isProcessing) return 'processing';
    if (isRecording) return 'listening';
    return 'idle';
  };

  // Pane mode: render inner content without SlideOver modal chrome (Hub provides tabs)
  if (paneMode) {
    const isPageMode = layout === 'page';
    return (
      <div className={cn(
        "h-full w-full flex flex-col overflow-hidden",
        !isPageMode && "bg-gradient-to-b from-black via-[#0A0A0A] to-black"
      )}>
        {/* Tabs - Hidden in pane mode since Hub shell provides main tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">

          {/* Chat Tab */}
          <TabsContent value="chat" className="m-0 flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            <div 
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              className={cn(
                "h-full overflow-y-auto overscroll-contain scroll-smooth"
              )}
              style={{ 
                WebkitOverflowScrolling: "touch",
                paddingTop: isPageMode 
                  ? `calc(var(--header-h) + env(safe-area-inset-top, 0px) + 12px)`
                  : '28px',
                paddingLeft: '16px',
                paddingRight: '16px',
                paddingBottom: isPageMode ? '112px' : '16px',
                scrollPaddingBottom: '86px',
                maskImage: 'linear-gradient(180deg, #000 88%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(180deg, #000 88%, transparent 100%)',
              }}
              ref={chatScrollRef}
              onScroll={handleChatScroll}
            >
                  {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center space-y-6" style={{ paddingTop: '64px', paddingBottom: '64px' }}>
                  <EchoAvatar state="idle" size={80} />
                  <div className="font-display text-heading-lg font-semibold leading-snug text-white">
                    Start a conversation with Echo
                  </div>
                  <div className="text-body-md text-white/60 max-w-[280px]">
                    Ask about your swing, your stats, or just chat golf — Echo's always here.
                  </div>
                </div>
              ) : (
                <ul className="list-none p-0 m-0">
                  {messages.map((message, index) => {
                    const isUser = message.type === 'user';
                    
                    return (
                      <React.Fragment key={message.id}>
                        <li 
                          className={isUser ? 'eh-line eh-line--user' : 'eh-line eh-line--echo'}
                          aria-label={isUser ? 'You' : 'Echo'}
                        >
                          {/* Left side: Echo avatar or spacer */}
                          {!isUser ? (
                            <div className="eh-line__avatar">
                              <EchoAvatar state="idle" size={28} />
                            </div>
                          ) : (
                            <div className="eh-line__pad" />
                          )}

                          {/* Content */}
                          <div className="eh-bubble">
                            <div className="eh-msg__label">{isUser ? 'YOU' : 'ECHO'}</div>
                            <div className="eh-text">
                              <MarkdownMessage content={message.content} />
                            </div>
                          </div>

                          {/* Right side: User avatar or spacer */}
                          {isUser ? (
                            <div className="eh-line__avatar">
                              {userProfile?.profile_photo_url ? (
                                <SquircleAvatar
                                  size={28}
                                  src={userProfile.profile_photo_url}
                                  alt={userProfile?.display_name || userProfile?.username || 'User'}
                                />
                              ) : (
                                 <div 
                                   className="flex items-center justify-center text-meta font-medium text-white/90"
                                   style={{
                                     width: 28,
                                     height: 28,
                                     background: 'rgba(255,255,255,0.1)',
                                     border: '1px solid rgba(255,255,255,0.2)',
                                     borderRadius: '8px',
                                   }}
                                 >
                                   {userProfile?.display_name?.[0]?.toUpperCase() || userProfile?.username?.[0]?.toUpperCase() || 'U'}
                                 </div>
                              )}
                            </div>
                          ) : (
                            <div className="eh-line__pad" />
                          )}
                        </li>
                        
                        {/* Add divider between messages, but not after the last one */}
                        {index < messages.length - 1 && <ThreadDivider />}
                      </React.Fragment>
                    );
                  })}
                  {isLoading && (
                    <>
                      {messages.length > 0 && <ThreadDivider />}
                      <li className="eh-line eh-line--echo" aria-label="Echo">
                        <div className="eh-line__avatar">
                          <EchoAvatar state="idle" size={28} />
                        </div>
                        <div className="eh-bubble">
                          <div className="eh-msg__label">ECHO</div>
                          <div className="eh-text">
                            <div className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '-0.2s' }}></span>
                              <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce"></span>
                              <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            </div>
                          </div>
                        </div>
                        <div className="eh-line__pad" />
                      </li>
                    </>
                  )}
                </ul>
              )}

              {/* Scroll to bottom button */}
              {showScrollToBottom && (
                <Button
                  variant="secondary"
                  onClick={scrollToBottom}
                  className="fixed bottom-[88px] right-3 z-[2] flex items-center gap-2"
                  aria-label="Jump to latest"
                >
                  <span className="inline-block h-4 w-4 rounded-full grid place-items-center bg-white/08">
                    <ChevronDown className="h-3 w-3" />
                  </span>
                  <span>Newer messages</span>
                </Button>
              )}
            </div>
          </TabsContent>

        </Tabs>

        {/* Composer footer (chat only) */}
        {activeTab === 'chat' && (
          <footer 
            className={cn(
              "sticky bottom-0 safe-bottom",
              isPageMode 
                ? "border-t" 
                : "bg-gradient-to-t from-black/95 to-black/60 backdrop-blur border-t"
            )}
            style={{
              zIndex: Z.composer,
              paddingTop: isPageMode ? '16px' : '16px',
              paddingBottom: isPageMode 
                ? 'calc(16px + env(safe-area-inset-bottom, 0px))' 
                : 'calc(16px + env(safe-area-inset-bottom, 0px))',
              paddingLeft: '16px',
              paddingRight: '16px',
              ...(isPageMode ? {
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderTopColor: 'rgba(255,255,255,0.12)',
                borderLeft: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                contain: 'paint',
              } : {
                borderTopColor: 'var(--header-border, rgba(255,255,255,0.1))',
              }),
            }}
            role="region"
            aria-label="Message composer"
          >
            {(isLoading || isProcessing) && (
              <div className="absolute left-0 right-0 top-0 h-[2px] bg-white/20 overflow-hidden">
                <div 
                  className="h-full"
                  style={{
                    width: '33.33%',
                    background: 'rgba(255,255,255,0.60)',
                    animation: 'progressShimmer 1.6s linear infinite'
                  }}
                />
              </div>
            )}
            
            
            {isPageMode ? (
              <div className="relative flex items-center" style={{ height: '40px' }}>
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(inputValue);
                    }
                  }}
                  placeholder="Ask Echo…"
                  className="w-full outline-none text-white placeholder:text-white/70 text-body-md focus-ring"
                  style={{
                    height: '40px',
                    borderRadius: '14px',
                    padding: '0 44px 0 14px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  disabled={isLoading}
                />
                <button
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  className="flex items-center justify-center transition-colors disabled:opacity-40 focus-ring"
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '34px',
                    height: '34px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.10)',
                    cursor: inputValue.trim() ? 'pointer' : 'default',
                    lineHeight: 0,
                  }}
                  aria-label="Send"
                >
                  <Send className="h-4 w-4 text-white/90" />
                </button>
              </div>
            ) : (
              <FrostedPill 
                variant="input"
                className="relative flex-1 h-[44px] flex items-center pr-12"
              >
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(inputValue);
                    }
                  }}
                  placeholder="Ask Echo…"
                  className="w-full bg-transparent outline-none text-white placeholder:text-white/70 text-body-md"
                  disabled={isLoading}
                />
                <button
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 shrink-0 w-9 h-9 rounded-full bg-white/8 border border-white/15 flex items-center justify-center hover:bg-white/12 active:bg-white/16 transition-colors disabled:opacity-50"
                  style={{ lineHeight: 0 }}
                  aria-label="Send"
                >
                  <Send className="h-[18px] w-[18px] text-white/90" />
                </button>
              </FrostedPill>
            )}
          </footer>
        )}
      </div>
    );
  }

  const isPageMode = layout === 'page';

  // In page mode, render without SlideOver wrapper and chrome
  if (isPageMode) {
    return (
      <div className="w-full h-full bg-transparent flex flex-col">
        {/* No header in page mode - Hub provides it */}
        
        {/* Segmented Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          {/* Tabs */}
          <div className="sticky top-0 z-[1] bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="w-full px-4 md:px-5 py-0">
              <TabsList className="h-11 w-full rounded-full bg-muted/50 border border-border/50 flex p-1">
                <TabsTrigger
                  value="chat"
                  className="flex-1 rounded-full px-4 text-sm font-medium 
                             data-[state=active]:bg-background data-[state=active]:shadow-sm
                             transition-all"
                >
                  Chat
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Content area - no internal padding */}
          <TabsContent value="chat" className="m-0 flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            <div 
              className="h-full overflow-y-auto px-4 md:px-5"
              ref={chatScrollRef}
              onScroll={handleChatScroll}
            >
              <div className="w-full max-w-3xl mx-auto pb-6 space-y-4">
                {/* Messages */}
                {messages.length === 0 && (
                  <div className="text-center py-12 space-y-6">
                    <EchoAvatar state="idle" size={64} />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Chat with Echo</h3>
                      <p className="text-sm text-muted-foreground">Ask me anything about golf</p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                      {suggestedPrompts.slice(0, 4).map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestedPrompt(prompt.text)}
                          className="px-4 py-2 rounded-full bg-muted hover:bg-muted/80 text-sm transition-colors"
                        >
                          {prompt.emoji} {prompt.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <ChatMessageComponent
                    key={message.id}
                    message={message}
                    onSaveToInsights={() => saveToInsights(message)}
                  />
                ))}

                {isLoading && (
                  <div className="flex items-start gap-3">
                    <EchoAvatar state="processing" size={32} />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

        </Tabs>

        {/* Input bar - docked at bottom */}
        <footer className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur-sm">
          <div className="w-full px-4 md:px-5 py-3" style={{ paddingBottom: `calc(12px + env(safe-area-inset-bottom))` }}>
            {activeTab === 'chat' && (
              <FrostedPill 
                variant="input"
                className="relative flex items-center pr-12"
              >
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(inputValue);
                    }
                  }}
                  placeholder="Ask Echo…"
                  className="w-full bg-transparent outline-none text-white placeholder:text-white/70 text-body-md py-2"
                  disabled={isLoading}
                />
                <button
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 shrink-0 w-9 h-9 rounded-full bg-white/8 border border-white/15 flex items-center justify-center hover:bg-white/12 active:bg-white/16 transition-colors disabled:opacity-50"
                  style={{ lineHeight: 0 }}
                  aria-label="Send"
                >
                  <Send className="h-[18px] w-[18px] text-white/90" />
                </button>
              </FrostedPill>
            )}
          </div>
        </footer>
      </div>
    );
  }

  return (
    <>
      <SlideOver
        open={isOpen}
        onClose={handleClose}
        width="w-full"
        zIndex={`z-[${Z.aiOverlay}]`}
        ariaLabel="Echo AI chat interface"
        backdrop="blurred"
      >
      {/* Panel shell - dark gradient background */}
      <div 
        className="relative h-full bg-gradient-to-b from-black via-[#0A0A0A] to-black backdrop-blur-xl flex flex-col"
        onWheel={(e) => {
          // Allow scrolling within the modal, but prevent it from bubbling up
          const target = e.currentTarget;
          const scrollableElement = target.querySelector('[data-radix-scroll-area-viewport]');
          
          if (scrollableElement) {
            const { scrollTop, scrollHeight, clientHeight } = scrollableElement;
            const isAtTop = scrollTop === 0;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
            
            // Only prevent default if we're trying to scroll past boundaries
            if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
              e.preventDefault();
            }
          }
          
          e.stopPropagation();
        }}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header
          className="sticky top-0 z-[2] border-b border-white/08 bg-gradient-to-b from-black/95 to-black/60 backdrop-blur"
          data-echo-topbar
        >
            {/* Top progress bar when loading */}
            {isLoading && (
              <div 
                className="fixed top-[var(--overlay-top,0px)] left-0 right-0 h-[2px] z-[1300] overflow-hidden"
                role="progressbar"
                aria-label="Generating response"
              >
                <div 
                  className="h-full bg-gradient-to-r from-white/40 via-white/60 to-white/40"
                  style={{
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.6s linear infinite'
                  }}
                />
              </div>
            )}
            
            <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 pt-[max(env(safe-area-inset-top),0px)]">
              <div className="h-14 sm:h-16 grid grid-cols-[auto,1fr,auto] items-center gap-2">
                {/* Left: close button */}
                <button
                  type="button"
                  aria-label="Close"
                  onClick={handleClose}
                  className="h-9 w-9 grid place-items-center rounded-md hover:bg-white/08 transition"
                >
                  <X className="h-5 w-5 text-white/80" />
                </button>

                {/* Center: title/meta */}
                <div className="min-w-0 text-center">
                  <div className="truncate text-heading-md font-semibold leading-snug text-white">
                    Echo
                  </div>
                  <div className="truncate text-meta text-white/60 leading-tight">
                    {isLoading ? "Echo is typing…" : "Chat • Private & secure"}
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-1.5">
                  {/* Removed back arrow icon */}
                </div>
              </div>
            </div>
            {/* hairline highlight */}
            <div className="h-[1px] bg-white/10"></div>
          </header>

          {/* Segmented Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            {/* Tabs under header */}
            <div className="sticky top-[56px] sm:top-[64px] z-[1] bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm border-b border-white/08">
              <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 py-2">
                <TabsList className="h-11 w-full rounded-full bg-white/06 backdrop-blur border border-white/12 flex p-1">
                  <TabsTrigger
                    value="chat"
                    className="flex-1 rounded-full px-4 text-body-md font-medium 
                               data-[state=active]:bg-white/05 data-[state=active]:text-white data-[state=active]:shadow-[0_0_16px_rgba(255,255,255,0.18)] data-[state=active]:ring-1 data-[state=active]:ring-inset data-[state=active]:ring-white/20
                               data-[state=inactive]:text-white/60 data-[state=inactive]:hover:bg-white/05 data-[state=inactive]:hover:ring-1 data-[state=inactive]:hover:ring-inset data-[state=inactive]:hover:ring-white/10
                               transition-all"
                  >
                    Chat
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Scrollable content area */}
            <TabsContent value="chat" className="m-0 flex-1 overflow-hidden" style={{ minHeight: 0 }}>
              <div 
                className="h-full overflow-y-auto overscroll-contain scroll-smooth px-4 pt-7 pb-4"
                style={{ WebkitOverflowScrolling: "touch" }}
                data-echo-canvas
                ref={chatScrollRef}
                onScroll={handleChatScroll}
              >
                {/* Top fade - Phase 52 */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black/90 to-transparent z-10" />
                {/* Bottom fade - Phase 52 */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/60 to-transparent z-10" />
                
                {/* "New replies below" toast - Phase 59 */}
                {showScrollToBottom && newMessageCount > 0 && (
                  <div className="sticky top-2 z-[1] mx-auto w-full max-w-[720px] px-3 sm:px-4 pointer-events-none">
                    <div 
                     className="mx-auto w-fit px-3 py-1.5 rounded-full bg-white/85 backdrop-blur border border-black/10 text-meta text-gray-700 shadow-sm"
                      data-visible="true"
                    >
                      New replies below
                    </div>
                  </div>
                )}
                
                {/* Unread above notice (sticky hint at top while scrolling) */}
                {false && ( /* Set to true to show "unread above" indicator */
                  <div 
                    className="sticky top-2 z-10 flex justify-center opacity-100 transition-opacity"
                    data-show="true"
                  >
                    <div className="px-3 py-1.5 rounded-full bg-white/80 backdrop-blur border border-black/10 text-meta text-gray-600 shadow-sm">
                      Unread messages above
                    </div>
                  </div>
                )}
                
                <div>
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center px-6 py-20 sm:py-28 space-y-6">
                        <EchoAvatar state="idle" size={72} />
                        <div className="font-display text-heading-lg font-semibold leading-snug text-white">
                          Start a conversation with Echo
                        </div>
                        <div className="text-body-md text-white/60 max-w-[280px]">
                          Ask about your swing, your stats, or just chat golf — Echo's always here.
                        </div>
                      </div>
                    ) : (
                <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 pb-5 space-y-2">
                  {messages.map((message, index) => {
                    const isUser = message.type === 'user';
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const isFirstInGroup = !prevMessage || prevMessage.type !== message.type;
                    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
                    const isLastInGroup = !nextMessage || nextMessage.type !== message.type;
                    
                    // Example: mark message at index 3 as first unread (UI only)
                    const isFirstUnread = false; // Set to true on a specific message to show separator
                    
                    return (
                      <div key={message.id}>
                        {/* "Unread" divider - Phase 59 */}
                        {isFirstUnread && (
                          <div className="relative my-6 flex items-center gap-3" role="separator" aria-label="Unread messages">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-black/15 to-transparent"></div>
                            <div className="px-2 py-0.5 rounded-full bg-white/85 backdrop-blur border border-black/10 text-meta text-gray-600 shadow-sm">
                              Unread
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-black/15 to-transparent"></div>
                          </div>
                        )}
                        
                        <div 
                          className={cn(
                            "w-full",
                            isFirstInGroup && index > 0 && "mt-4"
                          )}
                        >
                          <ChatMessageComponent
                            message={message}
                            onSaveToInsights={saveToInsights}
                            onRequestDetail={requestMoreDetail}
                            isFirstInGroup={isFirstInGroup}
                            showHeading={isFirstInGroup}
                            showActions={false}
                          />
                        </div>
                      </div>
                    );
                  })}
                    {isLoading && (
                    <div className="mt-4 px-4 flex items-end gap-2">
                      <EchoAvatar state="processing" size={28} />
                      <div className="flex-1">
                        <div className="rounded-[var(--bubble-radius)] bg-white/05 border border-white/12 shadow-[0_10px_28px_rgba(0,0,0,0.4)] px-3 py-2" style={{ minHeight: 'calc(var(--bubble-pad-y) * 2 + 20px)' }}>
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '-0.2s' }}></span>
                            <span className="h-1.5 w-1.5 rounded-full bg-white/80 animate-bounce"></span>
                            <span className="h-1.5 w-1.5 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <EchoTypingBar />
                        </div>
                      </div>
                    </div>
                     )}
                         </div>
                       )}

                {/* "New since you left" banner (optional header slot) */}
                {false && ( /* Set to true to show header banner style */
                  <div className="sticky top-0 z-[0] bg-gradient-to-b from-white/40 to-transparent backdrop-blur-sm">
                    <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 py-2">
                      <div className="h-9 w-full rounded-full bg-white/90 backdrop-blur border border-black/10 shadow-sm px-3 flex items-center justify-between text-meta text-gray-700">
                        <span className="truncate">New since your last visit</span>
                        <span className="ml-2 rounded-full px-2 py-0.5 bg-black/5 border border-black/10 text-meta">3</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom pill for new messages when at bottom */}
                {newMessageCount > 0 && !showScrollToBottom && (
                  <div className="fixed bottom-[96px] left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur border border-black/10 shadow-sm text-meta text-gray-700 pointer-events-auto float-in opacity-0 data-[visible=true]:opacity-100 transition-opacity duration-200" data-visible="true">
                    {newMessageCount} new {newMessageCount === 1 ? 'message' : 'messages'} • Tap to view
                  </div>
                )}

                {/* Scroll-to-bottom FAB - Phase 59 */}
                {showScrollToBottom && (
                  <Button
                    variant="secondary"
                    onClick={scrollToBottom}
                    className="fixed md:absolute bottom-[88px] right-3 md:right-4 z-[2] flex items-center gap-2"
                    aria-label="Jump to latest"
                    data-visible="true"
                  >
                    {/* Down chevron icon */}
                    <span className="inline-block h-4 w-4 rounded-full grid place-items-center bg-white/08">
                      <ChevronDown className="h-3 w-3" />
                    </span>
                    <span>Newer messages</span>
                    {/* Optional unread count badge */}
                    {newMessageCount > 0 && (
                      <span className="ml-0.5 rounded-full bg-white/20 text-white px-2 py-0.5 text-meta font-medium">
                        {newMessageCount}
                      </span>
                    )}
                  </Button>
                )}
                </div>
              </div>
            </TabsContent>

          </Tabs>
        
        {/* Composer footer */}
        <footer 
          className="sticky bottom-0 z-[2] bg-gradient-to-t from-white/95 to-white/40 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md pt-3 pb-[calc(env(safe-area-inset-bottom)+8px)] px-4"
          role="region"
          aria-label="Message composer"
          data-echo-composer
          data-streaming={isLoading ? "true" : "false"}
        >
            
            <div className="mx-auto w-full max-w-[720px] space-y-2">
              {activeTab === 'chat' && (
                <div className="space-y-2">
                  {/* Attachments tray - Phase 58 */}
                  <div 
                    className={cn(
                      "mb-2 transition-[height,opacity,transform] duration-200",
                      "data-[open=false]:opacity-0 data-[open=false]:-translate-y-1 data-[open=false]:h-0 data-[open=false]:overflow-hidden",
                      "data-[open=true]:opacity-100 data-[open=true]:translate-y-0 data-[open=true]:h-auto"
                    )}
                    data-open="false"
                    id="attachmentsTray"
                  >
                    <div className="rounded-2xl border border-white/12 bg-white/05 backdrop-blur px-3 py-2.5 grid grid-cols-3 gap-2">
                      {/* Photo tile */}
                      <button 
                        className="h-20 rounded-xl bg-white/05 border border-white/12 shadow-sm hover:-translate-y-0.5 transition-all duration-motion-fast ease-standard flex flex-col items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                        aria-label="Photo"
                        type="button"
                      >
                        <Camera className="h-5 w-5 text-white/80" />
                        <span className="text-meta text-white/60">Photo</span>
                      </button>
                      
                      {/* File tile */}
                      <button 
                        className="h-20 rounded-xl bg-white/05 border border-white/12 shadow-sm hover:-translate-y-0.5 transition-all duration-motion-fast ease-standard flex flex-col items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                        aria-label="File"
                        type="button"
                      >
                        <Paperclip className="h-5 w-5 text-white/80" />
                        <span className="text-meta text-white/60">File</span>
                      </button>
                      
                      {/* Link tile */}
                      <button 
                        className="h-20 rounded-xl bg-white/05 border border-white/12 shadow-sm hover:-translate-y-0.5 transition-all duration-motion-fast ease-standard flex flex-col items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                        aria-label="Link"
                        type="button"
                      >
                        <svg className="h-5 w-5 text-white/80" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                        </svg>
                        <span className="text-meta text-white/60">Link</span>
                      </button>
                    </div>
                  </div>

                  {/* Main composer pill - Primary CTA with glassmorphic styling */}
                  <div 
                    className={cn(
                      "group/input rounded-[24px] px-4 py-3",
                      "bg-white/05 backdrop-blur-md border border-white/12",
                      "[background-clip:padding-box] shadow-[0_8px_24px_rgba(0,0,0,0.6)]",
                      "ring-1 ring-inset ring-white/20 focus-within:ring-white/40 focus-within:bg-white/08",
                      "active:scale-[0.99] transition",
                      "grid grid-cols-[auto,1fr,auto] items-center gap-2 min-h-[56px]"
                    )}
                  >
                    {/* Left tools */}
                    <div className="flex items-center gap-1.5">
                      {isRecording ? (
                        <div className="h-7 px-2.5 rounded-full bg-red-900/20 border border-red-500/30 text-red-400 text-meta inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                          Recording…
                        </div>
                      ) : isProcessing ? (
                        <div className="h-7 px-2.5 rounded-full bg-black/05 border border-black/12 text-meta text-black/80 inline-flex items-center gap-1.5">
                          <span className="h-3 w-3 border-2 border-black/60 border-t-transparent rounded-full animate-spin"></span>
                          Processing…
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            aria-label="Attach"
                            className="h-9 w-9 grid place-items-center rounded-full hover:bg-black/08 active:bg-black/12 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
                          >
                            <Paperclip className="h-[18px] w-[18px] text-black/70" />
                          </button>
                          <button
                            type="button"
                            aria-label="Voice"
                            className="h-9 w-9 grid place-items-center rounded-full hover:bg-black/08 active:bg-black/12 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
                            onMouseDown={!isProcessing ? startRecording : undefined}
                            onMouseUp={!isProcessing ? stopRecording : undefined}
                            onMouseLeave={!isProcessing ? stopRecording : undefined}
                            onTouchStart={!isProcessing ? startRecording : undefined}
                            onTouchEnd={!isProcessing ? stopRecording : undefined}
                          >
                            <Mic className="h-[18px] w-[18px] text-black/70" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Text input container */}
                    <div className="min-w-0 flex items-center">
                      <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Message Echo…"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage(inputValue);
                          }
                        }}
                        disabled={isLoading || isRecording || isProcessing}
                        aria-label="Message input"
                        autoComplete="off"
                        autoCorrect="on"
                        autoCapitalize="sentences"
                        rows={1}
                        className="w-full bg-transparent outline-none text-body-md leading-relaxed font-normal 
                                   placeholder:text-black/60 text-black font-medium 
                                   resize-none focus-visible:outline-none"
                      />
                    </div>

                    {/* Send button */}
                    <div className="flex items-center">
                      {inputValue?.trim() ? (
                        <button
                          type="button"
                          onClick={() => sendMessage(inputValue)}
                          aria-label="Send"
                          disabled={isLoading || isProcessing}
                          className={cn(
                            "h-10 px-4 rounded-full bg-white text-black shadow-[0_8px_24px_rgba(0,0,0,0.8)] border border-white hover:bg-white/90 active:scale-[0.98] transition",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                            "disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                          )}
                        >
                          {isLoading || isProcessing ? (
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" className="opacity-25" stroke="currentColor" strokeWidth="4" fill="none"/>
                              <path d="M4 12a8 8 0 018-8" className="opacity-90" stroke="currentColor" strokeWidth="4" fill="none" />
                            </svg>
                          ) : (
                            'Send'
                          )}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <OverlayFooter onOpen={() => openHistory()} isSticky={false} />
                </div>
              )}
            </div>
        </footer>
      </div>
      </SlideOver>
      
        {/* Message action long-press sheet (mobile) - Phase 47 */}
        <div 
          className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-[max(12px,env(safe-area-inset-bottom))] data-[open=false]:hidden"
          data-open="false"
        >
          <div className="mx-auto w-full max-w-[720px] rounded-2xl bg-white/95 backdrop-blur border border-black/10 shadow-lg p-2 grid grid-cols-4 gap-2">
            <button 
              className="h-11 rounded-xl bg-black/5 hover:bg-black/10 text-body-sm font-medium text-gray-800 transition-all duration-motion-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              type="button"
            >
              Copy
            </button>
            <button 
              className="h-11 rounded-xl bg-black/5 hover:bg-black/10 text-body-sm font-medium text-gray-800 transition-all duration-motion-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              type="button"
            >
              Retry
            </button>
            <button 
              className="h-11 rounded-xl bg-black/5 hover:bg-black/10 text-body-sm font-medium text-gray-800 transition-all duration-motion-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              type="button"
            >
              Share
            </button>
            <button 
              className="h-11 rounded-xl bg-black/5 hover:bg-black/10 text-[13px] font-medium text-gray-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              type="button"
            >
              Save
            </button>
          </div>
        </div>

        {/* Copied toast - Phase 44 */}
        <div 
          id="toast"
          className="pointer-events-none fixed left-1/2 -translate-x-1/2 bottom-[max(env(safe-area-inset-bottom),24px)] z-[70] hidden data-[show=true]:block"
          data-show="false"
        >
          <div className="rounded-full bg-gray-900 text-white text-[12px] px-3 py-1.5 shadow-lg">
            Copied to clipboard
          </div>
        </div>

        <AIChatHistory
          isOpen={showHistory} 
          onClose={() => setShowHistory(false)}
          onSelectMessage={(message) => {
            setShowHistory(false);
            sendMessage(message);
          }}
          onNewConversation={() => {
            conversationSession.startNewConversationManually();
            setMessages([]);
            setShowHistory(false);
          }}
          initialTab={historyInitialTab}
        />
      </>
    );
};

export default AIChatOverlay;