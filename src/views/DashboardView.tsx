import React, { useState } from 'react';
import { OrderItem } from '../types';

interface DashboardViewProps {
  orders: OrderItem[];
  onNavigateToTab: (tab: any) => void;
  onQuickInputClick: () => void;
  onShowToast: (title: string, desc: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  onNavigateToTab,
  onQuickInputClick,
  onShowToast
}) => {
  const [selectedCourierFilter, setSelectedCourierFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const unverifiedOrders = orders.filter((o) => o.validationStatus === 'perlu_review');
  const readyOrders = orders.filter((o) => o.validationStatus === 'siap' || o.validationStatus === 'dikonfirmasi');
  const exportedOrders = orders.filter((o) => o.exported);

  const totalOmset = orders.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const codOrders = orders.filter((o) => o.paymentMethod === 'COD');
  const codPercentage = Math.round((codOrders.length / (orders.length || 1)) * 100);

  // Filter orders for table
  const displayedOrders = orders.filter((ord) => {
    if (selectedCourierFilter !== 'all' && !ord.courier.toLowerCase().includes(selectedCourierFilter.toLowerCase())) {
      return false;
    }
    if (selectedStatusFilter !== 'all') {
      if (selectedStatusFilter === 'perlu' && ord.validationStatus !== 'perlu_review') return false;
      if (selectedStatusFilter === 'siap' && ord.validationStatus !== 'siap') return false;
      if (selectedStatusFilter === 'exported' && !ord.exported) return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = ord.customerName.toLowerCase().includes(q);
      const matchNumber = ord.orderNumber.toLowerCase().includes(q);
      const matchPhone = ord.phone.includes(q);
      const matchCity = ord.address.city.toLowerCase().includes(q);
      if (!matchName && !matchNumber && !matchPhone && !matchCity) return false;
    }
    return true;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      onShowToast('Data Diperbarui', 'Sinkronisasi terbaru dengan webhook WhatsApp dan manifest kurir berhasil.');
    }, 600);
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Top Greeting Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container/50">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold">
              Halo, Budi Santoso 👋
            </h1>
            <span className="px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-bold">
              CS Toko Mawar
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Pusat Kendali Pengiriman Toko Mawar • 24 September 2026 • Semua sistem kurir normal
          </p>
        </div>

        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-all flex items-center gap-1 font-label-md text-label-md cursor-pointer border border-surface-container-high/40"
            title="Segarkan Data"
          >
            <span className={`material-symbols-outlined text-base text-primary ${isRefreshing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span className="hidden md:inline font-semibold">Segarkan Data</span>
          </button>

          <button
            type="button"
            onClick={onQuickInputClick}
            className="px-space-lg py-2.5 bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container rounded-lg font-headline-sm text-headline-sm transition-all shadow-md flex items-center gap-2 font-bold cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>+ Input Pesanan</span>
          </button>
        </div>
      </div>

      {/* 4 Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {/* KPI 1 */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
              TOTAL ORDER MASUK
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-base">shopping_bag</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="font-tabular-data-lg text-3xl font-bold text-on-surface block">
              {orders.length} Pesanan
            </span>
            <span className="font-body-sm text-[11px] text-secondary font-semibold flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              <span>↑ 12% vs Kemarin (37 Pesanan)</span>
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
              OMSET PENJUALAN
            </span>
            <div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-base">payments</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="font-tabular-data-lg text-2xl font-bold text-on-surface block">
              Rp {totalOmset.toLocaleString('id-ID')}
            </span>
            <span className="font-body-sm text-[11px] text-on-surface-variant mt-1 block">
              COD: {codPercentage}% • Transfer: {100 - codPercentage}%
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
              NORMALISASI ALAMAT (AI)
            </span>
            <div className="w-8 h-8 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-base">auto_awesome</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="font-tabular-data-lg text-3xl font-bold text-secondary block">
              {orders.length - unverifiedOrders.length} Sukses
            </span>
            <span className="font-body-sm text-[11px] text-tertiary-container font-semibold mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">warning</span>
              <span>{unverifiedOrders.length} Perlu Konfirmasi WA</span>
            </span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
              KESIAPAN EKSPOR KURIR
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-high text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-base">local_shipping</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="font-tabular-data-lg text-3xl font-bold text-primary block">
              {readyOrders.length} Siap Kirim
            </span>
            <span className="font-body-sm text-[11px] text-on-surface-variant mt-1 block">
              {exportedOrders.length} Sudah di-Pickup Kurir
            </span>
          </div>
        </div>
      </div>

      {/* Amber Attention Banner */}
      {unverifiedOrders.length > 0 && (
        <div className="bg-tertiary-fixed text-on-tertiary-fixed p-space-md rounded-xl shadow-sm border border-tertiary-fixed-dim/50 flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
          <div className="flex items-start gap-space-sm">
            <div className="w-9 h-9 rounded-lg bg-tertiary-container text-on-tertiary-container flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-lg">warning</span>
            </div>
            <div>
              <span className="font-headline-sm text-headline-sm font-bold block">
                Perhatian Dispatcher: {unverifiedOrders.length} Pesanan Membutuhkan Verifikasi WhatsApp Segera
              </span>
              <p className="font-body-sm text-[12px] opacity-90 leading-tight mt-0.5">
                Batas cut-off penyerahan kurir sore adalah 15:00 WIB. Terdapat ketidakjelasan RT/RW &amp; nama kecamatan yang berisiko retur COD.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTab('verifikasi-pengiriman')}
            className="px-space-md py-2 bg-tertiary-container text-on-tertiary-container rounded-lg font-headline-sm text-headline-sm font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
          >
            <span>Buka Antrean Verifikasi ({unverifiedOrders.length})</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      )}

      {/* Two-Column Zone: Orders Table (8 cols) + Efficiency & Schedules (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Orders Table Main (8 cols) */}
        <div className="lg:col-span-8 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md border border-surface-container/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Daftar Pesanan Hari Ini
              </h2>
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                Menampilkan {displayedOrders.length} pesanan yang tercatat dalam sistem hari ini
              </p>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                className="bg-surface-container-low text-on-surface font-body-sm text-[12px] px-2.5 py-1.5 rounded-lg border border-surface-container-high/40 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                value={selectedCourierFilter}
                onChange={(e) => setSelectedCourierFilter(e.target.value)}
              >
                <option value="all">Semua Kurir</option>
                <option value="j&t">J&amp;T Express</option>
                <option value="sicepat">SiCepat</option>
                <option value="jne">JNE Express</option>
                <option value="lion">Lion Parcel</option>
              </select>

              <select
                className="bg-surface-container-low text-on-surface font-body-sm text-[12px] px-2.5 py-1.5 rounded-lg border border-surface-container-high/40 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="siap">Siap Kirim</option>
                <option value="perlu">Perlu Verifikasi</option>
                <option value="exported">Sudah Diekspor</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-space-md rounded-l-lg">ID &amp; Waktu</th>
                  <th className="py-2.5 px-space-md">Penerima &amp; Kota</th>
                  <th className="py-2.5 px-space-md">Produk &amp; Bayar</th>
                  <th className="py-2.5 px-space-md">Kurir</th>
                  <th className="py-2.5 px-space-md">Status Alamat</th>
                  <th className="py-2.5 px-space-md text-right rounded-r-lg">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-body-sm text-[12px]">
                {displayedOrders.slice(0, 8).map((ord) => (
                  <tr key={ord.id} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-2.5 px-space-md font-tabular-data-md">
                      <span className="font-bold text-primary block">{ord.orderNumber}</span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant">{ord.time}</span>
                    </td>
                    <td className="py-2.5 px-space-md">
                      <span className="font-headline-sm font-semibold text-on-surface block">
                        {ord.customerName}
                      </span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant">
                        {ord.address.city} • {ord.phone}
                      </span>
                    </td>
                    <td className="py-2.5 px-space-md">
                      <span className="font-medium text-on-surface block truncate max-w-[180px]">
                        {ord.productSummary}
                      </span>
                      <span className="font-code-sm text-[11px] font-bold text-on-surface">
                        Rp {ord.totalAmount.toLocaleString('id-ID')}{' '}
                        <span className="font-normal text-on-surface-variant">({ord.paymentMethod})</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-space-md">
                      <span className="px-2 py-0.5 rounded bg-surface-container-high font-label-sm text-[11px] text-on-surface font-semibold">
                        {ord.courierServiceCode}
                      </span>
                    </td>
                    <td className="py-2.5 px-space-md">
                      <span
                        className={`px-space-xs py-0.5 rounded-full font-label-sm text-[11px] inline-flex items-center gap-1 font-semibold ${
                          ord.validationStatus === 'perlu_review'
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                            : 'bg-secondary-container text-on-secondary-container'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            ord.validationStatus === 'perlu_review' ? 'bg-tertiary' : 'bg-secondary'
                          }`}
                        ></span>
                        <span>{ord.validationTagLabel}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-space-md text-right">
                      {ord.validationStatus === 'perlu_review' ? (
                        <button
                          type="button"
                          onClick={() => onNavigateToTab('verifikasi-pengiriman')}
                          className="px-2 py-1 bg-tertiary-fixed text-on-tertiary-fixed hover:bg-tertiary-container hover:text-on-tertiary-container rounded font-label-sm text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Verifikasi
                        </button>
                      ) : (
                        <a
                          href={`https://wa.me/62${ord.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded text-secondary hover:bg-secondary-container/50 inline-block transition-colors"
                          title="Hubungi WA"
                        >
                          <span className="material-symbols-outlined text-base">chat</span>
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-surface-container text-on-surface-variant text-[12px]">
            <span>Menampilkan 8 dari {displayedOrders.length} pesanan</span>
            <button
              type="button"
              onClick={() => onNavigateToTab('ekspor-agregator')}
              className="text-primary font-semibold hover:underline cursor-pointer"
            >
              Lihat di Portal Ekspor →
            </button>
          </div>
        </div>

        {/* Right Sidebar Widgets (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-space-md">
          {/* Widget 1: AI Parser Efficiency */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container/50 flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                EFISIENSI AI PARSER
              </span>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[10px] font-bold">
                Akurasi Tinggi
              </span>
            </div>

            <div className="flex items-center gap-space-md mt-1">
              <div className="w-16 h-16 rounded-full bg-primary/10 border-4 border-primary flex items-center justify-center shrink-0">
                <span className="font-tabular-data-lg text-base font-bold text-primary">94.2%</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Hemat 4.5 Jam CS Hari Ini
                </span>
                <p className="font-body-sm text-[11px] text-on-surface-variant leading-tight mt-0.5">
                  39 dari 42 alamat selesai tanpa intervensi manual; typo kecamatan dan kodepos terkoreksi otomatis.
                </p>
              </div>
            </div>
          </div>

          {/* Widget 2: Jadwal Pick-Up Hari Ini */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container/50 flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                JADWAL PICK-UP HARI INI
              </span>
              <span className="font-code-sm text-[11px] text-primary font-semibold">Live Dispatch</span>
            </div>

            <div className="flex flex-col gap-space-xs mt-1">
              <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between border border-surface-container-high/30">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    <span className="font-headline-sm text-[12px] font-bold text-on-surface">J&amp;T Express</span>
                    <span className="text-on-surface-variant text-[11px]">15:00 WIB</span>
                  </div>
                  <span className="font-body-sm text-[11px] text-on-surface-variant">
                    14 Paket • Status: Siap Pick-up
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('ekspor-agregator')}
                  className="px-2 py-1 bg-surface-container hover:bg-surface-container-high rounded text-[11px] font-semibold text-primary cursor-pointer"
                >
                  Batch CSV
                </button>
              </div>

              <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between border border-surface-container-high/30">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <span className="font-headline-sm text-[12px] font-bold text-on-surface">SiCepat</span>
                    <span className="text-on-surface-variant text-[11px]">16:30 WIB</span>
                  </div>
                  <span className="font-body-sm text-[11px] text-on-surface-variant">
                    10 Paket • Status: Dalam Proses
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('ekspor-agregator')}
                  className="px-2 py-1 bg-surface-container hover:bg-surface-container-high rounded text-[11px] font-semibold text-primary cursor-pointer"
                >
                  Batch CSV
                </button>
              </div>

              <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between border border-surface-container-high/30">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-surface-variant"></span>
                    <span className="font-headline-sm text-[12px] font-bold text-on-surface">JNE Express</span>
                    <span className="text-on-surface-variant text-[11px]">17:00 WIB</span>
                  </div>
                  <span className="font-body-sm text-[11px] text-on-surface-variant">
                    4 Paket • Status: Menunggu
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('ekspor-agregator')}
                  className="px-2 py-1 bg-surface-container hover:bg-surface-container-high rounded text-[11px] font-semibold text-primary cursor-pointer"
                >
                  Batch CSV
                </button>
              </div>
            </div>
          </div>

          {/* Widget 3: Quick Action Banner */}
          <div className="bg-gradient-to-br from-primary to-primary-container text-on-primary p-space-md rounded-xl shadow-md flex flex-col justify-between">
            <div>
              <span className="font-headline-sm text-headline-sm font-bold block">
                Siap Unduh Berkas Pengiriman?
              </span>
              <p className="font-body-sm text-[11px] opacity-90 mt-1 leading-snug">
                Unduh file spreadsheet sesuai format resmi portal ekspedisi agar label pengiriman dapat langsung dicetak oleh tim packing.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('ekspor-agregator')}
              className="mt-3 w-full py-2 bg-surface-container-lowest text-primary hover:bg-surface-container-low rounded-lg font-headline-sm text-headline-sm font-bold text-center transition-all cursor-pointer shadow-sm active:scale-95"
            >
              Buka Portal Ekspor Agregator →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
