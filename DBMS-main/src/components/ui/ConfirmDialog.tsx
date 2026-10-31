import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info, CheckCircle2, AlertCircle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const iconConfig = {
    danger: {
      icon: AlertCircle,
      wrapperBg: 'bg-rose-50 text-rose-600 border border-rose-200/80',
      btnVariant: 'danger' as const,
    },
    warning: {
      icon: AlertTriangle,
      wrapperBg: 'bg-amber-50 text-amber-600 border border-amber-200/80',
      btnVariant: 'primary' as const,
    },
    primary: {
      icon: CheckCircle2,
      wrapperBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/80',
      btnVariant: 'primary' as const,
    },
    info: {
      icon: Info,
      wrapperBg: 'bg-sky-50 text-sky-600 border border-sky-200/80',
      btnVariant: 'primary' as const,
    },
  };

  const current = iconConfig[variant];
  const IconComponent = current.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" showCloseButton={false}>
      <div className="flex flex-col items-center text-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${current.wrapperBg}`}>
          <IconComponent className="w-6 h-6" />
        </div>

        <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">{description}</p>

        <div className="flex items-center gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={current.btnVariant}
            className="flex-1"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

