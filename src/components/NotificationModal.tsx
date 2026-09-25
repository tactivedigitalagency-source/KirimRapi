import React from 'react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToVerification: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  onNavigateToVerification
}) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      type: 'warning',
      title: '3 Pesanan Perlu Konfirmasi WhatsApp',
      desc: 'Batas cut-off penyerahan kurir sore adalah 15:00 WIB. Terdapat ketidakjelasan RT/RW & nama kecamatan.',
      time: '14:25 WIB',
      action: 'Buka Antrean',
      isPriority: true
    },
    {
      id: 2,
      type: 'success',
      title: 'Sinkronisasi Kemendagri 2026 Aktif',
      desc: 'Database kelurahan & kodepos nasional diperbarui ke rilis semester 2.',
      time: '12:00 WIB',
      action: null,
      isPriority: false
    },
    {
      id: 3,
      type: 'info',
      title: 'Batch Pick-up J&T Express Disiapkan',
      desc: '18 paket siap diserahkan pada kurir pukul 16:00 WIB.',
      time: '11:45 WIB',
      action: null,
      isPriority: false
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-start justify-end p-4 sm:p-6">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-surface-container mt-12 animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="p-space-md border-b border-surface-container flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">notifications</span>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Notifikasi Dispatch Toko
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-error text-on-error font-label-sm text-[10px] font-bold">
              3 Baru
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="divide-y divide-surface-container max-h-[70vh] overflow-y-auto">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-space-md transition-colors ${
                n.isPriority ? 'bg-tertiary-fixed/20 hover:bg-tertiary-fixed/30' : 'hover:bg-surface-container-low'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {n.type === 'warning' && (
                    <span className="material-symbols-outlined text-tertiary text-base">warning</span>
                  )}
                  {n.type === 'success' && (
                    <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
                  )}
                  {n.type === 'info' && (
                    <span className="material-symbols-outlined text-primary text-base">info</span>
                  )}
                  <span className="font-headline-sm text-[13px] font-bold text-on-surface">
                    {n.title}
                  </span>
                </div>
                <span className="font-code-sm text-[11px] text-on-surface-variant shrink-0">
                  {n.time}
                </span>
              </div>
              <p className="font-body-sm text-[12px] text-on-surface-variant mt-1 leading-snug">
                {n.desc}
              </p>
              {n.action && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToVerification();
                  }}
                  className="mt-2 px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-lg font-label-sm text-[11px] font-bold hover:bg-tertiary-container hover:text-on-tertiary-container transition-colors flex items-center gap-1"
                >
                  <span>{n.action}</span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="p-space-sm bg-surface-container-low text-center border-t border-surface-container">
          <button
            type="button"
            onClick={onClose}
            className="text-primary font-label-sm text-[12px] font-semibold hover:underline"
          >
            Tandai Semua Sudah Dibaca
          </button>
        </div>
      </div>
    </div>
  );
};
