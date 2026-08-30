import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import {
  ASSET_STATUS_REASON_LABELS,
  type Asset,
  type AssetStatusReason,
  type AssetStatusUpdateInput,
} from '../types';
import { todayIso } from '../utils';

const REASONS: AssetStatusReason[] = ['dead', 'sold', 'missing'];

export function AssetStatusForm() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [form, setForm] = useState<AssetStatusUpdateInput>({
    asset_id: 0,
    update_date: todayIso(),
    quantity_change: 1,
    reason: 'dead',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.assets.list().then(setAssets);
  }, []);

  function update<K extends keyof AssetStatusUpdateInput>(key: K, value: AssetStatusUpdateInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const selected = assets.find((a) => a.id === form.asset_id);
  const isChicken = selected?.asset_type.toLowerCase() === 'ayam';
  const allowedReasons = REASONS.filter((r) => r === 'sold' || isChicken);
  const reason: AssetStatusReason = allowedReasons.includes(form.reason) ? form.reason : 'sold';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.asset_id) {
      setError('Pilih aset.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.assetStatus.create({ ...form, reason, notes: form.notes || null });
      navigate('/aset?tab=status');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Catat Perubahan Status Aset</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Aset *</label>
          <select
            className="form-control"
            value={form.asset_id}
            onChange={(e) => {
              const id = Number(e.target.value);
              const a = assets.find((x) => x.id === id);
              setForm((f) => ({
                ...f,
                asset_id: id,
                reason: a && a.asset_type.toLowerCase() !== 'ayam' ? 'sold' : f.reason,
              }));
            }}
          >
            <option value={0}>Pilih aset</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.asset_name} ({a.asset_type}) — aktif {a.active_quantity}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tanggal</label>
            <input
              className="form-control"
              type="date"
              value={form.update_date}
              onChange={(e) => update('update_date', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Jumlah Berkurang</label>
            <input
              className="form-control"
              type="number"
              min={1}
              max={selected?.active_quantity ?? undefined}
              value={form.quantity_change}
              onFocus={(e) => e.target.select()}
              onChange={(e) => update('quantity_change', Number(e.target.value) || 1)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Keterangan</label>
          <select
            className="form-control"
            value={reason}
            onChange={(e) => update('reason', e.target.value as AssetStatusReason)}
          >
            {allowedReasons.map((r) => (
              <option key={r} value={r}>
                {ASSET_STATUS_REASON_LABELS[r]}
              </option>
            ))}
          </select>
          <p className="hint-text">
            {reason === 'sold'
              ? 'Mengurangi jumlah aktif dan nilai buku depresiasi (proporsional).'
              : 'Mengurangi jumlah aktif saja, tidak mempengaruhi nilai buku.'}
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Catatan</label>
          <textarea
            className="form-control"
            value={form.notes ?? ''}
            onChange={(e) => update('notes', e.target.value)}
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="form-row">
          <button type="button" className="btn btn-secondary btn-block" onClick={() => navigate(-1)}>
            Batal
          </button>
          <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}
