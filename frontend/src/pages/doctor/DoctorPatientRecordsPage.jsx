import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Lock, Plus, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../layouts/AppLayout';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ErrorState, PageLoader } from '../../components/ui/Feedback';
import { PermissionPanel } from '../../components/consent/PermissionPanel';
import { RecordCollection } from '../../components/records/RecordCollection';
import { RecordFormModal } from '../../components/records/RecordFormModal';
import { useAsync } from '../../hooks/useAsync';
import { useRecords, useRecordMutations } from '../../hooks/useRecords';
import { accessApi } from '../../services/apiEndpoints';
import { useToast } from '../../context/ToastContext';
/**
 * A single patient's records, as seen by a doctor.
 *
 * <p>Two independent things are fetched: the effective permission set (for the
 * explanatory panel) and the record list, which the backend has already filtered
 * to the permitted categories. If a doctor tries to open a record outside the
 * grant — by editing the URL, for instance — the backend refuses and the attempt
 * is written to the audit log.
 */
export default function DoctorPatientRecordsPage() {
    const { patientId: patientIdParam } = useParams();
    const patientId = Number(patientIdParam);
    const toast = useToast();
    const navigate = useNavigate();
    const access = useAsync(() => accessApi.effective(patientId), [patientId]);
    const { records, loading, error, reload } = useRecords({ patientId });
    const mutations = useRecordMutations(reload);
    const [formOpen, setFormOpen] = useState(false);
    const fileInputRef = useRef(null);
    const uploadTarget = useRef(null);
    if (access.loading)
        return <PageLoader label="Checking your access…"/>;
    if (access.error || !access.data) {
        return (<>
        <PageHeader title="Patient Records"/>
        <ErrorState message={access.error?.message ?? 'Could not load this patient'} onRetry={access.reload}/>
      </>);
    }
    const effective = access.data;
    const patientName = effective.patientName;
    const triggerUpload = (record) => {
        uploadTarget.current = record.id;
        fileInputRef.current?.click();
    };
    const onFileSelected = async (event) => {
        const file = event.target.files?.[0];
        const recordId = uploadTarget.current;
        event.target.value = '';
        if (!file || !recordId)
            return;
        await mutations.uploadDocument(recordId, file);
    };
    return (<>
      <PageHeader title={patientName} description="Only the record categories this patient approved are shown below." action={<div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)} icon={<ArrowLeft className="h-4 w-4"/>}>
              Back
            </Button>
            {effective.hasAccess && (<Button onClick={() => setFormOpen(true)} icon={<Plus className="h-4 w-4"/>}>
                Add consultation / prescription
              </Button>)}
          </div>}/>

      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={onFileSelected}/>

      <div className="mb-6">
        <PermissionPanel access={effective}/>
      </div>

      {!effective.hasAccess ? (<Card>
          <CardBody>
            <div className="flex flex-col items-center py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                <Lock className="h-5 w-5"/>
              </span>
              <h3 className="mt-4 text-sm font-semibold text-slate-800">
                This patient has not granted you access
              </h3>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Medical records are only visible with an active, patient-approved grant. You can send
                an access request, but the patient must approve it before anything becomes visible.
              </p>
              <Button className="mt-5" onClick={() => navigate('/doctor/patients')} icon={<ShieldCheck className="h-4 w-4"/>}>
                Request access
              </Button>
            </div>
          </CardBody>
        </Card>) : (<>
          <Card className="mb-4 border-sky-200 bg-sky-50/60">
            <CardBody>
              <p className="text-sm text-sky-900">
                <span className="font-medium">Note:</span> you can add new consultations and
                prescriptions, but you cannot edit or delete historical records. Past entries stay
                exactly as they were recorded.
              </p>
            </CardBody>
          </Card>

          <RecordCollection records={records} loading={loading} error={error} onRetry={reload} readOnly onAdd={() => setFormOpen(true)} addLabel="Add record" onAddDocument={triggerUpload} emptyTitle="No records in the categories you can access" emptyMessage="This patient has not added records in the categories you were granted, or has not approved those categories." emptyIcon={<FileText className="h-5 w-5"/>}/>
        </>)}

      {/* Doctor-created record: patientId is sent so the backend can verify consent. */}
      <RecordFormModal open={formOpen} onClose={() => setFormOpen(false)} patientName={patientName} isDoctor busy={mutations.busy} defaultType="CONSULTATION" onSubmit={async (payload) => {
            const created = await mutations.create({ ...payload, patientId }, 'Record added to the patient file');
            if (created) {
                setFormOpen(false);
                toast.info('The patient has been notified', 'They will see this record in their timeline.');
            }
        }}/>

    </>);
}
