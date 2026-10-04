import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '../utils/cn';
const ToastContext = createContext(null);
let nextId = 1;
/** Lightweight toast system used for every success/error message in the app. */
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const dismiss = useCallback((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);
    const show = useCallback((kind, title, message) => {
        const id = nextId++;
        setToasts((current) => [...current, { id, kind, title, message }]);
        // Errors linger a little longer since they usually need reading.
        window.setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 4200);
    }, [dismiss]);
    const value = useMemo(() => ({
        show,
        success: (title, message) => show('success', title, message),
        error: (title, message) => show('error', title, message),
        info: (title, message) => show('info', title, message),
        warning: (title, message) => show('warning', title, message),
    }), [show]);
    return (<ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-100 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (<ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)}/>))}
      </div>
    </ToastContext.Provider>);
}
const KIND_STYLES = {
    success: {
        ring: 'border-emerald-200 bg-emerald-50',
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-600"/>,
    },
    error: {
        ring: 'border-red-200 bg-red-50',
        icon: <XCircle className="h-5 w-5 text-red-600"/>,
    },
    warning: {
        ring: 'border-amber-200 bg-amber-50',
        icon: <AlertTriangle className="h-5 w-5 text-amber-600"/>,
    },
    info: {
        ring: 'border-brand-200 bg-brand-50',
        icon: <Info className="h-5 w-5 text-brand-600"/>,
    },
};
function ToastCard({ toast, onDismiss }) {
    const style = KIND_STYLES[toast.kind];
    return (<div role="status" className={cn('animate-in pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-lg shadow-slate-900/5', style.ring)}>
      <span className="mt-0.5 shrink-0">{style.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{toast.title}</p>
        {toast.message && <p className="mt-0.5 text-sm text-slate-600">{toast.message}</p>}
      </div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss notification" className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-white/70 hover:text-slate-600">
        <X className="h-4 w-4"/>
      </button>
    </div>);
}
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used inside a ToastProvider');
    }
    return context;
}
