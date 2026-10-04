import { useRef, useState } from 'react';
import { FileText, Info, Plus, Upload, X } from 'lucide-react';
import { PageHeader } from '../../layouts/AppLayout';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ErrorState, SkeletonList } from '../../components/ui/Feedback';
import { RecordFormModal } from '../../components/records/RecordFormModal';
import { RecordTypeBadge } from '../../components/ui/Badge';
import { useRecords, useRecordMutations } from '../../hooks/useRecords';
import { useToast } from '../../context/ToastContext';
import { formatBytes, formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';
const ACCEPTED = '.pdf,.jpg,.jpeg,.png';
const MAX_BYTES = 15 * 1024 * 1024;
/**
 * Upload a document and attach it to a record.
 *
 * <p>Documents never live in PostgreSQL: the file goes to the storage layer
 * (local disk, or a private Supabase bucket once credentials are set) and only
 * the reference is stored. Reads always pass an authorization check first.
 */
export default function PatientUploadPage() {
    const toast = useToast();
    const { records, loading, error, reload } = useRecords();
    const mutations = useRecordMutations(reload);
    const [selectedRecordId, setSelectedRecordId] = useState(null);
    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [defaultType, setDefaultType] = useState('DIAGNOSTIC_REPORT');
    const inputRef = useRef(null);
    const chooseFile = (candidate) => {
        if (!candidate)
            return;
        if (candidate.size > MAX_BYTES) {
            toast.warning('File is too large', `${candidate.name} is ${formatBytes(candidate.size)}. The limit is 15 MB.`);
            return;
        }
        setFile(candidate);
    };
    const upload = async () => {
        if (!file || !selectedRecordId)
            return;
        const ok = await mutations.uploadDocument(selectedRecordId, file);
        if (ok) {
            setFile(null);
            reload();
        }
    };
    const selectedRecord = records.find((record) => record.id === selectedRecordId) ?? null;
    return (<>
      <PageHeader title="Upload a Record" description="Attach a PDF, JPG or PNG report to one of your existing records. Files are stored securely and only shared when you approve a doctor." action={<Button onClick={() => {
                setDefaultType('DIAGNOSTIC_REPORT');
                setFormOpen(true);
            }} icon={<Plus className="h-4 w-4"/>}>
            New record first
          </Button>}/>

      {loading ? (<SkeletonList rows={3}/>) : error ? (<ErrorState message={error.message} onRetry={reload}/>) : (<div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Attach a document" description="Choose the record this document belongs to, then pick the file." icon={<Upload className="h-4 w-4"/>}/>

            <CardBody className="space-y-5">
              {/* Step 1: pick the record */}
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">
                  1. Which record does this belong to?
                </p>
                {records.length === 0 ? (<div className="rounded-xl border border-dashed border-slate-300 p-4 text-center">
                    <p className="text-sm text-slate-600">
                      You have no records yet. Create one first, then attach the document.
                    </p>
                    <Button className="mt-3" size="sm" onClick={() => {
                    setDefaultType('DIAGNOSTIC_REPORT');
                    setFormOpen(true);
                }} icon={<Plus className="h-3.5 w-3.5"/>}>
                      Create a record
                    </Button>
                  </div>) : (<div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {records.map((record) => (<RecordPickRow key={record.id} record={record} selected={selectedRecordId === record.id} onSelect={() => setSelectedRecordId(record.id)}/>))}
                  </div>)}
              </div>

              {/* Step 2: pick the file */}
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">2. Choose the file</p>
                <div onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
            }} onDragLeave={() => setDragging(false)} onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                chooseFile(event.dataTransfer.files?.[0] ?? null);
            }} className={cn('rounded-xl border-2 border-dashed p-6 text-center transition', dragging ? 'border-brand-400 bg-brand-50' : 'border-slate-300 bg-slate-50/60')}>
                  <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden" onChange={(event) => {
                chooseFile(event.target.files?.[0] ?? null);
                event.target.value = '';
            }}/>

                  {file ? (<div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                          <FileText className="h-4 w-4"/>
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
                          <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setFile(null)} aria-label="Remove selected file" className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                        <X className="h-4 w-4"/>
                      </button>
                    </div>) : (<>
                      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200">
                        <Upload className="h-5 w-5"/>
                      </span>
                      <p className="mt-3 text-sm font-medium text-slate-700">
                        Drag a file here, or{' '}
                        <button type="button" onClick={() => inputRef.current?.click()} className="font-semibold text-brand-700 underline-offset-2 hover:underline">
                          browse
                        </button>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        PDF, JPG, JPEG or PNG · up to 15 MB
                      </p>
                    </>)}
                </div>
              </div>

              <Button fullWidth size="lg" disabled={!file || !selectedRecordId} loading={mutations.busy} onClick={upload} icon={<Upload className="h-4 w-4"/>}>
                Upload document
              </Button>

              {!selectedRecordId && file && (<p className="text-center text-xs font-medium text-amber-600">
                  Select a record above before uploading.
                </p>)}
            </CardBody>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader title="How files are stored" icon={<Info className="h-4 w-4"/>}/>
              <CardBody>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"/>
                    The file itself is never kept inside the database. Only its storage reference,
                    name and size are.
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"/>
                    Files are not served from a public URL. Every view or download passes through an
                    access check first.
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"/>
                    A doctor can only open a document if the record it belongs to falls inside an
                    access grant you approved.
                  </li>
                </ul>
              </CardBody>
            </Card>

            {selectedRecord && (<Card>
                <CardHeader title="Selected record"/>
                <CardBody>
                  <div className="flex items-center gap-2">
                    <RecordTypeBadge type={selectedRecord.type} label={selectedRecord.typeLabel}/>
                    <span className="text-xs text-slate-500">{formatDate(selectedRecord.recordDate)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">
                    {selectedRecord.diagnosis ??
                    selectedRecord.testName ??
                    selectedRecord.allergen ??
                    selectedRecord.conditionName ??
                    'Prescription'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedRecord.documents.length} document
                    {selectedRecord.documents.length === 1 ? '' : 's'} already attached
                  </p>
                </CardBody>
              </Card>)}
          </div>
        </div>)}

      <RecordFormModal open={formOpen} onClose={() => setFormOpen(false)} defaultType={defaultType} busy={mutations.busy} onSubmit={async (payload) => {
            const created = await mutations.create(payload, 'Record created');
            if (created) {
                setFormOpen(false);
                // Select the new record so the patient can attach the file straight away.
                setSelectedRecordId(created.id);
            }
        }}/>
    </>);
}
function RecordPickRow({ record, selected, onSelect, }) {
    const label = record.diagnosis ??
        record.testName ??
        record.allergen ??
        record.conditionName ??
        (record.medicines.length > 0 ? record.medicines.map((m) => m.name).join(', ') : 'Prescription');
    return (<button type="button" onClick={onSelect} className={cn('flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition', selected ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500' : 'border-slate-200 hover:border-slate-300')}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <RecordTypeBadge type={record.type} label={record.typeLabel}/>
          <span className="text-xs text-slate-500">{formatDate(record.recordDate)}</span>
        </div>
        <p className="mt-1 truncate text-sm font-medium text-slate-800">{label}</p>
      </div>
      <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border', selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300')}>
        {selected && <span className="text-[10px]">✓</span>}
      </span>
    </button>);
}
