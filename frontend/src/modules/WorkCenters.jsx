import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Factory, Gauge, Users, Clock } from 'lucide-react';
import { useERP } from '../context/useERP';
import { useTableFilter } from '../hooks/useTableFilter';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { FormInput, FormSelect } from '../components/FormInput';
import { formatCurrency } from '../utils/formatters';

export const WorkCenters = () => {
  const { workCenters, addWorkCenter, updateWorkCenter } = useERP();
  const filterHook = useTableFilter(workCenters, 'code', 'asc', 10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingWC, setEditingWC] = useState(null);

  const initialFormState = {
    code: '',
    name: '',
    department: 'Final Integration',
    location: 'Shop Floor - Sector F',
    maxCapacityHoursPerDay: 16.0,
    hourlyOperatingCost: 85.00,
    efficiencyRating: 95.0,
    headcountAssigned: 6
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenAdd = () => {
    setEditingWC(null);
    setFormData(initialFormState);
    setModalOpen(true);
  };

  const handleOpenEdit = (wc) => {
    setEditingWC(wc);
    setFormData(wc);
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingWC) {
      updateWorkCenter(editingWC.id, formData);
    } else {
      addWorkCenter(formData);
    }
    setModalOpen(false);
  };

  const columns = [
    {
      key: 'code',
      header: 'Center Code',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-blue-600 block">{val}</span>
          <span className="text-[11px] text-slate-400 font-mono">{row.id}</span>
        </div>
      )
    },
    {
      key: 'name',
      header: 'Work Center Line',
      render: (val, row) => (
        <div>
          <span className="font-medium text-slate-900 block">{val}</span>
          <span className="text-[11px] text-slate-500">{row.location}</span>
        </div>
      )
    },
    {
      key: 'department',
      header: 'Department',
      render: (val) => <span className="text-xs text-slate-600 font-medium">{val}</span>
    },
    {
      key: 'maxCapacityHoursPerDay',
      header: 'Daily Capacity',
      render: (val) => (
        <span className="font-semibold text-slate-800 text-xs">
          {val} Hours / day
        </span>
      )
    },
    {
      key: 'hourlyOperatingCost',
      header: 'Cost Rate',
      render: (val) => (
        <span className="text-xs font-semibold text-slate-900">
          {formatCurrency(val)} / hr
        </span>
      )
    },
    {
      key: 'efficiencyRating',
      header: 'Efficiency Rating',
      render: (val) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-slate-800">{val}%</span>
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                val >= 95 ? 'bg-emerald-500' : val >= 90 ? 'bg-blue-500' : 'bg-amber-500'
              }`}
              style={{ width: `${val}%` }}
            />
          </div>
        </div>
      )
    },
    {
      key: 'headcountAssigned',
      header: 'Staff Assigned',
      render: (val) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-700">
          <Users className="w-3.5 h-3.5 text-slate-400" /> {val} Operators
        </span>
      )
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
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            icon={Edit2}
            onClick={() => handleOpenEdit(row)}
            title="Edit Work Center"
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
            Work Centers & Manufacturing Lines
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Shop floor departments, daily hourly capacities, and operating rate parameters.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
          Add Work Center
        </Button>
      </div>

      <Table
        columns={columns}
        data={workCenters}
        filterHook={filterHook}
        title="Configured Shop Floor Work Centers"
        subtitle={`${filterHook.filteredData.length} production lines active`}
        exportFilename="work_centers"
        emptyIcon={Factory}
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingWC ? `Edit Work Center: ${editingWC.code}` : 'Commission Work Center'}
        subtitle="Configure operating budget, line headcount, and maximum daily hours."
        maxWidth="max-w-xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingWC ? 'Save Changes' : 'Commission Center'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Work Center Code"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. WC-INSPECT"
            />
            <FormInput
              label="Work Center Title"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Final Quality & Laser Alignment"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              options={[
                'Metal Fabrication',
                'Finishing',
                'Electrical Engineering',
                'Final Integration',
                'Quality & Dispatch'
              ]}
            />
            <FormInput
              label="Floor Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Sector B, Bay 2"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormInput
              label="Daily Capacity (Hours)"
              type="number"
              value={formData.maxCapacityHoursPerDay}
              onChange={(e) => setFormData({ ...formData, maxCapacityHoursPerDay: Number(e.target.value) })}
              suffix="Hours"
            />
            <FormInput
              label="Cost Rate (EUR/hr)"
              type="number"
              value={formData.hourlyOperatingCost}
              onChange={(e) => setFormData({ ...formData, hourlyOperatingCost: Number(e.target.value) })}
              suffix="EUR"
            />
            <FormInput
              label="Efficiency (%)"
              type="number"
              step="0.1"
              value={formData.efficiencyRating}
              onChange={(e) => setFormData({ ...formData, efficiencyRating: Number(e.target.value) })}
              suffix="%"
            />
          </div>

          <FormInput
            label="Assigned Crew Headcount"
            type="number"
            value={formData.headcountAssigned}
            onChange={(e) => setFormData({ ...formData, headcountAssigned: Number(e.target.value) })}
            suffix="Staff"
          />
        </form>
      </Modal>
    </div>
  );
};

