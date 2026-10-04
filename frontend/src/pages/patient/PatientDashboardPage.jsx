import { useNavigate } from 'react-router-dom';
import { Activity, Bell, ChevronRight, ClipboardList, FileText, Pill, Plus, ShieldAlert, ShieldCheck, Stethoscope, Upload, } from 'lucide-react';
import { patientApi } from '../../services/apiEndpoints';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../layouts/AppLayout';
import { StatCard } from '../../components/StatCard';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, SkeletonCards, SkeletonList } from '../../components/ui/Feedback';
import { TimelineEntryRow } from '../../components/records/TimelineEntryRow';
import { AuditTrail } from '../../components/AuditTrail';
/** Patient home: record counts, pending consent requests and recent activity. */
export default function PatientDashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data, loading, error, reload } = useAsync(() => patientApi.dashboard(), []);
    if (loading) {
        return (<>
        <PageHeader title={`Welcome back, ${user?.fullName.split(' ')[0]}`}/>
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
    const { recordStats, accessStats, pendingRequests, activeGrants, recentTimeline, recentActivity } = data;
    const pendingCount = pendingRequests.length;
    return (<>
      <PageHeader title={`Welcome back, ${user?.fullName.split(' ')[0]}`} description="Your medical records in one place, with you in control of who can see them." action={<div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/patient/upload')} icon={<Upload className="h-4 w-4"/>}>
              Upload record
            </Button>
            <Button onClick={() => navigate('/patient/timeline')} icon={<Plus className="h-4 w-4"/>}>
              Add record
            </Button>
          </div>}/>

      {/* Consent requests need attention first, so they sit above the metrics. */}
      {pendingCount > 0 && (<Card className="mb-6 border-amber-200 bg-amber-50/60">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <ClipboardList className="h-5 w-5"/>
              </span>
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {pendingCount} access request{pendingCount > 1 ? 's' : ''} waiting for your decision
                </p>
                <p className="mt-0.5 text-sm text-amber-800">
                  {pendingRequests
                .slice(0, 2)
                .map((request) => request.doctorName)
                .join(' and ')}
                  {pendingCount > 2 ? ` and ${pendingCount - 2} more` : ''} want to view your records.
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/patient/doctors')} icon={<ShieldCheck className="h-4 w-4"/>}>
              Review requests
            </Button>
          </div>
        </Card>)}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total records" value={recordStats.totalRecords} icon={<Activity className="h-5 w-5"/>} hint={`${recordStats.documents} document${recordStats.documents === 1 ? '' : 's'} attached`} onClick={() => navigate('/patient/timeline')}/>
        <StatCard label="Active doctor access" value={accessStats.activeGrants} tone="emerald" icon={<Stethoscope className="h-5 w-5"/>} hint="Doctors who can currently view your records" onClick={() => navigate('/patient/doctors')}/>
        <StatCard label="Pending requests" value={accessStats.pendingRequests} tone="amber" icon={<ClipboardList className="h-5 w-5"/>} hint="Awaiting your approval" onClick={() => navigate('/patient/doctors')}/>
        <StatCard label="Unread notifications" value={data.unreadNotifications} tone="sky" icon={<Bell className="h-5 w-5"/>} onClick={() => navigate('/patient/notifications')}/>
      </div>

      {/* Record breakdown */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Consultations" value={recordStats.consultations} icon={<Stethoscope className="h-4 w-4"/>} onClick={() => navigate('/patient/timeline')}/>
        <MiniStat label="Prescriptions" value={recordStats.prescriptions} icon={<Pill className="h-4 w-4"/>} onClick={() => navigate('/patient/prescriptions')}/>
        <MiniStat label="Diagnostic reports" value={recordStats.diagnosticReports} icon={<FileText className="h-4 w-4"/>} onClick={() => navigate('/patient/reports')}/>
        <MiniStat label="Allergies" value={recordStats.allergies} icon={<ShieldAlert className="h-4 w-4"/>} onClick={() => navigate('/patient/allergies')}/>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Recent timeline */}
        <Card className="lg:col-span-2">
          <CardHeader title="Recent records" description="Your latest medical activity" action={<button type="button" onClick={() => navigate('/patient/timeline')} className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800">
                View timeline
                <ChevronRight className="h-3.5 w-3.5"/>
              </button>}/>
          <CardBody>
            {recentTimeline.length === 0 ? (<EmptyState icon={<Activity className="h-5 w-5"/>} title="No records yet" message="Add your first medical record to start building your timeline." action={<Button onClick={() => navigate('/patient/timeline')} icon={<Plus className="h-4 w-4"/>}>
                    Add a record
                  </Button>}/>) : (<div>
                {recentTimeline.map((entry) => (<TimelineEntryRow key={entry.id} entry={entry} onClick={() => navigate('/patient/timeline')}/>))}
              </div>)}
          </CardBody>
        </Card>

        <div className="space-y-6">
          {/* Active access */}
          <Card>
            <CardHeader title="Doctors with access" description="Currently able to view your records" action={<button type="button" onClick={() => navigate('/patient/doctors')} className="text-xs font-medium text-brand-700 hover:text-brand-800">
                  Manage
                </button>}/>
            <CardBody>
              {activeGrants.length === 0 ? (<p className="py-4 text-center text-sm text-slate-500">
                  No doctor currently has access to your records.
                </p>) : (<ul className="space-y-3">
                  {activeGrants.slice(0, 3).map((grant) => (<li key={grant.id} className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                        <Stethoscope className="h-4 w-4"/>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{grant.doctorName}</p>
                        <p className="truncate text-xs text-slate-500">
                          {grant.accessAll ? 'All records' : `${grant.permissions.length} categories`}
                        </p>
                      </div>
                    </li>))}
                </ul>)}
            </CardBody>
          </Card>

          {/* Audit trail */}
          <Card>
            <CardHeader title="Recent activity" description="Who did what with your records" action={<button type="button" onClick={() => navigate('/patient/access-history')} className="text-xs font-medium text-brand-700 hover:text-brand-800">
                  Full history
                </button>}/>
            <CardBody>
              <AuditTrail entries={recentActivity} compact/>
            </CardBody>
          </Card>
        </div>
      </div>
    </>);
}
function MiniStat({ label, value, icon, onClick, }) {
    return (<button type="button" onClick={onClick} className="surface flex items-center justify-between gap-3 p-4 text-left transition hover:border-brand-300 hover:shadow-md">
      <span className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          {icon}
        </span>
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </span>
      <span className="text-lg font-semibold text-slate-900">{value}</span>
    </button>);
}
