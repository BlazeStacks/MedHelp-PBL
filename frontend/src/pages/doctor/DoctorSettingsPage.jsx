import { useEffect, useState } from 'react';
import { BadgeCheck, Stethoscope } from 'lucide-react';
import { PageHeader } from '../../layouts/AppLayout';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Field, Input, Textarea } from '../../components/ui/Field';
import { ErrorState, PageLoader } from '../../components/ui/Feedback';
import { doctorApi } from '../../services/apiEndpoints';
import { toApiError } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
/** Doctor profile. Anyone can register; verification is reserved for a future step. */
export default function DoctorSettingsPage() {
    const toast = useToast();
    const { user } = useAuth();
    const { data, loading, error, reload } = useAsync(() => doctorApi.me(), []);
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
            await doctorApi.update({
                fullName: form.fullName,
                phone: form.phone,
                specialization: form.specialization,
                hospital: form.hospital,
                registrationNumber: form.registrationNumber,
                yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
                bio: form.bio,
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
      <PageHeader title="Settings" description="Your professional details, shown to patients when you request access."/>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Professional details" icon={<Stethoscope className="h-4 w-4"/>}/>
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <Input value={form.fullName ?? ''} onChange={(e) => set('fullName', e.target.value)}/>
              </Field>
              <Field label="Email" hint="Used to sign in and cannot be changed here.">
                <Input value={form.email ?? ''} disabled/>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone">
                <Input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)}/>
              </Field>
              <Field label="Specialization">
                <Input value={form.specialization ?? ''} onChange={(e) => set('specialization', e.target.value)} placeholder="General Medicine"/>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Hospital / Clinic">
                <Input value={form.hospital ?? ''} onChange={(e) => set('hospital', e.target.value)} placeholder="Sunrise Multispeciality Hospital"/>
              </Field>
              <Field label="Years of experience">
                <Input type="number" value={form.yearsOfExperience ?? ''} onChange={(e) => set('yearsOfExperience', e.target.value)} placeholder="13" min={0} max={70}/>
              </Field>
            </div>

            <Field label="Registration number" hint="Kept for a future admin verification workflow.">
              <Input value={form.registrationNumber ?? ''} onChange={(e) => set('registrationNumber', e.target.value)} placeholder="MCI-2011-45872"/>
            </Field>

            <Field label="Professional bio" hint="Optional. Shown to patients alongside your access requests.">
              <Textarea rows={3} value={form.bio ?? ''} onChange={(e) => set('bio', e.target.value)} placeholder="General physician focusing on preventive care."/>
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
                <dd className="mt-0.5 text-slate-700">Doctor</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Account email</dt>
                <dd className="mt-0.5 break-all text-slate-700">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Verification</dt>
                <dd className="mt-1">
                  {data?.verified ? (<Badge tone="emerald">
                      <BadgeCheck className="h-3.5 w-3.5"/>
                      Verified
                    </Badge>) : (<Badge tone="amber">Not yet verified</Badge>)}
                </dd>
              </div>
            </dl>
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              In this prototype anyone can register as a doctor. An admin verification step can be
              added later without changing the access model, since patients always approve access
              themselves.
            </p>
          </CardBody>
        </Card>
      </div>
    </>);
}
