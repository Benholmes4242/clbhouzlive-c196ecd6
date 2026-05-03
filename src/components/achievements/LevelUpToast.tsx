import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Trophy, Share2 } from 'lucide-react';

interface LevelUpToastProps {
  levelUpData: {
    newLevel: string;
    totalXP: number;
    previousLevel: string;
  } | null;
  onDismiss: () => void;
  onShare: (data: any) => void;
}

const LEVEL_COLORS: Record<string, string> = {
  Bronze: '#CD7F32',
  Blue: '#4A90E2',
  Green: '#6e9277',
  Silver: '#C0C0C0',
  Gold: '#FFD700',
};

export const LevelUpToast: React.FC<LevelUpToastProps> = ({
  levelUpData,
  onDismiss,
  onShare,
}) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (levelUpData) {
      setIsVisible(true);
      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [levelUpData, onDismiss]);

  if (!levelUpData) return null;

  const levelColor = LEVEL_COLORS[levelUpData.newLevel] || '#6e9277';

  const handleShare = () => {
    onShare({
      type: 'level_up',
      levelName: `${levelUpData.newLevel} Ring`,
      totalXP: levelUpData.totalXP,
      levelColor,
    });
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const handleViewJourney = () => {
    navigate('/profile');
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
        >
          <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-sq-md shadow-2xl p-6">
            {/* Ring animation */}
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.6, times: [0, 0.7, 1] }}
                className="relative"
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: `conic-gradient(${levelColor} 0deg, ${levelColor} 360deg)`,
                    boxShadow: `0 0 20px ${levelColor}40`,
                  }}
                >
                  <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center">
                    <Trophy className="w-8 h-8" style={{ color: levelColor }} />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Content */}
            <div className="text-center space-y-2 mb-4">
              <h3 className="text-2xl font-bold">Level Up! 🎉</h3>
              <p className="text-lg font-semibold" style={{ color: levelColor }}>
                {levelUpData.newLevel} Ring Unlocked
              </p>
              <p className="text-sm text-muted-foreground">
                Total XP: {levelUpData.totalXP.toLocaleString()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex-1"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button
                size="sm"
                onClick={handleViewJourney}
                className="flex-1"
              >
                View Journey
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
