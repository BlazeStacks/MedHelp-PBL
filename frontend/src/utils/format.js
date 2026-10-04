import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
/** Formats an ISO date (yyyy-MM-dd or full timestamp) for display. */
export function formatDate(value, pattern = 'd MMM yyyy') {
    if (!value)
        return '—';
    try {
        return format(parseISO(value), pattern);
    }
    catch {
        return value;
    }
}
export function formatDateTime(value) {
    return formatDate(value, 'd MMM yyyy, h:mm a');
}
/** "3 hours", "in 2 days" — used for access expiry badges. */
export function formatRelative(value) {
    if (!value)
        return '—';
    try {
        return formatDistanceToNowStrict(parseISO(value), { addSuffix: true });
    }
    catch {
        return value;
    }
}
/** Turns a remaining-seconds count into "23h 40m" / "6d 4h". */
export function formatRemaining(seconds) {
    if (seconds == null || seconds <= 0)
        return 'expired';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0)
        return `${days}d ${hours}h`;
    if (hours > 0)
        return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}
export function formatBytes(bytes) {
    if (!bytes)
        return '—';
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
/** "Dr. Rohan Sharma" -> "RS"; used by the avatar circles. */
export function initials(name) {
    if (!name)
        return '?';
    const parts = name.replace(/^Dr\.?\s*/i, '').trim().split(/\s+/);
    if (parts.length === 0)
        return '?';
    if (parts.length === 1)
        return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
export function titleCase(value) {
    return value
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
