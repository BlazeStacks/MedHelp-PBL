import { Activity, Eye, FilePlus, FileX, LogIn, ShieldAlert, ShieldCheck, ShieldX, Upload, UserPlus, Clock, } from 'lucide-react';
import { formatDateTime, formatRelative, initials } from '../utils/format';
import { cn } from '../utils/cn';
const ACTION_STYLES = {
    REGISTER: { icon: <UserPlus className="h-3.5 w-3.5"/>, tone: 'bg-slate-100 text-slate-600', label: 'Account created' },
    LOGIN: { icon: <LogIn className="h-3.5 w-3.5"/>, tone: 'bg-slate-100 text-slate-600', label: 'Signed in' },
    ACCESS_REQUESTED: { icon: <ShieldAlert className="h-3.5 w-3.5"/>, tone: 'bg-amber-50 text-amber-600', label: 'Access requested' },
    ACCESS_APPROVED: { icon: <ShieldCheck className="h-3.5 w-3.5"/>, tone: 'bg-emerald-50 text-emerald-600', label: 'Access approved' },
    ACCESS_DENIED: { icon: <ShieldX className="h-3.5 w-3.5"/>, tone: 'bg-red-50 text-red-600', label: 'Access denied' },
    ACCESS_REVOKED: { icon: <ShieldX className="h-3.5 w-3.5"/>, tone: 'bg-slate-100 text-slate-600', label: 'Access revoked' },
    ACCESS_EXPIRED: { icon: <Clock className="h-3.5 w-3.5"/>, tone: 'bg-slate-100 text-slate-600', label: 'Access expired' },
    ACCESS_DENIED_BY_POLICY: { icon: <ShieldX className="h-3.5 w-3.5"/>, tone: 'bg-red-50 text-red-600', label: 'Blocked by policy' },
    RECORD_CREATED: { icon: <FilePlus className="h-3.5 w-3.5"/>, tone: 'bg-brand-50 text-brand-600', label: 'Record added' },
    RECORD_UPDATED: { icon: <Activity className="h-3.5 w-3.5"/>, tone: 'bg-brand-50 text-brand-600', label: 'Record updated' },
    RECORD_DELETED: { icon: <FileX className="h-3.5 w-3.5"/>, tone: 'bg-red-50 text-red-600', label: 'Record deleted' },
    RECORD_VIEWED: { icon: <Eye className="h-3.5 w-3.5"/>, tone: 'bg-sky-50 text-sky-600', label: 'Records viewed' },
    DOCUMENT_UPLOADED: { icon: <Upload className="h-3.5 w-3.5"/>, tone: 'bg-violet-50 text-violet-600', label: 'Document uploaded' },
    DOCUMENT_VIEWED: { icon: <Eye className="h-3.5 w-3.5"/>, tone: 'bg-sky-50 text-sky-600', label: 'Document viewed' },
    DOCUMENT_DOWNLOADED: { icon: <Eye className="h-3.5 w-3.5"/>, tone: 'bg-sky-50 text-sky-600', label: 'Document downloaded' },
    PRESCRIPTION_CREATED: { icon: <FilePlus className="h-3.5 w-3.5"/>, tone: 'bg-violet-50 text-violet-600', label: 'Prescription added' },
};
/**
 * Renders the audit trail.
 *
 * <p>Blocked access attempts are shown to the patient alongside successful ones,
 * which is the point of keeping a denial record: the patient can see when a
 * doctor tried to reach something they were not granted.
 */
export function AuditTrail({ entries, compact }) {
    if (entries.length === 0) {
        return (<p className="py-6 text-center text-sm text-slate-500">
        No activity recorded yet. Access attempts and record changes will appear here.
      </p>);
    }
    return (<ul className={cn('space-y-3', compact && 'space-y-2.5')}>
      {entries.map((entry) => {
            const style = ACTION_STYLES[entry.action] ?? ACTION_STYLES.RECORD_CREATED;
            const isBlocked = entry.action === 'ACCESS_DENIED_BY_POLICY';
            return (<li key={entry.id} className="flex items-start gap-3">
            <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', style.tone)}>
              {style.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm', isBlocked ? 'text-red-700' : 'text-slate-700')}>
                {entry.description}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                {entry.actorName && (<span className="inline-flex items-center gap-1">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[8px] font-semibold text-slate-500">
                      {initials(entry.actorName)}
                    </span>
                    {entry.actorName}
                    {entry.actorRole && ` · ${entry.actorRole.toLowerCase()}`}
                  </span>)}
                <span>{compact ? formatRelative(entry.createdAt) : formatDateTime(entry.createdAt)}</span>
                {entry.recordType && <span>{entry.recordType.replace(/_/g, ' ').toLowerCase()}</span>}
              </div>
            </div>
          </li>);
        })}
    </ul>);
}
