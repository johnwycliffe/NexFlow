import React, { useState } from 'react';
import { Warehouse, ArrowRightLeft, SlidersHorizontal, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { useERP } from '../context/useERP';
import { useTableFilter } from '../hooks/useTableFilter';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { FormInput, FormSelect, FormTextarea } from '../components/FormInput';
import { formatCurrency, formatMetric } from '../utils/formatters';

export const Inventory = () => {
  const { inventory, warehouses, rawMaterials, adjustStock, transferStock } = useERP();
  const filterHook = useTableFilter(inventory, 'materialCode', 'asc', 10);

  // Transfer Modal State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({
    materialId: rawMaterials[0]?.id || '',
    fromWarehouseId: 'WH-01',
    toWarehouseId: 'WH-02',
    quantity: 10,
    notes: 'Line staging buffer transfer'
  });

  // Adjust Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [newOnHand, setNewOnHand] = useState(0);
  const [adjustReason, setAdjustReason] = useState('Cycle Count Adjustment');

  const handleOpenTransfer = (item = null) => {
    setTransferData({
      materialId: item ? item.materialId : rawMaterials[0]?.id || '',
      fromWarehouseId: item ? item.warehouseId : 'WH-01',
      toWarehouseId: 'WH-02',
      quantity: 10,
      notes: ''
    });
    setTransferModalOpen(true);
  };

  const handleExecuteTransfer = (e) => {
    e.preventDefault();
    const success = transferStock(
      transferData.materialId,
      transferData.fromWarehouseId,
      transferData.toWarehouseId,
      transferData.quantity,
      transferData.notes
    );
    if (success) {
      setTransferModalOpen(false);
    }
  };

  const handleOpenAdjust = (item) => {
    setAdjustItem(item);
    setNewOnHand(item.onHand);
    setAdjustReason('Cycle Count Physical Audit');
    setAdjustModalOpen(true);
  };

  const handleExecuteAdjust = (e) => {
    e.preventDefault();
    if (adjustItem) {
      adjustStock(adjustItem.id, newOnHand, adjustReason);
      setAdjustModalOpen(false);
    }
  };

  const warehouseOptions = ['ALL', ...warehouses.map((w) => w.name)];

  const columns = [
    {
      key: 'materialCode',
      header: 'Item Identifier',
      render: (val, row) => {
        const rawMat = rawMaterials.find(
          (r) => r.id === row.materialId || String(r.id) === String(row.materialId) || r.code === row.materialCode
        );
        const code = val || row.materialCode || rawMat?.code || '-';
        const name = row.materialName || rawMat?.name || '';
        return (
          <div>
            <span className="font-semibold text-blue-600 block">{code}</span>
            <span className="text-[11px] text-slate-500">{name}</span>
          </div>
        );
      }
    },
    {
      key: 'warehouseName',
      header: 'Warehouse & Bin',
      render: (val, row) => {
        const wh = warehouses.find(
          (w) => w.id === row.warehouseId || String(w.id) === String(row.warehouseId) || w.name === val
        );
        const whName = val || row.warehouseName || wh?.name || 'Central Raw Material Depot';
        return (
          <div>
            <span className="text-xs font-medium text-slate-800 block">{whName}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 inline-block mt-0.5">
              {row.locationBin}
            </span>
          </div>
        );
      }
    },
    {
      key: 'onHand',
      header: 'On-Hand Stock',
      render: (val, row) => {
        const rawMat = rawMaterials.find(
          (r) => r.id === row.materialId || String(r.id) === String(row.materialId)
        );
        const onHand = Number(val !== undefined ? val : (row.onHand !== undefined ? row.onHand : (row.onHandQty ?? 0)));
        const uom = row.uom || rawMat?.uom || 'units';
        return (
          <span className="font-semibold text-slate-900 text-xs">
            {formatMetric(onHand, uom)}
          </span>
        );
      }
    },
    {
      key: 'reserved',
      header: 'Reserved (WIP)',
      render: (val, row) => {
        const rawMat = rawMaterials.find(
          (r) => r.id === row.materialId || String(r.id) === String(row.materialId)
        );
        const reserved = Number(val !== undefined ? val : (row.reserved !== undefined ? row.reserved : (row.reservedQty ?? 0)));
        const uom = row.uom || rawMat?.uom || 'units';
        return (
          <span className="text-slate-600 text-xs">
            {formatMetric(reserved, uom)}
          </span>
        );
      }
    },
    {
      key: 'available',
      header: 'Available Stock',
      render: (_, row) => {
        const rawMat = rawMaterials.find(
          (r) => r.id === row.materialId || String(r.id) === String(row.materialId)
        );
        const onHand = Number(row.onHand !== undefined ? row.onHand : (row.onHandQty ?? 0));
        const reserved = Number(row.reserved !== undefined ? row.reserved : (row.reservedQty ?? 0));
        const available = Math.max(0, onHand - reserved);
        const uom = row.uom || rawMat?.uom || 'units';
        const isCritical = available <= 0;
        return (
          <div>
            <span
              className={`font-bold text-xs ${
                isCritical ? 'text-rose-600' : available <= (rawMat?.safetyStock || 50) ? 'text-amber-600' : 'text-emerald-700'
              }`}
            >
              {formatMetric(available, uom)}
            </span>
            <span className="block text-[10px] text-slate-400 font-mono">
              ({onHand} - {reserved})
            </span>
          </div>
        );
      }
    },
    {
      key: 'totalValuation',
      header: 'Total Valuation',
      render: (val, row) => {
        const onHand = Number(row.onHand !== undefined ? row.onHand : (row.onHandQty ?? 0));
        const cost = Number(row.unitCost || 0);
        const valuation = Number(val !== undefined ? val : (row.totalValuation !== undefined ? row.totalValuation : onHand * cost));
        return <span className="font-semibold text-slate-900">{formatCurrency(valuation)}</span>;
      }
    },
    {
      key: 'status',
      header: 'Stock Status',
      render: (val, row) => {
        const onHand = Number(row.onHand !== undefined ? row.onHand : (row.onHandQty ?? 0));
        const reserved = Number(row.reserved !== undefined ? row.reserved : (row.reservedQty ?? 0));
        const available = Math.max(0, onHand - reserved);
        const rawMat = rawMaterials.find(
          (r) => r.id === row.materialId || String(r.id) === String(row.materialId)
        );
        const safetyStock = rawMat?.safetyStock || 50;
        const status = available <= 0 ? 'OUT_OF_STOCK' : (available <= safetyStock ? 'LOW_STOCK' : 'IN_STOCK');
        return <Badge status={status} />;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowRightLeft}
            onClick={() => handleOpenTransfer(row)}
            title="Transfer Material between Warehouses"
            className="text-blue-600 hover:text-blue-800"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={SlidersHorizontal}
            onClick={() => handleOpenAdjust(row)}
            title="Adjust Stock Count (Physical Audit)"
          />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Multi-Warehouse Inventory Stock
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time metric balance formula: <code className="font-mono font-semibold text-slate-700">Available = On-Hand - Reserved</code>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" icon={ArrowRightLeft} onClick={() => handleOpenTransfer()}>
            Initiate Stock Transfer
          </Button>
        </div>
      </div>

      {/* Warehouse Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        {warehouseOptions.map((wh) => (
          <button
            key={wh}
            onClick={() => filterHook.setCategoryFilter(wh)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterHook.categoryFilter === wh
                ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {wh === 'ALL' ? 'All Storage Locations' : wh}
          </button>
        ))}
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={inventory}
        filterHook={filterHook}
        title="Live Inventory Ledgers"
        subtitle={`${filterHook.filteredData.length} item balances actively audited`}
        exportFilename="inventory_ledger"
        emptyIcon={Warehouse}
      />

      {/* Transfer Stock Modal */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Internal Material Transfer"
        subtitle="Transfer raw stock between Central Depot and Shop Floor WIP staging bins."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleExecuteTransfer}>
              Post Transfer
            </Button>
          </>
        }
      >
        <form onSubmit={handleExecuteTransfer} className="space-y-4">
          <FormSelect
            label="Raw Material"
            required
            value={transferData.materialId}
            onChange={(e) => setTransferData({ ...transferData, materialId: e.target.value })}
            options={rawMaterials.map((rm) => ({ label: `${rm.code} - ${rm.name}`, value: rm.id }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormSelect
              label="Source Warehouse"
              value={transferData.fromWarehouseId}
              onChange={(e) => setTransferData({ ...transferData, fromWarehouseId: e.target.value })}
              options={warehouses.map((w) => ({ label: w.name, value: w.id }))}
            />
            <FormSelect
              label="Destination Warehouse"
              value={transferData.toWarehouseId}
              onChange={(e) => setTransferData({ ...transferData, toWarehouseId: e.target.value })}
              options={warehouses.map((w) => ({ label: w.name, value: w.id }))}
            />
          </div>

          <FormInput
            label="Transfer Quantity"
            type="number"
            min="1"
            required
            value={transferData.quantity}
            onChange={(e) => setTransferData({ ...transferData, quantity: Number(e.target.value) })}
          />

          <FormTextarea
            label="Transfer Notes / Staging Tag"
            rows={2}
            value={transferData.notes}
            onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
            placeholder="e.g. Line 1 Morning Shift Buffer"
          />
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={`Audit Adjust: ${adjustItem?.materialCode}`}
        subtitle={`Current On-Hand: ${adjustItem?.onHand} ${adjustItem?.uom}. Reserved: ${adjustItem?.reserved} ${adjustItem?.uom}.`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleExecuteAdjust}>
              Update Balance
            </Button>
          </>
        }
      >
        <form onSubmit={handleExecuteAdjust} className="space-y-4">
          <FormInput
            label="Verified Physical On-Hand Count"
            type="number"
            step="0.1"
            min="0"
            required
            value={newOnHand}
            onChange={(e) => setNewOnHand(Number(e.target.value))}
            suffix={adjustItem?.uom}
          />

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-500 block">Calculated Available Balance:</span>
            <span className="text-sm font-bold text-slate-800 mt-0.5 block">
              {formatMetric(Math.max(0, newOnHand - (adjustItem?.reserved || 0)), adjustItem?.uom)}
            </span>
          </div>

          <FormSelect
            label="Adjustment Reason"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            options={[
              'Cycle Count Physical Audit',
              'Damage / Spoilage Write-Off',
              'Supplier Discrepancy Correction',
              'Found Stock Recovery'
            ]}
          />
        </form>
      </Modal>
    </div>
  );
};

