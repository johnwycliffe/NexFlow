import React, { useState } from 'react';
import { Plus, Edit2, Trash2, FileSpreadsheet, Play, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useERP } from '../context/useERP';
import { useTableFilter } from '../hooks/useTableFilter';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FormInput, FormSelect, FormTextarea } from '../components/FormInput';
import { formatMetric, formatDate } from '../utils/formatters';

export const ProductionOrders = () => {
  const navigate = useNavigate();
  const {
    productionOrders,
    addProductionOrder,
    updateProductionOrder,
    updateProductionOrderStatus,
    deleteProductionOrder,
    products,
    workCenters,
    machines
  } = useERP();

  const filterHook = useTableFilter(productionOrders, 'orderNumber', 'asc', 10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [poToDelete, setPoToDelete] = useState(null);

  const initialFormState = {
    demandOrderId: null,
    productId: products[0]?.id || '',
    productName: products[0]?.name || '',
    batchQuantity: 50,
    uom: 'units',
    priority: 'Normal',
    workCenterId: workCenters[0]?.id || '',
    workCenterName: workCenters[0]?.name || '',
    machineId: machines[0]?.id || '',
    machineName: machines[0]?.name || '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '2026-12-10',
    operatorNotes: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenAdd = () => {
    setEditingPO(null);
    setFormData(initialFormState);
    setModalOpen(true);
  };

  const handleOpenEdit = (po) => {
    setEditingPO(po);
    setFormData(po);
    setModalOpen(true);
  };

  const handleProductSelect = (productId) => {
    const p = products.find((prod) => prod.id === productId);
    setFormData({
      ...formData,
      productId,
      productName: p?.name || ''
    });
  };

  const handleWorkCenterSelect = (wcId) => {
    const wc = workCenters.find((w) => w.id === wcId);
    const assignedMc = machines.find((m) => m.workCenterId === wcId) || machines[0];
    setFormData({
      ...formData,
      workCenterId: wcId,
      workCenterName: wc?.name || '',
      machineId: assignedMc?.id || '',
      machineName: assignedMc?.name || ''
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingPO) {
      updateProductionOrder(editingPO.id, formData);
    } else {
      addProductionOrder(formData);
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (poToDelete) {
      deleteProductionOrder(poToDelete.id);
      setDeleteConfirmOpen(false);
      setPoToDelete(null);
    }
  };

  // Status transitions helper: Draft -> Released -> In-Progress -> Inspection -> Completed
  const getNextStatus = (current) => {
    if (current === 'Draft') return 'Released';
    if (current === 'Released') return 'In-Progress';
    if (current === 'In-Progress') return 'Inspection';
    if (current === 'Inspection') return 'Completed';
    return null;
  };

  const columns = [
    {
      key: 'orderNumber',
      header: 'Production Order #',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-blue-600 block">{val}</span>
          {row.demandOrderId && (
            <span className="text-[10px] text-slate-400 font-mono">
              From: {row.demandOrderId}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'productName',
      header: 'Finished SKU',
      render: (val, row) => (
        <div>
          <span className="font-medium text-slate-900 block">{val}</span>
          <span className="text-[11px] text-slate-500">{row.workCenterName}</span>
        </div>
      )
    },
    {
      key: 'batchQuantity',
      header: 'Batch Volume (SI)',
      render: (val, row) => (
        <span className="font-bold text-slate-900 text-xs">
          {formatMetric(val, row.uom)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Lifecycle State',
      render: (val) => <Badge status={val} />
    },
    {
      key: 'progressPercent',
      header: 'Progress',
      render: (val) => (
        <div className="w-28 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span>{val}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                val >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
              }`}
              style={{ width: `${val}%` }}
            />
          </div>
        </div>
      )
    },
    {
      key: 'startDate',
      header: 'Schedule Window',
      render: (val, row) => (
        <div className="text-xs text-slate-600">
          <span>{formatDate(val)}</span>
          <span className="text-slate-400 mx-1">→</span>
          <span>{formatDate(row.dueDate)}</span>
        </div>
      )
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (val) => {
        const variant = val === 'Urgent' ? 'danger' : val === 'Normal' ? 'primary' : 'neutral';
        return <Badge variant={variant}>{val}</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Lifecycle Actions',
      sortable: false,
      render: (_, row) => {
        const next = getNextStatus(row.status);
        return (
          <div className="flex items-center gap-1.5">
            {next && (
              <Button
                variant={next === 'Completed' ? 'success' : 'primary'}
                size="sm"
                onClick={() => updateProductionOrderStatus(row.id, next)}
                title={`Advance order state to ${next}`}
                className="text-xs py-1"
              >
                Mark {next}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              icon={Edit2}
              onClick={() => handleOpenEdit(row)}
              title="Edit Parameters"
            />
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={() => {
                setPoToDelete(row);
                setDeleteConfirmOpen(true);
              }}
              title="Delete Order"
              className="text-rose-600 hover:text-rose-800"
            />
          </div>
        );
      }
    }
  ];

  const statuses = ['ALL', 'Draft', 'Released', 'In-Progress', 'Inspection', 'Completed'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Production Orders & Batch Lifecycle
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete lifecycle state progression: <code className="font-mono text-slate-700 font-semibold">Draft ➔ Released ➔ In-Progress ➔ Inspection ➔ Completed</code>.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
          New Production Order
        </Button>
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
            {st === 'ALL' ? 'All Lifecycle Stages' : st}
          </button>
        ))}
      </div>

      <Table
        columns={columns}
        data={productionOrders}
        filterHook={filterHook}
        title="Production Work Orders"
        subtitle={`${filterHook.filteredData.length} batches progressing through manufacturing shop floor`}
        exportFilename="production_orders"
        emptyIcon={FileSpreadsheet}
      />

      {/* Modal Add / Edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPO ? `Edit Order: ${editingPO.orderNumber}` : 'Launch Production Work Order'}
        subtitle="Define batch quantity sizing, assign primary work center, and schedule target SLA."
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingPO ? 'Update Work Order' : 'Launch Order (Draft)'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Finished SKU Product"
              required
              value={formData.productId}
              onChange={(e) => handleProductSelect(e.target.value)}
              options={products.map((p) => ({ label: `${p.sku} - ${p.name}`, value: p.id }))}
            />
            <FormInput
              label="Batch Quantity Sizing"
              type="number"
              min="1"
              required
              value={formData.batchQuantity}
              onChange={(e) => setFormData({ ...formData, batchQuantity: Number(e.target.value) })}
              suffix="units"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Work Center Line"
              value={formData.workCenterId}
              onChange={(e) => handleWorkCenterSelect(e.target.value)}
              options={workCenters.map((w) => ({ label: w.name, value: w.id }))}
            />
            <FormSelect
              label="Primary Machine / Rig"
              value={formData.machineId}
              onChange={(e) => {
                const mc = machines.find((m) => m.id === e.target.value);
                setFormData({ ...formData, machineId: e.target.value, machineName: mc?.name || '' });
              }}
              options={machines
                .filter((m) => m.workCenterId === formData.workCenterId)
                .map((m) => ({ label: m.name, value: m.id }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormInput
              label="Planned Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <FormInput
              label="Target Completion Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
            <FormSelect
              label="Priority Level"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              options={['Urgent', 'Normal', 'Low']}
            />
          </div>

          <FormTextarea
            label="Shop Floor Routing Notes"
            rows={2}
            value={formData.operatorNotes}
            onChange={(e) => setFormData({ ...formData, operatorNotes: e.target.value })}
            placeholder="Special torque checks, wiring inspection notes, or setup instructions..."
          />
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Cancel Production Order"
        message={`Are you sure you want to cancel order ${poToDelete?.orderNumber}? Allocated WIP records will be purged.`}
      />
    </div>
  );
};

