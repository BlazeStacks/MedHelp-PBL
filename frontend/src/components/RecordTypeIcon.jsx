import { Activity, FileText, HeartPulse, Pill, ShieldAlert, Stethoscope, } from 'lucide-react';
import { cn } from '../utils/cn';
const ICONS = {
    CONSULTATION: Stethoscope,
    PRESCRIPTION: Pill,
    DIAGNOSTIC_REPORT: FileText,
    ALLERGY: ShieldAlert,
    MEDICAL_HISTORY: Activity,
};
/** Colour + icon treatment used by timeline entries and record cards. */
export const RECORD_STYLES = {
    CONSULTATION: { bg: 'bg-brand-50', text: 'text-brand-600', ring: 'ring-brand-200' },
    PRESCRIPTION: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-200' },
    DIAGNOSTIC_REPORT: { bg: 'bg-sky-50', text: 'text-sky-600', ring: 'ring-sky-200' },
    ALLERGY: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-200' },
    MEDICAL_HISTORY: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-200' },
};
export function RecordTypeIcon({ type, size = 'md', className, }) {
    const Icon = ICONS[type] ?? HeartPulse;
    const style = RECORD_STYLES[type] ?? RECORD_STYLES.CONSULTATION;
    const sizes = {
        sm: 'h-8 w-8 rounded-lg',
        md: 'h-10 w-10 rounded-xl',
        lg: 'h-12 w-12 rounded-xl',
    };
    const iconSizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' };
    return (<span className={cn('flex shrink-0 items-center justify-center ring-1 ring-inset', sizes[size], style.bg, style.text, style.ring, className)}>
      <Icon className={iconSizes[size]}/>
    </span>);
}
