import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Stethoscope, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { toApiError } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import { cn } from '../../utils/cn';
import { AuthShell } from './LoginPage';
const schema = z.object({
    fullName: z.string().min(2, 'Please enter your full name').max(150),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100),
    phone: z
        .string()
        .regex(/^[0-9+\-\s()]{0,20}$/, 'Enter a valid phone number')
        .optional()
        .or(z.literal('')),
    specialization: z.string().max(150).optional().or(z.literal('')),
    hospital: z.string().max(255).optional().or(z.literal('')),
    registrationNumber: z.string().max(100).optional().or(z.literal('')),
});
export default function RegisterPage() {
    const { register: registerUser, isAuthenticated, user } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [role, setRole] = useState('PATIENT');
    const [submitting, setSubmitting] = useState(false);
    const { register, handleSubmit, formState: { errors }, } = useForm({ resolver: zodResolver(schema) });
    if (isAuthenticated && user) {
        return <Navigate to={user.role === 'PATIENT' ? '/patient' : '/doctor'} replace/>;
    }
    const onSubmit = async (values) => {
        setSubmitting(true);
        try {
            const created = await registerUser({
                fullName: values.fullName,
                email: values.email,
                password: values.password,
                phone: values.phone || undefined,
                role,
                specialization: role === 'DOCTOR' ? values.specialization || undefined : undefined,
                hospital: role === 'DOCTOR' ? values.hospital || undefined : undefined,
                registrationNumber: role === 'DOCTOR' ? values.registrationNumber || undefined : undefined,
            });
            toast.success('Account created', `Welcome to MedHelp, ${created.fullName.split(' ')[0]}.`);
            navigate(created.role === 'PATIENT' ? '/patient' : '/doctor', { replace: true });
        }
        catch (error) {
            const apiError = toApiError(error);
            toast.error('Could not create your account', apiError.message);
        }
        finally {
            setSubmitting(false);
        }
    };
    return (<AuthShell title="Create your MedHelp account" subtitle="Patients store and share their records. Doctors request access to the patients who approve them.">
      {/* Role picker drives which extra fields appear. */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <RoleOption active={role === 'PATIENT'} onClick={() => setRole('PATIENT')} icon={<UserRound className="h-5 w-5"/>} title="Patient" description="Own and share your records"/>
        <RoleOption active={role === 'DOCTOR'} onClick={() => setRole('DOCTOR')} icon={<Stethoscope className="h-5 w-5"/>} title="Doctor" description="Request access to patients"/>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Full name" error={errors.fullName?.message} required>
          <Input placeholder={role === 'DOCTOR' ? 'Dr. Rohan Sharma' : 'Aryan Mehta'} error={errors.fullName?.message} {...register('fullName')}/>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email address" error={errors.email?.message} required>
            <Input type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')}/>
          </Field>
          <Field label="Phone" error={errors.phone?.message} hint="Optional">
            <Input placeholder="9876543210" error={errors.phone?.message} {...register('phone')}/>
          </Field>
        </div>

        <Field label="Password" error={errors.password?.message} hint="At least 8 characters. Stored as a BCrypt hash, never in plain text." required>
          <Input type="password" autoComplete="new-password" placeholder="••••••••" error={errors.password?.message} {...register('password')}/>
        </Field>

        {role === 'DOCTOR' && (<div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold text-slate-600">Professional details</p>
            <Field label="Specialization" error={errors.specialization?.message}>
              <Input placeholder="General Medicine" error={errors.specialization?.message} {...register('specialization')}/>
            </Field>
            <Field label="Hospital / Clinic" error={errors.hospital?.message}>
              <Input placeholder="Sunrise Multispeciality Hospital" error={errors.hospital?.message} {...register('hospital')}/>
            </Field>
            <Field label="Registration number" error={errors.registrationNumber?.message} hint="Stored for a future admin verification step.">
              <Input placeholder="MCI-2011-45872" error={errors.registrationNumber?.message} {...register('registrationNumber')}/>
            </Field>
          </div>)}

        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered?{' '}
        <Link to="/login" className="font-medium text-brand-700 hover:text-brand-800">
          Sign in
        </Link>
      </p>
    </AuthShell>);
}
function RoleOption({ active, onClick, icon, title, description, }) {
    return (<button type="button" onClick={onClick} className={cn('flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition', active ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500' : 'border-slate-200 bg-white hover:border-slate-300')}>
      <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500')}>
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold text-slate-800">{title}</span>
        <span className="block text-xs text-slate-500">{description}</span>
      </span>
    </button>);
}
