import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { KpiCard } from '../components/KpiCard';
import { PaymentDialog } from '../components/PaymentDialog';
import { useAuth } from '../context/AuthContext';
import type { Debt } from '../types';
import { DEBT_STATUS_LABELS } from '../types';
import { formatDate, formatRupiah } from '../utils';

/**
 * Body of the "Hutang" sub-view (loans the business has taken, e.g. from an investor).
 * Rendered inside the Keuangan destination's tab (see Keuangan); no page header of its own.
 */
export function DebtPanel() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [debts, setDebts] = useState<Debt[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Debt | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<Debt | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setDebts(await api.debts.list({ search: search || undefined }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const totalOutstanding = debts.reduce((sum, d) => sum + d.outstanding, 0);

  async function handleDelete() {
    if (!deleteTarget) return;
    await api.debts.remove(deleteTarget.id);
    setDeleteTarget(null);
    load();
  }

  async function handlePayment(paidAmount: number) {
    if (!paymentTarget) return;
    await api.debts.recordPayment(paymentTarget.id, paidAmount);
    setPaymentTarget(null);
    load();
  }

  return (
    <div>
      <div className="filter-bar">
        <input
          className="form-control"
          placeholder="Cari pemberi hutang..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: '1fr' }}>
        <KpiCard label="Total Saldo Hutang" value={formatRupiah(totalOutstanding)} accent />
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p>Memuat...</p>
      ) : debts.length === 0 ? (
        <div className="empty-state">Belum ada data hutang.</div>
      ) : (
        <>
          <div className="list-cards">
            {debts.map((d) => (
              <div className="card" key={d.id}>
                <Link to={`/hutang/${d.id}`} className="link-plain">
                  <div className="card-row">
                    <div>
                      <div className="card-title">{d.lender_name}</div>
                      <div className="card-subtitle">
                        {formatDate(d.loan_date)}
                        {d.due_date ? ` · Jatuh tempo ${formatDate(d.due_date)}` : ''}
                        {d.interest_rate ? ` · Bunga ${d.interest_rate}%` : ''}
                      </div>
                    </div>
                    <span className={`badge badge-${d.status}`}>{DEBT_STATUS_LABELS[d.status]}</span>
                  </div>
                  <div className="card-row" style={{ marginTop: 8 }}>
                    <span className="card-subtitle">Pokok: {formatRupiah(d.amount)}</span>
                    <span className="card-subtitle">Sisa: {formatRupiah(d.outstanding)}</span>
                  </div>
                </Link>
                <div className="card-actions" style={{ marginTop: 8 }}>
                  {d.status === 'belum_lunas' && (
                    <button className="btn-icon" onClick={() => setPaymentTarget(d)}>
                      💳 Update Bayar
                    </button>
                  )}
                  {isAdmin && (
                    <button className="btn-icon" onClick={() => setDeleteTarget(d)}>
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pemberi Hutang</th>
                  <th>Tgl Pinjam</th>
                  <th>Jatuh Tempo</th>
                  <th className="num">Bunga</th>
                  <th className="num">Pokok</th>
                  <th className="num">Sisa</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {debts.map((d) => (
                  <tr key={d.id}>
                    <td>{d.lender_name}</td>
                    <td>{formatDate(d.loan_date)}</td>
                    <td>{d.due_date ? formatDate(d.due_date) : '-'}</td>
                    <td className="num">{d.interest_rate}%</td>
                    <td className="num">{formatRupiah(d.amount)}</td>
                    <td className="num">{formatRupiah(d.outstanding)}</td>
                    <td>
                      <span className={`badge badge-${d.status}`}>{DEBT_STATUS_LABELS[d.status]}</span>
                    </td>
                    <td>
                      <div className="card-actions">
                        {d.status === 'belum_lunas' && (
                          <button className="btn-icon" onClick={() => setPaymentTarget(d)}>
                            💳
                          </button>
                        )}
                        <Link to={`/hutang/${d.id}`} className="btn-icon">
                          ✏️
                        </Link>
                        {isAdmin && (
                          <button className="btn-icon" onClick={() => setDeleteTarget(d)}>
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <PaymentDialog
        open={!!paymentTarget}
        title={`Update Pembayaran - ${paymentTarget?.lender_name ?? ''}`}
        total={paymentTarget?.amount ?? 0}
        currentPaid={paymentTarget?.paid_amount ?? 0}
        onConfirm={handlePayment}
        onCancel={() => setPaymentTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Hapus data hutang dari "${deleteTarget?.lender_name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
