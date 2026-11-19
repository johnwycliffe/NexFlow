import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Factory,
  Shield,
  ArrowRight,
  CheckCircle2,
  Boxes,
  Cpu,
  Layers,
  Activity,
  Sparkles,
  Lock,
  Mail,
  Key,
  CalendarClock,
  ClipboardCheck,
  Users,
  BarChart3,
  Warehouse,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { FormInput, FormSelect } from '../components/FormInput';
import { ROLES_LIST } from '../data/initialData';

export const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentRole, login, rolesList } = useAuth();
  const { addToast } = useToast();

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Administrator');
  const [email, setEmail] = useState('admin@nexflow.mfg');
  const [password, setPassword] = useState('password123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickLogin = (roleName) => {
    login(roleName);
    addToast(`Authenticated as ${roleName}. Welcome to NexFlow ERP!`, 'success');
    navigate('/');
  };

  const handleCredentialsSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      login(selectedRole);
      setIsSubmitting(false);
      setLoginModalOpen(false);
      addToast(`Authenticated as ${selectedRole}. Session initialized.`, 'success');
      navigate('/');
    }, 400);
  };

  const handleRoleSelectionInModal = (rName) => {
    setSelectedRole(rName);
    if (rName === 'Administrator') setEmail('admin@nexflow.mfg');
    else if (rName === 'Production Planner') setEmail('planner@nexflow.mfg');
    else if (rName === 'Store / Inventory Officer') setEmail('stores@nexflow.mfg');
    else if (rName === 'Production Supervisor') setEmail('supervisor@nexflow.mfg');
    else if (rName === 'Quality Inspector') setEmail('qa@nexflow.mfg');
    else if (rName === 'Management Viewer') setEmail('exec@nexflow.mfg');
  };

  const stats = [
    { label: 'Integrated Modules', value: '20 Active', detail: 'End-to-End Precision' },
    { label: 'Schedule Adherence', value: '99.2%', detail: 'Conflict-Free Telemetry' },
    { label: 'MRP Recalculation', value: '< 250ms', detail: 'Deterministic Gross-to-Net' },
    { label: 'Quality Acceptance', value: '99.6%', detail: 'ISO 9001 / IEC 62443' }
  ];

  const pillars = [
    {
      title: 'Engineering & BOM Explosion',
      desc: 'Multi-level bills of materials with revision control, scrap factors, and dynamic unit costing in metric SI units.',
      icon: Layers,
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      title: 'Deterministic MRP Engine',
      desc: 'Gross-to-net demand netting, lead-time offsetting, safety stock buffers, and automatic supplier purchase requisitions.',
      icon: Cpu,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    },
    {
      title: 'Shop Floor & Machine Telemetry',
      desc: 'Conflict-free Gantt time-slot scheduling, machine status monitoring, 3-shift calendar rotations, and operator run-cards.',
      icon: CalendarClock,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    },
    {
      title: 'Quality & Regulatory Compliance',
      desc: 'AQL sampling plans, inline defect disposition, backflushing material consumption, and tamper-resistant audit ledgers.',
      icon: ClipboardCheck,
      color: 'bg-amber-50 text-amber-600 border-amber-200'
    }
  ];

  const erpModulesList = [
    { name: 'Executive Dashboard', path: '/', desc: 'Real-time plant KPIs & telemetry', icon: Factory },
    { name: 'Product Master', path: '/products', desc: 'SKU definitions, revisions, specifications', icon: Boxes },
    { name: 'Bill of Materials', path: '/bom', desc: 'Multi-level assembly trees & recipes', icon: Layers },
    { name: 'Raw Materials', path: '/raw-materials', desc: 'Specifications, safety stock, standard costs', icon: Boxes },
    { name: 'Suppliers Directory', path: '/suppliers', desc: 'Vendor ratings, lead times, PO terms', icon: Warehouse },
    { name: 'Inventory Stock', path: '/inventory', desc: 'Multi-warehouse stock & reorder flags', icon: Warehouse },
    { name: 'Demand Orders', path: '/demand-orders', desc: 'Sales order pipeline & demand priority', icon: Activity },
    { name: 'Production Orders', path: '/production-orders', desc: 'Work order release, status, priority', icon: Activity },
    { name: 'MRP Engine', path: '/mrp', desc: 'Deterministic gross-to-net netting calculation', icon: Cpu },
    { name: 'Work Centers', path: '/work-centers', desc: 'Assembly lines, shop capacities, efficiency', icon: Factory },
    { name: 'Machines Telemetry', path: '/machines', desc: 'Equipment runtime, status, maintenance', icon: Activity },
    { name: 'Shifts & Calendar', path: '/shifts-calendar', desc: '3-shift pattern, operating schedules', icon: CalendarClock },
    { name: 'Production Scheduling', path: '/scheduling', desc: 'Conflict-free Gantt time-slot planning', icon: CalendarClock },
    { name: 'Production Execution', path: '/production-execution', desc: 'Shop-floor run cards, operator logging', icon: Activity },
    { name: 'Quality Inspection', path: '/quality-inspection', desc: 'AQL sampling, defect logging, QA pass', icon: ClipboardCheck },
    { name: 'Material Consumption', path: '/material-consumption', desc: 'Backflushing & lot-tracked scrap entries', icon: Boxes },
    { name: 'Finished Goods Hub', path: '/finished-goods', desc: 'Released product warehouse & shipping', icon: Warehouse },
    { name: 'Reports & Analytics', path: '/reports', desc: 'OEE, plant efficiency, scrap cost analysis', icon: BarChart3 },
    { name: 'System Audit Logs', path: '/audit-logs', desc: 'Immutable compliance trail & transactions', icon: ShieldCheck },
    { name: 'User Management', path: '/user-management', desc: 'RBAC security matrix & access simulation', icon: Users }
  ];

  const handleDirectModuleJump = (path) => {
    login('Administrator');
    navigate(path);
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Faded Background Brand Watermark */}
      <div
        className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/favicon/web-app-manifest-512x512.png"
          alt=""
          className="w-[85vw] max-w-4xl object-contain opacity-[0.06] mix-blend-multiply select-none"
        />
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/favicon/apple-touch-icon.png"
              alt="NexFlow ERP Logo"
              className="h-9 w-auto object-contain rounded-lg"
            />
            <div className="flex flex-col">
              <span className="font-bold text-base text-slate-900 tracking-tight leading-none">
                NexFlow <span className="text-blue-600 font-semibold text-xs tracking-normal">ERP</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                Precision Mfg System • Plant Floor 01
              </span>
            </div>
          </div>

          {/* Center Badges */}
          <div className="hidden md:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Plant Core: Operational
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              SI / Metric Verified
            </span>
          </div>

          {/* Right Action */}
          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                onClick={() => navigate('/')}
              >
                Return to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setLoginModalOpen(true)}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={ArrowRight}
                  onClick={() => handleQuickLogin('Administrator')}
                >
                  Launch ERP
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200/80 bg-gradient-to-b from-white/80 via-slate-50/40 to-slate-100/60 backdrop-blur-2xs z-10">
        {/* Faded Hero Center Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10 opacity-[0.07] select-none">
          <img
            src="/favicon/web-app-manifest-512x512.png"
            alt=""
            className="w-[720px] max-w-[85vw] object-contain mix-blend-multiply"
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Enterprise Production Planning & Shop Floor System</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-none max-w-4xl mx-auto">
            Autonomous Precision <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 bg-clip-text text-transparent">
              Manufacturing Planning & Control
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Engineered for high-precision light electric mobility and industrial manufacturing.
            Deterministic gross-to-net MRP, conflict-free machine scheduling, SI metric inventory
            traceability, and instantaneous role simulation.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              icon={ArrowRight}
              onClick={() => handleQuickLogin('Administrator')}
              className="shadow-sm font-semibold"
            >
              Launch System as Administrator
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setLoginModalOpen(true)}
              icon={Lock}
            >
              Sign In with Credentials
            </Button>
          </div>

          {/* Stats Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-8 max-w-4xl mx-auto">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-slate-200 bg-white/90 p-4 text-left shadow-2xs backdrop-blur"
              >
                <span className="text-xs text-slate-500 font-medium block truncate">{s.label}</span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 block mt-1">
                  {s.value}
                </span>
                <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">
                  {s.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-Based Quick Access Simulator */}
      <section className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-200/60 text-slate-700 text-xs font-semibold">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Role-Based Access Control</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            1-Click Persona Simulator
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Select an operational manufacturing persona to instantly enter NexFlow ERP with authorized module privileges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {rolesList.map((role) => {
            const isSuper = role.name === 'Administrator';
            return (
              <div
                key={role.id}
                className={`rounded-xl border p-5 sm:p-6 bg-white transition-all duration-200 hover:shadow-md flex flex-col justify-between ${isSuper
                  ? 'border-blue-300 ring-1 ring-blue-200 shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-base text-slate-900">{role.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSuper
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                    >
                      {role.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed min-h-[38px]">
                    {role.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Access Scope</span>
                    <span className="font-semibold text-slate-700 font-mono text-[11px]">
                      {role.allowedModules.includes('*') ? 'All 20 Modules' : `${role.allowedModules.length} Modules`}
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <Button
                    variant={isSuper ? 'primary' : 'secondary'}
                    size="sm"
                    className="w-full justify-center"
                    icon={ArrowRight}
                    onClick={() => handleQuickLogin(role.name)}
                  >
                    Sign In as {role.name}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Manufacturing Pillars */}
      <section className="py-12 sm:py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-1.5">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Core Capabilities
            </span>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Four Pillars of Precision Production
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {pillars.map((p) => {
              const IconComp = p.icon;
              return (
                <div
                  key={p.title}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 hover:bg-slate-50 transition-colors space-y-3"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border shadow-2xs ${p.color}`}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">{p.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Direct 20-Module Navigation Directory */}
      <section className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
            <Boxes className="w-3.5 h-3.5 text-blue-600" />
            <span>Complete Manufacturing Suite</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Direct 20-Module Navigation Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Instantly launch directly into any manufacturing subsystem with full interactive capability.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {erpModulesList.map((m) => {
            const ModIcon = m.icon;
            return (
              <button
                key={m.path}
                onClick={() => handleDirectModuleJump(m.path)}
                className="text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-400 hover:shadow-md transition-all group flex items-start gap-3.5 cursor-pointer shadow-2xs"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-600 flex items-center justify-center shrink-0 border border-slate-200/80 group-hover:border-blue-200 transition-colors">
                  <ModIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {m.name}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {m.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-10 px-4 sm:px-6 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Factory className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-white">NexFlow ERP Systems</span>
            <span className="text-slate-600">•</span>
            <span>Precision Manufacturing Production Planning</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 text-[11px]">
            <span>SI / Metric Standard</span>
            <span>•</span>
            <span>FastAPI RESTful Backend</span>
            <span>•</span>
            <span>v1.0.0 Production Enterprise</span>
          </div>
        </div>
      </footer>

      {/* Credentials Sign In Modal */}
      <Modal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        title="Sign In to NexFlow ERP"
        subtitle="Authenticate to your plant floor profile or select a simulated role."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setLoginModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCredentialsSubmit}
              loading={isSubmitting}
            >
              Sign In to ERP
            </Button>
          </>
        }
      >
        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Role Permission Context
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-200 rounded-lg bg-slate-50/50">
              {rolesList.map((r) => {
                const selected = r.name === selectedRole;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleSelectionInModal(r.name)}
                    className={`p-2 rounded-lg text-left text-xs transition-colors border ${selected
                      ? 'bg-blue-600 text-white font-semibold border-blue-600 shadow-2xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                  >
                    <span className="block truncate">{r.name}</span>
                    <span className={`text-[9px] block ${selected ? 'text-blue-200' : 'text-slate-400'}`}>
                      {r.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <FormInput
            label="Corporate Work Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operator@nexflow.mfg"
          />

          <FormInput
            label="Security Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
          />

          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-[11px] text-blue-700 leading-relaxed flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Pre-configured demo session: credentials will authenticate as{' '}
              <strong className="font-semibold text-blue-900">{selectedRole}</strong> with direct access to authorized modules.
            </span>
          </div>
        </form>
      </Modal>
    </div>
  );
};

