import React, { useState } from 'react';
import { OrderItem, OrderStatus, MengantarValidationResult } from '../types';
import { validateWithMengantarAPI } from '../services/mengantarApi';

interface VerifikasiViewProps {
  orders: OrderItem[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string) => void;
  onUpdateOrderAddress?: (orderId: string, updatedOrder: Partial<OrderItem>) => void;
  onShowToast: (title: string, desc: string) => void;
}

export const VerifikasiView: React.FC<VerifikasiViewProps> = ({
  orders,
  onUpdateOrderStatus,
  onShowToast
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'perlu' | 'menunggu' | 'sesuai' | 'dikoreksi'>('perlu');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('ord-038');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('standard');
  const [copied, setCopied] = useState(false);
  const [isWaSentMarked, setIsWaSentMarked] = useState(false);
  const [orderMengantarMap, setOrderMengantarMap] = useState<Record<string, MengantarValidationResult>>({});
  const [isValidatingMengantar, setIsValidatingMengantar] = useState(false);

  // Filter orders based on active tab
  const filteredOrders = orders.filter((o) => {
    if (filterTab === 'perlu') return o.validationStatus === 'perlu_review';
    if (filterTab === 'menunggu') return o.validationStatus === 'menunggu_respon';
    if (filterTab === 'sesuai') return o.validationStatus === 'siap' || o.validationStatus === 'dikonfirmasi';
    if (filterTab === 'dikoreksi') return o.validationStatus === 'dikoreksi';
    return true;
  });

  // Find currently selected order
  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders.find((o) => o.validationStatus === 'perlu_review') || orders[0];

  // Generate WhatsApp message based on selected template
  const getWaMessage = () => {
    if (!selectedOrder) return '';

    const name = selectedOrder.customerName;
    const product = selectedOrder.productSummary;
    const addr = selectedOrder.address;

    if (selectedTemplate === 'cod_protect') {
      return `Halo Kak ${name}! Terima kasih telah memesan ${product} (COD) di Toko Mawar Official 😊\n\nUntuk kelancaran kurir mengantar paket tunai (COD) agar tidak tertunda/retur, mohon konfirmasi kelengkapan alamat berikut ya:\n\n📍 *Alamat Pengiriman:*\n${addr.streetAndNumber} (${addr.landmark})\n${addr.kelurahan}, ${addr.kecamatan}, ${addr.city}, ${addr.province} ${addr.postalCode}\n\nApakah RT/RW & patokan rumah di atas sudah benar kak? Mohon konfirmasi 'Ya, sudah benar' ya kak. Terima kasih! 🙏`;
    }

    if (selectedTemplate === 'correction') {
      return `Halo Kak ${name}! Admin Toko Mawar mengonfirmasi pesanan ${product}.\n\nKurir mendeteksi nama kecamatan/kodepos perlu diperjelas:\n📍 *Data Alamat Sementara:*\n${addr.streetAndNumber}\n${addr.kelurahan}, ${addr.kecamatan}, ${addr.city} ${addr.postalCode}\n\nMohon balas dengan nama kecamatan & desa yang benar ya kak. Terima kasih!`;
    }

    // Default standard template
    return `Halo Kak ${name}! Terima kasih telah berbelanja di Toko Mawar Official 😊\n\nMohon bantuannya untuk konfirmasi ulang alamat pengiriman agar pesanan (${product}) tidak salah antar atau tertunda kurir:\n\n📍 *Alamat Tujuan:*\n${addr.streetAndNumber} (${addr.landmark})\n${addr.kelurahan}, ${addr.kecamatan}, ${addr.city}, ${addr.province}\n\nApakah rincian kecamatan dan desa di atas sudah 100% benar kak? Mohon balas 'Ya, sudah benar' atau kirimkan koreksi alamat lengkapnya ya kak. Terima kasih! 🙏`;
  };

  const waMessage = getWaMessage();
  const rawDigits = selectedOrder?.phone.replace(/[^0-9]/g, '') || '';
  const waLink = `https://wa.me/62${rawDigits.startsWith('62') ? rawDigits.slice(2) : rawDigits.startsWith('0') ? rawDigits.slice(1) : rawDigits}?text=${encodeURIComponent(waMessage)}`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(waMessage);
    setCopied(true);
    onShowToast('Tersalin!', 'Template pesan WhatsApp berhasil disalin ke clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  // Actions
  const handleMarkAddressCorrect = () => {
    if (selectedOrder) {
      onUpdateOrderStatus(selectedOrder.id, 'siap', 'Dikonfirmasi tepat via WhatsApp');
      onShowToast('Alamat Terverifikasi!', `Status pesanan ${selectedOrder.orderNumber} diubah ke Siap Kirim.`);
    }
  };

  const handlePromptCorrection = () => {
    if (selectedOrder) {
      const newKecamatan = prompt('Masukkan nama kecamatan yang benar dari konfirmasi customer:', selectedOrder.address.kecamatan);
      if (newKecamatan) {
        selectedOrder.address.kecamatan = newKecamatan;
        onUpdateOrderStatus(selectedOrder.id, 'dikoreksi', `Kecamatan diperbarui menjadi ${newKecamatan}`);
        onShowToast('Alamat Diperbarui!', `Kecamatan pada ${selectedOrder.orderNumber} berhasil dikoreksi.`);
      }
    }
  };

  const handleCancelOrder = () => {
    if (selectedOrder && window.confirm(`Batalkan pesanan ${selectedOrder.orderNumber} (${selectedOrder.customerName})?`)) {
      onUpdateOrderStatus(selectedOrder.id, 'dibatalkan', 'Dibatalkan oleh pembeli via WA');
      onShowToast('Pesanan Dibatalkan', `Pesanan ${selectedOrder.orderNumber} telah ditandai batal.`);
    }
  };

  // Validasi Alamat via API Mengantar
  const handleValidateMengantar = async () => {
    if (!selectedOrder) return;
    setIsValidatingMengantar(true);
    const res = await validateWithMengantarAPI(
      selectedOrder.address,
      selectedOrder.totalAmount,
      selectedOrder.weightGram
    );
    setOrderMengantarMap((prev) => ({
      ...prev,
      [selectedOrder.id]: res
    }));
    setIsValidatingMengantar(false);
    onShowToast('Validasi Mengantar API Selesai', `Status: ${res.coverageStatus} • Kurir Rekomendasi: ${res.bestCourier}`);
  };

  const currentMengantar = selectedOrder ? (orderMengantarMap[selectedOrder.id] || selectedOrder.mengantarValidation) : undefined;

  return (
    <div className="flex flex-col w-full">
      {/* Top Stat HUD Bar */}
      <div className="w-full mb-space-lg flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-space-xs max-w-3xl">
          <div className="flex items-center gap-space-xs text-secondary font-label-md text-label-md font-semibold">
            <span className="material-symbols-outlined text-base">verified_user</span>
            <span>MODUL DISPATCH &amp; MITIGASI RETUR</span>
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span className="text-on-surface-variant font-code-sm text-code-sm font-normal">
              SLA PICKUP: 16.30 WIB
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
            Verifikasi Alamat &amp; Konfirmasi Pelanggan (WhatsApp Klik-Kirim)
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Kirimkan template pesan berisi alamat versi rapi ke WhatsApp customer dengan satu klik sebelum barang di-pickup oleh kurir untuk meminimalisir paket retur.
          </p>
        </div>

        {/* Quick Stats Metric Pills */}
        <div className="flex items-center gap-space-sm bg-surface-container-low p-space-xs rounded-xl shadow-sm shrink-0 border border-surface-container-high/40">
          <div className="px-space-md py-1.5 bg-surface-container-lowest rounded-lg shadow-sm flex flex-col">
            <span className="font-label-sm text-[11px] text-on-surface-variant font-medium">Tingkat Retur (COD)</span>
            <span className="font-tabular-data-lg text-tabular-data-lg text-error flex items-center gap-1 font-bold">
              2.1%
              <span className="material-symbols-outlined text-sm text-secondary">trending_down</span>
            </span>
          </div>
          <div className="px-space-md py-1.5 bg-surface-container-lowest rounded-lg shadow-sm flex flex-col">
            <span className="font-label-sm text-[11px] text-on-surface-variant font-medium">Konfirmasi Sukses Hari Ini</span>
            <span className="font-tabular-data-lg text-tabular-data-lg text-secondary font-bold">19/22</span>
          </div>
        </div>
      </div>

      {/* Operational Filter Tabs */}
      <div className="w-full flex items-center gap-space-xs overflow-x-auto pb-space-sm mb-space-lg scrollbar-none">
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`flex items-center gap-space-xs px-space-md py-2 rounded-lg transition-colors font-label-md text-label-md shrink-0 cursor-pointer ${
            filterTab === 'all'
              ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
              : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
          }`}
        >
          <span>Semua Pesanan</span>
          <span className="px-space-xs py-0.5 rounded-full bg-surface-container-high font-tabular-data-md text-tabular-data-md text-on-surface-variant">
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('perlu')}
          className={`flex items-center gap-space-xs px-space-md py-2 rounded-lg transition-colors font-label-md text-label-md shrink-0 cursor-pointer ${
            filterTab === 'perlu'
              ? 'bg-tertiary-fixed text-on-tertiary-fixed font-bold shadow-sm'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-sm">warning</span>
          <span>Perlu Konfirmasi</span>
          <span className="px-space-xs py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container font-tabular-data-md text-tabular-data-md font-bold">
            {orders.filter((o) => o.validationStatus === 'perlu_review').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('menunggu')}
          className={`flex items-center gap-space-xs px-space-md py-2 rounded-lg transition-colors font-label-md text-label-md shrink-0 cursor-pointer ${
            filterTab === 'menunggu'
              ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-sm">hourglass_top</span>
          <span>Menunggu Respon Customer</span>
          <span className="px-space-xs py-0.5 rounded-full bg-surface-container-high font-tabular-data-md text-tabular-data-md">
            8
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('sesuai')}
          className={`flex items-center gap-space-xs px-space-md py-2 rounded-lg transition-colors font-label-md text-label-md shrink-0 cursor-pointer ${
            filterTab === 'sesuai'
              ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>Sudah Dikonfirmasi / Sesuai</span>
          <span className="px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-tabular-data-md text-tabular-data-md">
            26
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('dikoreksi')}
          className={`flex items-center gap-space-xs px-space-md py-2 rounded-lg transition-colors font-label-md text-label-md shrink-0 cursor-pointer ${
            filterTab === 'dikoreksi'
              ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-sm">edit_location_alt</span>
          <span>Alamat Dikoreksi Customer</span>
          <span className="px-space-xs py-0.5 rounded-full bg-surface-container-high font-tabular-data-md text-tabular-data-md">
            5
          </span>
        </button>
      </div>

      {/* Main Split Canvas: Left Queue (5 Cols), Right Desk (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* LEFT PANEL: Orders Needing Attention (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-space-md">
          {/* Section Header with batch helper */}
          <div className="flex items-center justify-between px-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Antrean Verifikasi
              </span>
              <span className="px-space-xs py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-[11px] font-bold">
                {filteredOrders.length} Paket
              </span>
            </div>
            <span className="font-code-sm text-[11px] text-on-surface-variant">
              Sortir: AI Score Terendah
            </span>
          </div>

          {/* Cards List */}
          <div className="flex flex-col gap-space-sm">
            {filteredOrders.map((ord) => {
              const isSelected = ord.id === selectedOrder?.id;
              return (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrderId(ord.id)}
                  className={`relative p-space-md rounded-xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-surface-container-lowest shadow-md border-primary/40 ring-2 ring-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-transparent'
                      : 'bg-surface-container-lowest shadow-sm hover:shadow-md border-surface-container/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-space-sm mb-space-xs">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center font-headline-sm text-headline-sm text-on-primary-fixed font-bold shrink-0">
                        {ord.customerAvatarText || ord.customerName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-space-xs">
                          <span className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">
                            {ord.customerName}
                          </span>
                          <span className="px-space-xs py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-code-sm text-[10px] font-semibold">
                            {ord.paymentMethod}
                          </span>
                        </div>
                        <span className="font-body-sm text-[12px] text-on-surface-variant">
                          {ord.phone}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-space-sm py-1 rounded-full font-label-sm text-[11px] flex items-center gap-1 shrink-0 font-semibold ${
                        ord.aiScore < 70
                          ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                          : 'bg-secondary-container text-on-secondary-container'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">
                        {ord.aiScore < 70 ? 'warning' : 'check_circle'}
                      </span>
                      <span>{ord.validationTagLabel}</span>
                    </span>
                  </div>

                  {/* Product & Courier Mini-Strip */}
                  <div className="mt-space-sm p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between border border-surface-container-high/30">
                    <div className="flex items-center gap-space-sm min-w-0">
                      {ord.productImage ? (
                        <img
                          src={ord.productImage}
                          alt={ord.productSummary}
                          className="w-11 h-11 rounded-lg object-cover shrink-0 ring-1 ring-surface-container-high"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0 text-primary">
                          <span className="material-symbols-outlined text-lg">inventory_2</span>
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-headline-sm text-[12px] text-on-surface truncate font-semibold">
                          {ord.productSummary}
                        </span>
                        <span className="font-body-sm text-[11px] text-on-surface-variant">
                          Rp {ord.totalAmount.toLocaleString('id-ID')} • {ord.courierServiceCode}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 pl-space-xs">
                      <span className="font-code-sm text-[10px] text-on-surface-variant">
                        {ord.orderNumber}
                      </span>
                      <span
                        className={`font-label-sm text-[11px] font-bold ${
                          ord.aiScore < 70 ? 'text-tertiary-container' : 'text-secondary'
                        }`}
                      >
                        Skor AI: {ord.aiScore}%
                      </span>
                    </div>
                  </div>

                  {/* Progress meter for Confidence */}
                  <div className="mt-space-sm flex items-center gap-space-sm">
                    <div className="flex-1 bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${ord.aiScore < 70 ? 'bg-tertiary-container' : 'bg-primary'}`}
                        style={{ width: `${ord.aiScore}%` }}
                      ></div>
                    </div>
                    <span className="font-code-sm text-[11px] text-on-surface-variant font-medium">
                      {ord.aiScore}% Confidence
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Historical Insight Hint Box */}
          <div className="bg-surface-container-low p-space-md rounded-xl flex items-start gap-space-sm border border-surface-container-high/40">
            <span className="material-symbols-outlined text-primary text-xl mt-0.5">tips_and_updates</span>
            <div className="flex flex-col gap-0.5">
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Tips Dispatch Toko Mawar
              </span>
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                94% pembeli COD yang mengonfirmasi kecamatan via WhatsApp menerima paket tanpa insiden retur ke agen asal.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Detailed Inspection & WhatsApp Action Desk (7 cols) */}
        {selectedOrder && (
          <div className="lg:col-span-7 flex flex-col gap-space-lg">
            {/* Desk Active Header Bar */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border border-surface-container/50">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-headline-sm text-headline-sm font-bold">
                  1
                </div>
                <div>
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-md text-headline-md text-on-surface font-bold">
                      Inspeksi: {selectedOrder.customerName}
                    </span>
                    <span className="px-space-xs py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-code-sm text-[11px] font-bold">
                      {selectedOrder.orderNumber}
                    </span>
                  </div>
                  <span className="font-body-sm text-[12px] text-on-surface-variant">
                    Nomor Tujuan WA: +62 {selectedOrder.phone}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs">
                <button
                  type="button"
                  className="px-space-sm py-1.5 rounded-lg bg-surface-container-low text-on-surface font-label-md text-[11px] hover:bg-surface-container-high transition-colors flex items-center gap-1 cursor-pointer font-medium"
                >
                  <span className="material-symbols-outlined text-sm">history</span>
                  <span>Riwayat Order (2)</span>
                </button>
              </div>
            </div>

            {/* STEP 1: Perbandingan Alamat Mentah vs Normalisasi AI */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md border border-surface-container/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[11px] flex items-center justify-center font-bold">
                    1
                  </span>
                  <span className="font-headline-md text-headline-md text-on-surface font-bold">
                    Komparasi Pemetaan Alamat
                  </span>
                </div>
                <span
                  className={`font-label-sm text-[11px] px-space-xs py-0.5 rounded-full font-semibold ${
                    selectedOrder.aiScore < 70
                      ? 'bg-error-container text-on-error-container'
                      : 'bg-secondary-container text-on-secondary-container'
                  }`}
                >
                  {selectedOrder.aiScore < 70 ? 'Anomali Terdeteksi' : 'Alamat Valid'}
                </span>
              </div>

              {/* Split Raw vs Normalized */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                {/* Left: Mentah */}
                <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col justify-between border border-surface-container-high/30">
                  <div>
                    <div className="flex items-center justify-between mb-space-xs">
                      <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                        Teks Mentah dari Pembeli
                      </span>
                      <span className="material-symbols-outlined text-base text-on-surface-variant">chat</span>
                    </div>
                    <div className="p-space-sm bg-surface-container-lowest rounded-lg font-code-sm text-[11px] text-on-surface leading-relaxed border border-surface-container">
                      {selectedOrder.rawChatText}
                    </div>
                  </div>
                  <div className="mt-space-sm flex items-center gap-space-xs text-on-surface-variant font-body-sm text-[11px]">
                    <span className="material-symbols-outlined text-sm text-tertiary-container">info</span>
                    <span>Sumber: Form Checkout Toko / WA chat</span>
                  </div>
                </div>

                {/* Right: Rekomendasi Normalisasi AI */}
                <div className="bg-surface-container p-space-md rounded-xl flex flex-col justify-between border border-surface-container-high/50">
                  <div>
                    <div className="flex items-center justify-between mb-space-xs">
                      <span className="font-label-sm text-[11px] uppercase tracking-wider text-primary font-bold">
                        Hasil Normalisasi AI KirimRapi
                      </span>
                      <span className="material-symbols-outlined text-base text-primary">auto_awesome</span>
                    </div>
                    <div className="p-space-sm bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface space-y-1 border border-surface-container">
                      <p className="font-semibold text-on-surface text-[13px]">
                        {selectedOrder.address.streetAndNumber}, {selectedOrder.address.rtRw}{' '}
                        {selectedOrder.address.rtRw.includes('--') && (
                          <span className="text-error text-xs font-normal">(Perlu No RT/RW)</span>
                        )}
                      </p>
                      <p className="text-on-surface-variant text-[12px]">
                        {selectedOrder.address.kelurahan},{' '}
                        <span className="bg-tertiary-fixed text-on-tertiary-fixed px-1 rounded font-semibold">
                          {selectedOrder.address.kecamatan}
                        </span>{' '}
                        {selectedOrder.aiScore < 70 && (
                          <span className="text-xs text-tertiary-container">(Prediksi 70%)</span>
                        )}
                      </p>
                      <p className="text-on-surface-variant text-[12px]">
                        {selectedOrder.address.city}, {selectedOrder.address.province}, {selectedOrder.address.postalCode}
                      </p>
                    </div>
                  </div>
                  <div className="mt-space-sm flex items-center justify-between text-on-surface-variant font-body-sm text-[11px]">
                    <span className="text-secondary font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check</span>
                      Kodepos {selectedOrder.address.postalCode} Terpetakan
                    </span>
                    <button
                      type="button"
                      onClick={handlePromptCorrection}
                      className="text-primary hover:underline font-label-sm text-[11px] font-semibold cursor-pointer"
                    >
                      Edit Manual
                    </button>
                  </div>
                </div>
              </div>

              {/* Warning Callout Box */}
              {selectedOrder.validationNote && (
                <div className="p-space-md rounded-xl bg-tertiary-fixed flex items-start gap-space-sm text-on-tertiary-fixed shadow-sm border border-tertiary-fixed-dim/40">
                  <span className="material-symbols-outlined text-xl text-tertiary-container shrink-0 mt-0.5">
                    warning
                  </span>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm text-on-tertiary-fixed font-bold">
                      {selectedOrder.validationTagLabel}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-tertiary-fixed mt-0.5 leading-snug">
                      {selectedOrder.validationNote}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 1.5: Validasi Agregator Mengantar API */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm border border-surface-container/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <div className="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-xs shadow-xs">
                    M
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                        Validasi Jangkauan COD Mengantar API
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[10px] font-bold">
                        {currentMengantar ? (currentMengantar.coverageStatus === 'FULL_COD_COVERAGE' ? 'Tercover 100%' : 'Coverage Parsial') : 'Siap Cek API'}
                      </span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant block">
                      {currentMengantar
                        ? `ID Subdistrik: ${currentMengantar.subdistrictId} • Validasi ${currentMengantar.validatedAt}`
                        : 'Verifikasi jangkauan kurir & mitigasi retur via API Mengantar.com'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleValidateMengantar}
                  disabled={isValidatingMengantar}
                  className="px-space-md py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-label-sm text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors border border-surface-container-high/40"
                >
                  <span className={`material-symbols-outlined text-xs ${isValidatingMengantar ? 'animate-spin' : ''}`}>
                    refresh
                  </span>
                  <span>{isValidatingMengantar ? 'Mengecek API...' : (currentMengantar ? 'Cek Ulang API' : 'Cek Jangkauan Mengantar')}</span>
                </button>
              </div>

              {currentMengantar && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-xs mt-1">
                  <div className="p-2 rounded-lg bg-surface-container-low border border-surface-container-high/30 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant">Kurir COD Mengantar</span>
                    <span className="text-[12px] font-bold text-secondary flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-xs">check_circle</span>
                      {currentMengantar.bestCourier}
                    </span>
                    <span className="text-[10px] text-on-surface-variant truncate">
                      Tersedia: {currentMengantar.supportedCouriers.join(', ')}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-surface-container-low border border-surface-container-high/30 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant">Estimasi Biaya</span>
                    <span className="text-[12px] font-bold text-on-surface mt-0.5">
                      Ongkir: Rp {currentMengantar.estimatedShippingFee.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">
                      Fee COD ({currentMengantar.codFeePercent}%): Rp {currentMengantar.codFeeAmount.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-surface-container-low border border-surface-container-high/30 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant">Risiko Retur Wilayah</span>
                    <span className="text-[12px] font-bold text-secondary mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">shield</span>
                      {currentMengantar.historicalReturnRate}% Retur
                    </span>
                    <span className="text-[10px] text-on-surface-variant">
                      {currentMengantar.riskLevel === 'LOW_RISK' ? 'Zona Hijau (Aman)' : 'Perlu Konfirmasi Alamat'}
                    </span>
                  </div>
                </div>
              )}

              {currentMengantar && (
                <p className="text-[11px] text-on-surface-variant bg-surface-container-low/60 p-1.5 rounded leading-tight">
                  💡 <strong>Catatan Mengantar:</strong> {currentMengantar.notes}
                </p>
              )}
            </div>

            {/* STEP 2: WA Klik-Kirim Generator */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md border border-surface-container/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[11px] flex items-center justify-center font-bold">
                    2
                  </span>
                  <span className="font-headline-md text-headline-md text-on-surface font-bold">
                    Generator WA Klik-Kirim
                  </span>
                </div>
                <span className="font-code-sm text-[11px] text-secondary font-semibold">
                  wa.me/62{selectedOrder.phone.replace(/[^0-9]/g, '')}
                </span>
              </div>

              {/* Template Selector */}
              <div className="flex flex-col gap-space-xs">
                <label className="font-label-sm text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
                  PILIH TEMPLATE PESAN KONFIRMASI
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md py-2.5 px-space-md rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary shadow-sm border border-surface-container-high/40 font-medium"
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                  >
                    <option value="standard">Template Konfirmasi Standar Alamat Toko Mawar</option>
                    <option value="cod_protect">Template Verifikasi Kilat Dusun &amp; RT/RW (COD Protection)</option>
                    <option value="correction">Template Koreksi Alamat Pengiriman SiCepat Ekspres</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-space-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Authentic WhatsApp Live Preview Bubble */}
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                    Pratinjau Pesan Interaktif
                  </span>
                  <span className="font-code-sm text-[11px] text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-secondary">lock</span>
                    WhatsApp E2E Encrypted
                  </span>
                </div>

                {/* WhatsApp Chat Stage */}
                <div className="rounded-xl p-space-lg bg-[#e5ddd5]/60 dark:bg-surface-container-high relative overflow-hidden flex flex-col items-end border border-surface-container">
                  {/* Simulated Chat Bubble */}
                  <div className="max-w-xl bg-surface-container-lowest text-on-surface rounded-2xl rounded-tr-xs p-space-md shadow-md flex flex-col gap-space-sm relative border border-surface-container">
                    {/* Sender Header In Bubble */}
                    <div className="flex items-center gap-space-xs text-secondary font-label-sm text-[11px] font-bold">
                      <span className="material-symbols-outlined text-sm">storefront</span>
                      <span>Toko Mawar Official • Layanan Otomasi Dispatch</span>
                    </div>

                    <div className="font-body-md text-[13px] whitespace-pre-line text-on-surface leading-relaxed">
                      {waMessage}
                    </div>

                    {/* Message metadata & WhatsApp Ticks */}
                    <div className="flex items-center justify-end gap-1 self-end mt-space-xs text-on-surface-variant font-code-sm text-[10px]">
                      <span>14:25</span>
                      <span className="material-symbols-outlined text-sm text-primary">done_all</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Row: Primary WA + Copy Button */}
              <div className="flex flex-col sm:flex-row items-center gap-space-sm pt-space-xs">
                <a
                  className="w-full sm:flex-1 py-3 px-space-lg bg-secondary text-on-secondary rounded-lg font-headline-sm text-headline-sm hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-space-sm text-center cursor-pointer font-bold active:scale-[0.99]"
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setIsWaSentMarked(true);
                    onShowToast('Membuka WhatsApp...', `Membuka wa.me ke +62 ${selectedOrder.phone}`);
                  }}
                >
                  <span className="material-symbols-outlined text-xl">send</span>
                  <span>Buka WhatsApp &amp; Kirim Pesan (wa.me)</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyText}
                  className="w-full sm:w-auto py-3 px-space-md bg-surface-container-low text-on-surface font-label-md text-label-md rounded-lg hover:bg-surface-container-high transition-colors flex items-center justify-center gap-space-xs shadow-sm cursor-pointer font-semibold border border-surface-container-high/40"
                >
                  <span className="material-symbols-outlined text-base">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  <span>{copied ? 'Tersalin!' : 'Salin Format Teks'}</span>
                </button>
              </div>
            </div>

            {/* STEP 3: Status Tracking & Customer Action Updates */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md border border-surface-container/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[11px] flex items-center justify-center font-bold">
                    3
                  </span>
                  <span className="font-headline-md text-headline-md text-on-surface font-bold">
                    Pembaruan Status Konfirmasi
                  </span>
                </div>
                <span className="font-label-sm text-[11px] text-on-surface-variant font-medium">Update Cepat CS</span>
              </div>

              {/* Checkbox: WA Sent Marker */}
              <label className="flex items-center gap-space-sm p-space-md bg-surface-container-low rounded-xl cursor-pointer hover:bg-surface-container transition-colors border border-surface-container-high/30">
                <input
                  type="checkbox"
                  checked={isWaSentMarked}
                  onChange={(e) => {
                    setIsWaSentMarked(e.target.checked);
                    if (e.target.checked) {
                      onUpdateOrderStatus(selectedOrder.id, 'menunggu_respon', 'Pesan WA telah dikirimkan ke pembeli');
                      onShowToast('Ditandai Terkirim', 'Status pesanan dipindahkan ke tab Menunggu Respon Customer.');
                    }
                  }}
                  className="w-5 h-5 rounded text-primary focus:ring-0 cursor-pointer accent-primary"
                />
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Tandai Sudah Dikirimkan Konfirmasi WA
                  </span>
                  <span className="font-body-sm text-[12px] text-on-surface-variant">
                    Otomatis ubah status paket ke tab "Menunggu Respon Customer (8)"
                  </span>
                </div>
              </label>

              {/* Dynamic Action Buttons on Customer Reply */}
              <div className="flex flex-col gap-space-xs pt-space-xs">
                <span className="font-label-sm text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
                  Aksi Cepat Berdasarkan Respon Customer:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
                  {/* Action 1: Konfirmasi Benar */}
                  <button
                    type="button"
                    onClick={handleMarkAddressCorrect}
                    className="p-space-md bg-secondary-container text-on-secondary-container rounded-xl hover:opacity-90 transition-all flex flex-col items-start gap-space-xs text-left shadow-sm cursor-pointer active:scale-95 border border-secondary/20"
                  >
                    <div className="flex items-center gap-space-xs font-headline-sm text-headline-sm font-bold">
                      <span className="material-symbols-outlined text-base text-secondary">check_circle</span>
                      <span>Alamat Benar</span>
                    </div>
                    <span className="font-body-sm text-[11px] opacity-90 leading-tight">
                      Customer konfirmasi kecamatan tepat. Ubah status ke <strong>Siap Kirim</strong>.
                    </span>
                  </button>

                  {/* Action 2: Edit Alamat Baru */}
                  <button
                    type="button"
                    onClick={handlePromptCorrection}
                    className="p-space-md bg-surface-container-low text-on-surface rounded-xl hover:bg-surface-container-high transition-all flex flex-col items-start gap-space-xs text-left shadow-sm cursor-pointer active:scale-95 border border-surface-container-high/40"
                  >
                    <div className="flex items-center gap-space-xs font-headline-sm text-headline-sm font-bold text-primary">
                      <span className="material-symbols-outlined text-base">edit</span>
                      <span>Koreksi Alamat</span>
                    </div>
                    <span className="font-body-sm text-[11px] text-on-surface-variant leading-tight">
                      Masukkan koreksi detail baru dari pesan WhatsApp pembeli.
                    </span>
                  </button>

                  {/* Action 3: Batalkan Pesanan */}
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    className="p-space-md bg-error-container text-on-error-container rounded-xl hover:opacity-90 transition-all flex flex-col items-start gap-space-xs text-left shadow-sm cursor-pointer active:scale-95 border border-error/20"
                  >
                    <div className="flex items-center gap-space-xs font-headline-sm text-headline-sm font-bold">
                      <span className="material-symbols-outlined text-base">cancel</span>
                      <span>Batalkan Pesanan</span>
                    </div>
                    <span className="font-body-sm text-[11px] opacity-90 leading-tight">
                      Customer menolak, nomor bodong, atau minta pembatalan pesanan.
                    </span>
                  </button>
                </div>
              </div>

              {/* Dispatch Timeline Footer */}
              <div className="mt-space-xs p-space-sm rounded-lg bg-surface-container-lowest flex items-center justify-between text-on-surface-variant font-code-sm text-[11px] border border-surface-container">
                <span>Log Dispatch: Terakhir disinkronkan pukul 14:24:10</span>
                <span className="flex items-center gap-1 text-primary font-medium">
                  <span className="material-symbols-outlined text-xs">sync</span>
                  Auto-Sync Agregator SiCepat Aktif
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
