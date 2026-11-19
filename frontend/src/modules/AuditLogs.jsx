import React, { useState } from 'react';
import { ShieldAlert, Download, Filter, Clock, User, CheckCircle2, FileText } from 'lucide-react';
import { useERP } from '../context/useERP';
import { useTableFilter } from '../hooks/useTableFilter';
import { Table } from '../components/Table';
import { Badge } from '../components/Badge';

export const AuditLogs = () => {
  const { auditLogs } = useERP();
  const filterHook = useTableFilter(auditLogs, 'timestamp', 'desc', 15);

  const columns = [
    {
      key: 'timestamp',
      header: 'Audit Timestamp',
      render: (val) => (
        <span className="font-mono text-xs text-slate-600 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" /> {val}
        </span>
      )
    },
    {
      key: 'userRole',
      header: 'Operator Role',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs block">{val}</span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <User className="w-2.5 h-2.5" /> {row.userId}
          </span>
        </div>
      )
    },
    {
      key: 'module',
      header: 'Target Module',
      render: (val) => (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
          {val}
        </span>
      )
    },
    {
      key: 'actionType',
      header: 'Action Type',
      render: (val) => {
        let variant = 'primary';
        if (val === 'CREATE') variant = 'success';
        if (val === 'DELETE') variant = 'danger';
        if (val === 'STATUS_CHANGE') variant = 'purple';
        return <Badge variant={variant}>{val}</Badge>;
      }
    },
    {
      key: 'changeNotes',
      header: 'Immutable Change Notes',
      render: (val, row) => (
        <div>
          <span className="text-xs text-slate-800 block leading-relaxed">{val}</span>
          {row.targetId && (
            <span className="text-[10px] text-slate-400 font-mono">Entity Ref: {row.targetId}</span>
          )}
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
            System Audit Trail & Compliance Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-resistant ledger tracking all state mutations, role access transitions, and operational records.
          </p>
        </div>
      </div>

      <Table
        columns={columns}
        data={auditLogs}
        filterHook={filterHook}
        title="Immutable Manufacturing Audit Log"
        subtitle={`${filterHook.filteredData.length} compliance events recorded`}
        exportFilename="erp_compliance_audit_log"
        emptyIcon={ShieldAlert}
      />
    </div>
  );
};

