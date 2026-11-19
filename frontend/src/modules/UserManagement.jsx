import React, { useState } from 'react';
import { Plus, Edit2, Users, Shield, Check, X, KeyRound } from 'lucide-react';
import { useERP } from '../context/useERP';
import { useAuth } from '../context/AuthContext';
import { useTableFilter } from '../hooks/useTableFilter';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { FormInput, FormSelect } from '../components/FormInput';

export const UserManagement = () => {
  const { users, addUser, updateUser, toggleUserStatus } = useERP();
  const { rolesList } = useAuth();
  const filterHook = useTableFilter(users, 'name', 'asc', 10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const initialFormState = {
    name: '',
    email: '',
    role: 'Production Planner',
    department: 'Supply Chain & Planning',
    permissions: 'Standard Module R/W'
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData(initialFormState);
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData(user);
    setModalOpen(true);
  };

  const handleRoleChange = (roleName) => {
    const matched = rolesList.find((r) => r.name === roleName);
    setFormData({
      ...formData,
      role: roleName,
      permissions: matched?.description || 'Custom Role'
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingUser) {
      updateUser(editingUser.id, formData);
    } else {
      addUser(formData);
    }
    setModalOpen(false);
  };

  const columns = [
    {
      key: 'name',
      header: 'Staff Member',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{val}</span>
          <span className="text-[11px] text-slate-500">{row.email}</span>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Assigned Role',
      render: (val) => (
        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {val}
        </span>
      )
    },
    {
      key: 'department',
      header: 'Department',
      render: (val) => <span className="text-xs text-slate-600 font-medium">{val}</span>
    },
    {
      key: 'permissions',
      header: 'Permissions Scope Preview',
      render: (val) => (
        <span className="text-xs text-slate-500 max-w-xs block truncate" title={val}>
          {val}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (val, row) => (
        <button
          onClick={() => toggleUserStatus(row.id)}
          className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
            val === 'ACTIVE'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700'
              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
          }`}
          title="Click to toggle Active / Inactive"
        >
          {val}
        </button>
      )
    },
    {
      key: 'lastActive',
      header: 'Last Active',
      render: (val) => <span className="text-xs text-slate-400">{val}</span>
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
            title="Edit User Role"
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
            User Directory & Access Simulator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Plant operator profiles, security privileges, role assignments, and permission boundaries.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
          Provision User Account
        </Button>
      </div>

      <Table
        columns={columns}
        data={users}
        filterHook={filterHook}
        title="Authorized Manufacturing Staff"
        subtitle={`${filterHook.filteredData.length} team members registered`}
        exportFilename="users_directory"
        emptyIcon={Users}
      />

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? `Edit User: ${editingUser.name}` : 'Provision User Account'}
        subtitle="Configure system role, department grouping, and authorization tier."
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingUser ? 'Save Profile' : 'Create Account'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormInput
            label="Full Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. David O'Connor"
          />

          <FormInput
            label="Email Address"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="name@mfg-nexflow.com"
          />

          <FormSelect
            label="Security Access Role"
            value={formData.role}
            onChange={(e) => handleRoleChange(e.target.value)}
            options={rolesList.map((r) => r.name)}
          />

          <FormSelect
            label="Department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            options={[
              'Plant Operations & IT',
              'Supply Chain & Planning',
              'Warehouse & Logistics',
              'Shop Floor Operations',
              'Quality Assurance',
              'Executive Board'
            ]}
          />

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-500 block font-medium">Role Privileges:</span>
            <span className="text-slate-700 font-semibold mt-0.5 block">{formData.permissions}</span>
          </div>
        </form>
      </Modal>
    </div>
  );
};

