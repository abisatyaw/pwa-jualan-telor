import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { DebtInput } from '../types';
import { todayIso } from '../utils';

const EMPTY: DebtInput = {
  lender_name: '',
  amount: 0,
  loan_date: todayIso(),
  due_date: null,
  interest_rate: 0,
  paid_amount: 0,
  notes: '',
};

export function DebtForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState<DebtInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.debts.get(Number(id)).then((d) =>
        setForm({
          lender_name: d.lender_name,
          amount: d.amount,
          loan_date: d.loan_date,
          due_date: d.due_date,
          interest_rate: d.interest_rate,
          paid_amount: d.paid_amount,
          notes: d.notes ?? '',
        })
      );
    }
  }, [id, isEdit]);

  function update<K extends keyof DebtInput>(key: K, value: DebtInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.lender_name.trim()) {
      setError('Nama pemberi hutang wajib diisi.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: DebtInput = { ...form, due_date: form.due_date || null, notes: form.notes || null };
      if (isEdit) {
        await api.debts.update(Number(id), payload);
      } else {
        await api.debts.create(payload);
      }
      navigate('/hutang');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Edit Hutang' : 'Tambah Hutang / Investasi'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Nama Pemberi Hutang / Investor *</label>
          <input
            className="form-control"
            value={form.lender_name}
            onChange={(e) => update('lender_name', e.target.value)}
            placeholder="Nama"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Jumlah (Rp)</label>
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
            <label className="form-label">Bunga (%)</label>
            <input
              className="form-control"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              value={form.interest_rate === 0 ? '' : form.interest_rate}
              onFocus={(e) => e.target.select()}
              onChange={(e) => update('interest_rate', e.target.value === '' ? 0 : Number(e.target.value))}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tanggal Pinjam</label>
            <input
              className="form-control"
              type="date"
              value={form.loan_date}
              onChange={(e) => update('loan_date', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Janji Waktu Bayar</label>
            <input
              className="form-control"
              type="date"
              value={form.due_date ?? ''}
              onChange={(e) => update('due_date', e.target.value || null)}
            />
          </div>
        </div>

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
