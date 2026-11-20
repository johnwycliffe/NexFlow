import React, { useState } from 'react';
import { Table as TableIcon, BarChart3, HelpCircle } from 'lucide-react';

export const ChartContainer = ({
  title,
  subtitle,
  children,
  legendItems = [], // [{ label, color, dashed }]
  summary,
  height = 300,
  actions,
  className = '',
  accessibleTableData = null // [{ ... }]
}) => {
  const [showTable, setShowTable] = useState(false);

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-2xs ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>
            {summary && (
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {summary}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {accessibleTableData && (
            <button
              type="button"
              onClick={() => setShowTable(!showTable)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
              title="Toggle accessible data table representation"
            >
              {showTable ? <BarChart3 className="w-3.5 h-3.5" /> : <TableIcon className="w-3.5 h-3.5" />}
              <span>{showTable ? 'View Chart' : 'View Data Table'}</span>
            </button>
          )}
          {actions}
        </div>
      </div>

      {/* Visual Chart or Accessible Table View */}
      {showTable && accessibleTableData ? (
        <div className="overflow-x-auto max-h-[300px] border border-slate-100 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr>
                {Object.keys(accessibleTableData[0] || {}).map((k) => (
                  <th key={k} className="px-3 py-2 font-semibold text-slate-600 capitalize">
                    {k.replace(/([A-Z])/g, ' $1')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accessibleTableData.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="px-3 py-2 text-slate-700">
                      {String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ height: `${height}px` }} className="w-full">
          {children}
        </div>
      )}

      {/* Standardized Direct Series Legend */}
      {legendItems.length > 0 && !showTable && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-600">
          {legendItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span
                style={{
                  backgroundColor: item.color,
                  borderTop: item.dashed ? '2px dashed #000' : 'none'
                }}
                className="w-3 h-3 rounded-xs shrink-0"
                aria-hidden="true"
              />
              <span className="font-medium text-slate-700">{item.label}</span>
              {item.note && <span className="text-[11px] text-slate-400">({item.note})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChartContainer;

