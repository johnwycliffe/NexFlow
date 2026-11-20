import React, { useState } from 'react';
import { Plus, Flame, AlertTriangle, CheckCircle, ArrowDownRight, XCircle } from 'lucide-react';
import { useERP } from '../context/useERP';
import { useTableFilter } from '../hooks/useTableFilter';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { FormInput, FormSelect } from '../components/FormInput';
import { formatCurrency, formatMetric } from '../utils/formatters';

export const MaterialConsumption = () => {
  const { materialConsumption, logMaterialConsumption, productionOrders, rawMaterials, inventory } = useERP();
  const filterHook = useTableFilter(materialConsumption, 'loggedAt', 'desc', 10);

  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState('');

  const initialFormState = {
    productionOrderId: productionOrders[0]?.id || '',
    orderNumber: productionOrders[0]?.orderNumber || '',
    materialId: rawMaterials[0]?.id || '',
    warehouseId: 'WH-01',
    plannedQuantity: 50,
    actualQuantity: 50,
    type: 'BACKFLUSH' // BACKFLUSH or MANUAL_ISSUE
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenAdd = () => {
    setFormError('');
    setFormData(initialFormState);
    setModalOpen(true);
  };

  const handleOrderChange = (poId) => {
    const po = productionOrders.find((p) => p.id === poId);
    setFormData({
      ...formData,
      productionOrderId: poId,
      orderNumber: po?.orderNumber || ''
    });
  };

  // Find currently available stock for selected material in warehouse
  const currentStock = inventory.find(
    (i) => i.materialId === formData.materialId && i.warehouseId === formData.warehouseId
  );
  const availableStock = currentStock?.available || 0;

  const handleSave = (e) => {
    e.preventDefault();
    setFormError('');

    const requested = Number(formData.actualQuantity);
    if (requested > availableStock) {
      setFormError(`Strict Policy Violation: Cannot consume ${requested} ${currentStock?.uom}. Only ${availableStock} ${currentStock?.uom} available in ${currentStock?.warehouseName}!`);
      return;
    }

    const res = logMaterialConsumption(formData);
    if (res.success) {
      setModalOpen(false);
    } else {
      setFormError(res.error);
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'Issue Log #',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-blue-600 block">{val}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.loggedAt}</span>
        </div>
      )
    },
    {
      key: 'orderNumber',
      header: 'Target Work Order',
      render: (val) => <span className="font-medium text-slate-900 text-xs">{val}</span>
    },
    {
      key: 'materialName',
      header: 'Consumed Material',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs block">{row.materialCode}</span>
          <span className="text-[11px] text-slate-500">{val}</span>
        </div>
      )
    },
    {
      key: 'plannedQuantity',
      header: 'Planned (BOM)',
      render: (val, row) => <span className="text-xs text-slate-500">{formatMetric(val, row.uom)}</span>
    },
    {
      key: 'actualQuantity',
      header: 'Actual Consumed (SI)',
      render: (val, row) => (
        <span className="font-bold text-slate-900 text-xs">
          {formatMetric(val, row.uom)}
        </span>
      )
    },
    {
      key: 'variance',
      header: 'Variance Delta',
      render: (val, row) => {
        const isOver = val > 0;
        return (
          <span
            className={`text-xs font-semibold ${
              isOver ? 'text-rose-600' : val === 0 ? 'text-slate-600' : 'text-emerald-600'
            }`}
          >
            {isOver ? `+${val}` : val} {row.uom}
          </span>
        );
      }
    },
    {
      key: 'totalCost',
      header: 'Material Cost',
      render: (val) => <span className="font-semibold text-slate-900 text-xs">{formatCurrency(val)}</span>
    },
    {
      key: 'type',
      header: 'Issue Method',
      render: (val) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-700">
          {val}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (val) => <Badge status={val} />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Material Consumption & Backflushing Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Planned vs actual material variances. The system strictly blocks any issue exceeding available inventory.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
          Issue Material to Floor
        </Button>
      </div>

      <Table
        columns={columns}
        data={materialConsumption}
        filterHook={filterHook}
        title="Posted Shop Floor Consumption Ledgers"
        subtitle={`${filterHook.filteredData.length} material issue events posted`}
        exportFilename="material_consumption"
        emptyIcon={Flame}
      />

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Post Material Issue / Consumption"
        subtitle="Deduct inventory balances for shop-floor work centers with strict available stock validation."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Post Consumption
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-900 text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <FormSelect
            label="Target Production Order"
            required
            value={formData.productionOrderId}
            onChange={(e) => handleOrderChange(e.target.value)}
            options={productionOrders.map((p) => ({
              label: `${p.orderNumber} - ${p.productName}`,
              value: p.id
            }))}
          />

          <FormSelect
            label="Raw Material"
            required
            value={formData.materialId}
            onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
            options={rawMaterials.map((rm) => ({ label: `${rm.code} - ${rm.name}`, value: rm.id }))}
          />

          {/* Current Stock Banner */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
            <span className="text-slate-500 font-medium">Currently Available in WH-01:</span>
            <span className="font-bold text-slate-800 text-sm">
              {formatMetric(availableStock, currentStock?.uom)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormInput
              label="Planned (BOM) Qty"
              type="number"
              step="0.1"
              value={formData.plannedQuantity}
              onChange={(e) => setFormData({ ...formData, plannedQuantity: Number(e.target.value) })}
              suffix={currentStock?.uom}
            />
            <FormInput
              label="Actual Issue Qty"
              type="number"
              step="0.1"
              required
              value={formData.actualQuantity}
              onChange={(e) => setFormData({ ...formData, actualQuantity: Number(e.target.value) })}
              suffix={currentStock?.uom}
            />
          </div>

          <FormSelect
            label="Issue Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={['BACKFLUSH', 'MANUAL_ISSUE', 'SCRAP_REPLACEMENT']}
          />
        </form>
      </Modal>
    </div>
  );
};

