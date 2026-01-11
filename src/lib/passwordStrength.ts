export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number; // 0-5
  feedback: string[];
  color: string;
  percentage: number;
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      strength: 'weak',
      score: 0,
      feedback: ['Enter a password'],
      color: '#6B7280',
      percentage: 0
    };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Character diversity
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Generate feedback
  if (password.length < 8) {
    feedback.push('At least 8 characters');
  } else if (password.length < 12) {
    feedback.push('12+ characters recommended');
  }

  if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters');
  if (!/[0-9]/.test(password)) feedback.push('Add numbers');
  if (!/[^A-Za-z0-9]/.test(password)) feedback.push('Add special characters');

  // Determine strength
  let strength: PasswordStrength;
  let color: string;
  let percentage: number;

  if (score <= 2) {
    strength = 'weak';
    color = '#EF4444'; // red-500
    percentage = 33;
  } else if (score <= 4) {
    strength = 'medium';
    color = '#F59E0B'; // amber-500
    percentage = 66;
  } else {
    strength = 'strong';
    color = '#10B981'; // green-500
    percentage = 100;
  }

  return { strength, score, feedback, color, percentage };
}
