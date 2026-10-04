import { useMemo, useState } from 'react';
import { Filter, Plus } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState, ErrorState, SkeletonList } from '../ui/Feedback';
import { RecordTypeIcon } from '../RecordTypeIcon';
import { RecordTypeBadge, SeverityBadge } from '../ui/Badge';
import { RecordDetailModal } from './RecordDetailModal';
import { formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';
const FILTERS = [
    { value: 'ALL', label: 'All records' },
    { value: 'CONSULTATION', label: 'Consultations' },
    { value: 'PRESCRIPTION', label: 'Prescriptions' },
    { value: 'DIAGNOSTIC_REPORT', label: 'Diagnostic Reports' },
    { value: 'ALLERGY', label: 'Allergies' },
    { value: 'MEDICAL_HISTORY', label: 'Medical History' },
];
/**
 * Renders a list of medical records with type filtering and a detail view.
 *
 * <p>Shared by every patient category page and by the doctor's patient-records
 * screen, so both sides see the same presentation of the same data.
 */
export function RecordCollection({ records, loading, error, onRetry, onAdd, addLabel = 'Add record', onEdit, onDelete, onAddDocument, readOnly, showFilters = true, header, emptyTitle = 'No records yet', emptyMessage = 'Records you add will appear here, organised by type.', emptyIcon, }) {
    const [filter, setFilter] = useState('ALL');
    const [selected, setSelected] = useState(null);
    const filtered = useMemo(() => (filter === 'ALL' ? records : records.filter((record) => record.type === filter)), [records, filter]);
    // Only offer filter chips for types that actually appear in this list.
    const availableFilters = useMemo(() => {
        const present = new Set(records.map((record) => record.type));
        return FILTERS.filter((item) => item.value === 'ALL' || present.has(item.value));
    }, [records]);
    if (loading)
        return <SkeletonList rows={4}/>;
    if (error)
        return <ErrorState message={error.message} onRetry={onRetry}/>;
    return (<div className="space-y-4">
      {(header || onAdd || (showFilters && availableFilters.length > 1)) && (<div className="flex flex-wrap items-center justify-between gap-3">
          {header}
          <div className="flex flex-wrap items-center gap-2">
            {showFilters && availableFilters.length > 1 && (<div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
                <Filter className="ml-1.5 h-3.5 w-3.5 text-slate-400"/>
                {availableFilters.map((item) => (<button key={item.value} type="button" onClick={() => setFilter(item.value)} className={cn('rounded-md px-2.5 py-1 text-xs font-medium transition', filter === item.value
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:bg-slate-100')}>
                    {item.label}
                  </button>))}
              </div>)}
            {onAdd && (<Button onClick={onAdd} icon={<Plus className="h-4 w-4"/>}>
                {addLabel}
              </Button>)}
          </div>
        </div>)}

      {filtered.length === 0 ? (<Card>
          <EmptyState icon={emptyIcon ?? <RecordTypeIcon type="CONSULTATION" size="sm" className="ring-0"/>} title={emptyTitle} message={emptyMessage} action={onAdd && (<Button onClick={onAdd} icon={<Plus className="h-4 w-4"/>}>
                  {addLabel}
                </Button>)}/>
        </Card>) : (<div className="space-y-3">
          {filtered.map((record) => (<RecordRow key={record.id} record={record} onOpen={() => setSelected(record)}/>))}
        </div>)}

      <RecordDetailModal record={selected} open={Boolean(selected)} onClose={() => setSelected(null)} readOnly={readOnly} canDelete={!readOnly && Boolean(onDelete)} onEdit={onEdit ? () => {
            const current = selected;
            setSelected(null);
            if (current)
                onEdit(current);
        } : undefined} onDelete={onDelete ? () => {
            const current = selected;
            setSelected(null);
            if (current)
                onDelete(current);
        } : undefined} onAddDocument={onAddDocument ? () => {
            const current = selected;
            setSelected(null);
            if (current)
                onAddDocument(current);
        } : undefined}/>
    </div>);
}
function RecordRow({ record, onOpen }) {
    const primary = record.type === 'CONSULTATION'
        ? record.diagnosis
        : record.type === 'DIAGNOSTIC_REPORT'
            ? record.testName
            : record.type === 'ALLERGY'
                ? record.allergen
                : record.type === 'MEDICAL_HISTORY'
                    ? record.conditionName
                    : record.medicines.length > 0
                        ? record.medicines.map((medicine) => medicine.name).join(', ')
                        : 'Prescription';
    const secondary = record.type === 'CONSULTATION'
        ? record.symptoms
        : record.type === 'DIAGNOSTIC_REPORT'
            ? record.resultSummary
            : record.type === 'ALLERGY'
                ? record.reaction
                : record.type === 'MEDICAL_HISTORY'
                    ? record.treatment
                    : record.notes;
    return (<button type="button" onClick={onOpen} className="surface flex w-full items-start gap-4 p-4 text-left transition hover:border-brand-300 hover:shadow-md">
      <RecordTypeIcon type={record.type}/>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-800">{primary ?? record.typeLabel}</p>
          <RecordTypeBadge type={record.type} label={record.typeLabel}/>
          {record.severity && <SeverityBadge severity={record.severity}/>}
          {record.createdByDoctor && (<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              added by {record.createdByName}
            </span>)}
        </div>
        {secondary && <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{secondary}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="font-medium">{formatDate(record.recordDate)}</span>
          {record.doctorName && <span>{record.doctorName}</span>}
          {record.facility && <span>{record.facility}</span>}
          {record.documents.length > 0 && (<span>{record.documents.length} document{record.documents.length > 1 ? 's' : ''}</span>)}
        </div>
      </div>
    </button>);
}
