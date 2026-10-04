import { cn } from '../utils/cn';
/** One dashboard metric tile. */
export function StatCard({ label, value, icon, tone = 'brand', hint, onClick, }) {
    const tones = {
        brand: 'bg-brand-50 text-brand-600',
        violet: 'bg-violet-50 text-violet-600',
        sky: 'bg-sky-50 text-sky-600',
        amber: 'bg-amber-50 text-amber-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        red: 'bg-red-50 text-red-600',
    };
    const Component = onClick ? 'button' : 'div';
    return (<Component onClick={onClick} className={cn('surface flex items-start justify-between gap-3 p-5 text-left', onClick && 'transition hover:border-brand-300 hover:shadow-md')}>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1.5 text-2xl font-semibold text-slate-900">{value}</p>
        {hint && <p className="mt-1 truncate text-xs text-slate-500">{hint}</p>}
      </div>
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
        {icon}
      </span>
    </Component>);
}
