import React, { useState } from 'react';
import { Plus, Edit2, CalendarDays, Clock, Users, Shield, CheckCircle } from 'lucide-react';
import { useERP } from '../context/useERP';
import { useTableFilter } from '../hooks/useTableFilter';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { FormInput, FormSelect } from '../components/FormInput';

export const ShiftsCalendar = () => {
  const { shifts, addShift, updateShift } = useERP();
  const filterHook = useTableFilter(shifts, 'startTime', 'asc', 10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);

  const initialFormState = {
    code: '',
    name: '',
    startTime: '08:00',
    endTime: '16:00',
    durationHours: 8.0,
    supervisor: '',
    assignedTeam: 'Alpha Crew',
    workerCount: 15,
    colorHex: '#3b82f6'
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenAdd = () => {
    setEditingShift(null);
    setFormData(initialFormState);
    setModalOpen(true);
  };

  const handleOpenEdit = (sh) => {
    setEditingShift(sh);
    setFormData(sh);
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingShift) {
      updateShift(editingShift.id, formData);
    } else {
      addShift(formData);
    }
    setModalOpen(false);
  };

  const columns = [
    {
      key: 'name',
      header: 'Shift Pattern',
      render: (val, row) => (
        <div className="flex items-center gap-2.5">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: row.colorHex || '#3b82f6' }}
          />
          <div>
            <span className="font-semibold text-slate-900 block">{val}</span>
            <span className="text-[10px] text-slate-400 font-mono">{row.code}</span>
          </div>
        </div>
      )
    },
    {
      key: 'startTime',
      header: 'Operating Hours',
      render: (val, row) => (
        <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-800">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{val} - {row.endTime}</span>
          <span className="text-[10px] text-slate-400 font-sans">({row.durationHours} hrs)</span>
        </div>
      )
    },
    {
      key: 'supervisor',
      header: 'Shift Supervisor',
      render: (val) => (
        <span className="text-xs font-medium text-slate-800 flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-blue-500" /> {val}
        </span>
      )
    },
    {
      key: 'assignedTeam',
      header: 'Assigned Roster Team',
      render: (val) => (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {val}
        </span>
      )
    },
    {
      key: 'workerCount',
      header: 'Active Headcount',
      render: (val) => (
        <span className="text-xs text-slate-700 flex items-center gap-1">
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
            title="Edit Shift"
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
            Factory Shifts & Operating Calendar
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            24-hour manufacturing shift patterns, supervisor leadership, and shop floor operator team rosters.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
          Add Shift Pattern
        </Button>
      </div>

      <Table
        columns={columns}
        data={shifts}
        filterHook={filterHook}
        title="Active Factory Shift Rotations"
        subtitle={`${filterHook.filteredData.length} shifts scheduled per working calendar`}
        exportFilename="shifts_calendar"
        emptyIcon={CalendarDays}
      />

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingShift ? `Edit Shift: ${editingShift.name}` : 'Create Shift Pattern'}
        subtitle="Define active working hours, crew headcount, and supervisor in charge."
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingShift ? 'Save Changes' : 'Create Shift'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Shift Code"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. SHIFT-TWILIGHT"
            />
            <FormInput
              label="Shift Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Twilight Overtime Shift"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormInput
              label="Start Time"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
            <FormInput
              label="End Time"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
            <FormInput
              label="Duration (Hours)"
              type="number"
              step="0.5"
              value={formData.durationHours}
              onChange={(e) => setFormData({ ...formData, durationHours: Number(e.target.value) })}
              suffix="Hours"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Shift Supervisor"
              required
              value={formData.supervisor}
              onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
              placeholder="e.g. Heinrich Weber"
            />
            <FormInput
              label="Roster Crew Name"
              value={formData.assignedTeam}
              onChange={(e) => setFormData({ ...formData, assignedTeam: e.target.value })}
              placeholder="e.g. Delta Crew"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Assigned Operators"
              type="number"
              value={formData.workerCount}
              onChange={(e) => setFormData({ ...formData, workerCount: Number(e.target.value) })}
              suffix="Staff"
            />
            <FormInput
              label="Timeline Color Hex"
              type="text"
              value={formData.colorHex}
              onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

