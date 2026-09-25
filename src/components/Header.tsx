import React from 'react';
import { USER_AVATAR } from '../data/initialData';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onQuickInputClick: () => void;
  onNotificationsClick: () => void;
  unreadNotificationsCount: number;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onQuickInputClick,
  onNotificationsClick,
  unreadNotificationsCount,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse
}) => {
  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-space-lg border-b border-surface-container/30 transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? 'left-20' : 'left-72'
      }`}
    >
      <div className="flex items-center gap-space-md">
        {onToggleSidebarCollapse && (
          <button
            type="button"
            onClick={onToggleSidebarCollapse}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            title={isSidebarCollapsed ? "Perluas Sidebar" : "Minimize Sidebar"}
          >
            <span className="material-symbols-outlined text-xl">
              {isSidebarCollapsed ? 'menu_open' : 'menu'}
            </span>
          </button>
        )}

        {/* Search Input */}
        <div className="relative w-72 sm:w-80">
          <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
            search
          </span>
          <input
            className="w-full pl-9 pr-space-md py-1.5 bg-surface-container-lowest rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm border border-surface-container-high/50"
            placeholder="Cari pesanan, resi, nama, WA..."
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
          )}
        </div>

        {/* Live Date Indicator */}
        <div className="hidden xl:flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
          <span className="material-symbols-outlined text-base text-primary">calendar_today</span>
          <span className="font-semibold text-on-surface">Hari ini, 24 September 2026</span>
          <span className="inline-block w-2 h-2 rounded-full bg-secondary"></span>
        </div>
      </div>

      <div className="flex items-center gap-space-md">
        {/* + Input Pesanan (WA) Action */}
        <button
          className="flex items-center gap-space-xs px-space-md py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-all shadow-sm cursor-pointer active:scale-95"
          type="button"
          onClick={onQuickInputClick}
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>Input Pesanan (WA)</span>
        </button>

        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          type="button"
          onClick={onNotificationsClick}
          title="Notifikasi Operasional"
        >
          <span className="material-symbols-outlined text-lg">notifications</span>
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-error text-on-error rounded-full flex items-center justify-center font-label-sm text-[10px] font-bold animate-pulse">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        <div className="h-6 w-px bg-surface-container-high"></div>

        {/* Small Profile Chip */}
        <div className="flex items-center gap-space-xs px-space-sm py-1 bg-surface-container-low rounded-lg border border-surface-container-high/40">
          <img
            alt="Profile"
            className="w-7 h-7 rounded-full object-cover shrink-0"
            src={USER_AVATAR}
          />
          <span className="font-label-md text-label-md text-on-surface hidden md:inline font-semibold">
            Budi S.
          </span>
        </div>
      </div>
    </header>
  );
};
