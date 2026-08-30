import { NavLink } from 'react-router-dom';

const ITEMS = [
  { to: '/', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/transaksi', label: 'Transaksi', icon: '📒' },
  { to: '/produksi', label: 'Produksi', icon: '🥚' },
  { to: '/penjualan', label: 'Jual', icon: '💰' },
  { to: '/aset', label: 'Aset', icon: '🏗️' },
  { to: '/keuangan', label: 'Keuangan', icon: '📊' },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `nav-item${isActive ? ' nav-item-active' : ''}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
