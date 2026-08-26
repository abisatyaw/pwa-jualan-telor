import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import type { DropdownOption, User, UserRole } from '../types';

interface OptionListProps {
  title: string;
  listKey: string;
  isAdmin: boolean;
}

function OptionList({ title, listKey, isAdmin }: OptionListProps) {
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
            {isAdmin && (
              <button className="btn-icon" onClick={() => setDeleteTarget(opt)}>
                🗑️
              </button>
            )}
          </div>
        ))
      )}

      {isAdmin && (
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
      )}
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

function KotakSetting({ isAdmin }: { isAdmin: boolean }) {
  const [value, setValue] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    api.settings.getKotakToKg().then((r) => {
      setValue(r.value);
      setInput(String(r.value));
    });
  }

  useEffect(load, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(input);
    if (!parsed || parsed <= 0) {
      setError('Nilai harus lebih dari 0.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const r = await api.settings.updateKotakToKg(parsed);
      setValue(r.value);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-section">
      <h2>Konversi Kotak ke Kg</h2>
      {!isAdmin ? (
        <p className="hint-text">1 Kotak = {value ?? '...'} Kg</p>
      ) : (
        <form className="settings-add-row" onSubmit={handleSave}>
          <input
            className="form-control"
            type="number"
            min={0}
            step="0.1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </form>
      )}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  function load() {
    api.users.list().then(setUsers);
  }

  useEffect(load, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.users.create({ username: username.trim(), password, role });
      setUsername('');
      setPassword('');
      setRole('user');
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await api.users.remove(deleteTarget.id);
    setDeleteTarget(null);
    load();
  }

  return (
    <div className="settings-section">
      <h2>Kelola User</h2>
      {users.length === 0 ? (
        <p className="hint-text">Belum ada user.</p>
      ) : (
        users.map((u) => (
          <div className="settings-option-row" key={u.id}>
            <span>
              {u.username} · {u.role === 'admin' ? 'Admin' : 'User'}
            </span>
            <button className="btn-icon" onClick={() => setDeleteTarget(u)}>
              🗑️
            </button>
          </div>
        ))
      )}

      <form onSubmit={handleAdd}>
        <div className="form-row" style={{ marginTop: 10 }}>
          <input
            className="form-control"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="form-control"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="form-row" style={{ marginTop: 10 }}>
          <select className="form-control" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="btn btn-secondary">
            + Tambah User
          </button>
        </div>
      </form>
      {error && <p className="error-text">{error}</p>}

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Apakah Anda yakin ingin menghapus user "${deleteTarget?.username}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export function Settings() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Setting</h1>
      </div>

      <div className="settings-section">
        <h2>Akun</h2>
        <p className="hint-text">
          Masuk sebagai {user?.username} · {isAdmin ? 'Admin' : 'User'}
        </p>
        <button className="btn btn-secondary" onClick={logout}>
          Keluar
        </button>
      </div>

      <OptionList title="Jenis Aset" listKey="asset_type" isAdmin={isAdmin} />
      <OptionList title="Kelompok Ayam" listKey="chicken_group" isAdmin={isAdmin} />
      <OptionList title="Jenis Produk Penjualan" listKey="sale_product_type" isAdmin={isAdmin} />
      <OptionList title="Satuan Penjualan" listKey="sale_unit" isAdmin={isAdmin} />
      <OptionList title="Kategori Transaksi Harian" listKey="transaction_category" isAdmin={isAdmin} />
      <OptionList title="Jenis Pakan" listKey="feed_type" isAdmin={isAdmin} />
      <KotakSetting isAdmin={isAdmin} />
      {isAdmin && <UserManagement />}
    </div>
  );
}
