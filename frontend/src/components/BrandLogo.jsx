import React from 'react';

export const BrandLogo = ({
  variant = 'full',
  size = 'md',
  className = '',
  showTagline = true
}) => {
  const sizeMap = {
    sm: { img: 'h-6 w-6', text: 'text-sm', sub: 'text-[8px]' },
    md: { img: 'h-9 w-9', text: 'text-base', sub: 'text-[9px]' },
    lg: { img: 'h-12 w-12', text: 'text-xl', sub: 'text-[10px]' },
    xl: { img: 'h-16 w-16', text: 'text-2xl', sub: 'text-xs' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  if (variant === 'icon') {
    return (
      <img
        src="/favicon/apple-touch-icon.png"
        alt="NexFlow ERP"
        className={`${currentSize.img} object-contain rounded-lg ${className}`}
      />
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/favicon/apple-touch-icon.png"
        alt="NexFlow ERP"
        className={`${currentSize.img} object-contain rounded-lg shrink-0`}
      />
      <div className="flex flex-col">
        <span className={`font-bold ${currentSize.text} text-slate-900 tracking-tight leading-none`}>
          NexFlow <span className="text-blue-600 font-semibold tracking-normal">ERP</span>
        </span>
        {showTagline && (
          <span className={`${currentSize.sub} text-slate-400 font-medium uppercase tracking-wider mt-0.5`}>
            Production Planning System
          </span>
        )}
      </div>
    </div>
  );
};

