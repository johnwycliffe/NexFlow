import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Play,
  ArrowRight,
  Sparkles,
  Layers,
  Cpu,
  CalendarCheck,
  CheckSquare,
  PackageCheck,
  ClipboardList,
  Flame,
  Archive,
  RefreshCw
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useERP } from '../context/useERP';
import { useToast } from '../context/ToastContext';

export const WorkflowWalkthroughModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    products,
    rawMaterials,
    boms,
    inventory,
    demandOrders,
    productionOrders,
    addDemandOrder,
    convertDemandToProductionOrder,
    calculateMRP,
    simulateAutoRequisition,
    addSchedule,
    updateExecutionProgress,
    logQualityInspection,
    logMaterialConsumption,
    updateProductionOrderStatus,
    auditLogs
  } = useERP();
  const { addToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [activeWorkflowDemand, setActiveWorkflowDemand] = useState(null);
  const [activeWorkflowPO, setActiveWorkflowPO] = useState(null);

  const steps = [
    {
      num: 1,
      title: 'Demand Order Creation',
      icon: ClipboardList,
      route: '/demand-orders',
      desc: 'Create or select a customer sales demand order for 100 units of EcoRide Urban Commuter 250W.',
      run: () => {
        // Find existing SO-2026-001 or create a new benchmark order
        let order = demandOrders.find((d) => d.customerName.includes('Nordic Velocity'));
        if (!order) {
          order = addDemandOrder({
            customerName: 'Nordic Velocity Mobility AS',
            customerType: 'Distributor',
            customerEmail: 'procurement@nordicvelocity.no',
            destination: 'Oslo Hub, Norway',
            productId: 'PRD-001',
            productName: 'EcoRide Urban Commuter 250W',
            quantity: 100,
            uom: 'units',
            requestedDeliveryDate: '2026-11-28',
            priority: 'Urgent',
            totalValue: 129900.0,
            notes: 'E2E Benchmark Sales Order for 100 units'
          });
        }
        setActiveWorkflowDemand(order);
        addToast(`Step 1 Complete: Sales Demand Order ${order.orderNumber} active.`);
        setCurrentStep(2);
      }
    },
    {
      num: 2,
      title: 'BOM Component Resolution',
      icon: Layers,
      route: '/bom',
      desc: 'Resolve the multi-level Bill of Materials for EcoRide Commuter (13 items, 3.5% scrap allowance, $642.50 unit cost).',
      run: () => {
        const bom = boms.find((b) => b.productId === 'PRD-001');
        addToast(`Step 2 Complete: Resolved BOM ${bom?.bomCode} with 13 component specifications.`);
        setCurrentStep(3);
      }
    },
    {
      num: 3,
      title: 'MRP Gross-to-Net Evaluation',
      icon: Cpu,
      route: '/mrp',
      desc: 'Execute Gross-to-Net MRP calculation against on-hand inventory to identify shortages and simulate auto-requisition.',
      run: () => {
        const results = calculateMRP();
        const shortages = results.filter((r) => r.status === 'CRITICAL_SHORTAGE');
        if (shortages.length > 0) {
          // Replenish the shortage for smooth execution
          simulateAutoRequisition(shortages[0].materialId, shortages[0].shortageQuantity + 50);
          addToast(`Step 3 Complete: MRP detected shortage in ${shortages[0].materialName} and auto-replenished via simulated PO.`);
        } else {
          addToast('Step 3 Complete: MRP evaluated active demand against inventory.');
        }
        setCurrentStep(4);
      }
    },
    {
      num: 4,
      title: 'Convert to Production Order',
      icon: PackageCheck,
      route: '/production-orders',
      desc: 'Transform the sales demand order into an active Production Order with batch size 100 units.',
      run: () => {
        let po = productionOrders.find((p) => p.demandOrderId === activeWorkflowDemand?.id);
        if (!po) {
          po = convertDemandToProductionOrder(activeWorkflowDemand ? activeWorkflowDemand.id : 'SO-2026-001', 100);
        }
        setActiveWorkflowPO(po);
        addToast(`Step 4 Complete: Production Order ${po.orderNumber} created in Draft/Released state.`);
        setCurrentStep(5);
      }
    },
    {
      num: 5,
      title: 'Work Center & Machine Scheduling',
      icon: CalendarCheck,
      route: '/scheduling',
      desc: 'Assign Work Center (WC-04 Final Assembly) and Machine (Assembly Line Rig A) with zero schedule conflicts.',
      run: () => {
        const po = activeWorkflowPO || productionOrders[0];
        const res = addSchedule({
          productionOrderId: po.id,
          orderNumber: po.orderNumber,
          workCenterId: 'WC-04',
          workCenterName: 'Final Mechanical Assembly Line',
          machineId: 'MC-05',
          machineName: 'Assembly Line Rig A',
          shiftId: 'SH-01',
          shiftName: 'Morning Shift',
          scheduleDate: new Date().toISOString().split('T')[0],
          startHour: 10,
          endHour: 16,
          plannedUnits: 100
        });

        // Advance PO to Released / In-Progress
        updateProductionOrderStatus(po.id, 'Released');
        addToast('Step 5 Complete: Scheduled slot on Line 1 with zero conflict.');
        setCurrentStep(6);
      }
    },
    {
      num: 6,
      title: 'Shop Floor Execution',
      icon: Play,
      route: '/production-execution',
      desc: 'Launch floor execution run-card, process batch through assembly operations, and log progress to 100%.',
      run: () => {
        const po = activeWorkflowPO || productionOrders[0];
        updateProductionOrderStatus(po.id, 'In-Progress');
        // Simulate execution completion
        updateExecutionProgress('RUN-101', 60, 0, '100% floor operations complete and verified.');
        updateProductionOrderStatus(po.id, 'Inspection');
        addToast(`Step 6 Complete: Production Order ${po.orderNumber} executed to 100% progress.`);
        setCurrentStep(7);
      }
    },
    {
      num: 7,
      title: 'Strict Quality Inspection',
      icon: CheckSquare,
      route: '/quality-inspection',
      desc: 'Conduct QA Dyno bench inspection enforcing: Inspected (100) = Accepted (96) + Rejected (4).',
      run: () => {
        const po = activeWorkflowPO || productionOrders[0];
        const res = logQualityInspection({
          productionOrderId: po.id,
          orderNumber: po.orderNumber,
          productName: po.productName,
          inspectedQuantity: 100,
          acceptedQuantity: 96,
          rejectedQuantity: 4,
          defectReason: 'Slight cable tension deviation (4 units tuned)',
          inspectionDate: new Date().toISOString().split('T')[0],
          disposition: '96 units accepted to WH-03. 4 units adjusted on rework bench.'
        });
        if (res.success) {
          addToast('Step 7 Complete: Strict formula validated (100 = 96 + 4). 96 units accepted.');
          setCurrentStep(8);
        }
      }
    },
    {
      num: 8,
      title: 'Material Consumption Posting',
      icon: Flame,
      route: '/material-consumption',
      desc: 'Post backflush material consumption against available stock, strictly blocking any over-consumption.',
      run: () => {
        const po = activeWorkflowPO || productionOrders[0];
        const res = logMaterialConsumption({
          productionOrderId: po.id,
          orderNumber: po.orderNumber,
          materialId: 'MAT-101',
          warehouseId: 'WH-01',
          plannedQuantity: 100 * 6.2, // 620 kg
          actualQuantity: 620.0,
          type: 'BACKFLUSH'
        });
        if (res.success) {
          addToast('Step 8 Complete: 620 kg Aluminum Tubing consumption posted to inventory.');
          setCurrentStep(9);
        }
      }
    },
    {
      num: 9,
      title: 'Finished Goods Receipt',
      icon: Archive,
      route: '/finished-goods',
      desc: 'Record 96 accepted units into WH-03 Finished Goods Logistics Center with unique Quality Certificate.',
      run: () => {
        addToast('Step 9 Complete: 96 Finished E-Bikes safely stored in Warehouse WH-03.');
        setCurrentStep(10);
      }
    },
    {
      num: 10,
      title: 'Completion & Immutable Audit Trail',
      icon: CheckCircle2,
      route: '/audit-logs',
      desc: 'Mark production order Completed, close customer sales order, and verify immutable audit trail logs.',
      run: () => {
        const po = activeWorkflowPO || productionOrders[0];
        updateProductionOrderStatus(po.id, 'Completed');
        addToast('Step 10 Complete: Order lifecycle 100% finished. Full audit trail recorded!');
      }
    }
  ];

  const currentStepData = steps[currentStep - 1];

  const handleNavigateToModule = (route) => {
    onClose();
    navigate(route);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manufacturing End-to-End Operational Workflow"
      subtitle="Complete lifecycle execution from Customer Demand to Finished Goods & Audit Log"
      maxWidth="max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Step {currentStep} of 10</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Play}
              onClick={currentStepData.run}
            >
              Execute Step {currentStep}
            </Button>
            {currentStep < 10 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep((s) => Math.min(10, s + 1))}
              >
                Next Step
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Step Progress Pills */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {steps.map((s) => {
            const isDone = s.num < currentStep;
            const isCurrent = s.num === currentStep;

            return (
              <button
                key={s.num}
                onClick={() => setCurrentStep(s.num)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-semibold transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
                title={s.title}
              >
                <span>{s.num}</span>
              </button>
            );
          })}
        </div>

        {/* Active Step Card */}
        <div className="p-5 rounded-xl border border-blue-100 bg-blue-50/40">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
              {React.createElement(currentStepData.icon, { className: 'w-6 h-6' })}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Step {currentStepData.num}: {currentStepData.title}
                </span>
                <button
                  onClick={() => handleNavigateToModule(currentStepData.route)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                >
                  View Screen <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-700 leading-relaxed font-medium">
                {currentStepData.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Live Operational Context Information */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-slate-500 block font-medium">Target Product</span>
            <span className="font-semibold text-slate-800 mt-1 block">EcoRide Commuter (PRD-001)</span>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-slate-500 block font-medium">Planned Batch Sizing</span>
            <span className="font-semibold text-slate-800 mt-1 block">100 SI Metric Units</span>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-slate-500 block font-medium">Target Destination</span>
            <span className="font-semibold text-slate-800 mt-1 block">WH-03 Logistics Center</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

