import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { DropdownOption } from '../types';

interface OptionListProps {
  title: string;
  listKey: string;
}

function OptionList({ title, listKey }: OptionListProps) {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DropdownOption | null>(null);

  function load() {
    api.settings.listOptions(listKey).then(setOptions);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listKey]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const value = newValue.trim();
    if (!value) return;
    setError(null);
    try {
      await api.settings.createOption(listKey, value);
      setNewValue('');
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await api.settings.removeOption(deleteTarget.id);
    setDeleteTarget(null);
    load();
  }

  return (
    <div className="settings-section">
      <h2>{title}</h2>
      {options.length === 0 ? (
        <p className="hint-text">Belum ada opsi.</p>
      ) : (
        options.map((opt) => (
          <div className="settings-option-row" key={opt.id}>
            <span>{opt.value}</span>
            <button className="btn-icon" onClick={() => setDeleteTarget(opt)}>
              🗑️
            </button>
          </div>
        ))
      )}

      <form className="settings-add-row" onSubmit={handleAdd}>
        <input
          className="form-control"
          placeholder="Tambah opsi baru..."
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
        />
        <button type="submit" className="btn btn-secondary">
          + Tambah
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Apakah Anda yakin ingin menghapus opsi "${deleteTarget?.value}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export function Settings() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Setting</h1>
      </div>
      <OptionList title="Jenis Aset" listKey="asset_type" />
      <OptionList title="Kelompok Ayam" listKey="chicken_group" />
      <OptionList title="Jenis Produk Penjualan" listKey="sale_product_type" />
      <OptionList title="Satuan Penjualan" listKey="sale_unit" />
      <OptionList title="Kategori Transaksi Harian" listKey="transaction_category" />
      <OptionList title="Jenis Pakan" listKey="feed_type" />
    </div>
  );
}
