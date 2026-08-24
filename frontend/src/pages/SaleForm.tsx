import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { SearchableSelect } from '../components/SearchableSelect';
import type { PaymentStatus, SaleInput } from '../types';
import { formatRupiah, todayIso } from '../utils';

const EMPTY: SaleInput = {
  sale_date: todayIso(),
  product_type: '',
  quantity: 0,
  unit: '',
  unit_price: 0,
  buyer_name: '',
  payment_status: 'lunas',
  paid_amount: 0,
  notes: '',
};

export function SaleForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState<SaleInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [productOptions, setProductOptions] = useState<string[]>([]);
  const [unitOptions, setUnitOptions] = useState<string[]>([]);

  useEffect(() => {
    api.settings.listOptions('sale_product_type').then((opts) => setProductOptions(opts.map((o) => o.value)));
    api.settings.listOptions('sale_unit').then((opts) => setUnitOptions(opts.map((o) => o.value)));
  }, []);

  useEffect(() => {
    if (isEdit) {
      api.sales.get(Number(id)).then((s) =>
        setForm({
          sale_date: s.sale_date,
          product_type: s.product_type,
          quantity: s.quantity,
          unit: s.unit,
          unit_price: s.unit_price,
          buyer_name: s.buyer_name,
          payment_status: s.payment_status,
          paid_amount: s.paid_amount,
          notes: s.notes ?? '',
        })
      );
    }
  }, [id, isEdit]);

  function update<K extends keyof SaleInput>(key: K, value: SaleInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const total = form.quantity * form.unit_price;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.product_type.trim() || !form.unit.trim() || !form.buyer_name.trim()) {
      setError('Produk, satuan, dan nama pembeli wajib diisi.');
      return;
    }
    if (form.quantity <= 0) {
      setError('Jumlah harus lebih dari 0.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: SaleInput = { ...form, notes: form.notes || null };
      if (isEdit) {
        await api.sales.update(Number(id), payload);
      } else {
        await api.sales.create(payload);
      }
      navigate('/penjualan');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Edit Penjualan' : 'Catat Penjualan'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tanggal</label>
            <input
              className="form-control"
              type="date"
              value={form.sale_date}
              onChange={(e) => update('sale_date', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Nama Pembeli *</label>
            <input
              className="form-control"
              value={form.buyer_name}
              onChange={(e) => update('buyer_name', e.target.value)}
              placeholder="Nama pembeli"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Produk *</label>
            <SearchableSelect
              value={form.product_type}
              onChange={(v) => update('product_type', v)}
              options={productOptions}
              placeholder="Telur / Ayam / Lainnya"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Satuan *</label>
            <SearchableSelect
              value={form.unit}
              onChange={(v) => update('unit', v)}
              options={unitOptions}
              placeholder="Kg / Kotak / Ekor / Pcs"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Jumlah (Besarnya)</label>
            <input
              className="form-control"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              value={form.quantity === 0 ? '' : form.quantity}
              onFocus={(e) => e.target.select()}
              onChange={(e) => update('quantity', e.target.value === '' ? 0 : Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Harga Satuan (Rp)</label>
            <input
              className="form-control"
              type="number"
              inputMode="numeric"
              min={0}
              value={form.unit_price === 0 ? '' : form.unit_price}
              onFocus={(e) => e.target.select()}
              onChange={(e) => update('unit_price', e.target.value === '' ? 0 : Number(e.target.value))}
            />
          </div>
        </div>

        <div className="card" style={{ background: '#fffbeb' }}>
          <div className="card-row">
            <span className="card-subtitle">Harga Total</span>
            <strong>{formatRupiah(total)}</strong>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Status Pembayaran</label>
          <select
            className="form-control"
            value={form.payment_status}
            onChange={(e) => update('payment_status', e.target.value as PaymentStatus)}
          >
            <option value="lunas">Lunas</option>
            <option value="hutang">Hutang</option>
          </select>
        </div>

        {form.payment_status === 'hutang' && (
          <div className="form-group">
            <label className="form-label">Sudah Dibayar (Rp)</label>
            <input
              className="form-control"
              type="number"
              inputMode="numeric"
              min={0}
              value={form.paid_amount === 0 ? '' : form.paid_amount}
              onFocus={(e) => e.target.select()}
              onChange={(e) => update('paid_amount', e.target.value === '' ? 0 : Number(e.target.value))}
            />
            <p className="hint-text">Kosongkan/isi 0 jika belum ada pembayaran sama sekali.</p>
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
