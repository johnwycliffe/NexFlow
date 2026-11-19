import React, { useState } from 'react';
import { BarChart3, Download, Calendar, Filter, PieChart as PieIcon, TrendingUp, Layers } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useERP } from '../context/useERP';
import { Button } from '../components/Button';
import { exportToCSV } from '../utils/exportCSV';
import { formatCurrency, formatMetric } from '../utils/formatters';
import { reportsService } from '../services';

export const Reports = () => {
  const { productionOrders, qualityInspections, workCenters, inventory, finishedGoods, isBackendConnected } = useERP();

  const [dateRange, setDateRange] = useState({
    start: '2026-10-01',
    end: '2026-11-30'
  });

  const [activeTab, setActiveTab] = useState('throughput'); // throughput, scrap, financial

  // Mock Aggregated Report Datasets
  const monthlyThroughputData = [
    { month: 'Jun 2026', planned: 240, completed: 236, scrapRatePct: 1.6 },
    { month: 'Jul 2026', planned: 280, completed: 284, scrapRatePct: 1.4 },
    { month: 'Aug 2026', planned: 300, completed: 298, scrapRatePct: 1.8 },
    { month: 'Sep 2026', planned: 320, completed: 322, scrapRatePct: 1.2 },
    { month: 'Oct 2026', planned: 340, completed: 335, scrapRatePct: 1.5 },
    { month: 'Nov 2026', planned: 360, completed: 358, scrapRatePct: 1.1 }
  ];

  const workCenterCostData = workCenters.map((wc) => ({
    name: wc.name,
    code: wc.code,
    operatingCostPerDay: wc.maxCapacityHoursPerDay * wc.hourlyOperatingCost,
    efficiency: wc.efficiencyRating
  }));

  const qualityBreakdownData = [
    { name: 'Dyno Torque Variation', count: 7, color: '#f59e0b' },
    { name: 'Powder Coat Blemish', count: 5, color: '#3b82f6' },
    { name: 'Brake Rotor Alignment', count: 4, color: '#10b981' },
    { name: 'CAN-bus Bus Telemetry', count: 2, color: '#8b5cf6' },
    { name: 'Spoke Tension Defect', count: 1, color: '#ec4899' }
  ];

  const handleExportThroughputCSV = () => {
    exportToCSV(monthlyThroughputData, 'monthly_manufacturing_throughput');
  };

  const handleExportWCCostCSV = () => {
    exportToCSV(workCenterCostData, 'work_center_cost_analytics');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Manufacturing Reports & Operational Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Production yield curves, line operational expenditures, scrap variances, and client-side CSV downloads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportThroughputCSV}
          >
            Export Throughput CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportWCCostCSV}
          >
            Export Cost CSV
          </Button>
        </div>
      </div>

      {/* Date Range Toolbar */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" /> Reporting Window:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800"
            />
          </div>
        </div>

        {/* View Mode Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('throughput')}
            className={`px-3 py-1 rounded font-medium transition-all ${
              activeTab === 'throughput' ? 'bg-white shadow-xs text-blue-700 font-semibold' : 'text-slate-600'
            }`}
          >
            Throughput & Yield
          </button>
          <button
            onClick={() => setActiveTab('scrap')}
            className={`px-3 py-1 rounded font-medium transition-all ${
              activeTab === 'scrap' ? 'bg-white shadow-xs text-blue-700 font-semibold' : 'text-slate-600'
            }`}
          >
            Defects & Scrap
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`px-3 py-1 rounded font-medium transition-all ${
              activeTab === 'financial' ? 'bg-white shadow-xs text-blue-700 font-semibold' : 'text-slate-600'
            }`}
          >
            Line Expenditure
          </button>
        </div>
      </div>

      {/* Main Chart Card */}
      {activeTab === 'throughput' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Monthly Planned vs. Completed Assembly Volume
              </h3>
              <p className="text-xs text-slate-500">Metric commuter units finalized per manufacturing cycle</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Avg Yield: 98.7%
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyThroughputData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" units" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="planned" fill="#94a3b8" name="Planned Target (Units)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#3b82f6" name="Actual Completed Yield" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'scrap' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Monthly Floor Scrap Rate (%)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Percentage of material loss during CNC cutting, welding, and final assembly</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyThroughputData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="%" domain={[0, 3]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="scrapRatePct" stroke="#f43f5e" strokeWidth={2.5} name="Scrap Rate (%)" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Defect Categorization
              </h3>
              <p className="text-xs text-slate-500">Recorded during Quality Inspection Dyno testing</p>
            </div>

            <div className="h-48 w-full my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={qualityBreakdownData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="count">
                    {qualityBreakdownData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px]">
              {qualityBreakdownData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-600 truncate">{d.name}</span>
                  </div>
                  <strong className="text-slate-800">{d.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'financial' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Work Center Daily Operating Cost Breakdown
              </h3>
              <p className="text-xs text-slate-500">Based on standard hourly labor + machinery overhead rate</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workCenterCostData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} unit="$" />
                <YAxis dataKey="code" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                <Tooltip
                  formatter={(v) => formatCurrency(v)}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="operatingCostPerDay" fill="#6366f1" name="Daily Cost (USD)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Aggregated Tabular Report */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Monthly Operational Performance Table
          </h3>
          <Button variant="ghost" size="sm" icon={Download} onClick={handleExportThroughputCSV}>
            Download CSV
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <th className="px-4 py-2.5">Reporting Period</th>
                <th className="px-4 py-2.5 text-right">Target Production</th>
                <th className="px-4 py-2.5 text-right">Actual Output</th>
                <th className="px-4 py-2.5 text-right">Scrap Rate</th>
                <th className="px-4 py-2.5 text-right">Yield Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyThroughputData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{row.month}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{row.planned} units</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{row.completed} units</td>
                  <td className="px-4 py-3 text-right text-rose-600 font-medium">{row.scrapRatePct}%</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">
                    {((row.completed / row.planned) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

