import React, { useState } from 'react';
import { Plus, MapPin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WizardData, WizardRound } from '../types';

interface Props {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
  onNext: () => void;
}

export function StepCourseSelection({ data, onChange, onNext }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isSingleRound = data.eventType === 'single_round';
  const canContinue = data.rounds.length > 0;

  const handleAddCourse = (course: { id: string; name: string; location?: string }) => {
    const newRound: WizardRound = {
      courseId: course.id,
      courseName: course.name,
      courseLocation: course.location || '',
      roundDate: data.startDate || new Date().toISOString().split('T')[0],
      firstTeeTime: '08:00',
      teeTimeInterval: 8,
      holes: 18,
      shotgunStart: false,
    };

    if (isSingleRound) {
      onChange({ rounds: [newRound] });
    } else {
      onChange({ rounds: [...data.rounds, newRound] });
    }
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleRemoveCourse = (index: number) => {
    const updated = [...data.rounds];
    updated.splice(index, 1);
    onChange({ rounds: updated });
  };

  const handleManualAdd = () => {
    if (searchQuery.trim()) {
      handleAddCourse({ id: `manual-${Date.now()}`, name: searchQuery.trim() });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <p className="text-muted-foreground text-center">
          {isSingleRound
            ? 'Select the course for your round'
            : "Add the courses you'll be playing"}
        </p>

        {data.rounds.length > 0 ? (
          <div className="space-y-2">
            {data.rounds.map((round, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
              >
                {!isSingleRound && (
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-green-700 font-medium text-sm">{index + 1}</span>
                  </div>
                )}
                <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{round.courseName}</p>
                  {round.courseLocation && (
                    <p className="text-sm text-muted-foreground truncate">
                      {round.courseLocation}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveCourse(index)}
                  className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No courses added yet</p>
          </div>
        )}

        {(!isSingleRound || data.rounds.length === 0) && (
          <div className="pt-2">
            {searchOpen ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter course name..."
                  className="w-full p-3 bg-muted rounded-lg"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleManualAdd}
                    disabled={!searchQuery.trim()}
                    className="flex-1"
                  >
                    Add Course
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full p-4 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {isSingleRound ? 'Select course' : 'Add another course'}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-background">
        <Button onClick={onNext} disabled={!canContinue} className="w-full h-12 rounded-xl">
          Continue
        </Button>
      </div>
    </div>
  );
}
