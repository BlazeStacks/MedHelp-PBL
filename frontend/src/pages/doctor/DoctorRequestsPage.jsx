import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ClipboardList, Clock, Search, XCircle } from 'lucide-react';
import { PageHeader } from '../../layouts/AppLayout';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, SkeletonList } from '../../components/ui/Feedback';
import { AccessGrantCard } from '../../components/consent/AccessGrantCard';
import { useAsync } from '../../hooks/useAsync';
import { accessApi } from '../../services/apiEndpoints';
/**
 * The doctor's view of their own requests.
 *
 * <p>Requests are read-only here: only the patient can approve, deny or revoke,
 * which is the whole point of patient-controlled access.
 */
export default function DoctorRequestsPage() {
    const navigate = useNavigate();
    const { data, loading, error, reload } = useAsync(() => accessApi.requests(), []);
    const requests = data ?? [];
    const pending = requests.filter((request) => request.status === 'PENDING');
    const approved = requests.filter((request) => request.status === 'APPROVED' || request.status === 'EXPIRED' || request.status === 'REVOKED');
    const denied = requests.filter((request) => request.status === 'DENIED');
    return (<>
      <PageHeader title="Access Requests" description="Requests you have sent to patients. Only the patient can approve, deny or revoke them." action={<Button onClick={() => navigate('/doctor/patients')} icon={<Search className="h-4 w-4"/>}>
            New request
          </Button>}/>

      {loading ? (<SkeletonList rows={4}/>) : error ? (<ErrorState message={error.message} onRetry={reload}/>) : (<div className="space-y-6">
          <Card className={pending.length > 0 ? 'border-amber-200' : undefined}>
            <CardHeader title="Awaiting patient decision" icon={<Clock className="h-4 w-4"/>} action={pending.length > 0 ? (<span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    {pending.length} pending
                  </span>) : undefined}/>
            <CardBody>
              {pending.length === 0 ? (<EmptyState icon={<ClipboardList className="h-5 w-5"/>} title="No pending requests" message="Send an access request from the Find Patients screen." action={<Button onClick={() => navigate('/doctor/patients')} icon={<Search className="h-4 w-4"/>}>
                      Find a patient
                    </Button>}/>) : (<div className="space-y-3">
                  {pending.map((request) => (<AccessGrantCard key={request.id} grant={request} perspective="doctor"/>))}
                </div>)}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Previously approved" description="Access you have held" icon={<CheckCircle2 className="h-4 w-4"/>}/>
            <CardBody>
              {approved.length === 0 ? (<p className="py-6 text-center text-sm text-slate-500">
                  No approved requests yet.
                </p>) : (<div className="space-y-3">
                  {approved.map((request) => (<AccessGrantCard key={request.id} grant={request} perspective="doctor" actions={request.live ? (<Button size="sm" variant="outline" onClick={() => navigate(`/doctor/patients/${request.patientId}`)}>
                            Open records
                          </Button>) : undefined}/>))}
                </div>)}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Denied" description="Patients who declined access" icon={<XCircle className="h-4 w-4"/>}/>
            <CardBody>
              {denied.length === 0 ? (<p className="py-6 text-center text-sm text-slate-500">No denied requests.</p>) : (<div className="space-y-3">
                  {denied.map((request) => (<AccessGrantCard key={request.id} grant={request} perspective="doctor"/>))}
                </div>)}
            </CardBody>
          </Card>
        </div>)}
    </>);
}
