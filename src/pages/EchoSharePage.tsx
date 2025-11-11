import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface SharedThread {
  thread_id: string;
  title: string;
  created_at: string;
  tags: string[];
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at: string;
  }>;
}

export function EchoSharePage() {
  const { token } = useParams<{ token: string }>();
  const [thread, setThread] = useState<SharedThread | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSharedThread() {
      if (!token) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('echo_share_fetch', { p_token: token });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          setError('Link invalid or revoked');
          setLoading(false);
          return;
        }

        const threadData = data[0];
        // Parse messages from JSON
        const messages = Array.isArray(threadData.messages) 
          ? threadData.messages 
          : typeof threadData.messages === 'string'
          ? JSON.parse(threadData.messages)
          : [];

        setThread({
          ...threadData,
          messages,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load conversation');
      } finally {
        setLoading(false);
      }
    }

    fetchSharedThread();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl">
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading conversation...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>Conversation Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error || 'This link is invalid or has been revoked.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <article className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{thread.title}</CardTitle>
            <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
              <time dateTime={thread.created_at}>
                {format(new Date(thread.created_at), 'MMM d, yyyy')}
              </time>
              {thread.tags && thread.tags.length > 0 && (
                <div className="flex flex-wrap gap-1" role="list" aria-label="Tags">
                  {thread.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" role="listitem">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        <section className="space-y-4" role="list" aria-label="Conversation messages">
          {thread.messages && thread.messages.length > 0 ? (
            thread.messages.map((msg) => (
              <Card key={msg.id} role="listitem">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={msg.role === 'user' ? 'default' : 'secondary'}>
                      {msg.role === 'user' ? 'You' : msg.role === 'assistant' ? 'Assistant' : 'System'}
                    </Badge>
                    <time className="text-xs text-muted-foreground" dateTime={msg.created_at}>
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </time>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No messages in this conversation
              </CardContent>
            </Card>
          )}
        </section>
      </article>
    </main>
  );
}
