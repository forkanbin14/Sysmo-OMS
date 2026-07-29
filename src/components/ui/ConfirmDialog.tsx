import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  loading = false,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
            destructive ? 'bg-danger-50 text-danger-600' : 'bg-brand-50 text-brand-600'
          }`}
        >
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2>
        <p className="mt-2 text-sm text-ink-500">{message}</p>
        <div className="mt-6 flex w-full gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            className="flex-1"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
