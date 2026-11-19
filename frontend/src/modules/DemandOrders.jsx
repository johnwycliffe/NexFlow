import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ShoppingBag, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useERP } from '../context/useERP';
import { useTableFilter } from '../hooks/useTableFilter';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FormInput, FormSelect, FormTextarea } from '../components/FormInput';
import { formatCurrency, formatMetric, formatDate } from '../utils/formatters';

export const DemandOrders = () => {
  const navigate = useNavigate();
  const { demandOrders, addDemandOrder, updateDemandOrder, deleteDemandOrder, convertDemandToProductionOrder, products } = useERP();
  const filterHook = useTableFilter(demandOrders, 'orderNumber', 'asc', 10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [orderToConvert, setOrderToConvert] = useState(null);
  const [customBatchSize, setCustomBatchSize] = useState(100);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const initialFormState = {
    customerName: '',
    customerType: 'Distributor',
    customerEmail: '',
    destination: 'Berlin Hub, Germany',
    productId: products[0]?.id || '',
    productName: products[0]?.name || '',
    quantity: 100,
    uom: 'units',
    requestedDeliveryDate: '2026-12-15',
    priority: 'Normal',
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenAdd = () => {
    setEditingOrder(null);
    setFormData(initialFormState);
    setModalOpen(true);
  };

  const handleOpenEdit = (order) => {
    setEditingOrder(order);
    setFormData(order);
    setModalOpen(true);
  };

  const handleProductSelect = (productId) => {
    const p = products.find((prod) => prod.id === productId);
    setFormData({
      ...formData,
      productId,
      productName: p?.name || ''
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === formData.productId);
    const totalValue = Number((formData.quantity * (prod?.sellingPrice || 1200)).toFixed(2));

    if (editingOrder) {
      updateDemandOrder(editingOrder.id, { ...formData, totalValue });
    } else {
      addDemandOrder({ ...formData, totalValue });
    }
    setModalOpen(false);
  };

  const handleOpenConvert = (order) => {
    setOrderToConvert(order);
    setCustomBatchSize(order.quantity);
    setConvertModalOpen(true);
  };

  const handleExecuteConvert = () => {
    if (orderToConvert) {
      const po = convertDemandToProductionOrder(orderToConvert.id, customBatchSize);
      setConvertModalOpen(false);
      navigate('/production-orders');
    }
  };

  const handleDelete = () => {
    if (orderToDelete) {
      deleteDemandOrder(orderToDelete.id);
      setDeleteConfirmOpen(false);
      setOrderToDelete(null);
    }
  };

  const columns = [
    {
      key: 'orderNumber',
      header: 'Sales Order #',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-blue-600 block">{val}</span>
          <span className="text-[10px] text-slate-400">Date: {formatDate(row.orderDate)}</span>
        </div>
      )
    },
    {
      key: 'customerName',
      header: 'Customer & Market',
      render: (val, row) => (
        <div>
          <span className="font-medium text-slate-900 block">{val}</span>
          <span className="text-[11px] text-slate-500">{row.destination}</span>
        </div>
      )
    },
    {
      key: 'productName',
      header: 'Target Product',
      render: (val) => <span className="text-xs text-slate-800 font-medium">{val}</span>
    },
    {
      key: 'quantity',
      header: 'Order Volume',
      render: (val, row) => (
        <span className="font-bold text-slate-900 text-xs">
          {formatMetric(val, row.uom)}
        </span>
      )
    },
    {
      key: 'totalValue',
      header: 'Contract Value',
      render: (val) => <span className="font-semibold text-slate-900">{formatCurrency(val)}</span>
    },
    {
      key: 'requestedDeliveryDate',
      header: 'Delivery SLA',
      render: (val) => <span className="text-xs text-slate-600">{formatDate(val)}</span>
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (val) => {
        const variant = val === 'Urgent' ? 'danger' : val === 'Normal' ? 'primary' : 'neutral';
        return <Badge variant={variant}>{val}</Badge>;
      }
    },
    {
      key: 'status',
      header: 'Planning Status',
      render: (val, row) => {
        let badgeVariant = 'warning';
        if (val === 'IN_PRODUCTION') badgeVariant = 'primary';
        if (val === 'COMPLETED') badgeVariant = 'success';
        return (
          <div>
            <Badge variant={badgeVariant}>{val.replace('_', ' ')}</Badge>
            {row.linkedProductionOrderId && (
              <span className="block text-[10px] text-blue-600 font-mono mt-0.5">
                Linked: {row.linkedProductionOrderId}
              </span>
            )}
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
          {row.status === 'PENDING_PLANNING' && (
            <Button
              variant="outline"
              size="sm"
              icon={ArrowRight}
              onClick={() => handleOpenConvert(row)}
              title="Convert Demand to Production Order"
              className="text-xs text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              Convert to PO
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={Edit2}
            onClick={() => handleOpenEdit(row)}
            title="Edit Order"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => {
              setOrderToDelete(row);
              setDeleteConfirmOpen(true);
            }}
            title="Delete Order"
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
            Demand & Sales Order Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Customer commitments driving factory MRP calculations and shop-floor production schedules.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
          New Sales Order
        </Button>
      </div>

      <Table
        columns={columns}
        data={demandOrders}
        filterHook={filterHook}
        title="Active Sales Demand Orders"
        subtitle={`${filterHook.filteredData.length} demand orders logged`}
        exportFilename="sales_demand_orders"
        emptyIcon={ShoppingBag}
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingOrder ? `Edit Sales Order: ${editingOrder.orderNumber}` : 'Enter Customer Sales Demand'}
        subtitle="Specify product requirements, batch volume, requested SLA date, and priority."
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingOrder ? 'Update Order' : 'Create Sales Demand'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Customer Account / Organization"
              required
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="e.g. Nordic Velocity Mobility AS"
            />
            <FormSelect
              label="Customer Type"
              value={formData.customerType}
              onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
              options={['Distributor', 'Municipal Fleet', 'Retail Chain', 'Courier Fleet', 'OEM Partner']}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Contact Email"
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              placeholder="procurement@client.com"
            />
            <FormInput
              label="Delivery Destination"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder="e.g. Oslo Depot Bay 4"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormSelect
              label="Target Product"
              required
              value={formData.productId}
              onChange={(e) => handleProductSelect(e.target.value)}
              options={products.map((p) => ({ label: `${p.sku} - ${p.name}`, value: p.id }))}
            />
            <FormInput
              label="Order Volume"
              type="number"
              min="1"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              suffix="units"
            />
            <FormSelect
              label="Priority Level"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              options={['Urgent', 'Normal', 'Low']}
            />
          </div>

          <FormInput
            label="Requested Fulfillment Date"
            type="date"
            required
            value={formData.requestedDeliveryDate}
            onChange={(e) => setFormData({ ...formData, requestedDeliveryDate: e.target.value })}
          />

          <FormTextarea
            label="Commercial Delivery Notes"
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Special packing instructions, palletizing requirements..."
          />
        </form>
      </Modal>

      {/* Convert to Production Order Modal */}
      <Modal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        title="Convert Demand to Production Order"
        subtitle={`Order: ${orderToConvert?.orderNumber} | Customer: ${orderToConvert?.customerName}`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConvertModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleExecuteConvert}>
              Spawn Production Order
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            This will generate a formal factory <strong>Production Order</strong> in Draft status,
            allocating material requirements and enabling shop-floor machine scheduling.
          </p>

          <FormInput
            label="Batch Size Sizing (SI Units)"
            type="number"
            min="1"
            value={customBatchSize}
            onChange={(e) => setCustomBatchSize(Number(e.target.value))}
            suffix="units"
            helpText={`Customer requested ${orderToConvert?.quantity} units.`}
          />
        </div>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Cancel Sales Demand"
        message={`Are you sure you want to cancel order ${orderToDelete?.orderNumber} for ${orderToDelete?.customerName}?`}
      />
    </div>
  );
};

