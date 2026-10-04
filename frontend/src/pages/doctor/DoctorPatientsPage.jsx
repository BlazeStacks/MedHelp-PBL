import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, Droplet, Mail, Search, ShieldQuestion } from 'lucide-react';
import { PageHeader } from '../../layouts/AppLayout';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select, Textarea, Checkbox } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/Feedback';
import { doctorApi, accessApi } from '../../services/apiEndpoints';
import { toApiError } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDate, initials } from '../../utils/format';
import { ALL_CATEGORIES, CATEGORY_DESCRIPTIONS, CATEGORY_LABELS, } from '../../types';
/**
 * Find a patient and request access.
 *
 * <p>Search returns identifying details only — never medical data. The doctor
 * can express which categories they need, but the request grants nothing: the
 * patient's approval decides the actual permissions.
 */
export default function DoctorPatientsPage() {
    const toast = useToast();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState(null);
    const [reason, setReason] = useState('');
    const [requested, setRequested] = useState(['PRESCRIPTIONS', 'DIAGNOSTIC_REPORTS']);
    const [requesting, setRequesting] = useState(false);
    const search = async (event) => {
        event?.preventDefault();
        if (query.trim().length < 2) {
            toast.warning('Enter at least two characters', 'Search by patient name or email address.');
            return;
        }
        setSearching(true);
        try {
            setResults(await doctorApi.searchPatients(query.trim(), 20));
        }
        catch (error) {
            toast.error('Search failed', toApiError(error).message);
        }
        finally {
            setSearching(false);
        }
    };
    const sendRequest = async () => {
        if (!selected)
            return;
        setRequesting(true);
        try {
            await accessApi.request({
                patientId: selected.patientId,
                reason: reason || undefined,
                requestedCategories: requested,
            });
            toast.success('Access request sent', `${selected.fullName} will see your request and decide what to share.`);
            setSelected(null);
            setReason('');
            navigate('/doctor/requests');
        }
        catch (error) {
            toast.error('Could not send the request', toApiError(error).message);
        }
        finally {
            setRequesting(false);
        }
    };
    const toggleCategory = (category) => setRequested((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);
    return (<>
      <PageHeader title="Find Patients" description="Search for a patient by name or email, then request access. You cannot view any records until they approve."/>

      <Card>
        <CardHeader title="Patient search" icon={<Search className="h-4 w-4"/>}/>
        <CardBody>
          <form onSubmit={search} className="flex flex-wrap gap-3">
            <div className="min-w-64 flex-1">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Patient name or email address"/>
            </div>
            <Button type="submit" loading={searching} icon={<Search className="h-4 w-4"/>}>
              Search
            </Button>
          </form>

          <div className="mt-5">
            {results === null ? (<EmptyState icon={<Search className="h-5 w-5"/>} title="Search for a patient" message="Try searching by name (e.g. Aryan) or email. Demo patients include Aryan Mehta and Priya Nair."/>) : results.length === 0 ? (<EmptyState icon={<AlertCircle className="h-5 w-5"/>} title="No patients found" message={`No patient matched “${query}”. Check the spelling or try their email address.`}/>) : (<ul className="space-y-2">
                {results.map((patient) => (<li key={patient.patientId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                        {initials(patient.fullName)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{patient.fullName}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3"/>
                            {patient.email}
                          </span>
                          {patient.dateOfBirth && (<span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3"/>
                              {formatDate(patient.dateOfBirth)}
                            </span>)}
                          {patient.bloodGroup && (<span className="inline-flex items-center gap-1">
                              <Droplet className="h-3 w-3"/>
                              {patient.bloodGroup}
                            </span>)}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => {
                    setSelected(patient);
                    setReason('');
                    setRequested(['PRESCRIPTIONS', 'DIAGNOSTIC_REPORTS']);
                }} icon={<ShieldQuestion className="h-3.5 w-3.5"/>}>
                      Request access
                    </Button>
                  </li>))}
              </ul>)}
          </div>
        </CardBody>
      </Card>

      {/* Request composition modal */}
      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} size="lg" title="Request access" description={`Ask ${selected?.fullName ?? 'this patient'} to share their records with you.`} footer={<>
            <Button variant="outline" onClick={() => setSelected(null)} disabled={requesting}>
              Cancel
            </Button>
            <Button onClick={sendRequest} loading={requesting} icon={<ShieldQuestion className="h-4 w-4"/>}>
              Send request
            </Button>
          </>}>
        <div className="space-y-5">
          <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4">
            <p className="text-sm font-medium text-brand-900">The patient decides what you receive</p>
            <p className="mt-1 text-sm text-brand-800">
              The categories below are only a suggestion of what you need. The patient may grant
              everything, grant a subset, or deny the request entirely. Nothing is shared until they
              approve.
            </p>
          </div>

          <Field label="Why do you need access?" hint="Shown to the patient to help them decide.">
            <Textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Reviewing recent blood results before your follow-up consultation."/>
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Records you are requesting</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {ALL_CATEGORIES.map((category) => (<Checkbox key={category} checked={requested.includes(category)} onChange={() => toggleCategory(category)} label={CATEGORY_LABELS[category]} description={CATEGORY_DESCRIPTIONS[category]}/>))}
            </div>
          </div>

          <Field label="Preferred duration" hint="The patient chooses the final duration when they approve.">
            <Select disabled>
              <option>Patient decides on approval</option>
            </Select>
          </Field>
        </div>
      </Modal>
    </>);
}
