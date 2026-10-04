import { FileText } from 'lucide-react';
import { RecordTypeIcon } from '../RecordTypeIcon';
import { RecordTypeBadge } from '../ui/Badge';
import { formatDate } from '../../utils/format';
/** One entry on the medical timeline. */
export function TimelineEntryRow({ entry, onClick, }) {
    return (<div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Connecting line */}
      <div className="absolute left-5 top-11 h-[calc(100%-2.75rem)] w-px bg-slate-200 last:hidden"/>

      <RecordTypeIcon type={entry.type}/>

      <button type="button" onClick={onClick} disabled={!onClick} className="surface min-w-0 flex-1 p-4 text-left transition enabled:hover:border-brand-300 enabled:hover:shadow-md disabled:cursor-default">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{entry.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <RecordTypeBadge type={entry.type} label={entry.typeLabel}/>
              {entry.subtitle && <span className="text-xs text-slate-500">{entry.subtitle}</span>}
            </div>
          </div>
          <span className="shrink-0 text-xs font-medium text-slate-500">{formatDate(entry.date)}</span>
        </div>

        {entry.summary && (<p className="mt-2 line-clamp-2 text-sm text-slate-600">{entry.summary}</p>)}

        {(entry.documentCount > 0 || entry.facility) && (<div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {entry.documentCount > 0 && (<span className="inline-flex items-center gap-1">
                <FileText className="h-3.5 w-3.5"/>
                {entry.documentCount} document{entry.documentCount > 1 ? 's' : ''}
              </span>)}
            {entry.facility && <span>{entry.facility}</span>}
          </div>)}
      </button>
    </div>);
}
