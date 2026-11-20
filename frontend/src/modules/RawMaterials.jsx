import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Component, AlertTriangle, ShieldCheck, ArrowDownRight } from 'lucide-react';
import { useERP } from '../context/useERP';
import { useTableFilter } from '../hooks/useTableFilter';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FormInput, FormSelect, FormTextarea } from '../components/FormInput';
import { formatCurrency, formatMetric } from '../utils/formatters';

export const RawMaterials = () => {
  const { rawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial, suppliers, inventory } = useERP();
  const filterHook = useTableFilter(rawMaterials, 'code', 'asc', 10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMat, setEditingMat] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [matToDelete, setMatToDelete] = useState(null);

  const initialFormState = {
    code: '',
    name: '',
    category: 'Metals & Frames',
    uom: 'kg', // metric / SI only: kg, units, meters, liters
    unitCost: 15.00,
    safetyStock: 100,
    reorderLevel: 150,
    leadTimeDays: 10,
    defaultSupplierId: suppliers[0]?.id || '',
    storageCondition: 'Dry Store',
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenAdd = () => {
    setEditingMat(null);
    setFormData(initialFormState);
    setModalOpen(true);
  };

  const handleOpenEdit = (mat) => {
    setEditingMat(mat);
    setFormData(mat);
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingMat) {
      updateRawMaterial(editingMat.id, formData);
    } else {
      addRawMaterial(formData);
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (matToDelete) {
      deleteRawMaterial(matToDelete.id);
      setDeleteConfirmOpen(false);
      setMatToDelete(null);
    }
  };

  const categories = [
    'ALL',
    'Metals & Frames',
    'Electrical & Power',
    'Powertrain',
    'Braking Systems',
    'Transmission',
    'Wheels & Rubber',
    'Coatings & Chemicals',
    'Hardware'
  ];

  const columns = [
    {
      key: 'code',
      header: 'Material Code',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-blue-600 block">{val}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.id}</span>
        </div>
      )
    },
    {
      key: 'name',
      header: 'Item Specification',
      render: (val, row) => (
        <div>
          <span className="font-medium text-slate-900 block">{val}</span>
          <span className="text-[11px] text-slate-500">{row.storageCondition}</span>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (val) => <span className="text-xs text-slate-600 font-medium">{val}</span>
    },
    {
      key: 'uom',
      header: 'SI Unit',
      render: (val) => (
        <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700 uppercase">
          {val}
        </span>
      )
    },
    {
      key: 'unitCost',
      header: 'Standard Cost',
      render: (val) => <span className="font-semibold text-slate-900">{formatCurrency(val)}</span>
    },
    {
      key: 'safetyStock',
      header: 'Safety Threshold',
      render: (val, row) => {
        // Compare with actual stock
        const inv = inventory.find((i) => i.materialId === row.id && i.warehouseId === 'WH-01');
        const available = inv?.available || 0;
        const isBelow = available < val;

        return (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-700">
              {formatMetric(val, row.uom)}
            </span>
            {isBelow && (
              <span className="p-1 rounded bg-rose-50 text-rose-600" title="Available stock below safety threshold">
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'leadTimeDays',
      header: 'Vendor Lead Time',
      render: (val) => <span className="text-xs text-slate-600">{val} days</span>
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
            icon={Edit2}
            onClick={() => handleOpenEdit(row)}
            title="Edit Material"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => {
              setMatToDelete(row);
              setDeleteConfirmOpen(true);
            }}
            title="Delete Material"
            className="text-rose-600 hover:text-rose-800"
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
            Raw Materials & Component Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            SI metric catalog, strict safety buffers, lead times, and supplier linking.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
          Register Material
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => filterHook.setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterHook.categoryFilter === cat
                ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {cat === 'ALL' ? 'All Materials' : cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={rawMaterials}
        filterHook={filterHook}
        title="Raw Material Registry"
        subtitle={`${filterHook.filteredData.length} items logged with metric tracking`}
        exportFilename="raw_materials_catalog"
        emptyIcon={Component}
      />

      {/* Modal Add/Edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMat ? `Edit Material: ${editingMat.code}` : 'Register Raw Material'}
        subtitle="Ensure standard SI units (kg, units, meters, liters) and safety buffers are declared."
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingMat ? 'Update Material' : 'Register Material'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Material Code"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. RM-ALU-7075"
            />
            <FormInput
              label="Full Specification Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Aerospace Grade Aluminum Tubing"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormSelect
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={categories.filter((c) => c !== 'ALL')}
            />
            <FormSelect
              label="SI Unit of Measure (UOM)"
              value={formData.uom}
              onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
              options={[
                { label: 'Kilograms (kg)', value: 'kg' },
                { label: 'Discrete Units (units)', value: 'units' },
                { label: 'Meters (meters)', value: 'meters' },
                { label: 'Liters (liters)', value: 'liters' },
                { label: 'Metric Tons (t)', value: 'metric tons' }
              ]}
            />
            <FormInput
              label="Unit Cost (EUR)"
              type="number"
              step="0.01"
              value={formData.unitCost}
              onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
              suffix="EUR"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormInput
              label="Safety Stock Buffer"
              type="number"
              value={formData.safetyStock}
              onChange={(e) => setFormData({ ...formData, safetyStock: Number(e.target.value) })}
              suffix={formData.uom}
            />
            <FormInput
              label="Reorder Threshold"
              type="number"
              value={formData.reorderLevel}
              onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
              suffix={formData.uom}
            />
            <FormInput
              label="Supplier Lead Time"
              type="number"
              value={formData.leadTimeDays}
              onChange={(e) => setFormData({ ...formData, leadTimeDays: Number(e.target.value) })}
              suffix="Days"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Primary Supplier"
              value={formData.defaultSupplierId}
              onChange={(e) => setFormData({ ...formData, defaultSupplierId: e.target.value })}
              options={suppliers.map((s) => ({ label: `${s.name} (${s.country})`, value: s.id }))}
            />
            <FormInput
              label="Storage Condition"
              value={formData.storageCondition}
              onChange={(e) => setFormData({ ...formData, storageCondition: e.target.value })}
              placeholder="e.g. Dry Store, Climate Controlled"
            />
          </div>

          <FormTextarea
            label="Procurement & Quality Notes"
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Handling requirements, certificate standards (ISO/DIN/UN)..."
          />
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Raw Material"
        message={`Are you sure you want to remove material ${matToDelete?.code} (${matToDelete?.name})? All corresponding inventory ledger entries will also be removed.`}
      />
    </div>
  );
};

