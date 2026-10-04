import { useEffect, useState } from 'react';
import { UserRound } from 'lucide-react';
import { PageHeader } from '../../layouts/AppLayout';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, Input, Textarea } from '../../components/ui/Field';
import { ErrorState, PageLoader } from '../../components/ui/Feedback';
import { patientApi } from '../../services/apiEndpoints';
import { toApiError } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
/**
 * Patient profile.
 *
 * <p>This information is what a doctor sees when they search for a patient, so
 * it is deliberately limited to identifying and emergency details — the medical
 * substance lives in records, which are governed by consent.
 */
export default function PatientSettingsPage() {
    const toast = useToast();
    const { user } = useAuth();
    const { data, loading, error, reload } = useAsync(() => patientApi.me(), []);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        if (data)
            setForm(data);
    }, [data]);
    const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
    const save = async () => {
        setSaving(true);
        try {
            await patientApi.update({
                fullName: form.fullName,
                phone: form.phone,
                dateOfBirth: form.dateOfBirth || undefined,
                gender: form.gender,
                bloodGroup: form.bloodGroup,
                address: form.address,
                emergencyContact: form.emergencyContact,
                knownConditions: form.knownConditions,
            });
            toast.success('Profile updated');
            reload();
        }
        catch (err) {
            toast.error('Could not save your profile', toApiError(err).message);
        }
        finally {
            setSaving(false);
        }
    };
    if (loading)
        return <PageLoader label="Loading your profile…"/>;
    if (error)
        return <ErrorState message={error.message} onRetry={reload}/>;
    return (<>
      <PageHeader title="Settings" description="Your profile details. Medical information belongs in your records, not here."/>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Personal details" icon={<UserRound className="h-4 w-4"/>}/>
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <Input value={form.fullName ?? ''} onChange={(e) => set('fullName', e.target.value)}/>
              </Field>
              <Field label="Email" hint="Used to sign in and cannot be changed here.">
                <Input value={form.email ?? ''} disabled/>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Phone">
                <Input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)}/>
              </Field>
              <Field label="Date of birth">
                <Input type="date" value={form.dateOfBirth ?? ''} onChange={(e) => set('dateOfBirth', e.target.value)}/>
              </Field>
              <Field label="Gender">
                <Input value={form.gender ?? ''} onChange={(e) => set('gender', e.target.value)} placeholder="Male / Female / Other"/>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Blood group" hint="Format like A+, O-, AB+">
                <Input value={form.bloodGroup ?? ''} onChange={(e) => set('bloodGroup', e.target.value)} placeholder="B+"/>
              </Field>
              <Field label="Emergency contact">
                <Input value={form.emergencyContact ?? ''} onChange={(e) => set('emergencyContact', e.target.value)} placeholder="Meera Mehta (Mother) - 9812345678"/>
              </Field>
            </div>

            <Field label="Address">
              <Textarea value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} rows={2}/>
            </Field>

            <Field label="Known conditions summary" hint="A short note a doctor sees alongside your structured medical history.">
              <Textarea value={form.knownConditions ?? ''} onChange={(e) => set('knownConditions', e.target.value)} rows={2} placeholder="e.g. Seasonal allergic rhinitis"/>
            </Field>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={reload} disabled={saving}>
                Reset
              </Button>
              <Button onClick={save} loading={saving}>
                Save changes
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card className="h-fit">
          <CardHeader title="Account"/>
          <CardBody>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</dt>
                <dd className="mt-0.5 text-slate-700">Patient</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Account email</dt>
                <dd className="mt-0.5 break-all text-slate-700">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Password</dt>
                <dd className="mt-0.5 text-slate-700">
                  Stored as a BCrypt hash. Change-password is out of scope for the prototype.
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>
    </>);
}
