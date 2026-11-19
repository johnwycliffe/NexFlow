import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Box,
  Layers,
  Component,
  Truck,
  Warehouse,
  ShoppingBag,
  FileSpreadsheet,
  Cpu,
  Factory,
  Cog,
  CalendarDays,
  CalendarClock,
  PlayCircle,
  ClipboardCheck,
  Flame,
  Archive,
  BarChart3,
  ShieldAlert,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useERP } from '../context/useERP';
import { useToast } from '../context/ToastContext';

export const Sidebar = ({ isCollapsed, toggleCollapse, onOpenWorkflow }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { hasPermission, currentRole, currentRoleConfig, logout } = useAuth();
  const { demandOrders, productionOrders, inventory, calculateMRP } = useERP();

  const handleLogout = () => {
    logout();
    addToast('Logged out of NexFlow ERP session.', 'info');
    navigate('/home');
  };

  // Calculate dynamic notification counts
  const pendingOrdersCount = demandOrders.filter((d) => d.status === 'PENDING_PLANNING').length;
  const activePOCount = productionOrders.filter((p) => p.status === 'In-Progress').length;
  const lowStockCount = inventory.filter((i) => i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK').length;

  const navigationGroups = [
    {
      title: 'Overview',
      items: [
        { key: 'dashboard', name: 'Dashboard', path: '/', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Engineering & BOM',
      items: [
        { key: 'products', name: 'Product Master', path: '/products', icon: Box },
        { key: 'bom', name: 'Bill of Materials', path: '/bom', icon: Layers }
      ]
    },
    {
      title: 'Supply & Inventory',
      items: [
        { key: 'raw-materials', name: 'Raw Materials', path: '/raw-materials', icon: Component },
        { key: 'suppliers', name: 'Suppliers', path: '/suppliers', icon: Truck },
        {
          key: 'inventory',
          name: 'Inventory Stock',
          path: '/inventory',
          icon: Warehouse,
          badge: lowStockCount > 0 ? lowStockCount : null,
          badgeColor: 'bg-amber-500'
        }
      ]
    },
    {
      title: 'Planning & Demand',
      items: [
        {
          key: 'demand-orders',
          name: 'Demand Orders',
          path: '/demand-orders',
          icon: ShoppingBag,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
          badgeColor: 'bg-blue-500'
        },
        {
          key: 'production-orders',
          name: 'Production Orders',
          path: '/production-orders',
          icon: FileSpreadsheet,
          badge: activePOCount > 0 ? activePOCount : null,
          badgeColor: 'bg-emerald-500'
        },
        { key: 'mrp', name: 'MRP Engine', path: '/mrp', icon: Cpu }
      ]
    },
    {
      title: 'Shop Floor & Execution',
      items: [
        { key: 'work-centers', name: 'Work Centers', path: '/work-centers', icon: Factory },
        { key: 'machines', name: 'Machines', path: '/machines', icon: Cog },
        { key: 'shifts-calendar', name: 'Shifts & Calendar', path: '/shifts-calendar', icon: CalendarDays },
        { key: 'scheduling', name: 'Scheduling', path: '/scheduling', icon: CalendarClock },
        { key: 'production-execution', name: 'Production Execution', path: '/production-execution', icon: PlayCircle }
      ]
    },
    {
      title: 'Quality & Goods',
      items: [
        { key: 'quality-inspection', name: 'Quality Inspection', path: '/quality-inspection', icon: ClipboardCheck },
        { key: 'material-consumption', name: 'Material Consumption', path: '/material-consumption', icon: Flame },
        { key: 'finished-goods', name: 'Finished Goods', path: '/finished-goods', icon: Archive }
      ]
    },
    {
      title: 'Analytics & Admin',
      items: [
        { key: 'reports', name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
        { key: 'audit-logs', name: 'Audit Logs', path: '/audit-logs', icon: ShieldAlert },
        { key: 'user-management', name: 'User Management', path: '/user-management', icon: Users }
      ]
    }
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-30 flex flex-col bg-navy-950 text-slate-300 transition-all duration-300 border-r border-navy-800 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-navy-800/80 bg-navy-900/60">
        <div className="flex items-center gap-3 overflow-hidden">
          <img
            src="/favicon/apple-touch-icon.png"
            alt="NexFlow ERP Logo"
            className="w-9 h-9 rounded-xl object-contain bg-white/10 p-0.5 border border-white/10 shadow-md shrink-0"
          />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base text-white tracking-tight leading-none">
                NexFlow <span className="text-blue-400 font-semibold text-xs tracking-normal">ERP</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">
                Precision Mfg System
              </span>
            </div>
          )}
        </div>

        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors hidden lg:block"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Indicator Banner */}
      {!isCollapsed && (
        <div className="px-4 py-2.5 bg-navy-900/40 border-b border-navy-800/60 flex items-center justify-between text-xs">
          <div className="truncate">
            <span className="text-slate-400 text-[10px] block uppercase font-semibold">Active Role</span>
            <span className="text-blue-300 font-medium truncate block">{currentRole}</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-900/60 text-blue-300 font-medium border border-blue-700/50">
            {currentRoleConfig?.badge || 'Access'}
          </span>
        </div>
      )}

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigationGroups.map((group) => {
          // Filter items based on active role permissions
          const permittedItems = group.items.filter((item) => hasPermission(item.key));
          if (permittedItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                  {group.title}
                </p>
              )}

              <div className="space-y-0.5">
                {permittedItems.map((item) => (
                  <NavLink
                    key={item.key}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-sm'
                          : 'text-slate-300 hover:bg-navy-800/70 hover:text-white'
                      }`
                    }
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                    {!isCollapsed && (
                      <span className="flex-1 truncate">{item.name}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-bold text-white rounded-full ${item.badgeColor || 'bg-blue-500'}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* E2E Workflow Walkthrough Action Pill & Logout */}
      <div className="p-3 border-t border-navy-800/80 bg-navy-900/50">
        <button
          onClick={onOpenWorkflow}
          className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md transition-all ${
            isCollapsed ? 'px-2' : ''
          }`}
          title="Open End-to-End Workflow Tour"
        >
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          {!isCollapsed && <span>E2E Workflow Tour</span>}
        </button>

        <button
          onClick={handleLogout}
          className={`w-full mt-2 flex items-center justify-center gap-2 p-2 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/40 text-xs font-medium transition-all ${
            isCollapsed ? 'px-2' : ''
          }`}
          title="Sign out of ERP session and return to home page"
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-400 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

