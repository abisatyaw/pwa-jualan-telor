import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { KpiCard } from '../components/KpiCard';
import type { Transaction } from '../types';
import { formatDate, formatRupiah } from '../utils';

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setTransactions(
        await api.transactions.list({
          category: category || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        })
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, dateFrom, dateTo]);

  const categories = Array.from(new Set(transactions.map((t) => t.category)));
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  async function handleDelete() {
    if (!deleteTarget) return;
    await api.transactions.remove(deleteTarget.id);
    setDeleteTarget(null);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Transaksi Harian</h1>
        <Link to="/transaksi/new" className="btn btn-primary">
          + Catat Transaksi
        </Link>
      </div>

      <div className="filter-bar">
        <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input className="form-control" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input className="form-control" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: '1fr' }}>
        <KpiCard label="Total Biaya (sesuai filter)" value={formatRupiah(total)} accent />
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p>Memuat...</p>
      ) : transactions.length === 0 ? (
        <div className="empty-state">Belum ada transaksi.</div>
      ) : (
        <>
          <div className="list-cards">
            {transactions.map((t) => (
              <div className="card" key={t.id}>
                <Link to={`/transaksi/${t.id}`} className="link-plain">
                  <div className="card-row">
                    <div>
                      <div className="card-title">{t.category}</div>
                      <div className="card-subtitle">
                        {formatDate(t.transaction_date)}
                        {t.qty ? ` · ${t.qty} ${t.qty_unit ?? ''}` : ''}
                      </div>
                    </div>
                    <strong>{formatRupiah(t.amount)}</strong>
                  </div>
                  {t.qty_per_group !== null && (
                    <div className="card-subtitle" style={{ marginTop: 6 }}>
                      {t.feed_type ? `${t.feed_type} · ` : ''}
                      Per kelompok: {t.qty_per_group} Kg (FCR)
                    </div>
                  )}
                </Link>
                <div className="card-actions" style={{ marginTop: 8 }}>
                  <button className="btn-icon" onClick={() => setDeleteTarget(t)}>
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kategori</th>
                  <th className="num">Qty</th>
                  <th className="num">Biaya</th>
                  <th>Catatan</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{formatDate(t.transaction_date)}</td>
                    <td>
                      {t.category}
                      {t.feed_type ? ` (${t.feed_type})` : ''}
                    </td>
                    <td className="num">{t.qty ? `${t.qty} ${t.qty_unit ?? ''}` : '-'}</td>
                    <td className="num">{formatRupiah(t.amount)}</td>
                    <td>{t.notes || '-'}</td>
                    <td>
                      <div className="card-actions">
                        <Link to={`/transaksi/${t.id}`} className="btn-icon">
                          ✏️
                        </Link>
                        <button className="btn-icon" onClick={() => setDeleteTarget(t)}>
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Hapus transaksi "${deleteTarget?.category}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
