import { useEffect, useRef, useState } from 'react';

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: string[] | Option[];
  placeholder?: string;
}

function normalize(options: string[] | Option[]): Option[] {
  return options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
}

export function SearchableSelect({ value, onChange, options, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalized = normalize(options);
  const selectedLabel = normalized.find((o) => o.value === value)?.label ?? '';
  const filtered = normalized.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

  function selectOption(option: Option) {
    onChange(option.value);
    setOpen(false);
    setSearch('');
  }

  return (
    <div className="searchable-select" ref={wrapRef}>
      <input
        className="form-control"
        placeholder={placeholder}
        value={open ? search : selectedLabel}
        onFocus={() => {
          setOpen(true);
          setSearch('');
        }}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
            setSearch('');
          }
        }}
      />
      {open && (
        <div className="searchable-select-popover">
          {filtered.length === 0 ? (
            <div className="searchable-select-empty">Tidak ada opsi</div>
          ) : (
            filtered.map((option) => (
              <div
                key={option.value}
                className={`searchable-select-option${option.value === value ? ' searchable-select-option-active' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectOption(option);
                }}
              >
                {option.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
