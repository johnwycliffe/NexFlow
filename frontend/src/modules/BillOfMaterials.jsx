import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Layers, Cpu, Calculator, Check, AlertCircle } from 'lucide-react';
import { useERP } from '../context/useERP';
import { useTableFilter } from '../hooks/useTableFilter';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FormInput, FormSelect } from '../components/FormInput';
import { formatCurrency, formatMetric } from '../utils/formatters';

export const BillOfMaterials = () => {
  const { boms, products, rawMaterials, addBOM, updateBOM, deleteBOM } = useERP();
  const filterHook = useTableFilter(boms, 'bomCode', 'asc', 10);

  const [selectedBOM, setSelectedBOM] = useState(boms[0] || null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bomToDelete, setBomToDelete] = useState(null);

  useEffect(() => {
    if (!selectedBOM && boms.length > 0) {
      setSelectedBOM(boms[0]);
    }
  }, [boms, selectedBOM]);

  // Form state
  const initialFormState = {
    productId: products[0]?.id || '',
    productName: products[0]?.name || '',
    bomCode: 'BOM-NEW-REV1',
    version: '1.0',
    scrapAllowancePercent: 3.0,
    items: [
      { id: 'bi-new-1', materialId: rawMaterials[0]?.id || '', quantityPerUnit: 1.0, uom: rawMaterials[0]?.uom || 'units', unitCost: rawMaterials[0]?.unitCost || 10, subtotal: 10 }
    ]
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenAdd = () => {
    setFormData(initialFormState);
    setModalOpen(true);
  };

  const handleProductChange = (productId) => {
    const p = products.find((prod) => prod.id === productId);
    setFormData({
      ...formData,
      productId,
      productName: p?.name || '',
      bomCode: `BOM-${p?.sku || 'PRD'}-REV1`
    });
  };

  const handleAddItemLine = () => {
    const mat = rawMaterials[0];
    const newLine = {
      id: `bi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      materialId: mat.id,
      quantityPerUnit: 1.0,
      uom: mat.uom,
      unitCost: mat.unitCost,
      subtotal: mat.unitCost * 1.0
    };
    setFormData({
      ...formData,
      items: [...formData.items, newLine]
    });
  };

  const handleUpdateItemLine = (index, field, value) => {
    const nextItems = [...formData.items];
    const current = { ...nextItems[index] };

    if (field === 'materialId') {
      const mat = rawMaterials.find((r) => r.id === value);
      current.materialId = value;
      current.uom = mat?.uom || 'units';
      current.unitCost = mat?.unitCost || 0;
      current.subtotal = Number((current.quantityPerUnit * current.unitCost).toFixed(2));
    } else if (field === 'quantityPerUnit') {
      current.quantityPerUnit = Number(value);
      current.subtotal = Number((current.quantityPerUnit * current.unitCost).toFixed(2));
    }

    nextItems[index] = current;
    setFormData({ ...formData, items: nextItems });
  };

  const handleRemoveItemLine = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, idx) => idx !== index)
    });
  };

  // Dynamic live calculation
  const rawSubtotal = formData.items.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0);
  const liveScrapBuffer = (rawSubtotal * (Number(formData.scrapAllowancePercent) || 0)) / 100;
  const liveTotalCalculatedCost = (rawSubtotal + liveScrapBuffer).toFixed(2);

  const handleSaveBOM = (e) => {
    e.preventDefault();
    addBOM({
      ...formData,
      status: 'ACTIVE',
      effectiveDate: new Date().toISOString().split('T')[0]
    });
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (bomToDelete) {
      deleteBOM(bomToDelete.id);
      setDeleteConfirmOpen(false);
      setBomToDelete(null);
      if (selectedBOM?.id === bomToDelete.id) {
        setSelectedBOM(boms[0] || null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Bill of Materials (BOM) & Engineering Recipes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Component parts breakdown, scrap allowances, and dynamic unit material costing.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
          Create New BOM
        </Button>
      </div>

      {/* Main View: Split layout with BOM selector and detailed component table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: BOM Selector Cards */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Configured Recipes ({boms.length})
          </h3>

          <div className="space-y-2">
            {boms.map((bom) => {
              const isSelected = selectedBOM?.id === bom.id;
              return (
                <div
                  key={bom.id}
                  onClick={() => setSelectedBOM(bom)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/40 shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-semibold text-slate-900 text-sm block">
                        {bom.bomCode}
                      </span>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        {bom.productName}
                      </span>
                    </div>
                    <Badge status={bom.status} />
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                    <span className="text-slate-500">{bom.items?.length || 0} Components</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(bom.totalCalculatedCost)} / unit
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected BOM Breakdown Detail */}
        {selectedBOM && (
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{selectedBOM.bomCode}</h2>
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-blue-100 text-blue-700">
                    v{selectedBOM.version}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assembly Recipe for <strong>{selectedBOM.productName}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Scrap Factor
                  </span>
                  <span className="font-semibold text-amber-600">
                    +{selectedBOM.scrapAllowancePercent}% buffer
                  </span>
                </div>
                <div className="text-right border-l border-slate-200 pl-3">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Dynamic Unit Cost
                  </span>
                  <span className="text-sm font-bold text-emerald-600">
                    {formatCurrency(selectedBOM.totalCalculatedCost)}
                  </span>
                </div>
              </div>
            </div>

            {/* Component Items Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Material Code</th>
                    <th className="px-4 py-3">Material Description</th>
                    <th className="px-4 py-3 text-right">Qty / Unit (SI)</th>
                    <th className="px-4 py-3 text-right">Standard Rate</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {selectedBOM.items?.map((item, idx) => {
                    const raw = rawMaterials.find((r) => r.id === item.materialId);
                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-blue-600">
                          {raw?.code || item.materialId}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900 block">
                            {raw?.name || 'Component Item'}
                          </span>
                          <span className="text-[10px] text-slate-400">{raw?.category}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {formatMetric(item.quantityPerUnit, item.uom)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {formatCurrency(item.unitCost)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {formatCurrency(item.subtotal || item.quantityPerUnit * item.unitCost)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cost Summary Footer */}
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="text-slate-500">
                Formula:{' '}
                <code className="text-slate-700 font-mono bg-white px-1.5 py-0.5 rounded border">
                  Total Cost = Subtotal × (1 + Scrap% / 100)
                </code>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  className="text-rose-600 hover:text-rose-700"
                  onClick={() => {
                    setBomToDelete(selectedBOM);
                    setDeleteConfirmOpen(true);
                  }}
                >
                  Delete BOM
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create BOM Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Multi-Level Bill of Materials"
        subtitle="Configure component inputs, metric quantities, and dynamic scrap allowances."
        maxWidth="max-w-4xl"
        footer={
          <>
            <div className="mr-auto text-xs text-slate-600 font-medium">
              Dynamic Cost: <strong className="text-slate-900 text-sm">{formatCurrency(liveTotalCalculatedCost)}</strong>
            </div>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveBOM}>
              Save BOM Specification
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveBOM} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormSelect
              label="Select Finished Product"
              required
              value={formData.productId}
              onChange={(e) => handleProductChange(e.target.value)}
              options={products.map((p) => ({ label: `${p.sku} - ${p.name}`, value: p.id }))}
            />
            <FormInput
              label="BOM Code"
              required
              value={formData.bomCode}
              onChange={(e) => setFormData({ ...formData, bomCode: e.target.value })}
            />
            <FormInput
              label="Scrap Allowance (%)"
              type="number"
              step="0.1"
              value={formData.scrapAllowancePercent}
              onChange={(e) => setFormData({ ...formData, scrapAllowancePercent: Number(e.target.value) })}
              suffix="%"
            />
          </div>

          {/* Component Lines Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                BOM Component Elements ({formData.items.length})
              </span>
              <Button variant="secondary" size="sm" icon={Plus} onClick={handleAddItemLine}>
                Add Component Line
              </Button>
            </div>

            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/60 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Raw Material</th>
                    <th className="px-3 py-2 w-32">Qty / Unit (SI)</th>
                    <th className="px-3 py-2 w-24">Unit Rate</th>
                    <th className="px-3 py-2 w-28 text-right">Subtotal</th>
                    <th className="px-3 py-2 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        <select
                          value={item.materialId}
                          onChange={(e) => handleUpdateItemLine(idx, 'materialId', e.target.value)}
                          className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                        >
                          {rawMaterials.map((rm) => (
                            <option key={rm.id} value={rm.id}>
                              {rm.code} - {rm.name} ({rm.uom})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={item.quantityPerUnit}
                            onChange={(e) => handleUpdateItemLine(idx, 'quantityPerUnit', e.target.value)}
                            className="w-20 text-xs rounded border border-slate-300 p-1.5"
                          />
                          <span className="text-slate-400 font-mono text-[11px]">{item.uom}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{formatCurrency(item.unitCost)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900">
                        {formatCurrency(item.subtotal)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemLine(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Bill of Materials"
        message={`Are you sure you want to delete BOM ${bomToDelete?.bomCode}? Any existing completed historical production orders will not be affected.`}
      />
    </div>
  );
};

