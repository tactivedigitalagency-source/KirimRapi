import React, { useState } from 'react';
import { SystemLogItem } from '../types';

interface RiwayatLogViewProps {
  logs: SystemLogItem[];
  onClearLogs?: () => void;
  onShowToast: (title: string, desc: string) => void;
}

export const RiwayatLogView: React.FC<RiwayatLogViewProps> = ({ logs, onClearLogs, onShowToast }) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const filteredLogs = logs.filter((l) => {
    if (activeFilter !== 'all' && l.type !== activeFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        l.title.toLowerCase().includes(q) ||
        l.detail.toLowerCase().includes(q) ||
        l.user.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container/50">
        <div className="flex items-start gap-space-md">
          <div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm shrink-0">
            <span className="material-symbols-outlined text-2xl">history</span>
          </div>
          <div className="flex flex-col">
            <h1 className="font-headline-md text-headline-md text-on-surface font-bold">
              Riwayat Aktivitas &amp; Log Sistem KirimRapi
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-relaxed">
              Catatan audit operasional dispatcher: parser AI, konfirmasi WhatsApp ke pembeli, koreksi kodepos Kemendagri, dan ekspor kurir.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-space-xs shrink-0">
          {onClearLogs && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              disabled={logs.length === 0}
              className="px-space-md py-2 bg-error-container/40 hover:bg-error-container text-error rounded-lg font-label-md text-label-md transition-colors flex items-center gap-1.5 font-semibold cursor-pointer border border-error/20 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Bersihkan seluruh log audit"
            >
              <span className="material-symbols-outlined text-base">delete_sweep</span>
              <span>Hapus Semua Log</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              const logContent = JSON.stringify(logs, null, 2);
              navigator.clipboard.writeText(logContent);
              onShowToast('Log Tersalin', 'Semua riwayat sistem disalin ke clipboard.');
            }}
            className="px-space-md py-2 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg font-label-md text-label-md transition-colors flex items-center gap-1.5 font-semibold cursor-pointer border border-surface-container-high/40 shrink-0"
          >
            <span className="material-symbols-outlined text-base">content_copy</span>
            <span>Salin Log Audit</span>
          </button>
        </div>
      </div>

      {/* Clear Logs Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-space-md">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-lg shadow-2xl border border-surface-container flex flex-col gap-space-md animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-space-sm text-error">
              <div className="w-10 h-10 rounded-xl bg-error-container/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <div className="flex flex-col">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Hapus Semua Riwayat Log?
                </h3>
                <span className="text-[12px] text-on-surface-variant">Tindakan ini tidak dapat dibatalkan</span>
              </div>
            </div>
            <p className="text-body-sm text-[13px] text-on-surface-variant leading-relaxed">
              Seluruh ({logs.length}) entri catatan aktivitas sistem, riwayat parser AI, dan riwayat pengiriman akan dihapus secara permanen.
            </p>
            <div className="flex items-center justify-end gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearLogs?.();
                  setShowClearConfirm(false);
                }}
                className="px-space-md py-2 rounded-lg bg-error hover:bg-error/90 text-on-error font-label-md text-label-md font-semibold cursor-pointer shadow-sm"
              >
                Ya, Hapus Semua Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-sm">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Semua Log
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('parser')}
            className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors cursor-pointer ${
              activeFilter === 'parser'
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Normalisasi AI
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('wa')}
            className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors cursor-pointer ${
              activeFilter === 'wa'
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            WhatsApp Klik-Kirim
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('export')}
            className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors cursor-pointer ${
              activeFilter === 'export'
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Ekspor Agregator
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('edit')}
            className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors cursor-pointer ${
              activeFilter === 'edit'
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Koreksi Kodepos Kemendagri
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            className="w-full px-3 py-1.5 bg-surface-container-low rounded-lg font-body-sm text-[12px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container-high/40"
            placeholder="Cari dalam catatan log..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Log Feed */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container/50 flex flex-col gap-space-sm">
        {filteredLogs.map((item) => (
          <div
            key={item.id}
            className="p-space-md bg-surface-container-low rounded-xl flex items-start gap-space-md border border-surface-container-high/30 hover:bg-surface-container transition-colors"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                item.type === 'parser'
                  ? 'bg-primary-fixed text-on-primary-fixed'
                  : item.type === 'wa'
                  ? 'bg-secondary-container text-on-secondary-container'
                  : item.type === 'export'
                  ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                  : 'bg-surface-container-highest text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {item.type === 'parser'
                  ? 'auto_awesome'
                  : item.type === 'wa'
                  ? 'chat'
                  : item.type === 'export'
                  ? 'table_view'
                  : 'edit'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-headline-sm text-[13px] font-bold text-on-surface">
                    {item.title}
                  </span>
                  {item.badge && (
                    <span className="px-2 py-0.2 rounded-full bg-surface-container-highest text-on-surface font-label-sm text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="font-code-sm text-[11px] text-on-surface-variant">
                  {item.timestamp}
                </span>
              </div>

              <p className="font-body-sm text-[12px] text-on-surface-variant mt-1 leading-snug">
                {item.detail}
              </p>

              <div className="mt-2 flex items-center gap-1 font-label-sm text-[10px] text-on-surface-variant">
                <span className="material-symbols-outlined text-xs">person</span>
                <span>Dioperasikan oleh: <strong>{item.user}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
