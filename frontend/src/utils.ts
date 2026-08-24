export function formatRupiah(value: number): string {
  return 'Rp' + Math.round(value).toLocaleString('id-ID');
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
