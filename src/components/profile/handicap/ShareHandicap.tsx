import React, { useState } from 'react';
import { Share2, Download, Trophy, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ShareHandicapProps {
  currentHandicap: number;
  bestHandicap?: number;
  totalRounds?: number;
  recentTrend?: 'up' | 'down' | 'stable';
  onShare?: (method: 'instagram' | 'whatsapp' | 'download') => void;
}

const ShareHandicapBadge: React.FC<{
  currentHandicap: number;
  bestHandicap?: number;
  totalRounds?: number;
  recentTrend?: 'up' | 'down' | 'stable';
}> = ({ currentHandicap, bestHandicap, totalRounds, recentTrend }) => {
  const getTrendEmoji = () => {
    switch (recentTrend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '⚡';
    }
  };

  return (
    <div className="w-80 h-80 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 text-6xl">⛳</div>
        <div className="absolute bottom-4 left-4 text-4xl">🏌️</div>
      </div>
      
      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-white/70">GOLF HANDICAP</span>
        </div>
        <h2 className="text-lg font-bold text-white">Clbhouz Member</h2>
      </div>
      
      {/* Main handicap */}
      <div className="text-center relative z-10">
        <div className="text-6xl font-bold text-white mb-2">
          {currentHandicap.toFixed(1)}
        </div>
        <div className="text-sm text-white/70 mb-4">Current Handicap</div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-white">
              {bestHandicap?.toFixed(1) || '--'}
            </div>
            <div className="text-xs text-white/60">Personal Best</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white">
              {totalRounds || 0}
            </div>
            <div className="text-xs text-white/60">Rounds Played</div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-xs text-white/70">Recent Form</span>
          <span className="text-sm">{getTrendEmoji()}</span>
        </div>
        <div className="text-xs text-white/50">
          clbhouz.com
        </div>
      </div>
    </div>
  );
};

const ShareHandicapModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentHandicap: number;
  bestHandicap?: number;
  totalRounds?: number;
  recentTrend?: 'up' | 'down' | 'stable';
  onShare?: (method: 'instagram' | 'whatsapp' | 'download') => void;
}> = ({ isOpen, onClose, currentHandicap, bestHandicap, totalRounds, recentTrend, onShare }) => {
  const handleShare = (method: 'instagram' | 'whatsapp' | 'download') => {
    onShare?.(method);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share Your Handicap
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Preview */}
          <div className="flex justify-center">
            <div className="scale-75 origin-center">
              <ShareHandicapBadge
                currentHandicap={currentHandicap}
                bestHandicap={bestHandicap}
                totalRounds={totalRounds}
                recentTrend={recentTrend}
              />
            </div>
          </div>
          
          {/* Share options */}
          <div className="space-y-3">
            <Button
              onClick={() => handleShare('instagram')}
              className="w-full bg-gradient-to-r from-echo-from to-echo-to hover:from-echo-from/90 hover:to-echo-to/90 text-white"
            >
              Share to Instagram Story
            </Button>
            
            <Button
              onClick={() => handleShare('whatsapp')}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
            >
              Share on WhatsApp
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleShare('download')}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Image
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Show off your golf progress to friends and fellow golfers!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ShareHandicap: React.FC<ShareHandicapProps> = ({
  currentHandicap,
  bestHandicap,
  totalRounds,
  recentTrend,
  onShare
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="text-white/70 hover:text-white hover:bg-white/10"
      >
        <Share2 className="h-4 w-4" />
      </Button>
      
      <ShareHandicapModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentHandicap={currentHandicap}
        bestHandicap={bestHandicap}
        totalRounds={totalRounds}
        recentTrend={recentTrend}
        onShare={onShare}
      />
    </>
  );
};

export default ShareHandicap;