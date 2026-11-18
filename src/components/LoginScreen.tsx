import React, { useState } from 'react';
import { Car, Lock, Mail, ArrowRight, KeyRound, Sun, Moon, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../lib/api.ts';

type AuthMode = 'login' | 'forgot' | 'reset';

const HERO_IMAGE = '/src/assets/images/hero_showroom_vehicle_1794978283269.jpg';

const ROLE_PRESETS = [
  { label: 'Admin', email: 'admin@apexmotors.in', pass: 'Admin@123' },
  { label: 'Manager', email: 'manager@apexmotors.in', pass: 'Manager@123' },
  { label: 'Sales Executive', email: 'sales@apexmotors.in', pass: 'Sales@123' },
];

export function LoginScreen() {
  const { login, settings, theme, toggleTheme } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('admin@apexmotors.in');
  const [password, setPassword] = useState('Admin@123');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [issuedCodeHint, setIssuedCodeHint] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const dealershipName = settings?.dealershipName || 'Apex Prestige Motors';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);
    setSubmitting(true);
    try {
      const res = await apiRequest<{ message: string; verificationCode?: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setStatusMessage(res.message);
      if (res.verificationCode) {
        setIssuedCodeHint(res.verificationCode);
        setResetCode(res.verificationCode);
      }
      setMode('reset');
    } catch (err: any) {
      setError(err.message || 'Unable to process request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);
    setSubmitting(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code: resetCode, newPassword }),
      });
      setStatusMessage(res.message);
      setPassword(newPassword);
      setIssuedCodeHint(null);
      setMode('login');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-slate-50 dark:bg-[#090B0E] text-slate-900 dark:text-slate-100">
      {/* Left Showroom Editorial Panel */}
      <div className="hidden lg:flex lg:col-span-7 relative overflow-hidden bg-slate-950">
        <img
          src={HERO_IMAGE}
          alt="Apex Prestige Motors showroom interior"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/30" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Car className="w-5 h-5" />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight text-white">
              {dealershipName}
            </span>
          </div>

          <div className="max-w-xl">
            <p className="text-xs font-medium tracking-wider text-blue-400 mb-3">
              Dealership Operations Platform
            </p>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-white leading-tight [text-wrap:balance] mb-4">
              Unified vehicle inventory, showroom sales, and financial telemetry.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-lg mb-8">
              Manage luxury vehicle stock, customer enquiries, test drive scheduling, GST-compliant invoicing, EMI settlements, and advisor commissions from a single workspace.
            </p>
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/15">
              <div>
                <div className="font-mono text-2xl font-semibold text-white tabular-nums">14</div>
                <div className="text-xs text-slate-300 mt-1">Relational Modules</div>
              </div>
              <div>
                <div className="font-mono text-2xl font-semibold text-white tabular-nums">3</div>
                <div className="text-xs text-slate-300 mt-1">RBAC Access Tiers</div>
              </div>
              <div>
                <div className="font-mono text-2xl font-semibold text-white tabular-nums">GST</div>
                <div className="text-xs text-slate-300 mt-1">Automated PDF Billing</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Authentication Form */}
      <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-white dark:bg-[#0F1218] border-l border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Car className="w-4 h-4" />
            </div>
            <span className="font-display font-semibold text-base">{dealershipName}</span>
          </div>
          <div className="ml-auto">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
              aria-label="Toggle color theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto my-auto py-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight mb-1.5">
            {mode === 'login' && 'Sign in to Dealership Portal'}
            {mode === 'forgot' && 'Recover Account Access'}
            {mode === 'reset' && 'Set New Password'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {mode === 'login' && 'Select a role preset or enter your dealership credentials.'}
            {mode === 'forgot' && 'Enter your registered staff email to generate a 6-digit recovery code.'}
            {mode === 'reset' && 'Enter the verification code and choose a new password.'}
          </p>

          {mode === 'login' && (
            <div className="mb-6">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                Role Quick-Select
              </div>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                {ROLE_PRESETS.map((preset) => {
                  const active = email === preset.email;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setEmail(preset.email);
                        setPassword(preset.pass);
                        setError(null);
                      }}
                      className={`px-2.5 py-2 rounded-md text-xs font-medium whitespace-nowrap truncate transition-colors ${
                        active
                          ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {statusMessage && (
            <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div>{statusMessage}</div>
                {issuedCodeHint && (
                  <div className="mt-1 font-mono font-semibold">
                    Verification Code: {issuedCodeHint}
                  </div>
                )}
              </div>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@apexmotors.in"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                      setStatusMessage(null);
                    }}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
              >
                <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Registered Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
              >
                <span>{submitting ? 'Generating Code...' : 'Send Verification Code'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="6-digit code"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
              >
                {submitting ? 'Updating Password...' : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              >
                Cancel and Return to Login
              </button>
            </form>
          )}
        </div>

        <div className="text-xs text-slate-400 flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800/70">
          <span>{dealershipName}</span>
          <span>Role-Based Access Control</span>
        </div>
      </div>
    </div>
  );
}
