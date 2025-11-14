/**
 * HubButtons - Shared button components for Hub pages
 */
import React from 'react';
import { haptic } from '@/utils/haptics';

interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function PrimaryCTAButton({ label, onClick, disabled, className = '' }: ButtonProps) {
  const handleClick = () => {
    haptic('light');
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`hub-btn hub-btn--primary ${className}`}
    >
      {label}
    </button>
  );
}

export function SecondaryButton({ label, onClick, disabled, className = '' }: ButtonProps) {
  const handleClick = () => {
    haptic('light');
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`hub-btn hub-btn--secondary ${className}`}
    >
      {label}
    </button>
  );
}

export function DestructiveButton({ label, onClick, disabled, className = '' }: ButtonProps) {
  const handleClick = () => {
    haptic('medium');
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`hub-btn hub-btn--destructive ${className}`}
    >
      {label}
    </button>
  );
}
