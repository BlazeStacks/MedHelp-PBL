import { useCallback, useState } from 'react';
import { recordsApi } from '../services/apiEndpoints';
import { toApiError } from '../services/api';
import { useAsync } from './useAsync';
import { useToast } from '../context/ToastContext';
/**
 * Loads records for the signed-in patient, or for a patient a doctor is
 * authorized to view.
 *
 * <p>All list pages share this so the loading/error/empty handling is identical
 * everywhere. When {@code patientId} is set the backend filters the result down
 * to the categories the doctor's grant allows.
 */
export function useRecords(options = {}) {
    const { type, patientId } = options;
    const [records, setRecords] = useState([]);
    const state = useAsync(async () => {
        const data = await recordsApi.list({ type, patientId });
        setRecords(data);
        return data;
    }, [type, patientId]);
    const replaceRecord = useCallback((updated) => {
        setRecords((current) => current.map((record) => (record.id === updated.id ? updated : record)));
    }, []);
    const removeRecord = useCallback((id) => {
        setRecords((current) => current.filter((record) => record.id !== id));
    }, []);
    return { ...state, records, reload: state.reload, replaceRecord, removeRecord };
}
/** Create/update/delete actions with toast feedback, shared by record pages. */
export function useRecordMutations(onChanged) {
    const toast = useToast();
    const [busy, setBusy] = useState(false);
    const create = async (payload, successMessage = 'Record saved') => {
        setBusy(true);
        try {
            const created = await recordsApi.create(payload);
            toast.success(successMessage, `${created.typeLabel} added on ${created.recordDate}.`);
            onChanged();
            return created;
        }
        catch (error) {
            toast.error('Could not save the record', toApiError(error).message);
            return null;
        }
        finally {
            setBusy(false);
        }
    };
    const update = async (id, payload) => {
        setBusy(true);
        try {
            const updated = await recordsApi.update(id, payload);
            toast.success('Record updated');
            onChanged();
            return updated;
        }
        catch (error) {
            toast.error('Could not update the record', toApiError(error).message);
            return null;
        }
        finally {
            setBusy(false);
        }
    };
    const remove = async (id) => {
        setBusy(true);
        try {
            await recordsApi.remove(id);
            toast.success('Record deleted');
            onChanged();
            return true;
        }
        catch (error) {
            toast.error('Could not delete the record', toApiError(error).message);
            return false;
        }
        finally {
            setBusy(false);
        }
    };
    const uploadDocument = async (recordId, file) => {
        setBusy(true);
        try {
            await recordsApi.uploadDocument(recordId, file);
            toast.success('Document uploaded', file.name);
            onChanged();
            return true;
        }
        catch (error) {
            toast.error('Could not upload the document', toApiError(error).message);
            return false;
        }
        finally {
            setBusy(false);
        }
    };
    return { busy, create, update, remove, uploadDocument };
}
