import { Clock, FileText, Pill, ShieldAlert, ShieldCheck, Stethoscope } from 'lucide-react';
import { Badge, StatusBadge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import { formatDateTime, formatRelative, formatRemaining, initials } from '../../utils/format';
import { CATEGORY_LABELS } from '../../types';
const CATEGORY_ICONS = {
    CONSULTATIONS: <Stethoscope className="h-3.5 w-3.5"/>,
    PRESCRIPTIONS: <Pill className="h-3.5 w-3.5"/>,
    DIAGNOSTIC_REPORTS: <FileText className="h-3.5 w-3.5"/>,
    ALLERGIES: <ShieldAlert className="h-3.5 w-3.5"/>,
    MEDICAL_HISTORY: <Clock className="h-3.5 w-3.5"/>,
};
/** Renders the categories an approved grant allows. */
export function PermissionChips({ accessAll, permissions, className, }) {
    if (accessAll) {
        return (<Badge tone="brand" className={className}>
        <ShieldCheck className="h-3.5 w-3.5"/>
        All records
      </Badge>);
    }
    if (permissions.length === 0) {
        return (<span className={cn('text-xs text-slate-400', className)}>No categories shared</span>);
    }
    return (<div className={cn('flex flex-wrap gap-1.5', className)}>
      {permissions.map((category) => (<span key={category} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
          {CATEGORY_ICONS[category]}
          {CATEGORY_LABELS[category]}
        </span>))}
    </div>);
}
/**
 * One grant or request row.
 *
 * <p>{@code perspective} decides whose name leads — the patient sees the doctor,
 * the doctor sees the patient.
 */
export function AccessGrantCard({ grant, perspective, actions, }) {
    const counterpartyName = perspective === 'patient' ? grant.doctorName : grant.patientName;
    const counterpartyMeta = perspective === 'patient'
        ? [grant.doctorSpecialization, grant.doctorHospital].filter(Boolean).join(' · ')
        : grant.patientEmail;
    return (<div className="surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            {initials(counterpartyName)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-800">{counterpartyName}</p>
              <StatusBadge status={grant.status}/>
              {grant.live && grant.expiresInSeconds != null && (<Badge tone="sky">
                  <Clock className="h-3 w-3"/>
                  {formatRemaining(grant.expiresInSeconds)} left
                </Badge>)}
            </div>
            {counterpartyMeta && <p className="mt-0.5 truncate text-xs text-slate-500">{counterpartyMeta}</p>}
            {grant.reason && (<p className="mt-2 line-clamp-2 text-xs text-slate-600">
                <span className="font-medium">Reason:</span> {grant.reason}
              </p>)}
            {grant.decisionNote && (<p className="mt-1 line-clamp-2 text-xs text-slate-500">
                <span className="font-medium">Your note:</span> {grant.decisionNote}
              </p>)}
          </div>
        </div>

        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <PermissionChips accessAll={grant.accessAll} permissions={grant.permissions}/>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>Requested {formatRelative(grant.createdAt)}</span>
          {grant.expiresAt && <span>Expires {formatDateTime(grant.expiresAt)}</span>}
        </div>
      </div>
    </div>);
}
