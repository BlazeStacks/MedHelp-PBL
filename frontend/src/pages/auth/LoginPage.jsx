import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HeartPulse, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { toApiError } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
const schema = z.object({
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});
/** Accounts created by the backend demo seeder. */
const DEMO_ACCOUNTS = [
    { label: 'Patient', name: 'Aryan Mehta', email: 'patient@demo.com' },
    { label: 'Doctor', name: 'Dr. Rohan Sharma', email: 'doctor@demo.com' },
    { label: 'Doctor', name: 'Dr. Ananya Iyer', email: 'ananya@demo.com' },
];
const DEMO_PASSWORD = 'Demo@1234';
export default function LoginPage() {
    const { login, isAuthenticated, user } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const { register, handleSubmit, setValue, formState: { errors }, } = useForm({ resolver: zodResolver(schema) });
    if (isAuthenticated && user) {
        return <Navigate to={user.role === 'PATIENT' ? '/patient' : '/doctor'} replace/>;
    }
    const onSubmit = async (values) => {
        setSubmitting(true);
        try {
            const signedIn = await login(values);
            toast.success(`Welcome back, ${signedIn.fullName.split(' ')[0]}`);
            navigate(signedIn.role === 'PATIENT' ? '/patient' : '/doctor', { replace: true });
        }
        catch (error) {
            const apiError = toApiError(error);
            toast.error('Could not sign in', apiError.message);
        }
        finally {
            setSubmitting(false);
        }
    };
    const useDemoAccount = (email) => {
        setValue('email', email, { shouldValidate: true });
        setValue('password', DEMO_PASSWORD, { shouldValidate: true });
    };
    return (<AuthShell title="Sign in to MedHelp" subtitle="Access your medical records, or review the patients who have shared theirs with you.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Email address" error={errors.email?.message} required>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
            <Input type="email" autoComplete="email" placeholder="you@example.com" className="pl-9" error={errors.email?.message} {...register('email')}/>
          </div>
        </Field>

        <Field label="Password" error={errors.password?.message} required>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
            <Input type="password" autoComplete="current-password" placeholder="••••••••" className="pl-9" error={errors.password?.message} {...register('password')}/>
          </div>
        </Field>

        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Sign in
        </Button>
      </form>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-600"/>
          Demo accounts (fake data)
        </p>
        <div className="mt-3 space-y-1.5">
          {DEMO_ACCOUNTS.map((account) => (<button key={account.email} type="button" onClick={() => useDemoAccount(account.email)} className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-brand-300 hover:bg-brand-50/50">
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-slate-800">{account.name}</span>
                <span className="block truncate text-[11px] text-slate-500">{account.email}</span>
              </span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {account.label}
              </span>
            </button>))}
        </div>
        <p className="mt-2.5 text-[11px] text-slate-500">
          Shared password: <span className="font-mono font-medium text-slate-700">{DEMO_PASSWORD}</span>
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-brand-700 hover:text-brand-800">
          Create one
        </Link>
      </p>
    </AuthShell>);
}
/** Shared two-column auth layout. */
export function AuthShell({ title, subtitle, children, }) {
    return (<div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: brand panel, hidden on small screens */}
      <div className="relative hidden flex-col justify-between bg-brand-800 p-10 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <HeartPulse className="h-5 w-5"/>
          </span>
          <span>
            <span className="block text-base font-semibold">MedHelp</span>
            <span className="block text-xs text-brand-100">Secure health records</span>
          </span>
        </div>

        <div className="max-w-md">
          <h1 className="text-3xl font-semibold leading-tight">
            Your medical records, under your control.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-brand-100">
            MedHelp keeps your prescriptions, diagnostic reports, allergies and treatment
            history in one place. You decide which doctors can see which categories of
            records, and exactly how long their access lasts.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-brand-50">
            {[
            'Granular consent — share categories, not everything',
            'Time-boxed access that expires automatically',
            'Revoke a doctor at any moment',
            'Every access attempt recorded in an audit trail',
        ].map((point) => (<li key={point} className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-300"/>
                {point}
              </li>))}
          </ul>
        </div>

        <p className="text-xs text-brand-200">
          Academic prototype using fictional patient data. Not for real clinical use.
        </p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center bg-slate-50 px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <HeartPulse className="h-5 w-5"/>
            </span>
            <span className="text-base font-semibold text-slate-900">MedHelp</span>
          </div>

          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 mb-6 text-sm text-slate-500">{subtitle}</p>

          <div className="surface p-6">{children}</div>
        </div>
      </div>
    </div>);
}
