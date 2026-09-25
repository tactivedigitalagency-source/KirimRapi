import React, { useState } from 'react';
import { OrderItem, ExportHistoryItem, CourierService, MengantarApiConfig } from '../types';
import { generateAggregatorCSV, downloadBlobAsFile, getExportPayloadPreview, REQUIRED_CSV_HEADERS } from '../utils/exportUtils';
import { pushOrdersToMengantar, DEFAULT_MENGANTAR_CONFIG, getStoredMengantarConfig } from '../services/mengantarApi';
import { MengantarConfigModal } from '../components/MengantarConfigModal';

interface EksporViewProps {
  orders: OrderItem[];
  exportHistory: ExportHistoryItem[];
  onAddExportHistory: (item: ExportHistoryItem) => void;
  onShowToast: (title: string, desc: string) => void;
}

export const EksporView: React.FC<EksporViewProps> = ({
  orders,
  exportHistory,
  onAddExportHistory,
  onShowToast
}) => {
  const [selectedAggregator, setSelectedAggregator] = useState<string>('mengantar');
  const [dateRange, setDateRange] = useState<string>('today');
  const [onlyReady, setOnlyReady] = useState<boolean>(true);
  const [antiDuplicate, setAntiDuplicate] = useState<boolean>(true);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [showFormatGuide, setShowFormatGuide] = useState<boolean>(false);
  const [isMengantarModalOpen, setIsMengantarModalOpen] = useState<boolean>(false);
  const [mengantarConfig, setMengantarConfig] = useState<MengantarApiConfig>(() => getStoredMengantarConfig());
  const [isPushingApi, setIsPushingApi] = useState<boolean>(false);

  // Ready orders list
  const exportableOrders = orders.filter((o) => {
    if (onlyReady && (o.validationStatus === 'perlu_review' || o.validationStatus === 'dibatalkan')) {
      return false;
    }
    if (antiDuplicate && o.exported) {
      return false;
    }
    return true;
  });

  // Selected row IDs for batch export
  const [selectedIds, setSelectedIds] = useState<string[]>(() => exportableOrders.map((o) => o.id));

  // Toggle selection
  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(exportableOrders.map((o) => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Selected items calculation
  const selectedOrders = exportableOrders.filter((o) => selectedIds.includes(o.id));
  const totalWeightKg = selectedOrders.reduce((acc, curr) => acc + curr.weightKg, 0);
  const totalCodAmount = selectedOrders
    .filter((o) => o.paymentMethod === 'COD')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  // Export File Handlers
  const handleExportCsvTemplate = () => {
    if (selectedOrders.length === 0) {
      onShowToast('Pilih Pesanan', 'Silakan centang minimal 1 pesanan untuk diekspor.');
      return;
    }

    const courierMap: Record<string, CourierService> = {
      jnt: 'J&T Express',
      sicepat: 'SiCepat',
      jne: 'JNE Express',
      ninja: 'Ninja Van',
      anteraja: 'Anteraja',
      mengantar: 'J&T Express'
    };

    const csvContent = generateAggregatorCSV(selectedOrders, selectedAggregator);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `KirimRapi_Export_${dateStr}_Batch${exportHistory.length + 1}.csv`;

    // Download file blob UTF-8
    downloadBlobAsFile(csvContent, fileName, 'text/csv;charset=utf-8;');

    // Add to history
    const newHistoryItem: ExportHistoryItem = {
      id: `exp-${Date.now()}`,
      fileName,
      orderCount: selectedOrders.length,
      downloadTime: 'Hari ini, ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      downloadBy: 'Budi Santoso',
      checksum: Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      status: 'Siap Pick-up',
      courier: courierMap[selectedAggregator] || 'J&T Express'
    };

    onAddExportHistory(newHistoryItem);

    // Mark selected orders as exported
    selectedOrders.forEach((o) => {
      o.exported = true;
      o.validationStatus = 'terekspor';
      o.validationTagLabel = 'Siap Pick-up';
    });

    onShowToast('Ekspor CSV Berhasil!', `Berkas ${fileName} (${selectedOrders.length} pesanan) berhasil diunduh dengan format 12 kolom.`);
  };

  const handleExportCsv = () => {
    handleExportCsvTemplate();
  };

  // Push Direct Booking to Mengantar API
  const handlePushMengantar = async () => {
    if (selectedOrders.length === 0) {
      onShowToast('Pilih Pesanan', 'Silakan centang minimal 1 pesanan untuk dikirim ke API Mengantar.');
      return;
    }

    setIsPushingApi(true);
    try {
      const res = await pushOrdersToMengantar(selectedOrders, mengantarConfig);

      const newHistoryItem: ExportHistoryItem = {
        id: `exp-${Date.now()}`,
        fileName: `API_Booking_${res.bookingBatchId}.json`,
        orderCount: selectedOrders.length,
        downloadTime: 'Hari ini, ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        downloadBy: 'API System (Budi Santoso)',
        checksum: res.bookingBatchId,
        status: 'API Terkirim',
        courier: 'Mengantar API'
      };

      onAddExportHistory(newHistoryItem);

      selectedOrders.forEach((o) => {
        o.exported = true;
        o.validationStatus = 'terekspor';
        o.validationTagLabel = 'Resi Mengantar Aktif';
        o.mengantarBookingId = `MGT-${Math.floor(100000 + Math.random() * 900000)}`;
      });

      onShowToast('Booking API Berhasil!', `${res.bookedCount} pesanan terkirim langsung ke API Mengantar (${res.bookingBatchId}). Manifest kurir siap pick-up.`);
    } catch (e) {
      onShowToast('Gagal Kirim API', 'Terjadi kesalahan saat memanggil endpoint API Mengantar.');
    } finally {
      setIsPushingApi(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Header Banner PRD P0.3 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container/50">
        <div className="flex items-start gap-space-md">
          <div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm shrink-0">
            <span className="material-symbols-outlined text-2xl">table_view</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-space-xs flex-wrap">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold">
                Ekspor Data Pesanan ke CSV Template
              </h1>
              <span className="px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-semibold">
                Format Delimiter Titik Koma (;)
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-relaxed">
              Template CSV baku 12 kolom siap impor: Nama Penerima;Alamat Penerima;Nomor Telepon;Kode Pos;Berat;Harga Barang (Jika NON-COD);Nilai COD (Jika COD);Isi Paketan (Nama Produk);*Kelurahan;*Kecamatan;**Quantity;*Instruksi Pengiriman.
            </p>
          </div>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex items-center gap-space-sm flex-wrap">
          {selectedAggregator === 'mengantar' && (
            <button
              type="button"
              onClick={() => setIsMengantarModalOpen(true)}
              className="px-space-md py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors flex items-center gap-1.5 cursor-pointer font-semibold border border-surface-container-high/40"
            >
              <span className="material-symbols-outlined text-base text-primary">settings</span>
              <span>Konfigurasi API Mengantar</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowJsonModal(true)}
            className="px-space-md py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors flex items-center gap-1.5 cursor-pointer font-semibold border border-surface-container-high/40"
          >
            <span className="material-symbols-outlined text-base text-primary">data_object</span>
            <span>Inspeksi Raw JSON</span>
          </button>

          {selectedAggregator === 'mengantar' ? (
            <button
              type="button"
              onClick={handlePushMengantar}
              disabled={isPushingApi}
              className="px-space-lg py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-headline-sm text-headline-sm transition-all flex items-center gap-2 shadow-md cursor-pointer font-bold active:scale-95 disabled:opacity-60"
            >
              {isPushingApi ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin"></span>
                  <span>Mengirim ke API Mengantar...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">cloud_upload</span>
                  <span>Kirim Booking via API Mengantar 🚀</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExportCsvTemplate}
              className="px-space-lg py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-headline-sm text-headline-sm transition-all flex items-center gap-2 shadow-md cursor-pointer font-bold active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">file_download</span>
              <span>Download Berkas CSV Template</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Agregator Selector Toolbar */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md border border-surface-container/50">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-md flex-wrap">
          {/* Agregator Picker */}
          <div className="flex flex-col gap-1 min-w-[260px]">
            <label className="font-label-sm text-[11px] text-on-surface-variant font-bold uppercase tracking-wider flex items-center justify-between">
              <span>PILIH PORTAL AGREGATOR KURIR</span>
              {selectedAggregator === 'mengantar' && (
                <span className="text-secondary font-bold font-code-sm text-[10px]">API Ready</span>
              )}
            </label>
            <div className="relative">
              <select
                className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md py-2 pl-3 pr-8 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary shadow-sm border border-surface-container-high/40 font-semibold"
                value={selectedAggregator}
                onChange={(e) => setSelectedAggregator(e.target.value)}
              >
                <option value="mengantar">⚡ Mengantar.com (Direct API Booking &amp; COD Agregator)</option>
                <option value="jnt">J&amp;T Express VIP Shipping (Layout A-H)</option>
                <option value="sicepat">SiCepat Cargo &amp; Reguler Bulk</option>
                <option value="jne">JNE Online Booking (JOB) Standard</option>
                <option value="ninja">Ninja Van CSV Standard</option>
                <option value="anteraja">Anteraja Bisnis Bulk Dispatch</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Date Picker Range */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
              RENTANG WAKTU PESANAN
            </label>
            <div className="relative">
              <select
                className="bg-surface-container-low text-on-surface font-body-sm text-body-sm py-2 pl-3 pr-8 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary shadow-sm border border-surface-container-high/40"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="today">Hari ini (24 Sep 2026)</option>
                <option value="yesterday">Kemarin (23 Sep 2026)</option>
                <option value="week">7 Hari Terakhir</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                expand_more
              </span>
            </div>
          </div>
        </div>

        {/* Operational Toggles */}
        <div className="flex items-center gap-space-md flex-wrap pt-2 lg:pt-0">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyReady}
              onChange={(e) => setOnlyReady(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
            />
            <span className="font-label-md text-label-md text-on-surface font-medium">
              Alamat Siap Kirim Saja ({orders.filter((o) => o.validationStatus !== 'perlu_review' && o.validationStatus !== 'dibatalkan').length})
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={antiDuplicate}
              onChange={(e) => setAntiDuplicate(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
            />
            <span className="font-label-md text-label-md text-on-surface font-medium">
              Cegah Duplikasi Ekspor
            </span>
          </label>
        </div>
      </div>

      {/* Metric Bento Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        {/* Metric 1 */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between border border-surface-container/50">
          <div className="flex flex-col">
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
              SIAP DIEKSPOR
            </span>
            <span className="font-tabular-data-lg text-2xl text-primary font-bold mt-1">
              {selectedOrders.length} Pesanan
            </span>
            <span className="font-body-sm text-[11px] text-secondary font-medium mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">check_circle</span>
              Semuanya lolos validasi Kemendagri
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-2xl">local_shipping</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between border border-surface-container/50">
          <div className="flex flex-col">
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
              ESTIMASI BERAT TOTAL
            </span>
            <span className="font-tabular-data-lg text-2xl text-on-surface font-bold mt-1">
              {totalWeightKg.toFixed(1)} Kg
            </span>
            <span className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
              {selectedOrders.length} Koli siap angkut
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-2xl">scale</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between border border-surface-container/50">
          <div className="flex flex-col">
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
              TOTAL NILAI COD
            </span>
            <span className="font-tabular-data-lg text-2xl text-tertiary font-bold mt-1">
              Rp {totalCodAmount.toLocaleString('id-ID')}
            </span>
            <span className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
              {selectedOrders.filter((o) => o.paymentMethod === 'COD').length} Transaksi Tunai (COD)
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-2xl">payments</span>
          </div>
        </div>
      </div>

      {/* Format Column Guide Collapsible */}
      <div className="bg-surface-container-low rounded-xl border border-surface-container-high/40 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFormatGuide(!showFormatGuide)}
          className="w-full p-space-md flex items-center justify-between text-left hover:bg-surface-container transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary text-xl">view_column</span>
            <div>
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Template Kolom CSV Aktif (12 Kolom Semicolon ';')
              </span>
              <p className="font-body-sm text-[11px] text-on-surface-variant">
                Header CSV: Nama Penerima;Alamat Penerima;Nomor Telepon;Kode Pos;Berat;Harga Barang (Jika NON-COD);Nilai COD (Jika COD);Isi Paketan (Nama Produk);*Kelurahan;*Kecamatan;**Quantity;*Instruksi Pengiriman
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant">
            {showFormatGuide ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {showFormatGuide && (
          <div className="p-space-md bg-surface-container-lowest border-t border-surface-container-high/30 flex flex-col gap-space-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-space-xs text-[11px]">
              {REQUIRED_CSV_HEADERS.map((col, idx) => (
                <div key={idx} className="p-2 rounded bg-surface-container-low border border-surface-container">
                  <span className="font-bold text-primary block text-[10px]">Kolom {idx + 1}</span>
                  <span className="text-on-surface font-medium break-words">{col}</span>
                </div>
              ))}
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">info</span>
              <span>
                Format CSV ini menggunakan delimiter <code>;</code> (titik koma) dan standar UTF-8 BOM, sehingga langsung terpisah kolom saat dibuka di Microsoft Excel, Google Sheets, atau aplikasi kurir.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Data Table Preview (Pratinjau Lembar Kerja) */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md border border-surface-container/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Pratinjau Lembar Kerja CSV (Live 12 Kolom)
            </span>
            <span className="px-space-xs py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-[11px] font-bold">
              {selectedIds.length} Baris Dipilih
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleToggleSelectAll(true)}
              className="text-primary font-label-sm text-[11px] hover:underline font-semibold cursor-pointer"
            >
              Pilih Semua ({exportableOrders.length})
            </button>
            <span className="text-surface-container-high">•</span>
            <button
              type="button"
              onClick={() => handleToggleSelectAll(false)}
              className="text-on-surface-variant font-label-sm text-[11px] hover:underline font-semibold cursor-pointer"
            >
              Batalkan Pilihan
            </button>
          </div>
        </div>

        {/* Table matching the 12 columns */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 rounded-l-lg w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === exportableOrders.length && exportableOrders.length > 0}
                    onChange={(e) => handleToggleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                  />
                </th>
                <th className="py-2.5 px-2">Nama Penerima</th>
                <th className="py-2.5 px-2">Alamat Penerima</th>
                <th className="py-2.5 px-2">Nomor Telepon</th>
                <th className="py-2.5 px-2">Kode Pos</th>
                <th className="py-2.5 px-2">Berat</th>
                <th className="py-2.5 px-2">Harga Non-COD</th>
                <th className="py-2.5 px-2">Nilai COD</th>
                <th className="py-2.5 px-2">Isi Paketan</th>
                <th className="py-2.5 px-2">*Kelurahan</th>
                <th className="py-2.5 px-2">*Kecamatan</th>
                <th className="py-2.5 px-2 text-center">**Qty</th>
                <th className="py-2.5 px-2 rounded-r-lg">*Instruksi Pengiriman</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-body-sm text-[12px]">
              {exportableOrders.map((ord) => {
                const isChecked = selectedIds.includes(ord.id);
                const isCod = ord.paymentMethod === 'COD';
                const weightGram = ord.weightGram > 0 ? ord.weightGram : Math.round(ord.weightKg * 1000);
                const streetAddress = [ord.address.streetAndNumber, ord.address.rtRw].filter(Boolean).join(', ') || ord.address.streetAndNumber;

                return (
                  <tr
                    key={ord.id}
                    className={`transition-colors ${
                      isChecked ? 'bg-primary-container/5 hover:bg-primary-container/10' : 'hover:bg-surface-container-low/60'
                    }`}
                  >
                    <td className="py-space-sm px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleRow(ord.id)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                    </td>
                    {/* 1. Nama Penerima */}
                    <td className="py-space-sm px-2 font-semibold text-on-surface whitespace-nowrap">
                      {ord.customerName}
                    </td>
                    {/* 2. Alamat Penerima */}
                    <td className="py-space-sm px-2 max-w-[200px] truncate" title={streetAddress}>
                      {streetAddress}
                    </td>
                    {/* 3. Nomor Telepon */}
                    <td className="py-space-sm px-2 font-code-sm text-on-surface-variant whitespace-nowrap">
                      {ord.phone.replace(/[^0-9]/g, '')}
                    </td>
                    {/* 4. Kode Pos */}
                    <td className="py-space-sm px-2 font-code-sm text-primary font-bold">
                      {ord.address.postalCode}
                    </td>
                    {/* 5. Berat */}
                    <td className="py-space-sm px-2 whitespace-nowrap">
                      {weightGram}
                    </td>
                    {/* 6. Harga Barang (Jika NON-COD) */}
                    <td className="py-space-sm px-2 whitespace-nowrap font-medium text-on-surface">
                      {!isCod ? ord.totalAmount : 0}
                    </td>
                    {/* 7. Nilai COD (Jika COD) */}
                    <td className="py-space-sm px-2 whitespace-nowrap font-bold text-tertiary">
                      {isCod ? ord.totalAmount : 0}
                    </td>
                    {/* 8. Isi Paketan (Nama Produk) */}
                    <td className="py-space-sm px-2 max-w-[180px] truncate text-on-surface-variant" title={ord.productSummary}>
                      {ord.productSummary}
                    </td>
                    {/* 9. *Kelurahan */}
                    <td className="py-space-sm px-2 whitespace-nowrap">
                      {ord.address.kelurahan || '-'}
                    </td>
                    {/* 10. *Kecamatan */}
                    <td className="py-space-sm px-2 whitespace-nowrap font-medium">
                      {ord.address.kecamatan || '-'}
                    </td>
                    {/* 11. **Quantity */}
                    <td className="py-space-sm px-2 text-center font-bold text-primary">
                      {ord.itemCount}
                    </td>
                    {/* 12. *Instruksi Pengiriman */}
                    <td className="py-space-sm px-2 text-on-surface-variant max-w-[180px] truncate" title={ord.address.landmark ? `Patokan: ${ord.address.landmark}. Jangan dibanting.` : 'Jangan dibanting'}>
                      {ord.address.landmark ? `Patokan: ${ord.address.landmark}` : 'Jangan dibanting'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Riwayat Pengunduhan File Ekspor Terakhir Hari Ini */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md border border-surface-container/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary text-xl">folder_zip</span>
            <div>
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Riwayat Pengunduhan File Ekspor Terakhir Hari Ini
              </span>
              <p className="font-body-sm text-[11px] text-on-surface-variant">
                Arsip berkas .xlsx yang telah diunduh untuk penyerahan kurir logistik
              </p>
            </div>
          </div>
          <span className="font-label-sm text-[11px] text-on-surface-variant">
            {exportHistory.length} Berkas Tersimpan
          </span>
        </div>

        <div className="flex flex-col gap-space-xs">
          {exportHistory.map((item) => (
            <div
              key={item.id}
              className="p-space-md bg-surface-container-low rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border border-surface-container-high/30 hover:bg-surface-container transition-colors"
            >
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary font-bold">
                  <span className="material-symbols-outlined text-xl">description</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline-sm text-[13px] font-bold text-on-surface">
                      {item.fileName}
                    </span>
                    <span className="px-2 py-0.2 rounded bg-surface-container-high font-code-sm text-[10px] text-on-surface-variant">
                      SHA: {item.checksum}
                    </span>
                  </div>
                  <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                    {item.orderCount} Pesanan • Diunduh {item.downloadTime} oleh {item.downloadBy} • {item.courier}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-space-sm self-end sm:self-center">
                <span className="px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-semibold">
                  {item.status}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const csv = generateAggregatorCSV(exportableOrders.slice(0, item.orderCount), item.courier);
                    downloadBlobAsFile(csv, item.fileName, 'text/csv;charset=utf-8;');
                    onShowToast('Unduh Ulang Selesai', `Mengunduh kembali ${item.fileName}`);
                  }}
                  className="px-space-sm py-1.5 bg-surface-container-lowest hover:bg-surface-container-highest text-primary font-label-sm text-[11px] rounded-lg font-semibold flex items-center gap-1 shadow-xs cursor-pointer border border-surface-container"
                >
                  <span className="material-symbols-outlined text-sm">replay</span>
                  <span>Unduh Ulang</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RAW JSON Inspection Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-surface-container animate-in fade-in zoom-in-95 duration-200">
            <div className="p-space-md border-b border-surface-container flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">data_object</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Inspeksi Payload JSON Normalisasi Kemendagri &amp; Kurir
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="p-space-lg max-h-[70vh] overflow-y-auto font-code-sm text-[11px] bg-[#1e1e1e] text-[#d4d4d4] rounded-none">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(getExportPayloadPreview(selectedOrders, selectedAggregator), null, 2)}
              </pre>
            </div>

            <div className="p-space-md bg-surface-container-low border-t border-surface-container flex items-center justify-between">
              <span className="font-body-sm text-[12px] text-on-surface-variant">
                Skema JSON siap diintegrasikan via Webhook Kurir / REST API Agregator.
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify(getExportPayloadPreview(selectedOrders, selectedAggregator), null, 2)
                  );
                  onShowToast('JSON Tersalin!', 'Payload JSON disalin ke clipboard.');
                }}
                className="px-space-md py-1.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-semibold cursor-pointer"
              >
                Salin JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mengantar API Configuration Modal */}
      <MengantarConfigModal
        isOpen={isMengantarModalOpen}
        onClose={() => setIsMengantarModalOpen(false)}
        config={mengantarConfig}
        onSaveConfig={(updated) => setMengantarConfig(updated)}
        onShowToast={onShowToast}
      />
    </div>
  );
};
