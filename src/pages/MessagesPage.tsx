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
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { PageRoot } from '@/components/layout/PageRoot';

const MessagesPage = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { conversations, loading: conversationsLoading, sendMessage, markMessagesAsRead } = useMessages();
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
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
      <PageRoot className="min-h-screen bg-background">
        <div className="px-4 md:container md:mx-auto md:px-0 py-6">
          <p className="text-center text-muted-foreground">Please log in to view messages.</p>
        </div>
      </PageRoot>
    );
  }

  return (
    <PageRoot className="min-h-screen bg-background">
      <main className="px-4 md:container md:mx-auto md:px-0 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="font-display text-2xl font-bold">Messages</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            {/* Conversations List */}
            <div className="md:col-span-1">
              <Card className="h-full">
                <CardContent className="p-4">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="space-y-2 overflow-y-auto max-h-[calc(100%-80px)]">
                    {conversationsLoading ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="p-3 bg-muted rounded-sq-sm animate-pulse">
                            <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : filteredConversations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No conversations yet</p>
                        <p className="text-sm">Send a message to a friend to get started</p>
                      </div>
                    ) : (
                      filteredConversations.map((conversation) => (
                        <div
                          key={conversation.friend_id}
                          className={`p-3 rounded-sq-sm cursor-pointer transition-colors hover:bg-muted/60 ${
                            selectedFriendId === conversation.friend_id ? 'bg-muted' : ''
                          }`}
                          onClick={() => handleConversationSelect(conversation.friend_id)}
                        >
                          <div className="flex items-start gap-3">
                            <SquircleAvatar
                              src={conversation.friend_photo_url}
                              alt={conversation.friend_name || 'User'}
                              size="md"
                              fallback={(conversation.friend_name || 'U').charAt(0)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm truncate">
                                  {conversation.friend_name || conversation.friend_username}
                                </h3>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground truncate">
                                  {conversation.is_last_message_from_me ? 'You: ' : ''}
                                  {conversation.last_message}
                                </p>
                                {conversation.unread_count > 0 && (
                                  <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                    {conversation.unread_count}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <div className="md:col-span-2">
              <Card className="h-full flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b">
                      <div className="flex items-center gap-3">
                        <SquircleAvatar
                          src={selectedConversation.friend_photo_url}
                          alt={selectedConversation.friend_name || 'User'}
                          size="md"
                          fallback={(selectedConversation.friend_name || 'U').charAt(0)}
                        />
                        <div>
                          <h3 className="font-semibold">
                            {selectedConversation.friend_name || selectedConversation.friend_username}
                          </h3>
                          <p className="text-sm text-muted-foreground">@{selectedConversation.friend_username}</p>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto">
                      {messagesLoading ? (
                        <div className="space-y-4">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                              <div className="bg-muted rounded-lg p-3 max-w-xs animate-pulse">
                                <div className="h-4 bg-muted-foreground/20 rounded"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No messages yet</p>
                          <p className="text-sm">Start the conversation!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`rounded-lg p-3 max-w-xs lg:max-w-md ${
                                  message.sender_id === user.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <p className={`text-xs mt-1 ${
                                  message.sender_id === user.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
                                }`}>
                                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="flex-1"
                        />
                        <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <p className="text-lg mb-2">Select a conversation</p>
                      <p className="text-sm">Choose a friend to start messaging</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
    </PageRoot>
  );
};

export default MessagesPage;