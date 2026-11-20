import React, { useState } from 'react';
import { Plus, CheckSquare, AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import { useERP } from '../context/useERP';
import { useTableFilter } from '../hooks/useTableFilter';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { FormInput, FormSelect, FormTextarea } from '../components/FormInput';
import { formatDate } from '../utils/formatters';

export const QualityInspection = () => {
  const { qualityInspections, logQualityInspection, productionOrders } = useERP();
  const filterHook = useTableFilter(qualityInspections, 'inspectionNumber', 'asc', 10);

  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState('');

  const initialFormState = {
    productionOrderId: productionOrders[0]?.id || '',
    orderNumber: productionOrders[0]?.orderNumber || '',
    productName: productionOrders[0]?.productName || '',
    inspectedQuantity: 50,
    acceptedQuantity: 48,
    rejectedQuantity: 2,
    defectReason: 'Dyno test torque variance / brake alignment',
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectorName: 'Dr. Clara Lindqvist (Lead QA)',
    disposition: 'Accepted units routed to WH-03 Finished Goods Hub. Rework off-spec.'
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenAdd = () => {
    setFormError('');
    setFormData(initialFormState);
    setModalOpen(true);
  };

  const handleOrderChange = (poId) => {
    const po = productionOrders.find((p) => p.id === poId);
    setFormData({
      ...formData,
      productionOrderId: poId,
      orderNumber: po?.orderNumber || '',
      productName: po?.productName || '',
      inspectedQuantity: po?.batchQuantity || 50,
      acceptedQuantity: po?.batchQuantity || 50,
      rejectedQuantity: 0
    });
  };

  const handleAcceptedChange = (accepted) => {
    const acc = Number(accepted);
    const rej = Math.max(0, formData.inspectedQuantity - acc);
    setFormData({
      ...formData,
      acceptedQuantity: acc,
      rejectedQuantity: rej
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    setFormError('');

    const inspected = Number(formData.inspectedQuantity);
    const accepted = Number(formData.acceptedQuantity);
    const rejected = Number(formData.rejectedQuantity);

    // Strict validation
    if (inspected !== accepted + rejected) {
      setFormError(`Strict ERP Check Failed: Inspected (${inspected}) must exactly equal Accepted (${accepted}) + Rejected (${rejected}).`);
      return;
    }

    const res = logQualityInspection(formData);
    if (res.success) {
      setModalOpen(false);
    } else {
      setFormError(res.error);
    }
  };

  const columns = [
    {
      key: 'inspectionNumber',
      header: 'QC Record #',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-blue-600 block">{val}</span>
          <span className="text-[10px] text-slate-400 font-mono">Date: {formatDate(row.inspectionDate)}</span>
        </div>
      )
    },
    {
      key: 'orderNumber',
      header: 'Production Work Order',
      render: (val, row) => (
        <div>
          <span className="font-medium text-slate-900 block">{val}</span>
          <span className="text-[11px] text-slate-500">{row.productName}</span>
        </div>
      )
    },
    {
      key: 'inspectedQuantity',
      header: 'Strict Breakdown (SI)',
      render: (val, row) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Inspected:</span>
            <strong className="text-slate-900 font-bold">{val}</strong>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-emerald-600 font-medium">{row.acceptedQuantity} Accepted</span>
            <span className="text-slate-300">•</span>
            <span className="text-rose-600 font-medium">{row.rejectedQuantity} Rejected</span>
          </div>
        </div>
      )
    },
    {
      key: 'passRatePercent',
      header: 'Yield Pass Rate',
      render: (val) => (
        <span
          className={`font-bold text-xs ${
            val >= 95 ? 'text-emerald-700' : 'text-amber-600'
          }`}
        >
          {val}%
        </span>
      )
    },
    {
      key: 'status',
      header: 'Verdict',
      render: (val) => <Badge status={val} />
    },
    {
      key: 'defectReason',
      header: 'Defect Analysis & Dispositions',
      render: (val, row) => (
        <div className="max-w-xs">
          <span className="text-xs text-slate-700 block truncate">{val || 'No defects recorded'}</span>
          <span className="text-[10px] text-slate-400 block truncate">{row.disposition}</span>
        </div>
      )
    },
    {
      key: 'inspectorName',
      header: 'Lead Inspector',
      render: (val) => (
        <span className="text-xs text-slate-600 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> {val}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Quality Assurance & Bench Inspection
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Strict compliance enforcement: <code className="font-mono font-semibold text-slate-700">Inspected = Accepted + Rejected</code>.
            Accepted pieces are automatically verified into Finished Goods.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
          Log Inspection Sign-Off
        </Button>
      </div>

      <Table
        columns={columns}
        data={qualityInspections}
        filterHook={filterHook}
        title="Inspection Certificates & Disposition Logs"
        subtitle={`${filterHook.filteredData.length} formal QA inspections performed`}
        exportFilename="quality_inspections"
        emptyIcon={CheckSquare}
      />

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Quality Assurance Inspection Report"
        subtitle="Validate piece count sums, record non-conformance reason codes, and sign off dispositions."
        maxWidth="max-w-xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Certify & Route Units
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-900 text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <FormSelect
            label="Target Production Work Order"
            required
            value={formData.productionOrderId}
            onChange={(e) => handleOrderChange(e.target.value)}
            options={productionOrders.map((p) => ({
              label: `${p.orderNumber} - ${p.productName} (${p.batchQuantity} ${p.uom})`,
              value: p.id
            }))}
          />

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Inspection Verification Sum (Strict Equation)
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <FormInput
                label="Inspected (Total)"
                type="number"
                min="1"
                required
                value={formData.inspectedQuantity}
                onChange={(e) => setFormData({ ...formData, inspectedQuantity: Number(e.target.value) })}
                suffix="units"
              />
              <FormInput
                label="Accepted (Yield)"
                type="number"
                min="0"
                required
                value={formData.acceptedQuantity}
                onChange={(e) => handleAcceptedChange(e.target.value)}
                suffix="units"
              />
              <FormInput
                label="Rejected (Off-Spec)"
                type="number"
                min="0"
                required
                value={formData.rejectedQuantity}
                onChange={(e) => setFormData({ ...formData, rejectedQuantity: Number(e.target.value) })}
                suffix="units"
              />
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
              <span>
                Sum Check:{' '}
                <strong>
                  {Number(formData.acceptedQuantity) + Number(formData.rejectedQuantity)} / {formData.inspectedQuantity}
                </strong>
              </span>
              <span className="font-semibold text-emerald-600">
                {formData.inspectedQuantity > 0
                  ? ((formData.acceptedQuantity / formData.inspectedQuantity) * 100).toFixed(1)
                  : 0}
                % Pass Rate
              </span>
            </div>
          </div>

          <FormSelect
            label="Defect Categorization Reason"
            value={formData.defectReason}
            onChange={(e) => setFormData({ ...formData, defectReason: e.target.value })}
            options={[
              'Dyno test torque variance / brake alignment',
              'Minor paint scratch on down-tube (re-powder coated)',
              'Disc brake rotor wobble > 0.2mm on test dyno',
              'LCD display CAN-bus communication error',
              'Spoke tension unevenness',
              'No Defect Found (100% Cleared)'
            ]}
          />

          <FormTextarea
            label="Disposition & Corrective Action Notes"
            rows={2}
            value={formData.disposition}
            onChange={(e) => setFormData({ ...formData, disposition: e.target.value })}
            placeholder="Disposition routing for accepted and off-spec parts..."
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Lead QA Inspector"
              value={formData.inspectorName}
              onChange={(e) => setFormData({ ...formData, inspectorName: e.target.value })}
            />
            <FormInput
              label="Inspection Date"
              type="date"
              value={formData.inspectionDate}
              onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

