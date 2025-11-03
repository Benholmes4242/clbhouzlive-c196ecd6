import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEchoDeepLink } from '@/features/echo/hooks/useEchoDeepLink';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Copy, Check, Loader2 } from 'lucide-react';
import { echoLinks } from '@/features/echo/utils/echoLinks';
import { toast } from 'sonner';
import { analyticsEvents } from '@/utils/analyticsEvents';

type ChatConversationRow = {
  id: string;
  title: string;
  createdAt: string;
  lastActivityAt: string;
  messages: Array<{
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: string;
    metadata?: any;
  }>;
};

function safeParse<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function loadLegacyConversation(id: string): ChatConversationRow | null {
  try {
    const legacy = safeParse<Record<string, any> | any[]>('echo_chat');
    if (!legacy) return null;

    const arr = Array.isArray(legacy) ? legacy : Object.values(legacy);
    const hit = arr.find((c: any) => c?.id === id);
    if (!hit || typeof hit !== 'object') return null;

    const convId = hit.id ?? crypto.randomUUID();
    const createdAt = hit.createdAt || hit.timestamp || new Date().toISOString();
    const lastActivityAt = hit.lastActivityAt || createdAt;

    const messages = Array.isArray(hit.messages)
      ? hit.messages.map((m: any, i: number) => ({
          id: m.id ?? `${convId}-${i}`,
          type: (m.role || m.type) === 'user' ? 'user' : 'ai',
          content: String(m.content ?? ''),
          timestamp: m.timestamp || createdAt,
          metadata: m.meta || m.metadata,
        }))
      : [];

    return {
      id: convId,
      title: hit.customTitle || hit.title || 'Untitled conversation',
      createdAt,
      lastActivityAt,
      messages,
    };
  } catch (e) {
    console.error('Error loading legacy conversation:', e);
    return null;
  }
}

export function ChatDetailPane() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [conv, setConv] = useState<ChatConversationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  
  useEchoDeepLink();

  // Cold start hydration - fetch from DB if needed
  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) return;

        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error || !data) {
          // Fallback: check localStorage for legacy conversations
          const legacyRow = loadLegacyConversation(id);
          if (legacyRow && isMounted) {
            setConv(legacyRow);
            analyticsEvents.track('hub_echo_history_open', { category: 'hub', label: 'chat', source: 'legacy' });
            return;
          }
          
          if (error) throw error;
        }

        if (isMounted && data) {
          const row: ChatConversationRow = {
            id: data.id,
            title: data.title ?? 'New conversation',
            createdAt: data.created_at,
            lastActivityAt: data.updated_at,
            messages: Array.isArray(data.messages) ? data.messages.map((m: any, i: number) => ({
              id: m.id ?? `${data.id}-${i}`,
              type: m.type === 'user' ? 'user' : 'ai',
              content: m.content ?? '',
              timestamp: m.timestamp ?? data.created_at,
              metadata: m.metadata,
            })) : [],
          };
          setConv(row);
          analyticsEvents.track('hub_echo_history_open', { category: 'hub', label: 'chat' });
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        if (isMounted) {
          toast.error('Failed to load conversation');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => { isMounted = false; };
  }, [id]);

  const copyMessageLink = (messageId: string) => {
    const link = `${window.location.origin}${echoLinks.chat(id!, { msgId: messageId })}`;
    navigator.clipboard.writeText(link);
    setCopiedId(messageId);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!conv) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground bg-transparent">
        <p>Conversation not found</p>
        <Button 
          variant="outline" 
          onClick={() => navigate('/hub/echo/history')}
        >
          Back to History
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-5 py-3 border-b border-border bg-background/95 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/hub/echo/history')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{conv.title}</div>
          <div className="text-xs text-muted-foreground">
            {conv.messages.length} messages
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 md:px-5 py-4 space-y-3 max-w-3xl mx-auto">
          {conv.messages.map((msg) => {
            const isUser = msg.type === 'user';
            return (
              <div
                key={msg.id}
                data-msg-id={msg.id}
                className="group relative"
              >
                <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      isUser
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    {msg.metadata?.error && (
                      <div className="mt-2 text-xs text-destructive">
                        Error: {msg.metadata.error}
                      </div>
                    )}
                  </div>
                </div>
                {/* Copy link button */}
                <button
                  onClick={() => copyMessageLink(msg.id)}
                  className="absolute -right-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-muted rounded-md"
                  title="Copy link to this message"
                >
                  {copiedId === msg.id ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
