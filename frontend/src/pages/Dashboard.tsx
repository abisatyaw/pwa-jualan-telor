import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../api/client';
import { KpiCard } from '../components/KpiCard';
import { PageTabs, usePageTab, type TabDef } from '../components/PageTabs';
import { PaymentDialog } from '../components/PaymentDialog';
import type { DashboardOverview, EggPrice, Period, ReceivableRow } from '../types';
import { formatBucketLabel, formatDate, formatDateTime, formatQty, formatRupiah, todayIso } from '../utils';

const DASH_TABS: TabDef[] = [
  { key: 'ringkasan', label: 'Ringkasan' },
  { key: 'produksi', label: 'Produksi' },
  { key: 'stok', label: 'Stok' },
];

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'week', label: 'Minggu Ini' },
  { value: 'month', label: 'Bulan Ini' },
  { value: 'year', label: 'Tahun Ini' },
  { value: 'custom', label: 'Kustom' },
];

function shortKg(v: number): string {
  return v.toLocaleString('id-ID');
}

export function Dashboard() {
  const [tab, setTab] = usePageTab(DASH_TABS);
  const [period, setPeriod] = useState<Period>('month');
  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState(todayIso());
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<ReceivableRow | null>(null);
  const [refreshingPrices, setRefreshingPrices] = useState(false);

  function load() {
    if (period === 'custom' && (!from || !to)) return;
    setLoading(true);
    setError(null);
    api
      .dashboard({ period, from: period === 'custom' ? from : undefined, to: period === 'custom' ? to : undefined })
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, from, to]);

  async function handlePayment(paidAmount: number) {
    if (!paymentTarget) return;
    await api.sales.recordPayment(paymentTarget.sale_id, paidAmount);
    setPaymentTarget(null);
    load();
  }

  async function handleRefreshPrices() {
    if (!data) return;
    setRefreshingPrices(true);
    try {
      const egg_prices = await api.eggPrices.refresh();
      setData({ ...data, stock: { ...data.stock, egg_prices } });
    } finally {
      setRefreshingPrices(false);
    }
  }

  const weeklyGroups = data
    ? Array.from(new Set(data.weekly_transactions.map((r) => r.week_label))).map((label) => ({
        label,
        rows: data.weekly_transactions.filter((r) => r.week_label === label),
        total: data.weekly_transactions.filter((r) => r.week_label === label).reduce((s, r) => s + r.amount, 0),
      }))
    : [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="quick-actions">
        <Link to="/transaksi/new" className="btn btn-secondary">+ Transaksi</Link>
        <Link to="/produksi/new" className="btn btn-secondary">+ Produksi</Link>
        <Link to="/penjualan/new" className="btn btn-secondary">+ Penjualan</Link>
        <Link to="/aset/status/new" className="btn btn-secondary">+ Update Status</Link>
      </div>

      <div className="filter-bar">
        <select className="form-control" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        {period === 'custom' && (
          <>
            <input className="form-control" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input className="form-control" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </>
        )}
      </div>

      <PageTabs tabs={DASH_TABS} active={tab} onChange={setTab} />

      {error && <p className="error-text">{error}</p>}
      {loading || !data ? (
        <p>Memuat...</p>
      ) : (
        <>
          {tab === 'ringkasan' && (
            <div className="kpi-grid">
              <KpiCard label="Total Penjualan" value={formatRupiah(data.sales_total)} accent />
              <KpiCard label="Total Biaya" value={formatRupiah(data.expense_total)} />
              <KpiCard label="Estimasi Margin" value={formatRupiah(data.sales_total - data.expense_total)} />
              <KpiCard label="Total Produksi" value={`${formatQty(data.production.total_kg)} Kg`} />
              <KpiCard label="Piutang Pelanggan" value={formatRupiah(data.total_receivable)} />
              <KpiCard label="Saldo Hutang" value={formatRupiah(data.debts_outstanding)} />
            </div>
          )}

          {tab === 'produksi' && (
          <>
          {/* 1. Produksi telur */}
          <div className="chart-section">
            <h2>Produksi Telur</h2>
            <div className="kpi-grid kpi-grid-4">
              <KpiCard label="Total (Periode)" value={`${formatQty(data.production.total_kg)} Kg`} accent />
              {Object.entries(data.production.by_group).map(([group, kg]) => (
                <KpiCard key={group} label={group} value={`${formatQty(kg)} Kg`} />
              ))}
            </div>
            {data.production.trend.length === 0 ? (
              <div className="empty-state">Belum ada data produksi.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.production.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tickFormatter={(l) => formatBucketLabel(l, true)}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tickFormatter={shortKg} tick={{ fontSize: 12 }} width={50} />
                  <Tooltip
                    formatter={(v) => `${formatQty(Number(v))} Kg`}
                    labelFormatter={(l) => formatBucketLabel(String(l))}
                  />
                  <Line
                    type="monotone"
                    dataKey="quantity_kg"
                    stroke="#b45309"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            <h3 style={{ marginTop: 16 }}>Produksi per Minggu</h3>
            {data.production.weekly.length === 0 ? (
              <div className="empty-state">Belum ada data produksi.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.production.weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="week_label" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={shortKg} tick={{ fontSize: 12 }} width={50} />
                  <Tooltip formatter={(v) => `${formatQty(Number(v))} Kg`} />
                  <Bar dataKey="total_kg" fill="#b45309" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 1b. FCR & HDP */}
          <div className="chart-section">
            <div className="kpi-grid kpi-grid-4">
              <KpiCard
                label="FCR (Periode)"
                value={data.fcr.value == null ? '—' : data.fcr.value.toLocaleString('id-ID')}
                accent
              />
              <KpiCard
                label="HDP Rata-rata"
                value={data.hdp.value == null ? '—' : `${data.hdp.value.toLocaleString('id-ID')}%`}
              />
            </div>

            <h3>Tren FCR (pakan kg / telur kg)</h3>
            {data.fcr.trend.length === 0 ? (
              <div className="empty-state">Belum cukup data pakan & produksi.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.fcr.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tickFormatter={(l) => formatBucketLabel(l, true)} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={44} />
                  <Tooltip labelFormatter={(l) => formatBucketLabel(String(l))} />
                  {data.fcr.target != null && (
                    <ReferenceLine y={data.fcr.target} stroke="#16a34a" strokeDasharray="4 4" label={`Target ${data.fcr.target}`} />
                  )}
                  <Line type="monotone" dataKey="value" stroke="#b45309" strokeWidth={2} dot isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}

            <h3 style={{ marginTop: 16 }}>Tren HDP (%)</h3>
            {data.hdp.trend.length === 0 ? (
              <div className="empty-state">Belum ada data ayam & produksi.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.hdp.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tickFormatter={(l) => formatBucketLabel(l, true)} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={44} domain={[0, 100]} />
                  <Tooltip formatter={(v) => `${v}%`} labelFormatter={(l) => formatBucketLabel(String(l))} />
                  <ReferenceLine y={data.hdp.target} stroke="#16a34a" strokeDasharray="4 4" label={`Target ${data.hdp.target}%`} />
                  <Line type="monotone" dataKey="value" stroke="#b45309" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          </>
          )}

          {tab === 'ringkasan' && (
          <>
          {/* 2. Transaksi mingguan */}
          <div className="chart-section">
            <h2>Transaksi Mingguan (8 Minggu Terakhir)</h2>
            {weeklyGroups.length === 0 ? (
              <div className="empty-state">Belum ada transaksi.</div>
            ) : (
              weeklyGroups.map((week) => (
                <div key={week.label} className="card">
                  <div className="card-row">
                    <span className="card-title">Minggu {formatBucketLabel(week.label)}</span>
                    <strong>{formatRupiah(week.total)}</strong>
                  </div>
                  <ul className="rank-list">
                    {week.rows.map((r) => (
                      <li key={r.category}>
                        <span>{r.category}</span>
                        <span>{formatRupiah(r.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>

          {/* 3. Piutang pelanggan */}
          <div className="chart-section">
            <h2>Pelanggan Masih Hutang</h2>
            {data.receivables.length === 0 ? (
              <div className="empty-state">Semua pelanggan sudah lunas.</div>
            ) : (
              data.receivables.map((r) => (
                <div className="card" key={r.sale_id}>
                  <div className="card-row">
                    <div>
                      <div className="card-title">{r.buyer_name}</div>
                      <div className="card-subtitle">{formatDate(r.sale_date)}</div>
                    </div>
                    <span className="badge badge-hutang">{formatRupiah(r.remaining_amount)}</span>
                  </div>
                  <div className="card-row" style={{ marginTop: 8 }}>
                    <span className="card-subtitle">
                      Total {formatRupiah(r.total_price)} · Dibayar {formatRupiah(r.paid_amount)}
                    </span>
                    <button className="btn btn-secondary" onClick={() => setPaymentTarget(r)}>
                      Update
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          </>
          )}

          {tab === 'stok' && (
          <>
          {/* 4 & 5. Stock & harga referensi */}
          <div className="chart-section">
            <h2>Posisi Stock Telur Hari Ini</h2>
            <div className="kpi-grid kpi-grid-4">
              <KpiCard label="Stock (Kg)" value={`${formatQty(data.stock.stock_kg)} Kg`} accent />
              <KpiCard label="Stock (Kotak)" value={`${formatQty(data.stock.stock_kotak)} Kotak`} />
              <KpiCard label="Total Produksi" value={`${formatQty(data.stock.total_production_kg)} Kg`} />
              <KpiCard label="Total Beli - Jual" value={`${formatQty(data.stock.total_purchased_kg - data.stock.total_sold_kg)} Kg`} />
            </div>
            <p className="hint-text">1 kotak = 15 Kg. Stock = total produksi + pembelian telor - penjualan telor (akumulasi).</p>

            <div className="chart-section-head" style={{ marginTop: 16 }}>
              <h2>Referensi Harga Telur Hari Ini</h2>
              <button className="btn btn-secondary" onClick={handleRefreshPrices} disabled={refreshingPrices}>
                {refreshingPrices ? 'Memuat...' : '🔄 Refresh'}
              </button>
            </div>
            <div className="price-source-grid">
              {data.stock.egg_prices.map((p) => (
                <EggPriceCard key={p.source_key} price={p} />
              ))}
            </div>
            <p className="hint-text">
              Sumber pihak ketiga bisa berubah struktur halaman sewaktu-waktu sehingga pengambilan otomatis bisa gagal — jika begitu, buka sumber secara manual.
            </p>
          </div>
          </>
          )}
        </>
      )}

      <PaymentDialog
        open={!!paymentTarget}
        title={`Update Pembayaran - ${paymentTarget?.buyer_name ?? ''}`}
        total={paymentTarget?.total_price ?? 0}
        currentPaid={paymentTarget?.paid_amount ?? 0}
        onConfirm={handlePayment}
        onCancel={() => setPaymentTarget(null)}
      />
    </div>
  );
}

function EggPriceCard({ price }: { price: EggPrice }) {
  return (
    <div className="price-source-card">
      <div className="price-source-label">{price.label}</div>
      {price.status === 'ok' ? (
        <div className="price-source-value">{price.price_text}</div>
      ) : (
        <div className="price-source-value" style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
          Gagal mengambil
        </div>
      )}
      <div className="price-source-meta">{price.fetched_at ? formatDateTime(price.fetched_at) : 'Belum pernah diambil'}</div>
      <a className="price-source-link" href={price.url} target="_blank" rel="noreferrer">
        Buka sumber ↗
      </a>
    </div>
  );
}
