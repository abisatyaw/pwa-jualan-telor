import { Link } from 'react-router-dom';
import { PageTabs, usePageTab, type TabDef } from '../components/PageTabs';
import { DebtPanel } from './DebtPanel';
import { FinancialPanel } from './FinancialPanel';

const TABS: TabDef[] = [
  { key: 'laporan', label: 'Laporan Keuangan' },
  { key: 'hutang', label: 'Hutang' },
];

export function Keuangan() {
  const [tab, setTab] = usePageTab(TABS);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Keuangan</h1>
        {tab === 'hutang' && (
          <Link to="/hutang/new" className="btn btn-primary">
            + Tambah Hutang
          </Link>
        )}
      </div>

      <PageTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'hutang' ? <DebtPanel /> : <FinancialPanel />}
    </div>
  );
}
