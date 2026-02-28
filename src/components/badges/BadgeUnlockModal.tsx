import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/types/badges';
import { Share2, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { BadgeShareModal } from './BadgeShareModal';

interface BadgeUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge: Badge | null;
  xpGained?: number;
}

export const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({
  isOpen,
  onClose,
  badge,
  xpGained = 100
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { playUnlockSound, isSoundEnabled, toggleSound } = useSoundEffects();

  useEffect(() => {
    if (isOpen && badge) {
      setIsAnimating(true);
      if (isSoundEnabled) {
        playUnlockSound();
      }
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
    }
  }, [isOpen, badge, isSoundEnabled, playUnlockSound]);

  const getTierGradient = (tier: Badge['tier']) => {
    switch (tier) {
      case 'bronze': return 'from-amber-600 to-amber-400';
      case 'silver': return 'from-gray-400 to-gray-200';
      case 'gold': return 'from-yellow-500 to-yellow-300';
      case 'platinum': return 'from-purple-600 to-purple-400';
      case 'diamond': return 'from-blue-600 to-blue-400';
      default: return 'from-gray-500 to-gray-300';
    }
  };

  const getTierGlow = (tier: Badge['tier']) => {
    switch (tier) {
      case 'bronze': return 'shadow-amber-500/50';
      case 'silver': return 'shadow-gray-400/50';
      case 'gold': return 'shadow-yellow-500/50';
      case 'platinum': return 'shadow-purple-600/50';
      case 'diamond': return 'shadow-blue-600/50';
      default: return 'shadow-gray-500/50';
    }
  };

  if (!badge) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-emerald-600/30 backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_50%)]" />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSound}
            className="absolute top-4 right-12 w-8 h-8 text-white/70 hover:text-white"
          >
            {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>

          <div className="relative text-center py-6">
            <DialogTitle className="sr-only">New Badge Unlocked</DialogTitle>
            
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <Sparkles className={`h-8 w-8 text-yellow-400 ${isAnimating ? 'animate-spin' : ''}`} />
                <h2 className="text-2xl font-bold text-white mx-3" aria-describedby="badge-description">Badge Unlocked!</h2>
                <Sparkles className={`h-8 w-8 text-yellow-400 ${isAnimating ? 'animate-spin' : ''}`} />
              </div>
              <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 mx-auto rounded-full" />
            </div>

            <div className={`relative mx-auto mb-6 ${isAnimating ? 'animate-bounce' : ''}`}>
              <div 
                className={`w-32 h-32 rounded-full bg-gradient-to-br ${getTierGradient(badge.tier)} 
                  flex items-center justify-center mx-auto shadow-2xl ${getTierGlow(badge.tier)}
                  ${isAnimating ? 'animate-pulse' : ''}`}
              >
                <span className="text-5xl">{badge.emoji}</span>
              </div>
              
              <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 
                px-3 py-1 rounded-full bg-gradient-to-r ${getTierGradient(badge.tier)} 
                text-white text-xs font-bold uppercase tracking-wider shadow-lg`}>
                {badge.tier}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">{badge.display_name}</h3>
              <p className="text-white/80 text-sm mb-4 max-w-xs mx-auto">{badge.description}</p>
              
              <div className="flex items-center justify-center bg-yellow-500/20 border border-yellow-400/30 rounded-lg py-3 px-4 mb-4">
                <Sparkles className="h-5 w-5 text-yellow-400 mr-2" />
                <span className="text-white font-semibold">+{xpGained} XP Earned!</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setShowShareModal(true)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Achievement
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Continue
              </Button>
            </div>
          </div>

          {isAnimating && (
            <>
              <div className="absolute top-10 left-10 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
              <div className="absolute top-20 right-16 w-3 h-3 bg-emerald-400 rounded-full animate-ping delay-300" />
              <div className="absolute bottom-20 left-20 w-2 h-2 bg-purple-400 rounded-full animate-ping delay-700" />
              <div className="absolute bottom-10 right-10 w-2 h-2 bg-blue-400 rounded-full animate-ping delay-1000" />
            </>
          )}
        </DialogContent>
      </Dialog>

      <BadgeShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        badge={badge}
      />
    </>
  );
};
