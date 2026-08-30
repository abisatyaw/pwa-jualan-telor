import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { SearchableSelect } from '../components/SearchableSelect';
import type { AssetInput } from '../types';
import { formatRupiah, todayIso } from '../utils';

const EMPTY: AssetInput = {
  asset_name: '',
  asset_type: '',
  quantity: 1,
  acquisition_price: 0,
  acquisition_date: todayIso(),
  depreciation_months: 36,
  chicken_group: null,
  chicken_age_weeks_at_purchase: null,
  notes: '',
};

export function AssetForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState<AssetInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [assetTypeOptions, setAssetTypeOptions] = useState<string[]>([]);
  const [groupOptions, setGroupOptions] = useState<string[]>([]);

  useEffect(() => {
    api.settings.listOptions('asset_type').then((opts) => setAssetTypeOptions(opts.map((o) => o.value)));
    api.settings.listOptions('chicken_group').then((opts) => setGroupOptions(opts.map((o) => o.value)));
  }, []);

  useEffect(() => {
    if (isEdit) {
      api.assets.get(Number(id)).then((a) =>
        setForm({
          asset_name: a.asset_name,
          asset_type: a.asset_type,
          quantity: a.quantity,
          acquisition_price: a.acquisition_price,
          acquisition_date: a.acquisition_date,
          depreciation_months: a.depreciation_months,
          chicken_group: a.chicken_group,
          chicken_age_weeks_at_purchase: a.chicken_age_weeks_at_purchase,
          notes: a.notes ?? '',
        })
      );
    }
  }, [id, isEdit]);

  function update<K extends keyof AssetInput>(key: K, value: AssetInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isChicken = form.asset_type.toLowerCase() === 'ayam';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.asset_name.trim() || !form.asset_type.trim()) {
      setError('Nama dan jenis aset wajib diisi.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: AssetInput = {
        ...form,
        chicken_group: isChicken ? form.chicken_group || null : null,
        chicken_age_weeks_at_purchase: isChicken ? form.chicken_age_weeks_at_purchase : null,
        notes: form.notes || null,
      };
      if (isEdit) {
        await api.assets.update(Number(id), payload);
      } else {
        await api.assets.create(payload);
      }
      navigate('/aset');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Edit Aset' : 'Tambah Aset'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Nama Aset *</label>
          <input
            className="form-control"
            value={form.asset_name}
            onChange={(e) => update('asset_name', e.target.value)}
            placeholder="Contoh: Kandang Blok A"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Jenis Aset *</label>
          <SearchableSelect
            value={form.asset_type}
            onChange={(v) => update('asset_type', v)}
            options={assetTypeOptions}
            placeholder="Pilih jenis aset"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Jumlah (QTY)</label>
            <input
              className="form-control"
              type="number"
              inputMode="numeric"
              min={1}
              value={form.quantity}
              onFocus={(e) => e.target.select()}
              onChange={(e) => update('quantity', e.target.value === '' ? 1 : Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Harga Akuisisi / Unit (Rp)</label>
            <input
              className="form-control"
              type="number"
              inputMode="numeric"
              min={0}
              value={form.acquisition_price === 0 ? '' : form.acquisition_price}
              onFocus={(e) => e.target.select()}
              onChange={(e) => update('acquisition_price', e.target.value === '' ? 0 : Number(e.target.value))}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Total Harga Akuisisi (Rp)</label>
            <input
              className="form-control"
              value={formatRupiah(form.quantity * form.acquisition_price)}
              readOnly
              tabIndex={-1}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Waktu Pengadaan</label>
            <input
              className="form-control"
              type="date"
              value={form.acquisition_date}
              onChange={(e) => update('acquisition_date', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Waktu Depresiasi (bulan)</label>
          <input
            className="form-control"
            type="number"
            inputMode="numeric"
            min={0}
            value={form.depreciation_months === 0 ? '' : form.depreciation_months}
            onFocus={(e) => e.target.select()}
            onChange={(e) => update('depreciation_months', e.target.value === '' ? 0 : Number(e.target.value))}
          />
          <p className="hint-text">Lama penyusutan nilai aset sampai habis, dalam bulan.</p>
        </div>

        {isChicken && (
          <div className="card" style={{ background: '#fffbeb' }}>
            <p className="card-subtitle" style={{ marginBottom: 10 }}>
              Informasi tambahan untuk investasi ayam
            </p>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Kelompok Ayam</label>
                <SearchableSelect
                  value={form.chicken_group ?? ''}
                  onChange={(v) => update('chicken_group', v)}
                  options={groupOptions}
                  placeholder="Pilih kelompok"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Umur Saat Dibeli (minggu)</label>
                <input
                  className="form-control"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.chicken_age_weeks_at_purchase ?? ''}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) =>
                    update('chicken_age_weeks_at_purchase', e.target.value === '' ? null : Number(e.target.value))
                  }
                />
              </div>
            </div>
          </div>
        )}

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
