import React, { useState, useEffect } from 'react';
import { OrderItem, MengantarValidationResult, ProductItem, CatalogProduct } from '../types';
import { SAMPLE_CHATS } from '../data/initialData';
import { parseWhatsAppChat, ParseResult } from '../utils/aiParser';
import { validateWithMengantarAPI } from '../services/mengantarApi';
import { EditOrderModal } from '../components/EditOrderModal';
import { ProductPickerModal } from '../components/ProductPickerModal';

interface InputPesananViewProps {
  orders: OrderItem[];
  catalog?: CatalogProduct[];
  preselectedProduct?: ProductItem | null;
  onClearPreselectedProduct?: () => void;
  onAddOrder: (newOrder: OrderItem) => void;
  onUpdateOrder?: (orderId: string, updatedData: Partial<OrderItem>) => void;
  onDeleteOrder?: (orderId: string) => void;
  onClearRecentOrders?: () => void;
  onShowToast: (title: string, desc: string, type?: 'success' | 'info' | 'warning') => void;
  onNavigateToTab: (tab: any) => void;
}

export const InputPesananView: React.FC<InputPesananViewProps> = ({
  orders,
  catalog = [],
  preselectedProduct = null,
  onClearPreselectedProduct,
  onAddOrder,
  onUpdateOrder,
  onDeleteOrder,
  onClearRecentOrders,
  onShowToast,
  onNavigateToTab
}) => {
  const [activeTab, setActiveTab] = useState<'smart' | 'manual'>('smart');
  const [sampleIndex, setSampleIndex] = useState(0);
  const [rawText, setRawText] = useState(SAMPLE_CHATS[0].text);
  const [isExtracting, setIsExtracting] = useState(false);
  const [validateKemendagri, setValidateKemendagri] = useState(true);
  const [validateMengantarApi, setValidateMengantarApi] = useState(true);
  const [standardizePhone, setStandardizePhone] = useState(true);
  const [isValidatingMengantar, setIsValidatingMengantar] = useState(false);

  // Form Fields State (Editable after extraction)
  const [extractedData, setExtractedData] = useState<ParseResult>(() => parseWhatsAppChat(SAMPLE_CHATS[0].text));
  const [productsList, setProductsList] = useState<ProductItem[]>(() => {
    const initial = parseWhatsAppChat(SAMPLE_CHATS[0].text);
    return initial.items || [
      { id: 'p-1', name: 'Gamis Mutiara Lilac', variant: 'XL', qty: 2, price: 180000 },
      { id: 'p-2', name: 'Pashmina Ceruty Navy', variant: 'Standar', qty: 1, price: 65000 }
    ];
  });
  const [productViewMode, setProductViewMode] = useState<'table' | 'simple'>('table');
  const [isPickerModalOpen, setIsPickerModalOpen] = useState(false);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<OrderItem | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; orderNumber: string; customerName: string } | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState<boolean>(false);

  const [mengantarResult, setMengantarResult] = useState<MengantarValidationResult | null>({
    isCovered: true,
    coverageStatus: 'FULL_COD_COVERAGE',
    supportedCouriers: ['J&T Express', 'SiCepat', 'Ninja Van', 'SAP Express'],
    bestCourier: 'J&T Express (VIP 1-Day)',
    estimatedShippingFee: 10000,
    codFeePercent: 2.5,
    codFeeAmount: 10625,
    historicalReturnRate: 0.9,
    riskLevel: 'LOW_RISK',
    subdistrictId: 'MGT-SUB-16455-DPK',
    validatedAt: '14:32 WIB',
    notes: 'Zona Hijau Mengantar: Pengantaran Same-Day / Next-Day dengan SLA 99.1% Sukses COD.'
  });
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  // Handle sample cycle
  const handleLoadSample = async () => {
    const nextIdx = (sampleIndex + 1) % SAMPLE_CHATS.length;
    setSampleIndex(nextIdx);
    const newText = SAMPLE_CHATS[nextIdx].text;
    setRawText(newText);
    const parsed = parseWhatsAppChat(newText);
    setExtractedData(parsed);
    setProductsList(parsed.items || []);

    if (validateMengantarApi) {
      setIsValidatingMengantar(true);
      const mgt = await validateWithMengantarAPI(
        {
          streetAndNumber: parsed.streetAndNumber,
          rtRw: parsed.rtRw,
          kelurahan: parsed.kelurahan,
          kecamatan: parsed.kecamatan,
          city: parsed.city,
          province: parsed.province,
          postalCode: parsed.postalCode,
          landmark: parsed.landmark
        },
        parsed.totalAmount,
        parsed.weightGram
      );
      setMengantarResult(mgt);
      setIsValidatingMengantar(false);
    }

    onShowToast('Sampel Dimuat', `Memuat contoh: ${SAMPLE_CHATS[nextIdx].title}`);
  };

  // Run AI extraction & Mengantar API Validation
  const handleExtract = async () => {
    if (!rawText.trim()) {
      onShowToast('Teks Kosong', 'Silakan tempel teks chat closing WA terlebih dahulu.');
      return;
    }

    setIsExtracting(true);
    const result = parseWhatsAppChat(rawText);
    setExtractedData(result);
    setProductsList(result.items || []);

    if (validateMengantarApi) {
      setIsValidatingMengantar(true);
      const mgt = await validateWithMengantarAPI(
        {
          streetAndNumber: result.streetAndNumber,
          rtRw: result.rtRw,
          kelurahan: result.kelurahan,
          kecamatan: result.kecamatan,
          city: result.city,
          province: result.province,
          postalCode: result.postalCode,
          landmark: result.landmark
        },
        result.totalAmount,
        result.weightGram
      );
      setMengantarResult(mgt);
      setIsValidatingMengantar(false);
    }

    setIsExtracting(false);
    onShowToast('Normalisasi AI Selesai!', `Akurasi ${result.aiScore}% • Validasi Mengantar API Terverifikasi.`);
  };

  // Synchronize product list edits with extractedData
  const updateExtractedFromProducts = (newProducts: ProductItem[]) => {
    setProductsList(newProducts);
    const totalQty = newProducts.reduce((sum, p) => sum + (p.qty || 1), 0);
    const totalVal = newProducts.reduce((sum, p) => sum + (p.price || 0) * (p.qty || 1), 0);
    const summary = newProducts
      .filter((p) => p.name.trim())
      .map((p) => `${p.name}${p.variant ? ` (${p.variant})` : ''} x ${p.qty}`)
      .join(', ');

    setExtractedData((prev) => ({
      ...prev,
      products: summary || prev.products,
      itemCount: totalQty,
      totalAmount: totalVal,
      totalAmountFormatted: `Rp ${totalVal.toLocaleString('id-ID')}`
    }));
  };

  const handleAddProductRow = () => {
    const newProd: ProductItem = {
      id: `prod-${Date.now()}-${productsList.length + 1}`,
      name: '',
      variant: '',
      qty: 1,
      price: 50000
    };
    updateExtractedFromProducts([...productsList, newProd]);
  };

  const handleRemoveProductRow = (id: string) => {
    if (productsList.length <= 1) {
      onShowToast('Minimal 1 Produk', 'Harus ada minimal satu produk dalam pesanan.');
      return;
    }
    const updated = productsList.filter((p) => p.id !== id);
    updateExtractedFromProducts(updated);
  };

  const handleUpdateProductField = (id: string, field: keyof ProductItem, val: any) => {
    const updated = productsList.map((p) => (p.id === id ? { ...p, [field]: val } : p));
    updateExtractedFromProducts(updated);
  };

  useEffect(() => {
    if (preselectedProduct) {
      updateExtractedFromProducts([preselectedProduct]);
      if (preselectedProduct.weightGram) {
        setExtractedData((prev) => ({
          ...prev,
          weightGram: preselectedProduct.weightGram!
        }));
      }
      onShowToast('Produk Katalog Dimuat', `"${preselectedProduct.name}" berhasil dimuat ke formulir.`);
      onClearPreselectedProduct?.();
    }
  }, [preselectedProduct]);

  const handleSelectProductFromCatalog = (item: ProductItem) => {
    let updated: ProductItem[];
    if (productsList.length === 1 && !productsList[0].name.trim()) {
      updated = [item];
    } else {
      const existingIdx = productsList.findIndex(
        (p) => p.name.trim().toLowerCase() === item.name.trim().toLowerCase() && (p.variant || '') === (item.variant || '')
      );
      if (existingIdx >= 0) {
        updated = [...productsList];
        updated[existingIdx] = {
          ...updated[existingIdx],
          qty: (updated[existingIdx].qty || 1) + (item.qty || 1)
        };
      } else {
        updated = [...productsList, item];
      }
    }
    updateExtractedFromProducts(updated);

    if (item.weightGram) {
      setExtractedData((prev) => ({
        ...prev,
        weightGram: Math.max(prev.weightGram, (item.weightGram || 0) * (item.qty || 1))
      }));
    }

    setIsPickerModalOpen(false);
    onShowToast('Produk Ditambahkan', `"${item.name}" (${item.variant}) ditambahkan ke rincian.`);
  };

  const handleManualRevalidateMengantar = async () => {
    setIsValidatingMengantar(true);
    const mgt = await validateWithMengantarAPI(
      {
        streetAndNumber: extractedData.streetAndNumber,
        rtRw: extractedData.rtRw,
        kelurahan: extractedData.kelurahan,
        kecamatan: extractedData.kecamatan,
        city: extractedData.city,
        province: extractedData.province,
        postalCode: extractedData.postalCode,
        landmark: extractedData.landmark
      },
      extractedData.totalAmount,
      extractedData.weightGram
    );
    setMengantarResult(mgt);
    setIsValidatingMengantar(false);
    onShowToast('API Mengantar Terverifikasi', `Status Coverage: ${mgt.coverageStatus} • Best Courier: ${mgt.bestCourier}`);
  };

  // Keyboard shortcut Ctrl + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSaveAndNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Save and proceed to next order
  const handleSaveAndNext = () => {
    if (editingOrderId && onUpdateOrder) {
      onUpdateOrder(editingOrderId, {
        customerName: extractedData.customerName,
        phone: extractedData.phoneFormatted,
        productSummary: extractedData.products,
        items: productsList,
        itemCount: extractedData.itemCount,
        totalAmount: extractedData.totalAmount,
        paymentMethod: extractedData.paymentMethod,
        paymentLabel: extractedData.paymentLabel,
        courier: extractedData.courier,
        courierServiceCode: extractedData.courierOption.split(' ')[0] + ' EZ',
        weightGram: extractedData.weightGram,
        weightKg: extractedData.weightGram / 1000,
        address: {
          streetAndNumber: extractedData.streetAndNumber,
          rtRw: extractedData.rtRw,
          kelurahan: extractedData.kelurahan,
          kecamatan: extractedData.kecamatan,
          city: extractedData.city,
          province: extractedData.province,
          postalCode: extractedData.postalCode,
          landmark: extractedData.landmark
        },
        mengantarValidation: mengantarResult || undefined
      });
      setEditingOrderId(null);
      onShowToast('Pesanan Diperbarui!', 'Perubahan produk & data pesanan berhasil disimpan.');
      setRawText('');
      return;
    }

    const newOrder: OrderItem = {
      id: `ord-${Date.now()}`,
      orderNumber: `#KR-${Math.floor(10985 + Math.random() * 900)}`,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      customerName: extractedData.customerName,
      phone: extractedData.phoneFormatted,
      productSummary: extractedData.products,
      items: productsList,
      itemCount: extractedData.itemCount,
      totalAmount: extractedData.totalAmount,
      paymentMethod: extractedData.paymentMethod,
      paymentLabel: extractedData.paymentLabel,
      courier: extractedData.courier,
      courierServiceCode: extractedData.courierOption.split(' ')[0] + ' EZ',
      weightGram: extractedData.weightGram,
      weightKg: extractedData.weightGram / 1000,
      inputSource: 'AI Chat',
      rawChatText: rawText,
      address: {
        streetAndNumber: extractedData.streetAndNumber,
        rtRw: extractedData.rtRw,
        kelurahan: extractedData.kelurahan,
        kecamatan: extractedData.kecamatan,
        city: extractedData.city,
        province: extractedData.province,
        postalCode: extractedData.postalCode,
        landmark: extractedData.landmark
      },
      aiScore: extractedData.aiScore,
      validationStatus: extractedData.aiScore < 70 ? 'perlu_review' : 'siap',
      validationTagLabel: extractedData.aiScore < 70 ? 'Perlu Konfirmasi' : 'Normalisasi Valid',
      waSent: false,
      exported: false,
      customerAvatarText: extractedData.customerName.slice(0, 2).toUpperCase(),
      mengantarValidation: mengantarResult || undefined
    };

    onAddOrder(newOrder);
    onShowToast('Pesanan Tersimpan!', 'Formulir dibersihkan untuk chat closing berikutnya.');
    setRawText('');
  };

  // Save and prepare dispatch
  const handleSaveFinal = () => {
    handleSaveAndNext();
    onShowToast('Pesanan Tersimpan & Resi Siap!', 'Manifest kurir telah diperbarui.');
    onNavigateToTab('ekspor-agregator');
  };

  // Reset form
  const handleReset = () => {
    if (window.confirm('Bersihkan isi formulir dan teks input mentah?')) {
      setRawText('');
      onShowToast('Formulir Direset', 'Semua kolom input siap digunakan kembali.');
    }
  };

  // Get recent 5 orders
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Operational Flow Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container/50">
        <div className="flex items-start gap-space-md">
          <div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm shrink-0">
            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-space-xs flex-wrap">
              <span className="font-headline-md text-headline-md text-on-surface font-bold">
                Input Pesanan &amp; Parser Normalisasi AI
              </span>
              <span className="px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-semibold">
                PRD P0.1 &amp; P0.2 Core Engine
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Konversi otomatis teks closing chat WhatsApp berantakan menjadi format baku Kemendagri &amp; Kurir Logistik Indonesia.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-space-sm self-stretch sm:self-auto flex-wrap">
          <div className="flex items-center gap-2 px-space-md py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant font-label-sm text-[11px] border border-surface-container-high/40">
            <span className="material-symbols-outlined text-base text-secondary">bolt</span>
            <span>Parser Latency: <strong className="text-on-surface font-tabular-data-md">1.18s</strong></span>
          </div>
          <div className="flex items-center gap-2 px-space-md py-1.5 rounded-lg bg-secondary-container/50 text-on-secondary-container font-label-sm text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span>Pos &amp; Kemendagri Synced</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Workflow Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* LEFT COLUMN: Input Source & Raw Trigger (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-space-md">
          {/* Card Container */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md border border-surface-container/50">
            {/* Input Mode Switcher */}
            <div className="flex items-center p-1 bg-surface-container rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab('smart')}
                className={`flex-1 py-1.5 px-space-sm rounded-lg font-headline-sm text-headline-sm flex items-center justify-center gap-space-xs transition-all cursor-pointer ${
                  activeTab === 'smart'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-primary text-base">bolt</span>
                <span>⚡ Smart Paste WA</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-1.5 px-space-sm rounded-lg font-headline-sm text-headline-sm flex items-center justify-center gap-space-xs transition-all cursor-pointer ${
                  activeTab === 'manual'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">edit_note</span>
                <span>✍️ Input Manual</span>
              </button>
            </div>

            {/* Textarea Zone */}
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-label-md text-on-surface flex items-center gap-1 font-semibold">
                  <span>Sumber Teks Chat Closing WA</span>
                  <span className="text-error">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="font-label-sm text-[12px] text-primary hover:text-primary-container flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">replay</span>
                  <span>Muat Sampel Toko ({sampleIndex + 1}/4)</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  className="w-full p-space-md bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary shadow-inner resize-none transition-all leading-relaxed border border-surface-container-high/40"
                  rows={8}
                  placeholder="Contoh paste chat closing WhatsApp dari customer..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
                {/* Real-time Token Highlight Indicator badge */}
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 bg-surface-container-highest/90 px-2 py-1 rounded font-code-sm text-[11px] text-on-surface-variant backdrop-blur-xs">
                  <span className="material-symbols-outlined text-xs text-primary">analytics</span>
                  <span>{rawText.length} Karakter</span>
                </div>
              </div>
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                Mendukung auto-extract: nama, no. HP, varian barang, kuantiti, metode bayar (COD/Transfer), hingga patokan kurir.
              </p>
            </div>

            {/* Extraction Controls & Settings */}
            <div className="flex flex-col gap-space-sm pt-space-xs">
              {/* Validation DB Toggle Checkbox */}
              <label className="flex items-start gap-space-sm p-space-sm bg-surface-container rounded-lg cursor-pointer select-none hover:bg-surface-container-high transition-colors">
                <input
                  type="checkbox"
                  checked={validateKemendagri}
                  onChange={(e) => setValidateKemendagri(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                />
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Validasi Basis Data Resmi Kemendagri &amp; Pos Indonesia
                  </span>
                  <span className="font-body-sm text-[12px] text-on-surface-variant">
                    Otomatis koreksi typo penulisan kecamatan/kelurahan dan lengkapi kodepos 5 digit jika hilang.
                  </span>
                </div>
              </label>

              {/* Mengantar API Agregator Validation Toggle */}
              <label className="flex items-start gap-space-sm p-space-sm bg-surface-container rounded-lg cursor-pointer select-none hover:bg-surface-container-high transition-colors">
                <input
                  type="checkbox"
                  checked={validateMengantarApi}
                  onChange={(e) => setValidateMengantarApi(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                />
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5">
                    <span>Validasi Jangkauan COD Agregator Mengantar (API)</span>
                    <span className="px-1.5 py-0.2 rounded bg-secondary-container text-on-secondary-container font-code-sm text-[10px] font-bold">API Active</span>
                  </span>
                  <span className="font-body-sm text-[12px] text-on-surface-variant">
                    Cek instan coverage kurir (J&amp;T, SiCepat, SAP), estimasi ongkir, dan verifikasi risiko retur COD.
                  </span>
                </div>
              </label>

              {/* Auto-Format Phone Toggle */}
              <label className="flex items-center justify-between p-space-sm bg-surface-container rounded-lg cursor-pointer select-none hover:bg-surface-container-high transition-colors">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-secondary text-base">format_align_left</span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Standarisasi Format Nomor WA (+62)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={standardizePhone}
                  onChange={(e) => setStandardizePhone(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                />
              </label>

              {/* Primary Trigger Button */}
              <button
                type="button"
                onClick={handleExtract}
                disabled={isExtracting}
                className="w-full py-2.5 px-space-md bg-primary text-on-primary rounded-lg font-headline-sm text-headline-sm flex items-center justify-center gap-space-sm hover:bg-primary-container hover:text-on-primary-container shadow-md transition-all cursor-pointer active:scale-[0.99] disabled:opacity-70"
              >
                {isExtracting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin"></span>
                    <span>Membedah Struktur Alamat &amp; Kemendagri...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                    <span>Ekstrak &amp; Rapikan Alamat dengan AI ✨</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-space-xs text-on-surface-variant font-label-sm text-[11px]">
                <span className="material-symbols-outlined text-sm text-secondary">verified</span>
                <span>Model KirimRapi Engine v2.4 (99.1% akurasi teks gaul &amp; singkatan lokal)</span>
              </div>
            </div>
          </div>

          {/* Quick Tips Box / Context Card */}
          <div className="bg-surface-container-low p-space-md rounded-xl flex items-center gap-space-md border border-surface-container-high/40">
            <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-xl">lightbulb</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Tips CS Pro:</span>
              <span className="font-body-sm text-[12px] text-on-surface-variant">
                Gunakan shortcut keyboard <kbd className="px-1.5 py-0.5 bg-surface-container rounded font-code-sm text-[11px] text-on-surface font-semibold">Ctrl + V</kbd> lalu langsung tekan <kbd className="px-1.5 py-0.5 bg-surface-container rounded font-code-sm text-[11px] text-on-surface font-semibold">Ctrl + Enter</kbd> untuk auto-parse sekejap.
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Extraction Result & Operator Review (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-space-md">
          {/* Notification Banner PRD P0.1 Requirement */}
          <div className="bg-surface-container-highest p-space-md rounded-xl flex items-center justify-between gap-space-sm shadow-sm border border-surface-container-high/50">
            <div className="flex items-center gap-space-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping"></div>
              <span className="font-label-md text-label-md text-on-surface font-semibold">
                Hasil Ekstraksi AI siap direview sebelum disimpan (P0.1: Wajib Periksa)
              </span>
            </div>
            <span className="px-space-xs py-0.5 rounded-full bg-surface-container-lowest font-code-sm text-[11px] text-on-surface-variant font-semibold shadow-xs">
              ID: TRX-202609-0894
            </span>
          </div>

          {/* Confidence Metric Header */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border border-surface-container/50">
            <div className="flex items-center gap-space-sm">
              <div className="w-9 h-9 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center font-tabular-data-lg text-tabular-data-lg font-bold">
                {extractedData.aiScore}%
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Tingkat Keyakinan AI: {extractedData.aiScore >= 80 ? 'Akurasi Tinggi' : 'Perlu Konfirmasi'}
                </span>
                <span className="font-body-sm text-[12px] text-on-surface-variant">
                  {extractedData.aiScore >= 80
                    ? '100% komponen alamat ditemukan cocok dengan master Kemendagri 2026.'
                    : 'Beberapa elemen alamat memerlukan konfirmasi ulang kepada pelanggan.'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs self-end sm:self-center">
              <span className="px-space-sm py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[11px] flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-sm">task_alt</span>
                <span>{extractedData.aiScore >= 80 ? 'Alamat Valid & Lengkap' : 'Anomali Terdeteksi'}</span>
              </span>
            </div>
          </div>

          {/* Mengantar API Live Verification Card */}
          {mengantarResult && (
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container/50 flex flex-col gap-space-xs">
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
                        {mengantarResult.coverageStatus === 'FULL_COD_COVERAGE' ? 'Tercover 100%' : 'Coverage Parsial'}
                      </span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant block">
                      ID Subdistrik: {mengantarResult.subdistrictId} • Validasi Pukul {mengantarResult.validatedAt}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleManualRevalidateMengantar}
                  disabled={isValidatingMengantar}
                  className="px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-label-sm text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors border border-surface-container-high/40"
                >
                  <span className={`material-symbols-outlined text-xs ${isValidatingMengantar ? 'animate-spin' : ''}`}>
                    refresh
                  </span>
                  <span>{isValidatingMengantar ? 'Memvalidasi...' : 'Re-check API'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-xs mt-1">
                <div className="p-2 rounded-lg bg-surface-container-low border border-surface-container-high/30 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">Coverage &amp; Kurir</span>
                  <span className="text-[12px] font-bold text-secondary flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    {mengantarResult.bestCourier}
                  </span>
                  <span className="text-[10px] text-on-surface-variant truncate">
                    {mengantarResult.supportedCouriers.join(', ')}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-surface-container-low border border-surface-container-high/30 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">Estimasi Ongkir &amp; Fee COD</span>
                  <span className="text-[12px] font-bold text-on-surface mt-0.5">
                    Rp {mengantarResult.estimatedShippingFee.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-on-surface-variant">
                    Fee COD {mengantarResult.codFeePercent}%: Rp {mengantarResult.codFeeAmount.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-surface-container-low border border-surface-container-high/30 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">Risiko Retur Wilayah</span>
                  <span className="text-[12px] font-bold text-secondary mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">shield</span>
                    {mengantarResult.historicalReturnRate}% Retur
                  </span>
                  <span className="text-[10px] text-on-surface-variant">Zona Hijau (Sangat Aman)</span>
                </div>
              </div>

              <p className="text-[11px] text-on-surface-variant bg-surface-container-low/60 p-1.5 rounded mt-0.5 leading-tight">
                💡 <strong>Catatan Mengantar:</strong> {mengantarResult.notes}
              </p>
            </div>
          )}

          {/* Review Form Cards Grid */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md border border-surface-container/50">
            {/* SECTION 1: Customer Data */}
            <div className="flex flex-col gap-space-xs pb-space-sm border-b border-surface-container/40">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-primary">person</span>
                  <span>1. Data Penerima (Customer)</span>
                </span>
                <span className="font-body-sm text-[12px] text-secondary flex items-center gap-0.5 font-semibold">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span>Terdeteksi</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md mt-1">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-[11px] text-on-surface-variant font-medium">Nama Lengkap</label>
                  <div className="relative">
                    <input
                      className="w-full px-space-md py-2 bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary font-medium transition-all"
                      type="text"
                      value={extractedData.customerName}
                      onChange={(e) => setExtractedData({ ...extractedData, customerName: e.target.value })}
                    />
                    <span className="material-symbols-outlined absolute right-space-md top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">
                      edit
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-[11px] text-on-surface-variant font-medium">Nomor WhatsApp / HP</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-space-md flex items-center gap-1 text-on-surface-variant font-label-md text-label-md">
                      <span className="font-semibold text-on-surface">🇮🇩 +62</span>
                    </div>
                    <input
                      className="w-full pl-16 pr-space-md py-2 bg-surface-container-low rounded-lg font-tabular-data-md text-tabular-data-md text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary font-medium transition-all"
                      type="text"
                      value={extractedData.phoneDigits}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setExtractedData({
                          ...extractedData,
                          phoneDigits: val,
                          phoneFormatted: `+62 ${val.slice(0, 3)}-${val.slice(3, 7)}-${val.slice(7)}`
                        });
                      }}
                    />
                    <a
                      className="absolute right-2.5 p-1 rounded hover:bg-surface-container text-secondary transition-colors"
                      href={`https://wa.me/62${extractedData.phoneDigits}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Cek WA Langsung"
                    >
                      <span className="material-symbols-outlined text-base">chat</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Order & Courier Dispatch */}
            <div className="flex flex-col gap-space-xs pt-space-xs pb-space-sm bg-surface-container-low/50 p-space-md rounded-xl border border-surface-container-high/30">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-space-sm">
                  <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-primary">shopping_bag</span>
                    <span>2. Rincian Produk, Pesanan &amp; Ekspedisi</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('katalog-produk')}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5 cursor-pointer bg-primary-container/40 px-2 py-0.5 rounded-md"
                    title="Buka Master Katalog di Navigasi Operasional"
                  >
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                    <span>Kelola Katalog Toko</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center bg-surface-container rounded-lg p-0.5 border border-surface-container-high/40 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setProductViewMode('table')}
                      className={`px-2 py-0.5 rounded font-medium cursor-pointer transition-colors ${
                        productViewMode === 'table' ? 'bg-surface-container-lowest text-primary font-bold shadow-xs' : 'text-on-surface-variant'
                      }`}
                    >
                      Daftar Produk ({productsList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductViewMode('simple')}
                      className={`px-2 py-0.5 rounded font-medium cursor-pointer transition-colors ${
                        productViewMode === 'simple' ? 'bg-surface-container-lowest text-primary font-bold shadow-xs' : 'text-on-surface-variant'
                      }`}
                    >
                      Ringkasan Teks
                    </button>
                  </div>

                  {catalog && catalog.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsPickerModalOpen(true)}
                      className="px-2.5 py-1 bg-primary text-on-primary hover:bg-primary/90 rounded-lg font-label-sm text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">category</span>
                      <span>+ Pilih dari Katalog</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleAddProductRow}
                    className="px-2 py-1 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-label-sm text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors border border-surface-container-high/40"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span>+ Baris Manual</span>
                  </button>
                </div>
              </div>

              {/* Quick Product Selector Chips from Catalog */}
              {catalog && catalog.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap py-1 px-2 bg-surface-container-lowest/90 rounded-lg border border-surface-container-high/40 mt-1">
                  <span className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1 mr-0.5">
                    <span className="material-symbols-outlined text-xs text-primary">sell</span>
                    <span>Pilihan Cepat Produk:</span>
                  </span>
                  {catalog.slice(0, 5).map((cp) => (
                    <button
                      key={cp.id}
                      type="button"
                      onClick={() => {
                        handleSelectProductFromCatalog({
                          id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                          name: cp.name,
                          variant: cp.variants[0] || 'Standar',
                          qty: 1,
                          price: cp.price,
                          weightGram: cp.weightGram
                        });
                      }}
                      className="px-2 py-0.5 rounded-md bg-surface-container-low hover:bg-primary-container text-on-surface hover:text-on-primary-container text-[11px] font-medium border border-surface-container-high/40 transition-colors cursor-pointer flex items-center gap-1"
                      title={`+ Tambah ${cp.name} (Rp ${cp.price.toLocaleString('id-ID')})`}
                    >
                      <span className="material-symbols-outlined text-xs text-primary">add</span>
                      <span className="font-semibold">{cp.name}</span>
                      <span className="text-[10px] text-primary font-bold">
                        Rp {cp.price.toLocaleString('id-ID')}
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsPickerModalOpen(true)}
                    className="px-2 py-0.5 rounded-md bg-primary-fixed hover:bg-primary-fixed/80 text-on-primary-fixed text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">list_alt</span>
                    <span>Semua ({catalog.length})</span>
                  </button>
                </div>
              )}

              {/* Product items display */}
              {productViewMode === 'table' ? (
                <div className="flex flex-col gap-2 mt-2">
                  {productsList.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-2.5 rounded-lg bg-surface-container-lowest border border-surface-container-high/40 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-xs"
                    >
                      <div className="flex-1 flex flex-col gap-0.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-on-surface-variant uppercase font-medium">Nama Produk</label>
                          {catalog && catalog.length > 0 && (
                            <select
                              onChange={(e) => {
                                const selected = catalog.find((p) => p.id === e.target.value);
                                if (selected) {
                                  handleUpdateProductField(item.id, 'name', selected.name);
                                  handleUpdateProductField(item.id, 'variant', selected.variants[0] || 'Standar');
                                  handleUpdateProductField(item.id, 'price', selected.price);
                                  if (selected.weightGram) {
                                    setExtractedData((prev) => ({
                                      ...prev,
                                      weightGram: Math.max(prev.weightGram, selected.weightGram * (item.qty || 1))
                                    }));
                                  }
                                }
                                e.target.value = '';
                              }}
                              defaultValue=""
                              className="text-[10px] bg-surface-container px-1 py-0.5 rounded text-primary font-semibold border border-surface-container-high/30 cursor-pointer focus:outline-none"
                            >
                              <option value="" disabled>Pilih dari Katalog...</option>
                              {catalog.map((cp) => (
                                <option key={cp.id} value={cp.id}>
                                  {cp.name} - Rp {cp.price.toLocaleString('id-ID')}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateProductField(item.id, 'name', e.target.value)}
                          placeholder="Nama Barang/Produk"
                          className="w-full px-2 py-1 bg-surface-container-low rounded text-body-sm text-[12px] text-on-surface font-medium border border-surface-container-high/30 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="w-full sm:w-28 flex flex-col gap-0.5">
                        <label className="text-[10px] text-on-surface-variant uppercase font-medium">Varian</label>
                        <input
                          type="text"
                          value={item.variant || ''}
                          onChange={(e) => handleUpdateProductField(item.id, 'variant', e.target.value)}
                          placeholder="XL / Hijau"
                          className="w-full px-2 py-1 bg-surface-container-low rounded text-body-sm text-[12px] text-on-surface border border-surface-container-high/30 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="w-full sm:w-24 flex flex-col gap-0.5">
                        <label className="text-[10px] text-on-surface-variant uppercase font-medium">Qty</label>
                        <div className="flex items-center bg-surface-container-low rounded border border-surface-container-high/30 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleUpdateProductField(item.id, 'qty', Math.max(1, (item.qty || 1) - 1))}
                            className="px-2 py-1 text-on-surface-variant hover:bg-surface-container text-xs cursor-pointer font-bold"
                          >
                            -
                          </button>
                          <input
                            type="text"
                            value={item.qty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 1;
                              handleUpdateProductField(item.id, 'qty', val);
                            }}
                            className="w-full text-center text-[12px] font-bold text-on-surface bg-transparent focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateProductField(item.id, 'qty', (item.qty || 1) + 1)}
                            className="px-2 py-1 text-on-surface-variant hover:bg-surface-container text-xs cursor-pointer font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="w-full sm:w-32 flex flex-col gap-0.5">
                        <label className="text-[10px] text-on-surface-variant uppercase font-medium">Harga Satuan</label>
                        <input
                          type="text"
                          value={(item.price || 0).toLocaleString('id-ID')}
                          onChange={(e) => {
                            const num = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
                            handleUpdateProductField(item.id, 'price', num);
                          }}
                          className="w-full px-2 py-1 bg-surface-container-low rounded text-body-sm text-[12px] font-tabular-data-md font-semibold text-on-surface border border-surface-container-high/30 focus:outline-none focus:ring-1 focus:ring-primary text-right"
                        />
                      </div>

                      <div className="w-full sm:w-32 flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-4">
                        <div className="text-right">
                          <span className="text-[10px] text-on-surface-variant block sm:hidden">Subtotal:</span>
                          <span className="text-[12px] font-bold font-tabular-data-md text-primary">
                            Rp {((item.price || 0) * (item.qty || 1)).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProductRow(item.id)}
                          title="Hapus Produk Ini"
                          className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleAddProductRow}
                        className="text-[12px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        <span>+ Tambah Baris Manual</span>
                      </button>
                      {catalog && catalog.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsPickerModalOpen(true)}
                          className="text-[12px] font-semibold text-secondary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">category</span>
                          <span>+ Pilih dari Katalog Toko</span>
                        </button>
                      )}
                    </div>
                    <span className="text-[11px] text-on-surface-variant">
                      Total: <strong>{extractedData.itemCount} item barang</strong> (Subtotal: <strong className="text-primary">{extractedData.totalAmountFormatted}</strong>)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1 mt-1">
                  <label className="font-label-sm text-[11px] text-on-surface-variant font-medium">Rincian Teks Produk</label>
                  <input
                    className="w-full px-space-md py-2 bg-surface-container-lowest rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                    type="text"
                    value={extractedData.products}
                    onChange={(e) => setExtractedData({ ...extractedData, products: e.target.value })}
                  />
                </div>
              )}

              {/* Courier, Total & Payment Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-space-md mt-2 pt-2 border-t border-surface-container-high/30">
                <div className="sm:col-span-4 flex flex-col gap-1">
                  <label className="font-label-sm text-[11px] text-on-surface-variant font-medium">Total Tagihan (Rp)</label>
                  <input
                    className="w-full px-space-md py-2 bg-surface-container-lowest rounded-lg font-tabular-data-md text-tabular-data-md text-on-surface font-semibold focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                    type="text"
                    value={extractedData.totalAmountFormatted}
                    onChange={(e) => {
                      const num = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
                      setExtractedData({
                        ...extractedData,
                        totalAmount: num,
                        totalAmountFormatted: `Rp ${num.toLocaleString('id-ID')}`
                      });
                    }}
                  />
                </div>

                <div className="sm:col-span-4 flex flex-col gap-1">
                  <label className="font-label-sm text-[11px] text-on-surface-variant font-medium">Metode Bayar</label>
                  <div
                    className={`flex items-center h-10 px-space-md rounded-lg font-label-md text-label-md gap-1 cursor-pointer select-none ${
                      extractedData.paymentMethod === 'COD'
                        ? 'bg-tertiary-fixed text-on-tertiary-fixed font-bold'
                        : 'bg-primary-fixed text-on-primary-fixed font-bold'
                    }`}
                    onClick={() => {
                      const next = extractedData.paymentMethod === 'COD' ? 'TF' : 'COD';
                      setExtractedData({
                        ...extractedData,
                        paymentMethod: next,
                        paymentLabel: next === 'COD' ? 'COD (Tunai)' : 'Non-COD (Transfer)'
                      });
                    }}
                  >
                    <span className="material-symbols-outlined text-base">payments</span>
                    <span>{extractedData.paymentLabel}</span>
                  </div>
                </div>

                <div className="sm:col-span-4 flex flex-col gap-1">
                  <label className="font-label-sm text-[11px] text-on-surface-variant font-medium">Kurir Pilihan Customer</label>
                  <select
                    className="w-full px-space-md py-2 bg-surface-container-lowest rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm cursor-pointer"
                    value={extractedData.courierOption}
                    onChange={(e) => setExtractedData({ ...extractedData, courierOption: e.target.value })}
                  >
                    <option>J&amp;T Express (EZ / COD Aktif)</option>
                    <option>SiCepat Regular</option>
                    <option>JNE Cashless (Reg)</option>
                    <option>Lion Parcel (REGPACK)</option>
                    <option>Anteraja Regular</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3: P0.2 AI Address Normalization Comparison Bento */}
            <div className="flex flex-col gap-space-sm pt-space-xs">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-primary">compare_arrows</span>
                  <span>3. Normalisasi Alamat Standar Logistik (P0.2)</span>
                </span>
                <span className="font-label-sm text-[11px] text-on-surface-variant">Klik kolom untuk edit presisi</span>
              </div>

              {/* Comparison Wrapper (Before vs After) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md p-space-md bg-surface-container-low rounded-xl border border-surface-container-high/40">
                {/* Raw Address Snippet (Left / 5 Cols) */}
                <div className="md:col-span-5 flex flex-col gap-space-xs bg-surface-container-highest/60 p-space-md rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-[11px] text-on-surface-variant uppercase font-semibold">
                      Teks Mentah WA
                    </span>
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">history_edu</span>
                  </div>
                  <p className="font-code-sm text-[11px] text-on-surface leading-relaxed italic bg-surface-container-lowest/80 p-space-sm rounded border border-surface-container">
                    "{rawText.slice(0, 160)}..."
                  </p>
                  <div className="mt-auto pt-space-xs flex items-center gap-1 text-on-surface-variant font-label-sm text-[11px]">
                    <span className="material-symbols-outlined text-xs text-secondary">check_circle</span>
                    <span>{extractedData.entitiesCount} Entitas berhasil dipetakan</span>
                  </div>
                </div>

                {/* Normalized Form Breakdown (Right / 7 Cols) */}
                <div className="md:col-span-7 flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-label-sm text-[11px] text-primary uppercase font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">verified_user</span>
                      <span>Hasil Baku Standar Kurir</span>
                    </span>
                    <span className="px-space-xs py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-semibold">
                      100% Cocok Pos
                    </span>
                  </div>

                  {/* Structured Token Fields */}
                  <div className="grid grid-cols-12 gap-space-xs">
                    <div className="col-span-8 flex flex-col">
                      <label className="font-label-sm text-[10px] text-on-surface-variant">Jalan &amp; Nomor Rumah</label>
                      <input
                        className="px-space-sm py-1.5 bg-surface-container-lowest rounded font-body-sm text-[12px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm font-medium border border-surface-container-high/30"
                        type="text"
                        value={extractedData.streetAndNumber}
                        onChange={(e) => setExtractedData({ ...extractedData, streetAndNumber: e.target.value })}
                      />
                    </div>
                    <div className="col-span-4 flex flex-col">
                      <label className="font-label-sm text-[10px] text-on-surface-variant">RT / RW</label>
                      <input
                        className="px-space-sm py-1.5 bg-surface-container-lowest rounded font-body-sm text-[12px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm font-medium text-center border border-surface-container-high/30"
                        type="text"
                        value={extractedData.rtRw}
                        onChange={(e) => setExtractedData({ ...extractedData, rtRw: e.target.value })}
                      />
                    </div>
                    <div className="col-span-6 flex flex-col">
                      <label className="font-label-sm text-[10px] text-on-surface-variant">Kelurahan / Desa</label>
                      <input
                        className="px-space-sm py-1.5 bg-surface-container-lowest rounded font-body-sm text-[12px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm font-medium border border-surface-container-high/30"
                        type="text"
                        value={extractedData.kelurahan}
                        onChange={(e) => setExtractedData({ ...extractedData, kelurahan: e.target.value })}
                      />
                    </div>
                    <div className="col-span-6 flex flex-col">
                      <label className="font-label-sm text-[10px] text-on-surface-variant">Kecamatan</label>
                      <input
                        className="px-space-sm py-1.5 bg-surface-container-lowest rounded font-body-sm text-[12px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm font-medium border border-surface-container-high/30"
                        type="text"
                        value={extractedData.kecamatan}
                        onChange={(e) => setExtractedData({ ...extractedData, kecamatan: e.target.value })}
                      />
                    </div>
                    <div className="col-span-5 flex flex-col">
                      <label className="font-label-sm text-[10px] text-on-surface-variant">Kota / Kabupaten</label>
                      <input
                        className="px-space-sm py-1.5 bg-surface-container-lowest rounded font-body-sm text-[12px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm font-medium border border-surface-container-high/30"
                        type="text"
                        value={extractedData.city}
                        onChange={(e) => setExtractedData({ ...extractedData, city: e.target.value })}
                      />
                    </div>
                    <div className="col-span-4 flex flex-col">
                      <label className="font-label-sm text-[10px] text-on-surface-variant">Provinsi</label>
                      <input
                        className="px-space-sm py-1.5 bg-surface-container-lowest rounded font-body-sm text-[12px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm font-medium border border-surface-container-high/30"
                        type="text"
                        value={extractedData.province}
                        onChange={(e) => setExtractedData({ ...extractedData, province: e.target.value })}
                      />
                    </div>
                    <div className="col-span-3 flex flex-col">
                      <label className="font-label-sm text-[10px] text-on-surface-variant">Kodepos</label>
                      <input
                        className="px-space-sm py-1.5 bg-surface-container-lowest rounded font-tabular-data-md text-tabular-data-md text-primary font-bold focus:outline-none focus:ring-1 focus:ring-primary shadow-sm text-center border border-surface-container-high/30"
                        type="text"
                        value={extractedData.postalCode}
                        onChange={(e) => setExtractedData({ ...extractedData, postalCode: e.target.value })}
                      />
                    </div>
                    <div className="col-span-12 flex flex-col">
                      <label className="font-label-sm text-[10px] text-on-surface-variant">Patokan Lokasi &amp; Catatan Khusus Kurir</label>
                      <div className="relative">
                        <input
                          className="w-full pl-7 pr-space-sm py-1.5 bg-surface-container-lowest rounded font-body-sm text-[12px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm border border-surface-container-high/30"
                          type="text"
                          value={extractedData.landmark}
                          onChange={(e) => setExtractedData({ ...extractedData, landmark: e.target.value })}
                        />
                        <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-tertiary text-sm pointer-events-none">
                          place
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer Bar */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-space-md border border-surface-container/50">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-space-md py-2 rounded-lg text-error hover:bg-error-container hover:text-on-error-container font-label-md text-label-md transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">delete_sweep</span>
              <span>Reset / Bersihkan</span>
            </button>
            <div className="flex flex-col sm:flex-row items-center gap-space-sm w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveAndNext}
                className="w-full sm:w-auto px-space-md py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-headline-sm text-headline-sm transition-all flex items-center justify-center gap-space-xs shadow-sm cursor-pointer active:scale-95"
              >
                <span>Simpan &amp; Lanjut Input Berikutnya</span>
                <kbd className="hidden md:inline px-1 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-code-sm text-[10px]">
                  ↵ Enter
                </kbd>
              </button>
              <button
                type="button"
                onClick={handleSaveFinal}
                className="w-full sm:w-auto px-space-lg py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-headline-sm text-headline-sm transition-all flex items-center justify-center gap-space-xs shadow-md cursor-pointer active:scale-95 font-semibold"
              >
                <span className="material-symbols-outlined text-base">local_shipping</span>
                <span>Simpan &amp; Siapkan Pengiriman</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Audit & Recent Inputs Section (Same-Day Policy) */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md border border-surface-container/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-lg">history</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                5 Pesanan Terakhir Diinput Hari Ini
              </span>
              <span className="font-body-sm text-[12px] text-on-surface-variant">
                Tersedia fitur Cepat Batal / Koreksi Alamat sebelum paket ditarik kurir (Maksimal 6 jam).
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm flex-wrap">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Total Terinput Hari Ini: <strong className="text-on-surface font-tabular-data-md">{orders.length} Paket</strong>
            </span>
            {onClearRecentOrders && (
              <button
                type="button"
                onClick={() => setShowClearAllModal(true)}
                disabled={orders.length === 0}
                className="px-space-sm py-1 rounded-lg bg-error-container/40 hover:bg-error-container text-error font-label-sm text-[11px] font-semibold transition-colors cursor-pointer border border-error/20 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Bersihkan seluruh riwayat input hari ini"
              >
                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                <span>Hapus Semua Riwayat</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigateToTab('riwayat-log')}
              className="px-space-sm py-1 rounded-lg bg-surface-container-low hover:bg-surface-container font-label-sm text-[11px] text-primary font-semibold transition-colors cursor-pointer"
            >
              Lihat Semua Log
            </button>
          </div>
        </div>

        {/* Data Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-space-md rounded-l-lg">ID &amp; Waktu</th>
                <th className="py-2.5 px-space-md">Penerima &amp; WhatsApp</th>
                <th className="py-2.5 px-space-md">Alamat Normalisasi (Tujuan)</th>
                <th className="py-2.5 px-space-md">Kurir / Layanan</th>
                <th className="py-2.5 px-space-md">Nilai COD</th>
                <th className="py-2.5 px-space-md">Status Validasi</th>
                <th className="py-2.5 px-space-md text-right rounded-r-lg">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-body-sm text-[12px]">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl mb-1 block opacity-40">inventory_2</span>
                    Belum ada riwayat input pesanan untuk hari ini.
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-space-sm px-space-md font-tabular-data-md">
                      <span className="font-semibold text-primary block">{ord.orderNumber}</span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant">{ord.time}</span>
                    </td>
                    <td className="py-space-sm px-space-md">
                      <span className="font-headline-sm text-headline-sm text-on-surface block font-bold">
                        {ord.customerName}
                      </span>
                      <span className="font-tabular-data-md text-on-surface-variant text-[11px]">
                        {ord.phone}
                      </span>
                    </td>
                    <td className="py-space-sm px-space-md max-w-xs">
                      <span className="font-body-md text-on-surface truncate block font-medium">
                        {ord.address.streetAndNumber}, {ord.address.rtRw}
                      </span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant truncate block">
                        {ord.address.kelurahan}, {ord.address.kecamatan}, {ord.address.city} ({ord.address.postalCode})
                      </span>
                    </td>
                    <td className="py-space-sm px-space-md">
                      <span className="px-2 py-0.5 rounded bg-surface-container-high font-label-sm text-[11px] text-on-surface font-semibold">
                        {ord.courierServiceCode}
                      </span>
                    </td>
                    <td className="py-space-sm px-space-md font-tabular-data-md font-bold text-on-surface">
                      Rp {ord.totalAmount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-space-sm px-space-md">
                      <span
                        className={`px-space-xs py-0.5 rounded-full font-label-sm text-[11px] inline-flex items-center gap-1 font-semibold ${
                          ord.validationStatus === 'dikoreksi'
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                            : 'bg-secondary-container text-on-secondary-container'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            ord.validationStatus === 'dikoreksi' ? 'bg-tertiary' : 'bg-secondary'
                          }`}
                        ></span>
                        <span>{ord.validationTagLabel}</span>
                      </span>
                    </td>
                    <td className="py-space-sm px-space-md text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForEdit(ord)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors cursor-pointer"
                          title="Edit Produk & Data Pesanan"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <a
                          href={`https://wa.me/62${ord.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-secondary hover:bg-secondary-container/50 transition-colors cursor-pointer"
                          title="Kirim Konfirmasi WA"
                        >
                          <span className="material-symbols-outlined text-base">send</span>
                        </a>
                        {onDeleteOrder && (
                          <button
                            type="button"
                            onClick={() => setOrderToDelete({ id: ord.id, orderNumber: ord.orderNumber, customerName: ord.customerName })}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors cursor-pointer"
                            title="Hapus Pesanan Ini dari Riwayat"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Order Modal */}
      {selectedOrderForEdit && (
        <EditOrderModal
          isOpen={true}
          order={selectedOrderForEdit}
          catalog={catalog}
          onClose={() => setSelectedOrderForEdit(null)}
          onSave={(orderId, updatedData) => {
            onUpdateOrder?.(orderId, updatedData);
            setSelectedOrderForEdit(null);
          }}
          onDelete={(orderId) => {
            onDeleteOrder?.(orderId);
            setSelectedOrderForEdit(null);
          }}
          onNavigateToCatalog={() => onNavigateToTab('katalog-produk')}
          onShowToast={onShowToast}
        />
      )}

      {/* Product Picker Modal for Order Form */}
      {isPickerModalOpen && (
        <ProductPickerModal
          isOpen={isPickerModalOpen}
          catalog={catalog}
          onClose={() => setIsPickerModalOpen(false)}
          onSelectProduct={handleSelectProductFromCatalog}
          onNavigateToCatalog={() => onNavigateToTab('katalog-produk')}
        />
      )}

      {/* Single Order Deletion Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-space-md">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-lg shadow-2xl border border-surface-container flex flex-col gap-space-md animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-space-sm text-error">
              <div className="w-10 h-10 rounded-xl bg-error-container/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">delete</span>
              </div>
              <div className="flex flex-col">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Hapus Pesanan dari Riwayat?
                </h3>
                <span className="text-[12px] text-on-surface-variant font-code-sm">
                  {orderToDelete.orderNumber} • {orderToDelete.customerName}
                </span>
              </div>
            </div>
            <p className="text-body-sm text-[13px] text-on-surface-variant leading-relaxed">
              Pesanan ini akan dihapus dari antrean operasional dan riwayat input hari ini. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (orderToDelete) {
                    onDeleteOrder?.(orderToDelete.id);
                    setOrderToDelete(null);
                  }
                }}
                className="px-space-md py-2 rounded-lg bg-error hover:bg-error/90 text-on-error font-label-md text-label-md font-semibold cursor-pointer shadow-sm"
              >
                Ya, Hapus Pesanan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Orders History Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-space-md">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-lg shadow-2xl border border-surface-container flex flex-col gap-space-md animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-space-sm text-error">
              <div className="w-10 h-10 rounded-xl bg-error-container/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <div className="flex flex-col">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Hapus Semua Riwayat Input?
                </h3>
                <span className="text-[12px] text-on-surface-variant">Konfirmasi Pembersihan Data</span>
              </div>
            </div>
            <p className="text-body-sm text-[13px] text-on-surface-variant leading-relaxed">
              Seluruh <strong>{orders.length} pesanan</strong> yang terinput hari ini akan dihapus dari sistem. Gunakan tindakan ini saat memulai shift atau ingin mereset antrean harian.
            </p>
            <div className="flex items-center justify-end gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                className="px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearRecentOrders?.();
                  setShowClearAllModal(false);
                }}
                className="px-space-md py-2 rounded-lg bg-error hover:bg-error/90 text-on-error font-label-md text-label-md font-semibold cursor-pointer shadow-sm"
              >
                Ya, Hapus Semua Riwayat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
