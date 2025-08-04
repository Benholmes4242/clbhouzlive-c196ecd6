import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { X, Trophy, Target, Zap, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import CircularProgress from '@/components/ui/circular-progress';
import MobileModal from '@/components/ui/MobileModal';

interface CompareProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    name: string;
    coursesPlayed: number;
    totalXP: number;
    britainIrelandCompleted: number;
    europeCompleted: number;
    usaCompleted: number;
    worldwideCompleted: number;
  };
  otherUser: {
    name: string;
    coursesPlayed: number;
    totalXP: number;
    britainIrelandCompleted: number;
    europeCompleted: number;
    usaCompleted: number;
    worldwideCompleted: number;
  };
}

const CompareProgressModal: React.FC<CompareProgressModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  otherUser
}) => {
  const getTrophyLevel = (courses: number) => {
    if (courses >= 300) return { name: 'Legend', emoji: '👑', color: 'text-purple-500' };
    if (courses >= 200) return { name: 'Elite', emoji: '🏆', color: 'text-emerald-500' };
    if (courses >= 100) return { name: 'Century', emoji: '🥇', color: 'text-blue-500' };
    if (courses >= 50) return { name: 'Turn', emoji: '🥈', color: 'text-gray-500' };
    if (courses >= 20) return { name: 'Rookie', emoji: '🥉', color: 'text-amber-500' };
    return { name: 'Starter', emoji: '⭐', color: 'text-gray-400' };
  };

  const getProgressPercent = (courses: number) => Math.min((courses / 300) * 100, 100);
  const getRegionalPercent = (completed: number, total: number) => Math.min((completed / total) * 100, 100);

  const currentUserTrophy = getTrophyLevel(currentUser.coursesPlayed);
  const otherUserTrophy = getTrophyLevel(otherUser.coursesPlayed);

  const courseDiff = currentUser.coursesPlayed - otherUser.coursesPlayed;
  const xpDiff = currentUser.totalXP - otherUser.totalXP;

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title="Golf Journey Comparison"
    >
      <div className="space-y-8">
        {/* Header Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current User */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{currentUser.name}</h3>
              <Badge 
                variant="secondary" 
                className={cn('mb-4', currentUserTrophy.color, 'border-0 bg-muted')}
              >
                {currentUserTrophy.emoji} {currentUserTrophy.name}
              </Badge>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{currentUser.coursesPlayed} courses</div>
                <div className="text-muted-foreground">{currentUser.totalXP.toLocaleString()} XP</div>
              </div>
            </div>
          </div>

          {/* Other User */}
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{otherUser.name}</h3>
              <Badge 
                variant="secondary" 
                className={cn('mb-4', otherUserTrophy.color, 'border-0 bg-muted')}
              >
                {otherUserTrophy.emoji} {otherUserTrophy.name}
              </Badge>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{otherUser.coursesPlayed} courses</div>
                <div className="text-muted-foreground">{otherUser.totalXP.toLocaleString()} XP</div>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Summary */}
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>
                {courseDiff > 0 
                  ? `You're ahead by ${courseDiff} course${courseDiff === 1 ? '' : 's'}! 🎯`
                  : courseDiff < 0 
                  ? `You're ${Math.abs(courseDiff)} course${Math.abs(courseDiff) === 1 ? '' : 's'} behind! 🏃‍♂️`
                  : "You're tied! Perfect competition! 🤝"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>
                {xpDiff > 0 
                  ? `+${xpDiff.toLocaleString()} XP ahead`
                  : xpDiff < 0 
                  ? `${Math.abs(xpDiff).toLocaleString()} XP behind`
                  : "Equal XP"}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Comparison */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress Comparison
          </h3>

          {/* Overall Progress */}
          <div className="space-y-4">
            <h4 className="font-medium">Overall Progress</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{currentUser.name}</span>
                  <span>{currentUser.coursesPlayed}/300 ({Math.round(getProgressPercent(currentUser.coursesPlayed))}%)</span>
                </div>
                <Progress value={getProgressPercent(currentUser.coursesPlayed)} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{otherUser.name}</span>
                  <span>{otherUser.coursesPlayed}/300 ({Math.round(getProgressPercent(otherUser.coursesPlayed))}%)</span>
                </div>
                <Progress value={getProgressPercent(otherUser.coursesPlayed)} className="h-2" />
              </div>
            </div>
          </div>

          {/* Regional Comparison */}
          <div className="space-y-4">
            <h4 className="font-medium">Regional Lists Progress</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Great Britain & Ireland */}
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium mb-3">🇬🇧 GB&I</div>
                <div className="space-y-3">
                  <div>
                    <CircularProgress 
                      completed={currentUser.britainIrelandCompleted}
                      total={20} 
                      size={40} 
                      strokeWidth={3}
                      className="mx-auto"
                    />
                    <div className="text-xs mt-1">{currentUser.name}</div>
                    <div className="text-xs text-muted-foreground">{currentUser.britainIrelandCompleted}/20</div>
                  </div>
                  <div>
                    <CircularProgress 
                      completed={otherUser.britainIrelandCompleted}
                      total={20} 
                      size={40} 
                      strokeWidth={3}
                      className="mx-auto"
                    />
                    <div className="text-xs mt-1">{otherUser.name}</div>
                    <div className="text-xs text-muted-foreground">{otherUser.britainIrelandCompleted}/20</div>
                  </div>
                </div>
              </div>

              {/* Europe */}
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium mb-3">🇪🇺 Europe</div>
                <div className="space-y-3">
                  <div>
                    <CircularProgress 
                      completed={currentUser.europeCompleted}
                      total={100} 
                      size={40} 
                      strokeWidth={3}
                      className="mx-auto"
                    />
                    <div className="text-xs mt-1">{currentUser.name}</div>
                    <div className="text-xs text-muted-foreground">{currentUser.europeCompleted}/100</div>
                  </div>
                  <div>
                    <CircularProgress 
                      completed={otherUser.europeCompleted}
                      total={100} 
                      size={40} 
                      strokeWidth={3}
                      className="mx-auto"
                    />
                    <div className="text-xs mt-1">{otherUser.name}</div>
                    <div className="text-xs text-muted-foreground">{otherUser.europeCompleted}/100</div>
                  </div>
                </div>
              </div>

              {/* USA */}
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium mb-3">🇺🇸 USA</div>
                <div className="space-y-3">
                  <div>
                    <CircularProgress 
                      completed={currentUser.usaCompleted}
                      total={100} 
                      size={40} 
                      strokeWidth={3}
                      className="mx-auto"
                    />
                    <div className="text-xs mt-1">{currentUser.name}</div>
                    <div className="text-xs text-muted-foreground">{currentUser.usaCompleted}/100</div>
                  </div>
                  <div>
                    <CircularProgress 
                      completed={otherUser.usaCompleted}
                      total={100} 
                      size={40} 
                      strokeWidth={3}
                      className="mx-auto"
                    />
                    <div className="text-xs mt-1">{otherUser.name}</div>
                    <div className="text-xs text-muted-foreground">{otherUser.usaCompleted}/100</div>
                  </div>
                </div>
              </div>

              {/* Worldwide */}
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium mb-3">🌍 World</div>
                <div className="space-y-3">
                  <div>
                    <CircularProgress 
                      completed={currentUser.worldwideCompleted}
                      total={100} 
                      size={40} 
                      strokeWidth={3}
                      className="mx-auto"
                    />
                    <div className="text-xs mt-1">{currentUser.name}</div>
                    <div className="text-xs text-muted-foreground">{currentUser.worldwideCompleted}/100</div>
                  </div>
                  <div>
                    <CircularProgress 
                      completed={otherUser.worldwideCompleted}
                      total={100} 
                      size={40} 
                      strokeWidth={3}
                      className="mx-auto"
                    />
                    <div className="text-xs mt-1">{otherUser.name}</div>
                    <div className="text-xs text-muted-foreground">{otherUser.worldwideCompleted}/100</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MobileModal>
  );
};

export default CompareProgressModal;
