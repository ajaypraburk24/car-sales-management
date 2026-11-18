/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Car,
  Users,
  BadgeIndianRupee,
  CreditCard,
  FileText,
  MessageSquare,
  CalendarClock,
  UserCog,
  BarChart3,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { VehiclesView } from './components/VehiclesView.tsx';
import { CustomersView } from './components/CustomersView.tsx';
import { SalesView } from './components/SalesView.tsx';
import { PaymentsView } from './components/PaymentsView.tsx';
import { InvoicesView } from './components/InvoicesView.tsx';
import { EnquiriesView } from './components/EnquiriesView.tsx';
import { TestDrivesView } from './components/TestDrivesView.tsx';
import { EmployeesView } from './components/EmployeesView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { SettingsView } from './components/SettingsView.tsx';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard:read' },
  { id: 'vehicles', label: 'Vehicle Inventory', icon: Car, permission: 'vehicles:read' },
  { id: 'enquiries', label: 'Enquiries & Leads', icon: MessageSquare, permission: 'enquiries:read' },
  { id: 'test_drives', label: 'Test Drives', icon: CalendarClock, permission: 'test_drives:read' },
  { id: 'customers', label: 'Customers', icon: Users, permission: 'customers:read' },
  { id: 'sales', label: 'Sales Orders', icon: BadgeIndianRupee, permission: 'sales:read' },
  { id: 'payments', label: 'Payments', icon: CreditCard, permission: 'payments:read' },
  { id: 'invoices', label: 'Invoices', icon: FileText, permission: 'invoices:read' },
  { id: 'employees', label: 'Employees', icon: UserCog, permission: 'employees:read' },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, permission: 'reports:read' },
  { id: 'settings', label: 'Settings', icon: Settings, permission: 'dashboard:read' },
];

function DealershipShell() {
  const { user, settings, loading, theme, toggleTheme, logout, can } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

  const visibleNav = useMemo(
    () => NAV_ITEMS.filter((item) => can(item.permission)),
    [user]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090B0E] text-slate-500 text-sm">
        Initializing dealership workspace...
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const currentNav = visibleNav.find((n) => n.id === activeTab) || visibleNav[0];
  const dealershipName = settings?.dealershipName || 'Apex Prestige Motors';

  const handleNavigate = (tab: string) => {
    setSelectedInvoiceId(null);
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleOpenInvoice = (invoiceId: number) => {
    setSelectedInvoiceId(invoiceId);
    setActiveTab('invoices');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#0F1218] border-r border-slate-200 dark:border-slate-800/80">
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800/80 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
          <Car className="w-4 h-4" />
        </div>
        <span className="font-display font-semibold text-sm tracking-tight text-slate-900 dark:text-white truncate">
          {dealershipName}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = currentNav?.id === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3 shrink-0">
        <div>
          <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
            {user.fullName}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {user.roleLabel} · {user.email}
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#090B0E] text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex bg-black/60"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="w-64 h-full" onClick={(e) => e.stopPropagation()}>
            {sidebarContent}
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="m-4 p-2 h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4 bg-white dark:bg-[#0F1218] border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-30 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm truncate">
              <span className="text-slate-400 hidden sm:inline">{dealershipName}</span>
              <span className="text-slate-400 hidden sm:inline" aria-hidden="true">/</span>
              <h1 className="font-display font-semibold text-slate-900 dark:text-white truncate">
                {currentNav?.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors whitespace-nowrap"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            {can('sales:write') && (
              <button
                type="button"
                onClick={() => handleNavigate('sales')}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium whitespace-nowrap transition-colors"
              >
                New Sale
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentNav?.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              {currentNav?.id === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
              {currentNav?.id === 'vehicles' && <VehiclesView />}
              {currentNav?.id === 'customers' && <CustomersView />}
              {currentNav?.id === 'sales' && <SalesView onOpenInvoice={handleOpenInvoice} />}
              {currentNav?.id === 'payments' && <PaymentsView />}
              {currentNav?.id === 'invoices' && <InvoicesView initialInvoiceId={selectedInvoiceId} />}
              {currentNav?.id === 'enquiries' && <EnquiriesView />}
              {currentNav?.id === 'test_drives' && <TestDrivesView />}
              {currentNav?.id === 'employees' && <EmployeesView />}
              {currentNav?.id === 'reports' && <ReportsView />}
              {currentNav?.id === 'settings' && <SettingsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DealershipShell />
    </AuthProvider>
  );
}
