
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Search } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMessages } from '@/hooks/useMessages';
import { useConversation } from '@/hooks/useConversation';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';

const MessagesPage = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { conversations, loading: conversationsLoading, sendMessage, markMessagesAsRead } = useMessages();
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { messages, loading: messagesLoading } = useConversation(selectedFriendId);

  const filteredConversations = conversations.filter(conv => 
    conv.friend_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.friend_username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConversation = conversations.find(conv => conv.friend_id === selectedFriendId);

  const handleSendMessage = async () => {
    if (!selectedFriendId || !newMessage.trim()) return;

    const { error } = await sendMessage(selectedFriendId, newMessage);
    if (!error) {
      setNewMessage('');
    }
  };

  const handleConversationSelect = async (friendId: string) => {
    setSelectedFriendId(friendId);
    await markMessagesAsRead(friendId);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 md:container md:mx-auto md:px-0 py-6">
          <p className="text-center text-muted-foreground">Please log in to view messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="px-4 md:container md:mx-auto md:px-0 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <button 
              onClick={() => window.history.back()} 
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold">Messages</h1>
          </div>

          {/* Messages List */}
          <div className="space-y-4">
            {conversationsLoading ? (
              <div className="text-center">Loading conversations...</div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => (
                <div 
                  key={conversation.friend_id} 
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleConversationSelect(conversation.friend_id)}
                >
                  <div className="flex items-center gap-3">
                    <OptimizedAvatar 
                      src={conversation.friend_photo_url}
                      alt={conversation.friend_username}
                      fallback={conversation.friend_username?.charAt(0)?.toUpperCase()}
                      size={40}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-medium">{conversation.friend_username}</p>
                        <span className="text-xs text-muted-foreground">
                          {conversation.last_message_time && formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message || 'No messages yet'}
                      </p>
                      {conversation.unread_count > 0 && (
                        <div className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary rounded-full">
                          {conversation.unread_count}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No messages yet</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MessagesPage;
