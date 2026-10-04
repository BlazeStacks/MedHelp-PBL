import { useState } from 'react';
import { ClipboardList, Clock, ShieldCheck, ShieldX, Stethoscope, Users } from 'lucide-react';
import { PageHeader } from '../../layouts/AppLayout';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, SkeletonList } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/Modal';
import { AccessGrantCard } from '../../components/consent/AccessGrantCard';
import { ConsentReviewModal } from '../../components/consent/ConsentReviewModal';
import { useAsync } from '../../hooks/useAsync';
import { accessApi } from '../../services/apiEndpoints';
import { toApiError } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDateTime, formatRemaining } from '../../utils/format';
/**
 * Doctors & Access — the patient's consent control centre.
 *
 * <p>Three things happen here, and they are the core of the project:
 * <ol>
 *   <li>Review a pending request and approve it with chosen categories and duration.</li>
 *   <li>See every doctor who currently holds access, and what they can see.</li>
 *   <li>Revoke an approved grant immediately.</li>
 * </ol>
 */
export default function PatientDoctorsPage() {
    const toast = useToast();
    const { data, loading, error, reload } = useAsync(() => accessApi.requests(), []);
    const [reviewing, setReviewing] = useState(null);
    const [busy, setBusy] = useState(false);
    const [revokeTarget, setRevokeTarget] = useState(null);
    const grants = data ?? [];
    const pending = grants.filter((grant) => grant.status === 'PENDING');
    const active = grants.filter((grant) => grant.live);
    const past = grants.filter((grant) => !grant.live && grant.status !== 'PENDING');
    const approve = async (payload) => {
        if (!reviewing)
            return;
        setBusy(true);
        try {
            await accessApi.approve(reviewing.id, payload);
            toast.success('Access approved', `${reviewing.doctorName} can now see the records you selected.`);
            setReviewing(null);
            reload();
        }
        catch (err) {
            toast.error('Could not approve the request', toApiError(err).message);
        }
        finally {
            setBusy(false);
        }
    };
    const deny = async (reason) => {
        if (!reviewing)
            return;
        setBusy(true);
        try {
            await accessApi.deny(reviewing.id, reason || undefined);
            toast.info('Request denied', `${reviewing.doctorName} was not given access.`);
            setReviewing(null);
            reload();
        }
        catch (err) {
            toast.error('Could not deny the request', toApiError(err).message);
        }
        finally {
            setBusy(false);
        }
    };
    const revoke = async () => {
        if (!revokeTarget)
            return;
        setBusy(true);
        try {
            await accessApi.revoke(revokeTarget.id);
            toast.success('Access revoked', `${revokeTarget.doctorName} can no longer view your records.`);
            setRevokeTarget(null);
            reload();
        }
        catch (err) {
            toast.error('Could not revoke access', toApiError(err).message);
        }
        finally {
            setBusy(false);
        }
    };
    return (<>
      <PageHeader title="Doctors & Access" description="You decide which doctors can see which parts of your medical file, and for how long."/>

      {loading ? (<SkeletonList rows={4}/>) : error ? (<ErrorState message={error.message} onRetry={reload}/>) : (<div className="space-y-6">
          {/* Pending requests first — they need a decision. */}
          <Card className={pending.length > 0 ? 'border-amber-200' : undefined}>
            <CardHeader title="Pending access requests" description="Doctors waiting for your decision" icon={<ClipboardList className="h-4 w-4"/>} action={pending.length > 0 ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{pending.length} waiting</span> : undefined}/>
            <CardBody>
              {pending.length === 0 ? (<EmptyState icon={<ClipboardList className="h-5 w-5"/>} title="No pending requests" message="When a doctor asks to view your records, the request will appear here for you to review."/>) : (<div className="space-y-3">
                  {pending.map((grant) => (<AccessGrantCard key={grant.id} grant={grant} perspective="patient" actions={<Button size="sm" onClick={() => setReviewing(grant)}>
                          Review request
                        </Button>}/>))}
                </div>)}
            </CardBody>
          </Card>

          {/* Active grants */}
          <Card>
            <CardHeader title="Doctors with active access" description="You can revoke any of these at any time" icon={<ShieldCheck className="h-4 w-4"/>} action={active.length > 0 ? (<span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                    {active.length} active
                  </span>) : undefined}/>
            <CardBody>
              {active.length === 0 ? (<EmptyState icon={<Stethoscope className="h-5 w-5"/>} title="No doctor currently has access" message="Your records are private until you approve a request from a doctor."/>) : (<div className="space-y-3">
                  {active.map((grant) => (<AccessGrantCard key={grant.id} grant={grant} perspective="patient" actions={<Button size="sm" variant="danger" onClick={() => setRevokeTarget(grant)} icon={<ShieldX className="h-3.5 w-3.5"/>}>
                          Revoke
                        </Button>}/>))}
                </div>)}
            </CardBody>
          </Card>

          {/* History */}
          <Card>
            <CardHeader title="Past requests" description="Denied, revoked and expired access" icon={<Clock className="h-4 w-4"/>}/>
            <CardBody>
              {past.length === 0 ? (<p className="py-6 text-center text-sm text-slate-500">
                  No past requests yet.
                </p>) : (<div className="space-y-3">
                  {past.map((grant) => (<AccessGrantCard key={grant.id} grant={grant} perspective="patient"/>))}
                </div>)}
            </CardBody>
          </Card>

          {/* Summary of what the patient has shared */}
          {active.length > 0 && (<Card className="border-brand-200 bg-brand-50/40">
              <CardBody>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                    <Users className="h-5 w-5"/>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-brand-900">Your current sharing summary</p>
                    <ul className="mt-2 space-y-1 text-sm text-brand-800">
                      {active.map((grant) => (<li key={grant.id}>
                          <span className="font-medium">{grant.doctorName}</span> can view{' '}
                          {grant.accessAll ? 'all of your records' : `${grant.permissions.length} selected categories`}
                          {grant.expiresAt && (<>
                              {' '}until {formatDateTime(grant.expiresAt)}
                              {grant.expiresInSeconds != null && ` (${formatRemaining(grant.expiresInSeconds)} left)`}
                            </>)}
                          .
                        </li>))}
                    </ul>
                  </div>
                </div>
              </CardBody>
            </Card>)}
        </div>)}

      {/* The consent decision modal */}
      <ConsentReviewModal grant={reviewing} open={Boolean(reviewing)} onClose={() => setReviewing(null)} onApprove={approve} onDeny={deny} busy={busy}/>

      <ConfirmDialog open={Boolean(revokeTarget)} onClose={() => setRevokeTarget(null)} onConfirm={revoke} loading={busy} title="Revoke access?" message={`${revokeTarget?.doctorName ?? 'This doctor'} will immediately lose access to your records, even if the approved time has not run out. They can request access again later.`} confirmLabel="Revoke access"/>
    </>);
}
