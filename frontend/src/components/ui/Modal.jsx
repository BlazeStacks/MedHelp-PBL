import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
const SIZES = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};
/** Modal used for the consent review, record details and forms. */
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
    // Close on Escape, and stop the page behind from scrolling.
    useEffect(() => {
        if (!open)
            return;
        const onKeyDown = (event) => {
            if (event.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, onClose]);
    if (!open)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div role="dialog" aria-modal="true" aria-label={title} className={cn('animate-in w-full rounded-t-2xl bg-white shadow-xl sm:rounded-2xl', SIZES[size])}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-800">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5"/>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>

        {footer && (<div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
            {footer}
          </div>)}
      </div>
    </div>);
}
/** Small confirmation dialog for destructive or irreversible actions. */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', confirmVariant = 'danger', loading, }) {
    return (<Modal open={open} onClose={onClose} title={title} size="sm" footer={<>
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className={cn('h-10 rounded-lg px-4 text-sm font-medium text-white transition disabled:opacity-50', confirmVariant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700')}>
            {loading ? 'Working…' : confirmLabel}
          </button>
        </>}>
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>);
}
