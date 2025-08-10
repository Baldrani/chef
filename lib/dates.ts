export function parseDateOnlyToUtcNoon(dateYmd: string): Date {
    // dateYmd is YYYY-MM-DD. Create a Date at 12:00:00 UTC to avoid TZ/DST shifting the calendar day
    const [y, m, d] = dateYmd.split("-").map(n => parseInt(n, 10));
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
}

export function formatUtcYmd(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export function enumerateUtcYmdInclusive(startIso: string, endIso: string): string[] {
    const start = new Date(startIso);
    const end = new Date(endIso);
    // normalize to UTC 12:00 before iterating
    const days: string[] = [];
    let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), 12, 0, 0, 0));
    const endNoon = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 12, 0, 0, 0));
    while (cursor.getTime() <= endNoon.getTime()) {
        days.push(formatUtcYmd(cursor));
        cursor = new Date(cursor.getTime() + 24 * 3600 * 1000);
    }
    return days;
}

export function formatHumanDate(dateIso: string, locale?: string): string {
    const d = new Date(dateIso);
    const fmt = new Intl.DateTimeFormat(locale || undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
    });
    return fmt.format(d);
}

export function formatHumanYmd(ymd: string, locale?: string): string {
    const [y, m, d] = ymd.split("-").map(v => parseInt(v, 10));
    const date = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12, 0, 0));
    const fmt = new Intl.DateTimeFormat(locale || undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
    });
    return fmt.format(date);
}
