import React, { useMemo } from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const strength = useMemo(() => {
    if (!password) return 0;
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character type checks
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Bonus for combination of character types
    if (score >= 4) score += 1;
    
    return Math.min(score, 5);
  }, [password]);

  const getStrengthText = (score: number): string => {
    if (score === 0) return 'Very Weak';
    if (score === 1) return 'Weak';
    if (score === 2) return 'Fair';
    if (score === 3) return 'Good';
    if (score === 4) return 'Strong';
    return 'Very Strong';
  };

  const getStrengthColor = (score: number): string => {
    if (score === 0) return 'bg-red-500';
    if (score === 1) return 'bg-red-400';
    if (score === 2) return 'bg-yellow-500';
    if (score === 3) return 'bg-yellow-400';
    if (score === 4) return 'bg-green-500';
    return 'bg-green-400';
  };

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center space-x-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor(strength)}`}
            style={{ width: `${(strength / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 min-w-[80px]">
          {getStrengthText(strength)}
        </span>
      </div>
      <div className="mt-1 text-xs text-gray-500">
        Password requirements:
        <ul className="list-disc list-inside mt-1">
          <li className={password.length >= 8 ? 'text-green-600' : ''}>
            At least 8 characters
          </li>
          <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
            One uppercase letter
          </li>
          <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
            One lowercase letter
          </li>
          <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
            One number
          </li>
          <li className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : ''}>
            One special character
          </li>
        </ul>
      </div>
    </div>
  );
};
