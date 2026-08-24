interface Props {
  label: string;
  value: string;
  accent?: boolean;
}

export function KpiCard({ label, value, accent }: Props) {
  return (
    <div className={`kpi-card${accent ? ' kpi-card-accent' : ''}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}
