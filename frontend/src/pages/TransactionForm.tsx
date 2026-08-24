import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { SearchableSelect } from '../components/SearchableSelect';
import type { TransactionInput } from '../types';
import { todayIso } from '../utils';

const EMPTY: TransactionInput = {
  transaction_date: todayIso(),
  category: '',
  amount: 0,
  qty: null,
  qty_unit: null,
  feed_type: null,
  notes: '',
};

const QTY_CATEGORIES: Record<string, string> = {
  Pakan: 'Kg',
  'Pembelian Telor': 'Kg',
  'Pembelian Ayam': 'Ekor',
  'Pembelian Kotak Telur': 'Pcs',
};

export function TransactionForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState<TransactionInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [feedTypeOptions, setFeedTypeOptions] = useState<string[]>([]);

  useEffect(() => {
    api.settings.listOptions('transaction_category').then((opts) => setCategoryOptions(opts.map((o) => o.value)));
    api.settings.listOptions('feed_type').then((opts) => setFeedTypeOptions(opts.map((o) => o.value)));
  }, []);

  useEffect(() => {
    if (isEdit) {
      api.transactions.get(Number(id)).then((t) =>
        setForm({
          transaction_date: t.transaction_date,
          category: t.category,
          amount: t.amount,
          qty: t.qty,
          qty_unit: t.qty_unit,
          feed_type: t.feed_type,
          notes: t.notes ?? '',
        })
      );
    }
  }, [id, isEdit]);

  function update<K extends keyof TransactionInput>(key: K, value: TransactionInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleCategoryChange(category: string) {
    const defaultUnit = QTY_CATEGORIES[category];
    setForm((f) => ({
      ...f,
      category,
      qty_unit: defaultUnit ?? null,
      qty: defaultUnit ? f.qty : null,
      feed_type: category === 'Pakan' ? f.feed_type : null,
    }));
  }

  const needsQty = form.category in QTY_CATEGORIES;
  const isPakan = form.category === 'Pakan';
  const qtyPerGroup = isPakan && form.qty ? Math.round((form.qty / 2) * 100) / 100 : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category.trim()) {
      setError('Kategori wajib dipilih.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: TransactionInput = { ...form, notes: form.notes || null };
      if (isEdit) {
        await api.transactions.update(Number(id), payload);
      } else {
        await api.transactions.create(payload);
      }
      navigate('/transaksi');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Edit Transaksi' : 'Catat Transaksi Harian'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tanggal</label>
            <input
              className="form-control"
              type="date"
              value={form.transaction_date}
              onChange={(e) => update('transaction_date', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Kategori *</label>
            <SearchableSelect
              value={form.category}
              onChange={handleCategoryChange}
              options={categoryOptions}
              placeholder="Pilih kategori"
            />
          </div>
        </div>

        {isPakan && (
          <div className="form-group">
            <label className="form-label">Jenis Pakan</label>
            <SearchableSelect
              value={form.feed_type ?? ''}
              onChange={(v) => update('feed_type', v)}
              options={feedTypeOptions}
              placeholder="Pilih jenis pakan"
            />
          </div>
        )}

        {needsQty && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Qty ({form.qty_unit})</label>
              <input
                className="form-control"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                value={form.qty ?? ''}
                onFocus={(e) => e.target.select()}
                onChange={(e) => update('qty', e.target.value === '' ? null : Number(e.target.value))}
              />
            </div>
          </div>
        )}
        {isPakan && qtyPerGroup !== null && (
          <p className="hint-text">
            Dibagi 2 kelompok untuk analisa FCR: {qtyPerGroup} Kg per kelompok.
          </p>
        )}

        <div className="form-group">
          <label className="form-label">Biaya (Rp)</label>
          <input
            className="form-control"
            type="number"
            inputMode="numeric"
            min={0}
            value={form.amount === 0 ? '' : form.amount}
            onFocus={(e) => e.target.select()}
            onChange={(e) => update('amount', e.target.value === '' ? 0 : Number(e.target.value))}
          />
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
