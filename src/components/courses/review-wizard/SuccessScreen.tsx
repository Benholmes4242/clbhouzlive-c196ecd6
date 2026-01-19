/**
 * Success Screen after review submission
 * Renamed "Share" to "Share to Feed"
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Eye, Plus, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReviewWizardCourse } from './types';

interface SuccessScreenProps {
  course: ReviewWizardCourse | null;
  ratingId: string;
  onViewReview: () => void;
  onAddAnother: () => void;
  onClose: () => void;
  onShare: () => void;
}

export function SuccessScreen({
  course,
  ratingId,
  onViewReview,
  onAddAnother,
  onClose,
  onShare,
}: SuccessScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center"
    >
      {/* Success icon - glassy orange style */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className="mb-6"
      >
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 179, 71, 0.15) 0%, rgba(247, 147, 30, 0.2) 100%)',
            boxShadow: '0 2px 12px rgba(247, 147, 30, 0.15)',
          }}
        >
          <CheckCircle 
            className="h-10 w-10" 
            style={{ color: '#F7931E' }}
          />
        </div>
      </motion.div>

      {/* Success message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2 mb-8"
      >
        <h2 className="text-xl font-semibold text-foreground">
          Review Submitted!
        </h2>
        {course && (
          <p className="text-muted-foreground">
            Your review of <span className="font-medium text-foreground">{course.name}</span> has been saved.
          </p>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col w-full gap-3 max-w-xs"
      >
        <Button
          onClick={onViewReview}
          className="w-full gap-2"
        >
          <Eye className="h-4 w-4" />
          View Review
        </Button>

        <Button
          variant="outline"
          onClick={onShare}
          className="w-full gap-2"
        >
          <Megaphone className="h-4 w-4" />
          Share to Feed
        </Button>

        <Button
          variant="ghost"
          onClick={onAddAnother}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Another Review
        </Button>

        <Button
          variant="link"
          onClick={onClose}
          className="w-full text-muted-foreground"
        >
          Done
        </Button>
      </motion.div>
    </motion.div>
  );
}
