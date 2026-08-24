import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PaymentDialog } from '../components/PaymentDialog';
import type { Sale } from '../types';
import { PAYMENT_STATUS_LABELS } from '../types';
import { formatDate, formatRupiah } from '../utils';

export function SaleList() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [productType, setProductType] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<Sale | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setSales(
        await api.sales.list({
          product_type: productType || undefined,
          payment_status: paymentStatus || undefined,
          search: search || undefined,
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
  }, [productType, paymentStatus, search]);

  const productTypes = Array.from(new Set(sales.map((s) => s.product_type)));

  async function handleDelete() {
    if (!deleteTarget) return;
    await api.sales.remove(deleteTarget.id);
    setDeleteTarget(null);
    load();
  }

  async function handlePayment(paidAmount: number) {
    if (!paymentTarget) return;
    await api.sales.recordPayment(paymentTarget.id, paidAmount);
    setPaymentTarget(null);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Penjualan</h1>
        <Link to="/penjualan/new" className="btn btn-primary">
          + Catat Penjualan
        </Link>
      </div>

      <div className="filter-bar">
        <input
          className="form-control"
          placeholder="Cari pembeli..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="form-control" value={productType} onChange={(e) => setProductType(e.target.value)}>
          <option value="">Semua Produk</option>
          {productTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select className="form-control" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="lunas">Lunas</option>
          <option value="hutang">Hutang</option>
        </select>
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p>Memuat...</p>
      ) : sales.length === 0 ? (
        <div className="empty-state">Belum ada data penjualan.</div>
      ) : (
        <>
          <div className="list-cards">
            {sales.map((s) => (
              <div className="card" key={s.id}>
                <Link to={`/penjualan/${s.id}`} className="link-plain">
                  <div className="card-row">
                    <div>
                      <div className="card-title">{s.buyer_name}</div>
                      <div className="card-subtitle">
                        {formatDate(s.sale_date)} · {s.product_type} · {s.quantity} {s.unit}
                      </div>
                    </div>
                    <span className={`badge badge-${s.payment_status}`}>
                      {PAYMENT_STATUS_LABELS[s.payment_status]}
                    </span>
                  </div>
                  <div className="card-row" style={{ marginTop: 8 }}>
                    <span className="card-subtitle">Total: {formatRupiah(s.total_price)}</span>
                    {s.remaining_amount > 0 && (
                      <span className="card-subtitle">Sisa: {formatRupiah(s.remaining_amount)}</span>
                    )}
                  </div>
                </Link>
                <div className="card-actions" style={{ marginTop: 8 }}>
                  {s.payment_status === 'hutang' && (
                    <button className="btn-icon" onClick={() => setPaymentTarget(s)}>
                      💳 Update Bayar
                    </button>
                  )}
                  <button className="btn-icon" onClick={() => setDeleteTarget(s)}>
                    🗑️
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
                  <th>Pembeli</th>
                  <th>Produk</th>
                  <th className="num">Qty</th>
                  <th className="num">Harga Satuan</th>
                  <th className="num">Total</th>
                  <th>Status</th>
                  <th className="num">Sisa</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id}>
                    <td>{formatDate(s.sale_date)}</td>
                    <td>{s.buyer_name}</td>
                    <td>{s.product_type}</td>
                    <td className="num">
                      {s.quantity} {s.unit}
                    </td>
                    <td className="num">{formatRupiah(s.unit_price)}</td>
                    <td className="num">{formatRupiah(s.total_price)}</td>
                    <td>
                      <span className={`badge badge-${s.payment_status}`}>
                        {PAYMENT_STATUS_LABELS[s.payment_status]}
                      </span>
                    </td>
                    <td className="num">{s.remaining_amount > 0 ? formatRupiah(s.remaining_amount) : '-'}</td>
                    <td>
                      <div className="card-actions">
                        {s.payment_status === 'hutang' && (
                          <button className="btn-icon" onClick={() => setPaymentTarget(s)}>
                            💳
                          </button>
                        )}
                        <Link to={`/penjualan/${s.id}`} className="btn-icon">
                          ✏️
                        </Link>
                        <button className="btn-icon" onClick={() => setDeleteTarget(s)}>
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

      <PaymentDialog
        open={!!paymentTarget}
        title={`Update Pembayaran - ${paymentTarget?.buyer_name ?? ''}`}
        total={paymentTarget?.total_price ?? 0}
        currentPaid={paymentTarget?.paid_amount ?? 0}
        onConfirm={handlePayment}
        onCancel={() => setPaymentTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Hapus penjualan untuk "${deleteTarget?.buyer_name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
