import { Check, Lock, X } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import { formatDateTime, formatRemaining } from '../../utils/format';
import { ALL_CATEGORIES, CATEGORY_DESCRIPTIONS, CATEGORY_LABELS } from '../../types';
/**
 * Shows a doctor precisely what they may and may not see for one patient.
 *
 * <p>This panel is explanatory, not authoritative: the backend independently
 * re-checks every record request against the same grant, so a doctor who
 * bypassed this UI would still be refused.
 */
export function PermissionPanel({ access }) {
    return (<div className="surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">Your access to this patient</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {access.hasAccess
            ? 'These are the categories the patient approved.'
            : 'This patient has not granted you access to any records.'}
          </p>
        </div>
        {access.hasAccess ? (<div className="flex flex-wrap items-center gap-2">
            {access.accessAll && <Badge tone="brand">All records shared</Badge>}
            {access.expiresAt && (<Badge tone="sky">
                Expires {formatDateTime(access.expiresAt)}
              </Badge>)}
          </div>) : (<Badge tone="red">
            <Lock className="h-3.5 w-3.5"/>
            No access
          </Badge>)}
      </div>

      <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_CATEGORIES.map((category) => {
            const permitted = access.hasAccess && (access.accessAll || access.permissions.includes(category));
            return (<div key={category} className={cn('flex items-start gap-2.5 rounded-lg border p-3', permitted ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-slate-50')}>
              <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full', permitted ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-white')}>
                {permitted ? <Check className="h-3 w-3"/> : <X className="h-3 w-3"/>}
              </span>
              <div className="min-w-0">
                <p className={cn('text-sm font-medium', permitted ? 'text-emerald-900' : 'text-slate-500')}>
                  {CATEGORY_LABELS[category]}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{CATEGORY_DESCRIPTIONS[category]}</p>
              </div>
            </div>);
        })}
      </div>

      {access.hasAccess && access.expiresAt && (<div className="border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-500">
            Access ends automatically in{' '}
            <span className="font-medium text-slate-700">
              {formatRemaining(Math.max(0, Math.floor((new Date(access.expiresAt).getTime() - Date.now()) / 1000)))}
            </span>
            . The patient can revoke it sooner at any time.
          </p>
        </div>)}
    </div>);
}
