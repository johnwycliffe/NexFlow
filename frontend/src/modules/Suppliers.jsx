import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Truck, Star, Mail, Phone, MapPin } from 'lucide-react';
import { useERP } from '../context/useERP';
import { useTableFilter } from '../hooks/useTableFilter';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FormInput, FormSelect, FormTextarea } from '../components/FormInput';

export const Suppliers = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useERP();
  const filterHook = useTableFilter(suppliers, 'rating', 'desc', 10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSup, setEditingSup] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [supToDelete, setSupToDelete] = useState(null);

  const initialFormState = {
    code: '',
    name: '',
    country: 'Germany',
    city: 'Munich',
    contactPerson: '',
    email: '',
    phone: '',
    rating: 4.8,
    leadTimeDays: 10,
    qualityPassRate: 99.0,
    linkedCategories: ['Metals & Frames'],
    paymentTerms: 'Net 30'
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenAdd = () => {
    setEditingSup(null);
    setFormData(initialFormState);
    setModalOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setEditingSup(sup);
    setFormData(sup);
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingSup) {
      updateSupplier(editingSup.id, formData);
    } else {
      addSupplier(formData);
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (supToDelete) {
      deleteSupplier(supToDelete.id);
      setDeleteConfirmOpen(false);
      setSupToDelete(null);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Supplier / Vendor',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{val}</span>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{row.city}, {row.country}</span>
          </div>
        </div>
      )
    },
    {
      key: 'contactPerson',
      header: 'Contact Details',
      render: (val, row) => (
        <div className="space-y-0.5">
          <span className="text-xs font-medium text-slate-800 block">{val}</span>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span className="flex items-center gap-0.5">
              <Mail className="w-2.5 h-2.5" /> {row.email}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'rating',
      header: 'Performance Score',
      render: (val) => (
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="font-bold text-slate-800 text-xs">{val}</span>
          <span className="text-[10px] text-slate-400">/ 5.0</span>
        </div>
      )
    },
    {
      key: 'qualityPassRate',
      header: 'QA Pass Rate',
      render: (val) => (
        <span className="font-semibold text-emerald-600 text-xs">
          {val}%
        </span>
      )
    },
    {
      key: 'leadTimeDays',
      header: 'Avg Lead Time',
      render: (val) => <span className="text-xs text-slate-700 font-medium">{val} days</span>
    },
    {
      key: 'paymentTerms',
      header: 'Terms',
      render: (val) => (
        <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
          {val}
        </span>
      )
    },
    {
      key: 'linkedCategories',
      header: 'Supply Scope',
      render: (val) => {
        const categories = Array.isArray(val)
          ? val
          : (typeof val === 'string' && val ? val.split(',').map((s) => s.trim()).filter(Boolean) : []);
        return (
          <div className="flex flex-wrap gap-1">
            {categories.map((cat, idx) => (
              <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                {cat}
              </span>
            ))}
          </div>
        );
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
            icon={Edit2}
            onClick={() => handleOpenEdit(row)}
            title="Edit Vendor"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => {
              setSupToDelete(row);
              setDeleteConfirmOpen(true);
            }}
            title="Delete Vendor"
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
            Supplier & Vendor Network
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Certified manufacturing component suppliers, delivery lead times, and SLA ratings.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
          Add Supplier
        </Button>
      </div>

      <Table
        columns={columns}
        data={suppliers}
        filterHook={filterHook}
        title="Approved Supplier Registry"
        subtitle={`${filterHook.filteredData.length} qualified suppliers onboarded`}
        exportFilename="suppliers_directory"
        emptyIcon={Truck}
      />

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSup ? `Edit Vendor: ${editingSup.name}` : 'Onboard Certified Supplier'}
        subtitle="Record vendor contact details, SLA delivery timelines, and audited quality rates."
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingSup ? 'Save Changes' : 'Onboard Supplier'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Vendor Code"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. VEND-ALU"
            />
            <FormInput
              label="Company Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Precision Parts GmbH"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
            <FormInput
              label="City / Hub"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormInput
              label="Contact Person"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            />
            <FormInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <FormInput
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormInput
              label="Audit Rating (1 - 5)"
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
            />
            <FormInput
              label="Lead Time (Days)"
              type="number"
              value={formData.leadTimeDays}
              onChange={(e) => setFormData({ ...formData, leadTimeDays: Number(e.target.value) })}
              suffix="Days"
            />
            <FormSelect
              label="Payment Terms"
              value={formData.paymentTerms}
              onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              options={['Net 15', 'Net 30', 'Net 45', 'Net 60']}
            />
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Remove Supplier"
        message={`Are you sure you want to delete supplier "${supToDelete?.name}"?`}
      />
    </div>
  );
};

