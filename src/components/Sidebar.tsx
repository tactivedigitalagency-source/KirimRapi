import React from 'react';
import { APP_LOGO, USER_AVATAR } from '../data/initialData';

export type TabKey =
  | 'dashboard-rekap'
  | 'input-pesanan-ai-parser'
  | 'katalog-produk'
  | 'verifikasi-pengiriman'
  | 'ekspor-agregator'
  | 'riwayat-log';

interface SidebarProps {
  currentTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  ordersCount: number;
  unverifiedCount: number;
  onOpenStoreModal: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  ordersCount,
  unverifiedCount,
  onOpenStoreModal,
  isSidebarCollapsed,
  onToggleSidebarCollapse
}) => {
  // Minimize state for the "Navigasi Operasional" section
  const [isNavMinimized, setIsNavMinimized] = React.useState<boolean>(false);

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between select-none transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div
          className={`h-16 flex items-center justify-between bg-surface-container-lowest border-b border-surface-container/40 ${
            isSidebarCollapsed ? 'px-3 justify-center' : 'px-space-lg'
          }`}
        >
          {!isSidebarCollapsed ? (
            <div
              className="flex items-center gap-space-sm cursor-pointer min-w-0"
              onClick={() => onTabChange('dashboard-rekap')}
            >
              <img
                alt="KirimRapi Logo"
                className="h-8 w-auto object-contain"
                src={APP_LOGO}
              />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-space-xs">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
                    KirimRapi
                  </span>
                  <span className="px-space-xs py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-[11px] font-semibold">
                    v1.0
                  </span>
                </div>
                <span className="font-label-sm text-[11px] text-on-surface-variant font-medium truncate">
                  Smart Courier Normalizer
                </span>
              </div>
            </div>
          ) : (
            <div
              className="cursor-pointer flex items-center justify-center"
              onClick={() => onTabChange('dashboard-rekap')}
              title="KirimRapi v1.0"
            >
              <img
                alt="KirimRapi Logo"
                className="h-8 w-8 object-contain"
                src={APP_LOGO}
              />
            </div>
          )}

          {/* Sidebar Full-Collapse Button */}
          <button
            type="button"
            onClick={onToggleSidebarCollapse}
            className={`p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer ${
              isSidebarCollapsed ? 'hidden' : 'block'
            }`}
            title="Minimize Seluruh Sidebar"
          >
            <span className="material-symbols-outlined text-lg">first_page</span>
          </button>
        </div>

        {/* Un-minimize Sidebar button when collapsed */}
        {isSidebarCollapsed && (
          <div className="p-2 flex justify-center border-b border-surface-container/30">
            <button
              type="button"
              onClick={onToggleSidebarCollapse}
              className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-center w-full"
              title="Buka / Perluas Sidebar"
            >
              <span className="material-symbols-outlined text-xl">last_page</span>
            </button>
          </div>
        )}

        {/* Navigation Items with Minimize Feature */}
        <div className={isSidebarCollapsed ? "px-2 py-space-sm" : "px-space-md py-space-sm"}>
          {!isSidebarCollapsed && (
            <div className="px-space-sm py-space-xs mb-space-xs flex items-center justify-between">
              <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                Navigasi Operasional
              </span>
              <button
                type="button"
                onClick={() => setIsNavMinimized(!isNavMinimized)}
                className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center gap-1 transition-all cursor-pointer text-[11px]"
                title={isNavMinimized ? "Perluas Navigasi Operasional" : "Minimize / Ciutkan Navigasi Operasional"}
              >
                <span className="text-[10px] font-medium hidden sm:inline text-on-surface-variant">
                  {isNavMinimized ? 'Perluas' : 'Minimize'}
                </span>
                <span
                  className={`material-symbols-outlined text-base transition-transform duration-200 ${
                    isNavMinimized ? 'rotate-180' : ''
                  }`}
                >
                  expand_less
                </span>
              </button>
            </div>
          )}

          {/* When minimized in full-width mode: Show a compact active item badge with quick expand */}
          {!isSidebarCollapsed && isNavMinimized ? (
            <div
              onClick={() => setIsNavMinimized(false)}
              className="p-2.5 rounded-xl bg-surface-container-low/70 hover:bg-surface-container border border-surface-container-high/40 flex items-center justify-between cursor-pointer transition-colors group mb-2"
              title="Klik untuk membuka kembali menu navigasi"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">
                  {currentTab === 'dashboard-rekap'
                    ? 'dashboard'
                    : currentTab === 'input-pesanan-ai-parser'
                    ? 'auto_awesome'
                    : currentTab === 'katalog-produk'
                    ? 'inventory'
                    : currentTab === 'verifikasi-pengiriman'
                    ? 'verified_user'
                    : currentTab === 'ekspor-agregator'
                    ? 'table_view'
                    : 'history'}
                </span>
                <span className="text-[11px] font-semibold text-on-surface">
                  {currentTab === 'dashboard-rekap'
                    ? 'Dashboard & Rekap'
                    : currentTab === 'input-pesanan-ai-parser'
                    ? 'Input Pesanan & AI'
                    : currentTab === 'katalog-produk'
                    ? 'Rincian & Produk'
                    : currentTab === 'verifikasi-pengiriman'
                    ? 'Verifikasi Alamat'
                    : currentTab === 'ekspor-agregator'
                    ? 'Ekspor Agregator'
                    : 'Riwayat & Log'}
                </span>
              </div>
              <span className="text-[10px] text-primary group-hover:underline font-bold">
                Buka
              </span>
            </div>
          ) : (
            <nav className="flex flex-col gap-space-xs transition-all duration-200">
              {/* 1. Dashboard & Rekap */}
              <button
                type="button"
                onClick={() => onTabChange('dashboard-rekap')}
                title="Dashboard & Rekap"
                className={`flex items-center ${
                  isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-space-md py-space-sm'
                } rounded-lg transition-all text-left w-full relative ${
                  currentTab === 'dashboard-rekap'
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-base">dashboard</span>
                  {!isSidebarCollapsed && (
                    <span className="font-headline-sm text-headline-sm">Dashboard &amp; Rekap</span>
                  )}
                </div>
                {!isSidebarCollapsed ? (
                  <span
                    className={`px-space-xs py-0.5 rounded-full font-tabular-data-md text-tabular-data-md ${
                      currentTab === 'dashboard-rekap'
                        ? 'bg-primary/20 text-on-primary-container font-bold'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {ordersCount}
                  </span>
                ) : (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-on-primary text-[9px] font-bold flex items-center justify-center">
                    {ordersCount}
                  </span>
                )}
              </button>

              {/* 2. Input Pesanan & AI */}
              <button
                type="button"
                onClick={() => onTabChange('input-pesanan-ai-parser')}
                title="Input Pesanan & AI"
                className={`flex items-center ${
                  isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-space-md py-space-sm'
                } rounded-lg transition-all text-left w-full relative ${
                  currentTab === 'input-pesanan-ai-parser'
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-base">auto_awesome</span>
                  {!isSidebarCollapsed && (
                    <span className="font-headline-sm text-headline-sm">Input Pesanan &amp; AI</span>
                  )}
                </div>
                {!isSidebarCollapsed ? (
                  <span className="px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-semibold">
                    Baru
                  </span>
                ) : (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-secondary"></span>
                )}
              </button>

              {/* 3. Katalog & Rincian Produk */}
              <button
                type="button"
                onClick={() => onTabChange('katalog-produk')}
                title="Rincian & Produk (Katalog)"
                className={`flex items-center ${
                  isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-space-md py-space-sm'
                } rounded-lg transition-all text-left w-full ${
                  currentTab === 'katalog-produk'
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-base">inventory</span>
                  {!isSidebarCollapsed && (
                    <span className="font-headline-sm text-headline-sm">Rincian &amp; Produk</span>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <span className="px-space-xs py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-[11px] font-semibold">
                    Katalog
                  </span>
                )}
              </button>

              {/* 4. Verifikasi Alamat */}
              <button
                type="button"
                onClick={() => onTabChange('verifikasi-pengiriman')}
                title={`Verifikasi Alamat (${unverifiedCount} Konfirmasi)`}
                className={`flex items-center ${
                  isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-space-md py-space-sm'
                } rounded-lg transition-all text-left w-full relative ${
                  currentTab === 'verifikasi-pengiriman'
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-base">verified_user</span>
                  {!isSidebarCollapsed && (
                    <span className="font-headline-sm text-headline-sm">Verifikasi Alamat</span>
                  )}
                </div>
                {!isSidebarCollapsed ? (
                  <span className="px-space-xs py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-[11px] font-semibold">
                    {unverifiedCount} Konfirmasi
                  </span>
                ) : (
                  unverifiedCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {unverifiedCount}
                    </span>
                  )
                )}
              </button>

              {/* 4. Ekspor Agregator */}
              <button
                type="button"
                onClick={() => onTabChange('ekspor-agregator')}
                title="Ekspor Agregator (API & Excel)"
                className={`flex items-center ${
                  isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-space-md py-space-sm'
                } rounded-lg transition-all text-left w-full ${
                  currentTab === 'ekspor-agregator'
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-base">table_view</span>
                  {!isSidebarCollapsed && (
                    <span className="font-headline-sm text-headline-sm">Ekspor Agregator</span>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <span className={`font-label-sm text-[11px] ${currentTab === 'ekspor-agregator' ? 'text-on-primary-container font-medium' : 'text-on-surface-variant'}`}>
                    API &amp; Excel
                  </span>
                )}
              </button>

              {/* 5. Riwayat & Log */}
              <button
                type="button"
                onClick={() => onTabChange('riwayat-log')}
                title="Riwayat & Log"
                className={`flex items-center ${
                  isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-space-md py-space-sm'
                } rounded-lg transition-all text-left w-full ${
                  currentTab === 'riwayat-log'
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-base">history</span>
                  {!isSidebarCollapsed && (
                    <span className="font-headline-sm text-headline-sm">Riwayat &amp; Log</span>
                  )}
                </div>
              </button>
            </nav>
          )}
        </div>

        {/* AI Parser Status Card & Mengantar API status */}
        {!isSidebarCollapsed ? (
          <div className="px-space-md py-space-sm mt-auto">
            <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-xs border border-surface-container-high/40">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-[11px] text-on-surface-variant font-medium">Status AI Parser</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  <span className="font-label-sm text-[11px] text-secondary font-semibold">Aktif</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-on-surface text-[12px]">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Model Engine</span>
                <span className="font-code-sm text-code-sm text-on-surface font-semibold">LLM-ID v2.4</span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-primary h-full w-[84%] rounded-full"></div>
              </div>
              <div className="flex justify-between font-label-sm text-[11px] text-on-surface-variant pt-0.5">
                <span>Kuota Harian</span>
                <span className="font-semibold text-on-surface">842 / 1.000</span>
              </div>

              {/* Mengantar API Status Pill */}
              <div className="p-2 rounded-lg bg-surface-container-lowest flex items-center justify-between border border-surface-container mt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-primary text-on-primary flex items-center justify-center font-bold text-[9px]">
                    M
                  </div>
                  <span className="font-label-sm text-[11px] text-on-surface font-semibold">Mengantar API v3</span>
                </div>
                <span className="font-code-sm text-[10px] text-secondary font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Connected
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2 mt-auto flex flex-col items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-center text-primary cursor-pointer"
              title="Status AI: LLM-ID v2.4 Aktif (842/1.000)"
            >
              <span className="material-symbols-outlined text-base">smart_toy</span>
            </div>
          </div>
        )}
      </div>

      {/* Profile Footer */}
      <div
        className={`p-space-md bg-surface-container-lowest shadow-[0_-1px_4px_rgba(0,0,0,0.03)] border-t border-surface-container/60 ${
          isSidebarCollapsed ? 'px-2 py-3 flex justify-center' : ''
        }`}
      >
        {!isSidebarCollapsed ? (
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-space-sm min-w-0 cursor-pointer hover:opacity-85 transition-opacity"
              onClick={onOpenStoreModal}
              title="Klik untuk info toko"
            >
              <img
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-primary/20"
                src={USER_AVATAR}
              />
              <div className="flex flex-col min-w-0">
                <span className="font-headline-sm text-headline-sm text-on-surface truncate font-semibold">
                  Budi Santoso
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate text-[11px]">
                  CS Toko Mawar
                </span>
              </div>
            </div>
            <button
              className="p-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
              title="Ganti Toko / Akun"
              type="button"
              onClick={onOpenStoreModal}
            >
              <span className="material-symbols-outlined text-base">sync_alt</span>
            </button>
          </div>
        ) : (
          <div
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onOpenStoreModal}
            title="Budi Santoso - CS Toko Mawar (Klik untuk ganti toko)"
          >
            <img
              alt="Profile"
              className="w-9 h-9 rounded-full object-cover ring-1 ring-primary/20"
              src={USER_AVATAR}
            />
          </div>
        )}
      </div>
    </aside>
  );
};
