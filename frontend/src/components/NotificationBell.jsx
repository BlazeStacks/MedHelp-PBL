import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationsApi } from '../services/apiEndpoints';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';
import { formatRelative } from '../utils/format';
/**
 * Polls for unread notifications and shows a dropdown.
 *
 * <p>Polling every 30 seconds is plenty for a prototype and avoids a websocket
 * layer that would add complexity without changing the outcome.
 */
export function NotificationBell() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const navigate = useNavigate();
    const notificationsPath = user?.role === 'PATIENT' ? '/patient/notifications' : '/doctor/requests';
    const load = async () => {
        try {
            const summary = await notificationsApi.list();
            setItems(summary.items.slice(0, 8));
            setUnread(summary.unread);
        }
        catch {
            // A notification fetch failure must never disrupt the surrounding page.
        }
    };
    useEffect(() => {
        void load();
        const timer = window.setInterval(() => void load(), 30_000);
        return () => window.clearInterval(timer);
    }, []);
    // Dismiss the dropdown when clicking anywhere outside it.
    useEffect(() => {
        if (!open)
            return;
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);
    const markAllRead = async () => {
        try {
            await notificationsApi.markAllRead();
            await load();
        }
        catch {
            // Ignore: the badge will simply refresh on the next poll.
        }
    };
    const openNotification = async (item) => {
        setOpen(false);
        if (!item.read) {
            try {
                await notificationsApi.markRead(item.id);
                await load();
            }
            catch {
                // Ignore.
            }
        }
        if (item.link)
            navigate(item.link);
    };
    return (<div className="relative" ref={containerRef}>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`} className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
        <Bell className="h-5 w-5"/>
        {unread > 0 && (<span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>)}
      </button>

      {open && (<div className="animate-in absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
            {unread > 0 && (<button type="button" onClick={markAllRead} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
                <CheckCheck className="h-3.5 w-3.5"/>
                Mark all read
              </button>)}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (<p className="px-4 py-8 text-center text-sm text-slate-500">You are all caught up.</p>)}
            {items.map((item) => (<button key={item.id} type="button" onClick={() => void openNotification(item)} className={cn('block w-full border-b border-slate-50 px-4 py-3 text-left transition last:border-0 hover:bg-slate-50', !item.read && 'bg-brand-50/40')}>
                <div className="flex items-start gap-2">
                  {!item.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"/>}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{item.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{item.message}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{formatRelative(item.createdAt)}</p>
                  </div>
                </div>
              </button>))}
          </div>

          <Link to={notificationsPath} onClick={() => setOpen(false)} className="block border-t border-slate-200 px-4 py-3 text-center text-xs font-medium text-brand-600 hover:bg-slate-50">
            View all
          </Link>
        </div>)}
    </div>);
}
