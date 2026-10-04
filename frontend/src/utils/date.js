/** Today as yyyy-MM-dd, matching the ISO date format the API expects. */
export function todayIso() {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}
/** Groups timeline entries by year, newest first, for the timeline view. */
export function groupByYear(entries) {
    const groups = new Map();
    for (const entry of entries) {
        const year = entry.date?.slice(0, 4) ?? 'Unknown';
        const bucket = groups.get(year) ?? [];
        bucket.push(entry);
        groups.set(year, bucket);
    }
    return [...groups.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([year, items]) => ({
        year,
        items: [...items].sort((a, b) => b.date.localeCompare(a.date)),
    }));
}
