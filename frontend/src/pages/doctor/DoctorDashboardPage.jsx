import { useNavigate } from 'react-router-dom';
import { ChevronRight, ClipboardList, FileText, Pill, Search, Users } from 'lucide-react';
import { doctorApi } from '../../services/apiEndpoints';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../layouts/AppLayout';
import { StatCard } from '../../components/StatCard';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, SkeletonCards, SkeletonList } from '../../components/ui/Feedback';
import { AccessGrantCard } from '../../components/consent/AccessGrantCard';
import { AuditTrail } from '../../components/AuditTrail';
/** Doctor home: pending requests, authorized patients and recent activity. */
export default function DoctorDashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data, loading, error, reload } = useAsync(() => doctorApi.dashboard(), []);
    if (loading) {
        return (<>
        <PageHeader title={`Welcome, ${user?.fullName}`}/>
        <div className="space-y-6">
          <SkeletonCards />
          <SkeletonList rows={3}/>
        </div>
      </>);
    }
    if (error || !data) {
        return (<>
        <PageHeader title="Dashboard"/>
        <ErrorState message={error?.message ?? 'Could not load your dashboard'} onRetry={reload}/>
      </>);
    }
    return (<>
      <PageHeader title={`Welcome, ${user?.fullName}`} description="Access to patient records is granted by the patient, category by category, for a limited time." action={<Button onClick={() => navigate('/doctor/patients')} icon={<Search className="h-4 w-4"/>}>
            Find a patient
          </Button>}/>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending requests" value={data.pendingRequests} tone="amber" icon={<ClipboardList className="h-5 w-5"/>} hint="Waiting for patient approval" onClick={() => navigate('/doctor/requests')}/>
        <StatCard label="Authorized patients" value={data.authorizedPatients} tone="emerald" icon={<Users className="h-5 w-5"/>} hint="Patients who have granted you access" onClick={() => navigate('/doctor/authorized')}/>
        <StatCard label="Prescriptions written" value={data.prescriptionsWritten} tone="violet" icon={<Pill className="h-5 w-5"/>} hint="Records you have added"/>
        <StatCard label="Unread notifications" value={data.unreadNotifications} tone="sky" icon={<FileText className="h-5 w-5"/>}/>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Authorized patients" description="You can open the records these patients have shared" action={<button type="button" onClick={() => navigate('/doctor/authorized')} className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800">
                View all
                <ChevronRight className="h-3.5 w-3.5"/>
              </button>}/>
          <CardBody>
            {data.activeGrants.length === 0 ? (<EmptyState icon={<Users className="h-5 w-5"/>} title="No authorized patients yet" message="Search for a patient and send an access request. Once they approve it, their records will appear here." action={<Button onClick={() => navigate('/doctor/patients')} icon={<Search className="h-4 w-4"/>}>
                    Find a patient
                  </Button>}/>) : (<div className="space-y-3">
                {data.activeGrants.slice(0, 4).map((grant) => (<AccessGrantCard key={grant.id} grant={grant} perspective="doctor" actions={<Button size="sm" variant="outline" onClick={() => navigate(`/doctor/patients/${grant.patientId}`)}>
                        Open records
                      </Button>}/>))}
              </div>)}
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Awaiting approval" description="Requests you have sent" action={<button type="button" onClick={() => navigate('/doctor/requests')} className="text-xs font-medium text-brand-700 hover:text-brand-800">
                  View all
                </button>}/>
            <CardBody>
              {data.pendingRequestsList.length === 0 ? (<p className="py-4 text-center text-sm text-slate-500">
                  You have no pending requests.
                </p>) : (<ul className="space-y-3">
                  {data.pendingRequestsList.slice(0, 3).map((grant) => (<li key={grant.id} className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                        <ClipboardList className="h-4 w-4"/>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{grant.patientName}</p>
                        <p className="truncate text-xs text-slate-500">Awaiting their decision</p>
                      </div>
                    </li>))}
                </ul>)}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Recent activity" description="Your own audit trail" action={<button type="button" onClick={() => navigate('/doctor/access-history')} className="text-xs font-medium text-brand-700 hover:text-brand-800">
                  Full history
                </button>}/>
            <CardBody>
              <AuditTrail entries={data.recentActivity} compact/>
            </CardBody>
          </Card>
        </div>
      </div>
    </>);
}
