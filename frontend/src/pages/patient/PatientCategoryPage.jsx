import { useRef, useState } from 'react';
import { PageHeader } from '../../layouts/AppLayout';
import { ConfirmDialog } from '../../components/ui/Modal';
import { RecordCollection } from '../../components/records/RecordCollection';
import { RecordFormModal } from '../../components/records/RecordFormModal';
import { RecordTypeIcon } from '../../components/RecordTypeIcon';
import { useRecords, useRecordMutations } from '../../hooks/useRecords';
/**
 * One page per record category.
 *
 * <p>All four category screens share this component and differ only in the
 * record type, heading and empty-state copy — the list, filters, detail view and
 * create/edit/delete flow are identical.
 */
export function PatientCategoryPage({ type, title, description, addLabel, emptyTitle, emptyMessage, }) {
    const { records, loading, error, reload } = useRecords({ type });
    const mutations = useRecordMutations(reload);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const fileInputRef = useRef(null);
    const uploadTarget = useRef(null);
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
      <PageHeader title={title} description={description} action={<RecordCollectionAddButton label={addLabel} onClick={() => {
                setEditing(null);
                setFormOpen(true);
            }}/>}/>

      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={onFileSelected}/>

      <RecordCollection records={records} loading={loading} error={error} onRetry={reload} showFilters={false} addLabel={addLabel} onAdd={() => {
            setEditing(null);
            setFormOpen(true);
        }} onEdit={(record) => {
            setEditing(record);
            setFormOpen(true);
        }} onDelete={setConfirmDelete} onAddDocument={triggerUpload} emptyTitle={emptyTitle} emptyMessage={emptyMessage} emptyIcon={<RecordTypeIcon type={type} size="sm" className="ring-0"/>}/>

      <RecordFormModal open={formOpen} onClose={() => setFormOpen(false)} record={editing} defaultType={type} lockType busy={mutations.busy} onSubmit={async (payload) => {
            const result = editing
                ? await mutations.update(editing.id, payload)
                : await mutations.create({ ...payload, type });
            if (result) {
                setFormOpen(false);
                setEditing(null);
            }
        }}/>

      <ConfirmDialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} loading={mutations.busy} title="Delete this record?" message="This permanently removes the record and any attached documents. This cannot be undone." confirmLabel="Delete record" onConfirm={async () => {
            if (!confirmDelete)
                return;
            const ok = await mutations.remove(confirmDelete.id);
            if (ok)
                setConfirmDelete(null);
        }}/>
    </>);
}
/** Small local wrapper so the header action matches the collection button. */
function RecordCollectionAddButton({ label, onClick }) {
    return (<button type="button" onClick={onClick} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700">
      <span className="text-base leading-none">+</span>
      {label}
    </button>);
}
