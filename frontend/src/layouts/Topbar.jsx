import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  User,
  Shield,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Check,
  AlertTriangle,
  Menu,
  Clock,
  Layers,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useERP } from '../context/useERP';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

export const Topbar = ({ onOpenMobileSidebar, onOpenWorkflow }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentRole, currentUser, rolesList, switchRole, logout } = useAuth();
  const { addToast } = useToast();
  const {
    resetDatabase,
    inventory,
    demandOrders,
    calculateMRP,
    isBackendConnected,
    isSyncing,
    syncWithBackend
  } = useERP();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const roleMenuRef = useRef(null);
  const notifRef = useRef(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target)) {
        setRoleMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notifications
  const lowStockItems = inventory.filter((i) => i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK');
  const pendingOrders = demandOrders.filter((d) => d.status === 'PENDING_PLANNING');
  const totalAlerts = lowStockItems.length + pendingOrders.length;

  // Breadcrumbs title resolution
  const pathName = location.pathname.replace('/', '') || 'dashboard';
  const formatBreadcrumb = (slug) => {
    return slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const quickNavLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'Product Master', path: '/products' },
    { name: 'Bill of Materials', path: '/bom' },
    { name: 'Raw Materials', path: '/raw-materials' },
    { name: 'Inventory Stock', path: '/inventory' },
    { name: 'Demand Orders', path: '/demand-orders' },
    { name: 'Production Orders', path: '/production-orders' },
    { name: 'MRP Engine', path: '/mrp' },
    { name: 'Work Centers', path: '/work-centers' },
    { name: 'Machines', path: '/machines' },
    { name: 'Scheduling', path: '/scheduling' },
    { name: 'Execution Run-Cards', path: '/production-execution' },
    { name: 'Quality Inspection', path: '/quality-inspection' },
    { name: 'Material Consumption', path: '/material-consumption' },
    { name: 'Finished Goods Hub', path: '/finished-goods' },
    { name: 'Reports & Analytics', path: '/reports' },
    { name: 'Audit Logs', path: '/audit-logs' },
    { name: 'User Management', path: '/user-management' }
  ];

  const filteredNav = quickNavLinks.filter((n) =>
    n.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    addToast('Logged out of NexFlow ERP session.', 'info');
    navigate('/home');
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
      {/* Left: Mobile hamburger + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <img
            src="/favicon/favicon-96x96.png"
            alt="NexFlow Logo"
            className="w-5 h-5 rounded-md object-contain"
          />
          <span className="font-medium text-slate-400">NexFlow ERP</span>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-800">{formatBreadcrumb(pathName)}</span>
        </div>
      </div>

      {/* Right: Actions, Global Search, Role Selector, Notifications, Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Global Search Bar */}
        <button
          onClick={() => setSearchModalOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-100 hover:bg-slate-200/70 rounded-lg border border-slate-200 transition-colors w-48 sm:w-60"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="truncate">Quick jump to module...</span>
          <kbd className="ml-auto font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-300 text-slate-500">
            /
          </kbd>
        </button>

        {/* E2E Workflow Tour Button */}
        <Button
          variant="secondary"
          size="sm"
          icon={Sparkles}
          onClick={onOpenWorkflow}
          className="hidden sm:inline-flex text-blue-700 border-blue-200 bg-blue-50/50 hover:bg-blue-100/70"
        >
          Workflow Tour
        </Button>

        {/* Live Backend Connection Status Pill */}
        <button
          onClick={() => syncWithBackend(true)}
          title={isBackendConnected ? "Connected to live FastAPI backend API. Click to re-sync." : "Backend API unreachable. Click to retry connection."}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all shadow-2xs ${
            isBackendConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80'
              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {isBackendConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isBackendConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="hidden sm:inline">
            {isSyncing ? 'Syncing...' : isBackendConnected ? 'FastAPI API: Online' : 'API: Offline (Local Mode)'}
          </span>
        </button>

        {/* Role Selector Simulator Dropdown */}
        <div className="relative" ref={roleMenuRef}>
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            title="Switch Active Simulated Role"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="max-w-[120px] sm:max-w-[160px] truncate">{currentRole}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Simulate Access Role
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dynamically filters modules and testing views.
                </p>
              </div>

              <div className="max-h-72 overflow-y-auto py-1">
                {rolesList.map((role) => {
                  const isSelected = role.name === currentRole;
                  return (
                    <button
                      key={role.id}
                      onClick={() => {
                        switchRole(role.name);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 flex items-start gap-3 transition-colors ${
                        isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isSelected ? (
                          <Check className="w-4 h-4 text-blue-600 font-bold" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{role.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {role.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                          {role.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Manufacturing Alerts & Notifications"
          >
            <Bell className="w-4 h-4" />
            {totalAlerts > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Operational Alerts</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">
                  {totalAlerts} Active
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/inventory');
                    }}
                    className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          Low Stock: {item.materialName}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Only {item.available} {item.uom} available in {item.warehouseName}.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/demand-orders');
                    }}
                    className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          Demand Awaiting Production: {order.orderNumber}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {order.customerName} ({order.quantity} {order.uom}).
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {totalAlerts === 0 && (
                  <div className="p-6 text-center text-xs text-slate-500">
                    All inventory balances and production lines operating normally.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Database Reset Button */}
        <button
          onClick={resetDatabase}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Restore Canonical ERP Demo State"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-tight">
              {currentUser?.name}
            </span>
            <span className="text-[10px] text-slate-500 leading-tight">
              {currentUser?.department}
            </span>
          </div>
        </div>

        {/* Log Out Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50/70 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 transition-all cursor-pointer shadow-2xs group ml-1"
          title="Sign out of ERP session and return to home page"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </div>

      {/* Global Search Modal */}
      <Modal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        title="Quick Navigate Module"
        maxWidth="max-w-md"
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to find module (e.g., BOM, MRP, Execution)..."
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
            {filteredNav.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  navigate(link.path);
                  setSearchModalOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors flex items-center justify-between"
              >
                <span>{link.name}</span>
                <span className="text-[10px] text-slate-400">{link.path}</span>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </header>
  );
};

