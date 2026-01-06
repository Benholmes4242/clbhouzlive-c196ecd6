/**
 * HubMessagesListPage - Messages list screen (placeholder for v1)
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HubHeader } from '../components/HubHeader';
import { MessageCircle } from 'lucide-react';
import '../home/hubThemeLight.css';

export function HubMessagesListPage() {
  const nav = useNavigate();
  const loc = useLocation();

  const handleBack = () => {
    if (loc.key !== 'default') {
      nav(-1);
    } else {
      nav('/hub', { replace: true });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999]" style={{ background: 'var(--hub-bg-start)' }}>
      <HubHeader title="Messages" onBack={handleBack} />
      
      <div className="pt-16 px-4 h-full overflow-y-auto">
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'var(--hub-glass-bg)' }}
          >
            <MessageCircle className="w-8 h-8" style={{ color: 'var(--hub-text-dim)' }} />
          </div>
          <h2 
            className="text-[20px] font-semibold mb-2"
            style={{ color: 'var(--hub-text)' }}
          >
            Messages coming soon
          </h2>
          <p 
            className="text-[15px] leading-relaxed max-w-xs"
            style={{ color: 'var(--hub-text-sub)' }}
          >
            When you play games or follow golfers, your conversations will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
