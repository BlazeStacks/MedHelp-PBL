import { cn } from '../../utils/cn';
const TONES = {
    brand: 'bg-brand-50 text-brand-700 ring-brand-200',
    slate: 'bg-slate-100 text-slate-600 ring-slate-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    violet: 'bg-violet-50 text-violet-700 ring-violet-200',
    sky: 'bg-sky-50 text-sky-700 ring-sky-200',
};
export function Badge({ children, tone = 'slate', className, }) {
    return (<span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', TONES[tone], className)}>
      {children}
    </span>);
}
const STATUS_TONES = {
    PENDING: 'amber',
    APPROVED: 'emerald',
    DENIED: 'red',
    REVOKED: 'slate',
    EXPIRED: 'slate',
};
export function StatusBadge({ status }) {
    return <Badge tone={STATUS_TONES[status]}>{status.charAt(0) + status.slice(1).toLowerCase()}</Badge>;
}
const TYPE_TONES = {
    CONSULTATION: 'brand',
    PRESCRIPTION: 'violet',
    DIAGNOSTIC_REPORT: 'sky',
    ALLERGY: 'red',
    MEDICAL_HISTORY: 'amber',
};
export function RecordTypeBadge({ type, label }) {
    return <Badge tone={TYPE_TONES[type]}>{label ?? type.replace(/_/g, ' ').toLowerCase()}</Badge>;
}
const SEVERITY_TONES = {
    MILD: 'emerald',
    MODERATE: 'amber',
    SEVERE: 'red',
};
export function SeverityBadge({ severity }) {
    return <Badge tone={SEVERITY_TONES[severity]}>{severity.toLowerCase()}</Badge>;
}
