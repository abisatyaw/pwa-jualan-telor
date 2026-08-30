import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { KpiCard } from '../components/KpiCard';
import { useAuth } from '../context/AuthContext';
import type { Production } from '../types';
import { formatDate, formatQty } from '../utils';

export function ProductionList() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [productions, setProductions] = useState<Production[]>([]);
  const [group, setGroup] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Production | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setProductions(
        await api.productions.list({
          chicken_group: group || undefined,
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
  }, [group, dateFrom, dateTo]);

  const groups = Array.from(new Set(productions.map((p) => p.chicken_group)));
  const total = productions.reduce((sum, p) => sum + p.quantity_kg, 0);

  async function handleDelete() {
    if (!deleteTarget) return;
    await api.productions.remove(deleteTarget.id);
    setDeleteTarget(null);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Produksi Telur</h1>
        <Link to="/produksi/new" className="btn btn-primary">
          + Catat Produksi
        </Link>
      </div>

      <div className="filter-bar">
        <select className="form-control" value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="">Semua Kelompok</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <input className="form-control" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input className="form-control" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: '1fr' }}>
        <KpiCard label="Total Produksi (sesuai filter)" value={`${formatQty(total)} Kg`} accent />
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p>Memuat...</p>
      ) : productions.length === 0 ? (
        <div className="empty-state">Belum ada data produksi.</div>
      ) : (
        <>
          <div className="list-cards">
            {productions.map((p) => (
              <div className="card" key={p.id}>
                <Link to={`/produksi/${p.id}`} className="link-plain">
                  <div className="card-row">
                    <div>
                      <div className="card-title">{formatDate(p.production_date)}</div>
                      <div className="card-subtitle">
                        {p.chicken_group} · ~{p.estimated_egg_count.toLocaleString('id-ID')} butir
                      </div>
                    </div>
                    <span className="badge badge-active">{formatQty(p.quantity_kg)} Kg</span>
                  </div>
                </Link>
                {isAdmin && (
                  <div className="card-actions" style={{ marginTop: 8 }}>
                    <button className="btn-icon" onClick={() => setDeleteTarget(p)}>
                      🗑️ Hapus
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kelompok</th>
                  <th className="num">Jumlah (Kg)</th>
                  <th className="num">Est. Butir</th>
                  <th>Catatan</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {productions.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDate(p.production_date)}</td>
                    <td>{p.chicken_group}</td>
                    <td className="num">{formatQty(p.quantity_kg)}</td>
                    <td className="num">{p.estimated_egg_count.toLocaleString('id-ID')}</td>
                    <td>{p.notes || '-'}</td>
                    <td>
                      <div className="card-actions">
                        <Link to={`/produksi/${p.id}`} className="btn-icon">
                          ✏️
                        </Link>
                        {isAdmin && (
                          <button className="btn-icon" onClick={() => setDeleteTarget(p)}>
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

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Hapus data produksi tanggal ${deleteTarget ? formatDate(deleteTarget.production_date) : ''}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
