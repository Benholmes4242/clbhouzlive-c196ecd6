import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, History, Bookmark, MapPin, Mic, MicOff, BookOpen, Bot, Paperclip, ArrowUpRight, Settings, Camera, ChevronDown } from 'lucide-react';
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
                className="relative h-full overflow-y-auto overscroll-contain scroll-smooth pt-10 pb-24"
                style={{ WebkitOverflowScrolling: "touch" }}
                data-echo-canvas
                ref={chatScrollRef}
                onScroll={handleChatScroll}
              >
                {/* Top fade - Phase 52 */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/60 to-transparent z-10" />
                {/* Bottom fade - Phase 52 */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/60 to-transparent z-10" />
                
                {/* Unread above notice (sticky hint at top while scrolling) */}
                {false && ( /* Set to true to show "unread above" indicator */
                  <div 
                    className="sticky top-2 z-10 flex justify-center opacity-100 transition-opacity"
                    data-show="true"
                  >
                    <div className="px-3 py-1.5 rounded-full bg-white/80 backdrop-blur border border-black/10 text-[11px] text-gray-600 shadow-sm">
                      Unread messages above
                    </div>
                  </div>
                )}
                
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
                    
                    // Example: mark message at index 3 as first unread (UI only)
                    const isFirstUnread = false; // Set to true on a specific message to show separator
                    
                    return (
                      <React.Fragment key={message.id}>
                        {/* "New messages" separator - Phase 49 */}
                        {isFirstUnread && (
                          <div className="relative my-4" role="separator" aria-label="New messages">
                            <div className="sticky top-2 z-10 flex justify-center">
                              <div className="px-3 py-1.5 rounded-full bg-white/80 backdrop-blur border border-black/10 shadow-sm text-[11px] text-gray-600">
                                New messages
                              </div>
                            </div>
                            {/* Hairline that spans the width */}
                            <div className="absolute left-0 right-0 top-1/2 -z-0">
                              <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4">
                                <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div 
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
                      </React.Fragment>
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

                {/* "New since you left" banner (optional header slot) */}
                {false && ( /* Set to true to show header banner style */
                  <div className="sticky top-0 z-[0] bg-gradient-to-b from-white/40 to-transparent backdrop-blur-sm">
                    <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 py-2">
                      <div className="h-9 w-full rounded-full bg-white/90 backdrop-blur border border-black/10 shadow-sm px-3 flex items-center justify-between text-[12px] text-gray-700">
                        <span className="truncate">New since your last visit</span>
                        <span className="ml-2 rounded-full px-2 py-0.5 bg-black/5 border border-black/10 text-[11px]">3</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom pill for new messages when at bottom */}
                {newMessageCount > 0 && !showScrollToBottom && (
                  <div className="fixed bottom-[96px] left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur border border-black/10 shadow-sm text-[12px] text-gray-700 pointer-events-auto float-in opacity-0 data-[visible=true]:opacity-100 transition-opacity duration-200" data-visible="true">
                    {newMessageCount} new {newMessageCount === 1 ? 'message' : 'messages'} • Tap to view
                  </div>
                )}

                {/* Scroll-to-bottom FAB - Phase 49 */}
                {showScrollToBottom && (
                  <button
                    onClick={scrollToBottom}
                    className={cn(
                      "fixed md:absolute z-30",
                      "bottom-[calc(env(safe-area-inset-bottom)+76px)]",
                      "right-3 md:right-0 md:translate-x-[calc(720px/2-1rem)]",
                      "h-10 px-3 rounded-full",
                      "bg-white/95 backdrop-blur border border-black/10 shadow-lg",
                      "flex items-center gap-2 text-[13px] text-gray-800",
                      "hover:bg-white active:scale-[0.98]",
                      "transition will-change-transform",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40",
                      "animate-[fadeInUp_220ms_ease-out]"
                    )}
                    aria-label="Scroll to latest"
                    type="button"
                  >
                    {/* Down chevron icon */}
                    <span className="inline-block h-5 w-5 grid place-items-center rounded-full bg-black/5">
                      <ChevronDown className="h-3 w-3" />
                    </span>
                    <span className="tabular-nums">New</span>
                    {/* Optional unread count badge */}
                    {newMessageCount > 0 && (
                      <span className="ml-1 rounded-full bg-[#2A9D8F]/10 text-[#2A9D8F] px-2 py-0.5 text-[11px]">
                        {newMessageCount}
                      </span>
                    )}
                  </button>
                )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="swing" className="m-0 flex-1" style={{ minHeight: 0 }}>
              <div 
                className="relative h-full overflow-y-auto overscroll-contain scroll-smooth px-3 sm:px-4 pt-10 pb-[64px]"
                style={{ WebkitOverflowScrolling: "touch" }}
                data-echo-canvas
              >
                {/* Top fade - Phase 52 */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/60 to-transparent z-10" />
                {/* Bottom fade - Phase 52 */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/60 to-transparent z-10" />
                
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
        
          {/* Composer footer - Phase 53: Feel & Affordances */}
          <footer 
            className="sticky bottom-0 z-[1] bg-gradient-to-t from-white/85 to-white/60 backdrop-blur-xl border-t border-white/10"
            role="region"
            aria-label="Message composer"
            data-echo-composer
            data-streaming={isLoading ? "true" : "false"}
          >
            {/* Upload progress bar (shown during processing) */}
            {(isLoading || isProcessing) && (
              <div className="absolute left-0 right-0 top-0 h-[2px] bg-[#2A9D8F]/20 overflow-hidden">
                <div className="h-full bg-[#2A9D8F] animate-[shimmer_1.6s_linear_infinite] w-1/3" />
              </div>
            )}
            
            <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
              {activeTab === 'chat' && (
                <div>
                  {/* Attachments tray - Phase 51 (peek + expand) */}
                  <div className="sticky bottom-[64px] sm:bottom-[72px] z-[2] -mx-3 sm:-mx-4 mb-2">
                    <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4">
                      <div
                        className={cn(
                          "overflow-hidden rounded-2xl bg-white/90 backdrop-blur border border-black/10 shadow-lg",
                          "transition-all duration-200",
                          "data-[open=false]:max-h-0 data-[open=false]:opacity-0 data-[open=false]:translate-y-2",
                          "data-[open=true]:max-h-[220px] data-[open=true]:opacity-100 data-[open=true]:translate-y-0"
                        )}
                        data-open="false"
                        id="attachmentsTray"
                      >
                        <div className="p-3 sm:p-3.5 grid grid-cols-4 gap-2 sm:gap-3">
                          {/* Photo tile */}
                          <button 
                            className="h-20 rounded-xl bg-white border border-black/10 shadow-sm hover:-translate-y-0.5 transition flex flex-col items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
                            aria-label="Photo"
                            type="button"
                          >
                            <Camera className="h-5 w-5 text-gray-700" />
                            <span className="text-[11px] text-gray-600">Photo</span>
                          </button>
                          
                          {/* Video tile */}
                          <button 
                            className="h-20 rounded-xl bg-white border border-black/10 shadow-sm hover:-translate-y-0.5 transition flex flex-col items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
                            aria-label="Video"
                            type="button"
                          >
                            <svg className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                            <span className="text-[11px] text-gray-600">Video</span>
                          </button>
                          
                          {/* File tile */}
                          <button 
                            className="h-20 rounded-xl bg-white border border-black/10 shadow-sm hover:-translate-y-0.5 transition flex flex-col items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
                            aria-label="File"
                            type="button"
                          >
                            <Paperclip className="h-5 w-5 text-gray-700" />
                            <span className="text-[11px] text-gray-600">File</span>
                          </button>
                          
                          {/* Link tile */}
                          <button 
                            className="h-20 rounded-xl bg-white border border-black/10 shadow-sm hover:-translate-y-0.5 transition flex flex-col items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
                            aria-label="Link"
                            type="button"
                          >
                            <svg className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                            </svg>
                            <span className="text-[11px] text-gray-600">Link</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main composer pill - Phase 53: Feel & Affordances */}
                  <div className="chat-composer rounded-[28px] bg-white/92 backdrop-blur border border-black/10 shadow-sm px-3 py-2 flex items-center gap-2 transition-[box-shadow,transform,background] duration-200 focus-within:shadow-[0_10px_30px_rgba(0,0,0,0.08)] focus-within:bg-white">
                    {/* Left: attach toggle */}
                    <button
                      type="button"
                      aria-label="Attach"
                      className="h-9 w-9 grid place-items-center rounded-full hover:bg-black/5 active:bg-black/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
                    >
                      <Paperclip className="h-[18px] w-[18px] text-gray-600" />
                    </button>

                    {/* Middle: input */}
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
                      className="flex-1 bg-transparent outline-none resize-none text-[15px] leading-[1.5] text-gray-900 placeholder:text-gray-500/80 min-h-[40px] max-h-[40px] sm:min-h-[44px] sm:max-h-[44px]"
                    />

                    {/* Right: mic/send combo */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Voice"
                        className={cn(
                          "h-9 w-9 grid place-items-center rounded-full hover:bg-black/5 active:bg-black/10 transition",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40",
                          isRecording && "bg-red-500/10 text-red-600"
                        )}
                        onMouseDown={!isProcessing ? startRecording : undefined}
                        onMouseUp={!isProcessing ? stopRecording : undefined}
                        onMouseLeave={!isProcessing ? stopRecording : undefined}
                        onTouchStart={!isProcessing ? startRecording : undefined}
                        onTouchEnd={!isProcessing ? stopRecording : undefined}
                      >
                        <Mic className="h-[18px] w-[18px]" />
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => sendMessage(inputValue)}
                        aria-label="Send"
                        disabled={!inputValue?.trim() || isLoading || isProcessing}
                        aria-disabled={!inputValue?.trim() || isLoading || isProcessing}
                        className={cn(
                          "h-9 min-w-[44px] rounded-full px-4 font-medium shadow transition",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40",
                          (!inputValue?.trim() || isLoading || isProcessing)
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-40"
                            : "bg-[#2A9D8F] text-white hover:shadow-md active:scale-[0.98]"
                        )}
                      >
                        {isLoading || isProcessing ? (
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" className="opacity-25" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path d="M4 12a8 8 0 018-8" className="opacity-90" stroke="currentColor" strokeWidth="4" fill="none" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                          </svg>
                        )}
                      </button>
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
      
        {/* Message action long-press sheet (mobile) - Phase 47 */}
        <div 
          className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-[max(12px,env(safe-area-inset-bottom))] data-[open=false]:hidden"
          data-open="false"
        >
          <div className="mx-auto w-full max-w-[720px] rounded-2xl bg-white/95 backdrop-blur border border-black/10 shadow-lg p-2 grid grid-cols-4 gap-2">
            <button 
              className="h-11 rounded-xl bg-black/5 hover:bg-black/10 text-[13px] font-medium text-gray-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
              type="button"
            >
              Copy
            </button>
            <button 
              className="h-11 rounded-xl bg-black/5 hover:bg-black/10 text-[13px] font-medium text-gray-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
              type="button"
            >
              Retry
            </button>
            <button 
              className="h-11 rounded-xl bg-black/5 hover:bg-black/10 text-[13px] font-medium text-gray-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
              type="button"
            >
              Share
            </button>
            <button 
              className="h-11 rounded-xl bg-black/5 hover:bg-black/10 text-[13px] font-medium text-gray-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
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
        />
      </>
    );
};

export default AIChatOverlay;