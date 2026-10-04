import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';
/** Centred spinner for full-page loads. */
export function PageLoader({ label = 'Loading…' }) {
    return (<div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Loader2 className="h-6 w-6 animate-spin text-brand-600"/>
      <p className="text-sm">{label}</p>
    </div>);
}
/** Skeleton rows that mirror the shape of a list so layout does not jump. */
export function SkeletonList({ rows = 4, className }) {
    return (<div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, index) => (<div key={index} className="surface animate-pulse p-4">
          <div className="h-4 w-1/3 rounded bg-slate-200"/>
          <div className="mt-2 h-3 w-2/3 rounded bg-slate-100"/>
          <div className="mt-3 h-3 w-1/2 rounded bg-slate-100"/>
        </div>))}
    </div>);
}
export function SkeletonCards({ count = 4 }) {
    return (<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (<div key={index} className="surface animate-pulse p-5">
          <div className="h-3 w-24 rounded bg-slate-200"/>
          <div className="mt-3 h-7 w-16 rounded bg-slate-200"/>
        </div>))}
    </div>);
}
/** Friendly empty state — never a blank panel. */
export function EmptyState({ icon, title, message, action, className, }) {
    return (<div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon}
      </span>
      <h3 className="mt-4 text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>);
}
/** Inline error panel with a retry affordance. */
export function ErrorState({ message, onRetry, className, }) {
    return (<div className={cn('surface flex flex-col items-center gap-3 p-8 text-center', className)}>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-500">
        <AlertCircle className="h-5 w-5"/>
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-800">Something went wrong</p>
        <p className="mt-1 text-sm text-slate-500">{message}</p>
      </div>
      {onRetry && (<button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
          <RefreshCw className="h-3.5 w-3.5"/>
          Try again
        </button>)}
    </div>);
}
