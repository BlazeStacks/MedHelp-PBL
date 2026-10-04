import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Bell, ClipboardList, FileText, HeartPulse, LayoutDashboard, LogOut, Menu, Pill, ScrollText, Search, Settings, Shield, ShieldAlert, Stethoscope, Upload, Users, X, } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';
import { initials } from '../utils/format';
import { NotificationBell } from '../components/NotificationBell';
const PATIENT_NAV = [
    { to: '/patient', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4"/>, end: true },
    { to: '/patient/timeline', label: 'Medical Timeline', icon: <Activity className="h-4 w-4"/> },
    { to: '/patient/history', label: 'Medical History', icon: <ScrollText className="h-4 w-4"/> },
    { to: '/patient/prescriptions', label: 'Prescriptions', icon: <Pill className="h-4 w-4"/> },
    { to: '/patient/reports', label: 'Diagnostic Reports', icon: <FileText className="h-4 w-4"/> },
    { to: '/patient/allergies', label: 'Allergies', icon: <ShieldAlert className="h-4 w-4"/> },
    { to: '/patient/doctors', label: 'Doctors & Access', icon: <Stethoscope className="h-4 w-4"/> },
    { to: '/patient/access-history', label: 'Access History', icon: <Shield className="h-4 w-4"/> },
    { to: '/patient/upload', label: 'Upload Record', icon: <Upload className="h-4 w-4"/> },
    { to: '/patient/notifications', label: 'Notifications', icon: <Bell className="h-4 w-4"/> },
    { to: '/patient/settings', label: 'Settings', icon: <Settings className="h-4 w-4"/> },
];
const DOCTOR_NAV = [
    { to: '/doctor', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4"/>, end: true },
    { to: '/doctor/patients', label: 'Find Patients', icon: <Search className="h-4 w-4"/> },
    { to: '/doctor/requests', label: 'Access Requests', icon: <ClipboardList className="h-4 w-4"/> },
    { to: '/doctor/authorized', label: 'Authorized Patients', icon: <Users className="h-4 w-4"/> },
    { to: '/doctor/records', label: 'Patient Records', icon: <FileText className="h-4 w-4"/> },
    { to: '/doctor/prescriptions', label: 'Prescriptions', icon: <Pill className="h-4 w-4"/> },
    { to: '/doctor/treatments', label: 'Treatment Records', icon: <Stethoscope className="h-4 w-4"/> },
    { to: '/doctor/access-history', label: 'Access History', icon: <Shield className="h-4 w-4"/> },
    { to: '/doctor/settings', label: 'Settings', icon: <Settings className="h-4 w-4"/> },
];
/** Shared application shell: brand header, role-aware sidebar and topbar. */
export function AppLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isPatient = user?.role === 'PATIENT';
    const nav = isPatient ? PATIENT_NAV : DOCTOR_NAV;
    // Close the mobile drawer whenever the route changes.
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);
    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };
    return (<div className="min-h-screen bg-slate-50">
      {/* Mobile backdrop */}
      {sidebarOpen && (<button type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"/>)}

      <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <Link to={isPatient ? '/patient' : '/doctor'} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <HeartPulse className="h-5 w-5"/>
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-900">MedHelp</span>
              <span className="block text-[11px] font-medium text-slate-500">
                {isPatient ? 'Patient Portal' : 'Doctor Portal'}
              </span>
            </span>
          </Link>
          <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden">
            <X className="h-5 w-5"/>
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {nav.map((item) => (<NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition', isActive
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}>
              {item.icon}
              <span className="truncate">{item.label}</span>
            </NavLink>))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              {initials(user?.fullName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{user?.fullName}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <button type="button" onClick={handleLogout} className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700">
            <LogOut className="h-4 w-4"/>
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden">
              <Menu className="h-5 w-5"/>
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {isPatient ? 'My Health Records' : 'Doctor Workspace'}
              </p>
              <p className="hidden truncate text-xs text-slate-500 sm:block">
                {isPatient
            ? 'You control which doctors can see which records, and for how long.'
            : 'Access is limited to what each patient has explicitly approved.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <NotificationBell />
            <span className="hidden h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 sm:flex">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-[10px] font-semibold text-brand-700">
                {initials(user?.fullName)}
              </span>
              <span className="max-w-[10rem] truncate text-xs font-medium text-slate-700">
                {user?.fullName}
              </span>
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>);
}
/** Standard page heading used by every screen. */
export function PageHeader({ title, description, action, }) {
    return (<div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>);
}
