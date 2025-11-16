import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PostMediaPreview from '../posts/PostMediaPreview';
import CourseTagInput from '../posts/CourseTagInput';
import { AchievementCard } from '../achievements/AchievementCard';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface GolfCourse {
  id: string;
  name: string;
  country: string;
  region?: string;
}

interface AchievementData {
  type?: 'achievement' | 'level_up';
  achievementId?: string;
  name: string;
  description: string;
  category?: string;
  points?: number;
  levelName?: string;
  totalXP?: number;
  levelColor?: string;
}

interface SnapComposerModalWithAchievementProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFile: File | null;
  previewUrl: string;
  captionInputRef: React.RefObject<HTMLDivElement>;
  onCaptionInput: (e: React.FormEvent<HTMLDivElement>) => void;
  showSuggestions: boolean;
  mentionSuggestions: TaggableEntity[];
  onSelectMention: (entity: TaggableEntity) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  selectedCourse: GolfCourse | null;
  onCourseSelect: (course: GolfCourse | null) => void;
  achievementData?: AchievementData | null;
}

const SnapComposerModalWithAchievement = ({
  isOpen,
  onClose,
  selectedFile,
  previewUrl,
  captionInputRef,
  onCaptionInput,
  showSuggestions,
  mentionSuggestions,
  onSelectMention,
  onSubmit,
  isSubmitting,
  selectedCourse,
  onCourseSelect,
  achievementData,
}: SnapComposerModalWithAchievementProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a Moment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Achievement or Level-Up Card (if present) */}
          {achievementData && (
            <div className="mb-4">
              {achievementData.type === 'level_up' ? (
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 mb-3">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: `conic-gradient(${achievementData.levelColor} 0deg, ${achievementData.levelColor} 360deg)`,
                        boxShadow: `0 0 15px ${achievementData.levelColor}30`,
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center">
                        <span className="text-2xl">🏆</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Level Up
                      </div>
                      <div className="text-lg font-bold" style={{ color: achievementData.levelColor }}>
                        {achievementData.levelName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {achievementData.totalXP?.toLocaleString()} Total XP
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <AchievementCard
                  name={achievementData.name}
                  description={achievementData.description}
                  category={achievementData.category || ''}
                  points={achievementData.points}
                  compact
                />
              )}
            </div>
          )}

          {/* Media Preview */}
          {selectedFile && <PostMediaPreview file={selectedFile} previewUrl={previewUrl} />}

          {/* Caption Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Caption</label>
            <div
              ref={captionInputRef}
              contentEditable
              onInput={onCaptionInput}
              className="min-h-[100px] p-3 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
              data-placeholder="Share your moment..."
            />
            {showSuggestions && mentionSuggestions.length > 0 && (
              <div className="mt-2 bg-card border border-border rounded-lg shadow-lg">
                {mentionSuggestions.map((entity) => (
                  <button
                    key={entity.id}
                    onClick={() => onSelectMention(entity)}
                    className="w-full text-left px-3 py-2 hover:bg-accent/50 transition-colors"
                  >
                    <div className="font-medium text-foreground">{entity.name}</div>
                    {entity.username && (
                      <div className="text-xs text-muted-foreground">@{entity.username}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Course Tag Input */}
          {!achievementData && (
            <CourseTagInput
              selectedCourse={selectedCourse}
              onCourseSelect={onCourseSelect}
            />
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isSubmitting || (!selectedFile && !achievementData)}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SnapComposerModalWithAchievement;
