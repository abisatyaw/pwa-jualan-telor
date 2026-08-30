export function formatRupiah(value: number): string {
  return 'Rp' + Math.round(value).toLocaleString('id-ID');
}

// Quantities (kg, kotak, karung) are shown with a fixed 3 decimal places
// everywhere (FB-007 / GEN-003), so small differences stay visible.
export function formatQty(value: number): string {
  return value.toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

export function formatDate(value: string): string {
  if (!value) return '-';
  const d = new Date(value + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function formatDateTime(value: string): string {
  if (!value) return '-';
  const d = new Date(value.endsWith('Z') ? value : value + 'Z');
  return (
    d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  );
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const ID_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

// Dashboard chart buckets arrive as sortable keys — "2026-08" (month bucket),
// "2026-08-15" (day bucket) or "15-08-2026" (week-start). Render them in the
// Indonesian format used everywhere else (FB-004). `short` trims for axis ticks.
export function formatBucketLabel(label: string, short = false): string {
  const iso = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(label);
  const dmy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(label);
  let year: string;
  let monthNum: number;
  let day: string | undefined;
  if (iso) {
    [, year, , day] = iso;
    monthNum = Number(iso[2]);
  } else if (dmy) {
    [, day, , year] = dmy;
    monthNum = Number(dmy[2]);
  } else {
    return label;
  }
  const name = ID_MONTHS[monthNum - 1];
  if (!name) return label;
  const month = short ? name.slice(0, 3) : name;
  if (!day) return `${month} ${year}`;
  return short ? `${Number(day)} ${month}` : `${Number(day)} ${month} ${year}`;
}
