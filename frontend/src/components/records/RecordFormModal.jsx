import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Field';
import { RECORD_TYPE_LABELS } from '../../types';
import { todayIso } from '../../utils/date';
const TYPE_ORDER = [
    'CONSULTATION',
    'PRESCRIPTION',
    'DIAGNOSTIC_REPORT',
    'ALLERGY',
    'MEDICAL_HISTORY',
];
function emptyForm(type = 'CONSULTATION') {
    return {
        type,
        recordDate: todayIso(),
        notes: '',
        symptoms: '',
        diagnosis: '',
        treatment: '',
        facility: '',
        doctorName: '',
        testName: '',
        resultSummary: '',
        allergen: '',
        reaction: '',
        severity: 'MILD',
        conditionName: '',
        currentStatus: '',
        conditionYear: '',
        medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    };
}
/**
 * Structured record form.
 *
 * <p>Medical information is captured as discrete fields rather than one free-text
 * blob, with a flexible Notes field on every type. The visible fields change with
 * the selected record type, and the backend re-validates the same rules.
 */
export function RecordFormModal({ open, onClose, onSubmit, record, defaultType = 'CONSULTATION', lockType, busy, patientName, isDoctor, }) {
    const [form, setForm] = useState(emptyForm(defaultType));
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!open)
            return;
        setError(null);
        if (record) {
            setForm({
                type: record.type,
                recordDate: record.recordDate,
                notes: record.notes ?? '',
                symptoms: record.symptoms ?? '',
                diagnosis: record.diagnosis ?? '',
                treatment: record.treatment ?? '',
                facility: record.facility ?? '',
                doctorName: record.doctorName ?? '',
                testName: record.testName ?? '',
                resultSummary: record.resultSummary ?? '',
                allergen: record.allergen ?? '',
                reaction: record.reaction ?? '',
                severity: record.severity ?? 'MILD',
                conditionName: record.conditionName ?? '',
                currentStatus: record.currentStatus ?? '',
                conditionYear: record.conditionYear ? String(record.conditionYear) : '',
                medicines: record.medicines.length > 0
                    ? record.medicines.map((medicine) => ({ ...medicine }))
                    : [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
            });
        }
        else {
            setForm(emptyForm(defaultType));
        }
    }, [open, record, defaultType]);
    const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
    const setMedicine = (index, key, value) => {
        setForm((current) => {
            const medicines = [...current.medicines];
            medicines[index] = { ...medicines[index], [key]: value };
            return { ...current, medicines };
        });
    };
    const addMedicine = () => setForm((current) => ({
        ...current,
        medicines: [...current.medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    }));
    const removeMedicine = (index) => setForm((current) => ({
        ...current,
        medicines: current.medicines.filter((_, position) => position !== index),
    }));
    /** Client-side validation mirrors the backend so the user gets instant feedback. */
    const validate = () => {
        if (!form.recordDate)
            return 'Please choose a date.';
        switch (form.type) {
            case 'CONSULTATION':
                if (!form.symptoms.trim())
                    return 'Symptoms are required for a consultation.';
                if (!form.diagnosis.trim())
                    return 'A diagnosis is required for a consultation.';
                break;
            case 'PRESCRIPTION':
                if (form.medicines.every((medicine) => !medicine.name.trim()))
                    return 'Add at least one medicine with a name.';
                break;
            case 'DIAGNOSTIC_REPORT':
                if (!form.testName.trim())
                    return 'A test name is required for a diagnostic report.';
                break;
            case 'ALLERGY':
                if (!form.allergen.trim())
                    return 'An allergen is required for an allergy record.';
                break;
            case 'MEDICAL_HISTORY':
                if (!form.conditionName.trim())
                    return 'A condition name is required for medical history.';
                break;
        }
        return null;
    };
    const handleSubmit = () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }
        setError(null);
        const payload = {
            type: form.type,
            recordDate: form.recordDate,
            notes: form.notes || undefined,
            symptoms: form.symptoms || undefined,
            diagnosis: form.diagnosis || undefined,
            treatment: form.treatment || undefined,
            facility: form.facility || undefined,
            doctorName: form.doctorName || undefined,
            testName: form.testName || undefined,
            resultSummary: form.resultSummary || undefined,
            allergen: form.allergen || undefined,
            reaction: form.reaction || undefined,
            severity: form.type === 'ALLERGY' ? form.severity : undefined,
            conditionName: form.conditionName || undefined,
            currentStatus: form.currentStatus || undefined,
            conditionYear: form.conditionYear ? Number(form.conditionYear) : undefined,
            medicines: form.type === 'PRESCRIPTION'
                ? form.medicines.filter((medicine) => medicine.name.trim())
                : undefined,
        };
        onSubmit(payload);
    };
    const editing = Boolean(record);
    return (<Modal open={open} onClose={onClose} size="lg" title={editing ? `Edit ${record?.typeLabel.toLowerCase()}` : 'Add a medical record'} description={patientName
            ? `Adding a record for ${patientName}`
            : 'Structured details make your history useful to a doctor later.'} footer={<>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={busy}>
            {editing ? 'Save changes' : 'Save record'}
          </Button>
        </>}>
      <div className="space-y-4">
        {error && (<div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {error}
          </div>)}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Record type" required hint={lockType ? 'Type cannot be changed after creation.' : undefined}>
            <Select value={form.type} disabled={lockType || editing} onChange={(event) => set('type', event.target.value)}>
              {TYPE_ORDER.map((type) => (<option key={type} value={type}>
                  {RECORD_TYPE_LABELS[type]}
                </option>))}
            </Select>
          </Field>
          <Field label="Date" required>
            <Input type="date" value={form.recordDate} max={todayIso()} onChange={(event) => set('recordDate', event.target.value)}/>
          </Field>
        </div>

        {/* --- Consultation --- */}
        {form.type === 'CONSULTATION' && (<>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Doctor">
                <Input value={form.doctorName} onChange={(event) => set('doctorName', event.target.value)} placeholder={isDoctor ? 'Your name (filled automatically)' : 'Dr. Rohan Sharma'}/>
              </Field>
              <Field label="Hospital / Clinic">
                <Input value={form.facility} onChange={(event) => set('facility', event.target.value)} placeholder="Sunrise Multispeciality Hospital"/>
              </Field>
            </div>
            <Field label="Symptoms" required>
              <Textarea value={form.symptoms} onChange={(event) => set('symptoms', event.target.value)} placeholder="What were you experiencing?"/>
            </Field>
            <Field label="Diagnosis" required>
              <Textarea value={form.diagnosis} onChange={(event) => set('diagnosis', event.target.value)} placeholder="What the doctor concluded"/>
            </Field>
            <Field label="Treatment">
              <Textarea value={form.treatment} onChange={(event) => set('treatment', event.target.value)} placeholder="Treatment given or advised"/>
            </Field>
          </>)}

        {/* --- Prescription --- */}
        {form.type === 'PRESCRIPTION' && (<>
            <Field label="Prescribing doctor">
              <Input value={form.doctorName} onChange={(event) => set('doctorName', event.target.value)} placeholder={isDoctor ? 'Your name (filled automatically)' : 'Dr. Rohan Sharma'}/>
            </Field>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  Medicines <span className="text-red-500">*</span>
                </label>
                <Button size="sm" variant="outline" icon={<Plus className="h-3.5 w-3.5"/>} onClick={addMedicine}>
                  Add medicine
                </Button>
              </div>

              <div className="space-y-3">
                {form.medicines.map((medicine, index) => (<div key={index} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Medicine {index + 1}</span>
                      {form.medicines.length > 1 && (<button type="button" onClick={() => removeMedicine(index)} aria-label={`Remove medicine ${index + 1}`} className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5"/>
                        </button>)}
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <Input value={medicine.name} onChange={(event) => setMedicine(index, 'name', event.target.value)} placeholder="Medicine name *"/>
                      <Input value={medicine.dosage ?? ''} onChange={(event) => setMedicine(index, 'dosage', event.target.value)} placeholder="Dosage e.g. 500 mg"/>
                      <Input value={medicine.frequency ?? ''} onChange={(event) => setMedicine(index, 'frequency', event.target.value)} placeholder="Frequency e.g. Twice daily"/>
                      <Input value={medicine.duration ?? ''} onChange={(event) => setMedicine(index, 'duration', event.target.value)} placeholder="Duration e.g. 5 days"/>
                    </div>
                    <Input className="mt-2.5" value={medicine.instructions ?? ''} onChange={(event) => setMedicine(index, 'instructions', event.target.value)} placeholder="Instructions e.g. Take after food"/>
                  </div>))}
              </div>
            </div>
          </>)}

        {/* --- Diagnostic report --- */}
        {form.type === 'DIAGNOSTIC_REPORT' && (<>
            <Field label="Test name" required>
              <Input value={form.testName} onChange={(event) => set('testName', event.target.value)} placeholder="Complete Blood Count"/>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Lab / Hospital">
                <Input value={form.facility} onChange={(event) => set('facility', event.target.value)} placeholder="Nova Diagnostics"/>
              </Field>
              <Field label="Ordering doctor">
                <Input value={form.doctorName} onChange={(event) => set('doctorName', event.target.value)} placeholder="Dr. Rohan Sharma"/>
              </Field>
            </div>
            <Field label="Result summary">
              <Textarea value={form.resultSummary} onChange={(event) => set('resultSummary', event.target.value)} placeholder="Key findings and values"/>
            </Field>
          </>)}

        {/* --- Allergy --- */}
        {form.type === 'ALLERGY' && (<>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Allergen" required>
                <Input value={form.allergen} onChange={(event) => set('allergen', event.target.value)} placeholder="Penicillin"/>
              </Field>
              <Field label="Severity">
                <Select value={form.severity} onChange={(event) => set('severity', event.target.value)}>
                  <option value="MILD">Mild</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="SEVERE">Severe</option>
                </Select>
              </Field>
            </div>
            <Field label="Reaction">
              <Textarea value={form.reaction} onChange={(event) => set('reaction', event.target.value)} placeholder="What happens when you are exposed?"/>
            </Field>
          </>)}

        {/* --- Medical history --- */}
        {form.type === 'MEDICAL_HISTORY' && (<>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Condition" required>
                <Input value={form.conditionName} onChange={(event) => set('conditionName', event.target.value)} placeholder="Asthma"/>
              </Field>
              <Field label="Current status">
                <Input value={form.currentStatus} onChange={(event) => set('currentStatus', event.target.value)} placeholder="Ongoing / Resolved / Controlled"/>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Year" hint="Used when the exact date is unknown">
                <Input type="number" value={form.conditionYear} onChange={(event) => set('conditionYear', event.target.value)} placeholder="2023" min={1900} max={2100}/>
              </Field>
              <Field label="Treatment">
                <Input value={form.treatment} onChange={(event) => set('treatment', event.target.value)} placeholder="Levothyroxine 50 mcg daily"/>
              </Field>
            </div>
          </>)}

        <Field label="Notes" hint="A flexible field available on every record type.">
          <Textarea value={form.notes} onChange={(event) => set('notes', event.target.value)} placeholder="Anything else worth recording"/>
        </Field>
      </div>
    </Modal>);
}
