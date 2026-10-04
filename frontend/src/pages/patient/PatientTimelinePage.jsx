import { useRef, useState } from 'react';
import { Activity, Plus, Upload } from 'lucide-react';
import { PageHeader } from '../../layouts/AppLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, SkeletonList } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/Modal';
import { TimelineEntryRow } from '../../components/records/TimelineEntryRow';
import { RecordDetailModal } from '../../components/records/RecordDetailModal';
import { RecordFormModal } from '../../components/records/RecordFormModal';
import { useAsync } from '../../hooks/useAsync';
import { useRecordMutations } from '../../hooks/useRecords';
import { recordsApi } from '../../services/apiEndpoints';
import { useToast } from '../../context/ToastContext';
import { groupByYear } from '../../utils/date';
/**
 * The full medical timeline, grouped by year.
 *
 * <p>Clicking an entry opens its full details; documents are fetched on demand
 * because the timeline payload only carries a count.
 */
export default function PatientTimelinePage() {
    const toast = useToast();
    const { data, loading, error, reload } = useAsync(() => recordsApi.timeline(), []);
    const mutations = useRecordMutations(reload);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [detailId, setDetailId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const fileInputRef = useRef(null);
    const pendingUploadRecordId = useRef(null);
    const openDetail = async (id) => {
        setDetailId(id);
        setDetailLoading(true);
        try {
            setDetail(await recordsApi.get(id));
        }
        catch {
            toast.error('Could not load that record');
            setDetailId(null);
        }
        finally {
            setDetailLoading(false);
        }
    };
    const closeDetail = () => {
        setDetailId(null);
        setDetail(null);
    };
    const triggerUpload = (record) => {
        pendingUploadRecordId.current = record.id;
        fileInputRef.current?.click();
    };
    const onFileSelected = async (event) => {
        const file = event.target.files?.[0];
        const recordId = pendingUploadRecordId.current;
        event.target.value = '';
        if (!file || !recordId)
            return;
        const ok = await mutations.uploadDocument(recordId, file);
        if (ok && detailId === recordId) {
            // Refresh the open detail modal so the new document appears immediately.
            await openDetail(recordId);
        }
    };
    const groups = groupByYear(data ?? []);
    return (<>
      <PageHeader title="Medical Timeline" description="Every record in your file, newest first. This is the view a doctor sees if you grant them access." action={<div className="flex gap-2">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} icon={<Upload className="h-4 w-4"/>}>
              Upload document
            </Button>
            <Button onClick={() => {
                setEditing(null);
                setFormOpen(true);
            }} icon={<Plus className="h-4 w-4"/>}>
              Add record
            </Button>
          </div>}/>

      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={onFileSelected}/>

      {loading ? (<SkeletonList rows={5}/>) : error ? (<ErrorState message={error.message} onRetry={reload}/>) : (data?.length ?? 0) === 0 ? (<Card>
          <EmptyState icon={<Activity className="h-5 w-5"/>} title="Your timeline is empty" message="Add a consultation, prescription, diagnostic report, allergy or medical history entry to get started." action={<Button onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                }} icon={<Plus className="h-4 w-4"/>}>
                Add your first record
              </Button>}/>
        </Card>) : (<div className="space-y-8">
          {groups.map((group) => (<section key={group.year}>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{group.year}</h2>
                <span className="text-xs text-slate-500">
                  {group.items.length} record{group.items.length > 1 ? 's' : ''}
                </span>
                <div className="h-px flex-1 bg-slate-200"/>
              </div>

              <div className="pl-0">
                {group.items.map((entry) => (<TimelineEntryRow key={entry.id} entry={entry} onClick={() => void openDetail(entry.id)}/>))}
              </div>
            </section>))}
        </div>)}

      {/* Create / edit form */}
      <RecordFormModal open={formOpen} onClose={() => setFormOpen(false)} record={editing} busy={mutations.busy} onSubmit={async (payload) => {
            const result = editing
                ? await mutations.update(editing.id, payload)
                : await mutations.create(payload);
            if (result) {
                setFormOpen(false);
                setEditing(null);
            }
        }}/>

      {/* Detail view (loads the full record so documents are available) */}
      {detailLoading && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20">
          <div className="rounded-xl bg-white px-5 py-4 text-sm text-slate-600 shadow-lg">
            Loading record…
          </div>
        </div>)}
      <RecordDetailModal record={detail} open={Boolean(detail) && !detailLoading} onClose={closeDetail} canDelete onEdit={() => {
            setEditing(detail);
            closeDetail();
            setFormOpen(true);
        }} onDelete={() => {
            setConfirmDelete(detail);
            closeDetail();
        }} onAddDocument={() => {
            if (detail)
                triggerUpload(detail);
        }}/>

      <ConfirmDialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} loading={mutations.busy} title="Delete this record?" message="This permanently removes the record and any attached documents from your file. This cannot be undone." confirmLabel="Delete record" onConfirm={async () => {
            if (!confirmDelete)
                return;
            const ok = await mutations.remove(confirmDelete.id);
            if (ok)
                setConfirmDelete(null);
        }}/>
    </>);
}
