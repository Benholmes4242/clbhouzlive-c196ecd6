import { calculatePasswordStrength } from '@/lib/passwordStrength';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  show: boolean;
}

export function PasswordStrengthIndicator({ password, show }: PasswordStrengthIndicatorProps) {
  if (!show || !password) return null;

  const result = calculatePasswordStrength(password);

  const getIcon = () => {
    switch (result.strength) {
      case 'weak':
        return <ShieldAlert className="w-4 h-4" />;
      case 'medium':
        return <Shield className="w-4 h-4" />;
      case 'strong':
        return <ShieldCheck className="w-4 h-4" />;
    }
  };

  const getStrengthLabel = () => {
    switch (result.strength) {
      case 'weak':
        return 'Weak';
      case 'medium':
        return 'Medium';
      case 'strong':
        return 'Strong';
    }
  };

  return (
    <div className="space-y-2 mt-2 animate-fade-in">
      {/* Strength meter bars */}
      <div className="flex gap-1.5 h-1">
        <div 
          className={`flex-1 rounded-full transition-all duration-300 ${
            result.percentage >= 33 ? 'opacity-100' : 'opacity-20'
          }`}
          style={{ 
            backgroundColor: result.percentage >= 33 ? result.color : '#374151'
          }}
        />
        <div 
          className={`flex-1 rounded-full transition-all duration-300 ${
            result.percentage >= 66 ? 'opacity-100' : 'opacity-20'
          }`}
          style={{ 
            backgroundColor: result.percentage >= 66 ? result.color : '#374151'
          }}
        />
        <div 
          className={`flex-1 rounded-full transition-all duration-300 ${
            result.percentage >= 100 ? 'opacity-100' : 'opacity-20'
          }`}
          style={{ 
            backgroundColor: result.percentage >= 100 ? result.color : '#374151'
          }}
        />
      </div>

      {/* Strength label with icon */}
      <div className="flex items-center gap-2 text-xs">
        <span style={{ color: result.color }} className="flex items-center gap-1">
          {getIcon()}
          {getStrengthLabel()}
        </span>
        {result.feedback.length > 0 && (
          <span className="text-gray-400">
            · {result.feedback[0]}
          </span>
        )}
      </div>
    </div>
  );
}
