import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, History, Bookmark, MapPin, Mic, MicOff, BookOpen, Bot, Paperclip, ArrowUpRight, Settings, Camera } from 'lucide-react';
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
import SwingCoach from './SwingCoach';
import EchoAvatar from './EchoAvatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useConversationSession } from '@/hooks/useConversationSession';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import EchoProtection from './EchoProtection';
import { useEchoProtection } from '@/hooks/useEchoProtection';
import { AnimatePresence, motion } from 'framer-motion';
import { subscribeAIOverlay, type AITab } from '@/controllers/aiOverlayController';

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
}

const suggestedPrompts = [
  { text: "when is the next major?", emoji: "🏆" },
  { text: "Where should my ball position be?", emoji: "💭" },
  { text: "Best golf clubs near me", emoji: "📍" },
  { text: "Which driver loft should I use at 95 mph swing speed?", emoji: "🏌️" },
  { text: "Plan me a 5 course USA golf trip", emoji: "🚩" }
];

const AIChatOverlay: React.FC<AIChatOverlayProps> = ({ isOpen, onClose, onHistoryStateChange, initialTab }) => {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [userLocation, setUserLocation] = useState<string>('');
  const [activeTab, setActiveTab] = useState('chat');
  const [analysisText, setAnalysisText] = useState('');
  const [swingCoachAnalysisText, setSwingCoachAnalysisText] = useState('');
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

      toast({
        title: "Caddie note saved",
        description: "Your voice note has been added to your caddie logs",
      });


    } catch (error) {
      console.error('Error saving voice note:', error);
      toast({
        title: "Error saving note",
        description: "Failed to save your caddie note. Please try again.",
        variant: "destructive"
      });
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
            toast({
              title: "Location detected",
              description: `Using ${location} for location-based queries`,
            });
          } catch (error) {
            console.error('Error getting location name:', error);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location access denied",
            description: "Please enable location access or specify your city manually",
            variant: "destructive"
          });
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

    console.log('🐛 CHAT DEBUG - Creating user message:', {
      id: userMessage.id,
      type: userMessage.type,
      content: userMessage.content.substring(0, 100),
      timestamp: userMessage.timestamp
    });

    setMessages(prev => {
      console.log('🐛 CHAT DEBUG - Adding user message to local state:', {
        previousCount: prev.length,
        newCount: prev.length + 1
      });
      return [...prev, userMessage];
    });
    
    // Add user message to conversation session for history tracking
    console.log('🐛 CHAT DEBUG - Adding user message to conversation session...');
    conversationSession.addMessage(userMessage);
    setInputValue('');
    setIsLoading(true);

    try {
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

      console.log('🐛 CHAT DEBUG - Creating AI message:', {
        id: aiMessage.id,
        type: aiMessage.type,
        content: aiMessage.content.substring(0, 100),
        timestamp: aiMessage.timestamp
      });

      setMessages(prev => {
        console.log('🐛 CHAT DEBUG - Adding AI message to local state:', {
          previousCount: prev.length,
          newCount: prev.length + 1
        });
        return [...prev, aiMessage];
      });
      
      // Add AI response to conversation session for history tracking
      console.log('🐛 CHAT DEBUG - Adding AI message to conversation session...');
      conversationSession.addMessage(aiMessage);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });

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
    
    toast({
      title: "Saved to Insights",
      description: "This tip has been saved to your AI insights",
    });
  };

  const requestMoreDetail = (originalMessage: string) => {
    sendMessage(originalMessage, true);
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

  return (
    <>
      <SlideOver
        open={isOpen}
        onClose={handleClose}
        width="w-full"
        zIndex="z-[1100]"
        ariaLabel="Echo AI chat interface"
        backdrop="none"
      >
      {/* Backdrop with vignette */}
      <div 
        className="fixed inset-0 z-[1099] pointer-events-auto"
        style={{
          background: 'radial-gradient(120% 80% at 50% 0%, rgba(0,0,0,0.28), rgba(0,0,0,0.55))',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          willChange: 'backdrop-filter'
        }}
        onClick={handleClose}
      />
      
      {/* Panel shell */}
      <div 
        className="fixed inset-0 z-[1100] w-full h-full overflow-hidden pointer-events-auto"
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
        {/* Safe-area wrapper */}
        <div 
          className="flex h-full flex-col"
          style={{
            paddingTop: 'max(8px, env(safe-area-inset-top))',
            paddingBottom: 'max(8px, env(safe-area-inset-bottom))'
          }}
        >
          {/* Header */}
          <header
            className="relative z-[1] border-b border-white/10 bg-gradient-to-b from-white/60 to-white/40 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50"
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
                  className="h-full bg-gradient-to-r from-[#2A9D8F] via-[#79C4BD] to-[#2A9D8F]"
                  style={{
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.6s linear infinite'
                  }}
                />
              </div>
            )}
            
            <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4">
              <div className="h-14 sm:h-16 grid grid-cols-[auto,1fr,auto] items-center gap-2">
                {/* Left: close button */}
                <button
                  type="button"
                  aria-label="Close"
                  onClick={handleClose}
                  className="h-9 w-9 grid place-items-center rounded-full hover:bg-black/5 active:bg-black/10 transition"
                >
                  <X className="h-5 w-5 text-gray-700" />
                </button>

                {/* Center: title/meta */}
                <div className="min-w-0 text-center">
                  <div className="truncate text-[17px] sm:text-[18px] font-semibold text-gray-900">
                    Echo
                  </div>
                  <div className="truncate text-[12px] sm:text-[13px] text-gray-600/90 leading-tight">
                    {isLoading ? "Echo is typing…" : "Chat • Private & secure"}
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowHistory(true)}
                    className="h-9 w-9 grid place-items-center rounded-full hover:bg-black/5 active:bg-black/10 transition"
                    aria-label="History"
                  >
                    <History className="h-5 w-5 text-gray-700" />
                  </button>
                </div>
              </div>
            </div>
            {/* hairline highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30"></div>
          </header>

          {/* Segmented Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            {/* Tabs under header */}
            <div className="sticky top-0 z-[0] bg-gradient-to-b from-white/40 to-transparent backdrop-blur-sm border-b border-white/10">
              <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 py-2">
                <TabsList className="h-11 w-full rounded-full bg-white/85 backdrop-blur border border-white/50 shadow-sm flex p-1">
                  <TabsTrigger
                    value="chat"
                    className="flex-1 rounded-full px-4 text-[14px] font-medium 
                               data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:ring-1 data-[state=active]:ring-black/5
                               data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:bg-white/50
                               transition-all"
                  >
                    Chat
                  </TabsTrigger>
                  <TabsTrigger
                    value="swing"
                    className="flex-1 rounded-full px-4 text-[14px] font-medium 
                               data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:ring-1 data-[state=active]:ring-black/5
                               data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:bg-white/50
                               transition-all"
                  >
                    Swing Coach
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Scrollable content area */}
            <TabsContent value="chat" className="m-0 flex-1" style={{ minHeight: 0 }}>
              <div 
                className="relative h-full overflow-y-auto overscroll-y-contain scroll-smooth [-webkit-overflow-scrolling:touch] pt-10 pb-24"
                data-echo-canvas
                ref={chatScrollRef}
                onScroll={handleChatScroll}
              >
                {/* Top vignette */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/75 to-transparent" />
                {/* Bottom vignette */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/80 to-transparent" />
                
                <div>
                    {messages.length === 0 ? (
                      <div className="mx-auto max-w-sm text-center space-y-3 py-10 px-3 sm:px-4">
                        <div className="size-12 rounded-full bg-[#2A9D8F]/8 text-[#2A9D8F] grid place-items-center mx-auto">
                          <Bot className="h-6 w-6" />
                        </div>
                        <h3 className="text-[17px] font-semibold text-gray-900">
                          I'm Echo, your personal caddy
                        </h3>
                        <p className="text-[14px] text-gray-600">
                          Ask me anything about golf—courses, tips, equipment, or swing analysis.
                        </p>
                        <div className="space-y-2 pt-2">
                          {suggestedPrompts.slice(0, 3).map((prompt, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestedPrompt(prompt.text)}
                              className="
                                w-full text-left rounded-xl
                                bg-white/92 backdrop-blur border border-black/10 shadow-sm
                                px-3 py-2
                                hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all
                              "
                            >
                              <span className="text-[14px] text-gray-800">{prompt.text}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 py-5 space-y-2">
                  {messages.map((message, index) => {
                    const isUser = message.type === 'user';
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const isFirstInGroup = !prevMessage || prevMessage.type !== message.type;
                    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
                    const isLastInGroup = !nextMessage || nextMessage.type !== message.type;
                    
                    return (
                      <div 
                        key={message.id}
                        className={cn(
                          isFirstInGroup && index > 0 && "mt-4"
                        )}
                      >
                        <ChatMessageComponent
                          message={message}
                          onSaveToInsights={saveToInsights}
                          onRequestDetail={requestMoreDetail}
                          isFirstInGroup={isFirstInGroup}
                          showHeading={isFirstInGroup}
                        />
                      </div>
                    );
                  })}
                   {isLoading && (
                     <div className="flex items-end gap-2 mt-4">
                       <div className="shrink-0 h-7 w-7 rounded-full grid place-items-center bg-white/80 backdrop-blur border border-black/10"></div>
                       <div className="max-w-[78%]">
                         <div className="rounded-2xl rounded-bl-md bg-white/92 backdrop-blur border border-black/10 shadow-[0_10px_28px_rgba(0,0,0,0.08)] px-3 py-2">
                           <div className="flex items-center gap-1.5">
                             <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '-0.2s' }}></span>
                             <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"></span>
                             <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                           </div>
                         </div>
                       </div>
                     </div>
                    )}
                         </div>
                       )}

                {/* Unread marker example - "New since last visit" pill */}
                {false && ( /* Set to true to show example unread marker */
                  <div className="sticky top-2 z-10 flex justify-center pointer-events-none mb-4">
                    <div className="pointer-events-auto px-2.5 py-1 rounded-full bg-white/80 backdrop-blur border border-black/10 text-[11px] text-gray-700 shadow-sm">
                      New since last visit
                    </div>
                  </div>
                )}

                {/* "New messages" pill - shows when scrolled up and new messages arrive */}
                {newMessageCount > 0 && (
                  <div className="sticky bottom-20 sm:bottom-24 z-10 flex justify-center pointer-events-none">
                    <div className="px-3 py-1.5 rounded-full bg-white/85 backdrop-blur border border-black/10 shadow-sm text-[12px] text-gray-700 float-in">
                      {newMessageCount} new {newMessageCount === 1 ? 'message' : 'messages'}
                    </div>
                  </div>
                )}

                {/* "Back to Latest" FAB - shows when scrolled up */}
                {showScrollToBottom && (
                  <button
                    onClick={scrollToBottom}
                    className="pointer-events-auto fixed right-3 sm:right-4 z-20 h-11 px-4 rounded-full bg-white/95 backdrop-blur border border-black/10 shadow-lg text-[14px] font-medium text-gray-900 flex items-center gap-2 hover:bg-white active:scale-[0.99] transition-all float-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40 data-scrollfab"
                    style={{
                      bottom: `calc(88px + env(safe-area-inset-bottom))`
                    }}
                    aria-label="Jump to latest"
                  >
                    <span className="inline-flex h-5 w-5 rounded-full items-center justify-center bg-[#2A9D8F]/10 text-[#2A9D8F]">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </span>
                    {newMessageCount > 0 ? 'New messages' : 'Latest'}
                  </button>
                )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="swing" className="m-0 flex-1" style={{ minHeight: 0 }}>
              <div 
                className="relative h-full overflow-y-auto overscroll-y-contain scroll-smooth [-webkit-overflow-scrolling:touch] px-3 sm:px-4 pt-10 pb-[64px]"
                data-echo-canvas
              >
                {/* Top vignette */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/75 to-transparent" />
                {/* Bottom vignette */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/80 to-transparent" />
                
                <SwingCoach
                  onClose={() => setActiveTab('chat')}
                  isRecording={isRecording}
                  isProcessing={isProcessing}
                  startRecording={startRecording}
                  stopRecording={stopRecording}
                  analysisText={swingCoachAnalysisText}
                  onAnalysisTextChange={setSwingCoachAnalysisText}
                />
              </div>
            </TabsContent>
          </Tabs>
        
          {/* Composer footer */}
          <footer 
            className="sticky bottom-0 z-[1] border-t border-white/10 bg-gradient-to-t from-white/70 to-white/40 backdrop-blur-xl"
            role="region"
            aria-label="Message composer"
            data-echo-composer
          >
            {/* Upload progress bar (shown during processing) */}
            {(isLoading || isProcessing) && (
              <div className="absolute left-0 right-0 top-0 h-[2px] bg-[#2A9D8F]/20 overflow-hidden">
                <div className="h-full bg-[#2A9D8F] animate-[shimmer_1.6s_linear_infinite] w-1/3" />
              </div>
            )}
            
            <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 pt-2 pb-[max(env(safe-area-inset-bottom),12px)]">
              {activeTab === 'chat' && (
                <div>
                  {/* Suggestion/Chip row (optional quick actions) */}
                  <div className="mb-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                    <button 
                      className="h-8 px-3 rounded-full bg-white border border-black/10 text-[13px] text-gray-800 hover:bg-gray-50 shadow-sm whitespace-nowrap transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
                      onClick={() => setInputValue("Summarise my latest tips")}
                    >
                      Summarise latest tips
                    </button>
                    <button 
                      className="h-8 px-3 rounded-full bg-white border border-black/10 text-[13px] text-gray-800 hover:bg-gray-50 shadow-sm whitespace-nowrap transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
                      onClick={() => setInputValue("Recommend a club for my next shot")}
                    >
                      Club recommendation
                    </button>
                    <button 
                      className="h-8 px-3 rounded-full bg-white border border-black/10 text-[13px] text-gray-800 hover:bg-gray-50 shadow-sm whitespace-nowrap transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
                      onClick={() => setInputValue("Show me my improvement trends")}
                    >
                      My progress
                    </button>
                  </div>

                  {/* Attachment preview strip (static UI for now) */}
                  {false && ( /* Toggle to true to show example attachments */
                    <div className="mb-2">
                      <div className="flex items-center gap-2 overflow-x-auto rounded-2xl bg-white/85 backdrop-blur border border-black/10 shadow-sm p-2 scrollbar-none">
                        {/* Image attachment */}
                        <div className="relative shrink-0">
                          <img 
                            className="h-14 w-14 rounded-xl object-cover border border-black/10" 
                            src="https://via.placeholder.com/56"
                            alt="Attachment preview"
                          />
                          <button 
                            className="absolute -top-1.5 -right-1.5 h-6 w-6 grid place-items-center rounded-full bg-white/95 border border-black/10 shadow hover:bg-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
                            aria-label="Remove"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Video attachment */}
                        <div className="relative shrink-0">
                          <div className="h-14 w-24 rounded-xl border border-black/10 overflow-hidden bg-black/5">
                            <img 
                              className="h-full w-full object-cover" 
                              src="https://via.placeholder.com/96x56"
                              alt="Video preview"
                            />
                            <div className="absolute inset-0 grid place-items-center">
                              <div className="h-6 w-6 rounded-full bg-black/60 grid place-items-center">
                                <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <button 
                            className="absolute -top-1.5 -right-1.5 h-6 w-6 grid place-items-center rounded-full bg-white/95 border border-black/10 shadow hover:bg-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
                            aria-label="Remove"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Add more button */}
                        <button 
                          className="h-14 w-14 grid place-items-center rounded-xl bg-white border border-black/10 hover:bg-gray-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
                          aria-label="Add more attachments"
                        >
                          <svg className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Main composer pill */}
                  <div className="flex items-end gap-2 w-full">
                    <div className="flex-1 min-w-0 transition-[height]">
                      <form 
                        className={cn(
                          "composer-bubble composer-compact rounded-[28px]",
                          "bg-white/92 backdrop-blur border border-black/10",
                          "shadow-md",
                          "px-3 py-2.5 grid grid-cols-[auto,1fr,auto] gap-2",
                          "focus-within:ring-2 focus-within:ring-[#2A9D8F]/25",
                          "transition-all",
                          isRecording && "ring-2 ring-red-400/30"
                        )}
                        role="group"
                        aria-label="Message composer"
                        autoComplete="off"
                        onSubmit={(e) => {
                          e.preventDefault();
                          sendMessage(inputValue);
                        }}
                      >
                        {/* Left tool */}
                        <button
                          type="button"
                          aria-label="Attach"
                          className="h-9 w-9 grid place-items-center rounded-full text-gray-600 hover:bg-black/5 active:bg-black/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40 disabled:opacity-40 disabled:cursor-not-allowed"
                          disabled={isLoading || isRecording || isProcessing}
                        >
                          <Paperclip className="h-[18px] w-[18px]" />
                        </button>

                        {/* Textarea */}
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
                          rows={1}
                          className="w-full resize-none bg-transparent outline-none text-[15px] leading-[1.4] text-gray-900 placeholder:text-gray-500 caret-[#2A9D8F] disabled:opacity-60 disabled:pointer-events-none max-h-[30vh]"
                        />

                        {/* Right tool - Voice/Send */}
                        {!inputValue?.trim() ? (
                          <div className="relative">
                            {isRecording && (
                              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 animate-pulse z-10" />
                            )}
                            <button
                              type="button"
                              aria-label={isRecording ? "Recording - release to stop" : "Hold to talk"}
                              title="Hold to talk"
                              className={cn(
                                "h-9 w-9 grid place-items-center rounded-full transition-all",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40",
                                isRecording
                                  ? "bg-red-50 text-red-600 scale-110"
                                  : "text-gray-600 hover:bg-black/5 active:bg-black/10",
                                isProcessing && "opacity-60 cursor-not-allowed"
                              )}
                              onMouseDown={!isProcessing ? startRecording : undefined}
                              onMouseUp={!isProcessing ? stopRecording : undefined}
                              onMouseLeave={!isProcessing ? stopRecording : undefined}
                              onTouchStart={!isProcessing ? startRecording : undefined}
                              onTouchEnd={!isProcessing ? stopRecording : undefined}
                              disabled={isProcessing}
                            >
                              <Mic className="h-[18px] w-[18px]" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="submit"
                            aria-label="Send"
                            disabled={!inputValue?.trim() || isLoading || isProcessing}
                            className={cn(
                              "h-9 w-9 grid place-items-center rounded-full transition-all",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40",
                              (!inputValue?.trim() || isLoading || isProcessing)
                                ? "bg-black/5 text-gray-400 border border-black/10 cursor-not-allowed shadow-none"
                                : "bg-[#2A9D8F] text-white shadow hover:brightness-[1.05] active:scale-[0.99]"
                            )}
                          >
                            {isLoading || isProcessing ? (
                              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" className="opacity-25" stroke="currentColor" strokeWidth="4" fill="none"/>
                                <path d="M4 12a8 8 0 018-8" className="opacity-90" stroke="currentColor" strokeWidth="4" fill="none" />
                              </svg>
                            ) : (
                              <Send className="h-[18px] w-[18px]" />
                            )}
                          </button>
                        )}
                      </form>
                    </div>
                  </div>

                  {/* Recent history peek */}
                  <button
                    className="mt-3 w-full rounded-full bg-white/80 backdrop-blur border border-black/10 shadow-sm flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
                    onClick={() => setShowHistory(true)}
                    aria-label="Open recent history"
                  >
                    <span className="flex items-center gap-2 text-[13px] font-medium">
                      <History className="h-[14px] w-[14px]" />
                      Recent history
                    </span>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24"><path d="M7 14l5-5 5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
                  </button>
                  
                  {/* Shy helper text */}
                  <div className="mt-2 text-center text-[11px] text-gray-500 select-none">
                    Echo helps with chat and swing analysis. No data is shared publicly.
                  </div>
                </div>
              )}
            </div>
          </footer>
        </div>
      </div>
      </SlideOver>
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
        />
      </>
    );
};

export default AIChatOverlay;