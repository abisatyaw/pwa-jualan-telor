import { useEffect, useState } from 'react';
import { formatRupiah } from '../utils';

interface Props {
  open: boolean;
  title: string;
  total: number;
  currentPaid: number;
  onConfirm: (paidAmount: number) => void;
  onCancel: () => void;
}

export function PaymentDialog({ open, title, total, currentPaid, onConfirm, onCancel }: Props) {
  const [value, setValue] = useState(currentPaid);

  useEffect(() => {
    if (open) setValue(currentPaid);
  }, [open, currentPaid]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p className="hint-text">Total: {formatRupiah(total)}</p>
        <div className="form-group">
          <label className="form-label">Jumlah Dibayar (Rp)</label>
          <input
            className="form-control"
            type="number"
            inputMode="numeric"
            min={0}
            value={value === 0 ? '' : value}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setValue(e.target.value === '' ? 0 : Number(e.target.value))}
          />
        </div>
        <p className="hint-text">Sisa: {formatRupiah(Math.max(total - value, 0))}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Batal
          </button>
          <button className="btn btn-primary" onClick={() => onConfirm(value)}>
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
