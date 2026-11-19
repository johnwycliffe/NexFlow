import React, { useState } from 'react';
import { CalendarClock, Plus, Trash2, AlertTriangle, CheckCircle, Clock, Calendar, AlertCircle } from 'lucide-react';
import { useERP } from '../context/useERP';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { FormInput, FormSelect } from '../components/FormInput';
import { formatDate } from '../utils/formatters';

export const ProductionScheduling = () => {
  const {
    schedules,
    addSchedule,
    deleteSchedule,
    productionOrders,
    workCenters,
    machines,
    shifts,
    checkScheduleConflict
  } = useERP();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2026-11-10');
  const [conflictWarning, setConflictWarning] = useState(null);

  const initialFormState = {
    productionOrderId: productionOrders[0]?.id || '',
    orderNumber: productionOrders[0]?.orderNumber || '',
    workCenterId: workCenters[0]?.id || '',
    workCenterName: workCenters[0]?.name || '',
    machineId: machines[0]?.id || '',
    machineName: machines[0]?.name || '',
    shiftId: shifts[0]?.id || '',
    shiftName: shifts[0]?.name || '',
    scheduleDate: selectedDate,
    startHour: 8,
    endHour: 14,
    plannedUnits: 30
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenAdd = () => {
    setConflictWarning(null);
    setFormData({
      ...initialFormState,
      scheduleDate: selectedDate
    });
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

  const handleMachineChange = (mcId) => {
    const mc = machines.find((m) => m.id === mcId);
    const wc = workCenters.find((w) => w.id === mc?.workCenterId);
    setFormData({
      ...formData,
      machineId: mcId,
      machineName: mc?.name || '',
      workCenterId: wc?.id || '',
      workCenterName: wc?.name || ''
    });

    // Check potential conflict
    const conflict = checkScheduleConflict(mcId, formData.scheduleDate, formData.startHour, formData.endHour);
    setConflictWarning(conflict);
  };

  const handleTimeChange = (field, val) => {
    const updated = { ...formData, [field]: Number(val) };
    setFormData(updated);

    const conflict = checkScheduleConflict(
      updated.machineId,
      updated.scheduleDate,
      updated.startHour,
      updated.endHour
    );
    setConflictWarning(conflict);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const result = addSchedule(formData);
    if (result.success) {
      setModalOpen(false);
    }
  };

  // Timeline hours: 06:00 to 22:00
  const timelineHours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

  // Filter schedules for the selected date
  const daySchedules = schedules.filter((s) => s.scheduleDate === selectedDate);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Production Scheduling & Machine Allocation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visual shop-floor Gantt calendar with active detection of double-booking collision conflicts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none"
            />
          </div>

          <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
            Schedule Batch Slot
          </Button>
        </div>
      </div>

      {/* Visual Timeline / Gantt Board */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">
              Shop Floor Machine Gantt Timeline
            </h3>
            <span className="text-xs text-slate-500">({formatDate(selectedDate)})</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
              <span className="text-slate-600">Active Shift Allocation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
              <span className="text-slate-600">Maintenance Slot</span>
            </div>
          </div>
        </div>

        {/* Timeline Header (Hours) */}
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-18 border-b border-slate-200 bg-slate-100/60 text-[11px] font-mono font-medium text-slate-500">
              <div className="col-span-3 p-3 font-sans font-semibold text-slate-700">
                Machine Equipment
              </div>
              {timelineHours.slice(0, 15).map((hour) => (
                <div key={hour} className="col-span-1 p-2 text-center border-l border-slate-200">
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Rows per Machine */}
            <div className="divide-y divide-slate-100">
              {machines.map((mc) => {
                const mcSchedules = daySchedules.filter((s) => s.machineId === mc.id);

                return (
                  <div key={mc.id} className="grid grid-cols-18 min-h-[64px] items-center hover:bg-slate-50/50 transition-colors">
                    <div className="col-span-3 p-3">
                      <span className="font-semibold text-xs text-slate-900 block truncate">
                        {mc.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {mc.code} • {mc.workCenterName}
                      </span>
                    </div>

                    {/* Timeline canvas grid */}
                    <div className="col-span-15 relative h-12 border-l border-slate-200 grid grid-cols-15">
                      {/* Grid background lines */}
                      {timelineHours.slice(0, 15).map((h, i) => (
                        <div key={i} className="border-r border-slate-100 h-full" />
                      ))}

                      {/* Render scheduled blocks */}
                      {mcSchedules.map((sch) => {
                        const start = Math.max(6, sch.startHour);
                        const end = Math.min(21, sch.endHour);
                        const leftPercent = ((start - 6) / 15) * 100;
                        const widthPercent = ((end - start) / 15) * 100;

                        return (
                          <div
                            key={sch.id}
                            style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                            className="absolute top-1.5 bottom-1.5 rounded-lg bg-blue-600 text-white p-2 text-xs shadow-sm flex items-center justify-between group overflow-hidden z-10"
                            title={`${sch.orderNumber}: ${sch.plannedUnits} units (${sch.startHour}:00 - ${sch.endHour}:00)`}
                          >
                            <div className="truncate">
                              <span className="font-bold text-[11px] block truncate">
                                {sch.orderNumber}
                              </span>
                              <span className="text-[10px] opacity-80 block truncate">
                                {sch.plannedUnits} units ({sch.shiftName})
                              </span>
                            </div>
                            <button
                              onClick={() => deleteSchedule(sch.id)}
                              className="text-white/70 hover:text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Cancel Schedule Block"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">
          Detailed Schedule Assignments ({daySchedules.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <th className="px-4 py-2.5">Schedule ID</th>
                <th className="px-4 py-2.5">Production Order</th>
                <th className="px-4 py-2.5">Assigned Machine</th>
                <th className="px-4 py-2.5">Shift Pattern</th>
                <th className="px-4 py-2.5">Time Window</th>
                <th className="px-4 py-2.5 text-right">Planned Batch</th>
                <th className="px-4 py-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {daySchedules.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-500">{s.id}</td>
                  <td className="px-4 py-3 font-semibold text-blue-600">{s.orderNumber}</td>
                  <td className="px-4 py-3">{s.machineName}</td>
                  <td className="px-4 py-3">{s.shiftName}</td>
                  <td className="px-4 py-3 font-mono">
                    {s.startHour}:00 - {s.endHour}:00 ({s.allocatedHours} hrs)
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {s.plannedUnits} units
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => deleteSchedule(s.id)}
                      className="text-rose-600 hover:text-rose-800"
                    />
                  </td>
                </tr>
              ))}
              {daySchedules.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No production runs scheduled for {formatDate(selectedDate)}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Slot Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule Machine Production Slot"
        subtitle="Assign production work orders to machines with automated double-booking prevention."
        maxWidth="max-w-xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Lock Schedule Slot
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Conflict Warning Banner if Collision Detected */}
          {conflictWarning && (
            <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-900 flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block">Double-Booking Collision Alert:</strong>
                Machine is already booked by order <strong>{conflictWarning.orderNumber}</strong> from{' '}
                {conflictWarning.startHour}:00 to {conflictWarning.endHour}:00 on {conflictWarning.scheduleDate}.
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Production Order"
              required
              value={formData.productionOrderId}
              onChange={(e) => handleOrderChange(e.target.value)}
              options={productionOrders.map((p) => ({
                label: `${p.orderNumber} - ${p.productName} (${p.batchQuantity} ${p.uom})`,
                value: p.id
              }))}
            />
            <FormSelect
              label="Shop Floor Machine"
              required
              value={formData.machineId}
              onChange={(e) => handleMachineChange(e.target.value)}
              options={machines.map((m) => ({
                label: `${m.name} (${m.workCenterName})`,
                value: m.id
              }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormInput
              label="Schedule Date"
              type="date"
              required
              value={formData.scheduleDate}
              onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
            />
            <FormInput
              label="Start Hour (24h)"
              type="number"
              min="0"
              max="23"
              value={formData.startHour}
              onChange={(e) => handleTimeChange('startHour', e.target.value)}
              suffix=":00"
            />
            <FormInput
              label="End Hour (24h)"
              type="number"
              min="1"
              max="24"
              value={formData.endHour}
              onChange={(e) => handleTimeChange('endHour', e.target.value)}
              suffix=":00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Shift Roster"
              value={formData.shiftId}
              onChange={(e) => {
                const sh = shifts.find((s) => s.id === e.target.value);
                setFormData({ ...formData, shiftId: e.target.value, shiftName: sh?.name || '' });
              }}
              options={shifts.map((s) => ({ label: `${s.name} (${s.startTime} - ${s.endTime})`, value: s.id }))}
            />
            <FormInput
              label="Planned Batch Volume"
              type="number"
              value={formData.plannedUnits}
              onChange={(e) => setFormData({ ...formData, plannedUnits: Number(e.target.value) })}
              suffix="units"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

