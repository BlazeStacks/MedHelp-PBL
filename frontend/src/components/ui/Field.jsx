import { forwardRef } from 'react';
import { cn } from '../../utils/cn';
/** Shared wrapper that renders a label, optional hint and validation error. */
export function Field({ label, error, hint, required, children, className, }) {
    return (<div className={className}>
      {label && (<label className="label-text">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>)}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>);
}
const CONTROL_CLASSES = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 ' +
    'transition focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500';
function controlClasses(error) {
    return cn(CONTROL_CLASSES, error
        ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
        : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100');
}
export const Input = forwardRef(function Input({ error, className, ...rest }, ref) {
    return <input ref={ref} className={cn(controlClasses(error), className)} {...rest}/>;
});
export const Textarea = forwardRef(function Textarea({ error, className, rows = 3, ...rest }, ref) {
    return <textarea ref={ref} rows={rows} className={cn(controlClasses(error), 'resize-y', className)} {...rest}/>;
});
export const Select = forwardRef(function Select({ error, className, children, ...rest }, ref) {
    return (<select ref={ref} className={cn(controlClasses(error), 'cursor-pointer pr-8', className)} {...rest}>
      {children}
    </select>);
});
/** Checkbox with an inline label, used by the consent category picker. */
export function Checkbox({ checked, onChange, label, description, disabled, }) {
    return (<label className={cn('flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition', checked ? 'border-brand-400 bg-brand-50/60' : 'border-slate-200 bg-white hover:border-slate-300', disabled && 'cursor-not-allowed opacity-60')}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500"/>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-slate-500">{description}</span>}
      </span>
    </label>);
}
