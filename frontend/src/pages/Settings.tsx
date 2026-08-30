import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import type { DropdownOption, KgPerKarungRow, User, UserRole } from '../types';
import { formatRupiah } from '../utils';

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

interface ScalarSettingProps {
  title: string;
  hint: (value: number | null) => string;
  step: string;
  isAdmin: boolean;
  load: () => Promise<{ value: number | null }>;
  save: (value: number) => Promise<{ value: number | null }>;
  // FCR target has no sensible default, so 0 / empty means "not set" and is allowed.
  allowUnset?: boolean;
}

function ScalarSetting({ title, hint, step, isAdmin, load, save, allowUnset }: ScalarSettingProps) {
  const [value, setValue] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load().then((r) => {
      setValue(r.value);
      setInput(r.value === null ? '' : String(r.value));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(input);
    if (Number.isNaN(parsed) || parsed < 0 || (!allowUnset && parsed <= 0)) {
      setError(allowUnset ? 'Nilai tidak valid.' : 'Nilai harus lebih dari 0.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const r = await save(parsed);
      setValue(r.value);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-section">
      <h2>{title}</h2>
      <p className="hint-text">{hint(value)}</p>
      {isAdmin && (
        <form className="settings-add-row" onSubmit={handleSave}>
          <input
            className="form-control"
            type="number"
            min={0}
            step={step}
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

function KgPerKarungSetting({ isAdmin }: { isAdmin: boolean }) {
  const [rows, setRows] = useState<KgPerKarungRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [savingType, setSavingType] = useState<string | null>(null);

  function load() {
    api.settings.listKgPerKarung().then((r) => {
      setRows(r);
      setDrafts(Object.fromEntries(r.map((row) => [row.feed_type, String(row.value)])));
    });
  }

  useEffect(load, []);

  async function handleSave(feedType: string) {
    const parsed = Number(drafts[feedType]);
    if (Number.isNaN(parsed) || parsed < 0) {
      setError('Nilai tidak valid.');
      return;
    }
    setError(null);
    setSavingType(feedType);
    try {
      await api.settings.updateKgPerKarung(feedType, parsed);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingType(null);
    }
  }

  return (
    <div className="settings-section">
      <h2>Konversi Karung ke Kg (per Jenis Pakan)</h2>
      {rows.length === 0 ? (
        <p className="hint-text">Belum ada jenis pakan.</p>
      ) : (
        rows.map((row) => (
          <div className="settings-option-row" key={row.feed_type}>
            <span>
              {row.feed_type}
              {!isAdmin && ` — ${row.value > 0 ? `${row.value} Kg / karung` : 'belum diatur'}`}
            </span>
            {isAdmin && (
              <span className="settings-add-row" style={{ marginTop: 0 }}>
                <input
                  className="form-control"
                  type="number"
                  min={0}
                  step="0.5"
                  value={drafts[row.feed_type] ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [row.feed_type]: e.target.value }))}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={savingType === row.feed_type}
                  onClick={() => handleSave(row.feed_type)}
                >
                  {savingType === row.feed_type ? '...' : 'Simpan'}
                </button>
              </span>
            )}
          </div>
        ))
      )}
      <p className="hint-text">Dipakai untuk mengubah pembelian pakan (karung) menjadi kg untuk perhitungan FCR.</p>
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
            placeholder="Password (opsional)"
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

interface SettingsGroupProps {
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function SettingsGroup({ title, subtitle, defaultOpen = false, children }: SettingsGroupProps) {
  return (
    <details className="settings-group" open={defaultOpen}>
      <summary className="settings-group-summary">
        <span className="settings-group-title">{title}</span>
        <span className="hint-text">{subtitle}</span>
      </summary>
      <div className="settings-group-body">{children}</div>
    </details>
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

      <SettingsGroup
        title="Opsi Pilihan Form"
        subtitle="Nilai dropdown yang muncul di form aset, produksi, penjualan, dan transaksi"
        defaultOpen
      >
        <OptionList title="Jenis Aset" listKey="asset_type" isAdmin={isAdmin} />
        <OptionList title="Kelompok Ayam" listKey="chicken_group" isAdmin={isAdmin} />
        <OptionList title="Jenis Produk Penjualan" listKey="sale_product_type" isAdmin={isAdmin} />
        <OptionList title="Satuan Penjualan" listKey="sale_unit" isAdmin={isAdmin} />
        <OptionList title="Kategori Transaksi Harian" listKey="transaction_category" isAdmin={isAdmin} />
        <OptionList title="Jenis Pakan" listKey="feed_type" isAdmin={isAdmin} />
      </SettingsGroup>

      <SettingsGroup
        title="Parameter Perhitungan"
        subtitle="Faktor konversi dan target yang dipakai dashboard (FCR, HDP, estimasi butir, stok)"
      >
        <h3 className="settings-subhead">Konversi Satuan</h3>
        <KotakSetting isAdmin={isAdmin} />
        <KgPerKarungSetting isAdmin={isAdmin} />

        <h3 className="settings-subhead">Target Produksi</h3>
        <ScalarSetting
          title="Berat Rata-rata 1 Butir Telur (kg)"
          hint={(v) => `Default berat per butir: ${v ?? '...'} kg. Dipakai untuk estimasi jumlah butir & HDP.`}
          step="0.001"
          isAdmin={isAdmin}
          load={api.settings.getAverageEggWeight}
          save={api.settings.updateAverageEggWeight}
        />
        <ScalarSetting
          title="Target HDP (%)"
          hint={(v) => `Target Hen Day Production: ${v ?? '...'}%`}
          step="1"
          isAdmin={isAdmin}
          load={api.settings.getHdpTarget}
          save={api.settings.updateHdpTarget}
        />
        <ScalarSetting
          title="Target FCR"
          hint={(v) => (v === null ? 'Target FCR belum diatur.' : `Target FCR: ${v}`)}
          step="0.01"
          isAdmin={isAdmin}
          load={api.settings.getFcrTarget}
          save={api.settings.updateFcrTarget}
          allowUnset
        />

        <h3 className="settings-subhead">Keuangan</h3>
        <ScalarSetting
          title="Modal Investor (Rp)"
          hint={(v) => `Modal ditanamkan investor: ${formatRupiah(v ?? 0)}. Dipakai untuk ROI & neraca.`}
          step="1000000"
          isAdmin={isAdmin}
          load={api.settings.getInvestorCapital}
          save={api.settings.updateInvestorCapital}
        />
        <ScalarSetting
          title="Kas Bank Awal (Rp)"
          hint={(v) => `Modal kerja awal / saldo kas awal: ${formatRupiah(v ?? 0)}.`}
          step="1000000"
          isAdmin={isAdmin}
          load={api.settings.getOpeningBankCash}
          save={api.settings.updateOpeningBankCash}
          allowUnset
        />
      </SettingsGroup>

      {isAdmin && (
        <SettingsGroup title="Kelola Pengguna" subtitle="Tambah atau hapus akun login">
          <UserManagement />
        </SettingsGroup>
      )}
    </div>
  );
}
