/**
 * History Panel Component
 * Lists past conversations with search and management
 */

import React, { useState, useMemo } from 'react';
import { MessageSquare, Trash2, Edit2, Plus } from 'lucide-react';
import { TapButton } from '@/components/ui/TapButton';
import type { EchoConversation } from '../state/echoTypes';
import { VirtualList } from './virtual/VirtualList';

interface HistoryPanelProps {
  conversations: EchoConversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

const VIRTUALIZATION_THRESHOLD = 50;

export function HistoryPanel({
  conversations,
  activeConversationId,
  onSelect,
  onRename,
  onDelete,
  onNew,
}: HistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = useMemo(
    () => conversations.filter(c =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [conversations, searchQuery]
  );

  const useVirtualization = filteredConversations.length > VIRTUALIZATION_THRESHOLD;

  const handleStartEdit = (conversation: EchoConversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim()) {
      onRename(id, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this conversation? This cannot be undone.')) {
      onDelete(id);
    }
  };

  const renderConversationItem = (conversation: EchoConversation) => (
    <div
      key={conversation.id}
      className={`p-4 hover:bg-secondary/50 transition-colors ${
        conversation.id === activeConversationId ? 'bg-secondary' : ''
      }`}
    >
      {editingId === conversation.id ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit(conversation.id);
              if (e.key === 'Escape') setEditingId(null);
            }}
            onBlur={() => handleSaveEdit(conversation.id)}
            autoFocus
            className="flex-1 bg-background text-foreground rounded px-2 py-1 text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <button
            onClick={() => onSelect(conversation.id)}
            className="flex-1 text-left"
          >
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <h4 className="font-medium text-foreground text-heading-md line-clamp-1">
                {conversation.title}
              </h4>
            </div>
            <div className="text-meta text-muted-foreground">
              {conversation.messages.length} message
              {conversation.messages.length !== 1 ? 's' : ''} •{' '}
              {new Date(conversation.updatedAt).toLocaleDateString()}
            </div>
          </button>
          
          <div className="flex gap-1">
            <TapButton
              onClick={() => handleStartEdit(conversation)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Rename conversation"
            >
              <Edit2 className="w-4 h-4" />
            </TapButton>
            <TapButton
              onClick={() => handleDelete(conversation.id)}
              className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Delete conversation"
            >
              <Trash2 className="w-4 h-4" />
            </TapButton>
          </div>
        </div>
      )}
    </div>
  );

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-4xl mb-2">📚</div>
        <h3 className="text-heading-lg font-semibold text-foreground">No conversations yet</h3>
        <p className="text-body-md text-muted-foreground text-center max-w-xs">
          Start chatting with Echo to build your conversation history
        </p>
        <TapButton
          onClick={onNew}
          className="mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          New Conversation
        </TapButton>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header with search and new button */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-heading-lg font-semibold text-foreground">Conversations</h3>
          <TapButton
            onClick={onNew}
            className="bg-primary text-primary-foreground p-2 rounded-lg hover:opacity-90 transition-opacity"
            aria-label="New conversation"
          >
            <Plus className="w-4 h-4" />
          </TapButton>
        </div>
        
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search conversations..."
          className="w-full bg-secondary text-foreground rounded-lg px-4 py-2 text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Search conversations"
        />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No conversations match your search
          </div>
        ) : useVirtualization ? (
          <VirtualList
            count={filteredConversations.length}
            estimateSize={80}
            overscan={5}
            className="divide-y divide-border"
            render={(index) => {
              const conversation = filteredConversations[index];
              return renderConversationItem(conversation);
            }}
          />
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conversation) => 
              renderConversationItem(conversation)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
