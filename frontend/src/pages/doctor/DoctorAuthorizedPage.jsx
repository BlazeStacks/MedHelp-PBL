import { useNavigate } from 'react-router-dom';
import { Clock, Search, Users } from 'lucide-react';
import { PageHeader } from '../../layouts/AppLayout';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, SkeletonList } from '../../components/ui/Feedback';
import { PermissionChips } from '../../components/consent/AccessGrantCard';
import { useAsync } from '../../hooks/useAsync';
import { accessApi } from '../../services/apiEndpoints';
import { formatDateTime, formatRemaining } from '../../utils/format';
/** Patients who currently have an active grant for this doctor. */
export default function DoctorAuthorizedPage() {
    const navigate = useNavigate();
    const { data, loading, error, reload } = useAsync(() => accessApi.activeGrants(), []);
    const grants = data ?? [];
    return (<>
      <PageHeader title="Authorized Patients" description="Patients who have granted you access. Each card shows exactly which categories you may open."/>

      {loading ? (<SkeletonList rows={4}/>) : error ? (<ErrorState message={error.message} onRetry={reload}/>) : grants.length === 0 ? (<Card>
          <EmptyState icon={<Users className="h-5 w-5"/>} title="No authorized patients" message="When a patient approves one of your access requests, they will appear here with the categories they shared." action={<Button onClick={() => navigate('/doctor/patients')} icon={<Search className="h-4 w-4"/>}>
                Find a patient
              </Button>}/>
        </Card>) : (<div className="grid gap-4 lg:grid-cols-2">
          {grants.map((grant) => (<Card key={grant.id}>
              <CardHeader title={grant.patientName} description={grant.patientEmail} icon={<Users className="h-4 w-4"/>} action={<Button size="sm" onClick={() => navigate(`/doctor/patients/${grant.patientId}`)}>
                    Open records
                  </Button>}/>
              <CardBody className="space-y-3">
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Categories you can access
                  </p>
                  <PermissionChips accessAll={grant.accessAll} permissions={grant.permissions}/>
                </div>

                <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  {grant.expiresAt && (<>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5"/>
                        {grant.expiresInSeconds != null
                        ? `${formatRemaining(grant.expiresInSeconds)} remaining`
                        : 'Expired'}
                      </span>
                      <span>Until {formatDateTime(grant.expiresAt)}</span>
                    </>)}
                </div>
              </CardBody>
            </Card>))}
        </div>)}
    </>);
}
