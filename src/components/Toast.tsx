import React from 'react';

export interface ToastInfo {
  show: boolean;
  title: string;
  description: string;
  type?: 'success' | 'info' | 'warning';
}

interface ToastProps {
  toast: ToastInfo;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  if (!toast.show) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-inverse-surface text-inverse-on-surface px-space-lg py-space-md rounded-xl shadow-2xl flex items-center gap-space-md z-50 animate-bounce-short border border-outline-variant/20 transition-all max-w-md">
      <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-base">check</span>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-headline-sm text-headline-sm text-inverse-on-surface font-semibold">
          {toast.title}
        </span>
        <span className="font-body-sm text-body-sm text-surface-variant/90 mt-0.5 leading-snug">
          {toast.description}
        </span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="ml-auto text-inverse-on-surface/60 hover:text-inverse-on-surface p-1"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
};
