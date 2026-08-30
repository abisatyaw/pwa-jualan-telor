import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './pages/Dashboard';
import { AssetList } from './pages/AssetList';
import { AssetForm } from './pages/AssetForm';
import { AssetStatusForm } from './pages/AssetStatusForm';
import { ProductionList } from './pages/ProductionList';
import { ProductionForm } from './pages/ProductionForm';
import { SaleList } from './pages/SaleList';
import { SaleForm } from './pages/SaleForm';
import { TransactionList } from './pages/TransactionList';
import { TransactionForm } from './pages/TransactionForm';
import { DebtList } from './pages/DebtList';
import { DebtForm } from './pages/DebtForm';
import { Settings } from './pages/Settings';
import { Financial } from './pages/Financial';
import { Login } from './pages/Login';
import { useAuth } from './context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/transaksi', label: 'Transaksi' },
  { to: '/produksi', label: 'Produksi' },
  { to: '/penjualan', label: 'Penjualan' },
  { to: '/aset', label: 'Aset' },
  { to: '/keuangan', label: 'Keuangan' },
];

function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="login-page">Memuat...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="top-header">
          <div className="brand">Cinz Farm</div>
          <nav className="top-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `top-nav-item${isActive ? ' top-nav-item-active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="top-header-user">
            <span className="hint-text">
              {user.username} · {user.role === 'admin' ? 'Admin' : 'User'}
            </span>
            <NavLink
              to="/setting"
              className={({ isActive }) => `btn-icon${isActive ? ' btn-icon-active' : ''}`}
              aria-label="Setting"
              title="Setting"
            >
              ⚙️
            </NavLink>
            <button className="btn btn-secondary" onClick={logout}>
              Keluar
            </button>
          </div>
        </header>
        <main className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/aset" element={<AssetList />} />
            <Route path="/aset/new" element={<AssetForm />} />
            <Route path="/aset/status" element={<Navigate to="/aset?tab=status" replace />} />
            <Route path="/aset/status/new" element={<AssetStatusForm />} />
            <Route path="/aset/:id" element={<AssetForm />} />
            <Route path="/produksi" element={<ProductionList />} />
            <Route path="/produksi/new" element={<ProductionForm />} />
            <Route path="/produksi/:id" element={<ProductionForm />} />
            <Route path="/penjualan" element={<SaleList />} />
            <Route path="/penjualan/new" element={<SaleForm />} />
            <Route path="/penjualan/:id" element={<SaleForm />} />
            <Route path="/transaksi" element={<TransactionList />} />
            <Route path="/transaksi/new" element={<TransactionForm />} />
            <Route path="/transaksi/:id" element={<TransactionForm />} />
            <Route path="/hutang" element={<DebtList />} />
            <Route path="/hutang/new" element={<DebtForm />} />
            <Route path="/hutang/:id" element={<DebtForm />} />
            <Route path="/keuangan" element={<Financial />} />
            <Route path="/setting" element={<Settings />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
