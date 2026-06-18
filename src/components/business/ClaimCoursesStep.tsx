import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Check, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { AppLog } from '@/lib/logger';
import { toast } from 'sonner';

interface Course {
  id: string;
  name: string;
  country: string | null;
  region: string | null;
}

interface ClaimCoursesStepProps {
  clubId: string;
  businessId: string;
  onComplete: () => void;
  onSkip: () => void;
}

/**
 * Step for claiming courses after Golf Club business creation.
 * Shows all courses under the selected club and lets user select which to claim.
 */
export const ClaimCoursesStep: React.FC<ClaimCoursesStepProps> = ({
  clubId,
  businessId,
  onComplete,
  onSkip,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const autoSaveTriggered = useRef(false);

  // Fetch courses for this club
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('golf_courses')
          .select('id, name, country, region')
          .eq('club_id', clubId)
          .order('name');

        if (error) throw error;

        setCourses(data || []);
        // Select all by default
        setSelectedIds(new Set((data || []).map(c => c.id)));
      } catch (error) {
        AppLog.error('[ClaimCoursesStep]', 'Error fetching courses:', error);
        toast.error('Failed to load courses. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (clubId) {
      fetchCourses();
    }
  }, [clubId]);

  // Auto-handle single course or no courses (moved to useEffect to prevent infinite loop)
  useEffect(() => {
    if (loading || autoSaveTriggered.current) return;
    
    if (courses.length === 0) {
      autoSaveTriggered.current = true;
      onSkip();
    } else if (courses.length === 1 && !saving) {
      autoSaveTriggered.current = true;
      handleSave();
    }
  }, [loading, courses.length, saving]);

  const toggleCourse = (courseId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === courses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(courses.map(c => c.id)));
    }
  };

  const handleSave = async () => {
    if (selectedIds.size === 0) {
      onSkip();
      return;
    }

    setSaving(true);
    try {
      // Claim status is derived from business_accounts.club_id (set during business
      // creation), read via useCourseClaim / useBusinessClaimForCourse. The previous
      // write to business_claimed_courses was dead (read by nothing) and has been
      // removed. This step now simply confirms the selection and proceeds.
      onComplete();
    } catch (error) {
      AppLog.error('[ClaimCoursesStep]', 'Error in claim step:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Don't render UI if auto-handling (single/no courses)
  if (courses.length <= 1) {
    return (
      <div className="py-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Claim your courses</h2>
      </div>

      <p className="text-sm text-muted-foreground">
        This club has {courses.length} courses. Select the ones you want to manage.
      </p>

      {/* Select all toggle */}
      <button
        type="button"
        onClick={toggleAll}
        className="text-sm text-primary hover:underline"
      >
        {selectedIds.size === courses.length ? 'Deselect all' : 'Select all'}
      </button>

      {/* Course list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {courses.map((course) => (
          <button
            key={course.id}
            type="button"
            onClick={() => toggleCourse(course.id)}
            className={cn(
              "w-full flex items-center gap-3 p-3 border rounded-sq-sm transition-colors text-left",
              selectedIds.has(course.id)
                ? "border-primary/50 bg-primary/5"
                : "border-border hover:bg-muted/30"
            )}
          >
            <Checkbox
              checked={selectedIds.has(course.id)}
              onCheckedChange={() => toggleCourse(course.id)}
              className="pointer-events-none"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{course.name}</div>
              {course.region && (
                <div className="text-xs text-muted-foreground truncate">
                  {[course.region, course.country].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
            {selectedIds.has(course.id) && (
              <Check className="w-4 h-4 text-primary flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="ghost"
          onClick={onSkip}
          disabled={saving}
          className="flex-1"
        >
          Skip for now
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || selectedIds.size === 0}
          className="flex-1"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            `Claim ${selectedIds.size} course${selectedIds.size !== 1 ? 's' : ''}`
          )}
        </Button>
      </div>
    </motion.div>
  );
};
