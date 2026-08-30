import { useSearchParams } from 'react-router-dom';

export interface TabDef {
  key: string;
  label: string;
}

/**
 * Shared in-page tab primitive. Tab state lives in a `?tab=` search param so a tab is
 * linkable, survives reload, and moves with the browser Back button. The first tab is the
 * default and is represented by the absence of the param (keeps clean URLs).
 */
export function usePageTab(tabs: TabDef[], param = 'tab'): [string, (key: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(param);
  const active = tabs.some((t) => t.key === raw) ? (raw as string) : tabs[0].key;

  function setActive(key: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (key === tabs[0].key) next.delete(param);
        else next.set(param, key);
        return next;
      },
      { replace: false },
    );
  }

  return [active, setActive];
}

interface PageTabsProps {
  tabs: TabDef[];
  active: string;
  onChange: (key: string) => void;
}

export function PageTabs({ tabs, active, onChange }: PageTabsProps) {
  return (
    <div className="page-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={t.key === active}
          className={`page-tab${t.key === active ? ' page-tab-active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
