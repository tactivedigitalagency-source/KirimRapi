import React, { useState, useEffect } from 'react';
import { OrderItem, ProductItem, CourierService, PaymentMethod, CatalogProduct } from '../types';
import { ProductPickerModal } from './ProductPickerModal';

interface EditOrderModalProps {
  isOpen: boolean;
  order: OrderItem | null;
  catalog?: CatalogProduct[];
  onClose: () => void;
  onSave: (orderId: string, updatedData: Partial<OrderItem>) => void;
  onDelete?: (orderId: string) => void;
  onNavigateToCatalog?: () => void;
  onShowToast: (title: string, desc: string) => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  order,
  catalog = [],
  onClose,
  onSave,
  onDelete,
  onNavigateToCatalog,
  onShowToast
}) => {
  if (!isOpen || !order) return null;

  // Local state initialized with order details
  const [customerName, setCustomerName] = useState(order.customerName);
  const [phone, setPhone] = useState(order.phone);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(order.paymentMethod);
  const [courier, setCourier] = useState<CourierService>(order.courier);
  const [weightGram, setWeightGram] = useState(order.weightGram);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Address
  const [address, setAddress] = useState({
    streetAndNumber: order.address.streetAndNumber,
    rtRw: order.address.rtRw,
    kelurahan: order.address.kelurahan,
    kecamatan: order.address.kecamatan,
    city: order.address.city,
    province: order.address.province,
    postalCode: order.address.postalCode,
    landmark: order.address.landmark
  });

  // Products
  const [products, setProducts] = useState<ProductItem[]>(() => {
    if (order.items && order.items.length > 0) {
      return JSON.parse(JSON.stringify(order.items));
    }
    // Fallback if order only had productSummary
    return [
      {
        id: `prod-${Date.now()}-1`,
        name: order.productSummary.split(',')[0] || 'Produk Pesanan',
        variant: 'Standar',
        qty: order.itemCount || 1,
        price: Math.round(order.totalAmount / (order.itemCount || 1))
      }
    ];
  });

  // Calculate totals
  const totalAmount = products.reduce((sum, p) => sum + (p.price || 0) * (p.qty || 1), 0);
  const totalItemCount = products.reduce((sum, p) => sum + (p.qty || 1), 0);

  // Add new product item
  const handleAddProduct = () => {
    const newProd: ProductItem = {
      id: `prod-${Date.now()}-${products.length + 1}`,
      name: '',
      variant: '',
      qty: 1,
      price: 50000
    };
    setProducts([...products, newProd]);
  };

  // Update product item
  const handleUpdateProduct = (id: string, field: keyof ProductItem, val: any) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  // Remove product item
  const handleRemoveProduct = (id: string) => {
    if (products.length <= 1) {
      onShowToast('Minimal 1 Produk', 'Pesanan harus memiliki minimal satu item produk.');
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Save changes
  const handleSave = () => {
    if (!customerName.trim()) {
      onShowToast('Nama Kosong', 'Nama customer tidak boleh kosong.');
      return;
    }

    const summary = products
      .filter((p) => p.name.trim())
      .map((p) => `${p.name}${p.variant ? ` (${p.variant})` : ''} x ${p.qty}`)
      .join(', ');

    onSave(order.id, {
      customerName,
      phone,
      paymentMethod,
      paymentLabel: paymentMethod === 'COD' ? 'COD (Tunai)' : 'Non-COD (Transfer)',
      courier,
      weightGram,
      weightKg: weightGram / 1000,
      productSummary: summary || order.productSummary,
      itemCount: totalItemCount,
      totalAmount,
      items: products,
      address
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-space-md overflow-y-auto">
      <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-space-lg shadow-2xl border border-surface-container my-8 flex flex-col gap-space-md animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-space-xs border-b border-surface-container/60">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">edit_note</span>
            </div>
            <div className="flex flex-col">
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Edit Pesanan &amp; Rincian Produk
              </h2>
              <span className="text-[12px] text-on-surface-variant font-code-sm">
                ID: <strong className="text-primary">{order.orderNumber}</strong> • Waktu: {order.time}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Customer Data */}
        <div className="flex flex-col gap-space-xs bg-surface-container-low/40 p-space-md rounded-xl border border-surface-container-high/30">
          <span className="font-label-sm text-[11px] uppercase font-bold text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-primary">person</span>
            Data Penerima
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm mt-1">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-on-surface-variant font-medium">Nama Penerima</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-space-sm py-1.5 bg-surface-container-lowest rounded-lg text-body-sm text-[12px] text-on-surface border border-surface-container-high/40 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-on-surface-variant font-medium">Nomor WhatsApp / HP</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-space-sm py-1.5 bg-surface-container-lowest rounded-lg text-body-sm text-[12px] text-on-surface border border-surface-container-high/40 focus:ring-1 focus:ring-primary focus:outline-none font-code-sm"
              />
            </div>
          </div>
        </div>

        {/* Products Management (Edit & Tambah Produk) */}
        <div className="flex flex-col gap-space-xs bg-surface-container-low/40 p-space-md rounded-xl border border-surface-container-high/30">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-label-sm text-[11px] uppercase font-bold text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">shopping_bag</span>
              Rincian Produk Pesanan ({products.length} Jenis, {totalItemCount} Item)
            </span>
            <div className="flex items-center gap-2">
              {catalog && catalog.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="px-2.5 py-1 bg-primary-container text-on-primary-container hover:bg-primary-container/80 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm">category</span>
                  <span>+ Pilih dari Katalog</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleAddProduct}
                className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors border border-surface-container-high/40"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>+ Baris Manual</span>
              </button>
            </div>
          </div>

          {/* Product Items Table */}
          <div className="flex flex-col gap-2 mt-2">
            {products.map((prod, idx) => (
              <div
                key={prod.id || idx}
                className="p-2.5 rounded-lg bg-surface-container-lowest border border-surface-container-high/40 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-xs"
              >
                {/* Product Name */}
                <div className="flex-1 flex flex-col gap-0.5">
                  <label className="text-[10px] text-on-surface-variant uppercase font-medium">Nama Produk</label>
                  <input
                    type="text"
                    value={prod.name}
                    onChange={(e) => handleUpdateProduct(prod.id, 'name', e.target.value)}
                    placeholder="Contoh: Gamis Mutiara Lilac"
                    className="w-full px-2 py-1 bg-surface-container-low rounded text-body-sm text-[12px] text-on-surface font-medium border border-surface-container-high/30 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Variant */}
                <div className="w-full sm:w-28 flex flex-col gap-0.5">
                  <label className="text-[10px] text-on-surface-variant uppercase font-medium">Varian / Size</label>
                  <input
                    type="text"
                    value={prod.variant || ''}
                    onChange={(e) => handleUpdateProduct(prod.id, 'variant', e.target.value)}
                    placeholder="XL / Navy"
                    className="w-full px-2 py-1 bg-surface-container-low rounded text-body-sm text-[12px] text-on-surface border border-surface-container-high/30 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Qty with +/- */}
                <div className="w-full sm:w-24 flex flex-col gap-0.5">
                  <label className="text-[10px] text-on-surface-variant uppercase font-medium">Jumlah (Qty)</label>
                  <div className="flex items-center bg-surface-container-low rounded border border-surface-container-high/30 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleUpdateProduct(prod.id, 'qty', Math.max(1, (prod.qty || 1) - 1))}
                      className="px-2 py-1 text-on-surface-variant hover:bg-surface-container text-xs cursor-pointer font-bold"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      value={prod.qty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 1;
                        handleUpdateProduct(prod.id, 'qty', val);
                      }}
                      className="w-full text-center text-[12px] font-bold text-on-surface bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateProduct(prod.id, 'qty', (prod.qty || 1) + 1)}
                      className="px-2 py-1 text-on-surface-variant hover:bg-surface-container text-xs cursor-pointer font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Unit Price */}
                <div className="w-full sm:w-32 flex flex-col gap-0.5">
                  <label className="text-[10px] text-on-surface-variant uppercase font-medium">Harga Satuan (Rp)</label>
                  <input
                    type="text"
                    value={(prod.price || 0).toLocaleString('id-ID')}
                    onChange={(e) => {
                      const num = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
                      handleUpdateProduct(prod.id, 'price', num);
                    }}
                    className="w-full px-2 py-1 bg-surface-container-low rounded text-body-sm text-[12px] font-tabular-data-md font-semibold text-on-surface border border-surface-container-high/30 focus:outline-none focus:ring-1 focus:ring-primary text-right"
                  />
                </div>

                {/* Subtotal & Delete */}
                <div className="w-full sm:w-32 flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-4">
                  <div className="text-right">
                    <span className="text-[10px] text-on-surface-variant block sm:hidden">Subtotal:</span>
                    <span className="text-[12px] font-bold font-tabular-data-md text-primary">
                      Rp {((prod.price || 0) * (prod.qty || 1)).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(prod.id)}
                    title="Hapus Produk Ini"
                    className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Subtotal Summary Footer */}
          <div className="flex items-center justify-between bg-surface-container p-2.5 rounded-lg mt-1 font-semibold text-[13px]">
            <span className="text-on-surface">Total Nilai Tagihan ({paymentMethod}):</span>
            <span className="font-tabular-data-md text-primary text-base font-bold">
              Rp {totalAmount.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Courier & Payment Config */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm bg-surface-container-low/40 p-space-md rounded-xl border border-surface-container-high/30">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-on-surface-variant font-medium">Metode Pembayaran</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="px-2 py-1.5 bg-surface-container-lowest rounded-lg text-body-sm text-[12px] text-on-surface border border-surface-container-high/40 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="COD">COD (Bayar Tunai)</option>
              <option value="TF">Non-COD (Transfer Bank)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-on-surface-variant font-medium">Kurir Pengiriman</label>
            <select
              value={courier}
              onChange={(e) => setCourier(e.target.value as CourierService)}
              className="px-2 py-1.5 bg-surface-container-lowest rounded-lg text-body-sm text-[12px] text-on-surface border border-surface-container-high/40 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="J&T Express">J&amp;T Express</option>
              <option value="SiCepat">SiCepat</option>
              <option value="JNE Express">JNE Express</option>
              <option value="Lion Parcel">Lion Parcel</option>
              <option value="Anteraja">Anteraja</option>
              <option value="Ninja Van">Ninja Van</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-on-surface-variant font-medium">Estimasi Berat (Gram)</label>
            <input
              type="text"
              value={weightGram.toLocaleString('id-ID')}
              onChange={(e) => {
                const w = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 500;
                setWeightGram(w);
              }}
              className="px-2 py-1.5 bg-surface-container-lowest rounded-lg text-body-sm text-[12px] text-on-surface border border-surface-container-high/40 focus:outline-none focus:ring-1 focus:ring-primary font-tabular-data-md"
            />
          </div>
        </div>

        {/* Address Normalization Breakdown */}
        <div className="flex flex-col gap-space-xs bg-surface-container-low/40 p-space-md rounded-xl border border-surface-container-high/30">
          <span className="font-label-sm text-[11px] uppercase font-bold text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-primary">pin_drop</span>
            Komponen Alamat Tujuan
          </span>
          <div className="grid grid-cols-12 gap-2 mt-1">
            <div className="col-span-8 flex flex-col gap-0.5">
              <label className="text-[10px] text-on-surface-variant">Jalan &amp; No Rumah</label>
              <input
                type="text"
                value={address.streetAndNumber}
                onChange={(e) => setAddress({ ...address, streetAndNumber: e.target.value })}
                className="px-2 py-1 bg-surface-container-lowest rounded text-[12px] text-on-surface border border-surface-container-high/30"
              />
            </div>
            <div className="col-span-4 flex flex-col gap-0.5">
              <label className="text-[10px] text-on-surface-variant">RT / RW</label>
              <input
                type="text"
                value={address.rtRw}
                onChange={(e) => setAddress({ ...address, rtRw: e.target.value })}
                className="px-2 py-1 bg-surface-container-lowest rounded text-[12px] text-on-surface border border-surface-container-high/30 text-center"
              />
            </div>
            <div className="col-span-6 flex flex-col gap-0.5">
              <label className="text-[10px] text-on-surface-variant">Kelurahan / Desa</label>
              <input
                type="text"
                value={address.kelurahan}
                onChange={(e) => setAddress({ ...address, kelurahan: e.target.value })}
                className="px-2 py-1 bg-surface-container-lowest rounded text-[12px] text-on-surface border border-surface-container-high/30"
              />
            </div>
            <div className="col-span-6 flex flex-col gap-0.5">
              <label className="text-[10px] text-on-surface-variant">Kecamatan</label>
              <input
                type="text"
                value={address.kecamatan}
                onChange={(e) => setAddress({ ...address, kecamatan: e.target.value })}
                className="px-2 py-1 bg-surface-container-lowest rounded text-[12px] text-on-surface border border-surface-container-high/30"
              />
            </div>
            <div className="col-span-6 flex flex-col gap-0.5">
              <label className="text-[10px] text-on-surface-variant">Kota / Kabupaten</label>
              <input
                type="text"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="px-2 py-1 bg-surface-container-lowest rounded text-[12px] text-on-surface border border-surface-container-high/30"
              />
            </div>
            <div className="col-span-3 flex flex-col gap-0.5">
              <label className="text-[10px] text-on-surface-variant">Provinsi</label>
              <input
                type="text"
                value={address.province}
                onChange={(e) => setAddress({ ...address, province: e.target.value })}
                className="px-2 py-1 bg-surface-container-lowest rounded text-[12px] text-on-surface border border-surface-container-high/30"
              />
            </div>
            <div className="col-span-3 flex flex-col gap-0.5">
              <label className="text-[10px] text-on-surface-variant">Kode Pos</label>
              <input
                type="text"
                value={address.postalCode}
                onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                className="px-2 py-1 bg-surface-container-lowest rounded text-[12px] text-on-surface border border-surface-container-high/30 font-bold text-center"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-space-xs border-t border-surface-container/60">
          {onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Apakah Anda yakin ingin menghapus pesanan ${order.orderNumber}?`)) {
                  onDelete(order.id);
                  onClose();
                }
              }}
              className="px-space-md py-2 rounded-lg bg-error-container/40 text-error hover:bg-error-container text-[12px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-base">delete</span>
              <span>Hapus Pesanan Ini</span>
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-space-sm">
            <button
              type="button"
              onClick={onClose}
              className="px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[12px] font-medium cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-space-lg py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-[12px] font-bold cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">check</span>
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Product Picker Modal */}
      {isPickerOpen && (
        <ProductPickerModal
          isOpen={isPickerOpen}
          catalog={catalog}
          onClose={() => setIsPickerOpen(false)}
          onSelectProduct={(item) => {
            setProducts((prev) => [...prev, item]);
            if (item.weightGram) {
              setWeightGram((prev) => Math.max(prev, (item.weightGram || 0) * (item.qty || 1)));
            }
            setIsPickerOpen(false);
            onShowToast('Produk Ditambahkan', `"${item.name}" (${item.variant}) ditambahkan ke pesanan.`);
          }}
          onNavigateToCatalog={onNavigateToCatalog ? () => {
            setIsPickerOpen(false);
            onClose();
            onNavigateToCatalog();
          } : undefined}
        />
      )}
    </div>
  );
};
