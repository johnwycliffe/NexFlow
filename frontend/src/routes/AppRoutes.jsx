import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../layouts/AppLayout';
import { Button } from '../components/Button';
import { Home } from '../pages/Home';

// Import all 20 modules
import { Dashboard } from '../modules/Dashboard';
import { ProductMaster } from '../modules/ProductMaster';
import { BillOfMaterials } from '../modules/BillOfMaterials';
import { RawMaterials } from '../modules/RawMaterials';
import { Suppliers } from '../modules/Suppliers';
import { Inventory } from '../modules/Inventory';
import { DemandOrders } from '../modules/DemandOrders';
import { ProductionOrders } from '../modules/ProductionOrders';
import { MRP } from '../modules/MRP';
import { WorkCenters } from '../modules/WorkCenters';
import { Machines } from '../modules/Machines';
import { ShiftsCalendar } from '../modules/ShiftsCalendar';
import { ProductionScheduling } from '../modules/ProductionScheduling';
import { ProductionExecution } from '../modules/ProductionExecution';
import { QualityInspection } from '../modules/QualityInspection';
import { MaterialConsumption } from '../modules/MaterialConsumption';
import { FinishedGoods } from '../modules/FinishedGoods';
import { Reports } from '../modules/Reports';
import { AuditLogs } from '../modules/AuditLogs';
import { UserManagement } from '../modules/UserManagement';
import { CredentialManagement } from '../modules/CredentialManagement';

// Strict Administrator Only Guard (Zero Access for other roles)
const StrictAdminGuard = ({ children }) => {
  const { currentRole, switchRole } = useAuth();
  const isAdmin = currentRole === 'Administrator';

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 bg-white rounded-2xl border border-slate-200 shadow-sm mt-8">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7 text-rose-600" />
        </div>
        <h2 className="text-base font-bold text-slate-900">403 Forbidden — Access Restricted</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong>Hierarchy Credential Management</strong> is exclusively restricted to the System Administrator. Your active role (<strong>{currentRole}</strong>) lacks permission to access or manage officer security credentials.
        </p>
        <div className="pt-2">
          <Button variant="primary" size="sm" onClick={() => switchRole('Administrator')}>
            Switch to Administrator (Alexander Vance)
          </Button>
        </div>
      </div>
    );
  }

  return children;
};

// Role Guard Component with Administrator Non-Blocking Preview
const RoleGuard = ({ moduleKey, children }) => {
  const { hasPermission, currentRole, switchRole } = useAuth();

  if (!hasPermission(moduleKey)) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-amber-900">
                Simulated Role Constraint ({currentRole})
              </p>
              <p className="text-amber-700 text-[11px] mt-0.5">
                This module is outside <strong>{currentRole}</strong>'s assigned scope. Rendering in Administrator bypass preview mode.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => switchRole('Administrator')}
              className="text-xs"
            >
              Switch to Administrator (Full Access)
            </Button>
          </div>
        </div>

        {children}
      </div>
    );
  }

  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Home / Landing Page after logout */}
      <Route path="/home" element={<Home />} />

      {/* ERP Module Routes - Fully accessible with live AppLayout across all 20 modules */}
      <Route element={<AppLayout />}>
        {/* Module 1: Dashboard */}
        <Route index element={<RoleGuard moduleKey="dashboard"><Dashboard /></RoleGuard>} />

        {/* Module 2: Product Master */}
        <Route path="products" element={<RoleGuard moduleKey="products"><ProductMaster /></RoleGuard>} />

        {/* Module 3: Bill of Materials */}
        <Route path="bom" element={<RoleGuard moduleKey="bom"><BillOfMaterials /></RoleGuard>} />

        {/* Module 4: Raw Materials */}
        <Route path="raw-materials" element={<RoleGuard moduleKey="raw-materials"><RawMaterials /></RoleGuard>} />

        {/* Module 5: Suppliers */}
        <Route path="suppliers" element={<RoleGuard moduleKey="suppliers"><Suppliers /></RoleGuard>} />

        {/* Module 6: Inventory */}
        <Route path="inventory" element={<RoleGuard moduleKey="inventory"><Inventory /></RoleGuard>} />

        {/* Module 7: Demand Orders */}
        <Route path="demand-orders" element={<RoleGuard moduleKey="demand-orders"><DemandOrders /></RoleGuard>} />

        {/* Module 8: Production Orders */}
        <Route path="production-orders" element={<RoleGuard moduleKey="production-orders"><ProductionOrders /></RoleGuard>} />

        {/* Module 9: MRP Engine */}
        <Route path="mrp" element={<RoleGuard moduleKey="mrp"><MRP /></RoleGuard>} />

        {/* Module 10: Work Centers */}
        <Route path="work-centers" element={<RoleGuard moduleKey="work-centers"><WorkCenters /></RoleGuard>} />

        {/* Module 11: Machines */}
        <Route path="machines" element={<RoleGuard moduleKey="machines"><Machines /></RoleGuard>} />

        {/* Module 12: Shifts & Calendar */}
        <Route path="shifts-calendar" element={<RoleGuard moduleKey="shifts-calendar"><ShiftsCalendar /></RoleGuard>} />

        {/* Module 13: Scheduling */}
        <Route path="scheduling" element={<RoleGuard moduleKey="scheduling"><ProductionScheduling /></RoleGuard>} />

        {/* Module 14: Execution */}
        <Route path="production-execution" element={<RoleGuard moduleKey="production-execution"><ProductionExecution /></RoleGuard>} />

        {/* Module 15: Quality Inspection */}
        <Route path="quality-inspection" element={<RoleGuard moduleKey="quality-inspection"><QualityInspection /></RoleGuard>} />

        {/* Module 16: Material Consumption */}
        <Route path="material-consumption" element={<RoleGuard moduleKey="material-consumption"><MaterialConsumption /></RoleGuard>} />

        {/* Module 17: Finished Goods */}
        <Route path="finished-goods" element={<RoleGuard moduleKey="finished-goods"><FinishedGoods /></RoleGuard>} />

        {/* Module 18: Reports */}
        <Route path="reports" element={<RoleGuard moduleKey="reports"><Reports /></RoleGuard>} />

        {/* Module 19: Audit Logs */}
        <Route path="audit-logs" element={<RoleGuard moduleKey="audit-logs"><AuditLogs /></RoleGuard>} />

        {/* Module 20: User Management */}
        <Route path="user-management" element={<RoleGuard moduleKey="user-management"><UserManagement /></RoleGuard>} />

        {/* Dedicated Administrator IAM: Hierarchy Credential Management */}
        <Route path="credential-management" element={<StrictAdminGuard><CredentialManagement /></StrictAdminGuard>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

