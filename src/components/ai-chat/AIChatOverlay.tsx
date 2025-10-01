import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, History, Bookmark, MapPin, Mic, MicOff, BookOpen } from 'lucide-react';
import { PiWaveform } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
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
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 100);
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
            className="shrink-0 px-4 sm:px-6 flex items-center justify-between"
            style={{
              height: '64px',
              background: 'linear-gradient(135deg, rgba(18,30,54,.96) 0%, rgba(18,88,94,.92) 100%)',
              borderBottom: '1px solid rgba(255,255,255,.10)',
              boxShadow: '0 1px 0 rgba(255,255,255,.04) inset'
            }}
          >
            <div className="flex items-center gap-3">
              <PiWaveform 
                size={32}
                className="text-white/90 transition-all duration-200 ease-in-out"
                style={{
                  animation: `echoWave ${getAvatarState() === 'processing' ? '1s' : getAvatarState() === 'listening' ? '1.5s' : '3s'} ease-in-out infinite`
                }}
              />
              <div>
                <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-white">Echo</h2>
                <p className="text-[13px] text-white/80 leading-4">I'm your personal caddy</p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/10 active:bg-white/15 transition-colors"
              aria-label="Close Echo"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </header>

          {/* Segmented Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            {/* Top bar container (sticky) */}
            <div
              className="sticky top-[var(--echo-top,56px)] z-[2] px-3 sm:px-4 py-2 bg-white/55 backdrop-blur-md border-b border-white/30"
              data-echo-topbar
            >
              {/* Tabs rail */}
              <div className="w-full max-w-[720px] mx-auto" data-echo-tabs-rail>
                <TabsList className="w-full h-11 rounded-full bg-white/80 backdrop-blur-md border border-black/5 shadow-sm grid grid-cols-2 gap-1 p-1">
                  <TabsTrigger
                    value="chat"
                    className="rounded-full px-4 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow data-[state=active]:ring-1 data-[state=active]:ring-black/5 data-[state=inactive]:text-gray-700 transition-all"
                  >
                    Chat
                  </TabsTrigger>
                  <TabsTrigger
                    value="swing"
                    className="rounded-full px-4 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow data-[state=active]:ring-1 data-[state=active]:ring-black/5 data-[state=inactive]:text-gray-700 transition-all"
                  >
                    Swing Coach
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Scrollable content area */}
            <TabsContent value="chat" className="m-0 flex-1" style={{ minHeight: 0 }}>
              <div 
                className="h-full overflow-y-auto px-3 sm:px-4 pt-4 pb-28"
                data-echo-canvas
                ref={chatAutoScroll.scrollAreaRef}
              >
                <div>
                    {messages.length === 0 ? (
                      <div className="text-left">
                        <p className="text-gray-800/80 text-base mb-5">
                          I'm your personal caddy.<br />
                          Ask me anything, anytime - I've got you.
                        </p>

                        <div className="space-y-3">
                          {suggestedPrompts.map((prompt, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestedPrompt(prompt.text)}
                              className="
                                w-full text-left rounded-2xl
                                bg-white/90 backdrop-blur shadow
                                px-4 py-4
                                hover:-translate-y-0.5 active:translate-y-0 transition-transform
                              "
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{prompt.emoji}</span>
                                <span className="text-lg font-medium text-gray-900">{prompt.text}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <ChatMessageComponent
                            key={message.id}
                            message={message}
                            onSaveToInsights={saveToInsights}
                            onRequestDetail={requestMoreDetail}
                          />
                        ))}
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                              <div className="flex items-center gap-2">
                                <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                                <span className="text-sm">Echo is thinking...</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="swing" className="m-0 flex-1" style={{ minHeight: 0 }}>
              <div 
                className="h-full overflow-y-auto px-3 sm:px-4 pt-4 pb-28"
                data-echo-canvas
              >
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
            className="shrink-0 px-4 sm:px-6 pt-3"
            style={{
              background: 'linear-gradient(180deg, rgba(246,247,246,.85) 0%, rgba(246,247,246,.95) 100%)',
              borderTop: '1px solid rgba(255,255,255,.08)'
            }}
          >
            {activeTab === 'chat' && (
              <div>
                {/* Composer pill */}
                <div className="w-full rounded-[28px] bg-white/92 backdrop-blur shadow-[0_6px_18px_rgba(20,26,30,.16)] px-3 py-2 flex items-center gap-2">
                {/* Left icons */}
                <div className="flex items-center gap-1 pr-1">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                    variant={isRecording ? "destructive" : "ghost"}
                    size="icon"
                    className="h-9 w-9 rounded-full"
                  >
                    {isRecording ? (
                      <MicOff className="h-4 w-4" />
                    ) : isProcessing ? (
                      <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Camera button – keep if you already have a media picker handler.
                     If not, you can disable it for now (UI only) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    // onClick={openMediaPicker} // only if this exists in your logic
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4"><path d="M4 7h3l2-2h6l2 2h3v12H4z" fill="currentColor"/></svg>
                  </Button>
                </div>

                  {/* Input */}
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="ask me anything at all, I'm here for you"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputValue)}
                    disabled={isLoading || isRecording || isProcessing}
                    className="border-0 focus-visible:ring-0 bg-transparent mx-2 text-[15px] placeholder:text-slate-500/90"
                  />

                  {/* Send arrow */}
                  <Button
                    onClick={() => sendMessage(inputValue)}
                    disabled={isLoading || !inputValue.trim() || isRecording || isProcessing}
                    size="icon"
                    className="h-9 w-9 rounded-full bg-gray-900 text-white hover:bg-black transition"
                    aria-label="Send"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Recent history peek */}
                <button
                  className="mt-3 w-full rounded-[28px] bg-[#3da0a9]/15 backdrop-blur shadow flex items-center justify-between px-4 py-2 text-gray-700"
                  onClick={() => setShowHistory(true)}
                  aria-label="Open recent history"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-10 h-1 rounded-full block" style={{ background: 'linear-gradient(135deg, #1D3557, #2A9D8F)', opacity: 0.8 }} />
                    Recent history
                  </span>
                  <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M7 14l5-5 5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
                </button>
              </div>
            )}
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