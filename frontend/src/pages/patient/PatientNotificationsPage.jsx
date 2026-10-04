import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { PageHeader } from '../../layouts/AppLayout';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, SkeletonList } from '../../components/ui/Feedback';
import { useAsync } from '../../hooks/useAsync';
import { notificationsApi } from '../../services/apiEndpoints';
import { cn } from '../../utils/cn';
import { formatDateTime } from '../../utils/format';
/** In-app notification centre (no email or SMS in the MVP). */
export default function PatientNotificationsPage() {
    const navigate = useNavigate();
    const { data, loading, error, reload } = useAsync(() => notificationsApi.list(), []);
    const items = data?.items ?? [];
    const markAllRead = async () => {
        await notificationsApi.markAllRead();
        reload();
    };
    return (<>
      <PageHeader title="Notifications" description="Access requests, approvals and new records added to your file." action={(data?.unread ?? 0) > 0 ? (<Button variant="outline" onClick={markAllRead} icon={<CheckCheck className="h-4 w-4"/>}>
              Mark all as read
            </Button>) : undefined}/>

      <Card>
        <CardHeader title="All notifications" icon={<Bell className="h-4 w-4"/>} action={data && (<span className="text-xs text-slate-500">
                {data.unread} unread of {items.length}
              </span>)}/>
        <CardBody>
          {loading ? (<SkeletonList rows={5}/>) : error ? (<ErrorState message={error.message} onRetry={reload}/>) : items.length === 0 ? (<EmptyState icon={<Bell className="h-5 w-5"/>} title="No notifications" message="You will be notified here when a doctor requests access or adds something to your records."/>) : (<ul className="divide-y divide-slate-100">
              {items.map((item) => (<li key={item.id}>
                  <button type="button" onClick={async () => {
                    if (!item.read) {
                        await notificationsApi.markRead(item.id);
                        reload();
                    }
                    if (item.link)
                        navigate(item.link);
                }} className={cn('flex w-full items-start gap-3 py-3.5 text-left transition hover:bg-slate-50', !item.read && 'bg-brand-50/30')}>
                    <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', item.read ? 'bg-slate-200' : 'bg-brand-500')}/>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">{item.title}</p>
                      <p className="mt-0.5 text-sm text-slate-600">{item.message}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDateTime(item.createdAt)}</p>
                    </div>
                  </button>
                </li>))}
            </ul>)}
        </CardBody>
      </Card>
    </>);
}
