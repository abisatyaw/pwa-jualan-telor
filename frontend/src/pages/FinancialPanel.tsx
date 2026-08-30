import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { KpiCard } from '../components/KpiCard';
import type { FinancialReport, FinancialStatement } from '../types';
import { formatBucketLabel, formatDate, formatRupiah } from '../utils';

type Key = keyof FinancialStatement;

function Section({
  title,
  rows,
  mtd,
  ytd,
}: {
  title: string;
  rows: [string, Key, boolean?][];
  mtd: FinancialStatement;
  ytd: FinancialStatement;
}) {
  return (
    <div className="chart-section">
      <h2>{title}</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Komponen</th>
              <th className="num">MTD</th>
              <th className="num">YTD</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, key, strong]) => (
              <tr key={key} style={strong ? { fontWeight: 600 } : undefined}>
                <td>{label}</td>
                <td className="num">{formatRupiah(mtd[key] as number)}</td>
                <td className="num">{formatRupiah(ytd[key] as number)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Body of the "Laporan Keuangan" sub-view (formerly the "Performance Financial" page).
 * Rendered inside the Keuangan destination's tab (see Keuangan); no page header of its own.
 */
export function FinancialPanel() {
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .financial()
      .then(setReport)
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!report) return <p>Memuat...</p>;

  const { mtd, ytd, monthly_net_profit } = report;

  return (
    <div>
      <p className="hint-text">
        MTD: {formatDate(mtd.period_from)} – {formatDate(mtd.period_to)} · YTD:{' '}
        {formatDate(ytd.period_from)} – {formatDate(ytd.period_to)}. Laporan manajemen berbasis akrual;
        beberapa angka adalah pendekatan (lihat catatan asumsi di bawah).
      </p>

      <div className="chart-section">
        <h2>Ringkasan</h2>
        <div className="kpi-grid kpi-grid-4">
          <KpiCard label="ROI (YTD)" value={`${ytd.roi_pct.toLocaleString('id-ID')}%`} accent />
          <KpiCard label="Modal Investor" value={formatRupiah(ytd.invested_capital)} />
          <KpiCard label="Laba Bersih YTD" value={formatRupiah(ytd.net_profit)} />
          <KpiCard label="Saldo Kas" value={formatRupiah(ytd.cash_balance)} />
        </div>

        <h3 style={{ marginTop: 12 }}>Tren Laba Bersih per Bulan</h3>
        {monthly_net_profit.length === 0 ? (
          <div className="empty-state">Belum ada data.</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly_net_profit}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tickFormatter={(l) => formatBucketLabel(l, true)} tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `${(v / 1_000_000).toLocaleString('id-ID')}jt`} tick={{ fontSize: 12 }} width={48} />
              <Tooltip formatter={(v) => formatRupiah(Number(v))} labelFormatter={(l) => formatBucketLabel(String(l))} />
              <Bar dataKey="value" fill="#b45309" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <Section
        title="Laba Rugi"
        mtd={mtd}
        ytd={ytd}
        rows={[
          ['Pendapatan penjualan', 'sales_revenue'],
          ['Harga pokok (pakan + pembelian stok)', 'cogs'],
          ['Laba kotor', 'gross_profit', true],
          ['Beban operasional', 'operating_expenses'],
          ['EBITDA', 'ebitda', true],
          ['Beban penyusutan', 'depreciation_expense'],
          ['Laba bersih', 'net_profit', true],
        ]}
      />

      <Section
        title="Arus Kas"
        mtd={mtd}
        ytd={ytd}
        rows={[
          ['Arus kas operasional', 'cf_operating'],
          ['Arus kas investasi', 'cf_investing'],
          ['Arus kas pendanaan', 'cf_financing'],
          ['Kenaikan/penurunan kas bersih', 'net_cash_change', true],
        ]}
      />

      <Section
        title="Neraca (per akhir periode)"
        mtd={mtd}
        ytd={ytd}
        rows={[
          ['Saldo kas', 'cash_balance'],
          ['Piutang', 'accounts_receivable'],
          ['Nilai buku aset', 'asset_book_value'],
          ['Total aset', 'total_assets', true],
          ['Hutang', 'accounts_payable'],
          ['Akumulasi penyusutan', 'accumulated_depreciation'],
          ['Modal disetor', 'paid_in_capital'],
          ['Laba ditahan', 'retained_earnings'],
          ['Total ekuitas', 'total_equity', true],
          ['Total kewajiban & ekuitas', 'total_liabilities_equity', true],
        ]}
      />

      <Section
        title="Rekonsiliasi Bank"
        mtd={mtd}
        ytd={ytd}
        rows={[
          ['Mutasi kas masuk', 'bank_cash_in'],
          ['Mutasi kas keluar', 'bank_cash_out'],
        ]}
      />

      <div className="chart-section">
        <h2>Catatan Asumsi</h2>
        <ul className="hint-text" style={{ paddingLeft: 18, lineHeight: 1.6 }}>
          <li>HPP = pakan + pembelian telor + pembelian ayam. Transaksi lain = beban operasional.</li>
          <li>Penyusutan garis lurus, dialokasikan per bulan yang dilewati.</li>
          <li>Arus kas operasional = laba bersih + penyusutan (tanpa perubahan modal kerja).</li>
          <li>Saldo kas direkonstruksi dari awal: kas awal + modal + pembayaran penjualan + hutang baru − transaksi − pembelian aset − pembayaran hutang.</li>
          <li>Belum ada beban bunga atau pajak. Modal investor & kas awal diatur di Setting.</li>
        </ul>
      </div>
    </div>
  );
}
