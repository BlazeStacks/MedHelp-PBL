import { ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../layouts/AppLayout';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { ErrorState, SkeletonList } from '../../components/ui/Feedback';
import { AuditTrail } from '../../components/AuditTrail';
import { useAsync } from '../../hooks/useAsync';
import { auditApi } from '../../services/apiEndpoints';
/**
 * Full audit trail for the patient.
 *
 * <p>Includes blocked access attempts (ACCESS_DENIED_BY_POLICY), so the patient
 * can see when a doctor tried to read a category they were not granted.
 */
export default function PatientAccessHistoryPage() {
    const { data, loading, error, reload } = useAsync(() => auditApi.history(200), []);
    return (<>
      <PageHeader title="Access History" description="A complete record of who viewed, added or attempted to access your medical information."/>

      <Card>
        <CardHeader title="Audit trail" description="Newest first. Blocked attempts are shown in red." icon={<ShieldCheck className="h-4 w-4"/>} action={data && (<span className="text-xs text-slate-500">{data.length} event{data.length === 1 ? '' : 's'}</span>)}/>
        <CardBody>
          {loading ? (<SkeletonList rows={6}/>) : error ? (<ErrorState message={error.message} onRetry={reload}/>) : (<AuditTrail entries={data ?? []}/>)}
        </CardBody>
      </Card>
    </>);
}
