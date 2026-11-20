import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Plus,
  Edit2,
  Trash2,
  Building,
  Briefcase,
  Lock,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  KeyRound,
  CheckSquare,
  Square
} from 'lucide-react';
import { useERP } from '../context/useERP';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTableFilter } from '../hooks/useTableFilter';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { FormInput, FormSelect } from '../components/FormInput';
import { rolesService, departmentsService, permissionsService } from '../services';

const CANONICAL_DEPARTMENTS = [
  'Plant Operations & IT',
  'Supply Chain & Planning',
  'Warehouse & Logistics',
  'Shop Floor Operations',
  'Quality Assurance',
  'Executive Board'
];

const STANDARD_JOB_TITLES = [
  'Plant Operations Administrator',
  'Production Planner',
  'Inventory Officer',
  'Production Supervisor',
  'Quality Inspector',
  'Executive Manager',
  'Maintenance Engineer',
  'Shop Floor Lead Technician',
  'Logistics Coordinator'
];

export const UserManagement = () => {
  const { users, addUser, updateUser, deleteUser, toggleUserStatus, isBackendConnected } = useERP();
  const { rolesList, currentUser, refreshCurrentUser } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'matrix' | 'departments'

  // Directory state
  const filterHook = useTableFilter(users, 'name', 'asc', 10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

  const initialFormState = {
    name: '',
    email: '',
    jobTitle: 'Production Planner',
    role: 'Production Planner',
    department: 'Supply Chain & Planning',
    password: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // RBAC Matrix state
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [selectedRolePerms, setSelectedRolePerms] = useState(new Set());
  const [matrixSaving, setMatrixSaving] = useState(false);

  // Load live roles & permissions from API
  useEffect(() => {
    const fetchMatrixData = async () => {
      try {
        const [rRes, pRes] = await Promise.all([
          rolesService.getAll(),
          permissionsService.getAll()
        ]);
        if (rRes && rRes.length > 0) {
          setRoles(rRes);
          if (!selectedRoleId) {
            setSelectedRoleId(rRes[0].id);
            const pKeys = (rRes[0].permissions || []).map(p => p.permissionKey || p.permission_key);
            setSelectedRolePerms(new Set(pKeys));
          }
        }
        if (pRes && pRes.length > 0) {
          setPermissions(pRes);
        }
      } catch (err) {
        console.warn('[UserManagement] Live RBAC matrix fetch fallback to local list.', err);
      }
    };
    fetchMatrixData();
  }, [selectedRoleId]);

  const handleSelectRole = (role) => {
    setSelectedRoleId(role.id);
    const pKeys = (role.permissions || []).map(p => p.permissionKey || p.permission_key);
    setSelectedRolePerms(new Set(pKeys));
  };

  const handleTogglePermission = (permKey) => {
    const activeRole = roles.find(r => r.id === selectedRoleId);
    if (activeRole?.isSystemRole && (activeRole?.roleName === 'Administrator' || activeRole?.role_name === 'Administrator')) {
      addToast('Administrator role has immutable superuser bypass access.', 'info');
      return;
    }

    setSelectedRolePerms(prev => {
      const next = new Set(prev);
      if (next.has(permKey)) {
        next.delete(permKey);
      } else {
        next.add(permKey);
      }
      return next;
    });
  };

  const handleSaveMatrix = async () => {
    if (!selectedRoleId) return;
    setMatrixSaving(true);
    try {
      const updated = await rolesService.updatePermissions(selectedRoleId, Array.from(selectedRolePerms));
      // Update local roles state
      setRoles(prev => prev.map(r => r.id === selectedRoleId ? { ...r, permissions: updated.permissions || [] } : r));
      await refreshCurrentUser();
      addToast('Role permissions updated and synchronized successfully.', 'success');
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to update permissions.', 'error');
    } finally {
      setMatrixSaving(false);
    }
  };

  // User CRUD Handlers
  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData(initialFormState);
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.fullName || user.name || '',
      email: user.email || '',
      jobTitle: user.jobTitle || 'Staff Officer',
      role: user.role || 'Production Planner',
      department: user.department || 'Supply Chain & Planning',
      password: ''
    });
    setModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
        await refreshCurrentUser();
      } else {
        await addUser(formData);
        await refreshCurrentUser();
      }
      setModalOpen(false);
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to save user.', 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      await deleteUser(deleteConfirmUser.id);
      setDeleteConfirmUser(null);
      await refreshCurrentUser();
    } catch (err) {
      // Error handled by deleteUser
    }
  };

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, p) => {
    const mod = p.moduleKey || p.module_key || 'general';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  const columns = [
    {
      key: 'name',
      header: 'Officer & Identity',
      render: (val, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
            {(row.fullName || row.name || 'U').charAt(0)}
          </div>
          <div>
            <span className="font-semibold text-slate-900 block leading-tight">
              {row.fullName || row.name}
            </span>
            <span className="text-[11px] text-slate-500 leading-tight">{row.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'jobTitle',
      header: 'Job Title',
      render: (val) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{val || 'Staff Officer'}</span>
        </div>
      )
    },
    {
      key: 'department',
      header: 'Department',
      render: (val) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{val || 'General Operations'}</span>
        </div>
      )
    },
    {
      key: 'role',
      header: 'System Access Role',
      render: (val) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Shield className="w-3 h-3 text-blue-500" />
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
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={Edit2}
            onClick={() => handleOpenEdit(row)}
            title="Edit Officer Profile"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
            onClick={() => setDeleteConfirmUser(row)}
            title="Remove Officer"
          />
        </div>
      )
    }
  ];

  const activeRoleObj = roles.find(r => r.id === selectedRoleId);

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Organizational Hierarchy & Access Control
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Separation of Departments, Job Titles, System Roles, and Granular 20-Module Application Permissions.
          </p>
        </div>

        {activeTab === 'directory' && (
          <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
            Onboard New Officer
          </Button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'directory'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Staff Directory ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'matrix'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          Role & Permission Matrix
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'departments'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          Departments & Designations
        </button>
      </div>

      {/* Tab 1: Staff Directory */}
      {activeTab === 'directory' && (
        <Table
          columns={columns}
          data={users}
          filterHook={filterHook}
          title="Manufacturing Officers & Role Assignments"
          subtitle={`${filterHook.filteredData.length} team members registered`}
          exportFilename="staff_directory"
          emptyIcon={Users}
        />
      )}

      {/* Tab 2: Role & Permission Matrix */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Roles Selector Sidebar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              System Roles ({roles.length || rolesList.length})
            </h3>
            <div className="space-y-1.5">
              {(roles.length > 0 ? roles : rolesList).map((role) => {
                const isSelected = selectedRoleId === role.id;
                const rName = role.roleName || role.name;
                const rDesc = role.description || '';
                return (
                  <button
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-all cursor-pointer flex flex-col gap-0.5 ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{rName}</span>
                      {role.isSystemRole && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-normal">
                          System
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 line-clamp-1 font-normal">
                      {rDesc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Granular Permission Toggles */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    {activeRoleObj?.roleName || activeRoleObj?.name || 'Selected Role'}
                  </h2>
                  {activeRoleObj?.isSystemRole && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">
                      Canonical System Role
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeRoleObj?.description || 'Configure granular access privileges across ERP modules.'}
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                icon={Check}
                onClick={handleSaveMatrix}
                loading={matrixSaving}
              >
                Save Role Permissions
              </Button>
            </div>

            {/* Permission modules grid */}
            <div className="space-y-6">
              {Object.keys(groupedPermissions).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Loading permissions catalog from database...
                </div>
              ) : (
                Object.entries(groupedPermissions).map(([modName, permsList]) => (
                  <div key={modName} className="border border-slate-100 rounded-lg p-4 bg-slate-50/50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-500" />
                      Module: {modName.toUpperCase()}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {permsList.map((p) => {
                        const pKey = p.permissionKey || p.permission_key;
                        const isChecked = selectedRolePerms.has(pKey);
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleTogglePermission(pKey)}
                            className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                              isChecked
                                ? 'bg-blue-50/60 border-blue-200 text-slate-800'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0 text-blue-600">
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300" />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="font-mono text-[11px] font-semibold text-slate-900 block">
                                {pKey}
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                {p.description}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Departments & Designations */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CANONICAL_DEPARTMENTS.map((deptName) => {
            const memberCount = users.filter((u) => (u.department || '').toLowerCase() === deptName.toLowerCase()).length;
            return (
              <div
                key={deptName}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Building className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                    {memberCount} Active Officers
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{deptName}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Organizational business unit responsible for domain workflows and regulatory compliance.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {users
                    .filter((u) => (u.department || '').toLowerCase() === deptName.toLowerCase())
                    .map((m) => (
                      <span
                        key={m.id}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 border border-slate-200 text-slate-600"
                      >
                        {m.fullName || m.name} ({m.jobTitle || 'Staff Officer'})
                      </span>
                    ))}
                  {memberCount === 0 && (
                    <span className="text-[11px] text-slate-400 italic">No assigned personnel</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Provision / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? `Edit Officer: ${editingUser.fullName || editingUser.name}` : 'Onboard New Manufacturing Officer'}
        subtitle="Manage organizational placement, designation, and security privileges."
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveUser}>
              {editingUser ? 'Save Officer Profile' : 'Onboard Officer'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <FormInput
            label="Full Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. David O'Connor"
          />

          <FormInput
            label="Officer Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="name@nexflow.mfg"
          />

          {!editingUser && (
            <FormInput
              label="Initial Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Leave blank for default: NexFlow@123"
            />
          )}

          <FormSelect
            label="Job Title (HR Designation)"
            value={formData.jobTitle}
            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
            options={STANDARD_JOB_TITLES}
          />

          <FormSelect
            label="Organizational Department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            options={CANONICAL_DEPARTMENTS}
          />

          <FormSelect
            label="System Access Role (RBAC)"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={rolesList.map((r) => r.name)}
          />

          <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs">
            <span className="text-blue-900 font-semibold block">Separation of Concerns:</span>
            <span className="text-blue-700 block mt-0.5">
              The officer&apos;s department and job title establish organizational hierarchy, while the system role governs module privileges.
            </span>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmUser)}
        onClose={() => setDeleteConfirmUser(null)}
        title="Confirm Officer Account Removal"
        subtitle="Permanent removal of officer credentials and system access."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirmUser(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleDeleteUser}
            >
              Permanently Remove
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Security Warning</p>
              <p className="mt-0.5">
                You are about to remove <strong>{deleteConfirmUser?.fullName || deleteConfirmUser?.name}</strong> ({deleteConfirmUser?.email}). This action cannot be undone.
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Self-deletion and removal of the last active Administrator are prohibited by system guardrails.
          </p>
        </div>
      </Modal>
    </div>
  );
};
