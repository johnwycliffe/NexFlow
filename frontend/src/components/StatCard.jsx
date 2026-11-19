import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  unit,
  subtitle,
  trend,
  trendType = 'up', // 'up' | 'down' | 'neutral'
  icon: Icon,
  colorScheme = 'blue', // 'blue' | 'emerald' | 'amber' | 'rose' | 'purple'
  onClick,
  className = ''
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100',
      badge: 'text-blue-700 bg-blue-50 border-blue-200'
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
      badge: 'text-emerald-700 bg-emerald-50 border-emerald-200'
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
      badge: 'text-amber-700 bg-amber-50 border-amber-200'
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600',
      border: 'border-rose-100',
      badge: 'text-rose-700 bg-rose-50 border-rose-200'
    },
    purple: {
      bg: 'bg-purple-50 text-purple-600',
      border: 'border-purple-100',
      badge: 'text-purple-700 bg-purple-50 border-purple-200'
    }
  };

  const scheme = colorMap[colorScheme] || colorMap.blue;

  return (
    <div
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : 'region'}
      aria-label={`${title}: ${value} ${unit || ''}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs transition-all hover:shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">{title}</p>
        {Icon && (
          <div aria-hidden="true" className={`rounded-lg p-2 shrink-0 ${scheme.bg}`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {unit}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
          <span className="truncate mr-2">{subtitle}</span>
          {trend && (
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold shrink-0 border ${
                trendType === 'up'
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : trendType === 'down'
                  ? 'text-rose-700 bg-rose-50 border-rose-200'
                  : 'text-slate-700 bg-slate-50 border-slate-200'
              }`}
            >
              {trendType === 'up' && <TrendingUp className="w-3 h-3" />}
              {trendType === 'down' && <TrendingDown className="w-3 h-3" />}
              {trendType === 'neutral' && <Minus className="w-3 h-3" />}
              <span>{trend}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
