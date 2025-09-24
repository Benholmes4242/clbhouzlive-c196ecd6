import React from 'react';
import { ReliableSwingCoach } from '@/components/swing/ReliableSwingCoach';

interface SwingCoachProps {
  onClose?: () => void;
}

export const SwingCoach: React.FC<SwingCoachProps> = ({ onClose }) => {
  return <ReliableSwingCoach onClose={onClose} />;
};