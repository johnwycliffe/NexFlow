import React from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  X
} from 'lucide-react';
import { Button } from './Button';
import { exportToCSV } from '../utils/exportCSV';

export const Table = ({
  columns = [], // [{ key, header, sortable, render, className, align }]
  data = [],
  filterHook, // Return value from useTableFilter
  title,
  subtitle,
  actions,
  exportFilename = 'export_data',
  allowExport = true,
  emptyMessage = 'No matching manufacturing records found.',
  emptyIcon: EmptyIcon
}) => {
  const {
    searchTerm = '',
    setSearchTerm = () => {},
    sortField = '',
    sortDirection = 'asc',
    handleSort = () => {},
    currentPage = 1,
    setCurrentPage = () => {},
    pageSize = 10,
    setPageSize = () => {},
    totalItems = (data || []).length,
    totalPages = 1,
    paginatedData = (data || []),
    filteredData = (data || []),
    resetFilters = () => {}
  } = filterHook || {};

  const handleExport = () => {
    exportToCSV(filteredData, exportFilename);
  };

  const startRecord = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
      {/* Table Header / Toolbar */}
      <div className="border-b border-slate-100 p-4 sm:p-5">
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                aria-label="Search records in table"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search records..."
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  aria-label="Clear search query"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Custom External Actions (e.g. Add Record Button) */}
            {actions}

            {/* Export CSV Button */}
            {allowExport && (
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={handleExport}
                title="Export filtered records as CSV"
              >
                Export
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table Surface */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" role="table">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {columns.map((col) => {
                const isSorted = sortField === col.key;
                const sortable = col.sortable !== false;
                const ariaSort = isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none';

                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={sortable ? ariaSort : undefined}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 select-none ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    } ${col.className || ''}`}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className={`inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded px-1 -mx-1 ${
                          col.align === 'right' ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <span>{col.header}</span>
                        <span className="shrink-0 text-slate-400">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      </button>
                    ) : (
                      <span>{col.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    {EmptyIcon && <EmptyIcon className="w-8 h-8 text-slate-300" />}
                    <p className="text-sm font-medium text-slate-600">{emptyMessage}</p>
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="text-xs text-blue-600 hover:underline font-medium mt-1"
                      >
                        Clear search filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-sm text-slate-700 whitespace-nowrap ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>
              Showing <span className="font-semibold text-slate-900">{startRecord}</span> to{' '}
              <span className="font-semibold text-slate-900">{endRecord}</span> of{' '}
              <span className="font-semibold text-slate-900">{totalItems}</span> entries
            </span>

            {/* Page Size Selector */}
            <div className="hidden sm:flex items-center gap-1.5 ml-4">
              <span className="text-slate-400">Rows:</span>
              <select
                aria-label="Items per page"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 font-medium">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
