/**
 * HubChatPlaceholderPage - Individual chat placeholder screen
 */

import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { HubHeader } from '../components/HubHeader';
import { Send } from 'lucide-react';
import '../home/hubThemeLight.css';

export function HubChatPlaceholderPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const { conversationId } = useParams();
  const [message, setMessage] = React.useState('');

  const handleBack = () => {
    if (loc.key !== 'default') {
      nav(-1);
    } else {
      nav('/hub/messages', { replace: true });
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder - no actual send yet
    setMessage('');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: 'var(--hub-bg-start)' }}>
      <HubHeader title="Chat" onBack={handleBack} />
      
      {/* Messages area */}
      <div className="flex-1 pt-16 px-4 overflow-y-auto">
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <p 
            className="text-[15px]"
            style={{ color: 'var(--hub-text-muted)' }}
          >
            Start a conversation...
          </p>
        </div>
      </div>
      
      {/* Input area */}
      <div 
        className="px-4 py-3"
        style={{ 
          background: 'var(--hub-glass-bg)',
          borderTop: '1px solid var(--hub-stroke)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
        }}
      >
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-10 px-4 rounded-full"
            style={{
              background: 'var(--hub-glass-bg-input)',
              border: '1px solid var(--hub-stroke)',
              color: 'var(--hub-text)',
              fontSize: '15px',
            }}
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center transition"
            style={{
              background: message.trim() ? 'var(--hub-primary-bg)' : 'var(--hub-glass-bg-input)',
              color: message.trim() ? 'white' : 'var(--hub-text-dim)',
              opacity: message.trim() ? 1 : 0.6,
            }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
