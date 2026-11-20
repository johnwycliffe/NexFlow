import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Box, Layers, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useERP } from '../context/useERP';
import { useTableFilter } from '../hooks/useTableFilter';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FormInput, FormSelect, FormTextarea } from '../components/FormInput';
import { formatCurrency, formatMetric } from '../utils/formatters';

export const ProductMaster = () => {
  const navigate = useNavigate();
  const { products, addProduct, updateProduct, deleteProduct, boms } = useERP();
  const filterHook = useTableFilter(products, 'sku', 'asc', 10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const initialFormState = {
    sku: '',
    name: '',
    category: 'Commuter E-Bikes',
    revision: 'Rev A.1',
    unitCost: 500,
    sellingPrice: 999,
    uom: 'units',
    weightKg: 20.0,
    leadTimeDays: 7,
    status: 'ACTIVE',
    description: '',
    specifications: {
      frameMaterial: 'Aluminum 6061-T6',
      motorPowerWatts: 250,
      batteryCapacityWh: 400,
      maxRangeKm: 70,
      maxSpeedKmh: 25
    }
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData(initialFormState);
    setModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      ...product,
      specifications: product.specifications || initialFormState.specifications
    });
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
    } else {
      addProduct(formData);
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
    }
  };

  const categories = ['ALL', 'Commuter E-Bikes', 'All-Terrain E-Bikes', 'Commercial Cargo'];

  const columns = [
    {
      key: 'sku',
      header: 'SKU / Code',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-blue-600 block">{val}</span>
          <span className="text-[11px] text-slate-400">{row.id}</span>
        </div>
      )
    },
    {
      key: 'name',
      header: 'Product Description',
      render: (val, row) => (
        <div>
          <span className="font-medium text-slate-900 block">{val}</span>
          <span className="text-[11px] text-slate-500 line-clamp-1">{row.description}</span>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (val) => <span className="text-xs text-slate-600 font-medium">{val}</span>
    },
    {
      key: 'revision',
      header: 'Active Revision',
      render: (val) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200">
          {val}
        </span>
      )
    },
    {
      key: 'unitCost',
      header: 'Standard Cost (SI)',
      render: (val) => <span className="font-semibold text-slate-900">{formatCurrency(val)}</span>
    },
    {
      key: 'sellingPrice',
      header: 'List Price',
      render: (val) => <span className="text-slate-600">{formatCurrency(val)}</span>
    },
    {
      key: 'weightKg',
      header: 'Unit Weight',
      render: (val) => <span>{formatMetric(val, 'kg')}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (val) => <Badge status={val} />
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (_, row) => {
        const hasBom = boms.some((b) => b.productId === row.id);
        return (
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              icon={Layers}
              onClick={() => navigate('/bom')}
              title={hasBom ? 'View Linked BOM' : 'Create BOM'}
              className="text-blue-600 hover:text-blue-800"
            />
            <Button
              variant="ghost"
              size="sm"
              icon={Edit2}
              onClick={() => handleOpenEdit(row)}
              title="Edit Product"
            />
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={() => {
                setProductToDelete(row);
                setDeleteConfirmOpen(true);
              }}
              title="Delete Product"
              className="text-rose-600 hover:text-rose-800"
            />
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Product Master & SKU Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Engineered bill of materials roots, technical specifications, and SI unit cost registries.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
          Register New SKU
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => filterHook.setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterHook.categoryFilter === cat
                ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {cat === 'ALL' ? 'All Categories' : cat}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={products}
        filterHook={filterHook}
        title="Registered Finished Goods Catalog"
        subtitle={`${filterHook.filteredData.length} SKUs configured in active database`}
        exportFilename="products_master"
        emptyIcon={Box}
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? `Edit SKU: ${editingProduct.sku}` : 'Register New Finished Product'}
        subtitle="Specify product attributes, SI metric units, and engineering revisions."
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="SKU Identifier"
              required
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              placeholder="e.g. EBIKE-URB-300"
            />
            <FormInput
              label="Product Commercial Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. EcoRide Sport 350W"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormSelect
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                'Commuter E-Bikes',
                'All-Terrain E-Bikes',
                'Commercial Cargo',
                'Industrial EV'
              ]}
            />
            <FormInput
              label="Engineering Revision"
              value={formData.revision}
              onChange={(e) => setFormData({ ...formData, revision: e.target.value })}
              placeholder="e.g. Rev C.1"
            />
            <FormSelect
              label="Lifecycle Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={['ACTIVE', 'UNDER_REVIEW', 'PHASE_OUT']}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormInput
              label="Standard Unit Cost"
              type="number"
              step="0.01"
              value={formData.unitCost}
              onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
              suffix="EUR"
            />
            <FormInput
              label="Recommended Selling Price"
              type="number"
              step="0.01"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
              suffix="EUR"
            />
            <FormInput
              label="Finished Weight"
              type="number"
              step="0.1"
              value={formData.weightKg}
              onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
              suffix="kg"
            />
          </div>

          <FormTextarea
            label="Engineering Description & Application Notes"
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Technical details, intended usage, and drive system characteristics..."
          />

          <div className="border-t border-slate-200 pt-3">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              SI Technical Specifications
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormInput
                label="Motor Power"
                type="number"
                value={formData.specifications?.motorPowerWatts || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    specifications: { ...formData.specifications, motorPowerWatts: Number(e.target.value) }
                  })
                }
                suffix="Watts"
              />
              <FormInput
                label="Battery Capacity"
                type="number"
                value={formData.specifications?.batteryCapacityWh || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    specifications: { ...formData.specifications, batteryCapacityWh: Number(e.target.value) }
                  })
                }
                suffix="Wh"
              />
              <FormInput
                label="Max Range"
                type="number"
                value={formData.specifications?.maxRangeKm || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    specifications: { ...formData.specifications, maxRangeKm: Number(e.target.value) }
                  })
                }
                suffix="km"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Archive Product SKU"
        message={`Are you sure you want to archive SKU "${productToDelete?.sku}" (${productToDelete?.name})? Existing historical orders will retain their snapshot.`}
      />
    </div>
  );
};

