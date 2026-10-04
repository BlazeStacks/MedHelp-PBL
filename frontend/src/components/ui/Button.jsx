import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
const VARIANTS = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-700 shadow-sm',
    secondary: 'bg-slate-800 text-white hover:bg-slate-900 focus-visible:outline-slate-900 shadow-sm',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-700 shadow-sm',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-emerald-700 shadow-sm',
};
const SIZES = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-11 px-5 text-sm gap-2',
};
export const Button = forwardRef(function Button({ variant = 'primary', size = 'md', loading, icon, fullWidth, className, children, disabled, ...rest }, ref) {
    return (<button ref={ref} disabled={disabled || loading} className={cn('inline-flex items-center justify-center rounded-lg font-medium transition-colors', 'disabled:cursor-not-allowed disabled:opacity-50', VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)} {...rest}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : icon}
      {children}
    </button>);
});
