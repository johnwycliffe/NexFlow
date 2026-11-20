import React from 'react';
import { getStatusToken } from '../design-system';
import { getStatusVariant } from '../utils/formatters';

export const Badge = ({
  children,
  variant,
  status,
  size = 'sm', // 'sm' | 'md'
  showDot = true,
  className = ''
}) => {
  // Priority: explicit variant -> getStatusToken from status -> fallback to getStatusVariant
  const token = status ? getStatusToken(status) : null;
  const fallbackKey = variant || (status ? getStatusVariant(status) : 'neutral');

  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20',
    primary: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/20',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/20',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-600/20',
    info: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/20',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const styleClass = token
    ? `${token.bg} ${token.text} ${token.border}`
    : (variantStyles[fallbackKey] || variantStyles.neutral);

  return (
    <span
      role="status"
      className={`inline-flex items-center rounded-full font-medium border tracking-wide whitespace-nowrap shadow-2xs select-none ${sizeStyles[size]} ${styleClass} ${className}`}
    >
      {showDot && (
        <span
          aria-hidden="true"
          className="w-1.5 h-1.5 rounded-full shrink-0 bg-current opacity-75"
        />
      )}
      <span>{children || status}</span>
    </span>
  );
};

export default Badge;
