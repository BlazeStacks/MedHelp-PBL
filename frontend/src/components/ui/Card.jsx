import { cn } from '../../utils/cn';
/** White panel used for every grouped block in the dashboards. */
export function Card({ children, className }) {
    return <div className={cn('surface', className)}>{children}</div>;
}
export function CardHeader({ title, description, action, icon, className }) {
    return (<div className={cn('flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (<span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            {icon}
          </span>)}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-slate-800">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>);
}
export function CardBody({ children, className }) {
    return <div className={cn('px-5 py-4', className)}>{children}</div>;
}
