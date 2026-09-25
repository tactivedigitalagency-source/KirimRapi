import React from 'react';
import { USER_AVATAR } from '../data/initialData';

interface StoreSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStore: string;
  onSelectStore: (store: string) => void;
}

export const StoreSwitcherModal: React.FC<StoreSwitcherModalProps> = ({
  isOpen,
  onClose,
  activeStore,
  onSelectStore
}) => {
  if (!isOpen) return null;

  const stores = [
    {
      id: 'toko-mawar',
      name: 'CS Toko Mawar',
      brand: 'Toko Mawar Fashion & Hijab Official',
      role: 'Customer Service Lead',
      ordersToday: 42,
      courierPriority: 'J&T VIP & SiCepat'
    },
    {
      id: 'mawar-shoes',
      name: 'Mawar Footwear Store',
      brand: 'Sepatu Pria & Olahraga',
      role: 'Dispatcher Operasional',
      ordersToday: 19,
      courierPriority: 'JNE Express'
    },
    {
      id: 'beauty-mawar',
      name: 'Mawar Beauty Clinic & Serum',
      brand: 'Skincare & Cosmetics',
      role: 'Staff Gudang & Packing',
      ordersToday: 26,
      courierPriority: 'Lion Parcel & J&T'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-surface-container animate-in fade-in zoom-in-95 duration-200">
        <div className="p-space-lg border-b border-surface-container flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-space-sm">
            <img
              src={USER_AVATAR}
              alt="Budi Santoso"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
            />
            <div>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                Akun Operator CS: Budi Santoso
              </h3>
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                Kelola pesanan antar outlet toko &amp; gudang dispatch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="p-space-lg flex flex-col gap-space-sm">
          <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
            PILIH TOKO AKTIF
          </span>

          <div className="flex flex-col gap-space-xs">
            {stores.map((s) => {
              const isSelected = activeStore === s.name;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectStore(s.name);
                    onClose();
                  }}
                  className={`p-space-md rounded-xl cursor-pointer transition-all flex items-center justify-between border ${
                    isSelected
                      ? 'bg-primary-container/10 border-primary text-on-surface ring-1 ring-primary'
                      : 'bg-surface-container-low hover:bg-surface-container border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-space-sm">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isSelected
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">storefront</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-[14px] font-bold text-on-surface">
                          {s.name}
                        </span>
                        {isSelected && (
                          <span className="px-2 py-0.2 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[10px] font-bold">
                            Sedang Aktif
                          </span>
                        )}
                      </div>
                      <p className="font-body-sm text-[12px] text-on-surface-variant">
                        {s.brand} • {s.courierPriority}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-tabular-data-md text-tabular-data-md font-bold text-primary block">
                      {s.ordersToday} Order
                    </span>
                    <span className="font-label-sm text-[10px] text-on-surface-variant">Hari Ini</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-space-md bg-surface-container-low border-t border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-[12px]">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span>Semua token integrasi WhatsApp terhubung</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-space-md py-1.5 bg-surface-container-highest hover:bg-surface-container text-on-surface rounded-lg font-label-md text-label-md"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
