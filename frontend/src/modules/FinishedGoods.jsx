import React, { useState } from 'react';
import { Archive, ArrowUpRight, CheckCircle2, ShieldCheck, Truck, Package } from 'lucide-react';
import { useERP } from '../context/useERP';
import { useTableFilter } from '../hooks/useTableFilter';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { FormInput } from '../components/FormInput';
import { formatCurrency, formatMetric, formatDate } from '../utils/formatters';

export const FinishedGoods = () => {
  const { finishedGoods, dispatchFinishedGoods } = useERP();
  const filterHook = useTableFilter(finishedGoods, 'receiptNumber', 'desc', 10);

  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [dispatchQty, setDispatchQty] = useState(1);

  const handleOpenDispatch = (item) => {
    setActiveItem(item);
    setDispatchQty(1);
    setDispatchModalOpen(true);
  };

  const handleExecuteDispatch = (e) => {
    e.preventDefault();
    if (activeItem) {
      const ok = dispatchFinishedGoods(activeItem.id, dispatchQty);
      if (ok) {
        setDispatchModalOpen(false);
      }
    }
  };

  const totalFinishedUnits = finishedGoods.reduce((acc, f) => acc + (f.availableBalance || 0), 0);
  const totalFinishedValuation = finishedGoods.reduce((acc, f) => acc + ((f.availableBalance || 0) * f.unitCost), 0);

  const columns = [
    {
      key: 'receiptNumber',
      header: 'Receipt Cert #',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-blue-600 block">{val}</span>
          <span className="text-[10px] text-slate-400 font-mono">Date: {formatDate(row.receivedDate)}</span>
        </div>
      )
    },
    {
      key: 'productName',
      header: 'Finished E-Bike SKU',
      render: (val, row) => (
        <div>
          <span className="font-medium text-slate-900 block">{val}</span>
          <span className="text-[10px] font-mono text-slate-500">{row.productCode}</span>
        </div>
      )
    },
    {
      key: 'warehouseName',
      header: 'Warehouse Location',
      render: (val, row) => (
        <div>
          <span className="text-xs text-slate-800 block">{val}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
            {row.binLocation}
          </span>
        </div>
      )
    },
    {
      key: 'quantityReceived',
      header: 'Quality Yield (Recv)',
      render: (val, row) => (
        <span className="text-xs font-semibold text-slate-700">
          {formatMetric(val, row.uom)}
        </span>
      )
    },
    {
      key: 'availableBalance',
      header: 'Available Balance (SI)',
      render: (val, row) => (
        <span className="text-xs font-bold text-emerald-700">
          {formatMetric(val, row.uom)}
        </span>
      )
    },
    {
      key: 'qualityCertNumber',
      header: 'QA Certification',
      render: (val) => (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <ShieldCheck className="w-3 h-3" /> {val}
        </span>
      )
    },
    {
      key: 'totalValuation',
      header: 'Standard Valuation',
      render: (val, row) => (
        <span className="font-semibold text-slate-900 text-xs">
          {formatCurrency(row.availableBalance * row.unitCost)}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Dispatch Action',
      sortable: false,
      render: (_, row) => (
        <Button
          variant="outline"
          size="sm"
          icon={Truck}
          disabled={row.availableBalance <= 0}
          onClick={() => handleOpenDispatch(row)}
          title="Ship Finished Units"
          className="text-xs text-blue-600 border-blue-300 hover:bg-blue-50 py-1"
        >
          Dispatch / Ship
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Finished Goods Warehouse & Dispatch Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Warehouse WH-03 receipts recording exclusively quality-accepted finished units with QC compliance certificates.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Ready for Dispatch</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{totalFinishedUnits} units</span>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Stock Value</span>
            <span className="font-bold text-emerald-600 text-sm mt-0.5 block">{formatCurrency(totalFinishedValuation)}</span>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={finishedGoods}
        filterHook={filterHook}
        title="Finished Goods Stock Ledger"
        subtitle={`${filterHook.filteredData.length} completed production receipts active`}
        exportFilename="finished_goods_inventory"
        emptyIcon={Archive}
      />

      {/* Dispatch Modal */}
      <Modal
        isOpen={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        title={`Dispatch Finished Units: ${activeItem?.productName}`}
        subtitle={`Available in WH-03: ${activeItem?.availableBalance} ${activeItem?.uom}`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDispatchModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleExecuteDispatch}>
              Authorize Dispatch
            </Button>
          </>
        }
      >
        <form onSubmit={handleExecuteDispatch} className="space-y-4">
          <FormInput
            label="Quantity to Ship / Dispatch"
            type="number"
            min="1"
            max={activeItem?.availableBalance || 1}
            required
            value={dispatchQty}
            onChange={(e) => setDispatchQty(Number(e.target.value))}
            suffix={activeItem?.uom}
          />

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Remaining Balance after Dispatch:</span>
              <span className="font-bold text-slate-800">
                {(activeItem?.availableBalance || 0) - dispatchQty} {activeItem?.uom}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dispatch Valuation:</span>
              <span className="font-bold text-emerald-600">
                {formatCurrency(dispatchQty * (activeItem?.unitCost || 0))}
              </span>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

