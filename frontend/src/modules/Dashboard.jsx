import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  PackageCheck,
  Factory,
  Cpu,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';
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
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { formatCurrency, formatMetric } from '../utils/formatters';

export const Dashboard = () => {
  const navigate = useNavigate();
  const {
    productionOrders,
    inventory,
    qualityInspections,
    workCenters,
    auditLogs,
    calculateMRP
  } = useERP();

  // Metrics computations
  const mrpResults = calculateMRP();
  const shortageCount = mrpResults.filter((m) => m.status === 'CRITICAL_SHORTAGE').length;
  const activeOrdersCount = productionOrders.filter((p) => p.status === 'In-Progress' || p.status === 'Released').length;

  const totalInspected = qualityInspections.reduce((acc, q) => acc + (q.inspectedQuantity || 0), 0);
  const totalAccepted = qualityInspections.reduce((acc, q) => acc + (q.acceptedQuantity || 0), 0);
  const qualityPassRate = totalInspected > 0 ? ((totalAccepted / totalInspected) * 100).toFixed(1) : '98.5';

  // Overall Equipment Effectiveness (OEE)
  const oeeAvailability = 92.4;
  const oeePerformance = 95.1;
  const oeeQuality = Number(qualityPassRate);
  const calculatedOEE = ((oeeAvailability * oeePerformance * oeeQuality) / 10000).toFixed(1);

  // Recharts Seed Data
  const weeklyOutputData = [
    { day: 'Mon', target: 25, actual: 24, scrap: 1 },
    { day: 'Tue', target: 25, actual: 26, scrap: 0 },
    { day: 'Wed', target: 30, actual: 29, scrap: 1 },
    { day: 'Thu', target: 30, actual: 31, scrap: 2 },
    { day: 'Fri', target: 25, actual: 23, scrap: 0 },
    { day: 'Sat', target: 15, actual: 16, scrap: 1 },
    { day: 'Sun', target: 0, actual: 0, scrap: 0 }
  ];

  const lineUtilizationData = workCenters.map((wc) => ({
    name: wc.code.replace('WC-', ''),
    fullName: wc.name,
    capacityHours: wc.maxCapacityHoursPerDay,
    utilizedHours: Number((wc.maxCapacityHoursPerDay * (wc.efficiencyRating / 100)).toFixed(1)),
    efficiency: wc.efficiencyRating
  }));

  const inventoryCategoryData = [
    { name: 'Electrical & Power', value: 37466, color: '#3b82f6' },
    { name: 'Metals & Frames', value: 8370, color: '#10b981' },
    { name: 'Powertrain', value: 16245, color: '#f59e0b' },
    { name: 'Braking & Wheels', value: 18324, color: '#8b5cf6' },
    { name: 'Hardware & Paint', value: 9888, color: '#ec4899' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Plant Operations & Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time manufacturing execution, machine efficiency, and material flow overview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Cpu}
            onClick={() => navigate('/mrp')}
          >
            Run MRP Analysis
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Factory}
            onClick={() => navigate('/production-orders')}
          >
            View Production
          </Button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Equipment Effectiveness (OEE)"
          value={`${calculatedOEE}%`}
          unit=""
          subtitle="Target: > 85.0%"
          trend="+2.1% vs last week"
          trendType="up"
          icon={Activity}
          colorScheme="blue"
        />

        <StatCard
          title="Active Production Orders"
          value={activeOrdersCount}
          unit="Batches"
          subtitle="In-Progress & Released"
          trend="On Track"
          trendType="neutral"
          icon={PackageCheck}
          colorScheme="emerald"
          onClick={() => navigate('/production-orders')}
        />

        <StatCard
          title="Material Shortage Alerts"
          value={shortageCount}
          unit="Items"
          subtitle={shortageCount > 0 ? 'Requires Requisition' : 'Optimal Balance'}
          trend={shortageCount > 0 ? 'Shortage Risk' : 'Healthy Stock'}
          trendType={shortageCount > 0 ? 'down' : 'up'}
          icon={AlertTriangle}
          colorScheme={shortageCount > 0 ? 'rose' : 'emerald'}
          onClick={() => navigate('/mrp')}
        />

        <StatCard
          title="Quality Pass Rate"
          value={`${qualityPassRate}%`}
          unit="SI Yield"
          subtitle={`${totalAccepted} of ${totalInspected} accepted`}
          trend="+0.6% vs target"
          trendType="up"
          icon={CheckCircle}
          colorScheme="purple"
          onClick={() => navigate('/quality-inspection')}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Output vs Target (2 cols) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Weekly Production Output vs. Target
              </h3>
              <p className="text-xs text-slate-500">Metric finished commuter units assembled per day</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Week 46 - 2026
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyOutputData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="target" fill="#cbd5e1" name="Target Units" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="#3b82f6" name="Actual Units Assembled" radius={[4, 4, 0, 0]} />
                <Bar dataKey="scrap" fill="#f43f5e" name="Scrap Units" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Valuation by Category (1 col) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Stock Valuation by Category
            </h3>
            <p className="text-xs text-slate-500">Total raw materials inventory value: $90,293</p>
          </div>

          <div className="h-56 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {inventoryCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => formatCurrency(val)}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
            {inventoryCategoryData.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-slate-600 truncate">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row: Line Capacity Utilization & Live Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Work Center Utilization (2 cols) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Work Center Daily Capacity & Efficiency
              </h3>
              <p className="text-xs text-slate-500">Planned operating hours vs maximum capacity limit</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/work-centers')}>
              Manage Centers <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={lineUtilizationData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} unit="h" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="capacityHours" fill="#e2e8f0" name="Max Capacity (Hours)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="utilizedHours" fill="#10b981" name="Scheduled Hours" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Operational Activity Stream (1 col) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Recent Floor Activity
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Stream
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 max-h-72 pr-1">
            {auditLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="text-xs border-l-2 border-blue-500 pl-3 py-0.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-700">{log.module}</span>
                  <span>{log.timestamp.substring(11, 16)}</span>
                </div>
                <p className="text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {log.changeNotes}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">By {log.userRole}</span>
                  <Badge variant={log.actionType === 'CREATE' ? 'success' : 'primary'}>
                    {log.actionType}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate('/audit-logs')}
            >
              View Full Audit Trail
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

