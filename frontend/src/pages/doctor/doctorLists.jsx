import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Pill, Stethoscope, Users } from 'lucide-react';
import { PageHeader } from '../../layouts/AppLayout';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, SkeletonList } from '../../components/ui/Feedback';
import { PermissionChips } from '../../components/consent/AccessGrantCard';
import { useAsync } from '../../hooks/useAsync';
import { accessApi, recordsApi } from '../../services/apiEndpoints';
import { formatDate, formatDateTime, formatRemaining } from '../../utils/format';
import { RECORD_TYPE_LABELS } from '../../types';
/**
 * Shared list for the doctor's record-oriented screens.
 *
 * <p>Records are grouped per authorized patient, because a doctor's access is
 * always scoped to one patient at a time. Each group only contains records the
 * backend actually returned for the categories the patient approved.
 */
function DoctorRecordListPage({ title, description, typeFilter, emptyTitle, emptyMessage, icon, }) {
    const navigate = useNavigate();
    const { data: grants, loading, error, reload } = useAsync(() => accessApi.activeGrants(), []);
    const [recordsByPatient, setRecordsByPatient] = useState({});
    const [loadingRecords, setLoadingRecords] = useState(false);
    const authorized = grants ?? [];
    // Fetch each authorized patient's permitted records once the grant list arrives.
    // Keyed off the grant ids so it re-runs if a grant is added, revoked or expires.
    const grantKey = authorized
        .map((grant) => `${grant.id}:${grant.patientId}`)
        .sort()
        .join('|');
    useEffect(() => {
        if (grantKey === '') {
            setRecordsByPatient({});
            return;
        }
        let cancelled = false;
        setLoadingRecords(true);
        const list = grantKey.split('|').map((entry) => {
            const [id, patientId] = entry.split(':');
            return { id: Number(id), patientId: Number(patientId) };
        });
        void Promise.all(list.map(async ({ patientId }) => {
            try {
                const records = await recordsApi.list({ patientId, type: typeFilter });
                return [patientId, records];
            }
            catch {
                // A grant may have expired between calls; treat it as no records.
                return [patientId, []];
            }
        }))
            .then((entries) => {
            if (!cancelled)
                setRecordsByPatient(Object.fromEntries(entries));
        })
            .finally(() => {
            if (!cancelled)
                setLoadingRecords(false);
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [grantKey, typeFilter]);
    return (<>
      <PageHeader title={title} description={description} action={<Button onClick={() => navigate('/doctor/patients')} icon={<Users className="h-4 w-4"/>}>
            Find a patient
          </Button>}/>

      {loading ? (<SkeletonList rows={3}/>) : error ? (<ErrorState message={error.message} onRetry={reload}/>) : authorized.length === 0 ? (<Card>
          <EmptyState icon={icon} title={emptyTitle} message={emptyMessage} action={<Button onClick={() => navigate('/doctor/patients')} icon={<Users className="h-4 w-4"/>}>
                Find a patient
              </Button>}/>
        </Card>) : (<div className="space-y-6">
          {authorized.map((grant) => {
                const records = recordsByPatient[grant.patientId] ?? [];
                return (<Card key={grant.id}>
                <CardHeader title={grant.patientName} description={grant.expiresAt
                        ? `Access expires ${formatDateTime(grant.expiresAt)}${grant.expiresInSeconds != null ? ` (${formatRemaining(grant.expiresInSeconds)} left)` : ''}`
                        : undefined} icon={<Users className="h-4 w-4"/>} action={<Button size="sm" variant="outline" onClick={() => navigate(`/doctor/patients/${grant.patientId}`)}>
                      Open records
                    </Button>}/>
                <CardBody className="space-y-4">
                  <PermissionChips accessAll={grant.accessAll} permissions={grant.permissions}/>

                  {loadingRecords && records.length === 0 ? (<SkeletonList rows={2}/>) : records.length === 0 ? (<p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                      No {typeFilter ? RECORD_TYPE_LABELS[typeFilter].toLowerCase() : ''} records in the
                      categories you can access.
                    </p>) : (<ul className="divide-y divide-slate-100">
                      {records.map((record) => (<li key={record.id} className="flex items-center justify-between gap-3 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {record.diagnosis ??
                                record.testName ??
                                record.allergen ??
                                record.conditionName ??
                                (record.medicines.length > 0
                                    ? record.medicines.map((medicine) => medicine.name).join(', ')
                                    : record.typeLabel)}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {record.typeLabel} · {formatDate(record.recordDate)}
                              {record.createdByDoctor ? ` · added by ${record.createdByName}` : ''}
                            </p>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/doctor/patients/${grant.patientId}`)}>
                            View
                          </Button>
                        </li>))}
                    </ul>)}
                </CardBody>
              </Card>);
            })}
        </div>)}
    </>);
}
/** All permitted records across authorized patients. */
export function DoctorRecordsPage() {
    return (<DoctorRecordListPage title="Patient Records" description="Records you are permitted to see, grouped by patient. Only approved categories are shown." emptyTitle="No authorized patients" emptyMessage="Once a patient approves your access request, their permitted records will appear here." icon={<FileText className="h-5 w-5"/>}/>);
}
/** Prescriptions only. */
export function DoctorPrescriptionsPage() {
    return (<DoctorRecordListPage title="Prescriptions" description="Prescriptions in the categories you are permitted to see, plus any you have written." typeFilter="PRESCRIPTION" emptyTitle="No prescriptions available" emptyMessage="Prescriptions appear here once a patient grants you access to their prescription records." icon={<Pill className="h-5 w-5"/>}/>);
}
/** Consultations and treatment records. */
export function DoctorTreatmentsPage() {
    return (<DoctorRecordListPage title="Treatment Records" description="Consultations and treatments from patients who have shared that category with you." typeFilter="CONSULTATION" emptyTitle="No treatment records available" emptyMessage="Consultation and treatment history appears here when a patient shares that category." icon={<Stethoscope className="h-5 w-5"/>}/>);
}
