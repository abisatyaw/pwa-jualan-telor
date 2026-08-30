import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { ASSET_STATUS_REASON_LABELS, type AssetStatusUpdate } from '../types';
import { formatDate } from '../utils';

/**
 * Body of the "Update Status" sub-view. Rendered inside the Aset destination's tab
 * (see AssetList); has no page header of its own.
 */
export function AssetStatusPanel() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [rows, setRows] = useState<AssetStatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssetStatusUpdate | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRows(await api.assetStatus.list());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    await api.assetStatus.remove(deleteTarget.id);
    setDeleteTarget(null);
    load();
  }

  return (
    <div>
      <p className="hint-text">
        Mati / hilang mengurangi jumlah aktif tapi tidak nilai buku. Dijual mengurangi keduanya
        (nilai buku dikurangi proporsional).
      </p>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p>Memuat...</p>
      ) : rows.length === 0 ? (
        <div className="empty-state">Belum ada perubahan status aset.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Aset</th>
                <th className="num">Perubahan</th>
                <th>Keterangan</th>
                <th>Catatan</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.update_date)}</td>
                  <td>{r.asset_name}</td>
                  <td className="num">-{r.quantity_change}</td>
                  <td>{ASSET_STATUS_REASON_LABELS[r.reason]}</td>
                  <td>{r.notes || '-'}</td>
                  <td>
                    {isAdmin && (
                      <button className="btn-icon" onClick={() => setDeleteTarget(r)}>
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Hapus perubahan status untuk "${deleteTarget?.asset_name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
