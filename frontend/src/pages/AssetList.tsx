import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PageTabs, usePageTab, type TabDef } from '../components/PageTabs';
import { useAuth } from '../context/AuthContext';
import type { Asset } from '../types';
import { formatBucketLabel, formatDate, formatRupiah } from '../utils';
import { AssetStatusPanel } from './AssetStatusPanel';

const TABS: TabDef[] = [
  { key: 'daftar', label: 'Daftar Aset' },
  { key: 'status', label: 'Update Status' },
];

export function AssetList() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = usePageTab(TABS);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Aset</h1>
        {tab === 'status' ? (
          <Link to="/aset/status/new" className="btn btn-primary">
            + Catat Perubahan
          </Link>
        ) : (
          <Link to="/aset/new" className="btn btn-primary">
            + Tambah Aset
          </Link>
        )}
      </div>

      <PageTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'status' ? (
        <AssetStatusPanel />
      ) : (
        <AssetListBody isAdmin={isAdmin} />
      )}
    </div>
  );
}

function AssetListBody({ isAdmin }: { isAdmin: boolean }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState('');
  const [assetType, setAssetType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setAssets(await api.assets.list({ search: search || undefined, asset_type: assetType || undefined }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, assetType]);

  const types = Array.from(new Set(assets.map((a) => a.asset_type)));

  async function handleDelete() {
    if (!deleteTarget) return;
    await api.assets.remove(deleteTarget.id);
    setDeleteTarget(null);
    load();
  }

  return (
    <>
      <div className="filter-bar">
        <input
          className="form-control"
          placeholder="Cari aset..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="form-control" value={assetType} onChange={(e) => setAssetType(e.target.value)}>
          <option value="">Semua Jenis</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p>Memuat...</p>
      ) : assets.length === 0 ? (
        <div className="empty-state">Belum ada aset.</div>
      ) : (
        <div className="list-cards">
          {assets.map((a) => (
            <div className="card" key={a.id}>
              <Link to={`/aset/${a.id}`} className="link-plain">
                <div className="card-row">
                  <div>
                    <div className="card-title">{a.asset_name}</div>
                    <div className="card-subtitle">
                      {a.asset_type} · {a.quantity} unit · {formatDate(a.acquisition_date)}
                    </div>
                  </div>
                  <span className="badge badge-active">{formatRupiah(a.book_value)}</span>
                </div>
                <div className="card-row" style={{ marginTop: 8 }}>
                  <span className="card-subtitle">Total akuisisi: {formatRupiah(a.total_acquisition_value)}</span>
                  <span className="card-subtitle">Depresiasi/bln: {formatRupiah(a.monthly_depreciation)}</span>
                </div>
                {a.book_value_zero_date && (
                  <div className="card-row" style={{ marginTop: 4 }}>
                    <span className="card-subtitle">
                      Nilai buku Rp 0 sekitar: {formatBucketLabel(a.book_value_zero_date.slice(0, 7))}
                    </span>
                  </div>
                )}
                {a.current_age_weeks !== null && (
                  <div className="card-row" style={{ marginTop: 4 }}>
                    <span className="card-subtitle">
                      {a.chicken_group ?? '-'} · Umur saat ini: {a.current_age_weeks} minggu
                    </span>
                  </div>
                )}
              </Link>
              {isAdmin && (
                <div className="card-actions" style={{ marginTop: 8 }}>
                  <button className="btn-icon" onClick={() => setDeleteTarget(a)}>
                    🗑️ Hapus
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Aset</th>
              <th>Jenis</th>
              <th className="num">Qty</th>
              <th>Tgl Akuisisi</th>
              <th className="num">Total Akuisisi</th>
              <th className="num">Depresiasi/bln</th>
              <th className="num">Nilai Buku</th>
              <th>Nilai Buku Rp 0</th>
              <th>Kelompok/Umur</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id}>
                <td>{a.asset_name}</td>
                <td>{a.asset_type}</td>
                <td className="num">{a.quantity}</td>
                <td>{formatDate(a.acquisition_date)}</td>
                <td className="num">{formatRupiah(a.total_acquisition_value)}</td>
                <td className="num">{formatRupiah(a.monthly_depreciation)}</td>
                <td className="num">{formatRupiah(a.book_value)}</td>
                <td>{a.book_value_zero_date ? formatBucketLabel(a.book_value_zero_date.slice(0, 7)) : '-'}</td>
                <td>
                  {a.chicken_group ? `${a.chicken_group} · ${a.current_age_weeks} mgg` : '-'}
                </td>
                <td>
                  <div className="card-actions">
                    <Link to={`/aset/${a.id}`} className="btn-icon">
                      ✏️
                    </Link>
                    {isAdmin && (
                      <button className="btn-icon" onClick={() => setDeleteTarget(a)}>
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

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Apakah Anda yakin ingin menghapus aset "${deleteTarget?.asset_name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
