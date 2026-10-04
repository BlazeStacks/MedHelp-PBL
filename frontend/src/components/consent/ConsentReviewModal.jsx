import { useEffect, useState } from 'react';
import { Check, ShieldCheck, ShieldX } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Checkbox, Field, Select, Textarea } from '../ui/Field';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import { formatDateTime, initials } from '../../utils/format';
import { ALL_CATEGORIES, CATEGORY_DESCRIPTIONS, CATEGORY_LABELS, DURATION_LABELS, } from '../../types';
/**
 * The patient's decision screen for one access request.
 *
 * <p>This is the interface that makes the project's core idea real: the patient
 * chooses between sharing everything and sharing a specific set of categories,
 * and separately chooses how long that access lasts. Nothing here is advisory —
 * the values are sent to the backend, which is what actually enforces them.
 */
export function ConsentReviewModal({ grant, open, onClose, onApprove, onDeny, busy, }) {
    const [shareAll, setShareAll] = useState(false);
    const [selected, setSelected] = useState([]);
    const [duration, setDuration] = useState('TWENTY_FOUR_HOURS');
    const [denyReason, setDenyReason] = useState('');
    const [showDenyForm, setShowDenyForm] = useState(false);
    // Reset the form each time a different request is opened.
    useEffect(() => {
        if (!open)
            return;
        setShareAll(false);
        // Pre-tick the categories the doctor asked for, as a helpful starting point.
        setSelected(grant?.permissions ?? []);
        setDuration('TWENTY_FOUR_HOURS');
        setDenyReason('');
        setShowDenyForm(false);
    }, [open, grant]);
    if (!grant)
        return null;
    const toggle = (category) => {
        setSelected((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);
    };
    const canApprove = shareAll || selected.length > 0;
    return (<Modal open={open} onClose={onClose} size="lg" title="Access request" description="Decide what this doctor can see, and for how long." footer={showDenyForm ? (<>
            <Button variant="outline" onClick={() => setShowDenyForm(false)} disabled={busy}>
              Back
            </Button>
            <Button variant="danger" onClick={() => onDeny(denyReason)} loading={busy} icon={<ShieldX className="h-4 w-4"/>}>
              Confirm denial
            </Button>
          </>) : (<>
            <Button variant="outline" onClick={() => setShowDenyForm(true)} disabled={busy} icon={<ShieldX className="h-4 w-4"/>}>
              Deny
            </Button>
            <Button onClick={() => onApprove({ accessAll: shareAll, permissions: selected, duration })} disabled={!canApprove} loading={busy} icon={<ShieldCheck className="h-4 w-4"/>}>
              Approve access
            </Button>
          </>)}>
      {showDenyForm ? (<div className="space-y-4">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">
              Denying means {grant.doctorName} keeps no access to your records.
            </p>
            <p className="mt-1 text-sm text-red-700">
              They can send a new request later, but they will need your approval again.
            </p>
          </div>
          <Field label="Reason (optional)" hint="Only shared with the requesting doctor.">
            <Textarea rows={3} value={denyReason} onChange={(event) => setDenyReason(event.target.value)} placeholder="e.g. I would prefer to see a specialist first."/>
          </Field>
        </div>) : (<div className="space-y-5">
          {/* Who is asking */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {initials(grant.doctorName)}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">{grant.doctorName}</p>
              <p className="text-xs text-slate-500">
                {[grant.doctorSpecialization, grant.doctorHospital].filter(Boolean).join(' · ') ||
                'Doctor on MedHelp'}
              </p>
              {grant.reason && (<p className="mt-2 rounded-lg bg-white p-2.5 text-sm text-slate-600 ring-1 ring-slate-200">
                  “{grant.reason}”
                </p>)}
              <p className="mt-2 text-[11px] text-slate-400">
                Requested {formatDateTime(grant.createdAt)}
              </p>
            </div>
          </div>

          {/* Everything vs. specific categories */}
          <div>
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-800">Which records should they see?</h3>
              <button type="button" onClick={() => {
                setShareAll((value) => !value);
                if (!shareAll)
                    setSelected([...ALL_CATEGORIES]);
            }} className={cn('rounded-lg border px-2.5 py-1 text-xs font-medium transition', shareAll
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50')}>
                {shareAll ? 'Sharing everything' : 'Share everything'}
              </button>
            </div>

            {shareAll ? (<div className="rounded-xl border border-brand-200 bg-brand-50/70 p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-brand-800">
                  <Check className="h-4 w-4"/>
                  All medical records will be shared
                </p>
                <p className="mt-1 text-sm text-brand-700">
                  This includes consultations, prescriptions, diagnostic reports, allergies and
                  medical history. Clear the selection above to share only specific categories instead.
                </p>
              </div>) : (<div className="grid gap-2 sm:grid-cols-2">
                {ALL_CATEGORIES.map((category) => (<Checkbox key={category} checked={selected.includes(category)} onChange={() => toggle(category)} label={<span className="flex items-center gap-2">
                        {CATEGORY_LABELS[category]}
                        {/* Show which categories the doctor actually asked for. */}
                        {grant.permissions?.includes(category) && (<Badge tone="amber" className="text-[10px]">
                            requested
                          </Badge>)}
                      </span>} description={CATEGORY_DESCRIPTIONS[category]}/>))}
              </div>)}

            {!shareAll && selected.length === 0 && (<p className="mt-2 text-xs font-medium text-amber-600">
                Select at least one category, or choose to share everything.
              </p>)}
          </div>

          {/* Duration */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <Field label="How long should this access last?" hint="Access stops working automatically when the time is up, even if you forget about it.">
              <Select value={duration} onChange={(event) => setDuration(event.target.value)}>
                {Object.keys(DURATION_LABELS).map((key) => (<option key={key} value={key}>
                    {DURATION_LABELS[key]}
                  </option>))}
              </Select>
            </Field>
          </div>

          {/* Plain-language summary of the decision */}
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</p>
            <p className="mt-1.5 text-sm text-slate-700">
              <span className="font-medium">{grant.doctorName}</span> will be able to view{' '}
              {shareAll ? (<span className="font-medium">all of your medical records</span>) : (<span className="font-medium">
                  {selected.length === 0
                    ? 'nothing yet'
                    : selected.map((category) => CATEGORY_LABELS[category]).join(', ')}
                </span>)}{' '}
              for <span className="font-medium">{DURATION_LABELS[duration]}</span>. You can revoke this at any
              time from Doctors &amp; Access.
            </p>
          </div>
        </div>)}
    </Modal>);
}
