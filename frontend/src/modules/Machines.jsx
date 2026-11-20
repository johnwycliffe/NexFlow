import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Cog, Activity, Wrench, Zap, CheckCircle2 } from 'lucide-react';
import { useERP } from '../context/useERP';
import { useTableFilter } from '../hooks/useTableFilter';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { FormInput, FormSelect } from '../components/FormInput';
import { formatDate } from '../utils/formatters';

export const Machines = () => {
  const { machines, workCenters, addMachine, updateMachine } = useERP();
  const filterHook = useTableFilter(machines, 'code', 'asc', 10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMC, setEditingMC] = useState(null);

  const initialFormState = {
    code: '',
    name: '',
    workCenterId: workCenters[0]?.id || '',
    workCenterName: workCenters[0]?.name || '',
    model: 'Industrial Rig 2026',
    status: 'Running', // Running, Idle, Maintenance
    runtimeHours: 120.0,
    lastMaintenanceDate: '2026-10-15',
    nextMaintenanceDate: '2026-12-15',
    efficiencyPct: 96.0,
    dailyPowerConsumptionKwh: 45.0
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenAdd = () => {
    setEditingMC(null);
    setFormData(initialFormState);
    setModalOpen(true);
  };

  const handleOpenEdit = (mc) => {
    setEditingMC(mc);
    setFormData(mc);
    setModalOpen(true);
  };

  const handleWorkCenterChange = (wcId) => {
    const wc = workCenters.find((w) => w.id === wcId);
    setFormData({
      ...formData,
      workCenterId: wcId,
      workCenterName: wc?.name || ''
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingMC) {
      updateMachine(editingMC.id, formData);
    } else {
      addMachine(formData);
    }
    setModalOpen(false);
  };

  const toggleStatus = (machine, nextStatus) => {
    updateMachine(machine.id, { status: nextStatus });
  };

  const columns = [
    {
      key: 'code',
      header: 'Machine Tag',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-blue-600 block">{val}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.model}</span>
        </div>
      )
    },
    {
      key: 'name',
      header: 'Machine Equipment',
      render: (val, row) => (
        <div>
          <span className="font-medium text-slate-900 block">{val}</span>
          <span className="text-[11px] text-slate-500">{row.workCenterName}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Operating State',
      render: (val) => <Badge status={val} />
    },
    {
      key: 'runtimeHours',
      header: 'Runtime Meter',
      render: (val) => (
        <span className="font-semibold text-slate-800 text-xs">
          {Number(val).toLocaleString()} h
        </span>
      )
    },
    {
      key: 'efficiencyPct',
      header: 'OEE Health',
      render: (val) => <span className="font-bold text-xs text-slate-800">{val}%</span>
    },
    {
      key: 'dailyPowerConsumptionKwh',
      header: 'Daily Power (SI)',
      render: (val) => (
        <span className="text-xs text-slate-600">
          {val} kWh / day
        </span>
      )
    },
    {
      key: 'nextMaintenanceDate',
      header: 'Next Service Due',
      render: (val) => (
        <span className="text-xs text-slate-700 font-mono">
          {formatDate(val)}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          {row.status !== 'Running' && (
            <button
              onClick={() => toggleStatus(row, 'Running')}
              className="text-[10px] px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200 hover:bg-emerald-100"
            >
              Start
            </button>
          )}
          {row.status === 'Running' && (
            <button
              onClick={() => toggleStatus(row, 'Idle')}
              className="text-[10px] px-2 py-1 rounded bg-amber-50 text-amber-700 font-medium border border-amber-200 hover:bg-amber-100"
            >
              Idle
            </button>
          )}
          {row.status !== 'Maintenance' && (
            <button
              onClick={() => toggleStatus(row, 'Maintenance')}
              className="text-[10px] px-2 py-1 rounded bg-rose-50 text-rose-700 font-medium border border-rose-200 hover:bg-rose-100"
            >
              Service
            </button>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={Edit2}
            onClick={() => handleOpenEdit(row)}
            title="Edit Machine Profile"
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
            Machine Equipment & Tool Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Shop floor CNC benders, robotic welders, power consumption telemetry, and maintenance schedules.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
          Register Machine
        </Button>
      </div>

      <Table
        columns={columns}
        data={machines}
        filterHook={filterHook}
        title="Plant Machine Floor Assets"
        subtitle={`${filterHook.filteredData.length} machines monitored in real time`}
        exportFilename="machine_registry"
        emptyIcon={Cog}
      />

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMC ? `Edit Machine: ${editingMC.code}` : 'Register Machinery'}
        subtitle="Record equipment nameplate parameters, line allocation, and calibration intervals."
        maxWidth="max-w-xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingMC ? 'Update Asset' : 'Register Asset'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Machine Asset Tag"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. DYNO-TEST-02"
            />
            <FormInput
              label="Asset Description"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. High-Speed Dynamometer Bench"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Allocated Work Center"
              value={formData.workCenterId}
              onChange={(e) => handleWorkCenterChange(e.target.value)}
              options={workCenters.map((w) => ({ label: w.name, value: w.id }))}
            />
            <FormInput
              label="OEM Manufacturer / Model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormSelect
              label="Operating State"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={['Running', 'Idle', 'Maintenance']}
            />
            <FormInput
              label="Runtime Meter (Hours)"
              type="number"
              value={formData.runtimeHours}
              onChange={(e) => setFormData({ ...formData, runtimeHours: Number(e.target.value) })}
              suffix="Hours"
            />
            <FormInput
              label="Daily Power (kWh)"
              type="number"
              value={formData.dailyPowerConsumptionKwh}
              onChange={(e) => setFormData({ ...formData, dailyPowerConsumptionKwh: Number(e.target.value) })}
              suffix="kWh"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Last Service Date"
              type="date"
              value={formData.lastMaintenanceDate}
              onChange={(e) => setFormData({ ...formData, lastMaintenanceDate: e.target.value })}
            />
            <FormInput
              label="Next Calibration Date"
              type="date"
              value={formData.nextMaintenanceDate}
              onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

