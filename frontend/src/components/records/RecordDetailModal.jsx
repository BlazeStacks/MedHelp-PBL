import { Download, Eye, FileText, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { RecordTypeBadge, SeverityBadge } from '../ui/Badge';
import { downloadProtectedFile, openProtectedFile } from '../../services/api';
import { formatBytes, formatDate, formatDateTime } from '../../utils/format';
/** Renders every populated field for a record, regardless of its type. */
export function RecordDetailModal({ record, open, onClose, onEdit, onDelete, onAddDocument, readOnly, canDelete, }) {
    if (!record)
        return null;
    return (<Modal open={open} onClose={onClose} size="lg" title={record.typeLabel} description={`Recorded on ${formatDate(record.recordDate)}`} footer={<>
          {onAddDocument && !readOnly && (<Button variant="outline" onClick={onAddDocument}>
              Attach document
            </Button>)}
          {canDelete && onDelete && (<Button variant="danger" onClick={onDelete} icon={<Trash2 className="h-4 w-4"/>}>
              Delete
            </Button>)}
          {onEdit && !readOnly && (<Button onClick={onEdit}>Edit record</Button>)}
        </>}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <RecordTypeBadge type={record.type} label={record.typeLabel}/>
          {record.severity && <SeverityBadge severity={record.severity}/>}
          {record.createdByDoctor && (<span className="text-xs text-slate-500">
              Added by {record.createdByName} (doctor)
            </span>)}
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label="Date" value={formatDate(record.recordDate)}/>

          {record.type === 'CONSULTATION' && (<>
              <Detail label="Doctor" value={record.doctorName}/>
              <Detail label="Hospital / Clinic" value={record.facility}/>
              <Detail label="Symptoms" value={record.symptoms} full/>
              <Detail label="Diagnosis" value={record.diagnosis} full/>
              <Detail label="Treatment" value={record.treatment} full/>
            </>)}

          {record.type === 'DIAGNOSTIC_REPORT' && (<>
              <Detail label="Test name" value={record.testName}/>
              <Detail label="Lab / Hospital" value={record.facility}/>
              <Detail label="Ordering doctor" value={record.doctorName}/>
              <Detail label="Result summary" value={record.resultSummary} full/>
            </>)}

          {record.type === 'ALLERGY' && (<>
              <Detail label="Allergen" value={record.allergen}/>
              <Detail label="Reaction" value={record.reaction}/>
            </>)}

          {record.type === 'MEDICAL_HISTORY' && (<>
              <Detail label="Condition" value={record.conditionName}/>
              <Detail label="Current status" value={record.currentStatus}/>
              <Detail label="Year" value={record.conditionYear?.toString()}/>
              <Detail label="Treatment" value={record.treatment} full/>
            </>)}

          {record.type === 'PRESCRIPTION' && <Detail label="Prescribing doctor" value={record.doctorName}/>}

          <Detail label="Notes" value={record.notes} full/>
        </dl>

        {/* Medicines */}
        {record.type === 'PRESCRIPTION' && record.medicines.length > 0 && (<div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">
              Medicines ({record.medicines.length})
            </h3>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Medicine</th>
                    <th className="px-3 py-2 font-medium">Dosage</th>
                    <th className="px-3 py-2 font-medium">Frequency</th>
                    <th className="px-3 py-2 font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {record.medicines.map((medicine, index) => (<tr key={medicine.id ?? index}>
                      <td className="px-3 py-2.5">
                        <span className="font-medium text-slate-800">{medicine.name}</span>
                        {medicine.instructions && (<span className="mt-0.5 block text-xs text-slate-500">{medicine.instructions}</span>)}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">{medicine.dosage || '—'}</td>
                      <td className="px-3 py-2.5 text-slate-600">{medicine.frequency || '—'}</td>
                      <td className="px-3 py-2.5 text-slate-600">{medicine.duration || '—'}</td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </div>)}

        {/* Documents */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-800">
            Attached documents ({record.documents.length})
          </h3>
          {record.documents.length === 0 ? (<p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
              No documents attached to this record yet.
            </p>) : (<ul className="space-y-2">
              {record.documents.map((document) => (<li key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                      <FileText className="h-4 w-4"/>
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{document.originalName}</p>
                      <p className="text-xs text-slate-500">
                        {formatBytes(document.sizeBytes)} · uploaded {formatDateTime(document.uploadedAt)}
                        {document.uploadedByName ? ` by ${document.uploadedByName}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="outline" icon={<Eye className="h-3.5 w-3.5"/>} onClick={() => void openProtectedFile(document.contentUrl)}>
                      View
                    </Button>
                    <Button size="sm" variant="ghost" icon={<Download className="h-3.5 w-3.5"/>} onClick={() => void downloadProtectedFile(document.contentUrl, document.originalName)}>
                      Download
                    </Button>
                  </div>
                </li>))}
            </ul>)}
        </div>

        <p className="border-t border-slate-100 pt-3 text-xs text-slate-400">
          Created {formatDateTime(record.createdAt)}
          {record.updatedAt && record.updatedAt !== record.createdAt
            ? ` · last updated ${formatDateTime(record.updatedAt)}`
            : ''}
        </p>
      </div>
    </Modal>);
}
function Detail({ label, value, full }) {
    if (!value)
        return null;
    return (<div className={full ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{value}</dd>
    </div>);
}
