import React, { useState, useRef, useEffect } from 'react';
import { Send, UserPlus, MessageCircle } from 'lucide-react';
import { useGameMessages } from './hooks/useGameMessages';
import { GameRoster } from './GameRoster';
import { QuickActions } from './QuickActions';
import { Button } from '@/components/ui/button';
import { Game, GameParticipant } from '@/features/nearby/types';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface GameMessagesTabProps {
  game: Game;
  participants: GameParticipant[];
}

export function GameMessagesTab({ game, participants }: GameMessagesTabProps) {
  const navigate = useNavigate();
  const { thread, messages, isLoading, isSending, sendMessage, isThreadExpired } = useGameMessages(game.id);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!messageText.trim() || isSending) return;
    await sendMessage(messageText);
    setMessageText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInsertMessage = (text: string) => {
    setMessageText(text);
    textareaRef.current?.focus();
  };

  const handleAddFriend = () => {
    // TODO: Implement add friend flow
    console.log('Add friend');
  };

  const handleStartDM = () => {
    navigate('/messages');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Roster */}
      <GameRoster participants={participants} hostUserId={game.host_user_id} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isSystem = message.is_system;
            const isCurrentUser = message.sender_id === game.host_user_id; // Simplified check

            return (
              <div
                key={message.id}
                className={`flex ${isSystem ? 'justify-center' : isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {isSystem ? (
                  <div className="bg-muted/50 text-muted-foreground text-xs px-3 py-1.5 rounded-full">
                    {message.text}
                  </div>
                ) : (
                  <div className={`max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    {!isCurrentUser && (
                      <div className="text-xs text-muted-foreground mb-1 px-1">
                        {message.sender?.display_name || 'Unknown'}
                      </div>
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isCurrentUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 px-1">
                      {format(new Date(message.created_at), 'h:mm a')}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions (only if not expired) */}
      {!isThreadExpired && <QuickActions game={game} onInsertMessage={handleInsertMessage} />}

      {/* Composer or Expired CTAs */}
      {isThreadExpired ? (
        <div className="border-t border-border/50 bg-muted/30 p-4 space-y-3">
          <p className="text-sm text-center text-muted-foreground">
            This conversation has expired. You can add players as friends to keep chatting.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleAddFriend}
            >
              <UserPlus className="w-4 h-4" />
              Add Friend
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleStartDM}
            >
              <MessageCircle className="w-4 h-4" />
              Start DM
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t border-border/50 bg-background p-4">
          {/* Non-friend banner */}
          <div className="mb-2 text-xs text-center text-muted-foreground">
            This conversation is temporary and closes after the game time. Add each other as friends to keep messaging.
          </div>
          
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 resize-none px-4 py-2.5 bg-muted border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 max-h-32 overflow-y-auto"
              style={{ minHeight: '42px' }}
            />
            <Button
              onClick={handleSend}
              disabled={!messageText.trim() || isSending}
              size="icon"
              className="h-[42px] w-[42px] rounded-full shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
