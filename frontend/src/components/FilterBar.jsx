import React from 'react';
import { Search, X, Filter, RotateCcw } from 'lucide-react';

export const FilterBar = ({
  searchTerm = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filterControls, // JSX array or elements for custom dropdowns
  activeFiltersCount = 0,
  onResetFilters,
  actions,
  className = ''
}) => {
  return (
    <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-2xs ${className}`}>
      {/* Left: Search Bar & Dropdown Selectors */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {/* Search Input */}
        {onSearchChange && (
          <div className="relative min-w-[220px] sm:min-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search input"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Modular Filter Controls (Dropdowns, Toggles, Date Range) */}
        {filterControls}

        {/* Clear Filters Button */}
        {activeFiltersCount > 0 && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
            title="Reset active filters"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>Reset ({activeFiltersCount})</span>
          </button>
        )}
      </div>

      {/* Right: Actions (e.g. Export, Add New Record) */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
};

export default FilterBar;

