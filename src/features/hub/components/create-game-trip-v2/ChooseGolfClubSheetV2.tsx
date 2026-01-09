/**
 * ChooseGolfClubSheetV2 - Course picker sheet
 * For Phase 1: wraps existing CourseSearchSheet
 */

import React from 'react';
import { CourseSearchSheet } from '@/components/courses/CourseSearchSheet';

interface ChooseGolfClubSheetV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (course: {
    id: string;
    name: string;
    country: string;
    sub_country?: string;
    thumbnail_image?: string;
  }) => void;
}

export function ChooseGolfClubSheetV2({ isOpen, onClose, onSelect }: ChooseGolfClubSheetV2Props) {
  return (
    <CourseSearchSheet
      isOpen={isOpen}
      onClose={onClose}
      onSelect={onSelect}
    />
  );
}
