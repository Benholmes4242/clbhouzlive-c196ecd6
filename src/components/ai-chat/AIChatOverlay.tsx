import React, { useState, useRef, useEffect } from 'react';
import { X, Send, History, Bookmark, MapPin, Mic, MicOff, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChatMessageComponent from './ChatMessage';
import AIChatHistory from './AIChatHistory';
import CaddieLogs from './CaddieLogs';
import SwingCoach from './SwingCoach';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';

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
}

const suggestedPrompts = [
  "Is my grip too strong?",
  "Where should my ball position be?",
  "Best golf clubs near me",
  "Which driver loft should I use at 95 mph swing speed?",
  "Plan me a 5 course USA golf trip"
];

const AIChatOverlay: React.FC<AIChatOverlayProps> = ({ isOpen, onClose }) => {
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

      // Switch to logs tab if we're in the chat
      if (activeTab === 'chat') {
        setActiveTab('logs');
      }

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

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.bottom = '0';
      
      // Prevent scroll events on window
      const preventScroll = (e: WheelEvent | TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
      };
      
      // Add event listeners for all scroll types
      document.addEventListener('wheel', preventScroll, { passive: false });
      document.addEventListener('touchmove', preventScroll, { passive: false });
      document.addEventListener('scroll', preventScroll, { passive: false });
      
      return () => {
        // Restore original styles
        document.body.style.overflow = originalStyle;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.bottom = '';
        
        // Remove event listeners
        document.removeEventListener('wheel', preventScroll);
        document.removeEventListener('touchmove', preventScroll);
        document.removeEventListener('scroll', preventScroll);
      };
    }
  }, [isOpen]);

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

  const saveCurrentChatToHistory = () => {
    if (messages.length > 0) {
      // Store current conversation in localStorage for history
      const storedMessages = JSON.parse(localStorage.getItem('clbhouz_ai_history') || '[]');
      const conversationMessages = [...messages];
      storedMessages.push(...conversationMessages);
      localStorage.setItem('clbhouz_ai_history', JSON.stringify(storedMessages.slice(-100))); // Keep last 100 messages
    }
    
    // SwingCoach conversations are now saved separately and don't merge with chat history
  };

  const handleClose = () => {
    // Save current chat to history before closing
    saveCurrentChatToHistory();
    
    // Reset chat for new session
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
          isEcho: false
        }
      });

      if (error) throw error;

      const aiMessage: ChatMessageData = {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        metadata: data.metadata
      };

      setMessages(prev => [...prev, aiMessage]);

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


  if (!isOpen) return null;

  if (showHistory) {
    return (
      <AIChatHistory 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)}
        onSelectMessage={(message) => {
          setShowHistory(false);
          // Re-open the conversation with selected message
          sendMessage(message);
        }}
      />
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onScroll={(e) => e.stopPropagation()}
    >
      <div 
        className="bg-background rounded-2xl w-full max-w-md h-[min(90vh,720px)] flex flex-col shadow-2xl overflow-hidden"
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
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Echo</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(true)}
              className="h-8 w-8 p-0"
            >
              <History className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs - Fixed header */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-2 pb-0 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="logs">Caddie Logs</TabsTrigger>
              <TabsTrigger value="swing-coach">Swing Coach</TabsTrigger>
            </TabsList>
          </div>

          {/* Single scrollable content area */}
          <div 
            id="caddie-content"
            className="flex-1 overflow-y-auto min-h-0"
            style={{ overscrollBehavior: 'contain' }}
            ref={scrollAreaRef}
          >
            <TabsContent value="chat" className="h-full m-0">
              <div className="h-full min-h-0">
                <div className="px-6 py-5">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground">
                      <p className="mb-6">
                        I'm your personal tour caddie.<br />
                        Ask me anything, anytime, I've got you.
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Try asking:</p>
                        {suggestedPrompts.map((prompt, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestedPrompt(prompt)}
                            className="mx-1 mb-2 text-xs"
                          >
                            {prompt}
                          </Button>
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

            <TabsContent value="logs" className="h-full m-0">
              <CaddieLogs 
                onClose={() => setActiveTab('chat')}
                isRecording={isRecording}
                isProcessing={isProcessing}
                startRecording={startRecording}
                stopRecording={stopRecording}
                userLocation={userLocation}
                requestLocation={requestLocation}
              />
            </TabsContent>

            <TabsContent value="swing-coach" className="h-full m-0">
              <SwingCoach 
                onClose={() => setActiveTab('chat')}
                isRecording={isRecording}
                isProcessing={isProcessing}
                startRecording={startRecording}
                stopRecording={stopRecording}
                analysisText={swingCoachAnalysisText}
                onAnalysisTextChange={setSwingCoachAnalysisText}
              />
            </TabsContent>
          </div>
        </Tabs>
        
        {/* Shared composer/footer - Fixed at bottom */}
        <div className="border-t flex-shrink-0">
          {activeTab === 'chat' && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestLocation}
                  className="text-xs"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Use My Location
                </Button>
                {userLocation && (
                  <Badge variant="secondary" className="text-xs">
                    {userLocation}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about your swing, clubs, courses..."
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputValue)}
                    disabled={isLoading || isRecording || isProcessing}
                  />
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isLoading || isProcessing}
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    className="px-3"
                  >
                    {isRecording ? (
                      <MicOff className="h-4 w-4" />
                    ) : isProcessing ? (
                      <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={() => sendMessage(inputValue)}
                  disabled={isLoading || !inputValue.trim() || isRecording || isProcessing}
                  size="sm"
                  className="rounded-xl px-3 py-2 bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          {activeTab === 'logs' && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestLocation}
                  className="text-xs"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Use My Location
                </Button>
                {userLocation && (
                  <Badge variant="secondary" className="text-xs">
                    {userLocation}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Record course notes and tips..."
                    disabled={isRecording || isProcessing}
                    readOnly
                  />
                </div>
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  className="px-3"
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : isProcessing ? (
                    <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={() => {
                    if (!isRecording && !isProcessing) {
                      startRecording();
                    }
                  }}
                  disabled={isRecording || isProcessing}
                  size="sm"
                  className="rounded-xl px-3 py-2 bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          {activeTab === 'swing-coach' && (
            <div className="p-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={swingCoachAnalysisText}
                    onChange={(e) => setSwingCoachAnalysisText(e.target.value)}
                    placeholder="Describe your swing for analysis..."
                    onKeyPress={(e) => e.key === 'Enter' && swingCoachAnalysisText.trim() && document.getElementById('swing-coach-send-btn')?.click()}
                    disabled={isRecording || isProcessing}
                  />
                </div>
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  className="px-3"
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : isProcessing ? (
                    <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  id="swing-coach-send-btn"
                  onClick={() => {
                    // Trigger swing analysis in Swing Coach component
                    const swingCoachEvent = new CustomEvent('triggerSwingAnalysis', { 
                      detail: { analysisText: swingCoachAnalysisText } 
                    });
                    window.dispatchEvent(swingCoachEvent);
                    setSwingCoachAnalysisText('');
                  }}
                  disabled={isRecording || isProcessing}
                  size="sm"
                  className="rounded-xl px-3 py-2 bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Analyze"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChatOverlay;