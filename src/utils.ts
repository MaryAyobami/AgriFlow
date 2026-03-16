/**
 * Converts an array of objects to a CSV string and triggers a browser download.
 */
export function downloadCSV(data: Record<string, any>[], filename: string) {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
        headers.map(h => {
            const val = row[h] ?? '';
            // Wrap in quotes if value contains comma, newline, or quote
            const str = String(val);
            return str.includes(',') || str.includes('\n') || str.includes('"')
                ? `"${str.replace(/"/g, '""')}"`
                : str;
        }).join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Groups an array of objects by a key's month (ISO date string).
 * Returns an array of { month: 'Jan', ...sums } objects.
 */
export function groupByMonth<T extends Record<string, any>>(
    items: T[],
    dateKey: string,
    sumKeys: string[]
): Record<string, any>[] {
    const groups: Record<string, Record<string, any>> = {};
    for (const item of items) {
        const date = new Date(item[dateKey]);
        const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (!groups[label]) {
            groups[label] = { month: label, ...Object.fromEntries(sumKeys.map(k => [k, 0])) };
        }
        for (const k of sumKeys) {
            groups[label][k] = (groups[label][k] || 0) + (Number(item[k]) || 0);
        }
    }
    return Object.values(groups);
}

/**
 * Calculates days elapsed since a given date string.
 */
export function daysSince(dateStr: string): number {
    return Math.round((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}
