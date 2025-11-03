/**
 * Swing Detail Pane
 * Full-page swing analysis view inside Hub
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEchoDeepLink } from '@/features/echo/hooks/useEchoDeepLink';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function SwingDetailPane() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [seekTime, setSeekTime] = React.useState<number | null>(null);

  useEchoDeepLink({
    onSeek: (time) => setSeekTime(time),
  });

  // TODO: Load swing analysis from Supabase
  // For now, show placeholder
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/hub/echo/history')}
          className="text-white/80 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1">
          <div className="font-semibold text-white">Swing Analysis</div>
          <div className="text-xs text-white/60">ID: {id}</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="bg-white/5 rounded-lg p-6 text-center text-white/60">
          <p>Swing analysis detail view</p>
          <p className="text-sm mt-2">Analysis ID: {id}</p>
          {seekTime !== null && (
            <p className="text-sm mt-2">Seek to: {seekTime}s</p>
          )}
          <p className="text-xs mt-4 text-white/40">
            Connect to existing swing analysis UI components
          </p>
        </div>
      </div>
    </div>
  );
}
