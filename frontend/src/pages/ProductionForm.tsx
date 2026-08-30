import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { SearchableSelect } from '../components/SearchableSelect';
import type { ProductionInput } from '../types';
import { todayIso } from '../utils';

const EMPTY: ProductionInput = {
  production_date: todayIso(),
  chicken_group: '',
  quantity_kg: 0,
  average_egg_weight_kg: null,
  notes: '',
};

export function ProductionForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState<ProductionInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [groupOptions, setGroupOptions] = useState<string[]>([]);
  const [defaultEggWeight, setDefaultEggWeight] = useState(0.055);

  useEffect(() => {
    api.settings.listOptions('chicken_group').then((opts) => setGroupOptions(opts.map((o) => o.value)));
    api.settings.getAverageEggWeight().then((r) => setDefaultEggWeight(r.value));
  }, []);

  useEffect(() => {
    if (isEdit) {
      api.productions.get(Number(id)).then((p) =>
        setForm({
          production_date: p.production_date,
          chicken_group: p.chicken_group,
          quantity_kg: p.quantity_kg,
          average_egg_weight_kg: p.average_egg_weight_kg,
          notes: p.notes ?? '',
        })
      );
    }
  }, [id, isEdit]);

  const eggWeight = form.average_egg_weight_kg ?? defaultEggWeight;
  const estimatedEggs = eggWeight > 0 ? Math.round(form.quantity_kg / eggWeight) : 0;

  function update<K extends keyof ProductionInput>(key: K, value: ProductionInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.chicken_group.trim()) {
      setError('Kelompok ayam wajib dipilih.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: ProductionInput = { ...form, notes: form.notes || null };
      if (isEdit) {
        await api.productions.update(Number(id), payload);
      } else {
        await api.productions.create(payload);
      }
      navigate('/produksi');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Edit Produksi' : 'Catat Produksi'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tanggal</label>
            <input
              className="form-control"
              type="date"
              value={form.production_date}
              onChange={(e) => update('production_date', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Kelompok Ayam *</label>
            <SearchableSelect
              value={form.chicken_group}
              onChange={(v) => update('chicken_group', v)}
              options={groupOptions}
              placeholder="Pilih kelompok"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Jumlah Produksi (Kg)</label>
            <input
              className="form-control"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.001"
              value={form.quantity_kg === 0 ? '' : form.quantity_kg}
              onFocus={(e) => e.target.select()}
              onChange={(e) => update('quantity_kg', e.target.value === '' ? 0 : Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Berat Rata-rata 1 Butir (Kg)</label>
            <input
              className="form-control"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.001"
              placeholder={String(defaultEggWeight)}
              value={form.average_egg_weight_kg ?? ''}
              onChange={(e) =>
                update('average_egg_weight_kg', e.target.value === '' ? null : Number(e.target.value))
              }
            />
          </div>
        </div>

        <p className="hint-text">
          Estimasi jumlah butir: <strong>{estimatedEggs.toLocaleString('id-ID')}</strong> (dari{' '}
          {form.average_egg_weight_kg == null ? `default ${defaultEggWeight}` : eggWeight} kg/butir)
        </p>

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
