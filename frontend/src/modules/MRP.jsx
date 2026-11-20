import React, { useState } from 'react';
import { Cpu, AlertTriangle, CheckCircle, ShoppingCart, RefreshCw, Layers, ArrowUpRight } from 'lucide-react';
import { useERP } from '../context/useERP';
import { useTableFilter } from '../hooks/useTableFilter';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { StatCard } from '../components/StatCard';
import { formatCurrency, formatMetric } from '../utils/formatters';
import { mrpService } from '../services';

export const MRP = () => {
  const { calculateMRP, simulateAutoRequisition, suppliers, isBackendConnected, syncWithBackend } = useERP();
  const mrpResults = calculateMRP();
  const filterHook = useTableFilter(mrpResults, 'shortageQuantity', 'desc', 10);

  const [calculating, setCalculating] = useState(false);

  const criticalShortages = mrpResults.filter((m) => m.status === 'CRITICAL_SHORTAGE');
  const reorderRecommended = mrpResults.filter((m) => m.status === 'REORDER_RECOMMENDED');
  const totalRequisitionCost = mrpResults.reduce((acc, m) => acc + (m.shortageQuantity * m.unitCost), 0);

  const handleRecalculate = async () => {
    setCalculating(true);
    try {
      if (isBackendConnected) {
        await mrpService.runGrossToNetCalculation();
        await syncWithBackend(true);
      } else {
        await new Promise((r) => setTimeout(r, 400));
      }
    } catch (e) {
      console.warn('MRP engine execution error:', e);
    } finally {
      setCalculating(false);
    }
  };

  const columns = [
    {
      key: 'materialCode',
      header: 'Component Code',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-blue-600 block">{val}</span>
          <span className="text-[11px] text-slate-500">{row.materialName}</span>
        </div>
      )
    },
    {
      key: 'grossDemand',
      header: 'Gross Demand (SI)',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs">
            {formatMetric(val, row.uom)}
          </span>
          <span className="text-[10px] text-slate-400 block">
            {row.contributingOrders?.length || 0} active demand batch(es)
          </span>
        </div>
      )
    },
    {
      key: 'onHand',
      header: 'On-Hand Stock',
      render: (val, row) => <span className="text-xs text-slate-700">{formatMetric(val, row.uom)}</span>
    },
    {
      key: 'available',
      header: 'Available Stock',
      render: (val, row) => (
        <span className="text-xs font-medium text-slate-800">
          {formatMetric(val, row.uom)}
        </span>
      )
    },
    {
      key: 'safetyStock',
      header: 'Safety Buffer',
      render: (val, row) => (
        <span className="text-xs text-slate-500 font-mono">
          {formatMetric(val, row.uom)}
        </span>
      )
    },
    {
      key: 'shortageQuantity',
      header: 'Shortage Delta',
      render: (val, row) => {
        if (val > 0) {
          return (
            <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>-{formatMetric(val, row.uom)}</span>
            </div>
          );
        }
        return <span className="text-xs text-emerald-600 font-medium">None</span>;
      }
    },
    {
      key: 'status',
      header: 'MRP Recommendation',
      render: (val) => {
        let variant = 'success';
        let label = 'Balanced';
        if (val === 'CRITICAL_SHORTAGE') {
          variant = 'danger';
          label = 'Critical Shortage';
        } else if (val === 'REORDER_RECOMMENDED') {
          variant = 'warning';
          label = 'Reorder Suggested';
        }
        return <Badge variant={variant}>{label}</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Requisition Action',
      sortable: false,
      render: (_, row) => {
        if (row.shortageQuantity > 0 || row.netRequirement > 0) {
          const qtyToBuy = Math.ceil(Math.max(row.shortageQuantity, row.netRequirement) + row.safetyStock);
          return (
            <Button
              variant="outline"
              size="sm"
              icon={ShoppingCart}
              onClick={() => simulateAutoRequisition(row.materialId, qtyToBuy)}
              title={`Simulate Supplier Purchase Order for ${qtyToBuy} ${row.uom}`}
              className="text-xs text-blue-600 border-blue-300 hover:bg-blue-50 py-1"
            >
              Order +{qtyToBuy} {row.uom}
            </Button>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <CheckCircle className="w-3 h-3" /> Fully Stocked
          </span>
        );
      }
    }
  ];

  const statuses = ['ALL', 'CRITICAL_SHORTAGE', 'REORDER_RECOMMENDED', 'BALANCED'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Material Requirements Planning (MRP) Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated Gross-to-Net bill of materials explosion evaluating inventory deficits against active sales demand.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={calculating}
            onClick={handleRecalculate}
          >
            Recalculate MRP
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Critical Shortages"
          value={criticalShortages.length}
          unit="Lines"
          subtitle="Direct production stoppage risk"
          trend={criticalShortages.length > 0 ? 'Urgent Requisition Required' : 'Zero Bottlenecks'}
          trendType={criticalShortages.length > 0 ? 'down' : 'up'}
          icon={AlertTriangle}
          colorScheme={criticalShortages.length > 0 ? 'rose' : 'emerald'}
        />

        <StatCard
          title="Reorder Buffer Warnings"
          value={reorderRecommended.length}
          unit="Materials"
          subtitle="Inventory nearing safety stock"
          trend="Monitor Lead Times"
          trendType="neutral"
          icon={Cpu}
          colorScheme="amber"
        />

        <StatCard
          title="Estimated Requisition Capital"
          value={formatCurrency(totalRequisitionCost)}
          subtitle="Cost to replenish all current deficits"
          trend="SI Metric Valuation"
          trendType="neutral"
          icon={ShoppingCart}
          colorScheme="blue"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        {statuses.map((st) => (
          <button
            key={st}
            onClick={() => filterHook.setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterHook.statusFilter === st
                ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st === 'ALL'
              ? 'All Components'
              : st === 'CRITICAL_SHORTAGE'
              ? 'Critical Shortages Only'
              : st === 'REORDER_RECOMMENDED'
              ? 'Reorder Recommended'
              : 'Balanced'}
          </button>
        ))}
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={mrpResults}
        filterHook={filterHook}
        title="Gross-to-Net Component Requirements"
        subtitle="Evaluated across all active demand commitments & WIP reserved materials"
        exportFilename="mrp_requirements_analysis"
        emptyIcon={Cpu}
      />
    </div>
  );
};

