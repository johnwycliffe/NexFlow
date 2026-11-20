import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  KeyRound,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  CheckCircle,
  Clock,
  Search,
  RefreshCw,
  Plus,
  Mail,
  Lock,
  Copy,
  Check,
  AlertTriangle,
  Building,
  Briefcase,
  ExternalLink,
  UserCheck,
  UserX,
  ChevronRight,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useERP } from '../context/useERP';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { FormInput, FormSelect } from '../components/FormInput';
import { credentialsService, departmentsService, rolesService } from '../services';

const HIERARCHY_ROLES = [
  'Administrator',
  'Production Planner',
  'Store / Inventory Officer',
  'Production Supervisor',
  'Quality Inspector',
  'Management Viewer'
];

const CANONICAL_DEPARTMENTS = [
  'Plant Operations & IT',
  'Supply Chain & Planning',
  'Warehouse & Logistics',
  'Shop Floor Operations',
  'Quality Assurance',
  'Executive Board'
];

export const CredentialManagement = () => {
  const { currentUser, refreshCurrentUser } = useAuth();
  const { isBackendConnected, logAudit } = useERP();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [officers, setOfficers] = useState([]);
  const [stats, setStats] = useState({
    totalOfficers: 0,
    accountsCreated: 0,
    accountsPending: 0,
    activeAccounts: 0,
    inactiveAccounts: 0
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modals state
  const [provisionModalOpen, setProvisionModalOpen] = useState(false);
  const [provisionTargetOfficer, setProvisionTargetOfficer] = useState(null);
  const [provisionForm, setProvisionForm] = useState({
    fullName: '',
    jobTitle: 'Production Planner',
    departmentId: 2,
    roleName: 'Production Planner',
    email: '',
    password: '',
    autoGeneratePassword: true
  });

  const [credentialSuccessModal, setCredentialSuccessModal] = useState(null); // holds { officerName, email, temporaryPassword, role }
  const [copiedKey, setCopiedKey] = useState(false);

  const [emailModalUser, setEmailModalUser] = useState(null);
  const [newEmail, setNewEmail] = useState('');

  const [resetModalUser, setResetModalUser] = useState(null);
  const [customResetPassword, setCustomResetPassword] = useState('');
  const [autoGenReset, setAutoGenReset] = useState(true);

  const [statusModalUser, setStatusModalUser] = useState(null);
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [newRoleName, setNewRoleName] = useState('Production Planner');

  const [actionLoading, setActionLoading] = useState(false);

  // Departments list for dropdown
  const [departments, setDepartments] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, officersData, deptsData] = await Promise.all([
        credentialsService.getStats(),
        credentialsService.getOfficers(),
        departmentsService.getAll()
      ]);

      if (statsData) {
        setStats({
          totalOfficers: statsData.totalOfficers ?? 0,
          accountsCreated: statsData.accountsCreated ?? 0,
          accountsPending: statsData.accountsPending ?? 0,
          activeAccounts: statsData.activeAccounts ?? 0,
          inactiveAccounts: statsData.inactiveAccounts ?? 0
        });
      }

      if (officersData) {
        setOfficers(officersData);
      }

      if (deptsData) {
        setDepartments(deptsData);
      }
    } catch (err) {
      console.warn('[CredentialManagement] Failed to load live credentials, using offline state.', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered list
  const filteredOfficers = useMemo(() => {
    return officers.filter((off) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (off.fullName && off.fullName.toLowerCase().includes(q)) ||
        (off.email && off.email.toLowerCase().includes(q)) ||
        (off.jobTitle && off.jobTitle.toLowerCase().includes(q)) ||
        (off.departmentName && off.departmentName.toLowerCase().includes(q));

      const matchesRole =
        selectedRoleFilter === 'ALL' ||
        (off.roleName && off.roleName.toLowerCase() === selectedRoleFilter.toLowerCase()) ||
        (off.role && off.role.toLowerCase() === selectedRoleFilter.toLowerCase());

      const matchesStatus =
        selectedStatusFilter === 'ALL' || off.status === selectedStatusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [officers, searchQuery, selectedRoleFilter, selectedStatusFilter]);

  // Copy helper
  const handleCopyPassword = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    addToast('Credentials copied to clipboard.', 'success');
    setTimeout(() => setCopiedKey(false), 3000);
  };

  // 1. Provision Credentials Handler
  const handleOpenProvisionNew = () => {
    setProvisionTargetOfficer(null);
    setProvisionForm({
      fullName: '',
      jobTitle: 'Production Planner',
      departmentId: departments[0]?.id || 1,
      roleName: 'Production Planner',
      email: '',
      password: '',
      autoGeneratePassword: true
    });
    setProvisionModalOpen(true);
  };

  const handleOpenProvisionExisting = (officer) => {
    setProvisionTargetOfficer(officer);
    setProvisionForm({
      fullName: officer.fullName,
      jobTitle: officer.jobTitle || 'Staff Officer',
      departmentId: officer.departmentId || 1,
      roleName: officer.roleName || 'Production Planner',
      email: officer.email || '',
      password: '',
      autoGeneratePassword: true
    });
    setProvisionModalOpen(true);
  };

  const handleSaveProvision = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        email: provisionForm.email.trim(),
        role_name: provisionForm.roleName,
        job_title: provisionForm.jobTitle
      };

      if (!provisionForm.autoGeneratePassword && provisionForm.password) {
        payload.password = provisionForm.password.trim();
      }

      if (provisionTargetOfficer) {
        payload.user_id = provisionTargetOfficer.id;
      } else {
        payload.full_name = provisionForm.fullName.trim();
        payload.department_id = Number(provisionForm.departmentId) || 1;
      }

      const res = await credentialsService.provision(payload);

      setProvisionModalOpen(false);
      await loadData();
      await refreshCurrentUser();

      // Show one-time copy modal with plain password
      setCredentialSuccessModal({
        officerName: res.officer?.fullName || provisionForm.fullName,
        email: res.officer?.email || provisionForm.email,
        temporaryPassword: res.temporaryPassword,
        role: res.officer?.roleName || provisionForm.roleName
      });

      addToast('Officer login credentials successfully provisioned.', 'success');
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to provision credentials.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Update Email Handler
  const handleOpenUpdateEmail = (officer) => {
    setEmailModalUser(officer);
    setNewEmail(officer.email || '');
  };

  const handleSaveEmail = async (e) => {
    e.preventDefault();
    if (!emailModalUser) return;
    setActionLoading(true);
    try {
      await credentialsService.updateEmail(emailModalUser.id, newEmail.trim());
      addToast(`Login email for ${emailModalUser.fullName} updated to ${newEmail.trim()}.`, 'success');
      setEmailModalUser(null);
      await loadData();
      await refreshCurrentUser();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to update email address.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Reset Password Handler
  const handleOpenResetPassword = (officer) => {
    setResetModalUser(officer);
    setCustomResetPassword('');
    setAutoGenReset(true);
  };

  const handleSaveResetPassword = async (e) => {
    e.preventDefault();
    if (!resetModalUser) return;
    setActionLoading(true);
    try {
      const password = autoGenReset ? null : customResetPassword.trim();
      const res = await credentialsService.resetPassword(resetModalUser.id, password);

      setResetModalUser(null);
      await loadData();

      setCredentialSuccessModal({
        officerName: resetModalUser.fullName,
        email: resetModalUser.email,
        temporaryPassword: res.temporaryPassword,
        role: resetModalUser.roleName
      });

      addToast(`Password for ${resetModalUser.fullName} successfully reset.`, 'success');
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to reset password.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Toggle Status Handler
  const handleOpenToggleStatus = (officer) => {
    setStatusModalUser(officer);
  };

  const handleConfirmToggleStatus = async () => {
    if (!statusModalUser) return;
    setActionLoading(true);
    const targetStatus = !statusModalUser.isActive;
    try {
      await credentialsService.toggleStatus(statusModalUser.id, targetStatus);
      addToast(
        `Account for ${statusModalUser.fullName} is now ${targetStatus ? 'ACTIVE' : 'DEACTIVATED'}.`,
        'success'
      );
      setStatusModalUser(null);
      await loadData();
      await refreshCurrentUser();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to toggle status.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Update Role Handler
  const handleOpenUpdateRole = (officer) => {
    setRoleModalUser(officer);
    setNewRoleName(officer.roleName || 'Production Planner');
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleModalUser) return;
    setActionLoading(true);
    try {
      await credentialsService.updateRole(roleModalUser.id, newRoleName);
      addToast(`Hierarchy role for ${roleModalUser.fullName} updated to ${newRoleName}.`, 'success');
      setRoleModalUser(null);
      await loadData();
      await refreshCurrentUser();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to update hierarchy role.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Hierarchy Credential Management (IAM)
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Administrator Controlled
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Central Identity & Access Management (IAM) console for Alexander Vance & system administrators to issue, reset, and govern credentials across MySQL 8.0.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={loadData}
            loading={loading}
          >
            Sync MySQL
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenProvisionNew}
          >
            Provision Officer Credentials
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Officers</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900">{stats.totalOfficers}</span>
            <span className="text-xs text-slate-400">staff</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Full plant organization</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Accounts Created</span>
            <KeyRound className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-emerald-600">{stats.accountsCreated}</span>
            <span className="text-xs text-slate-400">credentialed</span>
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block font-medium">Issued login credentials</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Creation</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-amber-600">{stats.accountsPending}</span>
            <span className="text-xs text-slate-400">officers</span>
          </div>
          <span className="text-[11px] text-amber-600 mt-1 block font-medium">HR records awaiting auth</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Accounts</span>
            <CheckCircle className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-blue-600">{stats.activeAccounts}</span>
            <span className="text-xs text-slate-400">live</span>
          </div>
          <span className="text-[11px] text-blue-600 mt-1 block font-medium">Permitted active sessions</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Inactive Accounts</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-rose-600">{stats.inactiveAccounts}</span>
            <span className="text-xs text-slate-400">blocked</span>
          </div>
          <span className="text-[11px] text-rose-600 mt-1 block font-medium">Authentication rejected</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search officer by name, email, or job title..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto">
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Hierarchy Roles</option>
            {HIERARCHY_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Account Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="NOT_CREATED">Not Created</option>
          </select>
        </div>
      </div>

      {/* Officers Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Manufacturing Hierarchy Officer Credentials
            </h2>
            <p className="text-xs text-slate-500">
              Showing {filteredOfficers.length} of {officers.length} registered officers in MySQL
            </p>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Table: users & bull; RBAC Junction: user_roles</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Officer & Job Title</th>
                <th className="py-3 px-4">Hierarchy Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Login Email</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOfficers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No officer credentials matching the search/filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOfficers.map((off) => {
                  const isProtectedAdmin = off.isProtected;

                  return (
                    <tr
                      key={off.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isProtectedAdmin ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {/* Officer & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {(off.fullName || 'U').charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 block leading-tight">
                                {off.fullName}
                              </span>
                              {isProtectedAdmin && (
                                <span
                                  className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200"
                                  title="System Administrator account protected against self-deactivation and demotion"
                                >
                                  Protected
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                              {off.jobTitle || 'Staff Officer'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Hierarchy Role */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Shield className="w-3 h-3 text-blue-500" />
                          {off.roleName || off.role}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{off.departmentName || 'Operations'}</span>
                        </div>
                      </td>

                      {/* Login Email */}
                      <td className="py-3.5 px-4">
                        {off.email ? (
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{off.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">— Not Created</span>
                        )}
                      </td>

                      {/* Account Status */}
                      <td className="py-3.5 px-4">
                        {off.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                        {off.status === 'INACTIVE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Inactive
                          </span>
                        )}
                        {off.status === 'NOT_CREATED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Not Created
                          </span>
                        )}
                      </td>

                      {/* Last Updated */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {off.updatedAt ? new Date(off.updatedAt).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {off.status === 'NOT_CREATED' ? (
                            <Button
                              variant="primary"
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] py-1 px-2.5"
                              icon={KeyRound}
                              onClick={() => handleOpenProvisionExisting(off)}
                            >
                              Issue Credentials
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-600 hover:text-blue-600"
                                icon={Mail}
                                title="Update Official Login Email"
                                onClick={() => handleOpenUpdateEmail(off)}
                              />

                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-600 hover:text-amber-600"
                                icon={Lock}
                                title="Reset Officer Password"
                                onClick={() => handleOpenResetPassword(off)}
                              />

                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-600 hover:text-purple-600"
                                icon={Shield}
                                title="Reassign Hierarchy Role"
                                disabled={isProtectedAdmin}
                                onClick={() => handleOpenUpdateRole(off)}
                              />

                              <Button
                                variant="ghost"
                                size="sm"
                                className={
                                  off.isActive
                                    ? 'text-slate-600 hover:text-rose-600'
                                    : 'text-slate-600 hover:text-emerald-600'
                                }
                                icon={off.isActive ? UserX : UserCheck}
                                title={
                                  isProtectedAdmin
                                    ? 'Protected Administrator session'
                                    : off.isActive
                                    ? 'Deactivate Account'
                                    : 'Activate Account'
                                }
                                disabled={isProtectedAdmin}
                                onClick={() => handleOpenToggleStatus(off)}
                              />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. PROVISION / ISSUE CREDENTIALS MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={provisionModalOpen}
        onClose={() => setProvisionModalOpen(false)}
        title={
          provisionTargetOfficer
            ? `Issue Credentials: ${provisionTargetOfficer.fullName}`
            : 'Provision New Officer Login Credentials'
        }
        subtitle="Generates login credentials, stores bcrypt hash in MySQL, and sets account to Active."
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setProvisionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveProvision} loading={actionLoading}>
              Issue & Activate Credentials
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveProvision} className="space-y-4">
          {!provisionTargetOfficer && (
            <FormInput
              label="Officer Full Name"
              required
              value={provisionForm.fullName}
              onChange={(e) => setProvisionForm({ ...provisionForm, fullName: e.target.value })}
              placeholder="e.g. David O'Connor"
            />
          )}

          <FormInput
            label="Job Title (HR Designation)"
            required
            value={provisionForm.jobTitle}
            onChange={(e) => setProvisionForm({ ...provisionForm, jobTitle: e.target.value })}
            placeholder="e.g. Inventory Officer"
          />

          {!provisionTargetOfficer && (
            <FormSelect
              label="Department"
              value={provisionForm.departmentId}
              onChange={(e) => setProvisionForm({ ...provisionForm, departmentId: e.target.value })}
              options={
                departments.length > 0
                  ? departments.map((d) => ({ value: d.id, label: d.name }))
                  : CANONICAL_DEPARTMENTS
              }
            />
          )}

          <FormSelect
            label="Assigned Hierarchy Role (RBAC)"
            value={provisionForm.roleName}
            onChange={(e) => setProvisionForm({ ...provisionForm, roleName: e.target.value })}
            options={HIERARCHY_ROLES}
          />

          <FormInput
            label="Official Login Email"
            type="email"
            required
            value={provisionForm.email}
            onChange={(e) => setProvisionForm({ ...provisionForm, email: e.target.value })}
            placeholder="officer@nexflow.mfg"
          />

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Initial Password Strategy</label>
              <button
                type="button"
                onClick={() =>
                  setProvisionForm({
                    ...provisionForm,
                    autoGeneratePassword: !provisionForm.autoGeneratePassword
                  })
                }
                className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                {provisionForm.autoGeneratePassword ? 'Specify Manual Password' : 'Auto-Generate Password'}
              </button>
            </div>

            {provisionForm.autoGeneratePassword ? (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>A secure random 12-character alphanumeric password will be generated automatically.</span>
                <span className="font-mono text-emerald-600 font-semibold">Auto-Generated</span>
              </div>
            ) : (
              <FormInput
                label="Custom Temporary Password"
                type="password"
                required
                value={provisionForm.password}
                onChange={(e) => setProvisionForm({ ...provisionForm, password: e.target.value })}
                placeholder="Minimum 6 characters"
              />
            )}
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. ONE-TIME CREDENTIALS ISSUED ALERT MODAL (WITH COPY BUTTON) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(credentialSuccessModal)}
        onClose={() => setCredentialSuccessModal(null)}
        title="Login Credentials Successfully Generated"
        subtitle="Please copy and securely deliver these credentials to the officer."
        maxWidth="max-w-md"
        footer={
          <Button variant="primary" onClick={() => setCredentialSuccessModal(null)}>
            Dismiss & Close
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Credentials Active in MySQL
            </div>

            <div className="space-y-1.5 pt-2 border-t border-emerald-200/60 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-emerald-700 font-sans">Officer:</span>
                <span className="font-semibold text-slate-900">{credentialSuccessModal?.officerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-700 font-sans">Role:</span>
                <span className="font-semibold text-slate-900">{credentialSuccessModal?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-700 font-sans">Username / Email:</span>
                <span className="font-bold text-blue-700">{credentialSuccessModal?.email}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-emerald-300 mt-2">
                <span className="text-slate-600 font-sans font-semibold">Password:</span>
                <span className="font-mono font-bold text-base text-slate-900">
                  {credentialSuccessModal?.temporaryPassword}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full flex items-center justify-center gap-2 border-emerald-300 hover:bg-emerald-50 text-emerald-800"
            icon={copiedKey ? Check : Copy}
            onClick={() =>
              handleCopyPassword(
                `NexFlow ERP Login Credentials\nUsername: ${credentialSuccessModal?.email}\nPassword: ${credentialSuccessModal?.temporaryPassword}\nRole: ${credentialSuccessModal?.role}`
              )
            }
          >
            {copiedKey ? 'Copied to Clipboard!' : 'Copy Login Credentials'}
          </Button>

          <p className="text-[11px] text-slate-500 italic text-center">
            For security, this plain temporary password is not stored and cannot be retrieved again.
          </p>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 3. UPDATE EMAIL MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(emailModalUser)}
        onClose={() => setEmailModalUser(null)}
        title={`Update Login Email: ${emailModalUser?.fullName}`}
        subtitle="Changes the official email address used for JWT session authentication."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEmailModalUser(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEmail} loading={actionLoading}>
              Save New Email
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveEmail} className="space-y-4">
          <div className="text-xs text-slate-600">
            <span className="block text-slate-500 font-medium">Current Email Address:</span>
            <span className="font-mono font-semibold text-slate-800">{emailModalUser?.email || '—'}</span>
          </div>

          <FormInput
            label="New Login Email Address"
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="new.email@nexflow.mfg"
          />

          <p className="text-[11px] text-slate-500">
            The new email address will be required on the officer&apos;s next login attempt.
          </p>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 4. RESET PASSWORD MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(resetModalUser)}
        onClose={() => setResetModalUser(null)}
        title={`Reset Password: ${resetModalUser?.fullName}`}
        subtitle="Issue a new password hash to MySQL. Officer must log in with this new password."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetModalUser(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveResetPassword} loading={actionLoading}>
              Reset Password
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveResetPassword} className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <span className="font-bold block">Security Reset Notice:</span>
            <span>
              This will immediately overwrite the password hash for <strong>{resetModalUser?.email}</strong>.
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Password Option</label>
              <button
                type="button"
                onClick={() => setAutoGenReset(!autoGenReset)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                {autoGenReset ? 'Enter Custom Password' : 'Auto-Generate Password'}
              </button>
            </div>

            {autoGenReset ? (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>Random high-entropy password will be generated and shown after reset.</span>
                <span className="font-mono text-emerald-600 font-semibold">Auto-Generate</span>
              </div>
            ) : (
              <FormInput
                label="Custom New Password"
                type="password"
                required
                value={customResetPassword}
                onChange={(e) => setCustomResetPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            )}
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 5. TOGGLE ACTIVE/INACTIVE MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(statusModalUser)}
        onClose={() => setStatusModalUser(null)}
        title={
          statusModalUser?.isActive
            ? `Deactivate Account: ${statusModalUser?.fullName}`
            : `Activate Account: ${statusModalUser?.fullName}`
        }
        subtitle="Manage authorization state and authentication capability in MySQL."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatusModalUser(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className={
                statusModalUser?.isActive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }
              onClick={handleConfirmToggleStatus}
              loading={actionLoading}
            >
              {statusModalUser?.isActive ? 'Confirm Deactivation' : 'Confirm Activation'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div
            className={`p-3 rounded-lg border text-xs ${
              statusModalUser?.isActive
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <span className="font-bold block mb-1">
              {statusModalUser?.isActive ? 'Deactivation Warning' : 'Account Activation Notice'}
            </span>
            <p>
              {statusModalUser?.isActive
                ? `Deactivating ${statusModalUser?.fullName} (${statusModalUser?.email}) will block any future logins, and any active JWT sessions will be immediately rejected with 401 Unauthorized.`
                : `Activating ${statusModalUser?.fullName} (${statusModalUser?.email}) will restore full access to their assigned hierarchy role.`}
            </p>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 6. REASSIGN HIERARCHY ROLE MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(roleModalUser)}
        onClose={() => setRoleModalUser(null)}
        title={`Reassign Role: ${roleModalUser?.fullName}`}
        subtitle="Updates the officer's hierarchy permissions and operational module boundaries."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRoleModalUser(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveRole} loading={actionLoading}>
              Reassign Role
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveRole} className="space-y-4">
          <div className="text-xs text-slate-600">
            <span className="block text-slate-500 font-medium">Current Hierarchy Role:</span>
            <span className="font-semibold text-slate-800">{roleModalUser?.roleName || '—'}</span>
          </div>

          <FormSelect
            label="Target Hierarchy Role (RBAC)"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            options={HIERARCHY_ROLES}
          />

          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900">
            <span>
              Updating the hierarchy role immediately adjusts backend authorization permissions and frontend navigation scope.
            </span>
          </div>
        </form>
      </Modal>
    </div>
  );
};

