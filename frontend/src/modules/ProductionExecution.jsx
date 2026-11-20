import React, { useState } from 'react';
import { PlayCircle, PauseCircle, CheckCircle, Flame, Wrench, AlertCircle, Plus, Users } from 'lucide-react';
import { useERP } from '../context/useERP';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { FormInput, FormTextarea } from '../components/FormInput';
import { formatMetric } from '../utils/formatters';

export const ProductionExecution = () => {
  const { executionRuns, updateExecutionProgress, productionOrders } = useERP();

  const [modalOpen, setModalOpen] = useState(false);
  const [activeRun, setActiveRun] = useState(null);
  const [completedQty, setCompletedQty] = useState(0);
  const [scrapQty, setScrapQty] = useState(0);
  const [operatorNotes, setOperatorNotes] = useState('');

  const handleOpenLog = (run) => {
    setActiveRun(run);
    setCompletedQty(run.completedQuantity);
    setScrapQty(run.scrapQuantity);
    setOperatorNotes(run.notes || '');
    setModalOpen(true);
  };

  const handleSaveProgress = (e) => {
    e.preventDefault();
    if (activeRun) {
      updateExecutionProgress(activeRun.id, completedQty, scrapQty, operatorNotes);
      setModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Shop Floor Production Execution (Run-Cards)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time traveler run-cards, operator piece-count logging, scrap variance recording, and line progress.
          </p>
        </div>
      </div>

      {/* Live Floor Run-Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {executionRuns.map((run) => {
          const isDone = run.progressPercent >= 100;
          return (
            <div
              key={run.id}
              className={`rounded-xl border p-5 bg-white shadow-2xs transition-all ${
                isDone ? 'border-emerald-200' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-slate-900">{run.orderNumber}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {run.operationCode}
                    </span>
                  </div>
                  <h3 className="text-xs font-medium text-slate-600 mt-0.5">
                    {run.productName}
                  </h3>
                </div>

                <Badge status={run.status} />
              </div>

              <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Operation:</span>
                  <span className="font-semibold text-slate-800">{run.operationName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Work Center Line:</span>
                  <span className="text-slate-800">{run.workCenterName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Station Operator:</span>
                  <span className="text-slate-800 flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" /> {run.assignedOperator}
                  </span>
                </div>
              </div>

              {/* Progress Bar & Piece Counts */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Operational Progress</span>
                  <span className="font-bold text-slate-900">{run.progressPercent}%</span>
                </div>

                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isDone ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${run.progressPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                  <div className="p-2 rounded bg-slate-50">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Target</span>
                    <span className="font-bold text-slate-800">{run.targetQuantity} units</span>
                  </div>
                  <div className="p-2 rounded bg-emerald-50 text-emerald-800">
                    <span className="text-emerald-600 block text-[10px] uppercase font-semibold">Finished</span>
                    <span className="font-bold">{run.completedQuantity} units</span>
                  </div>
                  <div className="p-2 rounded bg-rose-50 text-rose-800">
                    <span className="text-rose-600 block text-[10px] uppercase font-semibold">Scrap</span>
                    <span className="font-bold">{run.scrapQuantity} units</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {run.notes && (
                <div className="mt-3 text-xs text-slate-500 italic bg-slate-50/60 p-2.5 rounded border border-slate-100">
                  "{run.notes}"
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Wrench}
                  onClick={() => handleOpenLog(run)}
                >
                  Log Output & Scrap
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress & Scrap Logging Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Log Production: ${activeRun?.orderNumber}`}
        subtitle={`${activeRun?.operationName} | Target: ${activeRun?.targetQuantity} units`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveProgress}>
              Record Run Data
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveProgress} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Completed Finished Pieces"
              type="number"
              min="0"
              max={activeRun?.targetQuantity || 100}
              required
              value={completedQty}
              onChange={(e) => setCompletedQty(Number(e.target.value))}
              suffix="units"
            />
            <FormInput
              label="Recorded Scrap / Off-Spec"
              type="number"
              min="0"
              value={scrapQty}
              onChange={(e) => setScrapQty(Number(e.target.value))}
              suffix="units"
            />
          </div>

          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900">
            <span>Resulting Yield: </span>
            <strong className="text-sm font-bold">
              {Math.min(100, Math.round(((completedQty + scrapQty) / (activeRun?.targetQuantity || 1)) * 100))}% Completed
            </strong>
          </div>

          <FormTextarea
            label="Operator Log Remarks"
            rows={2}
            value={operatorNotes}
            onChange={(e) => setOperatorNotes(e.target.value)}
            placeholder="Document machine torque calibration, line stoppages, or tooling wear..."
          />
        </form>
      </Modal>
    </div>
  );
};

