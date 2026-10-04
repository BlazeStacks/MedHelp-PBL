import { ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../layouts/AppLayout';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { ErrorState, SkeletonList } from '../../components/ui/Feedback';
import { AuditTrail } from '../../components/AuditTrail';
import { useAsync } from '../../hooks/useAsync';
import { auditApi } from '../../services/apiEndpoints';
/**
 * The doctor's own audit trail.
 *
 * <p>Includes the requests they sent, the records they viewed and any access the
 * backend blocked because a grant did not cover the category.
 */
export default function DoctorAccessHistoryPage() {
    const { data, loading, error, reload } = useAsync(() => auditApi.history(200), []);
    return (<>
      <PageHeader title="Access History" description="Your own activity: requests sent, records viewed, and any access the system blocked."/>

      <Card>
        <CardHeader title="My activity" description="Newest first. Blocked attempts appear in red." icon={<ShieldCheck className="h-4 w-4"/>} action={data && <span className="text-xs text-slate-500">{data.length} events</span>}/>
        <CardBody>
          {loading ? (<SkeletonList rows={6}/>) : error ? (<ErrorState message={error.message} onRetry={reload}/>) : (<AuditTrail entries={data ?? []}/>)}
        </CardBody>
      </Card>
    </>);
}
